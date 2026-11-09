import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_VESTIGIA = "vestigia-dashboard";

export class VestigiaView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
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

		container.createEl("div", {
			text: "Your vault analysis will appear here.",
			cls: "vestigia-placeholder",
		});
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}
}
