"use client";

import React from "react";

// Radix
import { DirectionProvider } from "@radix-ui/react-direction";

// Next Intl
import { useLocale } from "next-intl";

// Context
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { StudioProfileProvider } from "@/contexts/StudioProfileContext";
import { TextSizeProvider } from "@/contexts/TextSizeContext";

// Variables
import { dirForLocale } from "@/lib/variables";

type ProvidersProps = {
    children: React.ReactNode;
};

/**
 * The app-wide shell: theme, translations, and the studio profile.
 *
 * Nothing document-specific lives here any more. It used to own a
 * `useForm<QuotationType>` and the quotation context, which was fine when the
 * app only made quotations — but with three sections under one roof that would
 * mean every page carrying a quotation form it does not use, and all three
 * sections sharing one form instance and one draft.
 *
 * The form and the document context are now mounted per section by
 * `DocumentSection`, so each of the three gets its own form state, its own
 * draft and its own saved list. The studio profile stays here, above them all,
 * because it is the one thing genuinely shared: edit the GSTIN once and every
 * section picks it up.
 */
const Providers = ({ children }: ProvidersProps) => {
    /*
     * Radix reads direction from its own context, not from the document, so
     * without this its menus, popovers and tabs would stay left-to-right on an
     * RTL page while everything around them mirrored. Neither shipped locale
     * is RTL today; the plumbing stays so adding one is not a rewrite.
     */
    const dir = dirForLocale(useLocale());

    return (
        <DirectionProvider dir={dir}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <TranslationProvider>
                    <TextSizeProvider>
                        <StudioProfileProvider>
                            {children}
                        </StudioProfileProvider>
                    </TextSizeProvider>
                </TranslationProvider>
            </ThemeProvider>
        </DirectionProvider>
    );
};

export default Providers;
