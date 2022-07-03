import fs from "node:fs";
import path from "node:path";
import { cursorTo } from "node:readline";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkOnline() {
  const { default: dns } = await import("node:dns");

  try {
    await new Promise((resolve, reject) => {
      dns.resolve("www.npmjs.org", "A", (e) => {
        if (e instanceof Error) {
          reject(e);
        } else {
          resolve(e);
        }
      });
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function getLatest() {
  const { execa } = await import("execa");
  const { stdout } = await execa(`npm view @warp-drive/engage`, { shell: true, preferLocal: true });

  const latest = stdout.split('\n').find(v => v.startsWith("latest: "));

  if (latest) {
    return latest.replace("latest: ", "");
  } else {
    throw new Error(`No latest available on npm`);
  }
}

function matchVersion({ ourVersion, latestVersion }) {
  if (ourVersion === latestVersion) {
    return true;
  }

  // can't possibly match a beta/alpha if there
  // is no dash. e.g. 0.0.1-beta.1
  if (!ourVersion.includes(`-`)) {
    return false;
  }

  const [ourPrimary] = ourVersion.split('-');
  const ours = ourPrimary.split('.');
  const latest = latestVersion.split('.');

  if (latest[0] !== ours[0] || latest[1] !== ours[1]) {
    return false;
  }

  // we must be above the latest release
  if (Number(latest[2]) >= Number(ours[2])) {
    return false;
  }

  return true;
}

export default async function detectAndUpdate() {
  const { default: chalk } = await import("chalk");
  const ourVersion = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json")), { encoding: 'utf-8' }).version;

  const isOnline = await checkOnline();

  if (!isOnline) {
    console.log(chalk.grey(`\n\n\tUsing @warp-drive/engage@${chalk.yellow(ourVersion)}\n\n\t${chalk.yellow("⚠️ 🛠  Network is Offline and Scaffolding May Fail")}\n\n`));
    return;
  }

  try {
    const latestVersion = await getLatest();
    if (!matchVersion({ ourVersion, latestVersion })) {
      console.log(
        chalk.grey(`\n\n\tAn update is available for ${chalk.cyan('@warp-drive/engage')}. You are currently using ${chalk.red(ourVersion)}. Latest is ${chalk.green(latestVersion)}. Use ${chalk.yellow(`\`pnpm install -g @warp-drive/engage\``)} to update.\n\n`)
        );
    } else {
      console.log(chalk.grey(`\n\n\tUsing latest @warp-drive/engage@${chalk.green(ourVersion)}\n\n`));
    }
  } catch (e) {
    console.error(e);
  }
}
