#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { configureFile, guardImports, sanitizeGitUrl, validateGithubUrl, write, error, warn } from "./utils/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function main(_argv) {
    const { labelSync, execa, chalk, cliargs, cliusage } = await guardImports();

    const mainDefinitions = [
        { name: "addonName", description: "name for the new addon", type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: _argv });
    if (mainOptions.addonName) {
      write(`\t${chalk.grey(`Creating `) + chalk.magenta(mainOptions.addonName)}\n\n\t--------------------------\n\n`);
    }
    const argv = mainOptions._unknown || [];
    const optionsDefinitions = [
        {
          name: "help",
          alias: "h",
          type: Boolean,
          description: "Display this usage guide.",
          defaultValue: false,
        },
        {
            name: "directory",
            alias: "d",
            type: String,
            description: "the local directory name for this app, defaults to the last portion of the addonName"
        },
        {
          name: "private",
          alias: "p",
          type: Boolean,
          description: "Whether this package should be private or public",
          defaultValue: false,
        },
        {
          name: "debug",
          type: Boolean,
          description: "Whether to show additional debugging output.",
          defaultValue: false,
        },
        {
          name: "verbose",
          alias: "v",
          type: Boolean,
          description: "Whether to show additional verbose output.",
          defaultValue: false,
        },
    ];
    const MAN_DETAILS = [
        {
          header: "engage addon <addonName> -d <directoryName>",
          content: "Create a new ember application within the current project",
        },
        {
          header: "Options",
          optionList: [...mainDefinitions, ...optionsDefinitions],
        },
        {
          header: "Examples",
          content: [
            {
              desc: "1. Basic Usage",
              example: `${chalk.grey("```")}\r\n${chalk.yellow(
                "engage addon <addonName> -d <directoryName>"
              )}\r\n${chalk.grey("```")}`,
            },
          ],
        },
      ];
    const usage = cliusage(MAN_DETAILS);
    const options = cliargs(optionsDefinitions, { argv });

    if (options.help) {
        write(usage);
        return;
    }
    if (!mainOptions.addonName) {
      error(`No <addonName> provided to \`engage addon <addonName> -d <directory>\``);
    }

    const config = Object.assign({}, mainOptions, options);
    let pkg;

    try {
      pkg = JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" }));
    } catch {
      error("No valid package.json found in the current directory. Try running this command within a project");
    }
    const githubUrl = typeof pkg.repository === "string" ? pkg.repository : typeof pkg.repository === "object" ? pkg.repository.url : null;

    if (!githubUrl) {
      error(`No Github Url Found in package.json`);
    }
    config.githubUrl = sanitizeGitUrl(githubUrl);

    if (!config.directory) {
      const parts = config.addonName.split("/");
      config.directory = parts[parts.length - 1];
  }

    const { org, name } = await validateGithubUrl(config);
    config.githubOrg = org;
    config.githubName = name;
    config.license = config.private ? "ALL RIGHTS RESERVED" : "MIT";

    write(chalk.grey(`
    \tConfiguration:
    \t◉ Project:\t\t${chalk.yellow(pkg.name)}
    \t◉ Addon Name:\t${chalk.yellow(config.addonName)}
    \t◉ Directory:\t\t${chalk.yellow(config.directory)}
    \t◉ Github Url:\t\t${chalk.yellow(config.githubUrl)}
    \t◉ Github Organization:\t${chalk.yellow(config.githubOrg)}
    \t◉ Github Project Name:\t${chalk.yellow(config.githubName)}
    \t◉ Private:\t\t${chalk.yellow(config.private ? "true" : "false")}
    \t◉ License:\t\t${chalk.yellow(config.license)}
    \t◉ Verbose:\t\t${chalk.yellow(config.verbose ? "true" : "false")}
    \t◉ Debug:\t\t${chalk.yellow(config.debug ? "true" : "false")}
    `));

    // check apps folder
    const addonsDirectory = path.join(process.cwd(), "addons");
    try {
      const stat = fs.statSync(addonsDirectory);
      if (!stat.isDirectory()) {
        error(`Cannot create application in <${pkg.name}>/addons/${config.directory} as the addons folder is in use but is not a directory.`)
      }
    } catch {
      warn(`No 'addons' directory was present, creating one. Are you sure this project is configured correctly for this command?`);
      fs.mkdirSync(addonsDirectory);
    }

    // check create directory
    const newDirectory = path.join(process.cwd(), "addons", config.directory);
    try {
        const stat = fs.statSync(newDirectory);
        error(`Cannot create new addon directory ${config.directory} as ${stat.isDirectory() ? 'that directory' : 'a file by that name'} already exists!`);
    } catch {}

    // move project files & create directory
    await execa(
        `cp -rv ${path.join(__dirname, "../scaffolds/addon/files")} ${newDirectory}`,
        { shell: true, preferLocal: true }
      );
    if (config.private) {
      await execa(
        `rm -rf ${path.join(newDirectory, "LICENSE.md")}`,
        { shell: true, preferLocal: true }
      );
    }
    write(chalk.grey(`\t✅ Copied Addon Template Files into <${pkg.name}>/addons/${config.directory}`));

    // update variables within project files
    const files = [
      "package.json",
      "README.md",
    ];
    files.forEach(fileName => {
      configureFile(path.join(newDirectory, fileName), config);
      write(chalk.grey(`\t✅ Configured ${fileName}`));
    });
    // write tsconfig-root paths to include types resolutions
    const tsConfig = JSON.parse(fs.readFileSync("./tsconfig-root.json", { encoding: "utf-8" }));
    tsConfig.compilerOptions.paths[`${config.addonName}/*`] = [`addons/${config.directory}/src/*`];
    fs.writeFileSync("./tsconfig-root.json", JSON.stringify(tsConfig, null, 2), { encoding: "utf-8" });
    write(chalk.grey(`\t✅ Configured types resolutions in root tsconfig-root.json`));


    // run yarn
    await execa(
        `cd ${newDirectory} && yarn install`,
        { shell: true, preferLocal: true }
      );
    write(chalk.grey(`\t✅ Ran \`yarn install\` and updated lockfile`));

    // commit project files and push to github
    await execa(
      `cd ${newDirectory} && git add -A && git commit -m "Scaffold New Addon"`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Committed new addon files, ⚠️  these files have not been pushed to the remote`));

    // update github labels
    await labelSync({
      accessToken: process.env.GITHUB_AUTH,
      repo: `${config.githubOrg}/${config.githubName}`,
      allowAddedLabels: true,
      labels: [{
        name: `${config.addonName}`,
        color: "96ded1",
        description: `PRs Related to the Addon ${config.addonName}`
      }]
    });
    write(chalk.grey(`\t✅ Updated the Github Project Labels to include a label for this addon`));
}
