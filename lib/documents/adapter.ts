import type { ZodType } from "zod";

import type { StudioProfile } from "@/lib/studio/profile";
import type { AnyDocument } from "@/types";
import type { DocumentKind } from "./kinds";

/**
 * What a section has to tell the shared machinery about its document kind.
 *
 * The draft autosave, the saved-documents list, the PDF request, the export
 * and the "new document" action are identical for all three kinds — they only
 * differ in which schema validates, which function builds a blank one, and
 * which field holds the document number. Those four differences are this type;
 * everything else is shared.
 *
 * The alternative was three copies of a 600-line context, which is what the
 * three separate applications had. One of them would have been fixed and the
 * other two would not.
 */
export type DocumentAdapter<T extends AnyDocument> = {
    kind: DocumentKind;

    /**
     * Validates before the document is sent to the PDF route.
     *
     * Typed loosely because zod's inferred output type for a schema with
     * defaults and transforms is not the same as its input type, and pinning
     * both here would force every call site to cast. The route re-validates
     * with the same schema, which is where it actually matters.
     */
    schema: ZodType<unknown>;

    /** A blank document, for when there is no profile yet. */
    empty: () => T;

    /** A new document seeded from the studio profile. */
    fromProfile: (profile: StudioProfile, options?: { date?: Date }) => T;

    /**
     * Re-applies the studio identity to an open document, used when the user
     * switches profile mid-edit. Must leave the client and the work alone.
     */
    applyProfile: (
        current: T,
        profile: StudioProfile,
        options?: { renumber?: boolean }
    ) => T;

    /** `details.quotationNumber`, `details.invoiceNumber`, … */
    numberOf: (document: T) => string;

    /** Used for the download filename and the email subject. */
    titleOf: (document: T) => string;

    /**
     * How one saved document reads in the "load a saved document" list.
     *
     * Lives here because it is the one piece of that list that genuinely
     * differs per kind: a quotation and an invoice show a rupee total, a
     * booking shows its status and the date of the first function. Keeping it
     * in the adapter means the list component itself stays shared.
     */
    summarise: (document: T) => DocumentSummary;
};

export type DocumentSummary = {
    /** "Quotation #QTN/2026-27/001" */
    title: string;
    /** The client, and the occasion if there is one. */
    subtitle: string;
    /** Date, and anything else small. */
    meta: string;
    /** Formatted rupee figure, where the kind has one. */
    amount?: string;
    /** Short status word, where the kind has one. */
    badge?: string;
};
