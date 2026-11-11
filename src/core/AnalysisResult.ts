export type IssueSeverity = "info" | "warning" | "error";

export interface AnalysisIssue {
    id: string;
    ruleId: string;
    severity: IssueSeverity;
    message: string;
    filePath?: string;
	metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
    analyzerId: string;
    issues: AnalysisIssue[];
    durationMs: number;

    metrics?: AnalysisMetrics;
}

export interface AnalysisMetrics {
    totalNoteReferences?: number;
    brokenNoteReferences?: number;

    totalAttachmentReferences?: number;
    brokenAttachmentReferences?: number;
}
