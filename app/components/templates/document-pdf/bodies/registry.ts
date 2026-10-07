import type { ComponentType } from "react";

import type { PartCtx } from "../parts";
import type { BodyOptions } from "../TemplateFrame";
import type { DocumentKind } from "@/lib/documents/kinds";

/**
 * Which body a document gets, by kind.
 *
 * The three layouts differ only in their masthead — the part a studio cares
 * about the look of. What sits underneath depends on the *kind*: a quotation
 * ends with terms and a signature box the client fills in, an invoice ends
 * with what has been paid and what is still owed, and a booking has two
 * outputs that share no sections at all.
 *
 * Separating the two means three layouts times four bodies is seven files
 * rather than twelve, and a fix to the GST summary lands once.
 */
export type BodyComponent = ComponentType<
    { ctx: PartCtx } & BodyOptions
>;

export type BodyEntry = {
    load: () => Promise<{ default: BodyComponent }>;
};

/**
 * Keyed by kind, then by the document's own `documentType` where it has one.
 *
 * `default` is used when the kind has a single body, or when the document's
 * type is not one this map knows — a document saved before a type was added
 * still renders rather than throwing.
 */
const BODIES: Record<DocumentKind, Record<string, BodyEntry>> = {
    quotation: {
        default: { load: () => import("./QuotationBody") },
    },
    invoice: {
        default: { load: () => import("./InvoiceBody") },
    },
    booking: {
        default: { load: () => import("./BookingBody") },
        // The crew's copy: call times and venues, no pricing and no client
        // address. It gets forwarded to freelancers, so it must not carry
        // anything the client would not want shared.
        crew: { load: () => import("./CrewSheetBody") },
    },
};

export function bodyEntry(
    kind: DocumentKind,
    documentType?: string
): BodyEntry {
    const forKind = BODIES[kind] ?? BODIES.quotation;
    return (documentType && forKind[documentType]) || forKind.default;
}
