"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { BaseButton, Subheading } from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useStudioProfiles } from "@/contexts/StudioProfileContext";
import useToasts from "@/hooks/useToasts";

import {
    buildProfileExport,
    formatDocumentNumber,
    parseProfileExport,
    profileGaps,
    type StudioProfile,
} from "@/lib/studio/profile";
import {
    DEFAULT_GST_RATE,
    GST_RATES,
    SAC_CODES,
    TAX_MODES,
    checkGstin,
    isIfsc,
    isIndianPhone,
    isPan,
    isPincode,
    isUpiId,
} from "@/lib/india/gst";
import { INDIAN_STATES, TAMIL_NADU_DISTRICTS, stateByName } from "@/lib/india/states";
import { formatINR } from "@/lib/india/currency";
import {
    ACCENT_PRESETS,
    DOCUMENT_FONTS,
} from "@/app/components/templates/document-pdf/documentTheme";
import { TEMPLATES } from "@/app/components/templates/document-pdf/registry";
import { serviceById } from "@/lib/photography/catalogue";
import { DOCUMENT_KINDS } from "@/lib/documents/kinds";

import {
    AlertTriangle,
    Check,
    Copy,
    Download,
    ImageMinus,
    Plus,
    Save,
    Trash2,
    Upload,
} from "lucide-react";

/**
 * Studio settings — the parent company, edited in one place.
 *
 * This screen is the reason the rest of the app can be short. Everything
 * constant about the business lives here, so a new quotation starts already
 * carrying the logo, the address, the GSTIN, the bank account, the UPI QR, the
 * signature, the numbering series, the standard terms and the remembered
 * rates.
 *
 * Deliberately a local draft with an explicit Save rather than a
 * write-on-every-keystroke form: this record is read by every new document, and
 * a half-typed GSTIN being picked up by a quotation in another tab is a worse
 * failure than having to press a button.
 */
const StudioSettings = () => {
    const { _t } = useTranslationContext();
    const {
        profiles,
        activeProfile,
        loading,
        saveProfile,
        deleteProfile,
        selectProfile,
        createProfile,
        duplicateProfile,
        replaceAll,
    } = useStudioProfiles();
    const { profileSaved } = useToasts();

    const [draft, setDraft] = useState<StudioProfile | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const importRef = useRef<HTMLInputElement | null>(null);

    /* Load the active profile into the draft, and follow a profile switch. */
    useEffect(() => {
        if (!activeProfile) return;
        if (editingId === activeProfile.id) return;
        setDraft({ ...activeProfile });
        setEditingId(activeProfile.id);
    }, [activeProfile, editingId]);

    const dirty = useMemo(() => {
        if (!draft || !activeProfile) return false;
        const current = profiles.find((p) => p.id === draft.id);
        if (!current) return true;
        return JSON.stringify(current) !== JSON.stringify(draft);
    }, [draft, activeProfile, profiles]);

    if (loading) {
        return <div className="h-64 animate-pulse rounded-lg bg-muted/50" />;
    }

    if (!draft) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">{_t("studio.profiles")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {_t("form.steps.studio.noProfileBody")}
                </p>
                <BaseButton
                    className="mt-4"
                    onClick={() => void createProfile()}
                >
                    <Plus className="h-4 w-4" />
                    {_t("studio.addProfile")}
                </BaseButton>
            </div>
        );
    }

    const set = <K extends keyof StudioProfile>(
        key: K,
        value: StudioProfile[K]
    ) => setDraft((current) => (current ? { ...current, [key]: value } : current));

    const setBank = (key: keyof StudioProfile["bank"], value: string) =>
        setDraft((current) =>
            current ? { ...current, bank: { ...current.bank, [key]: value } } : current
        );

    const handleSave = async () => {
        if (!draft) return;
        /*
         * Adopt what the store actually wrote. It stamps `updatedAt`, so
         * keeping the local draft here would leave it differing from the saved
         * record by that one field — and the dirty check, which is a deep
         * compare, would read "unsaved changes" forever after a successful
         * save.
         */
        const stored = await saveProfile(draft);
        setDraft(stored);
        profileSaved(stored.brandName);
    };

    const readImageFile = (
        file: File | undefined,
        key: "logo" | "upiQr" | "seal" | "signature"
    ) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) =>
            set(key, String(event.target?.result ?? "") as never);
        reader.readAsDataURL(file);
    };

    const handleExport = () => {
        const payload = buildProfileExport(profiles);
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        /*
         * Named to say what it holds. A file called "profile.json" gets
         * forwarded over WhatsApp without a second thought, and this one
         * contains a bank account number and a PAN in readable text.
         */
        anchor.download = "studio-profiles-CONFIDENTIAL.json";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (file: File | undefined) => {
        if (!file) return;
        setImportError(null);
        try {
            const imported = parseProfileExport(await file.text());
            await replaceAll(imported);
        } catch (error) {
            setImportError(
                error instanceof Error ? error.message : "Could not read that file"
            );
        }
    };

    const gstin = checkGstin(draft.gstin);
    const gaps = profileGaps(draft);
    const savedRates = Object.entries(draft.rates);

    return (
        <div className="space-y-8">
            {/* Profile switcher */}
            <section className="flex flex-wrap items-center gap-2">
                {profiles.map((profile) => {
                    const isActive = profile.id === draft.id;
                    return (
                        <button
                            key={profile.id}
                            type="button"
                            onClick={() => {
                                void selectProfile(profile.id);
                                setDraft({ ...profile });
                                setEditingId(profile.id);
                            }}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                isActive
                                    ? "border-primary bg-primary/10 font-medium"
                                    : "hover:bg-muted"
                            }`}
                        >
                            {isActive && <Check className="h-3.5 w-3.5" />}
                            {profile.brandName || "Untitled studio"}
                        </button>
                    );
                })}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => void createProfile()}
                >
                    <Plus className="h-4 w-4" />
                    {_t("studio.addProfile")}
                </BaseButton>
            </section>

            {gaps.length > 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <p className="font-medium">{_t("studio.sections.identity")} — {_t("form.steps.studio.missing")}</p>
                        <p className="text-muted-foreground">{gaps.join(" · ")}</p>
                    </div>
                </div>
            )}

            {/* Identity */}
            <Section title={_t("studio.sections.identity")}>
                <Field label={_t("studio.fields.brandName")} hint={_t("studio.fields.brandNameHint")}>
                    <Input
                        value={draft.brandName}
                        onChange={(e) => set("brandName", e.target.value)}
                        placeholder="Prasath Photography"
                    />
                </Field>
                <Field label={_t("studio.fields.legalName")} hint={_t("studio.fields.legalNameHint")}>
                    <Input
                        value={draft.legalName}
                        onChange={(e) => set("legalName", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.tagline")}>
                    <Input
                        value={draft.tagline}
                        onChange={(e) => set("tagline", e.target.value)}
                        placeholder="Wedding & event photography"
                    />
                </Field>

                <ImageField
                    label={_t("studio.fields.logo")}
                    hint={_t("studio.fields.logoHint")}
                    value={draft.logo}
                    onPick={(file) => readImageFile(file, "logo")}
                    onClear={() => set("logo", "")}
                />
            </Section>

            {/* Contact */}
            <Section title={_t("studio.sections.contact")}>
                <Field
                    label={_t("studio.fields.phone")}
                    error={
                        draft.phone && !isIndianPhone(draft.phone)
                            ? _t("studio.validation.phoneInvalid")
                            : undefined
                    }
                >
                    <Input
                        value={draft.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                    />
                </Field>
                <Field label={_t("studio.fields.altPhone")}>
                    <Input
                        value={draft.altPhone}
                        onChange={(e) => set("altPhone", e.target.value)}
                        inputMode="tel"
                    />
                </Field>
                <Field label={_t("studio.fields.whatsapp")}>
                    <Input
                        value={draft.whatsapp}
                        onChange={(e) => set("whatsapp", e.target.value)}
                        inputMode="tel"
                    />
                </Field>
                <Field label={_t("studio.fields.email")}>
                    <Input
                        type="email"
                        value={draft.email}
                        onChange={(e) => set("email", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.website")}>
                    <Input
                        value={draft.website}
                        onChange={(e) => set("website", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.instagram")}>
                    <Input
                        value={draft.instagram}
                        onChange={(e) => set("instagram", e.target.value)}
                        placeholder="@prasathphotography"
                    />
                </Field>
            </Section>

            {/* Address */}
            <Section title={_t("studio.sections.address")}>
                <Field label={_t("studio.fields.addressLine1")}>
                    <Input
                        value={draft.addressLine1}
                        onChange={(e) => set("addressLine1", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.addressLine2")}>
                    <Input
                        value={draft.addressLine2}
                        onChange={(e) => set("addressLine2", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.city")}>
                    <Input
                        value={draft.city}
                        onChange={(e) => set("city", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.district")}>
                    <Select
                        value={draft.district || undefined}
                        onValueChange={(value) => set("district", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                            {TAMIL_NADU_DISTRICTS.map((district) => (
                                <SelectItem key={district} value={district}>
                                    {district}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={_t("studio.fields.state")}>
                    <Select
                        value={draft.state || undefined}
                        onValueChange={(value) => {
                            set("state", value);
                            // Keep the GST state code in step with the name;
                            // the code is what decides intra vs inter-state.
                            set("stateCode", stateByName(value)?.code ?? "");
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                            {INDIAN_STATES.map((state) => (
                                <SelectItem key={state.code} value={state.name}>
                                    {state.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field
                    label={_t("studio.fields.pincode")}
                    error={
                        draft.pincode && !isPincode(draft.pincode)
                            ? _t("studio.validation.pincodeInvalid")
                            : undefined
                    }
                >
                    <Input
                        value={draft.pincode}
                        onChange={(e) => set("pincode", e.target.value)}
                        inputMode="numeric"
                        maxLength={6}
                    />
                </Field>
            </Section>

            {/* GST & PAN */}
            <Section title={_t("studio.sections.statutory")}>
                <Field
                    label={_t("studio.fields.gstin")}
                    hint={_t("studio.fields.gstinHint")}
                    error={
                        draft.gstin && !gstin.valid ? gstin.reason : undefined
                    }
                    success={
                        gstin.valid
                            ? _t("studio.validation.gstinValid", {
                                  state: gstin.stateName ?? "",
                              })
                            : undefined
                    }
                >
                    <Input
                        value={draft.gstin}
                        onChange={(e) =>
                            set("gstin", e.target.value.toUpperCase())
                        }
                        placeholder="33AAAAA0000A1Z5"
                        maxLength={15}
                        className="uppercase"
                    />
                </Field>
                <Field
                    label={_t("studio.fields.pan")}
                    error={
                        draft.pan && !isPan(draft.pan)
                            ? _t("studio.validation.panInvalid")
                            : undefined
                    }
                >
                    <Input
                        value={draft.pan}
                        onChange={(e) => set("pan", e.target.value.toUpperCase())}
                        placeholder="AAAAA0000A"
                        maxLength={10}
                        className="uppercase"
                    />
                </Field>
                <Field label={_t("studio.fields.unregisteredNote")}>
                    <Input
                        value={draft.unregisteredNote}
                        onChange={(e) => set("unregisteredNote", e.target.value)}
                    />
                </Field>
            </Section>

            {/* Payment details */}
            <Section title={_t("studio.sections.bank")}>
                <Field label={_t("studio.fields.accountName")}>
                    <Input
                        value={draft.bank.accountName}
                        onChange={(e) => setBank("accountName", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.accountNumber")}>
                    <Input
                        value={draft.bank.accountNumber}
                        onChange={(e) =>
                            setBank("accountNumber", e.target.value)
                        }
                        inputMode="numeric"
                    />
                </Field>
                <Field
                    label={_t("studio.fields.ifsc")}
                    error={
                        draft.bank.ifsc && !isIfsc(draft.bank.ifsc)
                            ? _t("studio.validation.ifscInvalid")
                            : undefined
                    }
                >
                    <Input
                        value={draft.bank.ifsc}
                        onChange={(e) =>
                            setBank("ifsc", e.target.value.toUpperCase())
                        }
                        placeholder="HDFC0001234"
                        className="uppercase"
                    />
                </Field>
                <Field label={_t("studio.fields.bankName")}>
                    <Input
                        value={draft.bank.bankName}
                        onChange={(e) => setBank("bankName", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.branch")}>
                    <Input
                        value={draft.bank.branch}
                        onChange={(e) => setBank("branch", e.target.value)}
                    />
                </Field>
                <Field
                    label={_t("studio.fields.upiId")}
                    error={
                        draft.upiId && !isUpiId(draft.upiId)
                            ? _t("studio.validation.upiInvalid")
                            : undefined
                    }
                >
                    <Input
                        value={draft.upiId}
                        onChange={(e) => set("upiId", e.target.value)}
                        placeholder="prasath@okhdfcbank"
                    />
                </Field>

                <ImageField
                    label={_t("studio.fields.upiQr")}
                    hint={_t("studio.fields.upiQrHint")}
                    value={draft.upiQr}
                    onPick={(file) => readImageFile(file, "upiQr")}
                    onClear={() => set("upiQr", "")}
                />
            </Section>

            {/* Signature & seal */}
            <Section title={_t("studio.sections.signoff")}>
                <Field label={_t("studio.fields.signatoryName")}>
                    <Input
                        value={draft.signatoryName}
                        onChange={(e) => set("signatoryName", e.target.value)}
                    />
                </Field>
                <Field label={_t("studio.fields.signatoryDesignation")}>
                    <Input
                        value={draft.signatoryDesignation}
                        onChange={(e) =>
                            set("signatoryDesignation", e.target.value)
                        }
                    />
                </Field>

                <ImageField
                    label={_t("studio.fields.signature")}
                    value={draft.signature}
                    onPick={(file) => readImageFile(file, "signature")}
                    onClear={() => set("signature", "")}
                />
                <ImageField
                    label={_t("studio.fields.seal")}
                    value={draft.seal}
                    onPick={(file) => readImageFile(file, "seal")}
                    onClear={() => set("seal", "")}
                />
            </Section>

            {/*
             * Numbering — one series per document kind.
             *
             * Quotations, invoices and bookings each run their own counter.
             * Sharing one meant a quotation could consume INV/2026-27/004 and
             * leave a gap in the invoice run, which is exactly the thing an
             * accountant asks about.
             */}
            <Section title={_t("studio.sections.numbering")}>
                {DOCUMENT_KINDS.map((kind) => {
                    const series = draft.series[kind.id];
                    const setSeries = (patch: Partial<typeof series>) =>
                        setDraft((current) =>
                            current
                                ? {
                                      ...current,
                                      series: {
                                          ...current.series,
                                          [kind.id]: {
                                              ...current.series[kind.id],
                                              ...patch,
                                          },
                                      },
                                  }
                                : current
                        );

                    return (
                        <div
                            key={kind.id}
                            className="space-y-3 rounded-md border p-3 sm:col-span-2"
                        >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="text-sm font-medium">
                                    {kind.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {_t("studio.fields.numberPreview")}:{" "}
                                    <span className="font-semibold tabular-nums text-foreground">
                                        {formatDocumentNumber(series)}
                                    </span>
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-4">
                                <Field label={_t("studio.fields.numberPrefix")}>
                                    <Input
                                        value={series.prefix}
                                        onChange={(e) =>
                                            setSeries({ prefix: e.target.value })
                                        }
                                        placeholder={kind.numberPrefix}
                                    />
                                </Field>
                                <Field
                                    label={_t("studio.fields.numberPattern")}
                                >
                                    <Input
                                        value={series.pattern}
                                        onChange={(e) =>
                                            setSeries({ pattern: e.target.value })
                                        }
                                    />
                                </Field>
                                <Field label={_t("studio.fields.nextSequence")}>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={series.nextSequence}
                                        onChange={(e) =>
                                            setSeries({
                                                nextSequence: Math.max(
                                                    1,
                                                    Number(e.target.value) || 1
                                                ),
                                            })
                                        }
                                    />
                                </Field>
                                <Field
                                    label={_t("studio.fields.sequencePadding")}
                                >
                                    <Input
                                        type="number"
                                        min={1}
                                        max={8}
                                        value={series.padding}
                                        onChange={(e) =>
                                            setSeries({
                                                padding: Math.min(
                                                    8,
                                                    Math.max(
                                                        1,
                                                        Number(e.target.value) || 1
                                                    )
                                                ),
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                        </div>
                    );
                })}

                <p className="text-xs text-muted-foreground sm:col-span-2">
                    {_t("studio.fields.numberPatternHint")}
                </p>
            </Section>

            {/* Document defaults */}
            <Section title={_t("studio.sections.documentDefaults")}>
                <Field label={_t("studio.fields.defaultTaxMode")}>
                    <Select
                        value={draft.defaultTaxMode}
                        onValueChange={(value) =>
                            set("defaultTaxMode", value as never)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TAX_MODES.map((mode) => (
                                <SelectItem key={mode.value} value={mode.value}>
                                    {mode.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={_t("studio.fields.defaultGstRate")}>
                    <Select
                        value={String(draft.defaultGstRate ?? DEFAULT_GST_RATE)}
                        onValueChange={(value) =>
                            set("defaultGstRate", Number(value))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {GST_RATES.map((rate) => (
                                <SelectItem key={rate} value={String(rate)}>
                                    {rate}%
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={_t("studio.fields.defaultSac")}>
                    <Select
                        value={draft.defaultSac}
                        onValueChange={(value) => set("defaultSac", value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SAC_CODES.map((sac) => (
                                <SelectItem key={sac.code} value={sac.code}>
                                    {sac.code} — {sac.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={_t("studio.fields.defaultValidityDays")}>
                    <Input
                        type="number"
                        min={0}
                        value={draft.defaultValidityDays}
                        onChange={(e) =>
                            set(
                                "defaultValidityDays",
                                Math.max(0, Number(e.target.value) || 0)
                            )
                        }
                    />
                </Field>

                <ListField
                    label={_t("studio.fields.defaultInclusions")}
                    value={draft.defaultInclusions}
                    onChange={(value) => set("defaultInclusions", value)}
                />
                <ListField
                    label={_t("studio.fields.defaultExclusions")}
                    value={draft.defaultExclusions}
                    onChange={(value) => set("defaultExclusions", value)}
                />
                <ListField
                    label={_t("studio.fields.defaultTerms")}
                    value={draft.defaultTerms}
                    onChange={(value) => set("defaultTerms", value)}
                />

                <Field label={_t("studio.fields.defaultNotes")}>
                    <Textarea
                        rows={3}
                        value={draft.defaultNotes}
                        onChange={(e) => set("defaultNotes", e.target.value)}
                    />
                </Field>
            </Section>

            {/* Appearance */}
            <Section title={_t("studio.sections.appearance")}>
                <Field label={_t("studio.fields.accentColor")}>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {ACCENT_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                title={preset.name}
                                aria-label={preset.name}
                                aria-pressed={draft.accentColor === preset.value}
                                onClick={() => set("accentColor", preset.value)}
                                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                                    draft.accentColor === preset.value
                                        ? "scale-110 border-foreground"
                                        : "border-transparent"
                                }`}
                                style={{ backgroundColor: preset.value }}
                            />
                        ))}
                        <Input
                            type="color"
                            value={draft.accentColor}
                            onChange={(e) => set("accentColor", e.target.value)}
                            className="h-8 w-14 p-1"
                            aria-label={_t("gallery.customColor")}
                        />
                    </div>
                </Field>
                <Field label={_t("studio.fields.fontId")}>
                    <Select
                        value={draft.fontId}
                        onValueChange={(value) => set("fontId", value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_FONTS.map((font) => (
                                <SelectItem key={font.id} value={font.id}>
                                    {font.name} — {font.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={_t("studio.fields.density")}>
                    <Select
                        value={draft.density}
                        onValueChange={(value) => set("density", value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compact">
                                {_t("gallery.compact")}
                            </SelectItem>
                            <SelectItem value="comfortable">
                                {_t("gallery.comfortable")}
                            </SelectItem>
                            <SelectItem value="spacious">
                                {_t("gallery.spacious")}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
                <Field label={_t("studio.fields.templateId")}>
                    <Select
                        value={String(draft.templateId)}
                        onValueChange={(value) =>
                            set("templateId", Number(value))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TEMPLATES.map((template) => (
                                <SelectItem
                                    key={template.id}
                                    value={String(template.id)}
                                >
                                    {template.name} — {template.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </Section>

            {/* Saved rates */}
            <Section title={_t("studio.rateCard.heading")}>
                <p className="text-sm text-muted-foreground">
                    {_t("studio.rateCard.description")}
                </p>

                {savedRates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {_t("studio.rateCard.empty")}
                    </p>
                ) : (
                    <div className="divide-y rounded-md border">
                        {savedRates.map(([serviceId, rate]) => (
                            <div
                                key={serviceId}
                                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                            >
                                <span className="min-w-0 truncate">
                                    {serviceById(serviceId)?.name ?? serviceId}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="font-medium tabular-nums">
                                        {formatINR(rate, {
                                            trimZeroPaise: true,
                                        })}
                                    </span>
                                    <BaseButton
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        tooltipLabel={_t(
                                            "studio.rateCard.clear"
                                        )}
                                        onClick={() => {
                                            const next = { ...draft.rates };
                                            delete next[serviceId];
                                            set("rates", next);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </BaseButton>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Portability & danger zone */}
            <Section title={_t("studio.profiles")}>
                <p className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    {_t("studio.exportWarning")}
                </p>

                <div className="flex flex-wrap gap-2">
                    <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                    >
                        <Download className="h-4 w-4" />
                        {_t("studio.exportProfiles")}
                    </BaseButton>

                    <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => importRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                        {_t("studio.importProfiles")}
                    </BaseButton>
                    <input
                        ref={importRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) =>
                            void handleImport(e.target.files?.[0])
                        }
                    />

                    <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => void duplicateProfile(draft.id)}
                    >
                        <Copy className="h-4 w-4" />
                        {_t("studio.duplicateProfile")}
                    </BaseButton>

                    {profiles.length > 1 && (
                        <BaseButton
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmDelete(draft.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                            {_t("studio.deleteProfile")}
                        </BaseButton>
                    )}
                </div>

                {importError && (
                    <p className="text-sm text-destructive">{importError}</p>
                )}
            </Section>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
                <span className="text-sm text-muted-foreground">
                    {dirty ? _t("studio.unsaved") : _t("studio.saved")}
                </span>
                <BaseButton disabled={!dirty} onClick={() => void handleSave()}>
                    <Save className="h-4 w-4" />
                    {_t("studio.save")}
                </BaseButton>
            </div>

            <AlertDialog
                open={confirmDelete !== null}
                onOpenChange={(open) => !open && setConfirmDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {_t("studio.deleteConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {_t("studio.deleteConfirmBody")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmDelete) {
                                    void deleteProfile(confirmDelete);
                                    setDraft(null);
                                    setEditingId(null);
                                }
                                setConfirmDelete(null);
                            }}
                        >
                            {_t("studio.deleteProfile")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default StudioSettings;

/* ------------------------------------------------------------------ */

const Section = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <section className="space-y-3 border-t pt-6 first:border-t-0 first:pt-0">
        <Subheading>{title}</Subheading>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
);

const Field = ({
    label,
    hint,
    error,
    success,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    success?: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-1.5">
        <Label className="text-sm">{label}</Label>
        {children}
        {error ? (
            <p className="text-xs text-destructive">{error}</p>
        ) : success ? (
            <p className="flex items-center gap-1 text-xs text-success">
                <Check className="h-3 w-3" />
                {success}
            </p>
        ) : hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
    </div>
);

/**
 * An image field that shows what is stored.
 *
 * A logo or a UPI QR that failed to upload is invisible on a plain file input,
 * and the first anyone hears of it is a client asking why the PDF has no QR
 * code on it.
 */
const ImageField = ({
    label,
    hint,
    value,
    onPick,
    onClear,
}: {
    label: string;
    hint?: string;
    value: string;
    onPick: (file: File | undefined) => void;
    onClear: () => void;
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm">{label}</Label>

            <div className="flex items-center gap-3">
                {value ? (
                    <img
                        src={value}
                        alt=""
                        className="h-16 w-24 rounded border bg-white object-contain p-1"
                    />
                ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                        —
                    </div>
                )}

                <div className="flex gap-2">
                    <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                        Upload
                    </BaseButton>
                    {value && (
                        <BaseButton
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={onClear}
                        >
                            <ImageMinus className="h-4 w-4" />
                            Remove
                        </BaseButton>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPick(e.target.files?.[0])}
                />
            </div>

            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
};

/** A list of default lines — inclusions, exclusions, terms. */
const ListField = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
}) => (
    <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-sm">{label}</Label>

        {value.map((line, index) => (
            <div key={index} className="flex items-center gap-1.5">
                <Input
                    value={line}
                    onChange={(e) => {
                        const next = [...value];
                        next[index] = e.target.value;
                        onChange(next);
                    }}
                />
                <BaseButton
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    aria-label={`Remove line ${index + 1}`}
                >
                    <Trash2 className="h-4 w-4" />
                </BaseButton>
            </div>
        ))}

        <BaseButton
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onChange([...value, ""])}
        >
            <Plus className="h-4 w-4" />
            Add
        </BaseButton>
    </div>
);
