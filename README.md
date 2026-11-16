# vestigia.

**Trace what your knowledge leaves behind.**

vestigia is an Obsidian plugin that helps you explore and understand the structure of your vault.

Over time, notes accumulate, references break, and connections become harder to track. vestigia brings these structural details into focus through a minimal, purpose-built dashboard.

## Features

**Vault Health**
Explore a structural health score based on reference integrity, note connectivity, and attachment integrity.

**Orphan Notes**
Discover notes without incoming references and navigate directly to them.

**Broken References**
Identify unresolved links to notes, headings, blocks, and attachments, including references stored in YAML properties.

**Ignored References**
Ignore known references without deleting them from your vault. Restore them whenever needed.

**Manual Vault Scanning**
Run an analysis when you need it, without continuously scanning your vault.

**Paginated Results**
Explore large collections of findings without overwhelming the interface.

## Installation

Vestigia is currently preparing for its first release on the Obsidian Community Plugins directory.

Until it becomes available, you can install it manually.

### Manual installation

1. Visit the [Vestigia GitHub Releases](https://github.com/byikiexe/vestigia/releases) page.
2. Download the following files from the latest release:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Open your Obsidian vault and navigate to its plugins directory:

   `.obsidian/plugins/`

4. Create a new folder named `vestigia`.
5. Copy the three downloaded files into that folder.

Your directory structure should look like this:

```text
.obsidian/
└── plugins/
    └── vestigia/
        ├── main.js
        ├── manifest.json
        └── styles.css
```

6. Restart Obsidian or reload your community plugins.
7. Open **Settings → Community plugins**.
8. Find **Vestigia** and enable it.

Vestigia is now ready to analyze your vault.

### Community plugin installation

Vestigia is available in the official Obsidian Community Plugins directory. You can install it directly from Obsidian:

1. Open **Settings → Community plugins**.
2. Select **Browse**.
3. Search for **Vestigia**.
4. Select **Install**, then **Enable**.

## Usage

Vestigia provides a dedicated dashboard for exploring the structural health of your Obsidian vault.

### 1. Open Vestigia

Open the Vestigia dashboard in Obsidian to access an overview of your vault and its structural analysis.

### 2. Scan your vault

Click **Scan vault** to start an analysis.

Vestigia examines your notes and references, then updates the dashboard with the latest results.

Scans are initiated manually, giving you control over when your vault is analyzed.

### 3. Explore Vault Health

The **Vault Health** section provides an overall structural health score, along with three individual dimensions:

- **Reference integrity** — The proportion of note references that resolve successfully.
- **Note connectivity** — The proportion of notes that have at least one incoming reference.
- **Attachment integrity** — The proportion of attachment references that resolve successfully.

The score reflects structural characteristics of your vault. It is not a measure of the quality or usefulness of your knowledge.

### 4. Review your vault overview

The **Overview** section displays four statistics:

- **Notes** — Total Markdown notes.
- **Folders** — Total folders.
- **Attachments** — Total attachment files.
- **Total files** — Total files in the vault.

These metrics provide a quick snapshot of your vault's contents.

### 5. Discover orphan notes

Navigate to **Traces** to find notes without incoming references.

Select a note to open it directly in Obsidian.

An orphan note is not necessarily a problem. Some notes are intentionally independent.

### 6. Identify broken references

Navigate to **Fractures** to explore references that Vestigia could not resolve.

These may include links to missing notes, headings, blocks, or attachments.

Select a finding to navigate to its source note and investigate the reference.

### 7. Ignore or restore references

Not every unresolved reference requires action.

Use the actions menu associated with a broken reference to ignore it.

Ignored references are hidden from the active findings but remain available for review.

You can show ignored references and restore them whenever needed.

**Note:** Ignoring a reference does not resolve it and does not improve the Vault Health Score.

### 8. Navigate large result sets

Vestigia paginates analysis results to keep the dashboard responsive, even when working with large vaults.

Use the pagination controls to move between findings.

Each page displays up to 25 results.

### 9. Refresh your analysis

After modifying notes or fixing broken references, click **Scan vault** again to update the results and recalculate Vault Health.

## Understanding Vault Health

Vestigia calculates a structural health score to help you understand how notes, references, and attachments are connected within your vault.

The score ranges from **0% to 100%** and is calculated using three weighted dimensions.

### Health dimensions

| Dimension | Weight | Description |
|---|---|---|
| Reference integrity | 50% | Measures how many note references resolve successfully. |
| Note connectivity | 30% | Measures how many notes have at least one incoming reference. |
| Attachment integrity | 20% | Measures how many attachment references resolve successfully. |

Each dimension produces an independent score between 0% and 100%.

### How the score is calculated

**Reference integrity**

Measures the proportion of valid note references.

`(Valid note references / Total note references) × 100`

**Note connectivity**

Measures the proportion of notes that are not classified as orphan notes.

`(Connected notes / Total notes) × 100`

A note is considered connected when at least one incoming reference points to it.

**Attachment integrity**

Measures the proportion of valid attachment references.

`(Valid attachment references / Total attachment references) × 100`

### Overall health score

When all three dimensions contain sufficient data, Vestigia calculates the weighted average:

`Health = (Reference integrity × 0.50) + (Note connectivity × 0.30) + (Attachment integrity × 0.20)`

For example, consider a vault with the following results:

| Dimension | Score |
|---|---:|
| Reference integrity | 90% |
| Note connectivity | 60% |
| Attachment integrity | 100% |

The overall score would be:

`(90 × 0.50) + (60 × 0.30) + (100 × 0.20) = 83%`

The resulting **Vault Health Score is 83%**.

### Missing data and N/A values

Not every vault contains all types of references.

When a dimension has no applicable data, Vestigia displays **N/A** instead of assigning an artificial score.

For example, if your vault contains no attachment references, Attachment integrity is marked as N/A.

Its weight is excluded from the calculation, and the remaining weights are normalized proportionally.

If Reference integrity is 90%, Note connectivity is 60%, and Attachment integrity is N/A:

`Health = ((90 × 0.50) + (60 × 0.30)) / (0.50 + 0.30) = 78.75%`

If no dimensions contain sufficient data, the overall Vault Health Score is displayed as **N/A**.

### Ignored references

Ignoring a broken reference does not change the Vault Health Score.

Vestigia continues to include ignored references in its structural metrics, even when they are hidden from active findings.

This ensures that the score reflects the actual state of your vault rather than the number of visible issues.

### Interpreting your score

A higher score generally indicates that more references resolve successfully and more notes are connected.

However, **a higher score does not necessarily mean a better knowledge base**.

Consider the following:

- Orphan notes can be intentional and valuable.
- Some unresolved references may be placeholders for future content.
- A small number of attachment references can make Attachment integrity particularly sensitive to individual broken links.
- Structural connectivity does not measure the relevance, accuracy, or usefulness of your notes.

Vault Health is intended as a diagnostic indicator, not an absolute measure of knowledge quality.

**Vestigia helps you understand your vault's structure. It does not tell you how to think or organize your knowledge.**

## Development

Vestigia is an open-source Obsidian plugin built with TypeScript and the official Obsidian Plugin API.

You can run it locally, explore its source code, and contribute improvements.

### Requirements

Before getting started, make sure you have:

- [Node.js](https://nodejs.org/) and npm installed.
- [Git](https://git-scm.com/) installed.
- [Obsidian](https://obsidian.md/) installed.
- A dedicated Obsidian vault for development and testing.

Using a separate test vault is recommended to avoid affecting your personal notes during development.

### Clone the repository

Clone Vestigia from GitHub:

```bash
git clone https://github.com/byikiexe/vestigia.git
cd vestigia
```

### Install dependencies

Install the project's dependencies:

```bash
npm install
```

### Start development

Run the development build:

```bash
npm run dev
```

This starts the build process in watch mode, automatically recompiling the plugin when source files change.

### Build for production

Generate the production build:

```bash
npm run build
```

The compiled plugin is generated as `main.js`.

Together with `manifest.json` and `styles.css`, this file forms the distributable Obsidian plugin.

### Test locally

To test Vestigia in Obsidian:

1. Open a dedicated test vault.
2. Navigate to its `.obsidian/plugins/` directory.
3. Create a folder named `vestigia`.
4. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
5. Open Obsidian and enable Vestigia under **Settings → Community plugins**.
6. Reload the plugin after rebuilding to test your changes.

### Project structure

The main source code is organized into the following directories:

```text
src/
├── analyzers/
│   ├── BrokenLinksAnalyzer.ts
│   └── OrphanNotesAnalyzer.ts
├── core/
│   ├── AnalysisResult.ts
│   ├── AnalysisService.ts
│   ├── IgnoredReferencesService.ts
│   ├── VaultHealth.ts
│   ├── VaultHealthService.ts
│   ├── VaultStatistics.ts
│   └── VaultStatisticsService.ts
├── views/
│   └── VestigiaView.ts
└── main.ts
```

**Analyzers** contain the logic used to inspect vault content and identify structural findings.

**Core** contains shared analysis services, data structures, statistics, and health calculations.

**Views** contains the dashboard interface and presentation logic.

**main.ts** provides the plugin's entry point and integrates its components with Obsidian.

### Development guidelines

When contributing to Vestigia:

- Keep changes focused and maintainable.
- Follow the existing TypeScript architecture.
- Avoid unnecessary dependencies.
- Respect Obsidian's native interface and theme variables.
- Test changes against a dedicated vault.
- Verify that structural metrics remain consistent after modifying analysis logic.

For changes affecting Vault Health, ensure that ignored references continue to contribute to the underlying structural metrics.

### Reporting issues

If you encounter a bug, unexpected behavior, or performance problem, please open an issue in the [GitHub issue tracker](https://github.com/byikiexe/vestigia/issues).

When possible, include the Obsidian version, Vestigia version, steps to reproduce the issue, and the expected and actual behavior.

## Contributing

Contributions, bug reports, and suggestions are welcome.

If you find an issue or have an idea for improving vestigia, feel free to open an issue or submit a pull request on [GitHub](https://github.com/byikiexe/vestigia).

## License

vestigia is open-source software released under the [MIT License](LICENSE).

---

**Made with ❤️ by [byiki.exe](https://byikiexe.com/)**

*Trace what your knowledge leaves behind.*
