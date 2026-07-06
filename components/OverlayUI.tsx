"use client";

import { ARTIST_NAME, CONTACT_EMAIL } from "@/lib/gallery/artworks";

export default function OverlayUI({
  progress,
  detailOpen,
}: {
  progress: number;
  detailOpen: boolean;
}) {
  const nearEnd = progress > 0.9;
  const atStart = progress < 0.02;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* Progress bar */}
      <div
        className="absolute left-0 top-0 h-0.5 bg-neutral-900/70 transition-transform duration-150 ease-out"
        style={{
          width: "100%",
          transform: `scaleX(${progress})`,
          transformOrigin: "left center",
        }}
      />

      {/* Artist name */}
      <header className="absolute left-6 top-5">
        <h1 className="font-serif text-sm uppercase tracking-[0.3em] text-neutral-800">
          {ARTIST_NAME}
        </h1>
      </header>

      {/* Scroll hint */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-center transition-opacity duration-700 ${
          atStart && !detailOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
          Scroll to walk through the gallery
        </p>
        <p className="mt-1 animate-bounce text-neutral-400">↓</p>
      </div>

      {/* Contact link, fades in near the end wall */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-700 ${
          nearEnd && !detailOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="pointer-events-auto rounded-full border border-neutral-800 px-6 py-2 text-xs uppercase tracking-[0.25em] text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          Get in touch
        </a>
      </div>
    </div>
  );
}
