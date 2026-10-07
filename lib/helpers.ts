// Next
import { NextResponse } from "next/server";

/**
 * Odds and ends shared by the form, the export routes and the PDF service.
 *
 * Noticeably shorter than the module it was forked from. Upstream carried a
 * 170-currency lookup table, a short-scale number-to-words conversion and its
 * own date formatter. All three are gone: this app bills in rupees only
 * (`lib/india/currency.ts`), writes amounts in the Indian scale
 * (`lib/india/words.ts`), and formats dates day-first from an ISO wire format
 * (`lib/india/dates.ts`).
 */

/**
 * Flattens a nested object, for the CSV export.
 */
const flattenObject = <T>(
    obj: Record<string, T>,
    parentKey = ""
): Record<string, T> => {
    const result: Record<string, T> = {};

    for (const key in obj) {
        if (
            typeof obj[key] === "object" &&
            obj[key] !== null &&
            !Array.isArray(obj[key])
        ) {
            const flattened = flattenObject(
                obj[key] as Record<string, T>,
                parentKey + key + "_"
            );
            for (const subKey in flattened) {
                result[parentKey + subKey] = flattened[subKey];
            }
        } else {
            result[parentKey + key] = obj[key];
        }
    }

    return result;
};

/** A simple email shape check. */
const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
};

/** True for an embedded data URL, as opposed to a typed signature string. */
const isDataUrl = (str: string) => str.startsWith("data:");

/**
 * Retrieves a template component by id.
 *
 * Reads the registry rather than interpolating the id into a module path. The
 * old `import(`...Template${id}`)` form failed at import time for an unknown
 * id and silently returned null, and offered no way to enumerate the
 * templates for a picker.
 */
const getDocumentTemplate = async (templateId: number) => {
    const { getTemplateEntry } = await import(
        "@/app/components/templates/document-pdf/registry"
    );

    const entry = getTemplateEntry(templateId);
    if (!entry) {
        console.error(`Unknown template id: ${templateId}`);
        return null;
    }

    try {
        const templateModule = await entry.load();
        return templateModule.default;
    } catch (err) {
        console.error(`Error importing template ${entry.name}: ${err}`);
        return null;
    }
};

/** Converts a file to a Buffer, for the email attachment. */
const fileToBuffer = async (file: File) => {
    const arrayBuffer = await new NextResponse(file).arrayBuffer();
    return Buffer.from(arrayBuffer);
};

export {
    flattenObject,
    isValidEmail,
    isDataUrl,
    getDocumentTemplate,
    fileToBuffer,
};
