export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-2">ইন্টারনেট সংযোগ নেই</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন। সংযোগ ফিরে এলে আবার চেষ্টা করুন।
      </p>

      <div className="bg-muted rounded-xl p-6 w-full max-w-sm text-left space-y-3">
        <h2 className="font-semibold text-sm">অফলাইনে যা করতে পারেন:</h2>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>পূর্বে দেখা পৃষ্ঠাগুলো ব্রাউজ করুন (ক্যাশে থেকে)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>সংরক্ষিত কৃষি তথ্য ও টিপস দেখুন</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>DAE হটলাইনে কল করুন: ১৬১২৩</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 bg-muted rounded-xl p-4 w-full max-w-sm text-sm text-muted-foreground">
        <p>কানেক্টেড হলে নিচের পৃষ্ঠাগুলো ব্রাউজ করা যাবে:</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          <a href="/" className="text-xs font-semibold text-primary underline underline-offset-2">হোম</a>
          <a href="/tools" className="text-xs font-semibold text-primary underline underline-offset-2">টুলস</a>
          <a href="/learn" className="text-xs font-semibold text-primary underline underline-offset-2">শিক্ষা</a>
          <a href="/profile" className="text-xs font-semibold text-primary underline underline-offset-2">প্রোফাইল</a>
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}
