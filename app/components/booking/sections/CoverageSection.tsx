"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
    BaseButton,
    FormInput,
    FormSelect,
    FormTextarea,
    Subheading,
} from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";

import {
    ALBUM_SIZES,
    ALBUM_TYPES,
    FILM_TYPES,
    RAW_DELIVERY_MODES,
} from "@/lib/documents/booking/options";
import { blankAlbum } from "@/lib/documents/booking/defaults";

import { Plus, Trash2 } from "lucide-react";

import type { BookingType } from "@/types";

/**
 * Step 4 — what the family actually ends up holding.
 *
 * The part of a booking most often agreed verbally and remembered differently
 * six months later: how many albums, what size, how many sheets, which films,
 * and whether the raw footage is handed over. Writing it down here is what the
 * booking sheet then prints for them to confirm.
 */
const CoverageSection = () => {
    const { control, setValue } = useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    const albums = useFieldArray({ control, name: "details.coverage.albums" });

    const films = useWatch({ control, name: "details.coverage.films" });
    const rawDelivery = useWatch({
        control,
        name: "details.coverage.rawDelivery",
    });

    const toggle = (
        field: "details.coverage.films" | "details.coverage.rawDelivery",
        current: string[] | undefined,
        id: string
    ) => {
        const list = current ?? [];
        setValue(
            field,
            list.includes(id)
                ? list.filter((value) => value !== id)
                : [...list, id],
            { shouldDirty: true }
        );
    };

    return (
        <section className="flex flex-col gap-5">
            {/* Albums */}
            <div className="flex flex-col gap-3">
                <Subheading>{_t("form.steps.coverage.albums")}</Subheading>

                {albums.fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_5rem_5rem_auto]"
                    >
                        <FormSelect
                            vertical
                            name={`details.coverage.albums.${index}.type`}
                            label={_t("form.steps.coverage.albumType")}
                            placeholder="—"
                            options={ALBUM_TYPES.map((value) => ({
                                value,
                                label: value,
                            }))}
                        />
                        <FormSelect
                            vertical
                            name={`details.coverage.albums.${index}.size`}
                            label={_t("form.steps.coverage.albumSize")}
                            placeholder="—"
                            options={ALBUM_SIZES.map((value) => ({
                                value,
                                label: value,
                            }))}
                        />
                        <FormInput
                            vertical
                            name={`details.coverage.albums.${index}.sheets`}
                            label={_t("quotationDocument.sheets")}
                            type="number"
                            min={0}
                        />
                        <FormInput
                            vertical
                            name={`details.coverage.albums.${index}.quantity`}
                            label={_t("form.steps.coverage.quantity")}
                            type="number"
                            min={1}
                        />
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => albums.remove(index)}
                            tooltipLabel={_t("form.steps.terms.removeLine")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => albums.append(blankAlbum())}
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.coverage.addAlbum")}
                </BaseButton>
            </div>

            {/* Films */}
            <div className="flex flex-col gap-2">
                <Subheading>{_t("quotationDocument.films")}</Subheading>
                <div className="flex flex-wrap gap-1.5">
                    {FILM_TYPES.map((film) => {
                        const selected = (films ?? []).includes(film.id);
                        return (
                            <button
                                key={film.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                    toggle(
                                        "details.coverage.films",
                                        films,
                                        film.id
                                    )
                                }
                                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    selected
                                        ? "border-primary bg-primary/10 font-medium"
                                        : "hover:bg-muted"
                                }`}
                            >
                                {film.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stills and prints */}
            <div className="grid gap-3 sm:grid-cols-3">
                <FormInput
                    vertical
                    name="details.coverage.editedPhotoCount"
                    label={_t("quotationDocument.editedPhotos")}
                    type="number"
                    min={0}
                />
                <FormInput
                    vertical
                    name="details.coverage.frames"
                    label={_t("quotationDocument.frames")}
                    type="number"
                    min={0}
                />
                <FormInput
                    vertical
                    name="details.coverage.frameSize"
                    label={_t("form.steps.coverage.frameSize")}
                    placeholder="16x24"
                />
            </div>

            {/* Raw data */}
            <div className="flex flex-col gap-2">
                <Subheading>{_t("quotationDocument.rawDelivery")}</Subheading>
                <div className="flex flex-wrap gap-1.5">
                    {RAW_DELIVERY_MODES.map((mode) => {
                        const selected = (rawDelivery ?? []).includes(mode.id);
                        return (
                            <button
                                key={mode.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                    toggle(
                                        "details.coverage.rawDelivery",
                                        rawDelivery,
                                        mode.id
                                    )
                                }
                                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    selected
                                        ? "border-primary bg-primary/10 font-medium"
                                        : "hover:bg-muted"
                                }`}
                            >
                                {mode.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <FormInput
                    name="details.coverage.deliveryExpectation"
                    label={_t("quotationDocument.deliveryExpectation")}
                    placeholder="Albums before the housewarming in June"
                />
                <FormTextarea
                    name="details.coverage.notes"
                    label={_t("form.steps.terms.additionalNotes")}
                />
            </div>
        </section>
    );
};

export default CoverageSection;
