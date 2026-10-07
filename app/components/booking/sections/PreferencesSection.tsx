"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
    BaseButton,
    FormInput,
    FormSelect,
    FormTextarea,
    Subheading,
} from "@/app/components";
import { Input } from "@/components/ui/input";

import { useTranslationContext } from "@/contexts/TranslationContext";

import {
    DEFAULT_SHOT_LIST,
    KNOWN_CONSTRAINTS,
    LANGUAGE_PREFERENCES,
    STYLE_PREFERENCES,
} from "@/lib/documents/booking/options";
import { blankPerson } from "@/lib/documents/booking/defaults";

import { Plus, RotateCcw, Trash2 } from "lucide-react";

import type { BookingType } from "@/types";

/**
 * Step 5 — the things that decide whether the family is happy.
 *
 * Almost all of this is what the crew needs and nobody writes down: the shots
 * that must exist or the booking has failed, the relatives who must appear,
 * and the constraints that change how the day is shot — a temple that forbids
 * flash, a grandmother who cannot stand for long, a reception hall with no
 * usable light.
 *
 * It is the bulk of the crew call sheet, which is why it is asked here rather
 * than left to a phone call on the morning.
 */
const PreferencesSection = () => {
    const { control, register, setValue } = useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    const shots = useFieldArray({
        control,
        name: "details.preferences.mustHaveShots" as never,
    });
    const vips = useFieldArray({ control, name: "details.preferences.vips" });

    const constraints = useWatch({
        control,
        name: "details.preferences.constraints",
    });

    const toggleConstraint = (value: string) => {
        const list = constraints ?? [];
        setValue(
            "details.preferences.constraints",
            list.includes(value)
                ? list.filter((item) => item !== value)
                : [...list, value],
            { shouldDirty: true }
        );
    };

    return (
        <section className="flex flex-col gap-5">
            {/* Must-have shots */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <Subheading>
                        {_t("quotationDocument.mustHaveShots")}
                    </Subheading>
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() =>
                            shots.replace(DEFAULT_SHOT_LIST as never)
                        }
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {_t("form.steps.preferences.loadUsual")}
                    </BaseButton>
                </div>

                {shots.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-1.5">
                        <Input
                            {...register(
                                `details.preferences.mustHaveShots.${index}` as never
                            )}
                            className="h-9"
                        />
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => shots.remove(index)}
                            aria-label={`${_t("form.steps.terms.removeLine")} ${index + 1}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="h-8 w-fit"
                    onClick={() => shots.append("" as never)}
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.terms.addLine")}
                </BaseButton>
            </div>

            {/* VIPs */}
            <div className="flex flex-col gap-2">
                <div>
                    <Subheading>
                        {_t("quotationDocument.vipsHeading")}
                    </Subheading>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {_t("form.steps.preferences.vipsHint")}
                    </p>
                </div>

                {vips.fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                        <FormInput
                            vertical
                            name={`details.preferences.vips.${index}.name`}
                            label={_t("form.steps.booking.name")}
                        />
                        <FormInput
                            vertical
                            name={`details.preferences.vips.${index}.relation`}
                            label={_t("form.steps.booking.relation")}
                        />
                        <FormInput
                            vertical
                            name={`details.preferences.vips.${index}.phone`}
                            label={_t("form.steps.client.phone")}
                            inputMode="tel"
                        />
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => vips.remove(index)}
                            tooltipLabel={_t("form.steps.terms.removeLine")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="h-8 w-fit"
                    onClick={() => vips.append(blankPerson())}
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.preferences.addVip")}
                </BaseButton>
            </div>

            {/* Constraints */}
            <div className="flex flex-col gap-2">
                <Subheading>{_t("quotationDocument.constraints")}</Subheading>
                <div className="flex flex-wrap gap-1.5">
                    {KNOWN_CONSTRAINTS.map((item) => {
                        const selected = (constraints ?? []).includes(item);
                        return (
                            <button
                                key={item}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => toggleConstraint(item)}
                                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    selected
                                        ? "border-primary bg-primary/10 font-medium"
                                        : "hover:bg-muted"
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Style and language */}
            <div className="grid gap-3 sm:grid-cols-2">
                <FormSelect
                    vertical
                    name="details.preferences.stylePreference"
                    label={_t("quotationDocument.stylePreference")}
                    placeholder="—"
                    options={STYLE_PREFERENCES.map((value) => ({
                        value,
                        label: value,
                    }))}
                />
                <FormSelect
                    vertical
                    name="details.preferences.languagePreference"
                    label={_t("quotationDocument.languagePreference")}
                    placeholder="—"
                    options={LANGUAGE_PREFERENCES.map((value) => ({
                        value,
                        label: value,
                    }))}
                />
            </div>

            <div className="flex flex-col gap-3">
                <FormTextarea
                    name="details.preferences.venueAccessNotes"
                    label={_t("quotationDocument.venueAccess")}
                />
                <FormTextarea
                    name="details.preferences.crewNotes"
                    label={_t("form.steps.preferences.crewNotes")}
                />
            </div>
        </section>
    );
};

export default PreferencesSection;
