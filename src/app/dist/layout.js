"use strict";
exports.__esModule = true;
exports.metadata = exports.viewport = void 0;
var google_1 = require("next/font/google");
require("./globals.css");
var sonner_1 = require("@/components/ui/sonner");
var TopNavbar_1 = require("@/components/TopNavbar");
var BottomNav_1 = require("@/components/BottomNav");
var LocationContext_1 = require("@/context/LocationContext");
var ClientShell_1 = require("@/components/ClientShell");
var notoSansBengali = google_1.Noto_Sans_Bengali({
    variable: "--font-bengali",
    subsets: ["bengali"],
    weight: ["300", "400", "500", "600", "700", "800"],
    display: "swap"
});
exports.viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: "#1b4332",
    viewportFit: "cover"
};
exports.metadata = {
    title: "KrishiAI — চাষিদের জন্য স্মার্ট ও নির্ভরযোগ্য",
    description: "বাংলাদেশের কৃষকদের জন্য তথ্য-প্রযুক্তি নির্ভর কৃষি সেবা — ফসলের রোগ চিহ্নিত করুন, সার ও বীজের পরামর্শ নিন।",
    keywords: [
        "কৃষি",
        "KrishiAI",
        "বাংলাদেশ",
        "কৃষক",
        "ফসল",
        "ধান",
        "AI",
        "কৃষি প্রযুক্তি",
    ],
    authors: [{ name: "KrishiAI Team" }],
    manifest: "/manifest.json",
    icons: {
        icon: "/icons/icon-192.png",
        apple: "/icons/icon-192.png"
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "KrishiAI"
    },
    other: {
        "mobile-web-app-capable": "yes"
    },
    openGraph: {
        title: "KrishiAI — চাষিদের জন্য স্মার্ট ও নির্ভরযোগ্য",
        description: "বাংলাদেশের কৃষকদের জন্য AI-চালিত কৃষি প্ল্যাটফর্ম",
        type: "website",
        siteName: "KrishiAI"
    }
};
function RootLayout(_a) {
    var children = _a.children;
    return (React.createElement("html", { lang: "bn", suppressHydrationWarning: true },
        React.createElement("body", { className: notoSansBengali.variable + " antialiased bg-background text-foreground", style: { fontFamily: "var(--font-bengali), sans-serif" } },
            React.createElement(LocationContext_1.LocationProvider, null,
                React.createElement("div", { className: "flex flex-col min-h-dvh mx-auto w-full max-w-[768px] md:max-w-[768px] lg:max-w-[900px] xl:max-w-[1024px] bg-white dark:bg-gray-900 relative" },
                    React.createElement(TopNavbar_1["default"], null),
                    React.createElement("main", { className: "flex-1 pb-16" }, children),
                    React.createElement(BottomNav_1["default"], null))),
            React.createElement(ClientShell_1["default"], null),
            React.createElement(sonner_1.Toaster, null))));
}
exports["default"] = RootLayout;
