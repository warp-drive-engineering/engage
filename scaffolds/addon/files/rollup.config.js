import { Addon } from "@embroider/addon-dev/rollup";
import babel from "@rollup/plugin-babel";
import fs from "node:fs";
import path from "node:path";
import walkSync from "walk-sync";

const addon = new Addon({
  srcDir: "src",
  destDir: "dist",
});

function pathExists(filePath) {
  try {
    fs.statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function isTemplateOnly(hbsPath) {
  const jsPath = hbsPath.replace(/\.hbs$/, ".js");
  const tsPath = hbsPath.replace(/\.hbs$/, ".ts");

  return !(pathExists(jsPath) || pathExists(tsPath));
}

function getTemplateOnly(hbsPath) {
  const input = fs.readFileSync(hbsPath, "utf8");
  return (
    `import { hbs } from 'ember-cli-htmlbars';\n` +
    `import templateOnly from '@ember/component/template-only';\n` +
    `import { setComponentTemplate } from '@ember/component';\n` +
    `export default setComponentTemplate(\n` +
    `hbs\`${input}\`, templateOnly());`
  );
}
function normalizeFileExt(fileName) {
  return fileName.replace(/\.hbs$/, ".js");
}

function templateOnlyPlugin(args) {
  return {
    name: "template-only-component-plugin",
    load(id) {
      if (!id.endsWith(".hbs")) {
        return;
      }
      if (isTemplateOnly(id)) {
        return { code: getTemplateOnly(id), id: normalizeFileExt(id) };
      }
    },
    buildStart() {
      const matches = walkSync(args.srcDir, {
        globs: [...args.include],
      });

      for (const name of matches) {
        if (name.endsWith(".hbs") && isTemplateOnly(name)) {
          this.emitFile({
            type: "chunk",
            id: path.join(args.srcDir, name),
            fileName: normalizeFileExt(name),
          });
        }
      }
    },
  };
}

const globallyAvailable = ["components/**/*.{js,ts}", "helpers/**/*.{js,ts}"];

export default {
  // This provides defaults that work well alongside `publicEntrypoints` below.
  // You can augment this if you need to.
  output: addon.output(),

  external: [],

  plugins: [
    // These are the modules that users should be able to import from your
    // addon. Anything not listed here may get optimized away.
    addon.publicEntrypoints([...globallyAvailable, "services/**/*.{js,ts}"]),

    // These are the modules that should get reexported into the traditional
    // "app" tree. Things in here should also be in publicEntrypoints above, but
    // not everything in publicEntrypoints necessarily needs to go here.
    addon.appReexports(globallyAvailable),

    babel({
      extensions: [".js", ".ts", ".hbs"],
      babelHelpers: "runtime", // we should consider "external",
    }),

    // Follow the V2 Addon rules about dependencies. Your code can import from
    // `dependencies` and `peerDependencies` as well as standard Ember-provided
    // package names.
    addon.dependencies(),

    // Ensure that standalone .hbs files are properly integrated as Javascript.
    // addon.hbs(),

    // ensure that template-only components are properly integrated
    // this exists because of https://github.com/embroider-build/embroider/issues/1121
    templateOnlyPlugin({ include: ["components/**/*.hbs"], srcDir: "src" }),

    // addons are allowed to contain imports of .css files, which we want rollup
    // to leave alone and keep in the published output.
    addon.keepAssets(["**/*.css"]),

    // Remove leftover build artifacts when starting a new build.
    addon.clean(),
  ],
};
