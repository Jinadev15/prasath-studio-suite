"use client";

import {
    ClientSection,
    DocumentMain,
    FunctionsSection,
    ServicesSection,
    StudioSection,
} from "@/app/components";
import PaymentsSection from "@/app/components/invoice/sections/PaymentsSection";
import InvoiceReviewSection from "@/app/components/invoice/sections/InvoiceReviewSection";

import DocumentSection from "./DocumentSection";
import { invoiceAdapter } from "@/lib/documents/invoice/adapter";
import { INVOICE_STEPS } from "@/lib/documents/invoice/wizard";

/**
 * The client half of the invoice route.
 *
 * Four of the six steps are the same components the quotation uses — the
 * studio, the client, the functions covered and the line items are identical
 * questions whichever document is being produced. Only the payments step and
 * the review step are the invoice's own.
 */
export default function InvoiceSection() {
    return (
        <DocumentSection adapter={invoiceAdapter} steps={INVOICE_STEPS}>
            <DocumentMain
                numberField="details.invoiceNumber"
                steps={[
                    <StudioSection key="studio" />,
                    <ClientSection key="client" />,
                    <FunctionsSection key="functions" />,
                    <ServicesSection key="services" />,
                    <PaymentsSection key="payments" />,
                    <InvoiceReviewSection key="review" />,
                ]}
            />
        </DocumentSection>
    );
}
