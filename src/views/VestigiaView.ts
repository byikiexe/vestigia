import { ItemView, Notice, TFile, WorkspaceLeaf, setIcon, Menu, } from "obsidian";
import type { VaultStatisticsService } from "../core/VaultStatisticsService";
import { AnalysisService } from "../core/AnalysisService";
import type { AnalysisIssue, AnalysisResult, } from "../core/AnalysisResult";
import type { BrokenReferenceType, } from "../core/BrokenReference";
import type { VaultStatistics } from "../core/VaultStatistics";


export const VIEW_TYPE_VESTIGIA = "vestigia-dashboard";

interface ReferenceActions {
	ignore(sourcePath: string, target: string): Promise<void>;
	isIgnored(sourcePath: string, target: string): boolean;
}

export class VestigiaView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private readonly statisticsService: VaultStatisticsService,
		private readonly analysisService: AnalysisService,
		private readonly referenceActions: ReferenceActions
	) {
		super(leaf);
	}

	private scanButton: HTMLButtonElement | null = null;
	private overviewContainer: HTMLElement | null = null;
	private analysisContainer: HTMLElement | null = null;

	private isScanning = false;
	private scanGeneration = 0;
	private scanStatusTimeout: ReturnType<typeof setTimeout> | null = null;


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
		this.renderLayout();
		await this.scanVault();
	}

	private renderLayout(): void {
		const container = this.contentEl;

		container.empty();
		container.addClass("vestigia-dashboard");

		// Header
		const header = container.createDiv({
			cls: "vestigia-topbar",
		});

		const branding = header.createDiv({
			cls: "vestigia-branding",
		});

		const logo = branding.createEl("h2");

		logo.createSpan({ text: "vestigia" });

		logo.createSpan({
			text: ".",
			cls: "vestigia-logo-dot",
		});

		branding.createEl("p", {
			text: "Trace what your knowledge leaves behind.",
			cls: "vestigia-subtitle",
		});

		// Scan button
		this.scanButton = header.createEl("button", {
			cls: "vestigia-scan-button",
			attr: {
				type: "button",
				"aria-label": "Scan vault",
			},
		});

		this.scanButton.addEventListener("click", () => {
			void this.scanVault();
		});

		this.setScanStatus("idle");

		// Containers
		this.overviewContainer = container.createDiv({
			cls: "vestigia-overview",
		});

		this.analysisContainer = container.createDiv({
			cls: "vestigia-analysis",
		});
	}

	private setScanStatus(
		status: "idle" | "scanning" | "complete" | "failed"
	): void {
		const button = this.scanButton;

		if (!button) return;

		const labels = {
			idle: "Scan vault",
			scanning: "Scanning...",
			complete: "Scan complete",
			failed: "Scan failed",
		};

		button.empty();

		const icon = button.createSpan({
			cls: "vestigia-scan-icon",
		});

		const iconName =
			status === "complete"
				? "check"
				: status === "failed"
					? "alert-circle"
					: "refresh-cw";

		setIcon(icon, iconName);

		button.createSpan({
			text: labels[status],
		});

		button.disabled = status === "scanning";

		button.setAttribute("aria-label", labels[status]);

		button.toggleClass("is-scanning", status === "scanning");
	}

	private async scanVault(): Promise<void> {
		if (this.isScanning) return;

		this.isScanning = true;

		const generation = ++this.scanGeneration;

		if (this.scanStatusTimeout !== null) {
			clearTimeout(this.scanStatusTimeout);
			this.scanStatusTimeout = null;
		}

		this.setScanStatus("scanning");

		try {
			const statistics = this.statisticsService.collect();

			const results = await this.analysisService.run();

			// Ignore results from a closed or replaced view.
			if (
				generation !== this.scanGeneration ||
				!this.contentEl.isConnected
			) {
				return;
			}

			this.updateDashboard(statistics, results);

			this.setScanStatus("complete");
		} catch (error) {
			if (generation !== this.scanGeneration) return;

			console.error("[Vestigia] Vault scan failed:", error);

			this.setScanStatus("failed");

			new Notice("Vestigia: vault scan failed.");
		} finally {
			if (generation === this.scanGeneration) {
				this.isScanning = false;

				this.scanStatusTimeout = setTimeout(() => {
					if (generation === this.scanGeneration) {
						this.setScanStatus("idle");
					}

					this.scanStatusTimeout = null;
				}, 3000);
			}
		}
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
		++this.scanGeneration;

		this.isScanning = false;

		if (this.scanStatusTimeout !== null) {
			clearTimeout(this.scanStatusTimeout);
			this.scanStatusTimeout = null;
		}

		this.scanButton = null;
		this.overviewContainer = null;
		this.analysisContainer = null;

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
	private updateDashboard(
		statistics: VaultStatistics,
		results: AnalysisResult[]
	): void {
		if (!this.overviewContainer || !this.analysisContainer) {
			return;
		}

		// Update statistics
		this.overviewContainer.empty();

		this.createStatCard(
			this.overviewContainer,
			"Notes",
			statistics.totalNotes
		);

		this.createStatCard(
			this.overviewContainer,
			"Folders",
			statistics.totalFolders
		);

		this.createStatCard(
			this.overviewContainer,
			"Attachments",
			statistics.totalAttachments
		);

		this.createStatCard(
			this.overviewContainer,
			"Total files",
			statistics.totalFiles
		);

		// Update analysis results
		this.analysisContainer.empty();

		const orphanResult = results.find(
			(result) => result.analyzerId === "orphan-notes"
		);

		const brokenResult = results.find(
			(result) => result.analyzerId === "broken-links"
		);

		if (orphanResult) {
			this.renderOrphanNotes(
				this.analysisContainer,
				orphanResult
			);
		}

		if (brokenResult) {
			const activeIssues = brokenResult.issues.filter((issue) => {
				const sourcePath = issue.filePath;
				const target = issue.metadata?.target;

				if (!sourcePath || typeof target !== "string") {
					return true;
				}

				return !this.referenceActions.isIgnored(
					sourcePath,
					target
				);
			});

			this.renderBrokenReferences(this.analysisContainer, {
				...brokenResult,
				issues: activeIssues,
			});
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

		// Contenedor de la referencia
		const row = container.createDiv({
			cls: "vestigia-fractures-row",
		});

		// Botón principal: navegar a la referencia
		const item = row.createEl("button", {
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
			text: String(issue.metadata?.target ?? issue.message),
			cls: "vestigia-fractures-item-target",
		});

		content.createEl("span", {
			text: issue.severity === "info"
				? "Informational"
				: "Warning",
			cls: "vestigia-fractures-item-severity",
		});

		item.addEventListener("click", () => {
			void this.navigateToReference(issue);
		});

		// Botón de acciones
		const menuButton = row.createEl("button", {
			cls: "vestigia-reference-menu",
			attr: {
				type: "button",
				"aria-label": "Reference actions",
				"aria-haspopup": "menu",
			},
		});

		setIcon(menuButton, "ellipsis");

		menuButton.addEventListener("click", (event) => {
			event.stopPropagation();

			const menu = new Menu();

			menu.addItem((menuItem) => {
				menuItem
					.setTitle("Ignore reference")
					.setIcon("eye-off")
					.onClick(() => {
						void this.handleIgnoreReference(issue);
					});
			});

			menu.showAtMouseEvent(event);
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

	private async handleIgnoreReference(
		issue: AnalysisIssue
	): Promise<void> {
		const sourcePath = issue.filePath;
		const target = issue.metadata?.target;

		if (!sourcePath || typeof target !== "string") {
			new Notice("Unable to ignore this reference.");
			return;
		}

		try {
			await this.referenceActions.ignore(sourcePath, target);

			new Notice("Reference ignored.");

			await this.scanVault();
		} catch (error) {
			console.error(
				"[Vestigia] Failed to ignore reference:",
				error
			);

			new Notice("Unable to ignore reference.");
		}
	}

}
