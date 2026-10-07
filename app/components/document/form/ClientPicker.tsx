"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import useToasts from "@/hooks/useToasts";

// Store
import {
    deleteClient,
    readClients,
    saveClient,
    type SavedClient,
} from "@/lib/clientStore";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { Check, Contact, Trash2, UserPlus } from "lucide-react";

// Types
import type { QuotationType } from "@/types";

/**
 * Save and reuse a client.
 *
 * A studio quotes the same event planners and the same extended families
 * repeatedly; without this, each repeat means retyping a dozen fields.
 *
 * Upstream had a second copy of this for the sender side, because its own
 * details were typed onto every invoice. Those live in the studio profile now,
 * so this is client-only — see lib/clientStore.ts.
 */
const ClientPicker = () => {
    const { getValues, setValue, watch } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();
    const { clientSaved, clientRemoved } = useToasts();

    const [clients, setClients] = useState<SavedClient[]>([]);
    const [open, setOpen] = useState(false);

    /*
     * Read on mount rather than during render: storage is not available on the
     * server, and reading it while rendering would make the first client render
     * disagree with the prerendered HTML. It is also async — the entries are
     * encrypted at rest — so the guard stops a late resolve writing into an
     * unmounted component.
     */
    useEffect(() => {
        let active = true;
        readClients().then((saved) => {
            if (active) setClients(saved);
        });
        return () => {
            active = false;
        };
    }, []);

    const label = useCallback((key: string) => _t(`clients.${key}`), [_t]);

    const currentName = watch("client.name");
    const currentPhone = watch("client.phone");
    const canSave = Boolean(currentName?.trim() && currentPhone?.trim());

    const isSaved = useMemo(() => {
        const digits = (value: string | undefined) =>
            (value ?? "").replace(/\D/g, "");
        return clients.some(
            (client) =>
                client.name.trim().toLowerCase() ===
                    currentName?.trim().toLowerCase() &&
                digits(client.phone) === digits(currentPhone)
        );
    }, [clients, currentName, currentPhone]);

    const handleSave = useCallback(async () => {
        const client = getValues("client");
        setClients(await saveClient(client));
        clientSaved(client.name);
    }, [getValues, clientSaved]);

    const handlePick = useCallback(
        (client: SavedClient) => {
            setOpen(false);
            /*
             * `id` is ours, not a form field — spreading it into the form would
             * put an unknown key into the quotation and fail schema validation
             * on the way to the PDF.
             */
            const { id: _id, ...fields } = client;
            setValue("client", fields, {
                shouldDirty: true,
                shouldValidate: true,
            });
        },
        [setValue]
    );

    const handleDelete = useCallback(
        async (event: React.MouseEvent, client: SavedClient) => {
            // The row itself selects the client; the bin must not do both.
            event.stopPropagation();
            setClients(await deleteClient(client.id));
            clientRemoved(client.name);
        },
        [clientRemoved]
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <BaseButton
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={clients.length === 0}
                        tooltipLabel={
                            clients.length === 0
                                ? label("emptyTooltip")
                                : label("pickTooltip")
                        }
                    >
                        <Contact className="h-4 w-4" />
                        {label("pick")}
                        {clients.length > 0 && (
                            <span className="text-muted-foreground">
                                ({clients.length})
                            </span>
                        )}
                    </BaseButton>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-72 p-1.5">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {label("heading")}
                    </p>

                    <div className="max-h-[50vh] overflow-y-auto">
                        {clients.map((client) => (
                            <div
                                key={client.id}
                                className="group flex items-center gap-1 rounded-md hover:bg-muted"
                            >
                                <button
                                    type="button"
                                    onClick={() => handlePick(client)}
                                    className="min-w-0 flex-1 px-2 py-1.5 text-start"
                                >
                                    <span className="block truncate text-sm font-medium">
                                        {client.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {[client.phone, client.city]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={(event) =>
                                        void handleDelete(event, client)
                                    }
                                    aria-label={`${label("remove")} ${client.name}`}
                                    className={cn(
                                        "me-1 rounded p-1.5 text-muted-foreground transition-colors",
                                        "hover:bg-destructive/10 hover:text-destructive"
                                    )}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <BaseButton
                variant="ghost"
                size="sm"
                className="h-8"
                disabled={!canSave}
                onClick={() => void handleSave()}
                tooltipLabel={label("saveTooltip")}
            >
                <UserPlus className="h-4 w-4" />
                {label("save")}
            </BaseButton>

            {isSaved && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-success" />
                    {label("saved")}
                </span>
            )}
        </div>
    );
};

export default ClientPicker;
