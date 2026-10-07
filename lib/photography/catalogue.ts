/**
 * The photography domain: what a Tamil Nadu wedding and event studio sells.
 *
 * This is the file that turns a generic invoice app into one a studio can use
 * on the day it opens it. Upstream shipped a blank line-items table, which
 * means every quotation starts by typing "Candid Photography" and guessing
 * last month's rate. Here the catalogue, the units, the SAC codes and the
 * function names are already right, and a quotation starts from a package.
 *
 * Rates are deliberately `null`. A studio's pricing is its own — seeding
 * invented numbers would be worse than useless, because a plausible-looking
 * default is the one a hurried user forgets to change. The UI prompts for a
 * rate once per service and remembers it (see `lib/rateCard.ts`).
 *
 * No React, no Next.js: read by the form, the templates and the PDF route.
 */

import { DEFAULT_SAC_CODE } from "@/lib/india/gst";

/* ------------------------------------------------------------------ *
 * Functions (events)
 * ------------------------------------------------------------------ */

/**
 * The functions a Tamil Nadu studio is actually booked for, with the Tamil
 * name alongside the English one.
 *
 * Both names ship because the studio and the client say the Tamil name out
 * loud and write the English one on paper — a dropdown with only "Engagement"
 * on it is slower to use than a text field, which defeats the point.
 */
export type FunctionType = {
    id: string;
    /** English label, used on the document by default. */
    label: string;
    /** Tamil label, shown in the picker and optionally on the document. */
    tamil: string;
    /** Typical duration in hours, to pre-fill the schedule. */
    typicalHours: number;
    /** Functions that usually run as part of a wedding booking. */
    weddingCore?: boolean;
};

export const FUNCTION_TYPES: FunctionType[] = [
    { id: "nichayathartham", label: "Engagement", tamil: "நிச்சயதார்த்தம்", typicalHours: 5, weddingCore: true },
    { id: "muhurtham", label: "Wedding (Muhurtham)", tamil: "முகூர்த்தம்", typicalHours: 8, weddingCore: true },
    { id: "reception", label: "Reception", tamil: "வரவேற்பு", typicalHours: 6, weddingCore: true },
    { id: "mehendi", label: "Mehendi", tamil: "மருதாணி", typicalHours: 4 },
    { id: "nalangu", label: "Nalangu", tamil: "நலங்கு", typicalHours: 3 },
    { id: "haldi", label: "Haldi / Manjal Neer", tamil: "மஞ்சள் நீர்", typicalHours: 3 },
    { id: "sangeet", label: "Sangeet", tamil: "சங்கீத்", typicalHours: 4 },
    { id: "pre-wedding", label: "Pre-Wedding Shoot", tamil: "திருமணத்திற்கு முன் படப்பிடிப்பு", typicalHours: 6 },
    { id: "post-wedding", label: "Post-Wedding Shoot", tamil: "திருமணத்திற்குப் பின் படப்பிடிப்பு", typicalHours: 5 },
    { id: "save-the-date", label: "Save the Date Shoot", tamil: "சேவ் தி டேட்", typicalHours: 4 },
    { id: "valaikaappu", label: "Valaikaappu (Baby Shower)", tamil: "வளைகாப்பு", typicalHours: 4 },
    { id: "seemantham", label: "Seemantham", tamil: "சீமந்தம்", typicalHours: 4 },
    { id: "grahapravesam", label: "Grahapravesam (House Warming)", tamil: "கிரகப்பிரவேசம்", typicalHours: 4 },
    { id: "kaadhu-kuthu", label: "Kaadhu Kuthu (Ear Piercing)", tamil: "காது குத்து", typicalHours: 3 },
    { id: "puberty", label: "Manjal Neeratu Vizha (Puberty Ceremony)", tamil: "மஞ்சள் நீராட்டு விழா", typicalHours: 4 },
    { id: "birthday", label: "Birthday", tamil: "பிறந்தநாள்", typicalHours: 3 },
    { id: "first-birthday", label: "First Birthday", tamil: "முதல் பிறந்தநாள்", typicalHours: 4 },
    { id: "maternity", label: "Maternity Shoot", tamil: "கர்ப்பகால படப்பிடிப்பு", typicalHours: 3 },
    { id: "baby-shoot", label: "Baby / Newborn Shoot", tamil: "குழந்தை படப்பிடிப்பு", typicalHours: 3 },
    { id: "upanayanam", label: "Upanayanam (Thread Ceremony)", tamil: "உபநயனம்", typicalHours: 4 },
    { id: "temple", label: "Temple Function", tamil: "கோவில் விழா", typicalHours: 4 },
    { id: "corporate", label: "Corporate Event", tamil: "நிறுவன நிகழ்ச்சி", typicalHours: 6 },
    { id: "product", label: "Product / Commercial Shoot", tamil: "தயாரிப்பு படப்பிடிப்பு", typicalHours: 5 },
    { id: "other", label: "Other Function", tamil: "மற்ற விழா", typicalHours: 4 },
];

export function functionTypeById(id: string | undefined | null) {
    return id ? FUNCTION_TYPES.find((f) => f.id === id) : undefined;
}

/* ------------------------------------------------------------------ *
 * Units
 * ------------------------------------------------------------------ */

/**
 * The units a studio bills in. A free-text unit column fills up with "day",
 * "Day", "days" and "/day" on the same document.
 */
export const BILLING_UNITS = [
    "day",
    "event",
    "function",
    "hour",
    "shift",
    "album",
    "sheet",
    "page",
    "frame",
    "video",
    "reel",
    "photo",
    "drive",
    "person",
    "km",
    "set",
    "lump sum",
] as const;

export type BillingUnit = (typeof BILLING_UNITS)[number];

/* ------------------------------------------------------------------ *
 * Service catalogue
 * ------------------------------------------------------------------ */

export type ServiceCategory =
    | "photography"
    | "videography"
    | "aerial-live"
    | "albums-prints"
    | "films-edits"
    | "delivery"
    | "logistics";

export const SERVICE_CATEGORIES: {
    id: ServiceCategory;
    label: string;
    description: string;
}[] = [
    {
        id: "photography",
        label: "Photography",
        description: "Stills crew on the ground",
    },
    {
        id: "videography",
        label: "Videography",
        description: "Video crew and camera setups",
    },
    {
        id: "aerial-live",
        label: "Aerial & Live",
        description: "Drone, crane, LED wall, live streaming",
    },
    {
        id: "albums-prints",
        label: "Albums & Prints",
        description: "Physical deliverables",
    },
    {
        id: "films-edits",
        label: "Films & Edits",
        description: "Teasers, highlights, reels",
    },
    {
        id: "delivery",
        label: "Digital Delivery",
        description: "Drives, galleries, raw data",
    },
    {
        id: "logistics",
        label: "Travel & Logistics",
        description: "Reimbursable and outstation costs",
    },
];

export type CatalogueService = {
    id: string;
    name: string;
    category: ServiceCategory;
    /** Shown under the line name on the document. */
    description: string;
    unit: BillingUnit;
    sac: string;
    gstRate: number;
    /** Sensible starting quantity when added from the picker. */
    defaultQuantity: number;
};

const svc = (
    s: Omit<CatalogueService, "sac" | "gstRate" | "defaultQuantity"> &
        Partial<Pick<CatalogueService, "sac" | "gstRate" | "defaultQuantity">>
): CatalogueService => ({
    sac: DEFAULT_SAC_CODE,
    gstRate: 18,
    defaultQuantity: 1,
    ...s,
});

export const SERVICE_CATALOGUE: CatalogueService[] = [
    /* --- Photography --- */
    svc({
        id: "traditional-photo",
        name: "Traditional Photography",
        category: "photography",
        description: "Posed and ritual coverage, one photographer",
        unit: "day",
    }),
    svc({
        id: "candid-photo",
        name: "Candid Photography",
        category: "photography",
        description: "Documentary-style candid coverage, lead photographer",
        unit: "day",
    }),
    svc({
        id: "second-candid",
        name: "Second Candid Photographer",
        category: "photography",
        description: "Additional candid shooter for parallel coverage",
        unit: "day",
    }),
    svc({
        id: "portrait-session",
        name: "Couple Portrait Session",
        category: "photography",
        description: "Dedicated styled portrait session with lighting",
        unit: "event",
        sac: "998381",
    }),
    svc({
        id: "photo-booth",
        name: "Photo Booth with Instant Prints",
        category: "photography",
        description: "Attended booth, unlimited prints for guests",
        unit: "event",
    }),
    svc({
        id: "booth-360",
        name: "360° Photo Booth",
        category: "photography",
        description: "Rotating-arm booth with instant guest shares",
        unit: "event",
    }),

    /* --- Videography --- */
    svc({
        id: "traditional-video",
        name: "Traditional Videography",
        category: "videography",
        description: "Full ritual coverage, single camera",
        unit: "day",
    }),
    svc({
        id: "cinematic-video",
        name: "Cinematic Videography",
        category: "videography",
        description: "Cinematic coverage with gimbal and prime lenses",
        unit: "day",
    }),
    svc({
        id: "second-cinematographer",
        name: "Second Cinematographer",
        category: "videography",
        description: "Additional video crew for multi-camera coverage",
        unit: "day",
    }),
    svc({
        id: "multi-cam",
        name: "Multi-Camera Setup (3 cam)",
        category: "videography",
        description: "Three locked-off cameras with synced audio",
        unit: "day",
    }),

    /* --- Aerial & live --- */
    svc({
        id: "drone",
        name: "Drone / Aerial Coverage",
        category: "aerial-live",
        description: "Licensed pilot, aerial stills and video",
        unit: "day",
        sac: "998384",
    }),
    svc({
        id: "crane",
        name: "Crane / Jimmy Jib",
        category: "aerial-live",
        description: "Jib arm with operator for sweeping shots",
        unit: "day",
    }),
    svc({
        id: "led-wall",
        name: "LED Wall",
        category: "aerial-live",
        description: "Stage LED wall with live feed and operator",
        unit: "day",
    }),
    svc({
        id: "live-stream",
        name: "Live Streaming",
        category: "aerial-live",
        description: "Multi-camera stream to YouTube or a private link",
        unit: "event",
    }),

    /* --- Albums & prints --- */
    svc({
        id: "candid-album",
        name: "Candid Photo Book 12×18",
        category: "albums-prints",
        description: "Lay-flat photo book, designed spreads",
        unit: "sheet",
        defaultQuantity: 30,
    }),
    svc({
        id: "traditional-album",
        name: "Traditional Album",
        category: "albums-prints",
        description: "Classic bound album with mounted prints",
        unit: "album",
        sac: "4911",
        gstRate: 12,
    }),
    svc({
        id: "parent-album",
        name: "Parent / Mini Album",
        category: "albums-prints",
        description: "Duplicate smaller album for family",
        unit: "album",
        sac: "4911",
        gstRate: 12,
        defaultQuantity: 2,
    }),
    svc({
        id: "photo-frame",
        name: "Framed Enlargement",
        category: "albums-prints",
        description: "Mounted and framed print for the home",
        unit: "frame",
        defaultQuantity: 2,
    }),
    svc({
        id: "calendar-print",
        name: "Photo Calendar / Keepsake",
        category: "albums-prints",
        description: "Printed keepsake from the selected images",
        unit: "set",
        sac: "4911",
        gstRate: 12,
    }),

    /* --- Films & edits --- */
    svc({
        id: "teaser",
        name: "Teaser Film (60–90 sec)",
        category: "films-edits",
        description: "Short teaser cut for social release",
        unit: "video",
    }),
    svc({
        id: "highlight",
        name: "Highlight Film (4–6 min)",
        category: "films-edits",
        description: "Edited highlight film with licensed music",
        unit: "video",
    }),
    svc({
        id: "full-film",
        name: "Full Wedding Film",
        category: "films-edits",
        description: "Long-form documentary edit of the full function",
        unit: "video",
    }),
    svc({
        id: "save-date-film",
        name: "Save the Date Film",
        category: "films-edits",
        description: "Scripted short film for the invitation",
        unit: "video",
    }),
    svc({
        id: "reels",
        name: "Social Media Reels",
        category: "films-edits",
        description: "Vertical cuts formatted for Instagram",
        unit: "reel",
        defaultQuantity: 3,
    }),
    svc({
        id: "same-day-edit",
        name: "Same Day Edit",
        category: "films-edits",
        description: "Edit delivered for screening at the reception",
        unit: "video",
    }),
    svc({
        id: "retouch",
        name: "Advanced Retouching",
        category: "films-edits",
        description: "High-end retouch on selected portraits",
        unit: "photo",
        sac: "998385",
        defaultQuantity: 25,
    }),

    /* --- Digital delivery --- */
    svc({
        id: "edited-photos",
        name: "Edited Photographs",
        category: "delivery",
        description: "Colour-graded, culled, delivery-ready images",
        unit: "photo",
        defaultQuantity: 300,
        sac: "998386",
    }),
    svc({
        id: "raw-drive",
        name: "Raw Data on Hard Drive",
        category: "delivery",
        description: "Complete unedited footage on a supplied drive",
        unit: "drive",
    }),
    svc({
        id: "pendrive",
        name: "Pendrive Delivery",
        category: "delivery",
        description: "Edited deliverables on a branded pendrive",
        unit: "drive",
    }),
    svc({
        id: "cloud-gallery",
        name: "Online Gallery (12 months)",
        category: "delivery",
        description: "Private shareable gallery with downloads",
        unit: "event",
    }),

    /* --- Logistics --- */
    svc({
        id: "travel",
        name: "Travel & Transport",
        category: "logistics",
        description: "Crew travel to and from the venue",
        unit: "lump sum",
        sac: "998399",
    }),
    svc({
        id: "accommodation",
        name: "Accommodation",
        category: "logistics",
        description: "Crew stay for outstation functions",
        unit: "day",
        sac: "998399",
    }),
    svc({
        id: "outstation",
        name: "Outstation Allowance",
        category: "logistics",
        description: "Per-day allowance for crew outside the base city",
        unit: "day",
        sac: "998399",
    }),
    svc({
        id: "extra-hours",
        name: "Extra Hours",
        category: "logistics",
        description: "Coverage beyond the agreed call time",
        unit: "hour",
    }),
];

export function serviceById(id: string | undefined | null) {
    return id ? SERVICE_CATALOGUE.find((s) => s.id === id) : undefined;
}

export function servicesByCategory(category: ServiceCategory) {
    return SERVICE_CATALOGUE.filter((s) => s.category === category);
}

/* ------------------------------------------------------------------ *
 * Package presets
 * ------------------------------------------------------------------ */

/**
 * Starting points, not prices.
 *
 * A quotation that offers one number invites a negotiation about that number.
 * Three tiers side by side turn the conversation into a choice between
 * options, which is why studios that quote in tiers close more work — so the
 * app makes the three-tier quotation the easy path rather than a manual build.
 */
export type PackagePreset = {
    id: string;
    name: string;
    tagline: string;
    /** Catalogue ids with the quantity that tier includes. */
    includes: { serviceId: string; quantity: number }[];
};

export const PACKAGE_PRESETS: PackagePreset[] = [
    {
        id: "silver",
        name: "Silver",
        tagline: "Essential coverage for a single day",
        includes: [
            { serviceId: "traditional-photo", quantity: 1 },
            { serviceId: "traditional-video", quantity: 1 },
            { serviceId: "edited-photos", quantity: 250 },
            { serviceId: "traditional-album", quantity: 1 },
            { serviceId: "pendrive", quantity: 1 },
        ],
    },
    {
        id: "gold",
        name: "Gold",
        tagline: "Candid and cinematic across the main functions",
        includes: [
            { serviceId: "candid-photo", quantity: 1 },
            { serviceId: "traditional-photo", quantity: 1 },
            { serviceId: "cinematic-video", quantity: 1 },
            { serviceId: "traditional-video", quantity: 1 },
            { serviceId: "edited-photos", quantity: 400 },
            { serviceId: "candid-album", quantity: 30 },
            { serviceId: "traditional-album", quantity: 1 },
            { serviceId: "teaser", quantity: 1 },
            { serviceId: "highlight", quantity: 1 },
            { serviceId: "cloud-gallery", quantity: 1 },
        ],
    },
    {
        id: "platinum",
        name: "Platinum",
        tagline: "Full crew, aerial coverage and the complete film set",
        includes: [
            { serviceId: "candid-photo", quantity: 1 },
            { serviceId: "second-candid", quantity: 1 },
            { serviceId: "traditional-photo", quantity: 1 },
            { serviceId: "cinematic-video", quantity: 1 },
            { serviceId: "second-cinematographer", quantity: 1 },
            { serviceId: "traditional-video", quantity: 1 },
            { serviceId: "drone", quantity: 1 },
            { serviceId: "led-wall", quantity: 1 },
            { serviceId: "edited-photos", quantity: 600 },
            { serviceId: "candid-album", quantity: 40 },
            { serviceId: "traditional-album", quantity: 1 },
            { serviceId: "parent-album", quantity: 2 },
            { serviceId: "teaser", quantity: 1 },
            { serviceId: "highlight", quantity: 1 },
            { serviceId: "full-film", quantity: 1 },
            { serviceId: "reels", quantity: 3 },
            { serviceId: "cloud-gallery", quantity: 1 },
        ],
    },
];

/* ------------------------------------------------------------------ *
 * Document boilerplate
 * ------------------------------------------------------------------ */

/**
 * The terms a studio argues about after the fact if they were never written
 * down. Offered as toggleable defaults rather than a wall of text, so the ones
 * that end up on the document are the ones the studio actually meant.
 */
export const DEFAULT_INCLUSIONS = [
    "Crew travel within city limits",
    "Basic colour correction on all delivered images",
    "Online gallery link for sharing with family",
    "One round of album design revisions",
];

export const DEFAULT_EXCLUSIONS = [
    "Outstation travel, accommodation and food for crew",
    "Venue, permit or temple photography charges",
    "Printing beyond the albums listed above",
    "Coverage beyond the agreed call time (billed per hour)",
    "GST, where not already shown separately",
];

export const DEFAULT_TERMS = [
    "This quotation is valid for 15 days from the date of issue.",
    "Dates are confirmed only on receipt of the booking advance.",
    "The booking advance is non-refundable if the event is cancelled by the client.",
    "Edited photographs are delivered within 30 days of the final function.",
    "Albums and films are delivered within 60 days of design approval.",
    "The studio retains the right to use selected images for its portfolio unless the client requests otherwise in writing.",
];

/**
 * Payment milestones, as percentages of the grand total.
 *
 * Wedding work is booked months ahead and paid in stages; a single "due on
 * receipt" line does not describe any real booking, and leaving the stages
 * verbal is how a studio ends up chasing the balance after the albums ship.
 */
export type PaymentMilestone = {
    label: string;
    percent: number;
    /** When it falls due, in words rather than a date — the date moves. */
    due: string;
};

export const DEFAULT_PAYMENT_SCHEDULE: PaymentMilestone[] = [
    { label: "Booking advance", percent: 30, due: "On confirmation of dates" },
    { label: "Before the first function", percent: 40, due: "7 days before the first function" },
    { label: "On delivery", percent: 30, due: "On delivery of albums and films" },
];

/** Turnaround commitments, shown as a deliverables timeline. */
export const DEFAULT_DELIVERY_TIMELINE = [
    { item: "Teaser film", days: 7 },
    { item: "Edited photographs", days: 30 },
    { item: "Highlight film", days: 45 },
    { item: "Album design proof", days: 45 },
    { item: "Printed albums", days: 60 },
];
