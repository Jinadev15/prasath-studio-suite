"use client";

import { useFormContext, useWatch } from "react-hook-form";

import {
    DatePickerFormField,
    FormInput,
    FormSelect,
    Subheading,
} from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";

import {
    BOOKING_STATUSES,
    ENQUIRY_SOURCES,
    SOURCE_NEEDING_NAME,
} from "@/lib/documents/booking/options";

import type { BookingType } from "@/types";

/**
 * Step 1 — where this job came from and where it has got to.
 *
 * The status is the reason a booking and a quotation are one record rather
 * than two systems. A studio that keeps enquiries in a notebook, quotations in
 * a folder and confirmed jobs in a calendar loses the venue address somewhere
 * between them; here the status moves and the record stays.
 *
 * The source matters for a different reason: it is the only way a studio ever
 * answers "where does our work actually come from", and it is unanswerable the
 * moment it is a free-text field with "Instagram", "insta" and "IG" in it.
 */
const EnquirySection = () => {
    const { control } = useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    const source = useWatch({ control, name: "details.source" });

    return (
        <section className="flex flex-col gap-4">
            <Subheading>{_t("form.steps.enquiry.heading")}</Subheading>

            <div className="flex flex-col gap-3">
                <FormInput
                    name="details.bookingNumber"
                    label={_t("quotationDocument.bookingNumber")}
                />
                <DatePickerFormField
                    name="details.enquiryDate"
                    label={_t("quotationDocument.enquiryDate")}
                />
                <FormSelect
                    name="details.status"
                    label={_t("quotationDocument.status")}
                    placeholder="—"
                    options={BOOKING_STATUSES.map((status) => ({
                        value: status,
                        label: status,
                    }))}
                />
                <FormInput
                    name="details.occasion"
                    label={_t("quotationDocument.occasion")}
                    placeholder="Wedding of Karthik & Divya"
                />
            </div>

            <Subheading>{_t("form.steps.enquiry.whereFrom")}</Subheading>
            <div className="flex flex-col gap-3">
                <FormSelect
                    name="details.source"
                    label={_t("quotationDocument.source")}
                    placeholder="—"
                    options={ENQUIRY_SOURCES.map((item) => ({
                        value: item,
                        label: item,
                    }))}
                />

                {/* Only meaningful once the source is a referral. */}
                {source === SOURCE_NEEDING_NAME && (
                    <FormInput
                        name="details.referralName"
                        label={_t("form.steps.enquiry.referralName")}
                    />
                )}

                <FormInput
                    name="details.assignedTo"
                    label={_t("quotationDocument.assignedTo")}
                />
            </div>
        </section>
    );
};

export default EnquirySection;
