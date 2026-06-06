/**
 * KrishiAI — Custom 404 Page (Bengali)
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
      {/* Icon */}
      <div className="text-7xl mb-4">🌿</div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b4332] dark:text-green-400 mb-2 text-center">
        পৃষ্ঠা খুঁজে পাওয়া যায়নি
      </h1>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6 leading-relaxed">
        আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই বা সরানো হয়েছে।
        অনুগ্রহ করে হোম পৃষ্ঠায় ফিরে যান।
      </p>

      {/* Home button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-sm rounded-full px-6 py-3 transition-colors shadow-lg no-underline"
      >
        🏠 হোম পৃষ্ঠায় ফিরুন
      </Link>
    </div>
  );
}
