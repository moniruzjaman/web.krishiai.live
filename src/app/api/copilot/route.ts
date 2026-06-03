import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages = [] } = await req.json();

    if (!messages.length) {
      return NextResponse.json({ ok: false, error: "Messages are required" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Offline rule fallback inside copilot if no API key is available
      return NextResponse.json({
        ok: true,
        text: "দুঃখিত, ইন্টারনেট বা এপিআই সংযোগ না থাকায় আমি সরাসরি উত্তর দিতে পারছি না। তবে আপনি ফসল ক্যালেন্ডার এবং লাইভ বাজার মূল্য ট্যাগগুলো দেখতে পারেন!",
      });
    }

    // Call Gemini API for chat response
    const systemInstruction = `
      You are KrishiAI Copilot, a helpful AI assistant for Bangladeshi farmers.
      You answer in warm, clear, localized Bengali.
      Help with planting seasons, weather alerts, pest guides, and fertilizer dosage.
      Keep answers concise and clear so they are easily understood when read aloud.
    `;

    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.5 },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || `Gemini Chat HTTP ${res.status}`);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "কোনো উত্তর পাওয়া যায়নি।";
    return NextResponse.json({ ok: true, text: reply });
  } catch (error: any) {
    return NextResponse.json({ ok: true, text: `দুঃখিত, উত্তর জেনারেট করতে সমস্যা হচ্ছে: ${error.message}` });
  }
}
