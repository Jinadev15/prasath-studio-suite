/**
 * Turning a studio profile into a new booking record.
 *
 * This is the seam that makes the "parent company details are changeable"
 * requirement pay off: the profile is edited once in settings, and every new
 * booking starts already carrying the logo, the contact numbers, the signature
 * and the next number in the series. The form is then free to be about the
 * family and the functions.
 */

import { toIsoDate } from "@/lib/india/dates";
import { DEFAULT_STATE_NAME } from "@/lib/india/states";
import {
    DEFAULT_BOOKING_STATUS,
    DEFAULT_BOOKING_TERMS,
    MUHURTHAM_FUNCTIONS,
} from "@/lib/documents/booking/options";
import { FUNCTION_TYPES } from "@/lib/photography/catalogue";
import {
    formatDocumentNumber,
    type StudioProfile,
} from "@/lib/studio/profile";
import { studioBlockFromProfile } from "@/lib/documents/studioBlock";

import type {
    AlbumType,
    BookingFunctionType,
    BookingType,
    CrewType,
    PersonType,
} from "@/types";

/**
 * An empty record, used before any profile exists.
 *
 * Deliberately not a demo booking: a form pre-filled with plausible sample data
 * is one the user has to audit line by line, and the one line they miss is the
 * one that goes out with someone else's venue on it.
 */
export function emptyBooking(): BookingType {
    const today = new Date();

    return {
        studio: {
            profileId: "",
            brandName: "",
            legalName: "",
            tagline: "",
            logo: "",
            phone: "",
            altPhone: "",
            whatsapp: "",
            email: "",
            website: "",
            instagram: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            district: "",
            state: DEFAULT_STATE_NAME,
            stateCode: "33",
            pincode: "",
            gstin: "",
            pan: "",
            unregisteredNote: "",
            bank: {
                accountName: "",
                accountNumber: "",
                ifsc: "",
                bankName: "",
                branch: "",
            },
            upiId: "",
            upiQr: "",
            signature: "",
            signatureFontFamily: "",
            signatoryName: "",
            signatoryDesignation: "",
            seal: "",
        },
        client: {
            name: "",
            relationship: "",
            contactPerson: "",
            gstin: "",
            phone: "",
            altPhone: "",
            whatsapp: "",
            email: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            district: "",
            state: DEFAULT_STATE_NAME,
            pincode: "",
            brideName: "",
            brideFamily: "",
            groomName: "",
            groomFamily: "",
            decisionMaker: blankPerson(),
            customInputs: [],
        },
        details: {
            documentTitle: "EVENT BOOKING SHEET",
            documentType: "booking",
            bookingNumber: "",
            enquiryDate: toIsoDate(today),
            status: DEFAULT_BOOKING_STATUS,
            source: "",
            referralName: "",
            assignedTo: "",
            occasion: "",
            functions: [],
            coverage: blankCoverage(),
            preferences: blankPreferences(),
            commercials: blankCommercials(),
            terms: [],
            additionalNotes: "",
            sections: defaultSections(),
            theme: {
                accentColor: "#1F2937",
                fontId: "outfit",
                density: "comfortable",
            },
            pdfTemplate: 1,
            updatedAt: "",
        },
    };
}

export function defaultSections(): NonNullable<
    BookingType["details"]["sections"]
> {
    return {
        functions: true,
        coverage: true,
        preferences: true,
        shotList: true,
        vips: true,
        commercials: true,
        familyDetails: true,
        terms: true,
        bankDetails: true,
        upiQr: true,
        signature: true,
        acceptanceBlock: true,
        tamilLabels: false,
    };
}

export function blankPerson(): PersonType {
    return { name: "", relation: "", phone: "" };
}

export function blankCrew(): CrewType {
    return {
        candidPhotographers: 0,
        traditionalPhotographers: 0,
        cinematographers: 0,
        traditionalVideographers: 0,
        drone: 0,
        assistants: 0,
    };
}

export function blankFunction(): BookingFunctionType {
    return {
        functionId: "",
        label: "",
        date: "",
        startTime: "",
        endTime: "",
        muhurthamTime: "",
        venue: "",
        venueAddress: "",
        district: "",
        guestCount: 0,
        setting: "",
        services: [],
        crew: blankCrew(),
        coordinatorName: "",
        coordinatorPhone: "",
        notes: "",
    };
}

export function blankAlbum(): AlbumType {
    return { type: "", size: "", sheets: 0, quantity: 1, notes: "" };
}

export function blankCoverage(): NonNullable<
    BookingType["details"]["coverage"]
> {
    return {
        albums: [],
        frames: 0,
        frameSize: "",
        films: [],
        editedPhotoCount: 0,
        rawDelivery: [],
        deliveryExpectation: "",
        notes: "",
    };
}

export function blankPreferences(): NonNullable<
    BookingType["details"]["preferences"]
> {
    return {
        mustHaveShots: [],
        vips: [],
        stylePreference: "",
        constraints: [],
        languagePreference: "",
        crewNotes: "",
        venueAccessNotes: "",
    };
}

export function blankCommercials(): NonNullable<
    BookingType["details"]["commercials"]
> {
    return {
        budgetMin: 0,
        budgetMax: 0,
        advanceExpected: 0,
        quotationReference: "",
        internalNotes: "",
        portfolioConsent: false,
        termsAccepted: false,
    };
}

/**
 * A function row prefilled from a catalogue type.
 *
 * The typical duration seeds nothing — a start time guessed from a catalogue
 * average is worse than a blank, because it looks filled in. The muhurtham
 * field is simply made relevant or not.
 */
export function functionFromType(functionId: string): BookingFunctionType {
    const fn = FUNCTION_TYPES.find((f) => f.id === functionId);
    return {
        ...blankFunction(),
        functionId,
        label: fn?.label ?? "",
    };
}

/** Whether to ask for a muhurtham time on this kind of function. */
export const hasMuhurtham = (functionId: string | undefined | null) =>
    Boolean(functionId && MUHURTHAM_FUNCTIONS.has(functionId));


/**
 * A fresh booking for a given profile.
 *
 * `sequence` is passed in rather than read here so the caller can show the
 * number it is about to use and still let the user override it — the series is
 * only advanced once a record is actually issued.
 */
export function bookingFromProfile(
    profile: StudioProfile,
    options: { sequence?: number; date?: Date } = {}
): BookingType {
    const base = emptyBooking();
    const date = options.date ?? new Date();

    return {
        ...base,
        studio: studioBlockFromProfile(profile),
        client: {
            ...base.client,
            state: profile.state || DEFAULT_STATE_NAME,
        },
        details: {
            ...base.details,
            bookingNumber: formatDocumentNumber(
                profile.series.booking,
                date,
                options.sequence ?? profile.series.booking.nextSequence
            ),
            enquiryDate: toIsoDate(date),
            /*
             * The profile's own default terms are a quotation's terms (payment
             * stages, validity). A booking sheet argues about the day, not the
             * price, so it starts from its own set — see DEFAULT_BOOKING_TERMS.
             */
            terms: [...DEFAULT_BOOKING_TERMS],
            additionalNotes: profile.defaultNotes,
            theme: {
                accentColor: profile.accentColor,
                fontId: profile.fontId as never,
                density: profile.density as never,
            },
            pdfTemplate: profile.templateId,
        },
    };
}

/**
 * Reapplies a profile onto an open booking without disturbing the job.
 *
 * Used when the user switches profile mid-edit, which happens when a studio
 * trades under two names and started the booking on the wrong one. Only the
 * studio identity, the numbering and the presentation defaults move; the
 * family, the functions and the coverage stay exactly as typed.
 */
export function applyProfileToBooking(
    current: BookingType,
    profile: StudioProfile,
    options: { renumber?: boolean } = {}
): BookingType {
    const date = current.details.enquiryDate
        ? new Date(current.details.enquiryDate)
        : new Date();

    return {
        ...current,
        studio: studioBlockFromProfile(profile),
        details: {
            ...current.details,
            bookingNumber: options.renumber
                ? formatDocumentNumber(profile.series.booking, date)
                : current.details.bookingNumber,
            theme: {
                accentColor: profile.accentColor,
                fontId: profile.fontId as never,
                density: profile.density as never,
            },
            pdfTemplate: profile.templateId,
        },
    };
}

/**
 * A previous booking as the starting point for a new one.
 *
 * The same family books the engagement in January and the reception in
 * December; a sibling's wedding reuses the venue, the crew counts and half the
 * shot list. What must NOT carry over is anything that identifies the old job:
 * its number, its dates, its status and the studio's internal notes about it.
 */
export function duplicateBooking(
    source: BookingType,
    options: { bookingNumber?: string; date?: Date } = {}
): BookingType {
    const date = options.date ?? new Date();

    return {
        ...source,
        details: {
            ...source.details,
            bookingNumber: options.bookingNumber ?? "",
            enquiryDate: toIsoDate(date),
            status: DEFAULT_BOOKING_STATUS,
            updatedAt: "",
            /*
             * Dates are cleared, everything else about each function is kept.
             * A copied booking that silently carries last year's muhurtham
             * date is the single most dangerous thing this feature could do.
             */
            functions: (source.details.functions ?? []).map((fn) => ({
                ...fn,
                date: "",
                muhurthamTime: fn.muhurthamTime,
            })),
            commercials: {
                ...(source.details.commercials ?? blankCommercials()),
                quotationReference: "",
                internalNotes: "",
                termsAccepted: false,
            },
        },
    };
}
