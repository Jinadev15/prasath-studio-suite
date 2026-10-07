"use client";

import { usePathname } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { DOCUMENT_KINDS } from "@/lib/documents/kinds";

import { CalendarRange, FileText, Receipt } from "lucide-react";

const ICONS = {
    booking: CalendarRange,
    quotation: FileText,
    invoice: Receipt,
} as const;

/**
 * The three sections, as tabs.
 *
 * Ordered the way the work happens — enquiry, then price, then bill — rather
 * than alphabetically, so the tabs read left to right as a job progresses.
 * The order lives in `DOCUMENT_KINDS`, not here.
 *
 * Each section keeps its own draft, so switching tabs never loses what is
 * half-typed in another one.
 */
const SectionNav = () => {
    const pathname = usePathname();

    /*
     * `usePathname` from next/navigation includes the locale prefix, which the
     * localised <Link> adds for us. Comparing the last segment avoids having
     * to rebuild the prefix here and getting it wrong for one of the locales.
     */
    const active = pathname.split("/").filter(Boolean).pop();

    return (
        <nav
            aria-label="Sections"
            className="flex items-center gap-1 overflow-x-auto"
        >
            {DOCUMENT_KINDS.map((kind) => {
                const Icon = ICONS[kind.id];
                const isActive = active === kind.path;

                return (
                    <Link
                        key={kind.id}
                        href={`/${kind.path}`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={kind.label}
                        title={kind.blurb}
                        className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
                            isActive
                                ? "bg-secondary text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {/*
                         * Below `sm` only the active tab keeps its label.
                         * All three labels at once overflowed a 375px screen
                         * and pushed Invoices off-screen entirely, where the
                         * only way to reach it was a horizontal scroll with no
                         * affordance. The icons carry an aria-label, so the
                         * tabs stay announced in full to a screen reader.
                         */}
                        <span className={isActive ? "" : "hidden sm:inline"}>
                            {kind.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default SectionNav;
