import { readSecure, writeSecure } from "@/lib/secureStore";

import type { ClientBlockType } from "@/types";

/**
 * Saved clients, kept in the browser.
 *
 * Upstream kept two of these — a "sender" book and a "receiver" book — because
 * the studio's own details were typed onto every invoice like any other party.
 * They are now a studio profile (`lib/studio/profile.ts`), so only the client
 * side needs an address book, and the sender half is gone.
 *
 * Encrypted at rest through lib/secureStore, which is why every function here
 * is async. This is names, phone numbers, addresses and sometimes a GSTIN; see
 * that module for exactly what the encryption does and does not protect.
 *
 * Parsing is deliberately defensive: this is user data that may have been
 * written by an older version of the app, or edited by hand in devtools.
 */

const STORAGE_KEY = "studio:clients";

export type SavedClient = ClientBlockType & {
    /** Stable id, so renaming a client does not orphan the entry. */
    id: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

function newId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Accepts only entries that have the shape we can actually render. */
function normalise(entry: unknown): SavedClient | null {
    if (!isRecord(entry)) return null;

    const name = entry.name;
    if (typeof name !== "string" || name.trim().length === 0) return null;

    const str = (key: string) =>
        typeof entry[key] === "string" ? (entry[key] as string) : "";

    return {
        id: typeof entry.id === "string" && entry.id ? entry.id : newId(),
        name,
        contactPerson: str("contactPerson"),
        relationship: str("relationship"),
        phone: str("phone"),
        altPhone: str("altPhone"),
        whatsapp: str("whatsapp"),
        email: str("email"),
        addressLine1: str("addressLine1"),
        addressLine2: str("addressLine2"),
        city: str("city"),
        district: str("district"),
        state: str("state"),
        pincode: str("pincode"),
        gstin: str("gstin"),
        customInputs: Array.isArray(entry.customInputs)
            ? (entry.customInputs as SavedClient["customInputs"])
            : [],
    };
}

export async function readClients(): Promise<SavedClient[]> {
    const parsed = await readSecure<unknown>(STORAGE_KEY);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalise).filter((c): c is SavedClient => c !== null);
}

async function writeClients(clients: SavedClient[]): Promise<SavedClient[]> {
    // A false result means quota, disabled storage, or no usable key. The
    // address book is a convenience; losing a write must not interrupt the
    // quotation being worked on, so the caller gets the list either way.
    await writeSecure(STORAGE_KEY, clients);
    return clients;
}

/**
 * Saves a client, replacing any existing entry whose name and phone match.
 *
 * Matched on both rather than name alone: a studio in this market will
 * genuinely quote two unrelated families whose entry both reads "Mr. Kumar",
 * and silently merging them would hand the second family the first one's
 * address.
 */
export async function saveClient(
    client: ClientBlockType
): Promise<SavedClient[]> {
    const candidate = normalise({ ...client, id: undefined });
    if (!candidate) return readClients();

    const existing = await readClients();
    const key = (c: SavedClient) =>
        `${c.name.trim().toLowerCase()}|${c.phone.replace(/\D/g, "")}`;

    const index = existing.findIndex((entry) => key(entry) === key(candidate));

    if (index === -1) {
        return writeClients([...existing, candidate]);
    }

    const merged = [...existing];
    merged[index] = { ...candidate, id: existing[index].id };
    return writeClients(merged);
}

export async function deleteClient(id: string): Promise<SavedClient[]> {
    const remaining = (await readClients()).filter((entry) => entry.id !== id);
    return writeClients(remaining);
}
