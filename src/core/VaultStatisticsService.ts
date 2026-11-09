import { TFolder, type App } from "obsidian";
import type { VaultStatistics } from "./VaultStatistics";

export class VaultStatisticsService {
    constructor(private readonly app: App) {}

    collect(): VaultStatistics {
        const files = this.app.vault.getFiles();
        const notes = this.app.vault.getMarkdownFiles();

        const folders = this.app.vault
            .getAllLoadedFiles()
            .filter(
                (file): file is TFolder =>
                    file instanceof TFolder &&
                    file.parent !== null
            );

        return {
            totalNotes: notes.length,
            totalFolders: folders.length,
            totalAttachments: files.length - notes.length,
            totalFiles: files.length,
        };
    }
}
