"use client";

import {
    ClientSection,
    DocumentMain,
    FunctionsSection,
    ReviewSection,
    ServicesSection,
    StudioSection,
    TermsSection,
} from "@/app/components";

import DocumentSection from "./DocumentSection";
import { quotationAdapter } from "@/lib/documents/quotation/adapter";
import { QUOTATION_STEPS } from "@/lib/documents/quotation/wizard";

/**
 * The client half of the quotation route.
 *
 * The adapter holds a zod schema and several functions, and neither can cross
 * the server/client boundary — React only serialises plain data. So the
 * route's `page.tsx` stays a server component (it owns the metadata) and
 * imports this, which picks the adapter up on the client side where it is
 * used.
 *
 * The step components are listed here, in the order `QUOTATION_STEPS`
 * declares. Four of the six are shared with the invoice section; only the
 * terms and review steps are the quotation's own.
 */
export default function QuotationSection() {
    return (
        <DocumentSection adapter={quotationAdapter} steps={QUOTATION_STEPS}>
            <DocumentMain
                numberField="details.quotationNumber"
                steps={[
                    <StudioSection key="studio" />,
                    <ClientSection key="client" />,
                    <FunctionsSection key="functions" />,
                    <ServicesSection key="services" />,
                    <TermsSection key="terms" />,
                    <ReviewSection key="review" />,
                ]}
            />
        </DocumentSection>
    );
}
