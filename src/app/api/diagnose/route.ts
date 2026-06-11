import { NextRequest, NextResponse } from "next/server";
import { diagnoseOffline } from "@/lib/diagnosticEngine";

const REQUEST_TIMEOUT_MS = 25000;

// System Prompt for CABI Plantwise diagnosis
const SYSTEM_PROMPT = `
You are an expert crop disease and pest diagnostic AI for Bangladesh, trained strictly on the CABI Plantwise methodology.
Follow the CABI Exclusion Gates protocol:
1. Abiotic vs Biotic gate (Symmetry, pattern, presence of signs like frass, webbing, ooze).
2. Symmetrical leaf spots/yellowing suggest nutrient deficiency, not biotic pathogens.
3. Exclude insect, virus, bacteria sequentially (bacterial streaming test, water-soaked margins, fungal fruiting bodies).
4. Run Disease Triangle evaluation.
Provide advice conforming to local DAE/BRRI/BARI approved pesticide labels.
Use the mandatory Bengali output format followed by English translation.
Ensure the JSON block is included at the end.
`;

function extractPlainUserText(messages: any[]): string {
  return messages
    .flatMap((m) => {
      if (!Array.isArray(m.content)) return typeof m.content === "string" ? [m.content] : [];
      return m.content.filter((b: any) => b.type === "text" && b.text).map((b: any) => b.text);
    })
    .join("\n");
}

function extractStructuredJson(text: string) {
  try {
    const marker = "---JSON_SUMMARY---";
    const endMarker = "---END_JSON---";
    const startIdx = text.indexOf(marker);
    const endIdx = text.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
    const jsonStr = text.slice(startIdx + marker.length, endIdx).trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function stripStructuredJson(text: string) {
  const marker = "---JSON_SUMMARY---";
  const endMarker = "---END_JSON---";
  const startIdx = text.indexOf(marker);
  const endIdx = text.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return text;
  return text.slice(0, startIdx).trim() + text.slice(endIdx + endMarker.length).trim();
}

// ─── 1. Google Gemini 2.5 Flash ──────────────────────────────────────────
async function tryGemini(messages: any[], withVision: boolean) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const lastMsg = messages[messages.length - 1];
  const content = Array.isArray(lastMsg.content)
    ? lastMsg.content
    : [{ type: "text", text: lastMsg.content }];

  const parts = [];
  for (const block of content) {
    if (block.type === "image" && block.source?.type === "base64" && withVision) {
      parts.push({
        inlineData: {
          mimeType: block.source.media_type || "image/jpeg",
          data: block.source.data,
        },
      });
    } else if (block.type === "text") {
      parts.push({ text: block.text });
    }
  }

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: 2500, temperature: 0.3 },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);

  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n") || "No response.";
  return { text, provider: withVision ? "Google Gemini 2.5 Flash 👁️" : "Google Gemini 2.5 Flash (text)" };
}

// ─── 2. OpenRouter Qwen-VL Free ───────────────────────────────────────────
async function tryOpenRouter(messages: any[], modelId: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  // Format messages to OpenAI style
  const formattedMessages = messages.map((m) => {
    if (typeof m.content === "string") return { role: m.role, content: m.content };
    if (Array.isArray(m.content)) {
      return {
        role: m.role,
        content: m.content.map((b: any) => {
          if (b.type === "text") return { type: "text", text: b.text };
          if (b.type === "image" && b.source?.type === "base64") {
            return {
              type: "image_url",
              image_url: { url: `data:${b.source.media_type || "image/jpeg"};base64,${b.source.data}` },
            };
          }
          return null;
        }).filter(Boolean),
      };
    }
    return m;
  });

  const body = {
    model: modelId,
    max_tokens: 2500,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...formattedMessages],
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);

  const resolvedModel = (data?.model || modelId).split("/").pop()?.replace(":free", "") || modelId;
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: `OpenRouter / ${resolvedModel}` };
}

// ─── 3. Groq Vision ───────────────────────────────────────────────────────
async function tryGroq(messages: any[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const formattedMessages = messages.map((m) => {
    if (typeof m.content === "string") return { role: m.role, content: m.content };
    if (Array.isArray(m.content)) {
      return {
        role: m.role,
        content: m.content.map((b: any) => {
          if (b.type === "text") return { type: "text", text: b.text };
          if (b.type === "image" && b.source?.type === "base64") {
            return {
              type: "image_url",
              image_url: { url: `data:${b.source.media_type || "image/jpeg"};base64,${b.source.data}` },
            };
          }
          return null;
        }).filter(Boolean),
      };
    }
    return m;
  });

  const body = {
    model: "llama-3.2-11b-vision-preview",
    max_tokens: 2500,
    temperature: 0.3,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...formattedMessages],
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Groq HTTP ${res.status}`);
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: "Groq Llama 3.2 Vision ⚡" };
}

// ─── 4. Hugging Face Serverless VLM ──────────────────────────────────────
async function tryHuggingFace(messages: any[]) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not set");

  // Find image in messages
  const lastMsg = messages[messages.length - 1];
  const text = extractPlainUserText(messages);
  let base64Image = "";

  if (Array.isArray(lastMsg.content)) {
    const imgBlock = lastMsg.content.find((b: any) => b.type === "image");
    if (imgBlock?.source?.data) {
      base64Image = imgBlock.source.data;
    }
  }

  // Call serverless pipeline
  const body = {
    inputs: {
      image: base64Image,
      text: `${SYSTEM_PROMPT}\n\nUser Question: ${text}`,
    },
  };

  const res = await fetch(
    "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(18000),
    }
  );

  if (!res.ok) {
    throw new Error(`HuggingFace HTTP ${res.status}`);
  }

  const data = await res.json();
  return { text: data[0]?.generated_text || "No response.", provider: "Hugging Face Qwen 2.5 VL 🌟" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], crop = "", district = "" } = body;

    if (!messages.length) {
      return NextResponse.json({ ok: false, error: "Messages are required" }, { status: 400 });
    }

    const lastMsg = messages[messages.length - 1];
    let imageAttached = false;
    if (Array.isArray(lastMsg.content)) {
      imageAttached = lastMsg.content.some((b: any) => b.type === "image");
    }

    const attempts: string[] = [];

    // Helper timeout wrapper
    const withTimeout = async (promise: Promise<any>, label: string) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_TIMEOUT_MS)),
      ]);
    };

    // ─── 1. Gemini 2.5 Flash ───
    if (process.env.GEMINI_API_KEY) {
      try {
        const r = await withTimeout(tryGemini(messages, imageAttached), "Gemini");
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({ ok: true, text: cleanText, structured, provider: r.provider, attempts });
      } catch (e: any) {
        attempts.push(`Gemini: ${e.message}`);
      }
    }

    // ─── 2. OpenRouter Qwen-VL Free ───
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const r = await withTimeout(
          tryOpenRouter(messages, "qwen/qwen2.5-vl-72b-instruct:free"),
          "OpenRouter Qwen"
        );
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({ ok: true, text: cleanText, structured, provider: r.provider, attempts });
      } catch (e: any) {
        attempts.push(`OpenRouter Qwen: ${e.message}`);
      }
    }

    // ─── 3. Groq Llama 3.2 Vision ───
    if (process.env.GROQ_API_KEY) {
      try {
        const r = await withTimeout(tryGroq(messages), "Groq");
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({ ok: true, text: cleanText, structured, provider: r.provider, attempts });
      } catch (e: any) {
        attempts.push(`Groq: ${e.message}`);
      }
    }

    // ─── 4. HuggingFace Qwen 2.5 VL ───
    if (process.env.HUGGINGFACE_API_KEY && imageAttached) {
      try {
        const r = await withTimeout(tryHuggingFace(messages), "HuggingFace");
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({ ok: true, text: cleanText, structured, provider: r.provider, attempts });
      } catch (e: any) {
        attempts.push(`HuggingFace: ${e.message}`);
      }
    }

    // ─── 5. Offline fallback matching engine on Server ───
    const plainText = extractPlainUserText(messages);
    const offlineResult = diagnoseOffline({
      symptoms: { main: plainText },
      crop,
      hostInfo: { variety: "" },
      pathogenInfo: { season: "Boro" },
    });

    const fallbackResponse = `
=== ধানের ব্লাস্ট ও অন্যান্য বালাই বিকল্প জরুরি ও অফলাইন বিশ্লেষণ ===
**অফলাইন মোড অ্যাক্টিভেটেড (কারণ: সব এপিআই কি কোটা শেষ বা সার্ভার ডাউন)**

**চিহ্নিত প্রাথমিক সন্দেহ:** ${offlineResult.primarySuspect}
**আস্থার মাত্রা:** ${offlineResult.confidence}

**সুপারিশসমূহ:**
1. মাঠ থেকে আক্রান্ত অংশ তুলে পরিষ্কার করুন।
2. পাতার নিচে পোকা, জাল বা মধুরস পর্যবেক্ষণ করুন।
3. রোগ বাড়লে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।
    `;

    return NextResponse.json({
      ok: true,
      text: fallbackResponse,
      structured: {
        disease_name: offlineResult.primarySuspect,
        disease_name_bn: offlineResult.primarySuspect,
        confidence: offlineResult.confidence,
        confidence_pct: offlineResult.confidence === "high" ? 80 : 50,
        severity: "moderate",
        urgency: "within_3_days",
        ipm_recommendations: offlineResult.ipmRecommendations.cultural.map((rec: string, i: number) => ({
          priority: i + 1,
          type: "cultural",
          action_bn: rec,
          timing: "এখনই",
        })),
        key_recommendations: offlineResult.ipmRecommendations.cultural.slice(0, 3),
      },
      provider: "Server Offline Diagnostic Engine (Local)",
      attempts,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
