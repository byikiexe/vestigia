import type { IgnoredReference } from "./BrokenReference";

export interface VestigiaSettings {
    ignoredReferences: IgnoredReference[];
}

export const DEFAULT_SETTINGS: VestigiaSettings = {
    ignoredReferences: [],
};
