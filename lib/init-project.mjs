#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';
import { getGitConfig, guardImports, write, error, validateGithubUrl, configureFile } from "./utils/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getNewFile(file, config) {
  const filePath = path.join(__dirname, "../scaffolds/project/files", file.name);
  let fileStr = fs.readFileSync(filePath, { encoding: 'utf-8' });
  Object.keys(config).forEach((key) => {
    const keystr = `<<<<${key}>>>>`;
    fileStr = fileStr.replaceAll(keystr, config[key]);
  });

  return fileStr;
}

function getExistingFile(file, _config) {
  const filePath = path.join(process.cwd(), file.name);
  try {
    const stat = fs.statSync(filePath);
    if (!stat) {
      return null;
    }
    if (!stat.isFile()) {
      error(`Cannot read ${file.name} as it is not a file.`);
    }
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
  } catch {
    return null;
  }
}

function updateFile(file, config) {
  const existing = getExistingFile(file, config);

  if (!existing || file.op === "replace") {
    const filePath = path.join(process.cwd(), file.name);
    const newFile = getNewFile(file, config);
    fs.writeFileSync(filePath, newFile, { encoding: "utf-8" });
    write(chalk.grey(`\t✅ ${existing ? "Created" : "Replaced"} ${file.name}`));
  } else if (existing && file.op === "update") {
    // do diff update
    const newFile = getNewFile(file, config);
  }
}

export default async function main(_argv) {
    const { execa, chalk, cliargs, cliusage } = await guardImports();

    let pkg;

    try {
      pkg = JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" }));
    } catch {
      error("No valid package.json found in the current directory. Try running this command within a monorepo project");
    }
    const projectName = pkg.name.replace("-root", "");
    const mainDefinitions = [
        { name: "projectName", description: "name for the new project", type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: _argv });
    if (mainOptions.projectName && mainOptions.projectName !== projectName) {
      warn(`The provided projectName \`${mainOptions.projectName}\` will overwrite the projectName found in package.json (\`${projectName}\`).`);
    } else if (!mainOptions.projectName) {
      mainOptions.projectName = projectName;
    }
    const argv = mainOptions._unknown || [];
    if (argv.indexOf("--help") === -1 && argv.indexOf("-h") === -1) {
      write(`\t${chalk.grey(`Initializing Project `) + chalk.magenta(mainOptions.projectName)}\n\n\t--------------------------\n\n`);
    }
    // TODO --typescript for configuring typescript
    // TODO --from for migrating project structure from single app/ single v1-addon
    // TODO --config for configuring eslint/ignore/template-lint/prettier etc.
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
          header: "engage init",
          content: "Configure an existing mono-repo project to be up to WarpDrive standards. Does not upgrade/affect lint/test/typescript configuration.",
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
                "engage init <projectName> -g <githubUrl>"
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
    const githubUrl = typeof pkg.repository === "string" ? pkg.repository : typeof pkg.repository === "object" ? pkg.repository.url : null;

    if (!githubUrl && !config.githubUrl) {
      error(`No githubUrl provided to \`engage init <projectName>\` and none was present within package.json`);
    } else if (githubUrl && config.githubUrl) {
      if (githubUrl !== config.githubUrl) {
        warn(`The provided githubUrl \`${config.githubUrl}\` does not match the one in package.json \`${githubUrl}\`. The current githubUrl will be overwritten.`)
      }
    } else if (githubUrl && !config.githubUrl) {
      config.githubUrl = githubUrl;
    }

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

    // check project appears to be one we can init
    const newDirectory = process.cwd();

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

    const filesToUpdate = [
      { name: "package.json", op: "update", },
      { name: "lerna.json", op: "update", },
      { name: "README.md", op: "ignore", },
      { name: ".github/FUNDING.yml", op: "ignore", },
      { name: ".github/workflows/release.yml", op: "replace", },
    ];
    filesToUpdate.forEach((file) => updateFile(file, config));

    // run pnpm
    await execa(
        `cd ${newDirectory} && pnpm install`,
        { shell: true, preferLocal: true }
      );
    write(chalk.grey(`\t✅ Ran \`pnpm install\` and generated lockfile`));

    // commit project files and push to github
    await execa(
      `cd ${newDirectory} && git add -A && git commit -m "Initialize WarpDrive Project" && git push -u origin main`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Committed new project files and pushed commit to the remote`));

    // update github labels
    await execa(
      `cd ${newDirectory} && pnpm run github-label-sync --allow-added-labels --access-token $GITHUB_AUTH --labels ${path.join(__dirname, "../scaffolds/project/labels.json")} ${config.githubOrg}/${config.githubName}`,
      { shell: true, preferLocal: true }
    );
    write(chalk.grey(`\t✅ Updated the Github Project Labels for changelog generation and commit targeting`));
}
