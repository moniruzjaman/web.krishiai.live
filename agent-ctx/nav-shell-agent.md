# Task: Add Navigation Shell and Route Pages to KrishiAI Next.js App

## Summary
Added complete mobile navigation shell (TopNavbar + BottomNav) and 5 route pages to the Next.js KrishiAI application, matching the original Vite app's design.

## Files Created
1. **`src/components/BottomNav.tsx`** — Sticky bottom navigation with 5 tabs (Home, Tools, Analyzer with raised center button, Learn, Profile). Uses `usePathname()` for active state detection, green (#1b8a3e) active color, gray (#9ca3af) inactive. Center button has -mt-5 raised design with green circle.

2. **`src/components/TopNavbar.tsx`** — Sticky top navbar with hamburger menu (opens sidebar), green logo with leaf SVG, share button, BN/EN language toggle, dark mode toggle, avatar with leaf badge. Includes slide-out sidebar with navigation links and overlay.

3. **`src/app/tools/page.tsx`** — Tools page with 6 tool cards (matching original TOOLS data) and ecosystem apps section. Gradient header, tool cards with category colors, badges, and ecosystem links.

4. **`src/app/analyzer/page.tsx`** — Camera/Analyzer page with photo upload, image preview, simulated analysis with loading spinner, and sample result card showing disease diagnosis with confidence and severity metrics. Includes photography tips section.

5. **`src/app/learn/page.tsx`** — Learn page with video category filters, featured video card, and tutorial list with thumbnails, durations, and view counts.

6. **`src/app/profile/page.tsx`** — Profile page with user info card, stats grid, menu items (profile, activity, saved, notifications, help, settings), logout button, and version info.

7. **`src/app/chat/page.tsx`** — AI chat interface with message bubbles, typing indicator, suggestion chips, and text input. Simulated AI response with delay.

## Files Modified
1. **`src/app/layout.tsx`** — Added TopNavbar and BottomNav imports, wrapped children in mobile shell div with max-width constraints (768px/900px/1024px responsive), added pb-16 for bottom nav clearance.

2. **`src/app/page.tsx`** — Removed CTA Banner section and Footer section (since nav shell handles navigation). Kept Hero, Stats, Live Dashboard, Testimonials, Metrics, and Ecosystem Tools sections.

## Build Status
✅ `npx next build` passes successfully — all 7 static pages generated:
- `/` (Home)
- `/analyzer`
- `/chat`
- `/learn`
- `/profile`
- `/tools`
- `/_not-found`

## Design Notes
- All components use `"use client"` directive for interactivity
- Bengali text throughout matching original app
- Green theme: #1b8a3e (primary), #1b4332 (dark green)
- Mobile-first responsive design with centered max-width shell
- Smooth transitions on nav items and sidebar
- Center camera button elevated with margin-top: -20px
