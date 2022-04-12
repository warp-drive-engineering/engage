<p align="center">
  <picture>
  <source
    srcset="./NCC-1701-a-blue.svg"
    media="(prefers-color-scheme: dark)"
  />
  <source
    srcset="./NCC-1701-a.svg"
    media="(prefers-color-scheme: light)"
  />
  <img
    class="project-logo"
    src="./NCC-1701-a.svg#gh-light-mode-only"
    alt="Built with WarpDrive"
    width="120px"
    title="Built with WarpDrive"
    />
  <img
    class="project-logo"
    src="./NCC-1701-a-blue.svg#gh-dark-mode-only"
    alt="Built with WarpDrive"
    width="120px"
    title="Built with WarpDrive" />
  </picture>
</p>

# <<<<projectName>>>>

[![Generate Release Candidate](https://github.com/<<<<githubOrg>>>>/<<<<githubName>>>>/actions/workflows/release.yml/badge.svg?event=workflow_dispatch)](https://github.com/<<<<githubOrg>>>>/<<<<githubName>>>>/actions/workflows/release.yml)

This project is the [monorepo](https://en.wikipedia.org/wiki/Monorepo) for frontend and webview based applications.

## Basic Setup

<details open>
  <summary>
    <strong>MacOS</strong>
  </summary>

  <br>
  <details>
    <summary><strong>Setup for All</strong></summary>

1. If you haven't previously setup the command line tools for OSX, start by installing them by running the following command in the terminal.

```sh
xcode-select --install
```

2. Clone this repository locally from whichever directory you would like it to be in. For instance if you have a `github` directory you might `cd ~/github` first before cloning the repository. This will require you to have configured your [ssh keys](https://docs.github.com/en/enterprise-server@3.0/github/authenticating-to-github/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

```sh
git clone git@github.com:<<<<githubOrg>>>>/<<<<githubName>>>>.git
```

This will create a new folder `fnb` within the current directory containing the project files.

3. If your machine does not already have [volta](https://volta.sh/), make sure you have it installed. This will ensure that the correct [node](https://nodejs.org/en/about/releases/) and [yarn](https://yarnpkg.com/) versions are available when within the project.

```sh
curl https://get.volta.sh | bash
```

4. Install dependencies.

```sh
yarn install
```

  <br><br><br>
  </details>

  <details>
    <summary><strong>Setup for Development</strong></summary>

There is currently no additional setup needed for developing on the frontend beyond the instructions in `setup for all`. However, you may find it useful to have `ember-cli` globally available.

```sh
volta install ember-cli
```

You may also want to install [watchman](https://facebook.github.io/watchman/), which can help with many [performance situations during the build](https://cli.emberjs.com/release/basic-use/#additionalstepsformacandlinuxusers).

```sh
brew install watchman
```

  <br><br><br>
  </details>

<br><br>
</details>

## Developing

<details open>
  <summary><strong>Running the Project</strong></summary>

  <br>
  <details>
    <summary><strong>Starting an App</strong></summary>

```sh
yarn start:<appName>:local
```

This will start the development server and launch a browser with the specified app.

If you would like more control over the build, test, and serve commands navigate to the respective frontend
application and utilize the respective commands from within the given repository. This can be especially useful
when debugging or when trying to examine the difference between two versions/commits.
  <br><br><br>
  </details>

  <details>
    <summary><strong>Running Lint & Tests</strong></summary>

  ### Lint

  We run three separate forms of lint checks on our codebase. These checks run in CI on Pull Requests but you can also run them individually via the command line.
  
  These checks are configured in a way
    that they run lint on all of the projects within the frontend directory, but you can choose to switch into an individual project and run the same lint command within it as well. All root commands are in the `scripts` hash within [./package.json](./package.json) while individual project commands are in their respective `package.json` files.

  - Typescript Compiler Check: `yarn lint:types` configured by [./.tsconfig.json](./.tsconfig.json)
  - Javascript & Typescript Lint: `yarn lint:js` configured by [./.eslintrc.js](./.eslintrc.js)
  - Handlebars Linting: `yarn lint:hbs` configured by [./.template-lintrc.js](./.template-lintrc.js)

  ### Test Commands

  In addition to various browser compatibility and scenario tests, we run two key sets of tests in CI. These commands are similarly found in the `scripts` hash within [./package.json](./package.json) with corresponding project commands located in respective respective `package.json` files.

  - Production Tests: `yarn test:production`
  - Development Tests: `yarn test:development`

  Production and development test scenarios run the same tests; however, production tests exclude tests that check for deprecations, asserts, and dev time checks to ensure our code still functions correctly with these things removed.

  ### Working on Tests

  Within an individual project you will often want to run the tests specific to that project only. From within that project's directory the same commands above will work; however, they may not give you the fastest feedback, while below options may. Multple ways of running tests are available, below we go into three key distinct methods.

  1. Accessing tests for any locally served development build.

  If you have an application running either via `yarn start:<app-name>:local` or `ember serve`, then navigating to the `/tests` url will pull up and run the tests in the browser, allowing you to monitor and debug failures. If the application is serving at `localhost:4200`, then `localhost:4200/tests` will give access to the test.

  2. Launching the tests in their own browser context

  From within a project directory:

  ```sh
  ember test --serve
  ```

  You may also be interested in adding the flag `--no-launch` to prevent auto-launching a custom chrome instance so that you can use and manage the test run within an already open browser.

  The flag `--disable-live-reload` will prevent the test runner from attempting to launch additional browser instances when you've made changes while paused in a debugger.

  3. Separating out Build and Test

  By default `ember test --serve` will build the application, serve it up, and monitor for changes after which it will rebuild. Sometimes this is undesireable, – for instance when you want to run tests against multiple build specific to SHAs while determining where a problem was introduced – and it also prevents monitoring the terminal for build errors while running tests.

  We can separate the build and test serving into two commands within a project directory. First, the build command:

  ```sh
  ember build --watch --output-path="./dist"
  ```

  This tells ember to build the app, watch for and rebuild on changes, and put the built assets into the `dist` directory. If you need to build multiple commits, give them separate output paths!

  Next, connect your tests to the pre-built assets.

  ```sh
  ember test --serve --path="./dist" --test-port=0
  ```

  This tells the test command to serve up whatever assets are at `dist`. Whenever the build command rebuilds the test command will detect the changes to the final output, and refreshing your tests page will reflect them. Adding `--test-port=0` here tells the test command to pick a random available port to serve on, ensuring we can have multiple test server instances if needed.

  
  <br><br><br>
  </details>

  <details>
    <summary><strong>Configuring VSCode</strong></summary>

  Microsoft's Visual Studio Code application (VSCode) is a free and widely used editor for frontend programming (javascript/typescript/html/css/jsx etc.) as well as for some backend languages. Other editors are more specialized for languages like Java (which our backend is written in) so at some point you may want to install a different editor such as IntelliJ if working on backend files.

  Download: https://code.visualstudio.com/

  Once you have downloaded and launched Visual Studio Code there are a number of plugins/extensions you will want to consider adding and configuring.

  - EditorConfig for VS Code | by EditorConfig
  - Ember Colorizer and Theme | by ciena-blueplanet
  - Eslint | by Microsoft
  - GitLens | by GitKraken
  - Glint | by TypedEmber
  - Live Share, Live Share Audio, and Live Share Extension Pack | by Microsoft
  - Prettier - Code formatter | by Prettier
  - Prettier for Handlebars | by Ember Tooling
  - Unstable Ember Language Server | by lifeart
  - Visual Studio IntelliCode | by Microsoft
  - Markdown Preview Github Styling | by Matt Bierner

  <br><br><br>
  </details>

<br><br>
</details>

## Architecture

<details>
  <summary><strong>Frontend</strong></summary>

Our frontend applications are built with [Ember.js](https://emberjs.com/) and managed as a series of [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) with [lerna workspace tools](https://github.com/lerna/lerna).
The project directory contains several subdirectories that organize our various workspaces by type.

 - [Engines](https://github.com/ember-engines/ember-engines) are contained in the directory `engines/`
 - [Applications](https://guides.emberjs.com/release/getting-started/anatomy-of-an-ember-app/) are contained in the directory `apps/`
 - [Addons](https://cli.emberjs.com/release/writing-addons/) are contained in the directory `addons/`
 - **Tools** (custom tooling packages) are contained in the directory `tools/`

 Using Yarn and Lerna in this way allows us to author multiple applications, libraries and tools that are utilized by each other and maintained together.
 
 <br><br><br>
 </details>

<br><br><br><br>
 <details>
   <summary>.</summary>

  <style type="text/css">
    img.logo {
       padding: 0 5em 1em 5em;
       width: 100px;
       border-bottom: 2px solid #fcb045;
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
      border-bottom: 3px solid #fcb045;
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
