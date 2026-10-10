import { NextRequest, NextResponse } from "next/server";
import { updateFindingReview } from "@/lib/services/review";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = await updateFindingReview(id, body);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Review update failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
