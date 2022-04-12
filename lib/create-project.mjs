#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { getGitConfig, guardImports, write, error, validateGithubUrl, configureFile } from "./utils/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function main(_argv) {
    const { execa, chalk, cliargs, cliusage } = await guardImports();

    const mainDefinitions = [
        { name: "projectName", description: "name for the new project", type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: _argv });
    if (mainOptions.projectName) {
      write(`\t${chalk.grey(`Creating Project `) + chalk.magenta(mainOptions.projectName)}\n\n\t--------------------------\n\n`);
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
          header: "engage project <projectName> -g <githubUrl>",
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
                "engage project <projectName> -g <githubUrl>"
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
    } else if (!mainOptions.projectName) {
      error(`You must supply a project name as the first argument to \`engage project <projectName>\``);
    }

    const config = Object.assign({}, mainOptions, options);

    const { org, name } = await validateGithubUrl(config);
    config.githubOrg = org;
    config.githubName = name;

    if (!config.directory) {
        config.directory = config.githubName;
    }

    const gitConfig = await getGitConfig();
    config.githubUser = gitConfig.get("user.name");
    config.githubEmail = gitConfig.get("user.email");
    config.githubUsername = gitConfig.get("github.user");

    write(chalk.grey(`
    \tConfiguration:
    \t◉ Project Name:\t\t${chalk.yellow(config.projectName)}
    \t◉ Directory:\t\t${chalk.yellow(config.directory)}
    \t◉ Github Url:\t\t${chalk.yellow(config.githubUrl)}
    \t◉ Github Organization:\t${chalk.yellow(config.githubOrg)}
    \t◉ Github Project Name:\t${chalk.yellow(config.githubName)}
    \t◉ Github User Name:\t${chalk.yellow(config.githubUser)}
    \t◉ Github User Email:\t${chalk.yellow(config.githubEmail)}
    \t◉ Github User Username:\t${chalk.yellow(config.githubUsername)}
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
        `cp -rv ${path.join(__dirname, "../scaffolds/project/files")} ${newDirectory}`,
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

    // update FUNDING.md
    configureFile(path.join(newDirectory, ".github/FUNDING.md"), config);
    write(chalk.grey(`\t✅ Configured .github/FUNDING.md`));
   

    configureFile(path.join(newDirectory, ".github/workflows/release.yml"), config);
    write(chalk.grey(`\t✅ Configured .github/workflows/release.yml`));

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
      `cd ${newDirectory} && npx github-label-sync --access-token $GITHUB_AUTH --labels ${path.join(__dirname, "../scaffolds/project/labels.json")} ${config.githubOrg}/${config.githubName}`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Updated the Github Project Labels for changelog generation and commit targeting`));
}