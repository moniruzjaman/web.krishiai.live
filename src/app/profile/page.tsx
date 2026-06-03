"use client";

const MENU_ITEMS = [
  { icon: "📝", label: "আমার প্রোফাইল", desc: "ব্যক্তিগত তথ্য সম্পাদনা" },
  { icon: "📊", label: "কার্যকলাপ", desc: "ব্যবহারের ইতিহাস ও পরিসংখ্যান" },
  { icon: "💾", label: "সংরক্ষিত", desc: "সংরক্ষিত টিপস ও নিবন্ধ" },
  { icon: "🔔", label: "বিজ্ঞপ্তি", desc: "পরামর্শ ও আপডেট" },
  { icon: "📞", label: "সাহায্য", desc: "সাপোর্ট ও FAQ" },
  { icon: "⚙️", label: "সেটিংস", desc: "অ্যাপ সেটিংস ও পছন্দ" },
];

export default function ProfilePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-10"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          KRISHI AI
        </div>
        <h1 className="text-[22px] font-bold text-white mb-4">
          👤 প্রোফাইল
        </h1>

        {/* User info card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1b8a3e] flex items-center justify-center text-2xl font-bold text-white shrink-0">
            ক
          </div>
          <div>
            <div className="text-base font-bold text-white">কৃষক ভাই</div>
            <div className="text-[11px] text-white/70">কৃষি AI ব্যবহারকারী</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-[10px] text-white/60">সক্রিয়</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: "২৫", label: "পরামর্শ", icon: "💬" },
            { value: "১২", label: "বিশ্লেষণ", icon: "🔬" },
            { value: "৮", label: "সংরক্ষিত", icon: "💾" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
            >
              <div className="text-lg mb-0.5">{stat.icon}</div>
              <div className="text-lg font-extrabold text-[#1b4332]">
                {stat.value}
              </div>
              <div className="text-[10px] text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Menu items */}
        <div className="flex flex-col gap-2">
          {MENU_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-green-50/30 transition-colors cursor-pointer card-shadow"
            >
              <div className="text-2xl">{item.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">
                  {item.label}
                </div>
                <div className="text-[11px] text-gray-500">{item.desc}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button className="mt-6 w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
          লগআউট
        </button>

        {/* Version info */}
        <div className="text-center mt-4 text-[10px] text-gray-400">
          কৃষি AI v2.0 · © ২০২৫
        </div>
      </div>
    </div>
  );
}
