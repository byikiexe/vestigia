import type { App } from "obsidian";
import type { AnalysisResult } from "./AnalysisResult";
import type { VaultAnalyzer } from "./VaultAnalyzer";

export class AnalysisService {
    private analyzers: VaultAnalyzer[] = [];

    constructor(private readonly app: App) {}

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

        for (const analyzer of this.analyzers) {
            const result = await analyzer.analyze(this.app);
            results.push(result);
        }

        return results;
    }
}
