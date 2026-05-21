import { useState } from "react";
import styles from "./PermissionGate.module.css";

const PERMISSIONS = [
  {
    key: "geolocation",
    icon: "📍",
    label: "অবস্থান",
    desc: "আবহাওয়া ও কৃষি মানচিত্রের জন্য আপনার অবস্থান প্রয়োজন",
    request: async () => {
      const p = await navigator.permissions.query({ name: "geolocation" });
      if (p.state === "granted") return true;
      return new Promise<boolean>((res) => {
        navigator.geolocation.getCurrentPosition(
          () => res(true),
          () => res(false),
          { timeout: 5000 }
        );
      });
    },
  },
  {
    key: "camera",
    icon: "📷",
    label: "ক্যামেরা ও গ্যালারি",
    desc: "ফসলের ছবি তুলে রোগ শনাক্ত করতে ক্যামেরা প্রয়োজন",
    request: async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach((t) => t.stop());
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    key: "tts",
    icon: "🔊",
    label: "টেক্সট টু স্পিচ",
    desc: "পরামর্শ ও তথ্য শোনার জন্য টেক্সট টু স্পিচ ব্যবহার করুন",
    request: async () => {
      if ("speechSynthesis" in window) {
        return new Promise<boolean>((res) => {
          const u = new SpeechSynthesisUtterance("test");
          u.onstart = () => { window.speechSynthesis.cancel(); res(true); };
          u.onerror = () => res(false);
          window.speechSynthesis.speak(u);
          setTimeout(() => res(false), 3000);
        });
      }
      return false;
    },
  },
];

export default function PermissionGate() {
  const [results, setResults] = useState<Record<string, "idle" | "granted" | "denied">>(() =>
    Object.fromEntries(PERMISSIONS.map((p) => [p.key, "idle"]))
  );
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("krishi_perm_dismissed") === "true");

  const requestOne = async (key: string) => {
    const perm = PERMISSIONS.find((p) => p.key === key);
    if (!perm) return;
    setResults((r) => ({ ...r, [key]: "idle" }));
    const ok = await perm.request();
    setResults((r) => ({ ...r, [key]: ok ? "granted" : "denied" }));
  };

  const requestAll = async () => {
    for (const p of PERMISSIONS) await requestOne(p.key);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("krishi_perm_dismissed", "true");
  };

  if (dismissed) return null;
  if (Object.values(results).every((r) => r === "granted")) return null;

  const anyDenied = Object.values(results).some((r) => r === "denied");

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>🔐</span>
        <span className={styles.headTitle}>প্রয়োজনীয় অনুমতি</span>
        {anyDenied && <span className={styles.warn}>কিছু অনুমতি দেওা হয়নি</span>}
      </div>
      <div className={styles.list}>
        {PERMISSIONS.map((p) => {
          const st = results[p.key];
          return (
            <div key={p.key} className={styles.item}>
              <div className={styles.itemLeft}>
                <span className={styles.itemIcon}>{p.icon}</span>
                <div>
                  <div className={styles.itemLabel}>{p.label}</div>
                  <div className={styles.itemDesc}>{p.desc}</div>
                </div>
              </div>
              <button
                className={`${styles.itemBtn} ${
                  st === "granted" ? styles.itemBtnGranted : st === "denied" ? styles.itemBtnDenied : ""
                }`}
                onClick={() => requestOne(p.key)}
                disabled={st === "granted"}
              >
                {st === "granted" ? "✅" : st === "denied" ? "পুনরায়" : "অনুমতি দিন"}
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.foot}>
        <button className={styles.allowAll} onClick={requestAll}>সব অনুমতি দিন</button>
        <button className={styles.skipBtn} onClick={handleDismiss}>বাদ দিন</button>
      </div>
    </div>
  );
}
