import React from "react";

import {
    AcceptanceBlock,
    AddOnsTable,
    ContactFooter,
    FunctionsTable,
    GstSummaryTable,
    ItemsTable,
    ListBlock,
    NotesBlock,
    PackageTiers,
    PaymentDetailsBlock,
    PaymentScheduleTable,
    SignatureBlock,
    ThankYouLine,
    TimelineBlock,
    TotalsBlock,
    sectionsOf,
    type PartCtx,
} from "../parts";

/**
 * Everything below the header, in the order a client reads it.
 *
 * The three layouts differ only in how they treat the masthead — which is the
 * only part a studio actually cares about the look of. Keeping the body in one
 * place means the GST summary, the totals and the payment block are identical
 * across templates, so a fix lands once rather than three times, and switching
 * template can never silently drop a section.
 */
export default function QuotationBody({
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

            {sections.packageTiers && (d.packageTiers?.length ?? 0) > 0 && (
                <div className={`${scale.sectionGap} break-inside-avoid`}>
                    <PackageTiers ctx={ctx} />
                </div>
            )}

            {/*
             * No `break-inside-avoid` here, unlike the short blocks below: a
             * twenty-line quotation is taller than a page, and forcing the
             * table to stay whole pushes an almost-empty page in front of it.
             * Rows keep themselves intact individually, and the heading uses
             * `break-after-avoid` so it is never stranded alone at the foot.
             */}
            <div className={scale.sectionGap}>
                <ItemsTable ctx={ctx} variant={itemsVariant} />
            </div>

            {/*
             * Totals sit beside the GST summary rather than under it. Side by
             * side, the taxable value in the summary and the taxable value in
             * the totals are on the same eye line, which is how a client (or
             * an auditor) checks that they agree.
             */}
            <div className={`${scale.sectionGap} flex flex-wrap items-start justify-between gap-6`}>
                <div className="min-w-[45%] flex-1 break-inside-avoid">
                    {sections.gstBreakup && <GstSummaryTable ctx={ctx} />}
                </div>
                <div className="min-w-[45%] flex-1 break-inside-avoid">
                    <TotalsBlock ctx={ctx} emphasis={totalsEmphasis} />
                </div>
            </div>

            {sections.addOns && (d.addOns?.length ?? 0) > 0 && (
                <div className={`${scale.sectionGap} break-inside-avoid`}>
                    <AddOnsTable ctx={ctx} />
                </div>
            )}

            {sections.paymentSchedule && (d.paymentSchedule?.length ?? 0) > 0 && (
                <div className={`${scale.sectionGap} break-inside-avoid`}>
                    <PaymentScheduleTable ctx={ctx} />
                </div>
            )}

            {(sections.inclusions || sections.exclusions) && (
                <div className={`${scale.sectionGap} grid gap-6 break-inside-avoid sm:grid-cols-2`}>
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

            {sections.deliveryTimeline && (d.deliveryTimeline?.length ?? 0) > 0 && (
                <div className={`${scale.sectionGap} break-inside-avoid`}>
                    <TimelineBlock ctx={ctx} />
                </div>
            )}

            <div className={`${scale.sectionGap} grid gap-6 break-inside-avoid sm:grid-cols-2`}>
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
             * `mt-auto` pushes the sign-off to the foot of the sheet. The frame
             * is a flex column with a print min-height of a full A4 page, so on
             * a short quotation the signature lands at the bottom of the paper
             * instead of floating mid-page above a block of white.
             */}
            {/*
             * The acceptance box and the sign-off row are kept whole
             * individually, not as one block. Together they are tall enough
             * that a page with room for either but not both pushed the pair
             * onto a page of their own — a quotation that ends with a blank
             * page and a signature line looks unfinished.
             */}
            <div className={`${scale.sectionGap} mt-auto`}>
                {sections.acceptanceBlock && (
                    <div className="mb-4 break-inside-avoid">
                        <AcceptanceBlock ctx={ctx} />
                    </div>
                )}

                <div className="flex items-end justify-between gap-6 break-inside-avoid">
                    <div>
                        <ThankYouLine ctx={ctx} />
                        <div className="mt-1.5">
                            <ContactFooter ctx={ctx} />
                        </div>
                    </div>
                    <SignatureBlock ctx={ctx} />
                </div>
            </div>
        </>
    );
}
