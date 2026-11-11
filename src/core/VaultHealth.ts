export interface VaultHealthDimension {
    score: number | null;
    valid: number;
    total: number;
}

export interface VaultHealth {
    score: number | null;

    referenceIntegrity: VaultHealthDimension;
    noteConnectivity: VaultHealthDimension;
    attachmentIntegrity: VaultHealthDimension;

    calculatedAt: number;
}
