/**
 * /api/diagnose/feedback — Diagnosis Feedback Endpoint
 *
 * Accepts user feedback on diagnosis accuracy.
 * Stores feedback for model improvement and quality tracking.
 */

import { NextRequest, NextResponse } from "next/server";

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

    // Log feedback (in production, save to database)
    console.warn("[DIAGNOSIS FEEDBACK]", {
      session_id,
      crop,
      disease_name,
      approved,
      user_comment: user_comment || "",
      correct_diagnosis: correct_diagnosis || "",
      timestamp: new Date().toISOString(),
    });

    // In a production system, this would save to Turso/Supabase
    // For now, we acknowledge the feedback
    return NextResponse.json({
      ok: true,
      message: approved ? "ধন্যবাদ! আপনার মতামত গ্রহণ করা হয়েছে।" : "ধন্যবাদ! আপনার সংশোধন সিস্টেম উন্নত করতে সাহায্য করবে।",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Feedback submission failed";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
