import { NextRequest, NextResponse } from "next/server";
import { updateFindingReview } from "@/lib/services/review";
import { sanitizeErrorMessage } from "@/lib/security/sanitize";
import { z } from "zod";

const FindingIdSchema = z.string().uuid({ message: "Finding ID must be a valid UUID." });

const ReviewActionBodySchema = z.object({
  action: z.enum(["approve", "reject", "edit", "reset"], {
    message: "Action must be one of: approve, reject, edit, reset.",
  }),
  correctedValue: z.string().nullable().optional(),
  correctedResponsibleParty: z.string().nullable().optional(),
  correctedDeadlineDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format." })
    .nullable()
    .optional(),
  confirmedUnverified: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Validate ID format
    const idValidation = FindingIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: idValidation.error.issues[0]?.message || "Invalid UUID." },
        { status: 400 }
      );
    }

    // 2. Parse and validate JSON body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const bodyValidation = ReviewActionBodySchema.safeParse(rawBody);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { success: false, error: bodyValidation.error.issues[0]?.message || "Invalid input parameters." },
        { status: 400 }
      );
    }

    const result = await updateFindingReview(id, bodyValidation.data);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Review update failed.";
    // If it's a domain/validation error throw by review logic, preserve clean message
    if (rawMessage.includes("unverified quote") || rawMessage.includes("not found")) {
      return NextResponse.json({ success: false, error: rawMessage }, { status: 400 });
    }
    // Never leak raw SQL or database queries to client
    const safeMessage = sanitizeErrorMessage(rawMessage);
    const clientMessage = safeMessage.includes("syntax") || safeMessage.includes("query") || safeMessage.includes("column")
      ? "Database operation failed. Please verify your inputs."
      : safeMessage;

    return NextResponse.json({ success: false, error: clientMessage }, { status: 400 });
  }
}
