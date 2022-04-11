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

function warn(msg) {
  const { chalk } = modules;
  write(chalk.yellow(`\n\t⚠️  Warning: ${msg}\n\n`));
}

function sanitizeGitUrl(url) {
  if (url.startsWith("git+ssh://")) {
    return url.slice(10);
  }
  return url;
}

async function validateGithubUrl(config) {
    const { chalk } = modules;
    const url = config.githubUrl;
    const errorMsg = `create-project requires a githubUrl of the form "${chalk.grey(`git@github.com:<account>/${config.directory}.git`)}" to be specified for the new project. Received ${url}`;
    
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
        { name: "appName", description: "name for the new application", type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: process.argv });
    write(`\n\t${chalk.yellow("@warp-drive/create-app")}\n\n\t##########################\n\n`);
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
          header: "create-app <app-name> -d <directoryName>",
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
                "create-app <app-name> -d <directoryName>"
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
        `cp -rv ${path.join(__dirname, "../app-files")} ${newDirectory}`,
        { shell: true, preferLocal: true }
      );
    write(chalk.grey(`\t✅ Copied Application Template Files into <${pkg.name}>/apps/${config.directory}`));

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

    pkg.scripts[`start:${config.directory}:local`] = `cd apps/${config.directory} && yarn start:local`;

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
    await execa(
      `cd ${newDirectory} && npx github-label-sync --allow-added-labels --access-token $GITHUB_AUTH --labels ${path.join(__dirname, "../labels.json")} ${config.githubOrg}/${config.githubName}`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Updated the Github Project Labels to include a label for this application`));

    write(chalk.cyan(`\n\t🎉 Application Scaffolding in ${pkg.name} Complete`));

    write(`\n\n\t♥️  Made With Love by WarpDrive Engineering\n\n`);

}

main();