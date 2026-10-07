"use client";

import { DocumentMain, StudioSection } from "@/app/components";
import EnquirySection from "@/app/components/booking/sections/EnquirySection";
import FamilySection from "@/app/components/booking/sections/FamilySection";
import BookingFunctionsSection from "@/app/components/booking/sections/BookingFunctionsSection";
import CoverageSection from "@/app/components/booking/sections/CoverageSection";
import PreferencesSection from "@/app/components/booking/sections/PreferencesSection";
import BookingReviewSection from "@/app/components/booking/sections/BookingReviewSection";

import DocumentSection from "./DocumentSection";
import { bookingAdapter } from "@/lib/documents/booking/adapter";
import { BOOKING_STEPS } from "@/lib/documents/booking/wizard";

/**
 * The client half of the booking route.
 *
 * Only the studio step is shared with the other two sections — a booking is an
 * intake form rather than a priced document, so it asks almost entirely
 * different questions. The studio step is folded into the enquiry step here
 * rather than taking a slot of its own, because a booking is captured on the
 * phone and the studio's own details are not what the caller is waiting for.
 */
export default function BookingSection() {
    return (
        <DocumentSection adapter={bookingAdapter} steps={BOOKING_STEPS}>
            <DocumentMain
                numberField="details.bookingNumber"
                steps={[
                    <div key="enquiry" className="flex flex-col gap-6">
                        <StudioSection />
                        <EnquirySection />
                    </div>,
                    <FamilySection key="client" />,
                    <BookingFunctionsSection key="functions" />,
                    <CoverageSection key="coverage" />,
                    <PreferencesSection key="preferences" />,
                    <BookingReviewSection key="review" />,
                ]}
            />
        </DocumentSection>
    );
}
