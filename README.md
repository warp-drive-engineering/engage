# @warp-drive/engage

Scaffolding for highly optimized applications built with [Ember.js](https://emberjs.com/)

## About

`engage` is a tool for scaffolding [Monorepo]() projects using [Yarn Workspaces](), [Lerna](), [Release It](), and [Typescript]().

It's built for the future of Ember, focusing on configuring your project to maximize your success.

Monorepos solve problems almost every ember project hits with testing, modularization, and code re-use.

You don't need to put all of your code into one mono-repo, but often you'll find that more things make sense when maintained together.

Even projects with just one app or addon will find value
in this structure as they scale.

### ⛰ Features

In addition to a new project structure, `engage` provides an enhanced "out-of-the-box" experience for app developement, helping to ensure you ship the most powerful but lightweight and performant application possible, to whatever platforms you target.

Some of the defaults it provides:

- Typescript
- Optimized builds with embroider
- SSR via fastboot
- ServiceWorker by default
- Advanced terser configuration
- Optimizations for SVGs, Templates, Translations
- Automated Releases for both Public and Private Packages

> For the full feature list see [Features](./FEATURES.md)
> For planned but not yet released features see the [Roadmap](./ROADMAP.md)
> For Release Notes see [Releases](https://github.com/warp-drive-engineering/engage/releases) or the [Changelog](./CHANGELOG.md)

### 👷🏽‍♀️ Installation

Installing the package globally will add the command `engage` to your terminal.

```
yarn global add @warp-drive/engage
```

Once installed, run `engage --help` to see detailed usage information.

### 🚀 Usage

**1. Create a new Project**

```cli
engage project <projectName> --githubUrl git@github.com:<orgName>/<repoName>.git
```

_Why `--githubUrl`?_
> This allows `engage` to configure
>  the project labels, packages, and various scripts correctly. In the future, we'll add a way
>  to skip this for folks not using github or who are scaffolding while offline.

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

Brought to you with ♥️ love by [WarpDrive Engineering](https://github.com/warp-drive)
