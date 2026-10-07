import React from "react";

import { formatShortDate, formatTime, formatTimeRange, formatWeekday } from "@/lib/india/dates";
import { formatINR } from "@/lib/india/currency";
import { functionTypeById, serviceById } from "@/lib/photography/catalogue";
import {
    FILM_TYPES,
    RAW_DELIVERY_MODES,
} from "@/lib/documents/booking/options";


import { SectionHeading, type PartCtx } from "./index";

import type { BookingFunctionType, CrewType, PersonType } from "@/types";

/*
 * Films and raw-delivery modes are stored by id so the choice survives a
 * wording change. The document must print the label — "full-film" on a sheet
 * handed to a family reads as a bug.
 */
const labelFrom = (
    options: readonly { id: string; label: string }[],
    id: string
) => options.find((option) => option.id === id)?.label ?? id;


/**
 * Booking-specific document blocks.
 *
 * Kept out of `parts/index.tsx` because nothing here is shared with the
 * quotation or the invoice — a booking has functions with call times and crew
 * counts where those have line items and totals.
 */

/** "2 candid + 1 traditional + drone", from the per-role counts. */
export function crewSummary(crew: CrewType | undefined): string {
    if (!crew) return "";

    const parts: [number | undefined, string][] = [
        [crew.candidPhotographers, "candid"],
        [crew.traditionalPhotographers, "traditional"],
        [crew.cinematographers, "cinematic"],
        [crew.traditionalVideographers, "video"],
        [crew.drone, "drone"],
        [crew.assistants, "assistant"],
    ];

    return parts
        .filter(([count]) => Number(count) > 0)
        .map(([count, label]) => `${count} ${label}`)
        .join(" + ");
}

/**
 * The function schedule — the part both sheets are really about.
 *
 * `detail` controls how much is shown. The client's booking sheet lists what
 * was agreed; the crew's call sheet adds the muhurtham minute, the venue's
 * full address and the on-site coordinator's phone number, which are what
 * someone driving there at 4am actually needs.
 */
export function BookingFunctionsTable({
    ctx,
    detail = "client",
}: {
    ctx: PartCtx;
    detail?: "client" | "crew";
}) {
    const { d, labels, theme, scale, locale } = ctx;
    // Skip a function row the user started and left blank.
    const functions = (
        (d.functions as BookingFunctionType[] | undefined) ?? []
    ).filter((fn) => fn?.label?.trim() || fn?.functionId || fn?.date);
    if (!functions.length) return null;

    return (
        <div>
            <SectionHeading ctx={ctx}>
                {labels.functionsHeading}
            </SectionHeading>

            <div className="mt-2 space-y-2">
                {functions.map((fn, index) => {
                    const type = functionTypeById(fn.functionId);
                    const name = fn.label || type?.label || "—";
                    const weekday = formatWeekday(fn.date, locale);
                    const crew = crewSummary(fn.crew);
                    const services = (fn.services ?? [])
                        .map((id) => serviceById(id)?.name)
                        .filter(Boolean);

                    return (
                        <div
                            key={index}
                            data-edit-field={`details.functions.${index}.label`}
                            className="break-inside-avoid border-b border-gray-200 pb-2"
                        >
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                                <p
                                    className={`${scale.name} font-semibold text-gray-900`}
                                >
                                    {name}
                                </p>
                                <p
                                    className={`${scale.body} tabular-nums text-gray-700`}
                                >
                                    {formatShortDate(fn.date, locale)}
                                    {weekday && (
                                        <span className="text-gray-500">
                                            {" "}
                                            · {weekday}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div
                                className={`${scale.body} mt-0.5 grid gap-x-6 gap-y-0.5 text-gray-700 sm:grid-cols-2`}
                            >
                                <p>
                                    <span className="text-gray-500">
                                        {labels.functionTime}:
                                    </span>{" "}
                                    {formatTimeRange(fn.startTime, fn.endTime) ||
                                        "—"}
                                </p>

                                {/*
                                 * The muhurtham is the one moment on a wedding
                                 * booking that cannot be re-shot, so the crew
                                 * sheet states it on its own line rather than
                                 * leaving it inside a time range.
                                 */}
                                {fn.muhurthamTime && (
                                    <p
                                        className="font-medium"
                                        style={{ color: theme.accentColor }}
                                    >
                                        {labels.muhurthamTime}:{" "}
                                        {formatTime(fn.muhurthamTime)}
                                    </p>
                                )}

                                <p>
                                    <span className="text-gray-500">
                                        {labels.venue}:
                                    </span>{" "}
                                    {fn.venue || "—"}
                                    {fn.district ? `, ${fn.district}` : ""}
                                </p>

                                {Number(fn.guestCount) > 0 && (
                                    <p>
                                        <span className="text-gray-500">
                                            {labels.guests}:
                                        </span>{" "}
                                        {fn.guestCount}
                                    </p>
                                )}

                                {crew && (
                                    <p>
                                        <span className="text-gray-500">
                                            {labels.crew}:
                                        </span>{" "}
                                        {crew}
                                    </p>
                                )}

                                {detail === "crew" && fn.venueAddress && (
                                    <p className="sm:col-span-2">
                                        <span className="text-gray-500">
                                            {labels.venueAddress}:
                                        </span>{" "}
                                        {fn.venueAddress}
                                    </p>
                                )}

                                {detail === "crew" && fn.coordinatorName && (
                                    <p className="sm:col-span-2">
                                        <span className="text-gray-500">
                                            {labels.coordinator}:
                                        </span>{" "}
                                        {fn.coordinatorName}
                                        {fn.coordinatorPhone
                                            ? ` · ${fn.coordinatorPhone}`
                                            : ""}
                                    </p>
                                )}

                                {services.length > 0 && (
                                    <p className="sm:col-span-2">
                                        <span className="text-gray-500">
                                            {labels.servicesWanted}:
                                        </span>{" "}
                                        {services.join(", ")}
                                    </p>
                                )}

                                {fn.notes && (
                                    <p className="sm:col-span-2 text-gray-600">
                                        {fn.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** The people who must appear in the photographs. */
export function VipList({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const preferences = d.preferences as
        | { vips?: PersonType[] }
        | undefined;
    const vips = (preferences?.vips ?? []).filter((person) => person?.name);
    if (!vips.length) return null;

    return (
        <div className="break-inside-avoid">
            <SectionHeading ctx={ctx}>{labels.vipsHeading}</SectionHeading>
            <div className={`${scale.body} mt-1 space-y-0.5 text-gray-700`}>
                {vips.map((person, index) => (
                    <p key={index}>
                        {person.name}
                        {person.relation && (
                            <span className="text-gray-500">
                                {" "}
                                · {person.relation}
                            </span>
                        )}
                        {person.phone && (
                            <span className="text-gray-500">
                                {" "}
                                · {person.phone}
                            </span>
                        )}
                    </p>
                ))}
            </div>
        </div>
    );
}

/** Albums, films, edited photo count and how the raw data is delivered. */
export function CoverageBlock({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const coverage = d.coverage as
        | {
              albums?: {
                  type?: string;
                  size?: string;
                  sheets?: number;
                  quantity?: number;
                  notes?: string;
              }[];
              frames?: number;
              frameSize?: string;
              films?: string[];
              editedPhotoCount?: number;
              rawDelivery?: string[];
              deliveryExpectation?: string;
              notes?: string;
          }
        | undefined;
    if (!coverage) return null;

    const albums = (coverage.albums ?? []).filter((album) => album?.type);
    const rows: [string, string][] = [];

    if (Number(coverage.editedPhotoCount) > 0) {
        rows.push([
            labels.editedPhotos,
            String(coverage.editedPhotoCount),
        ]);
    }
    if (coverage.films?.length) {
        rows.push([
            labels.films,
            coverage.films
                .map((id) => labelFrom(FILM_TYPES, id))
                .join(", "),
        ]);
    }
    if (Number(coverage.frames) > 0) {
        rows.push([
            labels.frames,
            `${coverage.frames}${coverage.frameSize ? ` (${coverage.frameSize})` : ""}`,
        ]);
    }
    if (coverage.rawDelivery?.length) {
        rows.push([
            labels.rawDelivery,
            coverage.rawDelivery
                .map((id) => labelFrom(RAW_DELIVERY_MODES, id))
                .join(", "),
        ]);
    }
    if (coverage.deliveryExpectation) {
        rows.push([labels.deliveryExpectation, coverage.deliveryExpectation]);
    }

    if (!albums.length && !rows.length && !coverage.notes) return null;

    return (
        <div className="break-inside-avoid">
            <SectionHeading ctx={ctx}>{labels.coverageHeading}</SectionHeading>

            {albums.length > 0 && (
                <div className={`${scale.body} mt-1 space-y-0.5 text-gray-700`}>
                    {albums.map((album, index) => (
                        <p key={index}>
                            {album.quantity && album.quantity > 1
                                ? `${album.quantity} × `
                                : ""}
                            {album.type}
                            {album.size ? ` ${album.size}` : ""}
                            {album.sheets
                                ? ` · ${album.sheets} ${labels.sheets}`
                                : ""}
                            {album.notes ? ` · ${album.notes}` : ""}
                        </p>
                    ))}
                </div>
            )}

            <div className={`${scale.body} mt-1 space-y-0.5 text-gray-700`}>
                {rows.map(([label, value]) => (
                    <p key={label}>
                        <span className="text-gray-500">{label}:</span> {value}
                    </p>
                ))}
            </div>

            {coverage.notes && (
                <p className={`${scale.label} mt-1 whitespace-pre-line text-gray-600`}>
                    {coverage.notes}
                </p>
            )}
        </div>
    );
}

/** Budget range and the advance the studio expects to confirm the dates. */
export function CommercialsBlock({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const commercials = d.commercials as
        | {
              budgetMin?: number;
              budgetMax?: number;
              advanceExpected?: number;
              quotationReference?: string;
          }
        | undefined;
    if (!commercials) return null;

    const rows: [string, string][] = [];

    if (Number(commercials.budgetMin) > 0 || Number(commercials.budgetMax) > 0) {
        const min = Number(commercials.budgetMin) || 0;
        const max = Number(commercials.budgetMax) || 0;
        rows.push([
            labels.budget,
            min && max
                ? `${formatINR(min, { trimZeroPaise: true })} – ${formatINR(max, { trimZeroPaise: true })}`
                : formatINR(min || max, { trimZeroPaise: true }),
        ]);
    }
    if (Number(commercials.advanceExpected) > 0) {
        rows.push([
            labels.advanceExpected,
            formatINR(commercials.advanceExpected, { trimZeroPaise: true }),
        ]);
    }
    if (commercials.quotationReference) {
        rows.push([labels.againstQuotation, commercials.quotationReference]);
    }

    if (!rows.length) return null;

    return (
        <div className="break-inside-avoid">
            <SectionHeading ctx={ctx}>
                {labels.commercialsHeading}
            </SectionHeading>
            <div className={`${scale.body} mt-1 space-y-0.5 text-gray-700`}>
                {rows.map(([label, value]) => (
                    <p key={label}>
                        <span className="text-gray-500">{label}:</span>{" "}
                        <span className="tabular-nums">{value}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}
