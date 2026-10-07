"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { BaseButton, FormFile, FormInput, Subheading } from "@/app/components";
import { Link } from "@/i18n/navigation";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useStudioProfiles } from "@/contexts/StudioProfileContext";
import { useDocumentContext } from "@/contexts/DocumentContext";

import { addressLines, profileGaps } from "@/lib/studio/profile";
import { checkGstin } from "@/lib/india/gst";

import {
    AlertTriangle,
    Building2,
    Check,
    ChevronDown,
    Plus,
    Settings,
} from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Step 1 — the studio issuing the quotation.
 *
 * Deliberately *not* a form full of address fields, which is what upstream's
 * "Bill From" step was. The studio's details do not change between
 * quotations, so asking for them on every document is asking the user to
 * retype the same fifteen fields forever and guarantees that two quotations
 * sent the same week disagree about the phone number.
 *
 * Instead this step picks a saved profile and shows what that profile will put
 * on the document. The per-document override panel is collapsed by default and
 * exists for the one real case it serves: a quotation that has to go out under
 * a slightly different address or signatory without permanently editing the
 * saved profile.
 */
const StudioSection = () => {
    const { _t } = useTranslationContext();
    const { profiles, activeProfile, selectProfile, loading } =
        useStudioProfiles();
    const { getValues, reset, watch } = useFormContext<QuotationType>();

    /*
     * This step is shared by all three sections, so the reshaping has to come
     * from the active section's adapter. It used to call
     * `applyProfileToQuotation` directly, which meant switching profile while
     * editing an invoice or a booking rewrote that document through the
     * quotation shaper and dropped the fields only it has.
     */
    const { adapter } = useDocumentContext();

    const [showOverrides, setShowOverrides] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);

    const studio = watch("studio");
    const gstinCheck = studio?.gstin ? checkGstin(studio.gstin) : null;

    const handleSwitch = (profileId: string) => {
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) return;

        setSwitcherOpen(false);
        void selectProfile(profileId);

        /*
         * Only the studio identity and the presentation defaults move. The
         * client, the functions and the line items stay exactly as typed —
         * switching brand mid-quotation must not cost the user the shoot they
         * have already entered.
         */
        if (!adapter) return;

        reset(adapter.applyProfile(getValues(), profile) as never, {
            keepDefaultValues: true,
        });
    };

    if (loading) {
        return (
            <div className="h-32 animate-pulse rounded-lg bg-muted/50" />
        );
    }

    /* Nothing saved yet — send them to settings rather than to a blank form. */
    if (!activeProfile) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center">
                <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 font-medium">
                    {_t("form.steps.studio.noProfile")}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    {_t("form.steps.studio.noProfileBody")}
                </p>
                <BaseButton asChild className="mt-4">
                    <Link href="/studio">
                        <Settings className="h-4 w-4" />
                        {_t("form.steps.studio.createProfile")}
                    </Link>
                </BaseButton>
            </div>
        );
    }

    const gaps = profileGaps(activeProfile);

    return (
        <div className="space-y-5">
            {/* Which profile this quotation is going out under. */}
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
                <div className="flex min-w-0 items-start gap-3">
                    {activeProfile.logo ? (
                        <img
                            src={activeProfile.logo}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded object-contain"
                        />
                    ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}

                    <div className="min-w-0">
                        <p className="truncate font-semibold">
                            {activeProfile.brandName ||
                                _t("form.steps.studio.noProfile")}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {addressLines(activeProfile).join(", ")}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {[
                                activeProfile.phone,
                                activeProfile.gstin &&
                                    `GSTIN ${activeProfile.gstin}`,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {/*
                     * Always show the studio picker — even when only one
                     * profile exists. Without it, a user with one profile
                     * has no visible way to know they can create a second
                     * or that switching is possible at all.
                     */}
                    <div className="relative">
                        <BaseButton
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => setSwitcherOpen((open) => !open)}
                        >
                            Change studio
                            <ChevronDown className="h-4 w-4" />
                        </BaseButton>

                        {switcherOpen && (
                            <div className="absolute end-0 z-20 mt-1 w-60 rounded-md border bg-popover p-1 shadow-md">
                                {profiles.length > 0 && (
                                    <>
                                        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Your studios
                                        </p>
                                        {profiles.map((profile) => (
                                            <button
                                                key={profile.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSwitch(profile.id)
                                                }
                                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-sm hover:bg-muted"
                                            >
                                                {profile.id ===
                                                activeProfile.id ? (
                                                    <Check className="h-3.5 w-3.5 text-success" />
                                                ) : (
                                                    <span className="h-3.5 w-3.5" />
                                                )}
                                                <span className="min-w-0 flex-1 truncate">
                                                    {profile.brandName || "Untitled studio"}
                                                </span>
                                            </button>
                                        ))}
                                        <div className="my-1 border-t" />
                                    </>
                                )}

                                {/*
                                 * Link to Studio settings so the user can
                                 * create a second studio (or a third). The
                                 * "+ Add studio" label makes the affordance
                                 * explicit rather than requiring them to
                                 * discover it inside Settings.
                                 */}
                                <Link
                                    href="/studio"
                                    onClick={() => setSwitcherOpen(false)}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-start text-sm text-primary hover:bg-muted"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add / manage studios
                                </Link>
                            </div>
                        )}
                    </div>

                    <BaseButton
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8"
                    >
                        <Link href="/studio">
                            <Settings className="h-4 w-4" />
                            {_t("form.steps.studio.editProfile")}
                        </Link>
                    </BaseButton>
                </div>
            </div>

            {/*
             * What is still missing. A quotation with no bank details or no
             * signature is one the client cannot act on, and the user will not
             * notice until it has been sent.
             */}
            {gaps.length > 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <p className="font-medium">
                            {_t("form.steps.studio.missing")}
                        </p>
                        <p className="text-muted-foreground">
                            {gaps.join(" · ")}
                        </p>
                    </div>
                </div>
            )}

            {gstinCheck && !gstinCheck.valid && (
                <p className="text-sm text-destructive">
                    {_t("studio.validation.gstinInvalid")} — {gstinCheck.reason}
                </p>
            )}

            {/* Per-document overrides. */}
            <div>
                <BaseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-0 text-muted-foreground"
                    onClick={() => setShowOverrides((open) => !open)}
                >
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                            showOverrides ? "rotate-180" : ""
                        }`}
                    />
                    {showOverrides
                        ? _t("form.steps.studio.hideOverrides")
                        : _t("form.steps.studio.showOverrides")}
                </BaseButton>

                {showOverrides && (
                    <div className="mt-3 space-y-4 rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground">
                            {_t("form.steps.studio.overrideHint")}
                        </p>

                        <Subheading>
                            {_t("studio.sections.identity")}
                        </Subheading>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormInput
                                vertical
                                name="studio.brandName"
                                label={_t("studio.fields.brandName")}
                            />
                            <FormInput
                                vertical
                                name="studio.tagline"
                                label={_t("studio.fields.tagline")}
                            />
                        </div>
                        <FormFile
                            name="studio.logo"
                            label={_t("studio.fields.logo")}
                        />

                        <Subheading>{_t("studio.sections.contact")}</Subheading>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormInput
                                vertical
                                name="studio.phone"
                                label={_t("studio.fields.phone")}
                            />
                            <FormInput
                                vertical
                                name="studio.whatsapp"
                                label={_t("studio.fields.whatsapp")}
                            />
                            <FormInput
                                vertical
                                name="studio.email"
                                label={_t("studio.fields.email")}
                            />
                            <FormInput
                                vertical
                                name="studio.website"
                                label={_t("studio.fields.website")}
                            />
                        </div>

                        <Subheading>{_t("studio.sections.address")}</Subheading>
                        <FormInput
                            vertical
                            name="studio.addressLine1"
                            label={_t("studio.fields.addressLine1")}
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <FormInput
                                vertical
                                name="studio.city"
                                label={_t("studio.fields.city")}
                            />
                            <FormInput
                                vertical
                                name="studio.district"
                                label={_t("studio.fields.district")}
                            />
                            <FormInput
                                vertical
                                name="studio.pincode"
                                label={_t("studio.fields.pincode")}
                            />
                        </div>

                        <Subheading>{_t("studio.sections.signoff")}</Subheading>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormInput
                                vertical
                                name="studio.signatoryName"
                                label={_t("studio.fields.signatoryName")}
                            />
                            <FormInput
                                vertical
                                name="studio.signatoryDesignation"
                                label={_t(
                                    "studio.fields.signatoryDesignation"
                                )}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioSection;
