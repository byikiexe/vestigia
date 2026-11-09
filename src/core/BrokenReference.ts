export type BrokenReferenceType =
    | "missing-note"
    | "missing-attachment"
    | "missing-heading"
    | "missing-block";

export type BrokenReferenceSeverity =
    | "info"
    | "warning";

export interface BrokenReferencePosition {
    line: number;
    column: number;
}

export interface BrokenReference {
    id: string;

    type: BrokenReferenceType;
    severity: BrokenReferenceSeverity;

    sourcePath: string;
    target: string;

    position?: BrokenReferencePosition;
}

export interface BrokenReferenceGroup {
    sourcePath: string;
    references: BrokenReference[];
}

export interface IgnoredReference {
    sourcePath: string;
    target: string;
}
