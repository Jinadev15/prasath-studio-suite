"use client";

import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
    BaseButton,
    ClientPicker,
    FormCustomInput,
    FormInput,
    FormSelect,
    Subheading,
} from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";

import { checkGstin, inferTaxMode } from "@/lib/india/gst";
import { INDIAN_STATES, TAMIL_NADU_DISTRICTS } from "@/lib/india/states";
import { CLIENT_RELATIONSHIPS } from "@/lib/variables";

import { Check, Plus } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Step 2 — who the quotation is for.
 *
 * The GSTIN field does real work here beyond being printed: a valid one names
 * the client's state, which is what decides CGST+SGST versus IGST. Entering it
 * sets the tax mode and the place of supply, so the user is never asked the
 * same question twice in two different vocabularies.
 */
const ClientSection = () => {
    const { control, setValue, getValues } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();

    const CUSTOM_INPUT_NAME = "client.customInputs" as const;
    const { fields, append, remove } = useFieldArray({
        control,
        name: CUSTOM_INPUT_NAME,
    });

    const clientGstin = useWatch({ control, name: "client.gstin" });
    const clientState = useWatch({ control, name: "client.state" });
    const gstinCheck = clientGstin?.trim() ? checkGstin(clientGstin) : null;

    /*
     * Derive the tax treatment from the two states.
     *
     * Only ever written when `inferTaxMode` is confident — it returns null
     * when there is not enough information, and in that case the user's own
     * choice on the services step is left alone rather than overwritten by a
     * guess. The studio is almost always registered in Tamil Nadu and the
     * client is almost always an unregistered family in Tamil Nadu, so the
     * common path resolves to `intra` without anyone being asked.
     */
    useEffect(() => {
        const studio = getValues("studio");
        const inferred = inferTaxMode({
            studioGstin: studio?.gstin,
            studioState: studio?.state,
            clientGstin,
            clientState,
        });
        if (!inferred) return;

        if (getValues("details.taxMode") !== "exempt") {
            setValue("details.taxMode", inferred, { shouldDirty: true });
        }

        const placeOfSupply =
            (gstinCheck?.valid ? gstinCheck.stateName : undefined) ??
            clientState ??
            "";
        if (placeOfSupply) {
            setValue("details.placeOfSupply", placeOfSupply, {
                shouldDirty: true,
            });
        }
        // `gstinCheck` is derived from clientGstin, so it is not a separate dep.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientGstin, clientState, getValues, setValue]);

    /* A valid GSTIN names its own state; stop asking for it separately. */
    useEffect(() => {
        if (gstinCheck?.valid && gstinCheck.stateName) {
            setValue("client.state", gstinCheck.stateName, {
                shouldDirty: true,
            });
        }
    }, [gstinCheck?.valid, gstinCheck?.stateName, setValue]);

    return (
        <section className="flex flex-col gap-4">
            <ClientPicker />

            <div className="flex flex-col gap-3">
                <FormInput
                    name="client.name"
                    label={_t("form.steps.client.name")}
                    placeholder={_t("form.steps.client.namePlaceholder")}
                />
                <FormInput
                    name="client.contactPerson"
                    label={_t("form.steps.client.contactPerson")}
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
                    type="text"
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                />
                <FormInput
                    name="client.whatsapp"
                    label={_t("form.steps.client.whatsapp")}
                    type="text"
                    inputMode="tel"
                />
                <FormInput
                    name="client.email"
                    label={_t("form.steps.client.email")}
                    type="email"
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
                        hint: `GST code ${state.code}`,
                    }))}
                />
                <FormInput
                    name="client.pincode"
                    label={_t("form.steps.client.pincode")}
                    inputMode="numeric"
                />
            </div>

            <Subheading>{_t("studio.sections.statutory")}</Subheading>
            <div className="flex flex-col gap-1.5">
                <FormInput
                    name="client.gstin"
                    label={_t("form.steps.client.gstin")}
                    placeholder="33AAAAA0000A1Z5"
                    className="uppercase"
                />
                {gstinCheck?.valid ? (
                    <p className="flex items-center gap-1 text-xs text-success">
                        <Check className="h-3 w-3" />
                        {_t("studio.validation.gstinValid", {
                            state: gstinCheck.stateName ?? "",
                        })}
                    </p>
                ) : gstinCheck ? (
                    <p className="text-xs text-destructive">
                        {gstinCheck.reason}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        {_t("form.steps.client.gstinHint")}
                    </p>
                )}
            </div>

            {fields?.map((field, index) => (
                <FormCustomInput
                    key={field.id}
                    index={index}
                    location={CUSTOM_INPUT_NAME}
                    removeField={remove}
                />
            ))}
            <BaseButton
                size="sm"
                variant="link"
                className="w-fit px-0"
                onClick={() => append({ key: "", value: "" })}
            >
                <Plus className="h-4 w-4" />
                {_t("form.steps.client.addCustomInput")}
            </BaseButton>
        </section>
    );
};

export default ClientSection;
