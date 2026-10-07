/**
 * Indian states and union territories with their GST state codes.
 *
 * The code is the first two digits of a GSTIN, which is what decides whether a
 * supply is intra-state (CGST + SGST) or inter-state (IGST). Keeping the codes
 * here means "place of supply" can be derived from the client's GSTIN instead
 * of asked for twice and answered inconsistently.
 */

export type IndianState = {
    /** GST state code — the first two digits of every GSTIN issued there. */
    code: string;
    name: string;
};

export const INDIAN_STATES: IndianState[] = [
    { code: "01", name: "Jammu and Kashmir" },
    { code: "02", name: "Himachal Pradesh" },
    { code: "03", name: "Punjab" },
    { code: "04", name: "Chandigarh" },
    { code: "05", name: "Uttarakhand" },
    { code: "06", name: "Haryana" },
    { code: "07", name: "Delhi" },
    { code: "08", name: "Rajasthan" },
    { code: "09", name: "Uttar Pradesh" },
    { code: "10", name: "Bihar" },
    { code: "11", name: "Sikkim" },
    { code: "12", name: "Arunachal Pradesh" },
    { code: "13", name: "Nagaland" },
    { code: "14", name: "Manipur" },
    { code: "15", name: "Mizoram" },
    { code: "16", name: "Tripura" },
    { code: "17", name: "Meghalaya" },
    { code: "18", name: "Assam" },
    { code: "19", name: "West Bengal" },
    { code: "20", name: "Jharkhand" },
    { code: "21", name: "Odisha" },
    { code: "22", name: "Chhattisgarh" },
    { code: "23", name: "Madhya Pradesh" },
    { code: "24", name: "Gujarat" },
    { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
    { code: "27", name: "Maharashtra" },
    { code: "29", name: "Karnataka" },
    { code: "30", name: "Goa" },
    { code: "31", name: "Lakshadweep" },
    { code: "32", name: "Kerala" },
    { code: "33", name: "Tamil Nadu" },
    { code: "34", name: "Puducherry" },
    { code: "35", name: "Andaman and Nicobar Islands" },
    { code: "36", name: "Telangana" },
    { code: "37", name: "Andhra Pradesh" },
    { code: "38", name: "Ladakh" },
    { code: "97", name: "Other Territory" },
];

export const DEFAULT_STATE_NAME = "Tamil Nadu";
export const DEFAULT_STATE_CODE = "33";

const BY_CODE = new Map(INDIAN_STATES.map((s) => [s.code, s]));
const BY_NAME = new Map(
    INDIAN_STATES.map((s) => [s.name.toLowerCase(), s] as const)
);

export function stateByCode(code: string | undefined | null) {
    return code ? BY_CODE.get(code.trim()) : undefined;
}

export function stateByName(name: string | undefined | null) {
    return name ? BY_NAME.get(name.trim().toLowerCase()) : undefined;
}

/**
 * The 38 districts of Tamil Nadu, for the venue and client address pickers.
 *
 * A free-text district field in a studio that only ever works in one state
 * produces "Coimbatore", "coimbatore ", "CBE" and "Kovai" in the same ledger,
 * which makes the saved-client list useless for lookup.
 */
export const TAMIL_NADU_DISTRICTS = [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Kanniyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar",
] as const;
