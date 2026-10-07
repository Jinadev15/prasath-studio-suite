/**
 * All three adapters in one place, keyed by DocumentKind.
 *
 * Import this wherever you need to work with documents without knowing their
 * kind ahead of time — the Records page being the main case. Every symbol here
 * is client-side safe (no server imports, no Puppeteer).
 */

import { quotationAdapter } from "@/lib/documents/quotation/adapter";
import { invoiceAdapter } from "@/lib/documents/invoice/adapter";
import { bookingAdapter } from "@/lib/documents/booking/adapter";

import type { DocumentKind } from "@/lib/documents/kinds";
import type { DocumentAdapter } from "@/lib/documents/adapter";
import type { AnyDocument } from "@/types";

export const ALL_ADAPTERS: Record<
    DocumentKind,
    DocumentAdapter<AnyDocument>
> = {
    booking: bookingAdapter as DocumentAdapter<AnyDocument>,
    quotation: quotationAdapter as DocumentAdapter<AnyDocument>,
    invoice: invoiceAdapter as DocumentAdapter<AnyDocument>,
};
