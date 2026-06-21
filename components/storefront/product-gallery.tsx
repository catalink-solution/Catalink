"use client";

import { useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="flex aspect-square w-full items-center justify-center text-white/20">
          Pas d&apos;image
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="aspect-square w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={alt} className="h-full w-full object-cover" />
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`btn-icon-touch h-16 w-16 overflow-hidden rounded-xl border transition-colors ${
                i === active ? "border-violet-500" : "border-white/10 hover:border-white/30"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
