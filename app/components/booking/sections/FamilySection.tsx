"use client";

import { useFormContext } from "react-hook-form";

import { FormInput, FormSelect, Subheading } from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";

import { CLIENT_RELATIONSHIPS } from "@/lib/documents/booking/options";
import { INDIAN_STATES, TAMIL_NADU_DISTRICTS } from "@/lib/india/states";

import type { BookingType } from "@/types";

/**
 * Step 2 — the family, not just the buyer.
 *
 * A wedding booking has at least four people who matter: whoever is paying,
 * whoever actually approves things, the bride and the groom. The quotation's
 * client block holds one name and one phone, which is why a studio ends up
 * ringing the person who enquired to ask who it should be ringing.
 *
 * The decision maker is rarely the person who called, and knowing it is the
 * difference between one phone call and four.
 */
const FamilySection = () => {
    useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    return (
        <section className="flex flex-col gap-4">
            <Subheading>{_t("form.steps.client.heading")}</Subheading>

            <div className="flex flex-col gap-3">
                <FormInput
                    name="client.name"
                    label={_t("form.steps.booking.primaryContact")}
                    placeholder="Mr. Senthil Kumar"
                />
                <FormSelect
                    name="client.relationship"
                    label={_t("form.steps.client.relationship")}
                    placeholder="—"
                    options={CLIENT_RELATIONSHIPS.map((value) => ({
                        value,
                        label: value,
                    }))}
                />
                <FormInput
                    name="client.phone"
                    label={_t("form.steps.client.phone")}
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                />
                <FormInput
                    name="client.altPhone"
                    label={_t("form.steps.client.altPhone")}
                    inputMode="tel"
                />
                <FormInput
                    name="client.whatsapp"
                    label={_t("form.steps.client.whatsapp")}
                    inputMode="tel"
                />
                <FormInput
                    name="client.email"
                    label={_t("form.steps.client.email")}
                    type="email"
                />
            </div>

            <Subheading>{_t("form.steps.booking.couple")}</Subheading>
            <div className="grid gap-3 sm:grid-cols-2">
                <FormInput
                    vertical
                    name="client.brideName"
                    label={_t("quotationDocument.bride")}
                />
                <FormInput
                    vertical
                    name="client.brideFamily"
                    label={_t("form.steps.booking.brideFamily")}
                />
                <FormInput
                    vertical
                    name="client.groomName"
                    label={_t("quotationDocument.groom")}
                />
                <FormInput
                    vertical
                    name="client.groomFamily"
                    label={_t("form.steps.booking.groomFamily")}
                />
            </div>

            <div>
                <Subheading>{_t("quotationDocument.decisionMaker")}</Subheading>
                <p className="mt-1 text-xs text-muted-foreground">
                    {_t("form.steps.booking.decisionMakerHint")}
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                <FormInput
                    vertical
                    name="client.decisionMaker.name"
                    label={_t("form.steps.booking.name")}
                />
                <FormInput
                    vertical
                    name="client.decisionMaker.relation"
                    label={_t("form.steps.booking.relation")}
                />
                <FormInput
                    vertical
                    name="client.decisionMaker.phone"
                    label={_t("form.steps.client.phone")}
                    inputMode="tel"
                />
            </div>

            <Subheading>{_t("studio.sections.address")}</Subheading>
            <div className="flex flex-col gap-3">
                <FormInput
                    name="client.addressLine1"
                    label={_t("form.steps.client.addressLine1")}
                />
                <FormInput
                    name="client.addressLine2"
                    label={_t("form.steps.client.addressLine2")}
                />
                <FormInput
                    name="client.city"
                    label={_t("form.steps.client.city")}
                />
                <FormSelect
                    name="client.district"
                    label={_t("form.steps.client.district")}
                    placeholder="—"
                    options={TAMIL_NADU_DISTRICTS.map((value) => ({
                        value,
                        label: value,
                    }))}
                />
                <FormSelect
                    name="client.state"
                    label={_t("form.steps.client.state")}
                    placeholder="—"
                    options={INDIAN_STATES.map((state) => ({
                        value: state.name,
                        label: state.name,
                    }))}
                />
                <FormInput
                    name="client.pincode"
                    label={_t("form.steps.client.pincode")}
                    inputMode="numeric"
                />
            </div>
        </section>
    );
};

export default FamilySection;
