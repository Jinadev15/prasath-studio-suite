"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    applyTextSize,
    DEFAULT_TEXT_SIZE,
    readStoredTextSize,
    storeTextSize,
    TEXT_SIZE_STORAGE_KEY,
    type TextSizeId,
} from "@/lib/textSize";

type TextSizeContextValue = {
    textSize: TextSizeId;
    setTextSize: (id: TextSizeId) => void;
};

const TextSizeContext = createContext<TextSizeContextValue>({
    textSize: DEFAULT_TEXT_SIZE,
    setTextSize: () => {},
});

export const useTextSize = () => useContext(TextSizeContext);

/**
 * Holds the chosen text size and keeps it in step with the document.
 *
 * The scale is already on `<html>` before React runs — the layout's no-flash
 * script put it there — so this provider starts from the default and syncs on
 * mount rather than reading storage during render, which would make the first
 * client render disagree with the prerendered HTML.
 */
export const TextSizeProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [textSize, setTextSizeState] = useState<TextSizeId>(DEFAULT_TEXT_SIZE);

    useEffect(() => {
        const stored = readStoredTextSize();
        setTextSizeState(stored);
        applyTextSize(stored);
    }, []);

    /*
     * Follow the preference across tabs. A studio commonly has the quotation
     * open in one tab and the invoice in another; changing the size in one and
     * finding the other unchanged reads as the setting not having worked.
     */
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== TEXT_SIZE_STORAGE_KEY) return;
            const next = readStoredTextSize();
            setTextSizeState(next);
            applyTextSize(next);
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const setTextSize = useCallback((id: TextSizeId) => {
        setTextSizeState(id);
        applyTextSize(id);
        storeTextSize(id);
    }, []);

    const value = useMemo(
        () => ({ textSize, setTextSize }),
        [textSize, setTextSize]
    );

    return (
        <TextSizeContext.Provider value={value}>
            {children}
        </TextSizeContext.Provider>
    );
};
