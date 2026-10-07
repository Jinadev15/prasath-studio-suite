"use client";

import { useState } from "react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { BaseButton } from "@/app/components";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useTextSize } from "@/contexts/TextSizeContext";

import { cn } from "@/lib/utils";
import { TEXT_SIZES, type TextSizeId } from "@/lib/textSize";

import { Check, Type } from "lucide-react";

type TextSizeSelectorProps = {
    /**
     * `pill` is the compact navbar trigger; `block` is the full-width row
     * inside the settings sheet, where there is room for the labels. Same two
     * variants as LanguageSelector, for the same reason.
     */
    variant?: "pill" | "block";
};

/**
 * App-wide text size.
 *
 * Each option renders its own name at the size it sets, so the effect is
 * visible before committing to it — a list of four identically-sized words
 * reading "Small / Default / Large" tells the user nothing about what they are
 * choosing.
 *
 * This scales the whole interface, not only the glyphs: Tailwind expresses
 * every size and gap in `rem`, so moving the root font size carries the
 * spacing with it and the layout stays intact. See lib/textSize.ts
 */
const TextSizeSelector = ({ variant = "pill" }: TextSizeSelectorProps) => {
    const { _t } = useTranslationContext();
    const { textSize, setTextSize } = useTextSize();

    const [open, setOpen] = useState(false);

    const rows = (
        <div className="flex flex-col gap-0.5">
            {TEXT_SIZES.map((size) => {
                const isActive = size.id === textSize;

                return (
                    <button
                        key={size.id}
                        type="button"
                        onClick={() => {
                            setTextSize(size.id as TextSizeId);
                            setOpen(false);
                        }}
                        aria-pressed={isActive}
                        className={cn(
                            "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-start transition-colors",
                            isActive ? "bg-muted" : "hover:bg-muted"
                        )}
                    >
                        <span className="flex items-baseline gap-2">
                            {/*
                             * Rendered at the size it sets. `rem` would track
                             * the current root size and make every row the
                             * same, so the preview is in px.
                             */}
                            <span
                                aria-hidden="true"
                                className="w-5 text-center font-semibold text-muted-foreground"
                                style={{
                                    fontSize: `calc(16px * ${parseFloat(size.scale) / 100})`,
                                }}
                            >
                                {size.sample}
                            </span>
                            <span className="text-sm">
                                {_t(`settings.textSize.${size.labelKey}`)}
                            </span>
                        </span>

                        {isActive && (
                            <Check className="h-4 w-4 shrink-0 text-success" />
                        )}
                    </button>
                );
            })}
        </div>
    );

    if (variant === "block") {
        return rows;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <BaseButton
                    variant="ghost"
                    size="icon"
                    aria-label={_t("settings.textSize.label")}
                    tooltipLabel={_t("settings.textSize.label")}
                >
                    <Type className="h-[1.2rem] w-[1.2rem]" />
                </BaseButton>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-56 p-1.5">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {_t("settings.textSize.label")}
                </p>
                {rows}
            </PopoverContent>
        </Popover>
    );
};

export default TextSizeSelector;
