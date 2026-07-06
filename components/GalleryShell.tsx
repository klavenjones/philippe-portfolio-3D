"use client";

import { useEffect, useRef, useState } from "react";
import type { Artwork, GalleryData } from "@/lib/gallery/artworks";
import type { GalleryExperience } from "@/lib/gallery/experience";
import DetailPanel from "./DetailPanel";
import FallbackGallery from "./FallbackGallery";
import OverlayUI from "./OverlayUI";

const supportsWebGL2 = () => {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
};

export default function GalleryShell({ data }: { data: GalleryData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<GalleryExperience | null>(null);
  const [fallback, setFallback] = useState(false);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let disposed = false;
    let experience: GalleryExperience | null = null;

    // Dynamic import keeps Three.js/GSAP out of the initial bundle and away
    // from any server-side evaluation.
    import("@/lib/gallery/experience").then(({ createGalleryExperience }) => {
      if (disposed || !canvasRef.current || !spacerRef.current) return;
      if (!supportsWebGL2()) {
        setFallback(true);
        return;
      }
      experience = createGalleryExperience(
        canvasRef.current,
        spacerRef.current,
        {
          onArtworkSelected: setSelected,
          onProgress: setProgress,
        },
        data,
      );
      experienceRef.current = experience;
    });

    return () => {
      disposed = true;
      experience?.dispose();
      experienceRef.current = null;
    };
  }, [data]);

  if (fallback) {
    return <FallbackGallery artworks={data.artworks} settings={data.settings} />;
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <canvas
          ref={canvasRef}
          aria-hidden
          className="block h-full w-full"
          style={{ touchAction: "pan-y" }}
        />
      </div>
      <div
        ref={spacerRef}
        aria-hidden
        style={{ height: `${data.layout.spacerVh}vh` }}
      />
      <OverlayUI
        artistName={data.settings.artistName}
        contactEmail={data.settings.contactEmail}
        progress={progress}
        detailOpen={selected !== null}
      />
      <DetailPanel
        artwork={selected}
        onClose={() => experienceRef.current?.closeDetail()}
      />
      {/* Screen-reader accessible version of the gallery */}
      <div className="sr-only">
        <FallbackGallery artworks={data.artworks} settings={data.settings} />
      </div>
    </>
  );
}
