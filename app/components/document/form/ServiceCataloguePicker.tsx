"use client";

import { useMemo, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BaseButton } from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";

import { formatINR } from "@/lib/india/currency";
import {
    PACKAGE_PRESETS,
    SERVICE_CATALOGUE,
    SERVICE_CATEGORIES,
} from "@/lib/photography/catalogue";

import { Check, LayoutGrid, Package, Search } from "lucide-react";

import type { StudioProfile } from "@/lib/studio/profile";

/**
 * Adds services from the photography catalogue.
 *
 * This replaces upstream's voice-input item parser, which transcribed speech
 * like "Apple 3 quantity price 5 dollars" into line items. For this trade a
 * picker is strictly better: the thirty-odd things a studio sells are a known,
 * closed set with known units and known SAC codes, so choosing from a list is
 * both faster than speaking and produces a correctly-coded line, which
 * dictation cannot.
 *
 * Rates come from the profile's rate memory, so the second quotation a studio
 * builds is already priced.
 */
const ServiceCataloguePicker = ({
    profile,
    onAddServices,
    onApplyPackage,
}: {
    profile: StudioProfile | null;
    onAddServices: (serviceIds: string[]) => void;
    onApplyPackage: (presetId: string) => void;
}) => {
    const { _t } = useTranslationContext();

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string[]>([]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return SERVICE_CATALOGUE;
        return SERVICE_CATALOGUE.filter(
            (service) =>
                service.name.toLowerCase().includes(needle) ||
                service.description.toLowerCase().includes(needle)
        );
    }, [query]);

    const toggle = (id: string) =>
        setSelected((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id]
        );

    const commit = () => {
        if (selected.length) onAddServices(selected);
        setSelected([]);
        setQuery("");
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setSelected([]);
            }}
        >
            <DialogTrigger asChild>
                <BaseButton
                    variant="outline"
                    size="sm"
                    className="h-8"
                    tooltipLabel={_t("form.steps.services.catalogueTooltip")}
                >
                    <LayoutGrid className="h-4 w-4" />
                    {_t("form.steps.services.catalogue")}
                </BaseButton>
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle>
                        {_t("form.steps.services.catalogue")}
                    </DialogTitle>
                    <DialogDescription>
                        {_t("form.steps.services.description")}
                    </DialogDescription>
                </DialogHeader>

                {/* Packages: fill the whole item list from a tier preset. */}
                <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        {_t("form.steps.services.packages")}
                    </span>
                    {PACKAGE_PRESETS.map((preset) => (
                        <BaseButton
                            key={preset.id}
                            variant="secondary"
                            size="sm"
                            className="h-7"
                            tooltipLabel={preset.tagline}
                            onClick={() => {
                                onApplyPackage(preset.id);
                                setOpen(false);
                            }}
                        >
                            {preset.name}
                        </BaseButton>
                    ))}
                </div>

                <div className="relative">
                    <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={_t("form.steps.services.catalogue")}
                        className="ps-9"
                    />
                </div>

                <div className="-mx-1 max-h-[45vh] overflow-y-auto px-1">
                    {SERVICE_CATEGORIES.map((category) => {
                        const services = filtered.filter(
                            (service) => service.category === category.id
                        );
                        if (!services.length) return null;

                        return (
                            <div key={category.id} className="mb-3">
                                <p className="sticky top-0 bg-background py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {category.label}
                                </p>

                                <div className="space-y-0.5">
                                    {services.map((service) => {
                                        const isSelected = selected.includes(
                                            service.id
                                        );
                                        const savedRate =
                                            profile?.rates?.[service.id];

                                        return (
                                            <button
                                                key={service.id}
                                                type="button"
                                                onClick={() =>
                                                    toggle(service.id)
                                                }
                                                aria-pressed={isSelected}
                                                className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start transition-colors ${
                                                    isSelected
                                                        ? "bg-primary/10"
                                                        : "hover:bg-muted"
                                                }`}
                                            >
                                                <span
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                        isSelected
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-input"
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <Check className="h-3 w-3" />
                                                    )}
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium">
                                                        {service.name}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {service.description}
                                                    </span>
                                                </span>

                                                <span className="shrink-0 text-end text-xs text-muted-foreground">
                                                    <span className="block">
                                                        / {service.unit}
                                                    </span>
                                                    {savedRate ? (
                                                        <span className="block tabular-nums text-foreground">
                                                            {formatINR(
                                                                savedRate,
                                                                {
                                                                    trimZeroPaise:
                                                                        true,
                                                                }
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </BaseButton>
                    <BaseButton
                        size="sm"
                        disabled={!selected.length}
                        onClick={commit}
                    >
                        {_t("form.steps.services.addItem")}
                        {selected.length > 0 && ` (${selected.length})`}
                    </BaseButton>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ServiceCataloguePicker;
