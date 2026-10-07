// React-email
import {
    Html,
    Body,
    Head,
    Heading,
    Hr,
    Container,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

type SendPdfEmailProps = {
    quotationNumber: string;
    studioName?: string;
};

/**
 * The covering email for a quotation PDF.
 *
 * Upstream's version embedded the app's own logo and signed off as the app.
 * That is wrong here: the client is hearing from their photographer, not from
 * a billing tool, and an email branded by the software would read as spam.
 * The studio's name is used throughout, and no remote image is referenced —
 * a hotlinked logo is the single most reliable way to get an email flagged.
 */
export default function SendPdfEmail({
    quotationNumber,
    studioName,
}: SendPdfEmailProps) {
    const studio = studioName?.trim() || "our studio";

    return (
        <Html>
            <Head />
            <Preview>
                Your quotation {quotationNumber} from {studio}
            </Preview>
            <Tailwind>
                <Body className="bg-gray-100">
                    <Container>
                        <Section className="my-10 rounded-md bg-white px-10 py-6">
                            <Heading className="leading-tight">
                                Your quotation from {studio}
                            </Heading>

                            <Text>
                                Thank you for your enquiry. Your quotation{" "}
                                <b>{quotationNumber}</b> is attached as a PDF.
                            </Text>

                            <Text>
                                It covers the functions, services and
                                deliverables we discussed, along with the
                                payment schedule. Do reply if anything needs
                                changing — we are happy to adjust it.
                            </Text>

                            <Hr />

                            <Text>
                                Warm regards,
                                <br />
                                {studio}
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
