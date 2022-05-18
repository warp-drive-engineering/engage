"use strict";
/* eslint-disable no-console */

import chalk from "chalk";
import cliArgs from "command-line-args";
import buildDebug from "debug";
import { execaCommandSync, execaSync } from "execa";
import { fromMarkdown } from "mdast-util-from-markdown";
import fs from "node:fs";
import { EOL } from "node:os";
import path, { dirname } from "node:path";
import { exit } from "node:process";
import { fileURLToPath } from "node:url";
import semver from "semver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const debug = buildDebug("publish-packages");
const projectRoot = path.resolve(path.join(__dirname, "../"));
const UNRELEASED = "Unreleased";
const execa = {
  sync: execaSync,
  commandSync: execaCommandSync,
};
function getToday() {
  const date = new Date().toISOString();

  return date.slice(0, date.indexOf("T"));
}

/**
 *
 * @param {*} command The command to execute
 * @param {*} proxyIO whether to proxy stdio from the main process for this command
 *
 * proxyIO=true is useful when you want to see the output log or respond to prompts
 */
function execWithLog(command, args, proxyIO = false) {
  debug(chalk.cyan("Executing: ") + chalk.yellow(command));
  const method = args ? "sync" : "commandSync";
  const invokeArgs = args ? [command, args] : [command];
  const opts = proxyIO
    ? {
        stdio: "inherit",
        shell: true,
        preferLocal: true,
      }
    : {
        shell: true,
        preferLocal: true,
      };
  invokeArgs.push(opts);

  const execution = execa[method](...invokeArgs);
  return proxyIO ? execution : execution.stdout;
}

function cleanProject() {
  execWithLog(
    `cd ${projectRoot} && rm -rf packages/*/*/dist packages/*/*/tmp node_modules packages/*/*/node_modules`
  );
  execWithLog(
    `cd ${projectRoot} && pnpm install`
  );
}

function loadJsonFile(file) {
  const strContents = fs.readFileSync(file, { encoding: "utf-8" });
  try {
    return JSON.parse(strContents);
  } catch {
    console.error(
      `Unable to parse the contents of ${file} into JSON:\r\n\r\n${strContents}`
    );
    exit(1);
  }
}

function getConfig() {
  const optionsDefinitions = [
    {
      name: "type",
      alias: "t",
      type: String,
      defaultValue: "minor",
    },
    {
      name: "branch",
      alias: "b",
      type: String,
      defaultValue: "master",
    },
    {
      name: "clean",
      alias: "c",
      type: Boolean,
    },
    { name: "force", alias: "f", type: Boolean, defaultValue: false },
    { name: "dryRun", type: Boolean, defaultValue: false },
  ];

  const options = cliArgs(optionsDefinitions);
  const currentProjectVersion = loadJsonFile(
    path.resolve(path.join(projectRoot, "./lerna.json"))
  ).version;

  options.currentVersion = currentProjectVersion;
  options.changelogFile = path.resolve(
    path.join(projectRoot, "./CHANGELOG.md")
  );

  return options;
}

function assertGitIsClean(options) {
  const status = execWithLog("git status");

  if (!/^nothing to commit/m.test(status)) {
    if (options.force) {
      console.log(
        chalk.white("⚠️ ⚠️ ⚠️  Local Git branch has uncommitted changes!\n\t") +
          chalk.yellow("Passed option: ") +
          chalk.white("--force") +
          chalk.grey(" :: ignoring unclean git working tree")
      );
    } else {
      console.log(
        chalk.red("💥 Git working tree is not clean. 💥 \n\t") +
          chalk.grey("Use ") +
          chalk.white("--force") +
          chalk.grey(" to ignore this warning and publish anyway\n") +
          chalk.yellow(
            "⚠️  Publishing from an unclean working state may result in a broken release ⚠️\n\n"
          ) +
          chalk.grey(`Status:\n${status}`)
      );
      exit(1);
    }
  }

  if (!/^Your branch is/m.test(status)) {
    if (options.force) {
      console.log(
        chalk.white(
          "⚠️ ⚠️ ⚠️  Local Git branch is not setup to track the origin branch"
        ) +
          chalk.yellow("\n\tPassed option: ") +
          chalk.white("--force") +
          chalk.grey(" :: ignoring unsynced git branch")
      );
    } else {
      console.log(
        chalk.red(
          "💥 Local Git branch is not setup to track the origin branch. 💥 \n\t"
        ) +
          chalk.grey("Use ") +
          chalk.white("--force") +
          chalk.grey(" to ignore this warning and publish anyway\n") +
          chalk.yellow(
            "⚠️  Publishing from an unsynced working state may result in a broken release ⚠️"
          ) +
          chalk.grey(`Status:\n${status}`)
      );
      exit(1);
    }
  } else if (!/^Your branch is up to date with/m.test(status)) {
    if (options.force) {
      console.log(
        chalk.white(
          "⚠️ ⚠️ ⚠️  Local Git branch is not in sync with origin branch"
        ) +
          chalk.yellow("\n\tPassed option: ") +
          chalk.white("--force") +
          chalk.grey(" :: ignoring unsynced git branch")
      );
    } else {
      console.log(
        chalk.red(
          "💥 Local Git branch is not in sync with origin branch. 💥 \n\t"
        ) +
          chalk.grey("Use ") +
          chalk.white("--force") +
          chalk.grey(" to ignore this warning and publish anyway\n") +
          chalk.yellow(
            "⚠️  Publishing from an unsynced working state may result in a broken release ⚠️"
          ) +
          chalk.grey(`Status:\n${status}`)
      );
      exit(1);
    }
  }

  let foundBranch = status.split("\n")[0];
  foundBranch = foundBranch.replace("On branch ", "");

  if (foundBranch !== options.branch) {
    if (options.force) {
      console.log(
        chalk.white(
          `⚠️ ⚠️ ⚠️  Expected to publish new ${options.type} from the git branch ${options.branch}, but found ${foundBranch}`
        ) +
          chalk.yellow("\n\tPassed option: ") +
          chalk.white("--force") +
          chalk.grey(" :: ignoring unexpected branch")
      );
    } else {
      console.log(
        chalk.red(
          `💥 Expected to publish new ${options.type} from the git branch ${options.branch}, but found ${foundBranch} 💥 \n\t`
        ) +
          chalk.grey("Use ") +
          chalk.white("--force") +
          chalk.grey(" to ignore this warning and publish anyway\n") +
          chalk.yellow(
            "⚠️  Publishing from an incorrect branch may result in a broken release ⚠️"
          )
      );
      exit(1);
    }
  }
}

/**
 * Get the version number we should bump to for this release.
 *
 * @param {Object} options
 * @returns {String} the version number
 */
function retrieveNextVersion(options) {
  let v;
  if (options.type === "major" || options.type === "minor") {
    v = semver.inc(options.currentVersion, options.type);
  } else if (options.type === "patch") {
    v = semver.inc(options.currentVersion, options.type);
  } else {
    console.error(
      `Unknown semver type ${options.type}, expected one of 'major' 'minor' or 'release'`
    );
    exit(1);
  }

  return v;
}

function _findInsertOffset(oldContent) {
  const ast = fromMarkdown(oldContent);
  const firstH2 = ast.children.find(
    (it) => it.type === "heading" && it.depth === 2
  );
  return firstH2 ? firstH2.position.start.offset : 0;
}

function _insertContent(newContent, oldContent) {
  const insertOffset = _findInsertOffset(oldContent);
  const before = oldContent.slice(0, insertOffset);
  const after = oldContent.slice(insertOffset);
  return before + newContent + EOL + EOL + after;
}

function getFirstCommit() {
  return execWithLog(`git rev-list --max-parents=0 HEAD`);
}
function getTagForHEAD(options) {
  try {
    return execWithLog(`git describe --tags --abbrev=0 ${options.branch}`);
  } catch {
    return null;
  }
}

function writeChangelog(options) {
  let hasInfile = false;
  let changelog;

  try {
    fs.accessSync(options.changelogFile);
    hasInfile = true;
  } catch {
    console.log(`No CHANGELOG found at ${options.changelogFile}.`);
  }

  if (!hasInfile) {
    // generate an initial CHANGELOG.md with all of the versions
    const firstCommit = getFirstCommit();

    if (firstCommit) {
      changelog = execWithLog(
        `npx lerna-changelog --next-version=${UNRELEASED} --from=${firstCommit}`
      );
      changelog = changelog.replace(UNRELEASED, options.nextVersion);
    } else {
      // do something when there is no commit? not sure what our options are...
    }
  } else {
    const fromCommit = getTagForHEAD(options) || getFirstCommit();

    try {
      changelog = execWithLog(
        `npx lerna-changelog --next-version=${UNRELEASED} --from=${fromCommit}`
      );
      changelog = changelog
        ? changelog.replace(UNRELEASED, options.nextVersion)
        : `## ${options.nextVersion} (${getToday()})`;
      console.log(changelog);
      const lines = changelog.split(EOL);
      changelog = lines.slice(2, lines.length - 1).join(EOL);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  if (options.dryRun) {
    console.log(
      `! Prepending ${options.changelogFile} with release notes.`,
      changelog
    );
  } else {
    const currentFileData = hasInfile
      ? fs.readFileSync(options.changelogFile, { encoding: "utf8" })
      : "";
    const newContent = _insertContent(changelog, currentFileData);
    fs.writeFileSync(options.changelogFile, newContent, { encoding: "utf8" });
  }

  if (!hasInfile && !options.dryRun) {
    execWithLog(`git add ${options.changelogFile}`);
  }

  return changelog;
}

function writeCustomVersionLocations(options) {
  const sexpr =
    /[<]craftable[.]app[.]version[>][0-9A-Za-z._-]*[<][/]craftable[.]app[.]version[>]/;
  const repl = `<craftable.app.version>${options.nextVersion}</craftable.app.version>`;
  const xmlFilesWithVersions = [
    "./backend-api/common/pom.xml",
    "./backend-api/marshalls/pom.xml",
    "./backend-api/server/pom.xml",
  ];

  xmlFilesWithVersions.forEach((file) => {
    const filePath = path.resolve(path.join(projectRoot, file));
    const contents = fs.readFileSync(filePath, {
      encoding: "utf-8",
    });
    const newContents = contents.replace(sexpr, repl);

    if (options.dryRun) {
      console.log("Would updated XML File", { file, contents: newContents });
    } else {
      fs.writeFileSync(filePath, newContents, { encoding: "utf-8" });
    }
  });
}

function main() {
  const options = getConfig();

  assertGitIsClean(options);

  if (options.clean && !options.dryRun) {
    cleanProject();
  }

  const nextVersion = (options.nextVersion = retrieveNextVersion(options));
  writeCustomVersionLocations(options);
  const changelog = writeChangelog(options);
  // remove first two lines to prevent release notes
  // from including the version number/date (it looks odd
  // in the Github/Gitlab UIs)
  const changelogWithoutVersion = changelog.split(EOL).slice(2).join(EOL);
  fs.mkdirSync(path.join(projectRoot, "./tmp/"));
  fs.writeFileSync(
    path.join(projectRoot, "./tmp/changelog-for-release.md"),
    changelogWithoutVersion,
    {
      encoding: "utf-8",
    }
  );
  fs.writeFileSync(path.join(projectRoot, "./tmp/version.txt"), nextVersion, {
    encoding: "utf-8",
  });

  execWithLog(`npm version ${nextVersion} --no-git-tag-version`);
  // https://github.com/lerna/lerna/tree/master/commands/version#--exact
  // We use exact to ensure that our consumers always use the appropriate
  // versions published with each other
  // --force-publish ensures that all packages release a new version regardless
  // of whether changes have occurred in them
  // --yes skips the prompt for confirming the version
  const args = [
    "version",
    nextVersion,
    "--sign-git-commit",
    "--sign-git-tag",
    "--force-publish",
    "--yes",
    "--exact",
  ];
  const lernaCommand = `lerna`;
  if (options.dryRun) {
    args.push("--no-git-tag-version", "--no-push");
  }

  execWithLog(lernaCommand, args, true);
  console.log(`✅ ` + chalk.cyan(`Successfully Versioned ${nextVersion}`));
}

main();
