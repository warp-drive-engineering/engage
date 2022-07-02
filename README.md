<p align="center">
  <img
    class="project-logo"
    src="./NCC-1701-a-blue.svg#gh-light-mode-only"
    alt="WarpDrive Engineering"
    width="120px"
    title="WarpDrive Engineering" />
  <img
    class="project-logo"
    src="./NCC-1701-a.svg#gh-dark-mode-only"
    alt="WarpDrive Engineering"
    width="120px"
    title="WarpDrive Engineering" />
</p>

# @warp-drive/engage

[![GitHub Sponsors](https://img.shields.io/github/sponsors/runspired)](https://github.com/sponsors/runspired)
[![lerna version](https://img.shields.io/github/package-json/dependency-version/warp-drive-engineering/engage/dev/lerna)](https://lerna.js.org/)
[![pnpm version](https://img.shields.io/github/package-json/packageManager/warp-drive-engineering/engage)](https://pnpm.io/)
[![Generate Release Candidate](https://github.com/warp-drive-engineering/engage/actions/workflows/release.yml/badge.svg?event=workflow_dispatch)](https://github.com/warp-drive-engineering/engage/actions/workflows/release.yml)

Scaffolding for highly optimized applications built with [Ember.js](https://emberjs.com/)

## About

`engage` is a tool for scaffolding [Monorepo](https://en.wikipedia.org/wiki/Monorepo) projects using [pnpm Workspaces](), [Lerna](https://github.com/lerna/lerna), [Release It](), and [Typescript]().

It's built for the future of Ember, focusing on configuring your project to maximize your success.

Monorepos solve problems almost every ember project hits with testing, modularization, and code re-use.

You don't need to put all of your code into one mono-repo, but often you'll find that more things make sense when maintained together.

Even projects with just one app or addon will find value
in this structure as they scale.

<kbd>![example cli usage](./demos/app-demo.svg)</kbd>

### ⛰ Features

In addition to a new project structure, `engage` provides an enhanced "out-of-the-box" experience for app developement, helping to ensure you ship the most powerful but lightweight and performant application possible, to whatever platforms you target.

Some of the defaults it provides:

- Typescript
- Optimized builds with embroider
- SSR via fastboot
- ~ServiceWorker by default~ *ember-service-worker* is not compatible with embroider, we are working on a new service-worker solution for ember apps.
- Advanced terser configuration
- Optimizations for SVGs, Templates, Translations
- Automated Releases for both Public and Private Packages

> - For the full feature list see [Features](./FEATURES.md)
> - For planned but not yet released features see the [Roadmap](./ROADMAP.md)
> - For Release Notes see [Releases](https://github.com/warp-drive-engineering/engage/releases) or the [Changelog](./CHANGELOG.md)

### 👷🏽‍♀️ Installation

Installing the package globally will add the command `engage` to your terminal.

```
pnpm add -g @warp-drive/engage
```

Once installed, run `engage --help` to see detailed usage information.

<kbd>![example help usage](./demos/help-demo.svg)</kbd>

### 🚀 Usage

**1. Create a new Project**

```cli
engage project <projectName> --githubUrl git@github.com:<orgName>/<repoName>.git
```

_Why `--githubUrl`?_
> This allows `engage` to configure
>  the project labels, packages, and various scripts correctly. In the future, we'll add a way
>  to skip this for folks not using github or who are scaffolding while offline.

<kbd>![example project usage](./demos/project-demo.svg)</kbd>

Then switch into the new directory and start working!

```
cd <directory-name>
```

**2. Add Applications, Addons and More to your project**

From inside your project, run any of the following commands to scaffold a package in the project monorepo.

```cli
engage app <appName> -d <directoryName>
engage addon <addonName> -d <directoryName>
engage v1-addon <addonName> -d <directoryName>
engage engine <engineName> -d <directoryName>
```

For the full list of things that can be scaffolded, run `engage --help`.

### ⚓️ Suggested Additional Setup

Using these scaffolds requires a global ember-cli install.

We recommend installing and managing yarn, node and ember-cli via [volta](https://volta.sh/).

These scaffolds configure node and yarn usage in each package via volta.

Install volta if required, then use volta to install ember-cli.

```cli
volta install ember-cli
```

### ♥️ Credits

Brought to you with ♥️ love by [WarpDrive Engineering](https://github.com/warp-drive-engineering)


<br><br><br><br>
 <details>
   <summary>.</summary>

  <style type="text/css">
    img.project-logo {
       padding: 0 5em 1em 5em;
       width: 100px;
       border-bottom: 2px solid #0969da;
       margin: 0 auto;
       display: block;
     }
    details > summary {
      font-size: 1.1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details {
      font-size: 1rem;
    }
    details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #000;
      border-bottom: 3px solid #0969da;
    }

    details > details {
      margin-left: 2rem;
    }
    details > details > summary {
      font-size: 1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details > details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #555;
      border-bottom: 2px solid #555;
    }
    details > details {
      font-size: .85rem;
    }

    @media (prefers-color-scheme: dark) {
      details > summary strong {
        color: #fff;
      }
    }
    @media (prefers-color-scheme: dark) {
      details > details > summary strong {
        color: #afaba0;
      border-bottom: 2px solid #afaba0;
      }
    }
  </style>
</details>
