import { useState, useRef } from "react";
import { analyzeImage, buildAgriPrompt } from "@/services/aiService";
import styles from "./Analyzer.module.css";

interface Result {
  text: string;
  model: string;
}

const PROMPT_TEMPLATE = `এই ফসলের ছবিটি বিশ্লেষণ করুন এবং নিম্নলিখিত তথ্য দিন:
১. রোগ/সমস্যার নাম (বাংলা ও ইংরেজিতে)
২. রোগের কারণ
৩. ক্ষতির মাত্রা (স্বল্প/মধ্যম/তীব্র)
৪. তাৎক্ষণিক প্রতিকার
৫. দীর্ঘমেয়াদি ব্যবস্থাপনা
BRRI/BARI/DAE নির্দেশিকা অনুযায়ী উত্তর দিন।`;

export default function Analyzer() {
  const [image, setImage]       = useState<string | null>(null);
  const [mime, setMime]         = useState("image/jpeg");
  const [result, setResult]     = useState<Result | null>(null);
  const [loading, setLoading]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setMime(file.type);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image || loading) return;
    setLoading(true);
    setResult(null);
    const prompt = buildAgriPrompt(PROMPT_TEMPLATE);
    const res    = await analyzeImage(prompt, image, mime);
    setResult({ text: res.text, model: res.model });
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span>🔬</span>
          <div>
            <div className={styles.title}>ফসল রোগ বিশ্লেষণ</div>
            <div className={styles.sub}>ছবি আপলোড করুন — AI রোগ চিহ্নিত করবে</div>
          </div>
        </div>

        {/* upload zone */}
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${image ? styles.hasImage : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !image && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
          />
          {image ? (
            <img src={image} alt="uploaded crop" className={styles.preview} />
          ) : (
            <div className={styles.dropPrompt}>
              <span className={styles.dropIcon}>📷</span>
              <p className={styles.dropTitle}>ছবি টেনে আনুন বা ক্লিক করুন</p>
              <p className={styles.dropSub}>JPG, PNG, WEBP সমর্থিত · মোবাইলে ক্যামেরা খুলবে</p>
            </div>
          )}
        </div>

        {/* actions */}
        {image && (
          <div className={styles.actions}>
            <button
              className={styles.btnAnalyze}
              onClick={analyze}
              disabled={loading}
            >
              {loading ? "🔍 বিশ্লেষণ হচ্ছে…" : "🔬 বিশ্লেষণ করুন"}
            </button>
            <button
              className={styles.btnClear}
              onClick={() => { setImage(null); setResult(null); }}
            >
              ✕ মুছুন
            </button>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className={styles.loadingCard}>
            <div className="pulse">🌱 AI ছবি বিশ্লেষণ করছে…</div>
            <div className={styles.loadingBar}><div className={styles.loadingFill} /></div>
          </div>
        )}

        {/* result */}
        {result && !loading && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <span>🤖</span>
              <span>বিশ্লেষণ ফলাফল</span>
              <span className={styles.modelBadge}>{result.model}</span>
            </div>
            <div className={styles.resultText}>{result.text}</div>
            <div className={styles.resultDisclaimer}>
              এই বিশ্লেষণ AI-জেনারেটেড। সঠিক নিশ্চিতের জন্য স্থানীয় DAE কর্মকর্তার
              সাথে যোগাযোগ করুন। হটলাইন:{" "}
              <a href="tel:16123">16123</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
