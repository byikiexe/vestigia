import { ItemView, Notice, TFile, WorkspaceLeaf, } from "obsidian";
import type { VaultStatisticsService } from "../core/VaultStatisticsService";
import { AnalysisService } from "../core/AnalysisService";
import type { AnalysisIssue, AnalysisResult, } from "../core/AnalysisResult";
import type { BrokenReferenceType, } from "../core/BrokenReference";

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

		void this.renderAnalysis(container);
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

	private renderOrphanNotes(
		container: HTMLElement,
		orphanResult: AnalysisResult
	): void {
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

	private async renderAnalysis(
		container: HTMLElement
	): Promise<void> {
		const results = await this.analysisService.run();

		if (!container.isConnected) return;

		const orphanResult = results.find(
			(result) => result.analyzerId === "orphan-notes"
		);

		const brokenResult = results.find(
			(result) => result.analyzerId === "broken-links"
		);

		if (orphanResult) {
			this.renderOrphanNotes(container, orphanResult);
		}

		if (brokenResult) {
			this.renderBrokenReferences(container, brokenResult);
		}
	}
	private renderBrokenReferences(
		container: HTMLElement,
		result: AnalysisResult
	): void {
		const section = container.createDiv({
			cls: "vestigia-issues-section vestigia-fractures",
		});

		const header = section.createDiv({
			cls: "vestigia-section-header",
		});

		header.createEl("span", {
			text: "03 / FRACTURES",
			cls: "vestigia-section-eyebrow",
		});

		const titleRow = header.createDiv({
			cls: "vestigia-section-title-row",
		});

		titleRow.createEl("h3", {
			text: "Broken references",
		});

		titleRow.createEl("span", {
			text: String(result.issues.length).padStart(2, "0"),
			cls: "vestigia-issue-count",
		});

		header.createEl("p", {
			text: "Connections that no longer resolve.",
			cls: "vestigia-section-description",
		});

		if (result.issues.length === 0) {
			const emptyState = section.createDiv({
				cls: "vestigia-fractures-empty",
			});

			emptyState.createEl("span", {
				text: "ALL CONNECTIONS RESOLVED",
				cls: "vestigia-fractures-empty-title",
			});

			emptyState.createEl("p", {
				text: "No broken references detected in your vault.",
			});

			return;
		}

		const groups = new Map<string, AnalysisIssue[]>();

		for (const issue of result.issues) {
			if (!issue.filePath) continue;

			const group = groups.get(issue.filePath) ?? [];
			group.push(issue);
			groups.set(issue.filePath, group);
		}

		for (const [sourcePath, issues] of groups) {
			const group = section.createDiv({
				cls: "vestigia-fractures-group",
			});

			const groupHeader = group.createDiv({
				cls: "vestigia-fractures-group-header",
			});

			groupHeader.createEl("span", {
				text: sourcePath.split("/").pop() ?? sourcePath,
				cls: "vestigia-fractures-source",
			});

			groupHeader.createEl("span", {
				text: String(issues.length).padStart(2, "0"),
				cls: "vestigia-fractures-group-count",
			});

			for (const issue of issues) {
				this.renderBrokenReferenceItem(group, issue);
			}
		}
	}

	private renderBrokenReferenceItem(
		container: HTMLElement,
		issue: AnalysisIssue
	): void {
		const type = issue.ruleId as BrokenReferenceType;

		const labels: Record<BrokenReferenceType, string> = {
			"missing-note": "Missing note",
			"missing-attachment": "Missing attachment",
			"missing-heading": "Missing heading",
			"missing-block": "Missing block",
		};

		const item = container.createEl("button", {
			cls: "vestigia-fractures-item",
			attr: {
				type: "button",
				"aria-label": `Open source for ${String(
					issue.metadata?.target ?? issue.message
				)}`,
			},
		});

		const indicator = item.createSpan({
			cls: `vestigia-fractures-indicator vestigia-severity-${issue.severity}`,
		});

		indicator.setAttribute("aria-hidden", "true");

		const content = item.createDiv({
			cls: "vestigia-fractures-item-content",
		});

		content.createEl("span", {
			text: labels[type] ?? "Broken reference",
			cls: "vestigia-fractures-item-type",
		});

		content.createEl("span", {
			text: String(
				issue.metadata?.target ?? issue.message
			),
			cls: "vestigia-fractures-item-target",
		});

		content.createEl("span", {
			text:
				issue.severity === "info"
					? "Informational"
					: "Warning",
			cls: "vestigia-fractures-item-severity",
		});

		item.addEventListener("click", () => {
			void this.navigateToReference(issue);
		});
	}

	private async navigateToReference(
		issue: AnalysisIssue
	): Promise<void> {
		const sourcePath = issue.filePath;

		if (!sourcePath) {
			new Notice("Source file not available.");
			return;
		}

		const source = this.app.vault.getAbstractFileByPath(
			sourcePath
		);

		if (!(source instanceof TFile)) {
			new Notice("Source file no longer exists.");
			return;
		}

		try {
			const leaf = this.app.workspace.getLeaf("tab");

			await leaf.openFile(source, {
				active: true,
			});

			const position = issue.metadata?.position;

			if (
				position &&
				typeof position === "object" &&
				"line" in position &&
				"column" in position &&
				typeof position.line === "number" &&
				typeof position.column === "number"
			) {
				const editor = this.app.workspace.activeEditor?.editor;

				if (editor) {
					editor.setCursor({
						line: position.line,
						ch: position.column,
					});

					editor.scrollIntoView(
						{
							from: {
								line: position.line,
								ch: position.column,
							},
							to: {
								line: position.line,
								ch: position.column,
							},
						},
						true
					);

					editor.focus();
				}
			}
		} catch (error) {
			console.error(
				"[Vestigia] Failed to navigate to reference:",
				error
			);

			new Notice("Unable to open the source note.");
		}
	}

	
}
