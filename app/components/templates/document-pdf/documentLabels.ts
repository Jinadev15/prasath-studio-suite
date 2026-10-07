import enMessages from "@/i18n/locales/en.json";

/**
 * The set of strings the quotation document itself renders.
 *
 * These are passed to the templates as a plain prop rather than read from
 * next-intl's hooks, because the same components are rendered two different
 * ways: inside the client tree for the live preview, and through
 * `renderToStaticMarkup` in a route handler for the PDF.
 *
 * A React context does not work here — anything exported from a "use client"
 * module becomes a client-reference proxy when imported by a route handler, so
 * neither the provider nor a helper could be used server-side. A prop crosses
 * both boundaries cleanly, and this module stays free of React so it is safe
 * to import from anywhere.
 */
export type DocumentLabelKey = keyof typeof enMessages.quotationDocument;

export type DocumentLabels = Record<DocumentLabelKey, string>;

export const DEFAULT_DOCUMENT_LABELS =
    enMessages.quotationDocument as DocumentLabels;

/** Props shared by every template, beyond the document data itself. */
export type DocumentTemplateExtras = {
    labels?: DocumentLabels;
    /**
     * BCP-47 locale for number and date formatting inside the document.
     * Separate from `labels` because the strings and the formatting are
     * resolved by different mechanisms.
     */
    locale?: string;
    /** Overrides the direction derived from `locale`. */
    dir?: "ltr" | "rtl";
    /**
     * Presentation options. Optional and individually defaulted, so documents
     * saved before a theming change still render.
     */
    theme?: Partial<import("./documentTheme").DocumentTheme>;
};

/**
 * Builds a label set from a locale's raw messages, falling back per key to
 * English so an untranslated string never renders blank.
 *
 * Unlike upstream, no locale is excluded here. The reason it had to exclude
 * four was that the PDF embedded only Latin fonts, so CJK and RTL text had no
 * glyph to render with. This app ships English and Tamil, and the PDF embeds a
 * Tamil face — so both locales render properly in the document, not just in
 * the browser.
 */
export function buildDocumentLabels(
    messages: Record<string, unknown> | undefined
): DocumentLabels {
    const section = (messages?.quotationDocument ??
        {}) as Partial<DocumentLabels>;

    const labels = { ...DEFAULT_DOCUMENT_LABELS };
    for (const key of Object.keys(labels) as DocumentLabelKey[]) {
        const value = section[key];
        if (typeof value === "string" && value.length > 0) {
            labels[key] = value;
        }
    }
    return labels;
}
