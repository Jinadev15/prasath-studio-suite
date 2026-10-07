import React, { createContext, useContext } from "react";

// Next Intl
import { useTranslations } from "next-intl";

/**
 * Values interpolated into a message's ICU placeholders.
 *
 * The context used to type `_t` as `(key: string) => string`, which compiled
 * fine and failed at runtime: next-intl parses every message as ICU, so a
 * string like "Valid GSTIN — {state}" called without its variable throws a
 * FORMATTING_ERROR and renders the raw key on screen. The narrow type meant
 * TypeScript could not warn about it, because passing the values was not even
 * expressible.
 */
export type TranslationValues = Record<string, string | number | Date>;

type TranslateFn = (key: string, values?: TranslationValues) => string;

const defaultTranslationContext: { _t: TranslateFn } = {
    _t: (key: string) => key,
};

export const TranslationContext = createContext(defaultTranslationContext);

export const useTranslationContext = () => {
    return useContext(TranslationContext);
};

type TranslationProviderProps = {
    children: React.ReactNode;
};

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
    const t = useTranslations();

    const _t: TranslateFn = (key, values) =>
        values ? t(key, values) : t(key);

    return (
        <TranslationContext.Provider value={{ _t }}>
            {children}
        </TranslationContext.Provider>
    );
};
