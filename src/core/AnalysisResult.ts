export type IssueSeverity = "info" | "warning" | "error";

export interface AnalysisIssue {
    id: string;
    ruleId: string;
    severity: IssueSeverity;
    message: string;
    filePath?: string;
}

export interface AnalysisResult {
    analyzerId: string;
    issues: AnalysisIssue[];
    durationMs: number;
}
