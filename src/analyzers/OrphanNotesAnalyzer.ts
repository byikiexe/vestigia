import type { App, TFile } from "obsidian";
import type { VaultAnalyzer } from "../core/VaultAnalyzer";
import type { AnalysisResult, AnalysisIssue } from "../core/AnalysisResult";

export class OrphanNotesAnalyzer implements VaultAnalyzer {
    readonly id = "orphan-notes";
    readonly name = "Orphan notes";

    async analyze(app: App): Promise<AnalysisResult> {
        const startTime = performance.now();
        const notes = app.vault.getMarkdownFiles();

        const incomingLinks = new Set<string>();

        for (const source of notes) {
            const cache = app.metadataCache.getFileCache(source);

            if (!cache) continue;

            const links = [
                ...(cache.links ?? []),
                ...(cache.embeds ?? []),
                ...(cache.frontmatterLinks ?? []),
            ];

            for (const link of links) {
                const destination = app.metadataCache.getFirstLinkpathDest(
                    link.link,
                    source.path
                );

                if (destination && destination.path !== source.path) {
                    incomingLinks.add(destination.path);
                }
            }
        }

        const issues: AnalysisIssue[] = notes
            .filter((note: TFile) => !incomingLinks.has(note.path))
            .map((note: TFile) => ({
                id: `${this.id}:${note.path}`,
                ruleId: this.id,
                severity: "info",
                message: "This note has no incoming links.",
                filePath: note.path,
            }));

        return {
            analyzerId: this.id,
            issues,
            durationMs: performance.now() - startTime,
        };
    }
}
