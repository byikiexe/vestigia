import { ItemView, WorkspaceLeaf } from "obsidian";
import type { VaultStatisticsService } from "../core/VaultStatisticsService";
import { AnalysisService } from "../core/AnalysisService";

export const VIEW_TYPE_VESTIGIA = "vestigia-dashboard";

export class VestigiaView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private readonly statisticsService: VaultStatisticsService,
		private readonly analysisService: AnalysisService
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

		void this.renderOrphanNotes(container);
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

	private async renderOrphanNotes(
		container: HTMLElement
	): Promise<void> {
		const results = await this.analysisService.run();

		const orphanResult = results.find(
			(result) => result.analyzerId === "orphan-notes"
		);

		if (!orphanResult) return;

		const section = container.createDiv({
			cls: "vestigia-issues-section",
		});

		const sectionHeader = section.createDiv({
			cls: "vestigia-section-header",
		});

		sectionHeader.createEl("span", {
			text: "02 / TRACES",
			cls: "vestigia-section-eyebrow",
		});

		const titleRow = sectionHeader.createDiv({
			cls: "vestigia-section-title-row",
		});

		titleRow.createEl("h3", {
			text: "Orphan notes",
		});

		titleRow.createEl("span", {
			text: String(orphanResult.issues.length).padStart(2, "0"),
			cls: "vestigia-issue-count",
		});

		sectionHeader.createEl("p", {
			text: "Notes without incoming references.",
			cls: "vestigia-section-description",
		});

		for (const issue of orphanResult.issues) {
			if (!issue.filePath) continue;

			const filePath = issue.filePath;

			const item = section.createEl("button", {
				cls: "vestigia-issue-item",
				attr: {
					type: "button",
					"aria-label": `Open ${filePath}`,
				},
			});

			const fileName = filePath.split("/").pop() ?? filePath;
			const displayName = fileName.replace(/\.md$/i, "");

			const content = item.createDiv({
				cls: "vestigia-issue-content",
			});

			content.createEl("span", {
				text: displayName,
				cls: "vestigia-issue-name",
			});

			content.createEl("span", {
				text: filePath,
				cls: "vestigia-issue-path",
			});

			item.addEventListener("click", () => {
				void this.app.workspace.openLinkText(
					filePath,
					"",
					true
				);
			});
		}
	}
}
