import { NextRequest } from "next/server";

// Services
import { exportQuotationService } from "@/services/document/server/exportQuotationService";

export async function POST(req: NextRequest) {
    const result = await exportQuotationService(req);
    return result;
}
