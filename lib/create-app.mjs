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
        { name: "appName", description: "name for the new application", type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: _argv });
    if (mainOptions.appName) {
      write(`\t${chalk.grey(`Creating `) + chalk.magenta(mainOptions.appName)}\n\n\t--------------------------\n\n`);
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
            description: "the local directory name for this app, defaults to the last portion of the appName"
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
          header: "engage app <appName> -d <directoryName>",
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
                "engage app <appName> -d <directoryName>"
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
    if (!mainOptions.appName) {
      error(`No <appName> provided to \`create-app <appName> -d <directory>\``);
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
      const parts = config.appName.split("/");
      config.directory = parts[parts.length - 1];
  }

    const { org, name } = await validateGithubUrl(config);
    config.githubOrg = org;
    config.githubName = name;

    write(chalk.grey(`
    \tConfiguration:
    \t◉ Project:\t\t${chalk.yellow(pkg.name)}
    \t◉ Application Name:\t${chalk.yellow(config.appName)}
    \t◉ Directory:\t\t${chalk.yellow(config.directory)}
    \t◉ Github Url:\t\t${chalk.yellow(config.githubUrl)}
    \t◉ Github Organization:\t${chalk.yellow(config.githubOrg)}
    \t◉ Github Project Name:\t${chalk.yellow(config.githubName)}
    \t◉ Verbose:\t\t${chalk.yellow(config.verbose ? "true" : "false")}
    \t◉ Debug:\t\t${chalk.yellow(config.debug ? "true" : "false")}
    `));

    // check apps folder
    const appsDirectory = path.join(process.cwd(), "apps");
    try {
      const stat = fs.statSync(appsDirectory);
      if (!stat.isDirectory()) {
        error(`Cannot create application in <${pkg.name}>/apps/${config.directory} as the apps folder is in use but is not a directory.`)
      }
    } catch {
      warn(`No 'apps' directory was present, creating one. Are you sure this project is configured correctly for this command?`);
      fs.mkdirSync(appsDirectory);
    }

    // check create directory
    const newDirectory = path.join(process.cwd(), "apps", config.directory);
    try {
        const stat = fs.statSync(newDirectory);
        error(`Cannot create new application directory ${config.directory} as ${stat.isDirectory() ? 'that directory' : 'a file by that name'} already exists!`);
    } catch {}

    // move project files & create directory
    await execa(
        `cp -rv ${path.join(__dirname, "../scaffolds/app/files")} ${newDirectory}`,
        { shell: true, preferLocal: true }
      );
    write(chalk.grey(`\t✅ Copied Application Template Files into <${pkg.name}>/apps/${config.directory}`));

    // update variables within project files
    const files = [
      "package.json",
      "README.md",
      "app/index.html",
      "app/app.ts",
      "app/router.ts",
      "config/environment.js",
      "tests/index.html",
      "tests/test-helper.js",
    ];
    files.forEach(fileName => {
      configureFile(path.join(newDirectory, fileName), config);
      write(chalk.grey(`\t✅ Configured ${fileName}`));
    });

    // update commands in main package.json
    pkg.scripts[`start:${config.directory}`] = `cd apps/${config.directory} && yarn start`;
    fs.writeFileSync("./package.json", JSON.stringify(pkg, null, 2), { encoding: "utf-8" });
    write(chalk.grey(`\t✅ Configured commands in root package.json`));


    // write tsconfig-root paths to include types resolutions
    const tsConfig = JSON.parse(fs.readFileSync("./tsconfig-root.json", { encoding: "utf-8" }));
    tsConfig.compilerOptions.paths[`${config.appName}/*`] = [`apps/${config.directory}/app/*`];
    tsConfig.compilerOptions.paths[`${config.appName}/tests/*`] = [`apps/${config.directory}/tests/*`];
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
      `cd ${newDirectory} && git add -A && git commit -m "Scaffold New Application"`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Committed new application files, ⚠️  these files have not been pushed to the remote`));

    // update github labels
    await labelSync({
      accessToken: process.env.GITHUB_AUTH,
      repo: `${config.githubOrg}/${config.githubName}`,
      allowAddedLabels: true,
      labels: [{
        name: config.appName,
        color: "96ded1",
        description: `PRs Related to the Application ${config.appName}`
      }]
    });
    write(chalk.grey(`\t✅ Updated the Github Project Labels to include a label for this application`));
}
