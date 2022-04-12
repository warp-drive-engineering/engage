
# Release Guide

The following guide details the release process and infrastructure.

## Generating a Release Candidate

### Overview 

**Determining the next version number**

TODO description

**Bumping The Version**

The script automatically bumps the version of the project in the following locations to the new version.

  - package.json
  - lerna.json
  - [addons|apps|engines|tools]/*/package.json

**Generating and Moving Static Assets**

TODO description

**Generating Release Notes**

During a release, our automated script uses [lerna changelog](https://github.com/lerna/lerna-changelog) to generate release notes and add them to [./CHANGELOG.md](./CHANGELOG.md) by aggregating the commit messages and PR titles that have occurred since the prior minor or patch release. These messages are organized and presented utilizing [CI the enforced](./.github/workflows/enforce-pr-labels-canary.yml) [labeling system](https://github.com/bevager/fnb/labels?q=changelog).

 - `:memo: security` | :lock: Security Improvement
 - `:memo: feat` | :rocket: Enhancement
 - `:memo: bugfix` | :bug: Bug Fix
 - `:memo: perf` | :zap: Performance
 - `:memo: cleanup` | :shower: Deprecation Removal
 - `:memo: deprecation` | :evergreen_tree: New Deprecation
 - `:memo: doc` | :memo: Documentation
 - `:memo: test` | :goal_net: Test
 - `:memo: chore` | :house: Internal

**Tagging The Commit**

Once the version has been bumped, static assets generated, and changelog updated a commit is generated to preserve these changes. That commit is then [tagged](https://git-scm.com/book/en/v2/Git-Basics-Tagging) with
the same version number. The commit and the [tag](https://github.com/bevager/fnb/tags) are then pushed to github to preserve the history of what we've published and when.

**Generating A Release**

Once the commit has been tagged, our script publishes the tag as a new [Github Release](https://github.com/bevager/fnb/releases) with the associated release notes.

## Deploying/Publishing New Versions

TODO add tooling
