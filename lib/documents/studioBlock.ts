import type { StudioProfile } from "@/lib/studio/profile";

/**
 * The studio's identity, copied out of the profile onto a document.
 *
 * A copy, not a reference, and that is the whole point: the studio's live
 * profile will change — a new phone number, a new bank account, a rebrand. A
 * quotation sent in March must still render in October exactly as the client
 * received it, so the identity is frozen onto the document when it is created
 * rather than looked up at render time.
 *
 * One implementation for all three document kinds. It was three identical
 * copies when they were three applications, which is precisely the kind of
 * duplication that drifts: a field added to the profile reaches the invoice
 * and not the booking sheet, and nobody notices until a client asks why the
 * GSTIN is missing from one of them.
 *
 * Every document's `studio` block has the same shape, which is why this is
 * typed against the profile rather than against any one document type.
 */
export type StudioBlock = {
    profileId: string;
    brandName: string;
    legalName: string;
    tagline: string;
    logo: string;
    phone: string;
    altPhone: string;
    whatsapp: string;
    email: string;
    website: string;
    instagram: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    state: string;
    stateCode: string;
    pincode: string;
    gstin: string;
    pan: string;
    unregisteredNote: string;
    bank: StudioProfile["bank"];
    upiId: string;
    upiQr: string;
    signature: string;
    signatureFontFamily: string;
    signatoryName: string;
    signatoryDesignation: string;
    seal: string;
};

export function studioBlockFromProfile(profile: StudioProfile): StudioBlock {
    return {
        profileId: profile.id,
        brandName: profile.brandName,
        legalName: profile.legalName,
        tagline: profile.tagline,
        logo: profile.logo,
        phone: profile.phone,
        altPhone: profile.altPhone,
        whatsapp: profile.whatsapp,
        email: profile.email,
        website: profile.website,
        instagram: profile.instagram,
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2,
        city: profile.city,
        district: profile.district,
        state: profile.state,
        stateCode: profile.stateCode,
        pincode: profile.pincode,
        gstin: profile.gstin,
        pan: profile.pan,
        unregisteredNote: profile.unregisteredNote,
        bank: { ...profile.bank },
        upiId: profile.upiId,
        upiQr: profile.upiQr,
        signature: profile.signature,
        signatureFontFamily: profile.signatureFontFamily,
        signatoryName: profile.signatoryName,
        signatoryDesignation: profile.signatoryDesignation,
        seal: profile.seal,
    };
}
