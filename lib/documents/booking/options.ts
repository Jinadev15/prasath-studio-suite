/**
 * The closed sets of answers a booking form asks for.
 *
 * Every one of these was a free-text field in the notebook this app replaces,
 * and a free-text field is why "Instagram", "insta", "IG" and "social media"
 * end up in the same column and the studio can never answer "where does our
 * work actually come from". The sets are small and the "Other" escape hatch is
 * explicit, so nothing is unanswerable.
 *
 * No React, no Next.js: read by the form, the templates and the PDF route.
 */

/* ------------------------------------------------------------------ *
 * Enquiry
 * ------------------------------------------------------------------ */

/**
 * Where a booking is in its life.
 *
 * One record, not four. A studio that keeps enquiries in one place, quotations
 * in another and confirmed bookings in a third loses the venue address between
 * them; the status moves and the record stays.
 */
export const BOOKING_STATUSES = [
    "Enquiry",
    "Quoted",
    "Confirmed",
    "Completed",
    "Cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const DEFAULT_BOOKING_STATUS: BookingStatus = "Enquiry";

export const ENQUIRY_SOURCES = [
    "Instagram",
    "Referral",
    "Wedding fair",
    "Walk-in",
    "Google",
    "Other",
] as const;

/** The source whose follow-up field ("who referred them") actually matters. */
export const SOURCE_NEEDING_NAME = "Referral";

/* ------------------------------------------------------------------ *
 * Client & family
 * ------------------------------------------------------------------ */

/**
 * Who the studio is answering to.
 *
 * A wedding has two families, and they do not always agree about what was
 * agreed. Recording which side booked the work decides who gets the call when
 * the muhurtham time moves.
 */
export const CLIENT_RELATIONSHIPS = [
    "Bride's family",
    "Groom's family",
    "Couple",
    "Company",
    "Event planner",
    "Other",
] as const;

/* ------------------------------------------------------------------ *
 * Functions
 * ------------------------------------------------------------------ */

/** Indoor or outdoor changes the lighting plan, so the crew needs it told. */
export const FUNCTION_SETTINGS = ["Indoor", "Outdoor", "Both"] as const;

/**
 * Crew counted by role rather than described in a sentence.
 *
 * The quotation app carries a free-text "crew plan" field, which is fine on a
 * document a client reads. It is not fine on a call sheet: "2 candid + 1
 * traditional + drone" cannot be summed across five functions to answer "how
 * many cameras do I need on the 14th", which is the question the studio is
 * actually asking when it opens this.
 */
export const CREW_ROLES = [
    { id: "candidPhotographers", label: "Candid photographers" },
    { id: "traditionalPhotographers", label: "Traditional photographers" },
    { id: "cinematographers", label: "Cinematographers" },
    { id: "traditionalVideographers", label: "Traditional video" },
    { id: "drone", label: "Drone operators" },
    { id: "assistants", label: "Assistants" },
] as const;

export type CrewRoleId = (typeof CREW_ROLES)[number]["id"];

/**
 * Functions where a muhurtham time is a real field rather than noise.
 *
 * The muhurtham is a minute, not an hour, and it is the one moment on the whole
 * booking that cannot be re-shot. It is asked separately from the start time
 * because the crew arrives hours earlier.
 */
export const MUHURTHAM_FUNCTIONS = new Set([
    "muhurtham",
    "nichayathartham",
    "grahapravesam",
    "upanayanam",
    "seemantham",
    "valaikaappu",
    "kaadhu-kuthu",
    "temple",
]);

/* ------------------------------------------------------------------ *
 * Coverage & deliverables
 * ------------------------------------------------------------------ */

export const ALBUM_TYPES = [
    "Candid photo book",
    "Traditional album",
    "Parent / mini album",
    "Magazine album",
] as const;

export const ALBUM_SIZES = [
    "12x18",
    "12x36",
    "15x24",
    "10x15",
    "8x12",
    "6x9",
] as const;

export const FILM_TYPES = [
    { id: "teaser", label: "Teaser (60–90 sec)" },
    { id: "highlight", label: "Highlight film (4–6 min)" },
    { id: "full-film", label: "Full wedding film" },
    { id: "save-the-date", label: "Save the date film" },
    { id: "reels", label: "Social media reels" },
    { id: "same-day-edit", label: "Same day edit" },
] as const;

export const RAW_DELIVERY_MODES = [
    { id: "pendrive", label: "Pendrive" },
    { id: "hard-disk", label: "Hard disk" },
    { id: "cloud", label: "Cloud / online gallery" },
    { id: "none", label: "No raw data" },
] as const;

/* ------------------------------------------------------------------ *
 * Details & preferences
 * ------------------------------------------------------------------ */

export const STYLE_PREFERENCES = [
    "Traditional",
    "Candid",
    "Mixed",
] as const;

/**
 * The constraints that ruin a shoot when nobody wrote them down.
 *
 * Offered as a checklist rather than a notes field because a crew reading a
 * paragraph on a phone at 5am misses the line that said the temple does not
 * allow flash. Each of these changes what the crew packs.
 */
export const KNOWN_CONSTRAINTS = [
    "Temple photography restrictions",
    "No flash permitted",
    "Drone not permitted at venue",
    "Elderly guests — limit posed sessions",
    "Low light venue",
    "Tight schedule between functions",
    "Narrow venue access",
    "Outdoor heat / monsoon risk",
] as const;

export const LANGUAGE_PREFERENCES = [
    "Tamil",
    "English",
    "Tamil & English",
    "Telugu",
    "Hindi",
] as const;

/* ------------------------------------------------------------------ *
 * Document boilerplate
 * ------------------------------------------------------------------ */

/**
 * The terms a booking sheet needs that a quotation's do not.
 *
 * A quotation argues about price; a booking sheet argues about the day. These
 * are the sentences a studio wishes it had printed when a family moves the
 * muhurtham by three hours a week before.
 */
export const DEFAULT_BOOKING_TERMS = [
    "Dates are held only once the booking advance is received.",
    "The booking advance is non-refundable if the event is cancelled by the client.",
    "Changes to dates, venues or times must be confirmed in writing at least 15 days before the function.",
    "Crew call times on the call sheet are final; coverage beyond the agreed hours is billed separately.",
    "Outstation travel, accommodation and food for the crew are arranged by the client unless stated otherwise.",
    "Venue, permit and temple photography charges are payable by the client.",
    "Deliverables are released after the balance payment is settled.",
];

/** What a studio always needs on the day, offered as a starting shot list. */
export const DEFAULT_SHOT_LIST = [
    "Couple portraits at golden hour",
    "Both families group photograph",
    "Ring / thaali close-up",
    "Entry and stage shots",
];
