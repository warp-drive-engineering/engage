"use strict";
/* eslint-disable no-console */

import fs from "node:fs";
import { EOL } from "node:os";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(path.join(__dirname, "../"));
EOL;
const changelog = fs.readFileSync(
  path.join(projectRoot, "./tmp/changelog-for-release.md"),
  { encoding: "utf-8" }
);
const buildLog = fs.readFileSync(
  path.join(projectRoot, "./tmp/prod-build-log.txt"),
  { encoding: "utf-8" }
);

function getToday() {
  const date = new Date().toISOString();

  return date.slice(0, date.indexOf("T"));
}

const notesStart = buildLog.indexOf("File sizes:") + 11;
let assetSizeNotes = buildLog.slice(notesStart);
const notes = assetSizeNotes.split(EOL);
notes.pop();
assetSizeNotes = notes.join(EOL);

const releaseNotes =
  `## Changelog (${getToday()})` +
  EOL +
  EOL +
  changelog +
  EOL +
  EOL +
  "### Asset Sizes" +
  EOL +
  EOL +
  assetSizeNotes +
  EOL;

fs.writeFileSync(
  path.join(projectRoot, "./tmp/release-notes.md"),
  releaseNotes,
  {
    encoding: "utf-8",
  }
);
