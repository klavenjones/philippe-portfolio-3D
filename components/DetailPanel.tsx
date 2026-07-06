"use client";

import { useEffect, useRef } from "react";
import { CATEGORY_LABELS, type Artwork } from "@/lib/gallery/artworks";

export default function DetailPanel({
  artwork,
  onClose,
}: {
  artwork: Artwork | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (artwork) closeRef.current?.focus();
  }, [artwork]);

  if (!artwork) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${artwork.title}, ${artwork.year}`}
      className="fixed inset-0 z-20"
    >
      {/* Click-outside backdrop (transparent — the 3D close-up is the backdrop) */}
      <button
        aria-label="Close artwork details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />

      <aside className="absolute bottom-0 left-0 right-0 bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:bottom-auto sm:left-auto sm:right-8 sm:top-1/2 sm:w-80 sm:-translate-y-1/2 sm:rounded-lg sm:p-8">
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          ✕
        </button>

        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-neutral-400">
          {CATEGORY_LABELS[artwork.category]}
        </p>
        <h2 className="mt-2 font-serif text-2xl text-neutral-900">
          {artwork.title}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{artwork.year}</p>
        <p className="mt-4 text-sm italic text-neutral-500">{artwork.medium}</p>
        {artwork.dimensions && (
          <p className="mt-1 text-sm text-neutral-400">{artwork.dimensions}</p>
        )}
      </aside>
    </div>
  );
}
