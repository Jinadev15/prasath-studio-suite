import { z } from "zod";

import {
    num,
    ClientSchema as BaseClientSchema,
    StudioSchema,
    ThemeSchema,
    nonNegative,
    optionalIsoDate,
    text,
} from "@/lib/documents/common";
import {
    ALBUM_SIZES,
    ALBUM_TYPES,
    BOOKING_STATUSES,
    ENQUIRY_SOURCES,
    FUNCTION_SETTINGS,
    LANGUAGE_PREFERENCES,
    STYLE_PREFERENCES,
} from "./options";


/* ------------------------------------------------------------------ *
 * Booking-only helpers
 * ------------------------------------------------------------------ */

/**
 * A guest count.
 *
 * Separate from `count` because the two have very different ceilings: a crew
 * is single digits, a Tamil Nadu reception is routinely four. The shared
 * `count` capped at 999 and rejected a 1,000-guest reception outright, which
 * is a perfectly ordinary booking here.
 */
const guestCount = num(
    z
        .number()
        .int({ message: "Must be a whole number" })
        .min(0, { message: "Must be zero or more" })
        .max(100000, { message: "That looks too large" })
);

/** A count of crew or items. Integers only — half a photographer is a typo. */
const count = num(
    z
        .number()
        .int({ message: "Must be a whole number" })
        .min(0, { message: "Must be zero or more" })
        .max(999, { message: "That looks too large" })
);

/**
 * An enum that tolerates a blank, because every one of these is optional on an
 * enquiry taken over the phone in ninety seconds.
 */
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
    z.enum(values).or(z.literal("")).optional().default("");

/* ------------------------------------------------------------------ *
 * The family, not just the buyer
 * ------------------------------------------------------------------ */

/**
 * A named person with a phone: the people a booking depends on but who are
 * not the client — the secondary decision maker, and the VIPs who must appear
 * in the photographs.
 */
const PersonSchema = z.object({
    name: text(60),
    /** "Bride's mother", "Thatha", "Mama" — relation, not a job title. */
    relation: text(40),
    phone: text(20),
});

/**
 * A wedding booking has at least four people who matter: whoever is paying,
 * whoever actually approves things, the bride and the groom. The shared client
 * block holds the first; these are the rest, and knowing who approves is the
 * difference between one phone call and four.
 */
const ClientSchema = BaseClientSchema.extend({
    brideName: text(60),
    brideFamily: text(90),
    groomName: text(60),
    groomFamily: text(90),
    decisionMaker: PersonSchema.optional(),
});

/* ------------------------------------------------------------------ *
 * Functions — the heart of the record
 * ------------------------------------------------------------------ */

/** Crew counted per role, so a day's headcount can actually be summed. */
const CrewSchema = z.object({
    candidPhotographers: count,
    traditionalPhotographers: count,
    cinematographers: count,
    traditionalVideographers: count,
    drone: count,
    assistants: count,
});

/**
 * One function: a day, a venue, a crew and a brief.
 *
 * A wedding booking is three to six of these on different days at different
 * venues. The client reads this to check the studio understood the brief; the
 * crew reads it on the morning to know where to be and when. It is the one
 * part of the record that must not be a paragraph.
 */
const BookingFunctionSchema = z.object({
    /** Catalogue id from FUNCTION_TYPES, or "other" with a custom label. */
    functionId: text(40),
    /** What the sheets print. Defaults from the catalogue, overridable. */
    label: text(80),

    date: optionalIsoDate,
    /** 24-hour "HH:MM" as typed; rendered 12-hour. See lib/india/dates. */
    startTime: text(10),
    endTime: text(10),
    /**
     * The muhurtham, where the function has one.
     *
     * A minute, not an hour, and the one moment on the booking that cannot be
     * re-shot. Separate from the start time because the crew arrives before.
     */
    muhurthamTime: text(10),

    venue: text(120),
    venueAddress: text(200),
    district: text(50),
    guestCount: guestCount,
    setting: optionalEnum(FUNCTION_SETTINGS),

    /** Catalogue service ids wanted at this function. */
    services: z.array(z.string().max(40)).optional().default([]),
    crew: CrewSchema.optional(),

    /** Someone at the venue who can be called on the day. */
    coordinatorName: text(60),
    coordinatorPhone: text(20),

    notes: text(300),
});

/* ------------------------------------------------------------------ *
 * Coverage & deliverables
 * ------------------------------------------------------------------ */

const AlbumSchema = z.object({
    type: optionalEnum(ALBUM_TYPES),
    size: optionalEnum(ALBUM_SIZES),
    /** Sheets, not pages — a sheet is two facing pages in an album. */
    sheets: count,
    quantity: num(z.number().int().min(1).max(99), 1),
    notes: text(120),
});

/**
 * What the family expects to receive.
 *
 * Asked at booking rather than at delivery, because "we assumed the parent
 * albums were included" is a conversation that only ever happens when nobody
 * wrote the number down nine months earlier.
 */
const CoverageSchema = z.object({
    albums: z.array(AlbumSchema).optional().default([]),
    /** Framed enlargements for the house. */
    frames: count,
    frameSize: text(20),

    /** Film ids from FILM_TYPES. */
    films: z.array(z.string().max(40)).optional().default([]),
    editedPhotoCount: count,

    /** Delivery mode ids from RAW_DELIVERY_MODES. */
    rawDelivery: z.array(z.string().max(40)).optional().default([]),
    /** "Albums before Deepavali" — what they have actually been promised. */
    deliveryExpectation: text(200),
    notes: text(500),
});

/* ------------------------------------------------------------------ *
 * Details & preferences
 * ------------------------------------------------------------------ */

const PreferencesSchema = z.object({
    /** The shots that must exist, in the family's own words. */
    mustHaveShots: z.array(z.string().max(200)).optional().default([]),
    /** People who must be photographed, and who they are. */
    vips: z.array(PersonSchema).optional().default([]),

    stylePreference: optionalEnum(STYLE_PREFERENCES),
    /** Checklist ids from KNOWN_CONSTRAINTS, plus anything typed. */
    constraints: z.array(z.string().max(120)).optional().default([]),
    languagePreference: optionalEnum(LANGUAGE_PREFERENCES),

    /** Food and access for the crew — a real cost and a real courtesy. */
    crewNotes: text(300),
    /** Parking, gate, lift, which entrance the equipment goes through. */
    venueAccessNotes: text(300),
});

/* ------------------------------------------------------------------ *
 * Commercials
 * ------------------------------------------------------------------ */

/**
 * Money, as a range rather than a price.
 *
 * This is not a quotation. At enquiry the studio knows roughly what the family
 * wants to spend and what advance it will ask for; pretending to a line-item
 * total here would produce a figure the client later treats as a quote. Both
 * figures are indicative and the booking sheet labels them so.
 */
const CommercialsSchema = z.object({
    budgetMin: nonNegative.optional().default(0),
    budgetMax: nonNegative.optional().default(0),
    advanceExpected: nonNegative.optional().default(0),
    /** The quotation this booking came from, if one exists yet. */
    quotationReference: text(40),

    /**
     * The studio talking to itself.
     *
     * NEVER printed on either PDF. The booking sheet goes to the client and
     * the call sheet is forwarded to freelancers over WhatsApp; a note reading
     * "mother is difficult, quote 15% higher" on either is a lost booking.
     * Enforced in the templates, not here — see DocumentBody and CrewCallBody.
     */
    internalNotes: z.string().max(2000).optional().default(""),

    /** Explicit, because using a family's wedding photographs is not implied. */
    portfolioConsent: z.boolean().optional().default(false),
    termsAccepted: z.boolean().optional().default(false),
});

/* ------------------------------------------------------------------ *
 * Presentation
 * ------------------------------------------------------------------ */


/**
 * Which of the two sheets is being produced.
 *
 * Not two documents in two apps: the same record, printed for two audiences.
 * The crew sheet is the booking sheet with the client's address, the money and
 * the internal notes removed — which is exactly the kind of difference that
 * gets forgotten when it is maintained as a separate template.
 */
export const BOOKING_OUTPUTS = ["booking", "crew"] as const;
export type BookingOutputId = (typeof BOOKING_OUTPUTS)[number];

/**
 * Which optional blocks the sheets render.
 *
 * Toggles rather than "leave it blank to hide it": a studio booking a single
 * birthday shoot should not have to delete the deliverables to get a sheet
 * without them, and a half-filled section hidden by accident is worse than one
 * switched off on purpose.
 */
const SectionsSchema = z.object({
    functions: z.boolean().optional().default(true),
    coverage: z.boolean().optional().default(true),
    preferences: z.boolean().optional().default(true),
    shotList: z.boolean().optional().default(true),
    vips: z.boolean().optional().default(true),
    commercials: z.boolean().optional().default(true),
    familyDetails: z.boolean().optional().default(true),
    terms: z.boolean().optional().default(true),
    bankDetails: z.boolean().optional().default(true),
    upiQr: z.boolean().optional().default(true),
    signature: z.boolean().optional().default(true),
    acceptanceBlock: z.boolean().optional().default(true),
    tamilLabels: z.boolean().optional().default(false),
});

/* ------------------------------------------------------------------ *
 * Details
 * ------------------------------------------------------------------ */

const DetailsSchema = z.object({
    documentTitle: z.string().max(40).optional().default("EVENT BOOKING SHEET"),
    documentType: z.enum(BOOKING_OUTPUTS).optional().default("booking"),

    bookingNumber: text(40),
    enquiryDate: optionalIsoDate,
    status: z.enum(BOOKING_STATUSES).optional().default("Enquiry"),

    source: optionalEnum(ENQUIRY_SOURCES),
    /** Who referred them. Only meaningful when the source is a referral. */
    referralName: text(80),
    /** The studio's own staff member who owns this booking. */
    assignedTo: text(60),

    /** "Wedding of Karthik & Divya" — the headline on both sheets. */
    occasion: text(120),

    functions: z.array(BookingFunctionSchema).optional().default([]),
    coverage: CoverageSchema.optional(),
    preferences: PreferencesSchema.optional(),
    commercials: CommercialsSchema.optional(),

    terms: z.array(z.string().max(300)).optional().default([]),
    additionalNotes: z.string().max(1500).optional().default(""),

    sections: SectionsSchema.optional(),
    theme: ThemeSchema.optional(),
    pdfTemplate: num(z.number().int().min(1), 1),
    updatedAt: text(40),
});

export const BookingSchema = z.object({
    studio: StudioSchema,
    client: ClientSchema,
    details: DetailsSchema,
});

export {
    AlbumSchema,
    BookingFunctionSchema,
    CommercialsSchema,
    CoverageSchema,
    CrewSchema,
    PersonSchema,
    PreferencesSchema,
    SectionsSchema,
    StudioSchema,
    ThemeSchema,
};
