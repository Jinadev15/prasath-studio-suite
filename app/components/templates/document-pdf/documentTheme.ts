/**
 * Per-document presentation options.
 *
 * Passed to the templates as a plain prop, exactly like `labels` — the
 * templates render both inside the client tree (live preview) and through
 * `renderToStaticMarkup` in a route handler (PDF), where React context and
 * next-intl hooks are unavailable.
 *
 * This module is deliberately free of React so it is safe to import anywhere.
 */

export type DocumentDensity = "compact" | "comfortable" | "spacious";

export type DocumentFontId =
    | "outfit"
    | "plexSans"
    | "sourceSerif"
    | "plexMono"
    | "notoTamil";

export type DocumentTheme = {
    /** Hex colour used for headings, rules and accent fills. */
    accentColor: string;
    fontId: DocumentFontId;
    density: DocumentDensity;
};

export const DEFAULT_DOCUMENT_THEME: DocumentTheme = {
    accentColor: "#1F2937",
    fontId: "outfit",
    density: "comfortable",
};

/**
 * Accent presets.
 *
 * Plain colours with plain names. The default is near-black, because the
 * accent is used for headings, rules and table-header fills on a document
 * that is as likely to be printed in mono or read on a cheap phone screen as
 * it is to be admired — and black is the colour that survives both.
 *
 * The rest are ordinary business colours a studio might pick to match its
 * logo. Nothing is themed and nothing is invented: a studio choosing a colour
 * for its own letterhead wants to recognise the name.
 */
export const ACCENT_PRESETS = [
    { name: "Black", value: "#1F2937" },
    { name: "Grey", value: "#4B5563" },
    { name: "Navy", value: "#1E3A5F" },
    { name: "Blue", value: "#1D4ED8" },
    { name: "Teal", value: "#0F766E" },
    { name: "Green", value: "#15803D" },
    { name: "Maroon", value: "#8C1C3A" },
    { name: "Brown", value: "#6B4423" },
] as const;

/*
 * Glyph fallback for the embedded PDF fonts.
 *
 * The PDF makes zero network requests — every font is base64'd into the
 * generated stylesheet — so a character with no glyph in the chosen family has
 * nowhere to go and Chromium reaches for whatever the render machine happens
 * to have, which on a Lambda is nothing.
 *
 * This matters more here than it did upstream, and for a reason that was a
 * live defect: **Outfit, the default face, contains no rupee sign.** Its latin
 * and latin-ext subsets both lack U+20B9, so every amount on every document
 * would have printed with a substituted or missing glyph. Noto Sans Tamil
 * carries both the rupee sign and the Tamil block, and IBM Plex Sans covers
 * the rupee too, so naming them here means only those characters change
 * typeface — CSS font fallback is per character, and everything else still
 * renders in the chosen family.
 */
const GLYPH_FALLBACK =
    "'IBM Plex Sans', 'Noto Sans Tamil', system-ui, sans-serif";

export const DOCUMENT_FONTS: {
    id: DocumentFontId;
    name: string;
    description: string;
    stack: string;
}[] = [
    {
        id: "outfit",
        name: "Outfit",
        description: "Geometric sans — modern studio",
        stack: `'Outfit', ${GLYPH_FALLBACK}`,
    },
    {
        id: "plexSans",
        name: "IBM Plex Sans",
        description: "Neutral sans — reads as official",
        stack: GLYPH_FALLBACK,
    },
    {
        id: "sourceSerif",
        name: "Source Serif",
        description: "Classic serif — traditional",
        stack: `'Source Serif 4', ${GLYPH_FALLBACK}`,
    },
    {
        id: "notoTamil",
        name: "Noto Sans Tamil",
        description: "Best choice for Tamil text",
        stack: `'Noto Sans Tamil', ${GLYPH_FALLBACK}`,
    },
    {
        id: "plexMono",
        name: "IBM Plex Mono",
        description: "Technical mono",
        stack: `'IBM Plex Mono', ${GLYPH_FALLBACK}`,
    },
];

export function fontStack(fontId: DocumentFontId): string {
    return (
        DOCUMENT_FONTS.find((f) => f.id === fontId)?.stack ??
        DOCUMENT_FONTS[0].stack
    );
}

/**
 * Density scale.
 *
 * These are literal Tailwind class strings so the PDF stylesheet generator
 * picks them up when it scans this directory — a computed class name would be
 * missing from the compiled CSS and silently do nothing in the PDF.
 */
export type DocumentScale = ReturnType<typeof densityScale>;

const DENSITY_SCALES = {
    compact: {
        page: "p-5 sm:p-8",
        stack: "space-y-4",
        sectionGap: "mt-4",
        rowY: "py-1",
        body: "text-[11px]",
        label: "text-[9px]",
        heading: "text-lg",
        name: "text-sm",
        total: "text-base",
    },
    comfortable: {
        page: "p-6 sm:p-10",
        stack: "space-y-6",
        sectionGap: "mt-6",
        rowY: "py-1.5",
        body: "text-xs",
        label: "text-[10px]",
        heading: "text-2xl",
        name: "text-base",
        total: "text-lg",
    },
    spacious: {
        page: "p-7 sm:p-14",
        stack: "space-y-9",
        sectionGap: "mt-9",
        rowY: "py-3",
        body: "text-sm",
        label: "text-[11px]",
        heading: "text-3xl",
        name: "text-lg",
        total: "text-xl",
    },
} as const;

export function densityScale(density: DocumentDensity) {
    return DENSITY_SCALES[density] ?? DENSITY_SCALES.comfortable;
}

/** Normalises a possibly-partial theme coming from stored documents. */
export function resolveTheme(theme?: Partial<DocumentTheme>): DocumentTheme {
    return {
        accentColor: theme?.accentColor || DEFAULT_DOCUMENT_THEME.accentColor,
        fontId: theme?.fontId || DEFAULT_DOCUMENT_THEME.fontId,
        density: theme?.density || DEFAULT_DOCUMENT_THEME.density,
    };
}

/**
 * Mixes an accent with white to get a tint usable as a background behind dark
 * text. Done arithmetically rather than with `color-mix()` so it works in the
 * PDF renderer and in every browser the preview runs in.
 */
export function tint(hex: string, amount: number): string {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return hex;

    const mix = (channel: number) =>
        Math.round(channel + (255 - channel) * amount);

    const r = mix(parseInt(clean.slice(0, 2), 16));
    const g = mix(parseInt(clean.slice(2, 4), 16));
    const b = mix(parseInt(clean.slice(4, 6), 16));

    return `rgb(${r}, ${g}, ${b})`;
}

/** Darkens an accent, for a rule that must sit against its own tint. */
export function shade(hex: string, amount: number): string {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return hex;

    const mix = (channel: number) => Math.round(channel * (1 - amount));

    const r = mix(parseInt(clean.slice(0, 2), 16));
    const g = mix(parseInt(clean.slice(2, 4), 16));
    const b = mix(parseInt(clean.slice(4, 6), 16));

    return `rgb(${r}, ${g}, ${b})`;
}

/** Picks black or white text for a given background, by relative luminance. */
export function readableOn(hex: string): string {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return "#ffffff";

    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    const luminance =
        0.2126 * channel(parseInt(clean.slice(0, 2), 16)) +
        0.7152 * channel(parseInt(clean.slice(2, 4), 16)) +
        0.0722 * channel(parseInt(clean.slice(4, 6), 16));

    return luminance > 0.45 ? "#111827" : "#ffffff";
}
