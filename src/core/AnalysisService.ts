import type { App } from "obsidian";
import type { AnalysisResult } from "./AnalysisResult";
import type { VaultAnalyzer } from "./VaultAnalyzer";

export class AnalysisService {
	private analyzers: VaultAnalyzer[] = [];

	constructor(private readonly app: App) { }

	registerAnalyzer(analyzer: VaultAnalyzer): void {
		if (this.analyzers.some((item) => item.id === analyzer.id)) {
			throw new Error(
				`Analyzer "${analyzer.id}" is already registered.`
			);
		}

		this.analyzers.push(analyzer);
	}

	async run(): Promise<AnalysisResult[]> {
		const results: AnalysisResult[] = [];
		const startTime = performance.now();

		console.group("[Vestigia] Vault analysis");

		try {
			for (const analyzer of this.analyzers) {
				const analyzerStart = performance.now();

				const result = await analyzer.analyze(this.app);

				const duration = performance.now() - analyzerStart;

				results.push(result);

				console.log(
					`${analyzer.name}: ${duration.toFixed(2)} ms`,
					{
						issues: result.issues.length,
						durationMs: duration,
					}
				);
			}

			console.log(
				`Total analysis: ${(performance.now() - startTime).toFixed(2)} ms`
			);

			return results;
		} finally {
			console.groupEnd();
		}
	}
}
