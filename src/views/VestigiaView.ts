import { ItemView, WorkspaceLeaf } from "obsidian";
import type { VaultStatisticsService } from "../core/VaultStatisticsService";

export const VIEW_TYPE_VESTIGIA = "vestigia-dashboard";

export class VestigiaView extends ItemView {
    constructor(
        leaf: WorkspaceLeaf,
        private readonly statisticsService: VaultStatisticsService
    ) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_VESTIGIA;
    }

    getDisplayText(): string {
        return "Vestigia";
    }

    getIcon(): string {
        return "fingerprint-pattern";
    }

    async onOpen(): Promise<void> {
        this.render();
    }

    private render(): void {
        const container = this.contentEl;

        container.empty();
        container.addClass("vestigia-dashboard");

        container.createEl("h2", {
            text: "vestigia.",
        });

        container.createEl("p", {
            text: "Trace what your knowledge leaves behind.",
            cls: "vestigia-subtitle",
        });

        const statistics = this.statisticsService.collect();

        const overview = container.createDiv({
            cls: "vestigia-overview",
        });

        this.createStatCard(
            overview,
            "Notes",
            statistics.totalNotes
        );

        this.createStatCard(
            overview,
            "Folders",
            statistics.totalFolders
        );

        this.createStatCard(
            overview,
            "Attachments",
            statistics.totalAttachments
        );

        this.createStatCard(
            overview,
            "Total files",
            statistics.totalFiles
        );
    }

    private createStatCard(
        container: HTMLElement,
        label: string,
        value: number
    ): void {
        const card = container.createDiv({
            cls: "vestigia-stat-card",
        });

        card.createEl("span", {
            text: label,
            cls: "vestigia-stat-label",
        });

        card.createEl("strong", {
            text: value.toLocaleString(),
            cls: "vestigia-stat-value",
        });
    }

    async onClose(): Promise<void> {
        this.contentEl.empty();
    }
}
