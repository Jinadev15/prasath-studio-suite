import type { ComponentType } from "react";

import type { TemplateProps } from "./TemplateFrame";

/**
 * The single source of truth for which templates exist.
 *
 * Three, deliberately. Upstream shipped thirteen, but ten of them differed
 * only in the header treatment while sharing the same body — so the gallery
 * asked the user to compare thirteen near-identical sheets, and every fix to
 * the body had to be made thirteen times. These three are genuinely different
 * documents for three different studios, and the body they share lives in
 * DocumentBody.tsx.
 *
 * Ids are stable: a saved quotation stores the number, so renumbering these
 * would silently re-skin documents already sent.
 */
export type TemplateEntry = {
    id: number;
    name: string;
    description: string;
    load: () => Promise<{ default: ComponentType<TemplateProps> }>;
};

export const TEMPLATES: TemplateEntry[] = [
    {
        id: 1,
        name: "Classic",
        description: "Logo left, title right — the safe default",
        load: () => import("./layouts/Classic"),
    },
    {
        id: 2,
        name: "Letterhead",
        description: "Centred masthead, formal and symmetrical",
        load: () => import("./layouts/Letterhead"),
    },
    {
        id: 3,
        name: "Bold Header",
        description: "Full-width colour band — modern studio branding",
        load: () => import("./layouts/BoldHeader"),
    },
];

export const DEFAULT_TEMPLATE_ID = 1;

export function getTemplateEntry(id: number): TemplateEntry | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
