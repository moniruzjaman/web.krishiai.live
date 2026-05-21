import { useState, useEffect } from "react";
import styles from "./PwaInstall.module.css";

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed || !deferredPrompt) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>📲</div>
        <div>
          <div className={styles.title}>অ্যাপ হিসেবে ইনস্টল করুন</div>
          <div className={styles.desc}>সুবিধাজনক অভিজ্ঞতার জন্য হোম স্ক্রিনে যোগ করুন</div>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.installBtn} onClick={handleInstall}>ইনস্টল</button>
        <button className={styles.dismissBtn} onClick={() => setDeferredPrompt(null)}>বাদ দিন</button>
      </div>
    </div>
  );
}
