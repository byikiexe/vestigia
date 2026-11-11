import type { AnalysisResult } from "./AnalysisResult";
import type { VaultStatistics } from "./VaultStatistics";
import type {
    VaultHealth,
    VaultHealthDimension,
} from "./VaultHealth";

export class VaultHealthService {
    private readonly weights = {
        referenceIntegrity: 0.5,
        noteConnectivity: 0.3,
        attachmentIntegrity: 0.2,
    };

    calculate(
        statistics: VaultStatistics,
        results: AnalysisResult[]
    ): VaultHealth {
        const brokenLinks = results.find(
            (result) => result.analyzerId === "broken-links"
        );

        const orphanNotes = results.find(
            (result) => result.analyzerId === "orphan-notes"
        );

        const metrics = brokenLinks?.metrics;

        const referenceIntegrity = this.createDimension(
            metrics?.totalNoteReferences,
            metrics?.brokenNoteReferences
        );

        const attachmentIntegrity = this.createDimension(
            metrics?.totalAttachmentReferences,
            metrics?.brokenAttachmentReferences
        );

        const noteConnectivity = orphanNotes
            ? this.createDimension(
                  statistics.totalNotes,
                  orphanNotes.issues.length
              )
            : this.emptyDimension();

        // Connectivity is calculated from orphan notes.
        // createDimension() subtracts the second argument from the total.

        const dimensions = [
            {
                dimension: referenceIntegrity,
                weight: this.weights.referenceIntegrity,
            },
            {
                dimension: noteConnectivity,
                weight: this.weights.noteConnectivity,
            },
            {
                dimension: attachmentIntegrity,
                weight: this.weights.attachmentIntegrity,
            },
        ];

        let weightedScore = 0;
        let availableWeight = 0;

        for (const { dimension, weight } of dimensions) {
            if (dimension.score === null) continue;

            weightedScore += dimension.score * weight;
            availableWeight += weight;
        }

        const score =
            availableWeight > 0
                ? weightedScore / availableWeight
                : null;

        return {
            score,
            referenceIntegrity,
            noteConnectivity,
            attachmentIntegrity,
            calculatedAt: Date.now(),
        };
    }

    private createDimension(
        total?: number,
        invalid?: number
    ): VaultHealthDimension {
        if (
            total === undefined ||
            invalid === undefined ||
            !Number.isFinite(total) ||
            !Number.isFinite(invalid) ||
            total <= 0 ||
            invalid < 0 ||
            invalid > total
        ) {
            return this.emptyDimension();
        }

        const valid = total - invalid;

        return {
            score: (valid / total) * 100,
            valid,
            total,
        };
    }

    private emptyDimension(): VaultHealthDimension {
        return {
            score: null,
            valid: 0,
            total: 0,
        };
    }
}
