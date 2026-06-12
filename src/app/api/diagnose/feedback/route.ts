/**
 * /api/diagnose/feedback — Diagnosis Feedback Endpoint
 *
 * Accepts user feedback on diagnosis accuracy.
 * Saves feedback to Turso DB for model improvement and quality tracking.
 * Falls back to console logging if Turso is not configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { saveDiagnosisFeedback, hasTurso } from "@/lib/turso";

// ─── Vercel Function Config ──────────────────────────────────────────────────
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, crop, disease_name, approved, user_comment, correct_diagnosis } = body;

    if (!session_id) {
      return NextResponse.json(
        { ok: false, error: "session_id is required" },
        { status: 400 }
      );
    }

    // Save to Turso DB if configured
    if (hasTurso()) {
      try {
        await saveDiagnosisFeedback({
          session_id,
          crop: crop || "unknown",
          disease_name,
          approved: !!approved,
          user_comment,
          correct_diagnosis,
        });
      } catch (dbErr: any) {
        console.error("Turso feedback save error:", dbErr?.message || dbErr);
        // Continue — don't fail the request if DB write fails
      }
    }

    // Always log feedback for debugging
    console.log("[DIAGNOSIS FEEDBACK]", {
      session_id,
      crop,
      disease_name,
      approved,
      user_comment: user_comment || "",
      correct_diagnosis: correct_diagnosis || "",
      turso_saved: hasTurso(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: approved
        ? "ধন্যবাদ! আপনার মতামত গ্রহণ করা হয়েছে।"
        : "ধন্যবাদ! আপনার সংশোধন সিস্টেম উন্নত করতে সাহায্য করবে।",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Feedback submission failed";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
