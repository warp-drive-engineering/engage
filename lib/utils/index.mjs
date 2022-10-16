import fs from "node:fs";
import { replaceAll } from "./replace-all.mjs";

let modules;
export function parseBooleanValue(v) {
    if (typeof v === "string") {
        if (v === "false" || v === "0") {
        return false;
        }
        return true;
    }
    return Boolean(v);
}

export function write(str) {
    console.log(str);
}

export async function guardImports() {
    try {
      const { execa } = await import("execa");
      const chalk = await import("chalk");
      const cliusage = await import("command-line-usage");
      const cliargs = await import("command-line-args");
      const labelSync = await import("github-label-sync");

      const imports = { execa, chalk, cliargs, cliusage, labelSync };

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
        `\r\n\r\n\t!!! This script requires the dependencies specified in this project's root package.json file to be installed. !!!\r\n\r\n\tRun \`pnpm install\` then attempt this script again.`
      );
      process.exit(1);
    }
}

export function error(msg) {
    const { chalk } = modules;
    write(chalk.red(`\n\tError: ${msg}\n\n`));
    process.exit();
}

export function warn(msg) {
  const { chalk } = modules;
  write(chalk.yellow(`\n\t⚠️  Warning: ${msg}\n\n`));
}

export function sanitizeGitUrl(url) {
  if (url.startsWith("git+ssh://")) {
    return url.slice(10);
  }
  return url;
}

export async function validateGithubUrl(config) {
    const { chalk } = modules;
    const url = config.githubUrl;
    const errorMsg = `engage ${config.command?.name || 'project'} requires a githubUrl of the form "${chalk.grey(`git@github.com:<githubAccount>/<repoName>.git`)}" to be specified for the new project. Received ${url}`;

    if (!url || (!url.startsWith("git@github.com:") && !url.startsWith("git+ssh://git@github.com:")) || !url.endsWith(".git")) {
      return error(errorMsg);
    }

    const orgAndName = url.slice(15, -4);
    const [org, name] = orgAndName.split('/');

    if (!org || !name) {
        return error(errorMsg);
    }

    return { org, name };
}

export async function configureFile(fileName, config) {
  let fileStr = fs.readFileSync(fileName, { encoding: 'utf-8' });
  Object.keys(config).forEach((key) => {
    const keystr = `<<<<${key}>>>>`;
    fileStr = replaceAll(fileStr, keystr, config[key]);
  });
  fs.writeFileSync(fileName, fileStr, { encoding: 'utf-8' });
}

export async function getGitConfig() {
    const { execa } = modules;
    const { stdout } = await execa(`git config --list`, { shell: true, preferLocal: true });
    const config = new Map(stdout.split("\n").map(v => v.split("=")));
    return config;
}
