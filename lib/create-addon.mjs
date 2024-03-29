#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { configureFile, guardImports, sanitizeGitUrl, validateGithubUrl, write, error, warn,  getGitConfig } from "./utils/index.mjs";
import { createApp } from "./create-app.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function main(_argv, cmdConfig) {
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
          name: "addonDirectory",
          alias: "a",
          type: String,
          defaultValue: "addons",
          description: "the directory for addons within the project",
        },
        {
            name: "directory",
            alias: "d",
            type: String,
            description: "the local directory name for this app, defaults to the last portion of the addonName"
        },
        {
          name: "skipLabels",
          type: Boolean,
          description: "Whether to update the github project's labels",
          defaultValue: false,
        },
        {
          name: "offline",
          type: Boolean,
          description: "Whether to skip remote operations",
          defaultValue: false,
        },
        {
          name: "skipRootConfig",
          type: Boolean,
          description: "Whether to update the main projects config files to include this addon",
          defaultValue: false,
        },
        {
          name: "private",
          alias: "p",
          type: Boolean,
          description: "Whether this package should be private or public",
          defaultValue: false,
        },
        {
          name: "createTestApp",
          alias: "t",
          type: Boolean,
          description: "Whether to also create a unique test app for this addon",
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
          content: "Create a new V2 Ember Addon within the current project",
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
    options.command = cmdConfig.command;

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
    const gitConfig = await getGitConfig();
    config.githubUser = gitConfig.get("user.name");
    config.githubEmail = gitConfig.get("user.email");
    config.githubUsername = gitConfig.get("github.user");

    write(chalk.grey(`
    \tConfiguration:
    \t◉ Project:\t\t${chalk.yellow(pkg.name)}
    \t◉ Addon Name:\t\t${chalk.yellow(config.addonName)}
    \t◉ Addon Directory:\t${chalk.yellow(config.addonDirectory)}
    \t◉ Directory:\t\t${chalk.yellow(config.directory)}
    \t◉ Github Url:\t\t${chalk.yellow(config.githubUrl)}
    \t◉ Github Organization:\t${chalk.yellow(config.githubOrg)}
    \t◉ Github Project Name:\t${chalk.yellow(config.githubName)}
    \t◉ Offline Mode:\t\t${chalk.yellow(config.offline  ? "true" : "false")}
    \t◉ Skip Labels:\t\t${chalk.yellow(config.offline || config.skipLabels  ? "true" : "false")}
    \t◉ Skip Root Config:\t${chalk.yellow(config.skipRootConfig  ? "true" : "false")}
    \t◉ Create Test App:\t${chalk.yellow(config.createTestApp ? "true" : "false")}
    \t◉ Private:\t\t${chalk.yellow(config.private ? "true" : "false")}
    \t◉ License:\t\t${chalk.yellow(config.license)}
    \t◉ Verbose:\t\t${chalk.yellow(config.verbose ? "true" : "false")}
    \t◉ Debug:\t\t${chalk.yellow(config.debug ? "true" : "false")}
    `));

    // check packages folder
    const addonsDirectory = path.join(process.cwd(), config.addonDirectory);
    try {
      const stat = fs.statSync(addonsDirectory);
      if (!stat.isDirectory()) {
        error(`Cannot create application in <${pkg.name}>/${config.addonDirectory}/${config.directory} as the addons folder is in use but is not a directory.`)
      }
    } catch {
      warn(`No '${config.addonDirectory}' directory was present, creating one. Are you sure this project is configured correctly for this command?`);
      fs.mkdirSync(addonsDirectory);
    }

    // check create directory
    const newDirectory = path.join(process.cwd(), config.addonDirectory, config.directory);
    try {
        const stat = fs.statSync(newDirectory);
        error(`Cannot create new directory ${config.directory} for the addon as ${stat.isDirectory() ? 'that directory' : 'a file by that name'} already exists!`);
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
    write(chalk.grey(`\t✅ Copied Addon Template Files into <${pkg.name}>/${config.addonDirectory}/${config.directory}`));

    // update variables within project files
    const files = [
      "package.json",
      "README.md",
    ];
    files.forEach(fileName => {
      configureFile(path.join(newDirectory, fileName), config);
      write(chalk.grey(`\t✅ Configured ${fileName}`));
    });

    if (!config.skipRootConfig) {
      // write tsconfig-root paths to include types resolutions
      const tsConfig = JSON.parse(fs.readFileSync("./tsconfig-root.json", { encoding: "utf-8" }));
      tsConfig.compilerOptions.paths[`${config.addonName}/*`] = [`${config.addonDirectory}/${config.directory}/src/*`];
      fs.writeFileSync("./tsconfig-root.json", JSON.stringify(tsConfig, null, 2), { encoding: "utf-8" });
      write(chalk.grey(`\t✅ Configured types resolutions in root tsconfig-root.json`));
    }


    // run pnpm
    if (config.offline) {
      try {
        await execa(
          `cd ${newDirectory} && pnpm install --offline`,
          { shell: true, preferLocal: true }
        );
        write(chalk.grey(`\t✅ Ran \`pnpm install --offline\` and updated lockfile`));
      } catch (e) {
        write(chalk.grey(`\t⚠️ \`pnpm install --offline\` failed. Run install again when network is available.`));
      }
    } else {
      await execa(
          `cd ${newDirectory} && pnpm install`,
          { shell: true, preferLocal: true }
        );
      write(chalk.grey(`\t✅ Ran \`pnpm install\` and updated lockfile`));
    }


    // commit project files and push to github
    await execa(
      `cd ${newDirectory} && git add -A && git commit -n -m "Scaffold New Addon"`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Committed new addon files, ⚠️  these files have not been pushed to the remote`));

    if (!config.offline && !config.skipLabels) {
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
    } else {
      write(chalk.grey(`\t🙈 Skipped Updating the Github Project Labels to include a label for this addon`));
    }

    write(chalk.grey(`\n\tAddon Prepared in ${chalk.yellow(`<project-root>/${config.addonDirectory}/${config.directory}`)}`));

    if (config.createTestApp) {
      write(chalk.cyan(`\n\n\t🚀 Engaging Test App...\n`));
      await createApp(pkg, Object.assign({}, config, {
        isTestApp: true,
        appName: `${config.addonName}-tests`,
        directory: `${config.directory}-test-app`,
      }));
    }
}
