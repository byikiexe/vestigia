import type { IgnoredReference } from "./BrokenReference";

export class IgnoredReferencesService {
    private readonly ignoredReferences = new Map<
        string,
        IgnoredReference
    >();

    private createKey(
        sourcePath: string,
        target: string
    ): string {
        return JSON.stringify([sourcePath, target]);
    }

    ignore(
        sourcePath: string,
        target: string
    ): void {
        const key = this.createKey(sourcePath, target);

        this.ignoredReferences.set(key, {
            sourcePath,
            target,
        });
    }

    restore(
        sourcePath: string,
        target: string
    ): void {
        const key = this.createKey(sourcePath, target);

        this.ignoredReferences.delete(key);
    }

    isIgnored(
        sourcePath: string,
        target: string
    ): boolean {
        const key = this.createKey(sourcePath, target);

        return this.ignoredReferences.has(key);
    }

    getAll(): IgnoredReference[] {
        return Array.from(this.ignoredReferences.values());
    }

    load(references: IgnoredReference[]): void {
        this.ignoredReferences.clear();

        for (const reference of references) {
            this.ignore(
                reference.sourcePath,
                reference.target
            );
        }
    }
}
