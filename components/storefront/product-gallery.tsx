"use client";

import { useState } from "react";

const IMAGE_FRAME =
  "flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-neutral-100 p-3 sm:p-4";

const IMAGE_CLASS = "max-h-full max-w-full object-contain";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className={IMAGE_FRAME}>
        <div className="flex h-full w-full items-center justify-center text-neutral-400">
          Pas d&apos;image
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="min-w-0">
      <div className={IMAGE_FRAME}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={alt} className={IMAGE_CLASS} />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`btn-icon-touch flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-neutral-100 p-1 transition-colors ${
                i === active ? "border-violet-500 ring-2 ring-violet-500/30" : "border-white/10 hover:border-white/30"
              }`}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className={IMAGE_CLASS} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
