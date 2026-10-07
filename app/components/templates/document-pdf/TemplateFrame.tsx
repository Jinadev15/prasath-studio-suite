import React, { ReactNode } from "react";

import {
    DEFAULT_DOCUMENT_LABELS,
    type DocumentTemplateExtras,
} from "./documentLabels";
import {
    densityScale,
    fontStack,
    resolveTheme,
    type DocumentTheme,
} from "./documentTheme";
import type { PartCtx } from "./parts";

import { computeTotals } from "@/lib/india/gst";
import {
    totalReceived,
    type PaymentEntry,
} from "@/lib/documents/invoice/payments";
import { DEFAULT_LOCALE, dirForLocale } from "@/lib/variables";

import type { AnyDocument } from "@/types";

/**
 * How a layout renders the part below the masthead.
 *
 * The three layouts differ only in their header treatment, which is the only
 * part a studio cares about the look of. What goes underneath depends on the
 * *kind* of document, not the layout — a quotation body, an invoice body, a
 * booking sheet or a crew call sheet — so the kind supplies it and the three
 * layouts stay shared across all of them.
 */
export type BodyOptions = {
    itemsVariant?: "rule" | "filled" | "plain";
    totalsEmphasis?: "rule" | "fill";
};

export type RenderBody = (
    ctx: PartCtx,
    options?: BodyOptions
) => React.ReactNode;

export type TemplateProps = AnyDocument &
    DocumentTemplateExtras & {
        renderBody: RenderBody;
    };

/**
 * Builds the context every layout part needs, from whatever props the template
 * was given. Missing labels fall back to English and a missing theme to the
 * default, so a document saved before a schema change still renders.
 *
 * This is also where every figure on the document comes from: `computeTotals`
 * runs once here and the result is handed down through `ctx`. Nothing below
 * recalculates, so the preview and the PDF cannot disagree.
 */
export function templateCtx(data: TemplateProps): PartCtx {
    /*
     * The theme normally travels with the document (details.theme). The
     * explicit `theme` prop is an override, used by the gallery to preview a
     * change before it is committed to the form.
     */
    const details = data.details as
        | (Record<string, unknown> & {
              items?: never[];
              taxMode?: never;
              discount?: never;
              otherCharges?: never;
              roundOff?: boolean;
              advanceReceived?: number;
              theme?: Partial<DocumentTheme>;
          })
        | undefined;

    const theme: DocumentTheme = resolveTheme(data.theme ?? details?.theme);
    const locale = data.locale ?? DEFAULT_LOCALE;

    return {
        data,
        d: (details ?? {}) as PartCtx["d"],
        labels: data.labels ?? DEFAULT_DOCUMENT_LABELS,
        theme,
        scale: densityScale(theme.density),
        totals: computeTotals({
            items: details?.items ?? [],
            taxMode: details?.taxMode,
            discount: details?.discount,
            otherCharges: details?.otherCharges,
            roundOff: details?.roundOff,
            /*
             * A quotation carries a single `advanceReceived` figure; an
             * invoice carries a list of payments actually received and the
             * advance is their sum. Reading both here keeps one totals
             * computation serving both kinds — the alternative was a second
             * `computeTotals` call in the invoice body, which is exactly the
             * duplication that lets a preview disagree with its PDF.
             */
            advanceReceived:
                "payments" in (details ?? {})
                    ? totalReceived(
                          (details as { payments?: PaymentEntry[] }).payments
                      )
                    : details?.advanceReceived,
        }),
        // Formatting uses the Indian locale regardless of UI language: a Tamil
        // quotation still groups digits in lakhs and writes dates day-first.
        locale: locale === "ta" ? "ta-IN" : "en-IN",
        dir: dirForLocale(locale),
        /*
         * The crew call sheet is the one output that leaves the studio for
         * someone other than the client, so the shared parts redact against
         * this rather than trusting each body to remember.
         */
        audience:
            (details as { documentType?: string })?.documentType === "crew"
                ? "crew"
                : "client",
    };
}

/**
 * The sheet every layout sits on.
 *
 * Owns the things that must be identical across templates — the A4 page, the
 * chosen typeface and the density padding — so a layout only concerns itself
 * with arrangement.
 *
 * The tall min-height is scoped to print (page.pdf() emulates print media) and
 * to lg screens, so it fills an A4 page without padding out a phone preview
 * with 960px of empty white. 1123px is A4 at 96dpi, matching PDF_VIEWPORT in
 * services/document/server/pdfPage.ts.
 */
export default function TemplateFrame({
    ctx,
    children,
    bare = false,
}: {
    ctx: PartCtx;
    children: ReactNode;
    /** Skips the page padding, for layouts that paint edge-to-edge. */
    bare?: boolean;
}) {
    const { theme, scale, dir } = ctx;

    return (
        <section
            // The PDF is standalone HTML with no surrounding document to
            // inherit direction from, so the sheet declares its own.
            dir={dir}
            style={{ fontFamily: fontStack(theme.fontId), color: "#111827" }}
        >
            <div
                /*
                 * The rounded corners and clipping are for the on-screen
                 * preview only. In print they do real damage: rounding cuts
                 * the corners off a full-bleed header, and `overflow-hidden`
                 * on the sheet is a pagination hazard — anything landing on
                 * page 2 can be clipped away entirely.
                 */
                className={`flex min-h-[30rem] flex-col overflow-hidden rounded-xl bg-white lg:min-h-[60rem] print:min-h-[1123px] print:overflow-visible print:rounded-none ${
                    bare ? "" : scale.page
                }`}
            >
                {children}
            </div>
        </section>
    );
}
