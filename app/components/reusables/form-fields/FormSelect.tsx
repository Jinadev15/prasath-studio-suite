"use client";

import { useFormContext } from "react-hook-form";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { fieldControl, fieldLabel, fieldRow } from "./fieldStyles";

export type SelectOption = {
    value: string;
    label: string;
    /** Second line in the dropdown row — the Tamil name, or a hint. */
    hint?: string;
};

type FormSelectProps = {
    name: string;
    label?: string;
    placeholder?: string;
    options: SelectOption[];
    vertical?: boolean;
    className?: string;
    /** Coerce the stored value to a number — GST rates, template ids. */
    numeric?: boolean;
    onValueChange?: (value: string) => void;
};

/**
 * A select wired into react-hook-form.
 *
 * Added because this app replaced free-text fields with real choices wherever
 * the set of answers is known — GST treatment, state, district, function type,
 * billing unit, SAC code, GST rate. Upstream had none of these, and a
 * free-text unit column fills up with "day", "Day", "days" and "/day" on the
 * same document.
 */
const FormSelect = ({
    name,
    label,
    placeholder,
    options,
    vertical = false,
    className,
    numeric = false,
    onValueChange,
}: FormSelectProps) => {
    const { control } = useFormContext();

    const field = (
        <FormField
            control={control}
            name={name}
            render={({ field: rhf }) => (
                <FormItem className={vertical ? "w-full min-w-0" : undefined}>
                    {vertical && label && <FormLabel>{`${label}:`}</FormLabel>}

                    <FormControl>
                        <Select
                            // An empty string is not a valid Radix Select
                            // value; it has to be undefined for the
                            // placeholder to show.
                            value={
                                rhf.value === "" || rhf.value === undefined
                                    ? undefined
                                    : String(rhf.value)
                            }
                            onValueChange={(value) => {
                                rhf.onChange(numeric ? Number(value) : value);
                                onValueChange?.(value);
                            }}
                        >
                            <SelectTrigger className={cn("w-full", className)}>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        <span className="block">
                                            {option.label}
                                        </span>
                                        {option.hint && (
                                            <span className="block text-xs text-muted-foreground">
                                                {option.hint}
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    if (vertical) return field;

    return (
        <FormField
            control={control}
            name={name}
            render={() => (
                <FormItem>
                    <div className={fieldRow}>
                        {label && (
                            <FormLabel className={fieldLabel}>
                                {`${label}:`}
                            </FormLabel>
                        )}
                        <div className={fieldControl}>{field}</div>
                    </div>
                </FormItem>
            )}
        />
    );
};

export default FormSelect;
