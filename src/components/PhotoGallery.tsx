/**
 * PhotoGallery.tsx — Horizontal scroll photo gallery for KrishiAI
 *
 * Shows 6 agricultural images with lightbox on click.
 */

"use client";

import { useState } from "react";
import Image from "next/image";

const PHOTOS = [
  {
    url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80",
    cap: "ধান ক্ষেত — বাংলাদেশ",
  },
  {
    url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80",
    cap: "কৃষক ও ফসল",
  },
  {
    url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80",
    cap: "সবজি চাষ",
  },
  {
    url: "https://images.unsplash.com/photo-1464226184884-fa-f280b87c399?w=400&q=80",
    cap: "গ্রামীণ কৃষি",
  },
  {
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
    cap: "ফলের বাগান",
  },
  {
    url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&q=80",
    cap: "গম ক্ষেত",
  },
];

export default function PhotoGallery() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Scroll container */}
      <div className="scroll-x pb-2">
        {PHOTOS.map((p, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[240px] rounded-xl overflow-hidden cursor-pointer shadow-md hover:scale-[1.03] transition-transform scroll-snap-align-start"
            onClick={() => setActive(i)}
          >
            <div className="relative w-[160px] sm:w-[200px] lg:w-[240px] h-[110px] sm:h-[130px] lg:h-[150px]">
              <Image
                src={p.url}
                alt={p.cap}
                fill
                className="object-cover"
                sizes="240px"
                loading="lazy"
                unoptimized
              />
            </div>
            <div className="bg-[#1b4332] text-white text-[10px] py-1.5 px-2 font-medium leading-tight">
              {p.cap}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="gallery-lightbox"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 right-4 bg-white/15 border-none text-white w-9 h-9 rounded-full text-lg cursor-pointer"
            onClick={() => setActive(null)}
          >
            ✕
          </button>
          <img
            src={PHOTOS[active].url.replace("w=400", "w=800")}
            alt={PHOTOS[active].cap}
            className="max-w-full max-h-[70vh] rounded-xl object-contain"
          />
          <div className="text-white/80 text-[13px] mt-3 text-center">
            {PHOTOS[active].cap}
          </div>
          <div className="flex items-center gap-5 mt-3 text-white">
            <button
              className="bg-white/15 border-none text-white w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setActive((active - 1 + PHOTOS.length) % PHOTOS.length);
              }}
            >
              ‹
            </button>
            <span className="text-[13px] text-white/60">
              {active + 1} / {PHOTOS.length}
            </span>
            <button
              className="bg-white/15 border-none text-white w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setActive((active + 1) % PHOTOS.length);
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
