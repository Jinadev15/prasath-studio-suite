import React from "react";

import {
    ContactFooter,
    ListBlock,
    NotesBlock,
    SignatureBlock,
    sectionsOf,
    type PartCtx,
} from "../parts";
import {
    BookingFunctionsTable,
    CommercialsBlock,
    CoverageBlock,
    VipList,
} from "../parts/booking";

/**
 * The client's booking sheet.
 *
 * What the family confirms and signs: who they are, every function with its
 * date and venue, what they are getting, and what it is expected to cost.
 *
 * `commercials.internalNotes` is deliberately absent, and must stay absent.
 * It is the studio talking to itself — "father is the real decision maker",
 * "mother wants candid, father wants traditional" — and this sheet is handed
 * to the family.
 */
export default function BookingBody({ ctx }: { ctx: PartCtx }) {
    const { data, d, labels, scale } = ctx;
    const sections = sectionsOf(data);

    return (
        <>
            <div className={scale.sectionGap}>
                <BookingFunctionsTable ctx={ctx} detail="client" />
            </div>

            {sections.coverage !== false && (
                <div className={scale.sectionGap}>
                    <CoverageBlock ctx={ctx} />
                </div>
            )}

            {sections.preferences !== false && (
                <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                    <ListBlock
                        ctx={ctx}
                        heading={labels.mustHaveShots}
                        items={
                            (d.preferences as { mustHaveShots?: string[] })
                                ?.mustHaveShots
                        }
                        marker="check"
                    />
                    <VipList ctx={ctx} />
                </div>
            )}

            {sections.commercials !== false && (
                <div className={scale.sectionGap}>
                    <CommercialsBlock ctx={ctx} />
                </div>
            )}

            <div className={`${scale.sectionGap} break-inside-avoid`}>
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

            <div className={`${scale.sectionGap} mt-auto`}>
                <div className="mb-4 break-inside-avoid rounded border p-3">
                    <p
                        className={`${scale.label} font-semibold uppercase tracking-wider text-gray-500`}
                    >
                        {labels.bookingConfirmation}
                    </p>
                    <p className={`${scale.body} mt-1 text-gray-700`}>
                        {labels.bookingConfirmationBody}
                    </p>
                    <div className="mt-6 flex items-end gap-8">
                        <div className="flex-1 border-t border-gray-400 pt-1">
                            <p className={`${scale.label} text-gray-500`}>
                                {labels.clientSignature}
                            </p>
                        </div>
                        <div className="w-32 border-t border-gray-400 pt-1">
                            <p className={`${scale.label} text-gray-500`}>
                                {labels.acceptanceDate}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-between gap-6 break-inside-avoid">
                    <ContactFooter ctx={ctx} />
                    <SignatureBlock ctx={ctx} />
                </div>
            </div>
        </>
    );
}
