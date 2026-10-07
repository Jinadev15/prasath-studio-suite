"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { BaseButton } from "@/app/components";

import { Plus, Trash2 } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Edits a list of plain strings — inclusions, exclusions, terms, tier
 * highlights.
 *
 * A single textarea split on newlines would be less code, and was the first
 * attempt. It is worse in use: reordering means cut-and-paste, one stray blank
 * line prints an empty bullet on the document, and there is nowhere to hang a
 * per-row delete. `useFieldArray` over a string array needs the value bound as
 * `name.${index}` rather than a field object, which is the one non-obvious
 * part of this.
 */
const StringListEditor = ({
    name,
    placeholder,
    addLabel,
    removeLabel,
}: {
    /** Path to a `string[]` in the form. */
    name:
        | "details.inclusions"
        | "details.exclusions"
        | "details.terms";
    placeholder?: string;
    addLabel: string;
    removeLabel: string;
}) => {
    const { control, register } = useFormContext<QuotationType>();
    const { fields, append, remove } = useFieldArray({
        control,
        // A string array has no object to key on, so RHF cannot track
        // identity; it falls back to index keys, which is fine here because
        // rows are only ever appended or removed.
        name: name as never,
    });

    return (
        <div className="space-y-1.5">
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-1.5">
                    <Input
                        {...register(`${name}.${index}` as never)}
                        placeholder={placeholder}
                        className="h-9"
                    />
                    <BaseButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                        tooltipLabel={removeLabel}
                        aria-label={`${removeLabel} ${index + 1}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </BaseButton>
                </div>
            ))}

            <BaseButton
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => append("" as never)}
            >
                <Plus className="h-4 w-4" />
                {addLabel}
            </BaseButton>
        </div>
    );
};

export default StringListEditor;
