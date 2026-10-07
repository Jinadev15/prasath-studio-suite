import React from "react";

import { ListBlock, SectionHeading, type PartCtx } from "../parts";
import { BookingFunctionsTable, VipList } from "../parts/booking";

import type { PersonType } from "@/types";

/**
 * The crew's call sheet.
 *
 * Written for someone driving to a mahal at four in the morning: call times,
 * the muhurtham minute, the venue's full address, who to ring when they get
 * there, and what must not be missed.
 *
 * What it deliberately does NOT contain, because this gets forwarded to
 * freelancers over WhatsApp:
 *
 *   - any pricing — the budget, the advance, the quotation reference
 *   - the client's home address
 *   - `commercials.internalNotes`, which is the studio talking to itself
 *
 * Those are not merely "not rendered yet". A crew sheet that leaks what the
 * family is paying is a problem for the studio, so this body never reaches for
 * `d.commercials` at all.
 */
export default function CrewSheetBody({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;

    const preferences = d.preferences as
        | {
              mustHaveShots?: string[];
              constraints?: string[];
              stylePreference?: string;
              languagePreference?: string;
              crewNotes?: string;
              venueAccessNotes?: string;
              vips?: PersonType[];
          }
        | undefined;

    const client = ctx.data.client as {
        name?: string;
        phone?: string;
        decisionMaker?: PersonType;
    };

    return (
        <>
            {/* Who to call. Names and numbers only — no addresses. */}
            <div className={`${scale.sectionGap} break-inside-avoid`}>
                <SectionHeading ctx={ctx}>{labels.keyContacts}</SectionHeading>
                <div className={`${scale.body} mt-1 space-y-0.5 text-gray-700`}>
                    {client.name && (
                        <p>
                            {client.name}
                            {client.phone && (
                                <span className="text-gray-500">
                                    {" "}
                                    · {client.phone}
                                </span>
                            )}
                        </p>
                    )}
                    {client.decisionMaker?.name && (
                        <p>
                            {client.decisionMaker.name}
                            {client.decisionMaker.relation && (
                                <span className="text-gray-500">
                                    {" "}
                                    · {client.decisionMaker.relation}
                                </span>
                            )}
                            {client.decisionMaker.phone && (
                                <span className="text-gray-500">
                                    {" "}
                                    · {client.decisionMaker.phone}
                                </span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            <div className={scale.sectionGap}>
                <BookingFunctionsTable ctx={ctx} detail="crew" />
            </div>

            <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                <ListBlock
                    ctx={ctx}
                    heading={labels.mustHaveShots}
                    items={preferences?.mustHaveShots}
                    marker="check"
                />
                <VipList ctx={ctx} />
            </div>

            <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                <ListBlock
                    ctx={ctx}
                    heading={labels.constraints}
                    items={preferences?.constraints}
                    marker="bullet"
                />

                <div className="break-inside-avoid">
                    {preferences?.stylePreference && (
                        <p className={`${scale.body} text-gray-700`}>
                            <span className="text-gray-500">
                                {labels.stylePreference}:
                            </span>{" "}
                            {preferences.stylePreference}
                        </p>
                    )}
                    {preferences?.languagePreference && (
                        <p className={`${scale.body} text-gray-700`}>
                            <span className="text-gray-500">
                                {labels.languagePreference}:
                            </span>{" "}
                            {preferences.languagePreference}
                        </p>
                    )}
                    {preferences?.venueAccessNotes && (
                        <p className={`${scale.body} mt-1 text-gray-700`}>
                            <span className="text-gray-500">
                                {labels.venueAccess}:
                            </span>{" "}
                            {preferences.venueAccessNotes}
                        </p>
                    )}
                    {preferences?.crewNotes && (
                        <p className={`${scale.body} mt-1 whitespace-pre-line text-gray-700`}>
                            {preferences.crewNotes}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
