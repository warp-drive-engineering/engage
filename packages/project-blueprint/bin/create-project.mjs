#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let modules;
function parseBooleanValue(v) {
    if (typeof v === "string") {
        if (v === "false" || v === "0") {
        return false;
        }
        return true;
    }
    return Boolean(v);
}

function write(str) {
    console.log(str);
}

async function guardImports() {
    try {
      const { execa } = await import("execa");
      const chalk = await import("chalk");
      const cliusage = await import("command-line-usage");
      const cliargs = await import("command-line-args");
  
      const imports = { execa, chalk, cliargs, cliusage };
  
      // some modules may not be esm yet so when importing dynamically we have to normalize
      // even though importing statically we would not have to.
      Object.keys(imports).forEach((key) => {
        if (imports[key].default) {
          imports[key] = imports[key].default;
        }
      });
  
      modules = imports;
      return imports;
    } catch {
      write(
        `\r\n\r\n\t!!! This script requires the dependencies specified in this project's root package.json file to be installed. !!!\r\n\r\n\tRun \`yarn install\` then attempt this script again.`
      );
      process.exit(1);
    }
}

function error(msg) {
    const { chalk } = modules;
    write(chalk.red(`\n\tError: ${msg}\n\n`));
    process.exit();
}

async function validateGithubUrl(config) {
    const { chalk } = modules;
    const url = config.githubUrl;
    const errorMsg = `create-project requires a githubUrl of the form "${chalk.grey(`git@github.com:<account>/${config.projectName}.git`)}" to be specified for the new project.`;
    
    if (!url || !url.startsWith("git@github.com:") || !url.endsWith(".git")) {
      return error(errorMsg);
    }

    const orgAndName = url.slice(15, -4);
    const [org, name] = orgAndName.split('/');

    if (!org || !name) {
        return error(errorMsg);
    }

    return { org, name };
}

async function configureFile(fileName, config) {
  let fileStr = fs.readFileSync(fileName, { encoding: 'utf-8' });
  Object.keys(config).forEach((key) => {
    const keystr = `<<<<${key}>>>>`;
    fileStr = fileStr.replaceAll(keystr, config[key]);
  });
  fs.writeFileSync(fileName, fileStr, { encoding: 'utf-8' });
}

async function main() {
    const { execa, chalk, cliargs, cliusage } = await guardImports();

    const mainDefinitions = [
        { name: "projectName", description: "name for the new project", type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: process.argv });
    write(`\n\t${chalk.yellow("@warp-drive/create-project")}\n\n\t##########################\n\n\t${chalk.grey(`Creating `) + chalk.magenta(mainOptions.projectName)}\n\n\t--------------------------\n\n`)
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
            name: "githubUrl",
            alias: "g",
            type: String,
            description: "github url for the project we are going to initialize. This should be an empty repository."
        },
        {
            name: "directory",
            alias: "d",
            type: String,
            description: "the local directory name for this project, defaults to the project-name"
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
          header: "create-project <project-name> -g <github-url>",
          content: "Create a new project from github using yarn workspaces, lerna, release-it, typescript etc.",
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
                "create-project <project-name> -g <github-url>"
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

    const config = Object.assign({}, mainOptions, options);

    const { org, name } = await validateGithubUrl(config);
    config.githubOrg = org;
    config.githubName = name;

    if (!config.directory) {
        config.directory = config.githubName;
    }

    write(chalk.grey(`
    \tConfiguration:
    \t◉ Project Name:\t\t${chalk.yellow(config.projectName)}
    \t◉ Directory:\t\t${chalk.yellow(config.directory)}
    \t◉ Github Url:\t\t${chalk.yellow(config.githubUrl)}
    \t◉ Github Organization:\t${chalk.yellow(config.githubOrg)}
    \t◉ Github Project Name:\t${chalk.yellow(config.githubName)}
    \t◉ Verbose:\t\t${chalk.yellow(config.verbose ? "true" : "false")}
    \t◉ Debug:\t\t${chalk.yellow(config.debug ? "true" : "false")}
    `));

    // check create directory
    const newDirectory = path.join(process.cwd(), config.directory);
    try {
        const stat = fs.statSync(newDirectory);
        error(`Cannot create new project directory ${config.directory} as ${stat.isDirectory() ? 'that directory' : 'a file by that name'} already exists!`);
    } catch {}

    // move project files & create directory
    await execa(
        `cp -rv ${path.join(__dirname, "../files")} ${newDirectory}`,
        { shell: true, preferLocal: true }
      );
    write(chalk.grey(`\t✅ Copied Project Template Files into ${config.directory}`));

    // init git
    await execa(
      `cd ${newDirectory} && git init -b main && git remote add origin ${config.githubUrl}`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Initialized git and configured remote 'origin' to ${config.githubUrl}`));

    // update variables within project files
    // update package.json
    //  - name
    //  - repository
    //  - homepage
    //  - bugs
    configureFile(path.join(newDirectory, "package.json"), config);
    write(chalk.grey(`\t✅ Configured package.json`));

    // update README.md
    configureFile(path.join(newDirectory, "README.md"), config);
    write(chalk.grey(`\t✅ Configured README.md`));
    // update gitignore name
    execa(`mv ${newDirectory}/gitignore ${newDirectory}/.gitignore`, { shell: true, preferLocal: true });
    write(chalk.grey(`\t✅ Configured .gitignore`));

    // run yarn
    await execa(
        `cd ${newDirectory} && yarn install`,
        { shell: true, preferLocal: true }
      );
    write(chalk.grey(`\t✅ Ran \`yarn install\` and generated lockfile`));

    // commit project files and push to github
    await execa(
      `cd ${newDirectory} && git add -A && git commit -m "Scaffold New Project" && git push -u origin main --force`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Committed new project files and pushed commit to the remote`));

    // update github labels
    await execa(
      `cd ${newDirectory} && npx github-label-sync --access-token $GITHUB_AUTH --labels ${path.join(__dirname, "../labels.json")} ${config.githubOrg}/${config.githubName}`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Updated the Github Project Labels for changelog generation and commit targeting`));

    write(chalk.cyan(`\n\t🎉 Project Installation Complete`));

    write(`\n\n\t♥️  Made With Love by WarpDrive Engineering\n\n`);

}

main();