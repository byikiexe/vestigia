import { Plugin, WorkspaceLeaf } from "obsidian";
import { VestigiaView, VIEW_TYPE_VESTIGIA } from "./views/VestigiaView";

export default class VestigiaPlugin extends Plugin {
	async onload(): Promise<void> {
		console.log("[Vestigia] Plugin loaded");

		this.registerView(
			VIEW_TYPE_VESTIGIA,
			(leaf: WorkspaceLeaf) => new VestigiaView(leaf)
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
}
