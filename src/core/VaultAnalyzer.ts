import type { App } from "obsidian";
import type { AnalysisResult } from "./AnalysisResult";

export interface VaultAnalyzer {
    readonly id: string;
    readonly name: string;

    analyze(app: App): Promise<AnalysisResult>;
}
