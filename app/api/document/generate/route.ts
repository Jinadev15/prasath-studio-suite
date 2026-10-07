export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest } from "next/server";

// Services
import { generatePdfService } from "@/services/document/server/generatePdfService";

export async function POST(req: NextRequest) {
    const result = await generatePdfService(req);
    return result;
}
