/**
 * The three kinds of document this app produces, in one list.
 *
 * This is what makes a single application out of what began as three. Every
 * part of the app that used to be hardcoded to "quotation" — the storage key
 * for the draft, the storage key for the saved list, the numbering prefix, the
 * PDF route's template lookup, the navigation — now reads from here instead.
 * Adding a fourth document type is an entry in this array plus a schema, a
 * defaults module and a PDF body; it is not another application.
 *
 * Deliberately free of React, zod and Next.js imports so it can be read by the
 * navigation, the storage layer and the route handlers alike without any of
 * them pulling in the others. The schemas are resolved separately, in
 * `lib/documents/registry.ts`, which is allowed to import them.
 */

export type DocumentKind = "quotation" | "invoice" | "booking";

export type DocumentKindMeta = {
    id: DocumentKind;
    /** Section name in the navigation. */
    label: string;
    /** Route segment under the locale, e.g. /en/invoice. */
    path: string;
    /** One line, for the section switcher and the landing page. */
    blurb: string;
    /**
     * Default numbering prefix for a new studio profile's series.
     *
     * Each kind needs its own counter — a studio's invoices and quotations are
     * separate series and an accountant will ask why INV/2026-27/004 is
     * missing if a quotation consumed the number.
     */
    numberPrefix: string;
    /** Encrypted-storage key for the in-progress draft. */
    draftKey: string;
    /** Encrypted-storage key for the saved list. */
    savedKey: string;
};

export const DOCUMENT_KINDS: DocumentKindMeta[] = [
    {
        id: "booking",
        label: "Bookings",
        path: "booking",
        blurb: "Capture the enquiry and brief the crew",
        numberPrefix: "BKG",
        draftKey: "studio:bookingDraft",
        savedKey: "studio:savedBookings",
    },
    {
        id: "quotation",
        label: "Quotations",
        path: "quotation",
        blurb: "Price the shoot and send it for approval",
        numberPrefix: "QTN",
        draftKey: "studio:quotationDraft",
        savedKey: "studio:savedQuotations",
    },
    {
        id: "invoice",
        label: "Invoices",
        path: "invoice",
        blurb: "Bill for it and track what has been paid",
        numberPrefix: "INV",
        draftKey: "studio:invoiceDraft",
        savedKey: "studio:savedInvoices",
    },
];

/*
 * Ordered the way the work actually happens — enquiry, then price, then bill —
 * rather than alphabetically or by when they were built. The navigation reads
 * this order, so the sections read left to right as the job progresses.
 */

const BY_ID = new Map(DOCUMENT_KINDS.map((kind) => [kind.id, kind]));

export function documentKind(id: DocumentKind): DocumentKindMeta {
    const meta = BY_ID.get(id);
    if (!meta) throw new Error(`Unknown document kind: ${id}`);
    return meta;
}

export function isDocumentKind(value: unknown): value is DocumentKind {
    return typeof value === "string" && BY_ID.has(value as DocumentKind);
}

/** The kind a route segment refers to, or null for anything else. */
export function kindFromPath(segment: string | undefined): DocumentKind | null {
    const meta = DOCUMENT_KINDS.find((k) => k.path === segment);
    return meta ? meta.id : null;
}
