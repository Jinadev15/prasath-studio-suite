import type { WizardStepDef } from "@/lib/wizardSteps";

/**
 * The booking wizard's steps.
 *
 * Six, and only the studio step is shared with the other two sections. A
 * booking is an intake form rather than a priced document: it asks who the
 * family is, what is happening and when, what they expect delivered and what
 * the crew needs to know — none of which a quotation or an invoice asks.
 *
 * The order matters. An enquiry is usually taken over the phone in ninety
 * seconds, so the first two steps hold everything that must be captured before
 * the caller hangs up; the rest can be filled in afterwards.
 */
export const BOOKING_STEPS: WizardStepDef[] = [
    {
        id: 0,
        slug: "enquiry",
        labelKey: "enquiry",
        requiredFields: ["details.bookingNumber", "details.enquiryDate"],
        errorPaths: [
            "details.bookingNumber",
            "details.enquiryDate",
            "details.status",
            "details.source",
        ],
    },
    {
        id: 1,
        slug: "client",
        labelKey: "client",
        requiredFields: ["client.name", "client.phone"],
        errorPaths: ["client"],
    },
    {
        id: 2,
        slug: "functions",
        labelKey: "functions",
        requiredFields: [],
        errorPaths: ["details.functions"],
        watchFields: ["details.functions"],
        // A booking with no function is an enquiry nobody has pinned down yet,
        // which is exactly what "incomplete" should mean here.
        completeWhen: (values) => {
            const functions = values["details.functions"];
            return (
                Array.isArray(functions) &&
                functions.length > 0 &&
                functions.every(
                    (fn: Record<string, unknown>) =>
                        String(fn?.date ?? "").trim().length > 0
                )
            );
        },
    },
    {
        id: 3,
        slug: "coverage",
        labelKey: "coverage",
        requiredFields: [],
        errorPaths: ["details.coverage"],
        watchFields: ["details.coverage"],
        completeWhen: (values) => {
            const coverage = values["details.coverage"] as
                | Record<string, unknown>
                | undefined;
            if (!coverage) return false;
            return (
                Number(coverage.editedPhotoCount) > 0 ||
                (Array.isArray(coverage.albums) && coverage.albums.length > 0) ||
                (Array.isArray(coverage.films) && coverage.films.length > 0)
            );
        },
    },
    {
        id: 4,
        slug: "preferences",
        labelKey: "preferences",
        requiredFields: [],
        errorPaths: ["details.preferences"],
        watchFields: ["details.preferences"],
        completeWhen: (values) => {
            const preferences = values["details.preferences"] as
                | Record<string, unknown>
                | undefined;
            if (!preferences) return false;
            return (
                (Array.isArray(preferences.mustHaveShots) &&
                    preferences.mustHaveShots.length > 0) ||
                String(preferences.stylePreference ?? "").length > 0
            );
        },
    },
    {
        id: 5,
        slug: "review",
        labelKey: "review",
        requiredFields: [],
        errorPaths: ["details.commercials", "details.terms"],
        watchFields: ["details.commercials"],
        completeWhen: (values) => {
            const commercials = values["details.commercials"] as
                | Record<string, unknown>
                | undefined;
            return Boolean(commercials?.termsAccepted);
        },
    },
];
