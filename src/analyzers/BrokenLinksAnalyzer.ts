import type {
	App,
	LinkCache,
	FrontmatterLinkCache,
	TFile,
} from "obsidian";

import type { VaultAnalyzer } from "../core/VaultAnalyzer";
import type {
	AnalysisIssue,
	AnalysisResult,
} from "../core/AnalysisResult";

import type {
	BrokenReference,
	BrokenReferenceType,
} from "../core/BrokenReference";

export class BrokenLinksAnalyzer implements VaultAnalyzer {
	readonly id = "broken-links";
	readonly name = "Broken references";

	async analyze(app: App): Promise<AnalysisResult> {
		const startTime = performance.now();
		const issues: AnalysisIssue[] = [];

		let totalNoteReferences = 0;
		let brokenNoteReferences = 0;

		let totalAttachmentReferences = 0;
		let brokenAttachmentReferences = 0;

		for (const source of app.vault.getMarkdownFiles()) {
			const cache = app.metadataCache.getFileCache(source);

			if (!cache) continue;

			const links = [
				...(cache.links ?? []),
				...(cache.embeds ?? []),
				...(cache.frontmatterLinks ?? []),
			];

			for (const link of links) {
				const target = link.link;

				if (!target) continue;

				const [linkPath] = this.splitLink(target);

				const isAttachment = this.isAttachment(linkPath);

				if (isAttachment) {
					totalAttachmentReferences++;
				} else {
					totalNoteReferences++;
				}

				const reference = this.inspectLink(
					app,
					source,
					link,
				);

				if (!reference) continue;

				if (isAttachment) {
					brokenAttachmentReferences++;
				} else {
					brokenNoteReferences++;
				}

				issues.push({
					id: reference.id,
					ruleId: reference.type,
					severity: reference.severity,
					message: `${reference.type}: ${reference.target}`,
					filePath: reference.sourcePath,
					metadata: {
						target: reference.target,
						type: reference.type,
						position: reference.position,
					},
				});
			}
		}
		
		console.log("[Vestigia] Reference metrics", {
			totalNoteReferences,
			brokenNoteReferences,
			totalAttachmentReferences,
			brokenAttachmentReferences,
		});

		return {
			analyzerId: this.id,
			issues,
			durationMs: performance.now() - startTime,

			metrics: {
				totalNoteReferences,
				brokenNoteReferences,
				totalAttachmentReferences,
				brokenAttachmentReferences,
			},
		};
	}

	private inspectLink(
		app: App,
		source: TFile,
		link: LinkCache | FrontmatterLinkCache,
	): BrokenReference | null {
		const target = link.link;

		if (!target) return null;

		const [linkPath, fragment] = this.splitLink(target);

		const destination =
			linkPath === ""
				? source
				: app.metadataCache.getFirstLinkpathDest(
					linkPath,
					source.path,
				);

		if (!destination) {
			const type = this.isAttachment(linkPath)
				? "missing-attachment"
				: "missing-note";

			return this.createReference(
				source,
				target,
				type,
				link,
			);
		}

		if (!fragment) return null;

		const destinationCache =
			app.metadataCache.getFileCache(destination);

		if (!destinationCache) return null;

		if (fragment.startsWith("^")) {
			const blockId = fragment.substring(1);

			if (!destinationCache.blocks?.[blockId]) {
				return this.createReference(
					source,
					target,
					"missing-block",
					link,
				);
			}

			return null;
		}

		const headingExists =
			destinationCache.headings?.some(
				(heading) =>
					heading.heading.toLowerCase() ===
					fragment.toLowerCase(),
			);

		if (!headingExists) {
			return this.createReference(
				source,
				target,
				"missing-heading",
				link,
			);
		}

		return null;
	}

	private splitLink(
		target: string,
	): [string, string | null] {
		const index = target.indexOf("#");

		if (index === -1) {
			return [target, null];
		}

		return [
			target.substring(0, index),
			target.substring(index + 1),
		];
	}

	private isAttachment(path: string): boolean {
		return /\.[a-z0-9]+$/i.test(path) &&
			!path.toLowerCase().endsWith(".md");
	}

	private createReference(
		source: TFile,
		target: string,
		type: BrokenReferenceType,
		link: LinkCache | FrontmatterLinkCache,
	): BrokenReference {
		const position =
			"position" in link
				? {
					line: link.position.start.line,
					column: link.position.start.col,
				}
				: undefined;

		const location =
			"position" in link
				? String(link.position.start.offset)
				: `frontmatter:${target}`;

		return {
			id: `${this.id}:${source.path}:${location}:${target}`,
			type,
			severity:
				type === "missing-note"
					? "info"
					: "warning",
			sourcePath: source.path,
			target,
			...(position ? { position } : {}),
		};
	}
}
