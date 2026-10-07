import type { DocumentAdapter } from "@/lib/documents/adapter";
import { formatShortDate } from "@/lib/india/dates";
import type { BookingType } from "@/types";

import { BookingSchema } from "./schema";
import {
    applyProfileToBooking,
    bookingFromProfile,
    emptyBooking,
} from "./defaults";

export const bookingAdapter: DocumentAdapter<BookingType> = {
    kind: "booking",
    schema: BookingSchema,
    empty: emptyBooking,
    fromProfile: (profile, options) => bookingFromProfile(profile, options),
    applyProfile: (current, profile, options) =>
        applyProfileToBooking(current, profile, options),
    numberOf: (document) => document.details.bookingNumber,
    titleOf: (document) =>
        document.details.documentType === "crew"
            ? "Crew Call Sheet"
            : "Booking Sheet",
    summarise: (document) => {
        const functions = document.details.functions ?? [];
        const firstDated = functions.find((fn) => fn.date);

        return {
            title: `Booking #${document.details.bookingNumber}`,
            subtitle: [document.client.name, document.details.occasion]
                .filter(Boolean)
                .join(" · "),
            // The first function's date, not the enquiry date: "when is this
            // job?" is the question a studio scanning the list is asking.
            meta: firstDated
                ? formatShortDate(firstDated.date)
                : formatShortDate(document.details.enquiryDate),
            badge: document.details.status,
        };
    },
};
