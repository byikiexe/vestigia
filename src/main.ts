import { Plugin, WorkspaceLeaf } from "obsidian";
import { VestigiaView, VIEW_TYPE_VESTIGIA } from "./views/VestigiaView";
import { AnalysisService } from "./core/AnalysisService";
import { VaultStatisticsService } from "./core/VaultStatisticsService";
import { OrphanNotesAnalyzer } from "./analyzers/OrphanNotesAnalyzer";
import { BrokenLinksAnalyzer } from "./analyzers/BrokenLinksAnalyzer";
import { IgnoredReferencesService } from "./core/IgnoredReferencesService";
import { DEFAULT_SETTINGS, type VestigiaSettings, } from "./core/VestigiaSettings";

export default class VestigiaPlugin extends Plugin {
	private analysisService!: AnalysisService;
	private statisticsService!: VaultStatisticsService;
	private ignoredReferencesService!: IgnoredReferencesService;
	private settings: VestigiaSettings = { ...DEFAULT_SETTINGS, };
	private saveQueue: Promise<void> = Promise.resolve();


	private async loadSettings(): Promise<void> {
		const savedData = await this.loadData();

		const ignoredReferences = Array.isArray(
			savedData?.ignoredReferences
		)
			? savedData.ignoredReferences.filter(
				(reference: unknown) =>
					typeof reference === "object" &&
					reference !== null &&
					"sourcePath" in reference &&
					"target" in reference &&
					typeof reference.sourcePath === "string" &&
					typeof reference.target === "string"
			)
			: [];

		this.settings = {
			ignoredReferences,
		};

		this.ignoredReferencesService.load(
			this.settings.ignoredReferences
		);
	}

	private async saveSettings(): Promise<void> {
		const snapshot: VestigiaSettings = {
			ignoredReferences:
				this.ignoredReferencesService.getAll(),
		};

		const save = this.saveQueue.then(() =>
			this.saveData(snapshot)
		);

		this.saveQueue = save.catch((error: unknown) => {
			console.error(
				"[Vestigia] Failed to save settings:",
				error
			);
		});

		await save;
	}

	async onload(): Promise<void> {
		this.analysisService = new AnalysisService(this.app);

		this.statisticsService = new VaultStatisticsService(
			this.app
		);

		this.ignoredReferencesService =
			new IgnoredReferencesService();

		await this.loadSettings();

		this.analysisService.registerAnalyzer(
			new OrphanNotesAnalyzer()
		);

		this.analysisService.registerAnalyzer(
			new BrokenLinksAnalyzer()
		);

		this.registerView(
			VIEW_TYPE_VESTIGIA,
			(leaf: WorkspaceLeaf) =>
				new VestigiaView(
					leaf,
					this.statisticsService,
					this.analysisService
				)
		);

		this.addRibbonIcon("fingerprint-pattern", "Open Vestigia", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-dashboard",
			name: "Open dashboard",
			callback: () => {
				void this.activateView();
			},
		});



	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_VESTIGIA)[0];

		if (!leaf) {
			leaf = workspace.getLeaf("tab");

			await leaf.setViewState({
				type: VIEW_TYPE_VESTIGIA,
				active: true,
			});
		}

		await workspace.revealLeaf(leaf);
	}

	onunload(): void {
		console.log("[Vestigia] Plugin unloaded");
	}

	async ignoreReference(
		sourcePath: string,
		target: string
	): Promise<void> {
		this.ignoredReferencesService.ignore(
			sourcePath,
			target
		);

		await this.saveSettings();
	}

	async restoreReference(
		sourcePath: string,
		target: string
	): Promise<void> {
		this.ignoredReferencesService.restore(
			sourcePath,
			target
		);

		await this.saveSettings();
	}

}
