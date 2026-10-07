import React from "react";

import { formatINR, formatIndianDigits } from "@/lib/india/currency";
import {
    formatLongDate,
    formatShortDate,
    formatTimeRange,
    formatWeekday,
    validityStatus,
} from "@/lib/india/dates";
import { amountInWordsINR } from "@/lib/india/words";
import type { Totals } from "@/lib/india/gst";
import { functionTypeById } from "@/lib/photography/catalogue";

import type { DocumentLabels } from "../documentLabels";
import {
    readableOn,
    shade,
    tint,
    type DocumentScale,
    type DocumentTheme,
} from "../documentTheme";

import type {
    AnyDocument,
    EventType,
    ItemType,
    MilestoneType,
    PackageTierType,
    AddOnType,
    TimelineType,
} from "@/types";
import {
    paymentModeLabel,
    paymentStatus,
    type PaymentEntry,
} from "@/lib/documents/invoice/payments";

/**
 * Shared building blocks for the quotation layouts.
 *
 * Every layout composes these rather than repeating the markup. Upstream's two
 * original templates were near-identical 240-line files, so a fix to (say) the
 * conditional discount row had to be made twice; with thirteen layouts it
 * would be thirteen times.
 *
 * These are plain functions of their props — no hooks, no context — because
 * the same components render server-side through `renderToStaticMarkup` for
 * the PDF.
 *
 * The layouts render the document title as a styled <div>, never an <h1>. A
 * quotation is a document *inside* the page, not the page's own outline, and
 * because these components also render into the live preview an <h1> here
 * would put several competing top-level headings made of the user's own data
 * into the app's HTML. The page's real <h1> lives in LandingContent.
 *
 * Several parts carry a `data-edit-field` attribute naming the form field that
 * produced them. The live preview delegates one click handler over the whole
 * document and uses it to jump to that field, which is how clicking the
 * document edits it. Plain data attributes rather than callbacks threaded
 * through PartCtx, so the PDF render path is untouched — it emits a few inert
 * attributes it never reads.
 */
/**
 * The `details` block as the shared parts see it.
 *
 * Every field optional, because the three document kinds overlap without
 * matching: a booking has no line items, an invoice has no package tiers, and
 * only a quotation has a validity date. A part reads the fields its kind
 * actually has, and the body for that kind is what decides which parts render
 * — so an optional-everything view is honest rather than lax. It also means
 * adding a field to one kind cannot silently break the parts of another.
 */
export type DocumentDetails = {
    documentTitle?: string;
    documentType?: string;
    occasion?: string;
    referenceNumber?: string;

    quotationNumber?: string;
    quotationDate?: string;
    validUntil?: string;

    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    paymentTerms?: string;
    againstQuotation?: string;
    reverseCharge?: boolean;
    declaration?: string;
    payments?: PaymentEntry[];

    bookingNumber?: string;
    enquiryDate?: string;
    status?: string;

    events?: EventType[];
    items?: ItemType[];
    taxMode?: "intra" | "inter" | "exempt";
    placeOfSupply?: string;
    advanceReceived?: number;

    packageTiers?: PackageTierType[];
    addOns?: AddOnType[];
    paymentSchedule?: MilestoneType[];
    deliveryTimeline?: TimelineType[];

    inclusions?: string[];
    exclusions?: string[];
    terms?: string[];
    additionalNotes?: string;

    sections?: Record<string, boolean | undefined>;
    [key: string]: unknown;
};

export type PartCtx = {
    data: AnyDocument;
    /** `d`, in the shared optional-field view above. */
    d: DocumentDetails;
    labels: DocumentLabels;
    theme: DocumentTheme;
    scale: DocumentScale;
    /**
     * Every figure on the document, derived once from the line items.
     *
     * Upstream recomputed totals in the form and again in the template, which
     * is how a preview comes to disagree with the PDF a client receives. There
     * is one computation and both read its result.
     */
    totals: Totals;
    /** BCP-47 tag used for date formatting. */
    locale: string;
    dir: "ltr" | "rtl";
    /**
     * Who this sheet is for.
     *
     * `crew` is the booking's call sheet, which gets forwarded to freelancers
     * over WhatsApp. It must not carry anything the family would not want
     * shared — their home address above all. The *body* already avoids it, but
     * the layouts render a client block in their masthead before any body
     * runs, so the redaction has to live in the shared parts.
     */
    audience: "client" | "crew";
};

/**
 * Which optional blocks this document shows.
 *
 * Returns a proxy-ish record rather than a fixed shape, because the three
 * kinds have different section lists — an invoice has `paymentHistory` and a
 * booking has `coverage`, neither of which a quotation knows about. Unknown
 * keys read as `true`, so a section added to a schema renders without having
 * to be registered here as well; a kind that wants one off says so explicitly
 * in its defaults.
 */
export function sectionsOf(data: AnyDocument): Record<string, boolean> {
    const stored: Record<string, boolean | undefined> =
        (data.details as DocumentDetails).sections ?? {};

    return new Proxy({} as Record<string, boolean>, {
        get(_target, key: string) {
            const value = stored[key];
            return value === undefined ? true : value;
        },
        has: () => true,
    });
}

/**
 * The document's own number and date, whichever kind it is.
 *
 * The three kinds name these differently (`quotationNumber` /
 * `invoiceNumber` / `bookingNumber`) because each is a legal identifier in its
 * own series, and renaming them to something generic would make every saved
 * document unreadable. The shared parts ask through here instead.
 */
/**
 * The heading this document prints, when the studio has not set its own.
 *
 * An invoice defaults to the label for its `documentType` — a Bill of Supply
 * must say "Bill of Supply", not "Tax Invoice", because the two are different
 * documents in law. A booking defaults to whichever of its two sheets is
 * being produced.
 */
export function defaultTitleOf(
    d: DocumentDetails,
    labels: DocumentLabels
): string {
    if (d.invoiceNumber !== undefined) {
        const byType: Record<string, string> = {
            "tax-invoice": "TAX INVOICE",
            proforma: "PROFORMA INVOICE",
            "bill-of-supply": "BILL OF SUPPLY",
            receipt: "RECEIPT",
        };
        return byType[d.documentType ?? "tax-invoice"] ?? "TAX INVOICE";
    }

    if (d.bookingNumber !== undefined) {
        return d.documentType === "crew"
            ? "CREW CALL SHEET"
            : "EVENT BOOKING SHEET";
    }

    return labels.quotation;
}

/** "Quotation for" / "Billed to" / "Booking for", by kind. */
export function recipientLabelOf(
    d: DocumentDetails,
    labels: DocumentLabels
): string {
    if (d.invoiceNumber !== undefined) return labels.invoiceFor;
    if (d.bookingNumber !== undefined) return labels.bookingFor;
    return labels.quotationFor;
}

export const documentNumberOf = (d: DocumentDetails): string =>
    d.quotationNumber || d.invoiceNumber || d.bookingNumber || "";

export const documentDateOf = (d: DocumentDetails): string | undefined =>
    d.quotationDate || d.invoiceDate || d.enquiryDate;

const money = (value: unknown) => formatINR(value, { display: "symbol" });
const plain = (value: unknown) => formatIndianDigits(value);

const isDataUrl = (value: string) => value.startsWith("data:");

/* ------------------------------------------------------------------ *
 * Small primitives
 * ------------------------------------------------------------------ */

export function SectionHeading({
    ctx,
    children,
}: {
    ctx: PartCtx;
    children: React.ReactNode;
}) {
    const { scale, theme } = ctx;
    return (
        <p
            className={`${scale.label} break-after-avoid font-semibold uppercase tracking-wider`}
            style={{ color: theme.accentColor }}
        >
            {children}
        </p>
    );
}

/**
 * The studio's logo.
 *
 * `plate` sits it on a small white card, for layouts that paint the logo onto
 * a dark accent panel — a user's logo is an arbitrary image and there is no
 * way to make an arbitrary image legible on an arbitrary dark colour by
 * manipulating it. Upstream wrapped this in `brightness(0) invert(1)` on the
 * assumption that every logo is a monochrome dark glyph needing a flip. That
 * is destructive rather than a contrast fix: `brightness(0)` multiplies every
 * channel by zero, so red, blue and white all become black, and `invert(1)`
 * then raises them all to pure white — a logo exported on an opaque canvas,
 * which is the common case, became a solid white rectangle.
 */
export function Logo({
    ctx,
    plate = false,
    size = 64,
}: {
    ctx: PartCtx;
    plate?: boolean;
    size?: number;
}) {
    const { data, labels } = ctx;
    if (!data.studio.logo) return null;

    const img = (
        <img
            src={data.studio.logo}
            width={180}
            height={size}
            alt={labels.logoAlt.replace("{name}", data.studio.brandName)}
            style={{ maxHeight: size, width: "auto", objectFit: "contain" }}
        />
    );

    if (!plate) return img;

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 6,
                padding: "6px 8px",
            }}
        >
            {img}
        </span>
    );
}

/* ------------------------------------------------------------------ *
 * Title & meta
 * ------------------------------------------------------------------ */

export function DocumentTitle({
    ctx,
    align = "right",
}: {
    ctx: PartCtx;
    align?: "left" | "right" | "center";
}) {
    const { d, labels, scale, theme } = ctx;
    const title = d.documentTitle || defaultTitleOf(d, labels);
    const validity = d.validUntil ? validityStatus(d.validUntil) : null;

    const alignClass =
        align === "right" ? "text-end" : align === "center" ? "text-center" : "";

    return (
        <div className={alignClass}>
            <div
                className={`${scale.heading} font-semibold uppercase tracking-tight`}
                style={{ color: theme.accentColor }}
            >
                {title}
            </div>
            {validity?.expired && (
                <p
                    className={`${scale.label} mt-0.5 font-semibold uppercase tracking-wide text-red-600`}
                >
                    {labels.expired}
                </p>
            )}
        </div>
    );
}

/** Quotation number, date, validity and reference, as label/value rows. */
export function DocumentMeta({
    ctx,
    align = "right",
}: {
    ctx: PartCtx;
    align?: "left" | "right";
}) {
    const { d, labels, scale, locale } = ctx;

    /*
     * Built from whichever fields this document kind actually has.
     *
     * The three name their identifier differently — `quotationNumber`,
     * `invoiceNumber`, `bookingNumber` — because each is a legal identifier in
     * its own numbered series, and collapsing them to one generic field would
     * make every already-saved document unreadable. So the block branches
     * rather than reaching for a single name, and each kind shows the second
     * date that means something to it: a quotation's validity, an invoice's
     * due date, a booking's status.
     */
    const rows: [string, string, string][] = [];

    if (d.quotationNumber !== undefined) {
        rows.push(
            [
                labels.quotationNumber,
                d.quotationNumber || "—",
                "details.quotationNumber",
            ],
            [
                labels.quotationDate,
                formatLongDate(d.quotationDate, locale),
                "details.quotationDate",
            ]
        );
        if (d.validUntil) {
            rows.push([
                labels.validUntil,
                formatLongDate(d.validUntil, locale),
                "details.validUntil",
            ]);
        }
    } else if (d.invoiceNumber !== undefined) {
        rows.push(
            [
                labels.invoiceNumber,
                d.invoiceNumber || "—",
                "details.invoiceNumber",
            ],
            [
                labels.invoiceDate,
                formatLongDate(d.invoiceDate, locale),
                "details.invoiceDate",
            ]
        );
        if (d.dueDate) {
            rows.push([
                labels.dueDate,
                formatLongDate(d.dueDate, locale),
                "details.dueDate",
            ]);
        }
        if (d.againstQuotation) {
            rows.push([
                labels.againstQuotation,
                d.againstQuotation,
                "details.againstQuotation",
            ]);
        }
    } else {
        rows.push(
            [
                labels.bookingNumber,
                d.bookingNumber || "—",
                "details.bookingNumber",
            ],
            [
                labels.enquiryDate,
                formatLongDate(d.enquiryDate, locale),
                "details.enquiryDate",
            ]
        );
        if (d.status) {
            rows.push([labels.status, d.status, "details.status"]);
        }
    }

    if (d.referenceNumber) {
        rows.push([
            labels.reference,
            d.referenceNumber,
            "details.referenceNumber",
        ]);
    }

    return (
        <div className={align === "right" ? "text-end" : ""}>
            {rows.map(([label, value, field]) => (
                <div
                    key={label}
                    data-edit-field={field}
                    className={`${scale.body} flex gap-3 ${
                        align === "right" ? "justify-end" : ""
                    }`}
                >
                    <span className="font-medium text-gray-500">{label}:</span>
                    <span className="tabular-nums text-gray-900">{value}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * "Wedding of Karthik & Divya" — the line that tells the client at a glance
 * that this quotation is theirs and not a template.
 */
export function OccasionBanner({ ctx }: { ctx: PartCtx }) {
    const { d, scale, theme } = ctx;
    const occasion = d.occasion?.trim();
    if (!occasion) return null;

    return (
        <div
            data-edit-field="details.occasion"
            className="rounded px-3 py-2"
            style={{ backgroundColor: tint(theme.accentColor, 0.9) }}
        >
            <p
                className={`${scale.name} font-semibold`}
                style={{ color: shade(theme.accentColor, 0.15) }}
            >
                {occasion}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Parties
 * ------------------------------------------------------------------ */

function addressBlock(party: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
}): string[] {
    const locality = [party.city, party.district]
        .map((p) => (p ?? "").trim())
        .filter(Boolean)
        // "Coimbatore, Coimbatore" reads like a bug, because it is one.
        .filter((part, i, all) => all.indexOf(part) === i)
        .join(", ");

    const region = [locality, (party.state ?? "").trim()]
        .filter(Boolean)
        .join(", ");
    const withPin = [region, (party.pincode ?? "").trim()]
        .filter(Boolean)
        .join(" - ");

    return [party.addressLine1, party.addressLine2, withPin]
        .map((line) => (line ?? "").trim())
        .filter(Boolean);
}

export function StudioBlock({
    ctx,
    heading,
    align = "left",
    showStatutory = true,
}: {
    ctx: PartCtx;
    heading?: string;
    align?: "left" | "right";
    showStatutory?: boolean;
}) {
    const { data, labels, scale } = ctx;
    const studio = data.studio;
    const lines = addressBlock(studio);

    return (
        <div
            className={align === "right" ? "text-end" : ""}
            data-edit-field="studio.brandName"
        >
            {heading && <SectionHeading ctx={ctx}>{heading}</SectionHeading>}

            <p className={`${scale.name} mt-1 font-semibold text-gray-900`}>
                {studio.brandName}
            </p>
            {studio.legalName && studio.legalName !== studio.brandName && (
                <p className={`${scale.label} text-gray-500`}>
                    {studio.legalName}
                </p>
            )}

            <address
                className={`${scale.body} mt-1 not-italic leading-relaxed text-gray-600`}
            >
                {lines.map((line, i) => (
                    <React.Fragment key={i}>
                        {line}
                        <br />
                    </React.Fragment>
                ))}
                {[studio.phone, studio.altPhone].filter(Boolean).join(" · ")}
                {studio.email && (
                    <>
                        <br />
                        {studio.email}
                    </>
                )}
                {studio.website && (
                    <>
                        <br />
                        {studio.website}
                    </>
                )}
            </address>

            {showStatutory && (studio.gstin || studio.pan) && (
                <div className={`${scale.label} mt-1 text-gray-600`}>
                    {studio.gstin && (
                        <p className="tabular-nums">
                            <span className="font-medium">{labels.gstin}:</span>{" "}
                            {studio.gstin}
                        </p>
                    )}
                    {studio.pan && (
                        <p className="tabular-nums">
                            <span className="font-medium">{labels.pan}:</span>{" "}
                            {studio.pan}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export function ClientBlock({
    ctx,
    heading,
    align = "left",
}: {
    ctx: PartCtx;
    heading?: string;
    align?: "left" | "right";
}) {
    const { data, labels, scale, audience } = ctx;
    const client = data.client;

    /*
     * A crew call sheet names the client and gives a phone number to ring on
     * the day; it does not give their home address, email or GSTIN. This is
     * the redaction, and it is here rather than in the crew body because the
     * layouts render this block in their masthead.
     */
    const forCrew = audience === "crew";
    const lines = forCrew ? [] : addressBlock(client);

    return (
        <div
            className={align === "right" ? "text-end" : ""}
            data-edit-field="client.name"
        >
            {heading && <SectionHeading ctx={ctx}>{heading}</SectionHeading>}

            <p className={`${scale.name} mt-1 font-semibold text-gray-900`}>
                {client.name}
            </p>
            {(client.contactPerson || client.relationship) && (
                <p className={`${scale.label} text-gray-500`}>
                    {[client.contactPerson, client.relationship]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
            )}

            <address
                className={`${scale.body} mt-1 not-italic leading-relaxed text-gray-600`}
            >
                {lines.map((line, i) => (
                    <React.Fragment key={i}>
                        {line}
                        <br />
                    </React.Fragment>
                ))}
                {[client.phone, client.altPhone].filter(Boolean).join(" · ")}
                {!forCrew && client.email && (
                    <>
                        <br />
                        {client.email}
                    </>
                )}
            </address>

            {!forCrew && client.gstin && (
                <p className={`${scale.label} mt-1 tabular-nums text-gray-600`}>
                    <span className="font-medium">{labels.gstin}:</span>{" "}
                    {client.gstin}
                </p>
            )}

            {!forCrew && client.customInputs?.map((input, i) => (
                <p key={i} className={`${scale.label} text-gray-600`}>
                    <span className="font-medium">{input.key}:</span>{" "}
                    {input.value}
                </p>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Function schedule
 * ------------------------------------------------------------------ */

/**
 * The event schedule — which day, where, and who is coming.
 *
 * The part a generic invoice app has no place for and the part a client reads
 * first. Leaving it in a free-text notes field is how a studio turns up to the
 * wrong venue.
 */
export function FunctionsTable({ ctx }: { ctx: PartCtx }) {
    const { data, d, labels, theme, scale, locale } = ctx;
    const events = (d.events ?? []).filter(
        (event) => event?.label?.trim() || event?.functionId || event?.date
    );
    if (!events.length) return null;

    const tamil = sectionsOf(data).tamilLabels;

    return (
        <div>
            <SectionHeading ctx={ctx}>{labels.functionsHeading}</SectionHeading>

            <table className="mt-2 w-full border-collapse">
                <thead>
                    <tr>
                        {[
                            labels.function,
                            labels.functionDate,
                            labels.functionTime,
                            labels.venue,
                            labels.crew,
                        ].map((head, i) => (
                            <th
                                key={head}
                                className={`${scale.label} border-b border-gray-300 pb-1 font-semibold uppercase tracking-wider ${
                                    i === 0 ? "text-start" : "text-start"
                                }`}
                                style={{ color: theme.accentColor }}
                            >
                                {head}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {events.map((event, index) => {
                        const fn = functionTypeById(event.functionId);
                        const name = event.label || fn?.label || "—";
                        const weekday = formatWeekday(event.date, locale);

                        return (
                            <tr
                                key={index}
                                data-edit-field={`details.events.${index}.label`}
                                className="break-inside-avoid border-b border-gray-200 align-top"
                            >
                                <td className={`${scale.rowY} pe-3`}>
                                    <p
                                        className={`${scale.body} font-medium text-gray-900`}
                                    >
                                        {name}
                                    </p>
                                    {tamil && fn?.tamil && (
                                        <p
                                            className={`${scale.label} text-gray-500`}
                                        >
                                            {fn.tamil}
                                        </p>
                                    )}
                                </td>
                                <td
                                    className={`${scale.rowY} ${scale.body} pe-3 whitespace-nowrap tabular-nums text-gray-700`}
                                >
                                    {formatShortDate(event.date, locale)}
                                    {weekday && (
                                        <span
                                            className={`${scale.label} block text-gray-500`}
                                        >
                                            {weekday}
                                        </span>
                                    )}
                                </td>
                                <td
                                    className={`${scale.rowY} ${scale.body} pe-3 whitespace-nowrap text-gray-700`}
                                >
                                    {formatTimeRange(
                                        event.startTime,
                                        event.endTime
                                    ) || "—"}
                                </td>
                                <td className={`${scale.rowY} ${scale.body} pe-3 text-gray-700`}>
                                    {event.venue || "—"}
                                    {event.city && (
                                        <span
                                            className={`${scale.label} block text-gray-500`}
                                        >
                                            {event.city}
                                        </span>
                                    )}
                                    {event.guestCount > 0 && (
                                        <span
                                            className={`${scale.label} block text-gray-500`}
                                        >
                                            {labels.guests}: {event.guestCount}
                                        </span>
                                    )}
                                </td>
                                <td className={`${scale.rowY} ${scale.body} text-gray-700`}>
                                    {event.crew || "—"}
                                    {event.notes && (
                                        <span
                                            className={`${scale.label} block whitespace-pre-line text-gray-500`}
                                        >
                                            {event.notes}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Line items
 * ------------------------------------------------------------------ */

export type ItemsTableProps = {
    ctx: PartCtx;
    /** Fills the header row with the accent instead of a hairline rule. */
    variant?: "rule" | "filled" | "plain";
};

export function ItemsTable({ ctx, variant = "rule" }: ItemsTableProps) {
    const { d, labels, theme, scale, totals } = ctx;

    /*
     * Skip rows that carry nothing. Validation no longer forces a line to be
     * complete before the document can be made, so an untouched row left over
     * from "add a line" would otherwise print as an empty ruled line.
     */
    const lines = totals.lines.filter(
        (line) =>
            line.name.trim() ||
            line.description.trim() ||
            line.quantity ||
            line.rate
    );

    const headFilled = variant === "filled";
    const showSac = d.taxMode !== "exempt";
    const anyDiscount = lines.some((l) => l.discountPercent > 0);
    const showGstColumn = d.taxMode !== "exempt";

    const columns: { head: string; align: "start" | "end" }[] = [
        { head: labels.item, align: "start" },
        ...(showSac ? [{ head: labels.sac, align: "start" as const }] : []),
        { head: labels.qty, align: "end" },
        { head: labels.rate, align: "end" },
        ...(anyDiscount ? [{ head: "%", align: "end" as const }] : []),
        // `gstPercent`, not `gstRate`: the latter is the GST summary table's
        // "Rate" column header, and reusing it here printed two columns both
        // headed "Rate" — one the unit price, one the tax percentage.
        ...(showGstColumn
            ? [{ head: labels.gstPercent, align: "end" as const }]
            : []),
        { head: labels.amount, align: "end" },
    ];

    return (
        <table className="w-full border-collapse">
            <thead>
                <tr
                    style={
                        headFilled
                            ? { backgroundColor: theme.accentColor }
                            : undefined
                    }
                >
                    {columns.map((column, i) => (
                        <th
                            key={`${column.head}-${i}`}
                            className={[
                                scale.label,
                                "font-semibold uppercase tracking-wider",
                                headFilled ? "px-2 py-2" : "pb-2",
                                column.align === "end" ? "text-end" : "text-start",
                                variant === "rule"
                                    ? "border-b-2 border-gray-300"
                                    : "",
                            ].join(" ")}
                            style={
                                headFilled
                                    ? { color: readableOn(theme.accentColor) }
                                    : { color: theme.accentColor }
                            }
                        >
                            {column.head}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {lines.map((line, index) => (
                    <tr
                        key={index}
                        // Row-level, so clicking a line in the preview lands on
                        // that line's name field rather than the first one.
                        data-edit-field={`details.items.${index}.name`}
                        className={`break-inside-avoid ${
                            variant === "plain" ? "" : "border-b border-gray-200"
                        }`}
                    >
                        <td
                            className={`${scale.rowY} ${headFilled ? "px-2" : ""} pe-3 align-top`}
                        >
                            <p className={`${scale.body} font-medium text-gray-900`}>
                                {line.name}
                            </p>
                            {line.description && (
                                <p
                                    className={`${scale.label} whitespace-pre-line text-gray-500`}
                                >
                                    {line.description}
                                </p>
                            )}
                        </td>

                        {showSac && (
                            <td
                                className={`${scale.rowY} ${scale.label} pe-3 align-top tabular-nums text-gray-500`}
                            >
                                {line.sac}
                            </td>
                        )}

                        <td
                            className={`${scale.rowY} ${scale.body} whitespace-nowrap pe-3 text-end align-top tabular-nums text-gray-700`}
                        >
                            {line.quantity}
                            {line.unit && (
                                <span className={`${scale.label} text-gray-500`}>
                                    {" "}
                                    {line.unit}
                                </span>
                            )}
                        </td>

                        <td
                            className={`${scale.rowY} ${scale.body} whitespace-nowrap pe-3 text-end align-top tabular-nums text-gray-700`}
                        >
                            {plain(line.rate)}
                        </td>

                        {anyDiscount && (
                            <td
                                className={`${scale.rowY} ${scale.body} whitespace-nowrap pe-3 text-end align-top tabular-nums text-gray-700`}
                            >
                                {line.discountPercent
                                    ? `${line.discountPercent}%`
                                    : "—"}
                            </td>
                        )}

                        {showGstColumn && (
                            <td
                                className={`${scale.rowY} ${scale.body} whitespace-nowrap pe-3 text-end align-top tabular-nums text-gray-700`}
                            >
                                {line.gstRate}%
                            </td>
                        )}

                        <td
                            className={`${scale.rowY} ${headFilled ? "px-2" : ""} ${scale.body} whitespace-nowrap text-end align-top font-medium tabular-nums text-gray-900`}
                        >
                            {/*
                              * The line's own amount — quantity x rate, less
                              * any discount on that line. Deliberately NOT
                              * `taxable`, which has the document-level
                              * discount apportioned onto it: a client reading
                              * "2 day @ 35,000" and seeing 67,222.22 in the
                              * amount column concludes the document is wrong.
                              * The discount is explained once, on its own row
                              * in the totals, and the apportioned values do
                              * their real work in the GST summary where the
                              * rules require them.
                              */}
                            {plain(line.netBeforeGlobal)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ------------------------------------------------------------------ *
 * GST summary
 * ------------------------------------------------------------------ */

/**
 * The rate-wise GST summary.
 *
 * Not decoration: a GST document has to show the taxable value and the tax
 * broken down per rate slab, because that is the shape the figures are filed
 * in. A studio billing an 18% service and a 12% printed album on one document
 * has two slabs, and a single "GST 18%" line would be wrong.
 */
export function GstSummaryTable({ ctx }: { ctx: PartCtx }) {
    const { labels, theme, scale, totals } = ctx;
    if (totals.taxMode === "exempt" || !totals.groups.length) return null;

    const interState = totals.taxMode === "inter";

    const heads = interState
        ? [labels.gstRate, labels.taxableValue, labels.igst, labels.taxTotal]
        : [
              labels.gstRate,
              labels.taxableValue,
              labels.cgst,
              labels.sgst,
              labels.taxTotal,
          ];

    return (
        <div>
            <SectionHeading ctx={ctx}>{labels.gstSummaryHeading}</SectionHeading>

            <table className="mt-2 w-full border-collapse">
                <thead>
                    <tr>
                        {heads.map((head, i) => (
                            <th
                                key={head}
                                className={`${scale.label} border-b border-gray-300 pb-1 font-semibold uppercase tracking-wider ${
                                    i === 0 ? "text-start" : "text-end"
                                }`}
                                style={{ color: theme.accentColor }}
                            >
                                {head}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {totals.groups.map((group) => (
                        <tr
                            key={group.gstRate}
                            className="border-b border-gray-200"
                        >
                            <td
                                className={`${scale.rowY} ${scale.body} tabular-nums text-gray-700`}
                            >
                                {group.gstRate}%
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} text-end tabular-nums text-gray-700`}
                            >
                                {plain(group.taxable)}
                            </td>
                            {interState ? (
                                <td
                                    className={`${scale.rowY} ${scale.body} text-end tabular-nums text-gray-700`}
                                >
                                    {plain(group.igst)}
                                </td>
                            ) : (
                                <>
                                    <td
                                        className={`${scale.rowY} ${scale.body} text-end tabular-nums text-gray-700`}
                                    >
                                        {plain(group.cgst)}
                                    </td>
                                    <td
                                        className={`${scale.rowY} ${scale.body} text-end tabular-nums text-gray-700`}
                                    >
                                        {plain(group.sgst)}
                                    </td>
                                </>
                            )}
                            <td
                                className={`${scale.rowY} ${scale.body} text-end font-medium tabular-nums text-gray-900`}
                            >
                                {plain(group.tax)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td
                            className={`${scale.rowY} ${scale.label} font-semibold uppercase tracking-wide text-gray-600`}
                        >
                            {labels.total}
                        </td>
                        <td
                            className={`${scale.rowY} ${scale.body} text-end font-semibold tabular-nums text-gray-900`}
                        >
                            {plain(totals.taxableValue)}
                        </td>
                        {interState ? (
                            <td
                                className={`${scale.rowY} ${scale.body} text-end font-semibold tabular-nums text-gray-900`}
                            >
                                {plain(totals.igst)}
                            </td>
                        ) : (
                            <>
                                <td
                                    className={`${scale.rowY} ${scale.body} text-end font-semibold tabular-nums text-gray-900`}
                                >
                                    {plain(totals.cgst)}
                                </td>
                                <td
                                    className={`${scale.rowY} ${scale.body} text-end font-semibold tabular-nums text-gray-900`}
                                >
                                    {plain(totals.sgst)}
                                </td>
                            </>
                        )}
                        <td
                            className={`${scale.rowY} ${scale.body} text-end font-semibold tabular-nums text-gray-900`}
                        >
                            {plain(totals.taxTotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Totals
 * ------------------------------------------------------------------ */

export function TotalsBlock({
    ctx,
    emphasis = "rule",
}: {
    ctx: PartCtx;
    /** `fill` paints the grand total row with the accent. */
    emphasis?: "rule" | "fill";
}) {
    const { d, labels, theme, scale, totals } = ctx;
    const details = d;

    const rows: [string, string][] = [];

    if (totals.lineDiscountTotal || totals.documentDiscount) {
        rows.push([labels.gross, plain(totals.gross)]);
    }
    if (totals.lineDiscountTotal) {
        rows.push([labels.lineDiscount, `- ${plain(totals.lineDiscountTotal)}`]);
    }
    if (totals.documentDiscount) {
        rows.push([
            labels.discount,
            `- ${plain(totals.documentDiscount)}`,
        ]);
    }
    if (totals.otherChargesTotal) {
        rows.push([labels.otherCharges, plain(totals.otherChargesTotal)]);
    }

    rows.push([labels.taxableValue, plain(totals.taxableValue)]);

    if (totals.taxMode === "inter" && totals.igst) {
        rows.push([labels.igst, plain(totals.igst)]);
    } else if (totals.taxMode === "intra") {
        if (totals.cgst) rows.push([labels.cgst, plain(totals.cgst)]);
        if (totals.sgst) rows.push([labels.sgst, plain(totals.sgst)]);
    }

    if (totals.roundOff) {
        const sign = totals.roundOff > 0 ? "+" : "-";
        rows.push([
            labels.roundOff,
            `${sign} ${plain(Math.abs(totals.roundOff))}`,
        ]);
    }

    return (
        <div className="w-full">
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className={`${scale.body} flex justify-between gap-6 py-0.5 text-gray-600`}
                >
                    <span>{label}</span>
                    <span className="tabular-nums">{value}</span>
                </div>
            ))}

            <div
                className={`mt-1 flex items-baseline justify-between gap-6 ${
                    emphasis === "fill" ? "rounded px-3 py-2" : "border-t-2 pt-2"
                }`}
                style={
                    emphasis === "fill"
                        ? {
                              backgroundColor: theme.accentColor,
                              color: readableOn(theme.accentColor),
                          }
                        : { borderColor: theme.accentColor }
                }
            >
                <span
                    className={`${scale.body} font-semibold uppercase tracking-wide`}
                >
                    {labels.grandTotal}
                </span>
                <span className={`${scale.total} font-bold tabular-nums`}>
                    {money(totals.grandTotal)}
                </span>
            </div>

            {totals.advanceReceived > 0 && (
                <>
                    <div
                        className={`${scale.body} mt-1 flex justify-between gap-6 text-gray-600`}
                    >
                        <span>{labels.advanceReceived}</span>
                        <span className="tabular-nums">
                            - {plain(totals.advanceReceived)}
                        </span>
                    </div>
                    <div
                        className={`${scale.body} flex justify-between gap-6 border-t pt-1 font-semibold text-gray-900`}
                        style={{ borderColor: tint(theme.accentColor, 0.5) }}
                    >
                        <span>{labels.balanceDue}</span>
                        <span className="tabular-nums">
                            {money(totals.balanceDue)}
                        </span>
                    </div>
                </>
            )}

            <p className={`${scale.label} mt-1.5 italic text-gray-500`}>
                {labels.totalInWords}:{" "}
                {amountInWordsINR(
                    totals.advanceReceived > 0
                        ? totals.balanceDue
                        : totals.grandTotal
                )}
            </p>

            {totals.taxMode === "exempt" && (
                <p className={`${scale.label} mt-1 text-gray-500`}>
                    {ctx.data.studio.unregisteredNote ||
                        labels.notGstRegistered}
                </p>
            )}

            {totals.taxMode !== "exempt" && details.placeOfSupply && (
                <p className={`${scale.label} mt-1 text-gray-500`}>
                    {labels.placeOfSupply}: {details.placeOfSupply}
                </p>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Package tiers
 * ------------------------------------------------------------------ */

/**
 * Tiers side by side.
 *
 * A quotation stating one number invites a negotiation about that number;
 * three columns turn it into a choice between options. The recommended tier is
 * marked, because an unguided choice between three is harder than a guided one.
 */
export function PackageTiers({ ctx }: { ctx: PartCtx }) {
    const { d, labels, theme, scale } = ctx;
    const tiers = (d.packageTiers ?? []).filter((tier) => tier?.name?.trim());
    if (!tiers.length) return null;

    return (
        <div>
            <SectionHeading ctx={ctx}>{labels.packagesHeading}</SectionHeading>

            <div
                className="mt-2 grid gap-3"
                style={{
                    gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, minmax(0, 1fr))`,
                }}
            >
                {tiers.map((tier, index) => {
                    const highlighted = tier.recommended;
                    return (
                        <div
                            key={index}
                            data-edit-field={`details.packageTiers.${index}.name`}
                            className="rounded border p-3"
                            style={{
                                borderColor: highlighted
                                    ? theme.accentColor
                                    : "#E5E7EB",
                                backgroundColor: highlighted
                                    ? tint(theme.accentColor, 0.93)
                                    : "#ffffff",
                                borderWidth: highlighted ? 2 : 1,
                            }}
                        >
                            {highlighted && (
                                <p
                                    className={`${scale.label} font-semibold uppercase tracking-wider`}
                                    style={{ color: theme.accentColor }}
                                >
                                    {labels.recommended}
                                </p>
                            )}
                            <p
                                className={`${scale.name} font-semibold text-gray-900`}
                            >
                                {tier.name}
                            </p>
                            {tier.tagline && (
                                <p className={`${scale.label} text-gray-500`}>
                                    {tier.tagline}
                                </p>
                            )}
                            <p
                                className={`${scale.total} mt-1 font-bold tabular-nums`}
                                style={{ color: theme.accentColor }}
                            >
                                {money(tier.amount)}
                            </p>

                            {tier.highlights?.length > 0 && (
                                <ul className={`${scale.label} mt-1.5 space-y-0.5 text-gray-600`}>
                                    {tier.highlights.map((line, i) => (
                                        <li key={i} className="flex gap-1.5">
                                            <span
                                                aria-hidden="true"
                                                style={{ color: theme.accentColor }}
                                            >
                                                •
                                            </span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function AddOnsTable({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const addOns = (d.addOns ?? []).filter((addOn) => addOn?.name?.trim());
    if (!addOns.length) return null;

    return (
        <div>
            <SectionHeading ctx={ctx}>{labels.addOnsHeading}</SectionHeading>

            <table className="mt-2 w-full border-collapse">
                <tbody>
                    {addOns.map((addOn, index) => (
                        <tr
                            key={index}
                            data-edit-field={`details.addOns.${index}.name`}
                            className="border-b border-gray-200 align-top"
                        >
                            <td className={`${scale.rowY} pe-3`}>
                                <p
                                    className={`${scale.body} font-medium text-gray-900`}
                                >
                                    {addOn.name}
                                </p>
                                {addOn.description && (
                                    <p className={`${scale.label} text-gray-500`}>
                                        {addOn.description}
                                    </p>
                                )}
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} whitespace-nowrap text-end tabular-nums text-gray-700`}
                            >
                                {money(addOn.rate)}
                                {addOn.unit && (
                                    <span className={`${scale.label} text-gray-500`}>
                                        {" "}
                                        / {addOn.unit}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Schedule & timeline
 * ------------------------------------------------------------------ */

export function PaymentScheduleTable({ ctx }: { ctx: PartCtx }) {
    const { d, labels, theme, scale, totals } = ctx;
    const schedule = (d.paymentSchedule ?? []).filter(
        (milestone) => milestone?.label?.trim() || Number(milestone?.percent)
    );
    if (!schedule.length) return null;

    return (
        <div>
            <SectionHeading ctx={ctx}>
                {labels.paymentScheduleHeading}
            </SectionHeading>

            <table className="mt-2 w-full border-collapse">
                <thead>
                    <tr>
                        {[
                            labels.milestone,
                            labels.milestoneDue,
                            labels.milestonePercent,
                            labels.amount,
                        ].map((head, i) => (
                            <th
                                key={head}
                                className={`${scale.label} border-b border-gray-300 pb-1 font-semibold uppercase tracking-wider ${
                                    i >= 2 ? "text-end" : "text-start"
                                }`}
                                style={{ color: theme.accentColor }}
                            >
                                {head}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {schedule.map((milestone, index) => (
                        <tr
                            key={index}
                            data-edit-field={`details.paymentSchedule.${index}.label`}
                            className="border-b border-gray-200"
                        >
                            <td
                                className={`${scale.rowY} ${scale.body} pe-3 font-medium text-gray-900`}
                            >
                                {milestone.label}
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} pe-3 text-gray-600`}
                            >
                                {milestone.due || "—"}
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} text-end tabular-nums text-gray-700`}
                            >
                                {milestone.percent}%
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} whitespace-nowrap text-end font-medium tabular-nums text-gray-900`}
                            >
                                {plain(
                                    (totals.grandTotal * milestone.percent) / 100
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function TimelineBlock({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const timeline = (d.deliveryTimeline ?? []).filter(
        (entry) => entry?.item?.trim()
    );
    if (!timeline.length) return null;

    return (
        <div>
            <SectionHeading ctx={ctx}>{labels.timelineHeading}</SectionHeading>
            <div className={`${scale.body} mt-1.5 space-y-0.5 text-gray-700`}>
                {timeline.map((entry, index) => (
                    <div
                        key={index}
                        data-edit-field={`details.deliveryTimeline.${index}.item`}
                        className="flex justify-between gap-4"
                    >
                        <span>{entry.item}</span>
                        <span className="whitespace-nowrap tabular-nums text-gray-600">
                            {labels.timelineWithin} {entry.days}{" "}
                            {labels.timelineDays}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Lists & notes
 * ------------------------------------------------------------------ */

export function ListBlock({
    ctx,
    heading,
    items,
    field,
    marker = "bullet",
}: {
    ctx: PartCtx;
    heading: string;
    items: string[] | undefined;
    field?: string;
    marker?: "bullet" | "check" | "cross" | "number";
}) {
    const { theme, scale } = ctx;
    const lines = (items ?? []).filter((line) => line?.trim());
    if (!lines.length) return null;

    const glyph = (index: number) => {
        if (marker === "number") return `${index + 1}.`;
        if (marker === "check") return "✓";
        if (marker === "cross") return "×";
        return "•";
    };

    const glyphColor =
        marker === "cross" ? "#9CA3AF" : theme.accentColor;

    return (
        <div data-edit-field={field}>
            <SectionHeading ctx={ctx}>{heading}</SectionHeading>
            <ul className={`${scale.body} mt-1.5 space-y-0.5 text-gray-700`}>
                {lines.map((line, index) => (
                    <li key={index} className="flex gap-1.5">
                        <span
                            aria-hidden="true"
                            className="tabular-nums"
                            style={{ color: glyphColor }}
                        >
                            {glyph(index)}
                        </span>
                        <span>{line}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function NotesBlock({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const notes = d.additionalNotes?.trim();
    if (!notes) return null;

    return (
        <div data-edit-field="details.additionalNotes">
            <SectionHeading ctx={ctx}>{labels.additionalNotes}</SectionHeading>
            <p className={`${scale.body} mt-1 whitespace-pre-line text-gray-700`}>
                {notes}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Payment details
 * ------------------------------------------------------------------ */

/**
 * Bank details and the UPI QR.
 *
 * The QR is the reason this block earns its space: a client reading the PDF on
 * a phone — which is how almost every quotation in this market is read — can
 * pay the advance without typing an account number, and the booking is
 * confirmed in the same minute they decided.
 */
export function PaymentDetailsBlock({
    ctx,
    layout = "stacked",
}: {
    ctx: PartCtx;
    layout?: "stacked" | "inline";
}) {
    const { data, labels, scale } = ctx;
    const sections = sectionsOf(data);
    const studio = data.studio;
    const bank = studio.bank;

    const hasBank = Boolean(
        sections.bankDetails &&
            (bank?.bankName || bank?.accountNumber || bank?.accountName)
    );
    const hasUpi = Boolean(studio.upiId);
    const hasQr = Boolean(sections.upiQr && studio.upiQr);

    if (!hasBank && !hasUpi && !hasQr) return null;

    const rows: [string, string][] = [];
    if (hasBank) {
        if (bank?.accountName) rows.push([labels.accountName, bank.accountName]);
        if (bank?.accountNumber)
            rows.push([labels.accountNumber, bank.accountNumber]);
        if (bank?.ifsc) rows.push([labels.ifsc, bank.ifsc]);
        if (bank?.bankName) rows.push([labels.bankName, bank.bankName]);
        if (bank?.branch) rows.push([labels.branch, bank.branch]);
    }
    if (hasUpi) rows.push([labels.upiId, studio.upiId]);

    return (
        <div
            data-edit-field="studio.bank.accountNumber"
            className={layout === "inline" ? "flex items-start gap-4" : ""}
        >
            <div className="flex-1">
                <SectionHeading ctx={ctx}>{labels.paymentHeading}</SectionHeading>
                <div className={`${scale.body} mt-1 text-gray-700`}>
                    {rows.map(([label, value]) => (
                        <p key={label} className="tabular-nums">
                            <span className="text-gray-500">{label}:</span>{" "}
                            {value}
                        </p>
                    ))}
                </div>
            </div>

            {hasQr && (
                <div className="text-center">
                    <img
                        src={studio.upiQr}
                        width={96}
                        height={96}
                        alt={labels.upiQrAlt.replace("{name}", studio.brandName)}
                        style={{
                            width: 96,
                            height: 96,
                            objectFit: "contain",
                        }}
                    />
                    <p className={`${scale.label} mt-0.5 text-gray-500`}>
                        {labels.scanToPay}
                    </p>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Sign-off
 * ------------------------------------------------------------------ */

export function SignatureBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale } = ctx;
    if (!sectionsOf(data).signature) return null;

    const studio = data.studio;
    const signature = studio.signature;
    const hasAnything =
        signature || studio.signatoryName || studio.seal;
    if (!hasAnything) return null;

    return (
        <div className="text-end" data-edit-field="studio.signatoryName">
            <p className={`${scale.label} text-gray-500`}>
                {labels.forStudio.replace("{name}", studio.brandName)}
            </p>

            <div className="mt-1 flex items-end justify-end gap-3">
                {studio.seal && (
                    <img
                        src={studio.seal}
                        width={64}
                        height={64}
                        alt={labels.sealAlt.replace("{name}", studio.brandName)}
                        style={{ width: 56, height: 56, objectFit: "contain" }}
                    />
                )}

                {signature &&
                    (isDataUrl(signature) ? (
                        <img
                            src={signature}
                            width={120}
                            height={56}
                            alt={labels.signatureAlt.replace(
                                "{name}",
                                studio.brandName
                            )}
                            style={{ maxHeight: 56, width: "auto" }}
                        />
                    ) : (
                        <p
                            style={{
                                fontSize: 26,
                                fontFamily: `${studio.signatureFontFamily || "cursive"}, cursive`,
                                color: "#111827",
                                lineHeight: 1.2,
                            }}
                        >
                            {signature}
                        </p>
                    ))}
            </div>

            <div className="mt-1 border-t border-gray-400 pt-1">
                {studio.signatoryName && (
                    <p className={`${scale.body} font-medium text-gray-900`}>
                        {studio.signatoryName}
                    </p>
                )}
                <p className={`${scale.label} text-gray-500`}>
                    {studio.signatoryDesignation || labels.signature}
                </p>
            </div>
        </div>
    );
}

/**
 * Where the client signs.
 *
 * A quotation that cannot be accepted is a price list. This turns the document
 * into something the family can sign and send back, which is how a studio
 * stops re-confirming scope over WhatsApp three weeks later.
 */
export function AcceptanceBlock({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale, theme } = ctx;
    if (!sectionsOf(data).acceptanceBlock) return null;

    return (
        <div
            className="rounded border p-3"
            style={{ borderColor: tint(theme.accentColor, 0.6) }}
        >
            <SectionHeading ctx={ctx}>{labels.acceptanceHeading}</SectionHeading>
            <p className={`${scale.body} mt-1 text-gray-700`}>
                {labels.acceptanceBody}
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
    );
}

export function ContactFooter({ ctx }: { ctx: PartCtx }) {
    const { data, labels, scale } = ctx;
    const studio = data.studio;

    const channels = [
        studio.phone,
        studio.whatsapp && studio.whatsapp !== studio.phone
            ? `WhatsApp ${studio.whatsapp}`
            : "",
        studio.email,
        studio.instagram,
    ].filter(Boolean);

    return (
        <div className={`${scale.label} text-gray-500`}>
            <p>{labels.contactHeading}</p>
            <p className="mt-0.5 font-medium text-gray-700">
                {channels.join(" · ")}
            </p>
        </div>
    );
}

export function ThankYouLine({ ctx }: { ctx: PartCtx }) {
    const { labels, scale, theme } = ctx;
    return (
        <p
            className={`${scale.body} italic`}
            style={{ color: shade(theme.accentColor, 0.1) }}
        >
            {labels.thankYou}
        </p>
    );
}

/* ------------------------------------------------------------------ *
 * Invoice-only blocks
 * ------------------------------------------------------------------ */

/**
 * What has actually been received, and when.
 *
 * A quotation promises a schedule of future milestones; an invoice records
 * money that has arrived. Printing the receipts — date, mode and reference —
 * is what lets a client reconcile against their own bank statement without
 * ringing the studio, and it is what makes the balance line believable.
 */
export function PaymentHistoryTable({ ctx }: { ctx: PartCtx }) {
    const { d, labels, theme, scale, locale, totals } = ctx;
    const payments = (d.payments ?? []).filter(
        (payment) => Number(payment?.amount ?? 0) !== 0
    );
    if (!payments.length) return null;

    return (
        <div>
            <SectionHeading ctx={ctx}>
                {labels.paymentsHeading}
            </SectionHeading>

            <table className="mt-2 w-full border-collapse">
                <thead>
                    <tr>
                        {[
                            labels.paymentDate,
                            labels.paymentMode,
                            labels.paymentReference,
                            labels.amount,
                        ].map((head, i) => (
                            <th
                                key={head}
                                className={`${scale.label} break-after-avoid border-b border-gray-300 pb-1 font-semibold uppercase tracking-wider ${
                                    i === 3 ? "text-end" : "text-start"
                                }`}
                                style={{ color: theme.accentColor }}
                            >
                                {head}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((payment, index) => (
                        <tr
                            key={index}
                            data-edit-field={`details.payments.${index}.amount`}
                            className="break-inside-avoid border-b border-gray-200"
                        >
                            <td
                                className={`${scale.rowY} ${scale.body} whitespace-nowrap pe-3 tabular-nums text-gray-700`}
                            >
                                {formatShortDate(payment.date, locale)}
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} pe-3 text-gray-700`}
                            >
                                {paymentModeLabel(payment.mode)}
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.label} pe-3 text-gray-500`}
                            >
                                {payment.reference || "—"}
                            </td>
                            <td
                                className={`${scale.rowY} ${scale.body} whitespace-nowrap text-end font-medium tabular-nums text-gray-900`}
                            >
                                {plain(payment.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td
                            colSpan={3}
                            className={`${scale.rowY} ${scale.label} font-semibold uppercase tracking-wide text-gray-600`}
                        >
                            {labels.totalReceived}
                        </td>
                        <td
                            className={`${scale.rowY} ${scale.body} text-end font-semibold tabular-nums text-gray-900`}
                        >
                            {plain(totals.advanceReceived)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

/**
 * The declaration an Indian tax invoice carries above the signature, and the
 * reverse-charge answer, which is required even when it is "No".
 */
export function DeclarationBlock({ ctx }: { ctx: PartCtx }) {
    const { d, labels, scale } = ctx;
    const declaration = d.declaration?.trim();
    const showReverseCharge = d.taxMode !== "exempt";

    if (!declaration && !showReverseCharge) return null;

    return (
        <div className="break-inside-avoid">
            {showReverseCharge && (
                <p className={`${scale.label} text-gray-600`}>
                    {labels.reverseCharge}:{" "}
                    <span className="font-medium">
                        {d.reverseCharge ? labels.yes : labels.no}
                    </span>
                </p>
            )}
            {declaration && (
                <>
                    <p
                        className={`${scale.label} mt-1 font-semibold uppercase tracking-wider text-gray-500`}
                    >
                        {labels.declarationHeading}
                    </p>
                    <p
                        className={`${scale.label} mt-0.5 whitespace-pre-line text-gray-600`}
                    >
                        {declaration}
                    </p>
                </>
            )}
        </div>
    );
}

/**
 * Paid / Partly paid / Unpaid / Overdue, stamped beside the title.
 *
 * Derived from the payments and the due date, never stored — a stored status
 * is wrong the moment a payment is recorded or the due date passes without
 * anyone reopening the document.
 */
export function PaymentStatusStamp({ ctx }: { ctx: PartCtx }) {
    const { d, scale, totals } = ctx;
    if (!d.payments) return null;

    const status = paymentStatus({
        grandTotal: totals.grandTotal,
        received: totals.advanceReceived,
        dueDate: d.dueDate,
    });

    return (
        <span
            className={`${scale.label} inline-block rounded border px-2 py-0.5 font-semibold uppercase tracking-wider`}
            style={{ color: status.color, borderColor: status.color }}
        >
            {status.label}
        </span>
    );
}
