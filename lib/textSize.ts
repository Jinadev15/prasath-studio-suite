/**
 * App-wide text size.
 *
 * Implemented by scaling the root font size rather than overriding individual
 * text classes. Every size and gap in the interface is already expressed in
 * `rem` by Tailwind, so one value at the root moves text *and* the spacing
 * around it together — which is what keeps the layout intact. Changing only
 * the text would leave a 20px label in a row built for 14px and push controls
 * out of their containers.
 *
 * This is a display preference, not studio data: it belongs to the person at
 * the keyboard, not to the business, so it lives in plain `localStorage`
 * alongside the theme rather than in the encrypted studio profile. It is also
 * deliberately not sent to the PDF route — the generated document must be the
 * same size for everyone, whatever the person who made it finds comfortable
 * to read on screen.
 *
 * Free of React so the no-flash script in the layout can share these exact
 * values instead of hardcoding a second copy.
 */

export const TEXT_SIZE_STORAGE_KEY = "studio:textSize";

/** The CSS custom property `html { font-size: ... }` reads. */
export const TEXT_SIZE_CSS_VAR = "--app-text-scale";

export type TextSizeId = "small" | "default" | "large" | "xlarge";

export type TextSizeOption = {
    id: TextSizeId;
    /** Percentage of the browser's own base size, so a user who has already
     *  raised it in their browser settings keeps that as the baseline. */
    scale: string;
    labelKey: string;
    /** Shown in the control, so the effect is legible before committing. */
    sample: string;
};

export const TEXT_SIZES: TextSizeOption[] = [
    { id: "small", scale: "87.5%", labelKey: "small", sample: "A" },
    { id: "default", scale: "100%", labelKey: "default", sample: "A" },
    { id: "large", scale: "112.5%", labelKey: "large", sample: "A" },
    { id: "xlarge", scale: "125%", labelKey: "xlarge", sample: "A" },
];

export const DEFAULT_TEXT_SIZE: TextSizeId = "default";

export function isTextSizeId(value: unknown): value is TextSizeId {
    return TEXT_SIZES.some((size) => size.id === value);
}

export function textSizeOption(id: TextSizeId): TextSizeOption {
    return TEXT_SIZES.find((size) => size.id === id) ?? TEXT_SIZES[1];
}

/** Writes the scale onto the document. Safe to call before React mounts. */
export function applyTextSize(id: TextSizeId): void {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
        TEXT_SIZE_CSS_VAR,
        textSizeOption(id).scale
    );
}

export function readStoredTextSize(): TextSizeId {
    if (typeof window === "undefined") return DEFAULT_TEXT_SIZE;
    try {
        const stored = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
        return isTextSizeId(stored) ? stored : DEFAULT_TEXT_SIZE;
    } catch {
        // Private browsing and hardened configurations can refuse storage.
        return DEFAULT_TEXT_SIZE;
    }
}

export function storeTextSize(id: TextSizeId): void {
    try {
        window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, id);
    } catch {
        // The preference simply will not persist; the session still honours it.
    }
}

/**
 * The script that runs before first paint.
 *
 * Without it the page renders at 100% and then jumps to the chosen size once
 * React hydrates — the same flash next-themes exists to prevent for colours.
 * Inlined as a string so it can go into a blocking <script> in the layout.
 */
export const TEXT_SIZE_NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(TEXT_SIZE_STORAGE_KEY)});
    var sizes = ${JSON.stringify(
        Object.fromEntries(TEXT_SIZES.map((size) => [size.id, size.scale]))
    )};
    if (stored && sizes[stored]) {
      document.documentElement.style.setProperty(${JSON.stringify(
          TEXT_SIZE_CSS_VAR
      )}, sizes[stored]);
    }
  } catch (e) {}
})();
`;
