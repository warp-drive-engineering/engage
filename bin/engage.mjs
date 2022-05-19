#!/usr/bin/env node
let modules;
import fs from "node:fs";

function write(str) {
    console.log(str);
}
function error(msg) {
    const { chalk } = modules;
    write(chalk.red(`\n\tError: ${msg}\n\n`));
    process.exit();
}

async function guardImports() {
    try {
      const chalk = await import("chalk");
      const cliusage = await import("command-line-usage");
      const cliargs = await import("command-line-args");

      const imports = { chalk, cliargs, cliusage };

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

const COMMANDS = {
  project: {
      name: "project",
      kind: "Project",
      src: '../lib/create-project.mjs'
  },
  init: {
    name: "init",
    kind: "Project",
    src: "../lib/init-project.mjs"
  },
  app: {
      name: "app",
      kind: "Application",
      src: '../lib/create-app.mjs'
  },
  addon: {
      name: "addon",
      kind: "Addon",
      src: "../lib/create-addon.mjs"
  },
  'v1-addon': {
      name: "v1-addon",
      kind: "V1 Addon",
      src: "../lib/create-v1-addon.mjs"
  },
  tool: {
      name: "tool",
      kind: "Tool",
      src: "../lib/create-tool.mjs"
  },
  'eslint-rule': {
      name: "eslint-rule",
      kind: "Eslint Rule",
      src: "../lib/create-eslint-rule.mjs"
  },
  'template-lint-rule': {
      name: "template-lint-rule",
      kind: "TemplateLint Rule",
      src: "../lib/create-template-lint-rule.mjs"
  },
  codemod: {
      name: "codemod",
      kind: "Codemod",
      src: "../lib/create-codemod.mjs"
  },
  migration: {
      name: "migration",
      kind: "Migration",
      src: "../lib/create-migration.mjs"
  }
};

async function main() {
    const { chalk, cliargs, cliusage } = await guardImports();

    const mainDefinitions = [
        { name: "command", description: `command to run, must be one of [${Object.keys(COMMANDS).join("|")}]`, type: String, defaultOption: true }
    ];
    const mainOptions = cliargs(mainDefinitions, { stopAtFirstUnknown: true, argv: process.argv });
    const argv = mainOptions._unknown || [];
    write(`\n\t${chalk.yellow("@warp-drive/engage")}\n\n\t##########################\n`);

    if (mainOptions.command) {
        const command = COMMANDS[mainOptions.command];
        const isProject = mainOptions.command === "project";

        if (!command) {
          error(`"${mainOptions.command}" is not a valid command name.`);
        }

        let pkg;
        if (command.kind !== "Project") {
            try {
              pkg = JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" }));
            } catch(e) {
              error(`No valid package.json found in the current directory. Try running the command \`engage ${command.name}\` within a project`);
            }
        }

        write(chalk.grey(`\t🚀  engaging ${command.kind}${isProject ? "" : ` in ${pkg.name}`}...\n\n`));

        const cmd = await import(command.src);
        await cmd.default(argv);

        if (argv.indexOf("--help") === -1 && argv.indexOf("-h") === -1) {
            write(chalk.cyan(`\n\t🎉 ${command.kind} Scaffolding Complete${isProject ? "" : ` in ${pkg.name}`}. Warp Drive Engaged.`));
        }
    } else {
        const optionsDefinitions = [
            {
            name: "help",
            alias: "h",
            type: Boolean,
            description: "Display this usage guide.",
            defaultValue: false,
            },
        ];
        const MAN_DETAILS = [
            {
              header: "engage",
              content: "Quickly scaffold your projects, apps, engines, addons and tools.",
            },
            {
              header: "Options",
              optionList: [...mainDefinitions, ...optionsDefinitions],
            },
            {
            header: "Examples",
            content: [
                {
                  desc: "1. Create a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage project <projectName> -g <githubUrl>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "2. Create an App Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                      "engage app <appName>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "3. Create an Addon Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage addon <name> -d <directory>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "4. Create a V1 Addon Within a Project (typically for build tools)",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage v1-addon <name> -d <directory>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "5. Create a Tool Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage tool <name>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "6. Create an eslint rule plugin Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage eslint-rule <name>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "7. Create a template-lint rule plugin Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage template-lint-rule <name>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "8. Create a Codemod Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage codemod <name> -t <codemodType>"
                  )}\r\n${chalk.grey("```")}`,
                },
                {
                  desc: "9. Create a Migration Within a Project",
                  example: `${chalk.grey("```")}\r\n${chalk.yellow(
                    "engage migration <name>"
                  )}\r\n${chalk.grey("```")}`,
                },
            ],
            },
        ];
        const usage = cliusage(MAN_DETAILS);
        const options = cliargs(optionsDefinitions, { argv });

        if (options.help) {
            write(usage);
        } else {
            error(`No command specified. Run \`engage -h\` for help. Valid commands are \`engage ${Object.keys(COMMANDS).join("|")}\``)
        }

    }

    write(`\n\n\t♥️  Made With Love by WarpDrive Engineering\n\n`);
}

main();
