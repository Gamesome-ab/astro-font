# @gamesome/font

A monorepo for font optimization packages that generate `@font-face` CSS with scaled fallback fonts to reduce [CLS](https://web.dev/articles/cls). Uses the same algorithm as `@next/font` via [Capsize](https://seek-oss.github.io/capsize/).

## Packages

| Package                                                            | Description                                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [@gamesome/astro-font](packages/astro-font/)                       | Astro integration for optimized font loading with preloading and locale support    |
| [@gamesome/style-dictionary-font](packages/style-dictionary-font/) | Style Dictionary v4 format and action for generating font CSS from design tokens   |
| [@gamesome/core-font](packages/core-font/)                         | Shared core logic for CSS generation and fallback font scaling (used by the above) |

## Examples

| Example                                                    | Description                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [astro-basic](examples/astro-basic/)                       | Astro app showcasing three fonts (Rubik, Sora, Lora) with the astro-font integration |
| [style-dictionary-basic](examples/style-dictionary-basic/) | React + Vite app using Style Dictionary tokens for the same three fonts              |

## Development

```bash
git clone https://github.com/Gamesome-ab/astro-font.git
cd astro-font
pnpm install
pnpm build
pnpm test
```

### Running examples

```bash
# Astro example
pnpm --filter example-astro-basic dev

# Style Dictionary example
pnpm --filter example-style-dictionary-basic dev
```

## Releasing

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versioning, changelogs, and publishing. All three packages are published to npm under the `@gamesome` scope.

### Overview

The release process has three steps:

1. **Add changesets** — declare what changed and how it should be versioned
2. **Version packages** — consume changesets to bump versions and generate changelogs
3. **Publish** — build, test, and publish to npm with git tags

### Step 1: Add a changeset

After making changes to any package, run:

```bash
pnpm changeset
```

This prompts you to:
1. Select which packages are affected
2. Choose a semver bump type for each (patch / minor / major)
3. Write a summary of the change

A markdown file is created in `.changeset/` — **commit this file with your PR**. You can add multiple changesets per PR if there are unrelated changes.

Make sure to either squash changes, or add this changeset in the same commit as your code changes. `version-packages` will reference the commit that the changeset file is in!

#### Example

```
$ pnpm changeset
🦋  Which packages would you like to include? @gamesome/astro-font
🦋  Which packages should have a major bump? No packages
🦋  Which packages should have a minor bump? @gamesome/astro-font
🦋  Summary: Add locale-based font loading support
🦋
🦋  === Summary of changesets ===
🦋  minor: @gamesome/astro-font
🦋
🦋  Created .changeset/brave-dogs-learn.md
```

#### Dependency handling

If `@gamesome/core-font` is bumped, changesets automatically bumps `@gamesome/astro-font` and `@gamesome/style-dictionary-font` too (configured via `updateInternalDependencies: "patch"` in `.changeset/config.json`).

### Step 2: Version packages

When you're ready to release (typically after merging PRs that contain changesets):

```bash
pnpm version-packages
```

This:
- Reads all pending `.changeset/*.md` files
- Bumps `version` in each affected `package.json`
- Updates (or creates) `CHANGELOG.md` in each affected package
- Deletes the consumed changeset files

Review the changes, then commit:

```bash
git add .
git commit -m "chore: version packages"
```

Create a PR for this version bump and merge it.

### Step 3: Publish to npm

After the version bump is merged to `main`:

```bash
pnpm release
```

This runs `build → test → changeset publish`. Changeset publish will:
- Publish each package whose version isn't already on npm
- Create a **git tag** per published package (e.g. `@gamesome/core-font@0.1.0`)
- Push tags to the remote

> pnpm automatically replaces `workspace:*` references with the actual version of `@gamesome/core-font` when publishing.

### Quick reference

| Command                 | What it does                                 |
| ----------------------- | -------------------------------------------- |
| `pnpm changeset`        | Add a changeset (do this in your PR)         |
| `pnpm version-packages` | Bump versions + generate changelogs          |
| `pnpm release`          | Build, test, publish to npm, create git tags |

### Tips

- **Multiple changesets per PR are fine** — if a PR fixes a bug in core-font and adds a feature to astro-font, add two separate changesets
- **Empty changesets** — if a PR doesn't need a version bump (docs, CI, examples), skip `pnpm changeset` or run `pnpm changeset --empty` to explicitly mark it as not needing a release
- **Pre-releases** — changesets supports pre-release mode via `pnpm changeset pre enter <tag>` (e.g. `alpha`, `beta`). See [changesets pre-release docs](https://github.com/changesets/changesets/blob/main/docs/prereleases.md)

## License

MIT
