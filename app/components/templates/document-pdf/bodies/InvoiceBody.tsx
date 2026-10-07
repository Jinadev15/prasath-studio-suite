import React from "react";

import {
    ContactFooter,
    DeclarationBlock,
    FunctionsTable,
    GstSummaryTable,
    ItemsTable,
    ListBlock,
    NotesBlock,
    PaymentDetailsBlock,
    PaymentHistoryTable,
    SignatureBlock,
    TimelineBlock,
    TotalsBlock,
    sectionsOf,
    type PartCtx,
} from "../parts";

/**
 * The invoice, below the masthead.
 *
 * Reads as a demand for payment rather than a proposal, which is why it
 * differs from the quotation body in four places: there is no validity date,
 * no package comparison and no box for the client to sign — nobody "accepts"
 * an invoice — and where the quotation lists the payment stages still to come,
 * this lists the money that has actually arrived.
 *
 * A Bill of Supply renders with no tax columns anywhere. That is a legal
 * requirement for a supplier who cannot charge GST, not a presentation choice,
 * so it is enforced here rather than left to the user to blank the right
 * fields: `taxMode` is forced to `exempt` on the document, which makes
 * `ItemsTable` drop its SAC and GST columns and `GstSummaryTable` render
 * nothing at all.
 */
export default function InvoiceBody({
    ctx,
    itemsVariant = "rule",
    totalsEmphasis = "rule",
}: {
    ctx: PartCtx;
    itemsVariant?: "rule" | "filled" | "plain";
    totalsEmphasis?: "rule" | "fill";
}) {
    const { data, d, labels, scale } = ctx;
    const sections = sectionsOf(data);

    return (
        <>
            {sections.events && (d.events?.length ?? 0) > 0 && (
                <div className={scale.sectionGap}>
                    <FunctionsTable ctx={ctx} />
                </div>
            )}

            {/*
             * No `break-inside-avoid` on the items table: a long invoice is
             * taller than a page, and forcing it to stay whole pushes an
             * almost-empty page in front of it. Rows keep themselves intact.
             */}
            <div className={scale.sectionGap}>
                <ItemsTable ctx={ctx} variant={itemsVariant} />
            </div>

            {/*
             * Totals beside the GST summary, so the taxable value in each is
             * on the same eye line — which is how a client, or an assessing
             * officer, checks that the two agree.
             */}
            <div
                className={`${scale.sectionGap} flex flex-wrap items-start justify-between gap-6`}
            >
                <div className="min-w-[45%] flex-1 break-inside-avoid">
                    {sections.gstBreakup && <GstSummaryTable ctx={ctx} />}
                </div>
                <div className="min-w-[45%] flex-1 break-inside-avoid">
                    <TotalsBlock ctx={ctx} emphasis={totalsEmphasis} />
                </div>
            </div>

            {sections.paymentHistory && (
                <div className={`${scale.sectionGap} break-inside-avoid`}>
                    <PaymentHistoryTable ctx={ctx} />
                </div>
            )}

            {(sections.inclusions || sections.exclusions) && (
                <div
                    className={`${scale.sectionGap} grid gap-6 break-inside-avoid sm:grid-cols-2`}
                >
                    {sections.inclusions && (
                        <ListBlock
                            ctx={ctx}
                            heading={labels.inclusionsHeading}
                            items={d.inclusions}
                            field="details.inclusions"
                            marker="check"
                        />
                    )}
                    {sections.exclusions && (
                        <ListBlock
                            ctx={ctx}
                            heading={labels.exclusionsHeading}
                            items={d.exclusions}
                            field="details.exclusions"
                            marker="cross"
                        />
                    )}
                </div>
            )}

            {sections.deliveryTimeline &&
                (d.deliveryTimeline?.length ?? 0) > 0 && (
                    <div className={`${scale.sectionGap} break-inside-avoid`}>
                        <TimelineBlock ctx={ctx} />
                    </div>
                )}

            <div
                className={`${scale.sectionGap} grid gap-6 break-inside-avoid sm:grid-cols-2`}
            >
                <PaymentDetailsBlock ctx={ctx} />
                <NotesBlock ctx={ctx} />
            </div>

            {sections.terms && (d.terms?.length ?? 0) > 0 && (
                <div className={`${scale.sectionGap} break-inside-avoid`}>
                    <ListBlock
                        ctx={ctx}
                        heading={labels.termsHeading}
                        items={d.terms}
                        field="details.terms"
                        marker="number"
                    />
                </div>
            )}

            {/*
             * `mt-auto` drops the sign-off to the foot of the sheet. The frame
             * is a flex column with a print min-height of a full A4 page, so a
             * short invoice lands its signature at the bottom of the paper
             * rather than floating mid-page above a block of white.
             */}
            <div className={`${scale.sectionGap} mt-auto`}>
                {sections.declaration && (
                    <div className="mb-3">
                        <DeclarationBlock ctx={ctx} />
                    </div>
                )}

                <div className="flex items-end justify-between gap-6 break-inside-avoid">
                    <ContactFooter ctx={ctx} />
                    <SignatureBlock ctx={ctx} />
                </div>
            </div>
        </>
    );
}
