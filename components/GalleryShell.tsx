"use client";

import { useEffect, useRef, useState } from "react";
import type { Artwork } from "@/lib/gallery/artworks";
import { SCROLL_SPACER_VH } from "@/lib/gallery/constants";
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

export default function GalleryShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<GalleryExperience | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!supportsWebGL2()) {
      setWebgl(false);
      return;
    }
    setWebgl(true);
  }, []);

  useEffect(() => {
    if (!webgl || !canvasRef.current || !spacerRef.current) return;

    let disposed = false;
    let experience: GalleryExperience | null = null;

    // Dynamic import keeps Three.js/GSAP out of the initial bundle and away
    // from any server-side evaluation.
    import("@/lib/gallery/experience").then(({ createGalleryExperience }) => {
      if (disposed || !canvasRef.current || !spacerRef.current) return;
      experience = createGalleryExperience(
        canvasRef.current,
        spacerRef.current,
        {
          onArtworkSelected: setSelected,
          onProgress: setProgress,
        },
      );
      experienceRef.current = experience;
    });

    return () => {
      disposed = true;
      experience?.dispose();
      experienceRef.current = null;
    };
  }, [webgl]);

  if (webgl === false) {
    return <FallbackGallery />;
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
      <div ref={spacerRef} aria-hidden style={{ height: `${SCROLL_SPACER_VH}vh` }} />
      <OverlayUI progress={progress} detailOpen={selected !== null} />
      <DetailPanel
        artwork={selected}
        onClose={() => experienceRef.current?.closeDetail()}
      />
      {/* Screen-reader accessible version of the gallery */}
      <div className="sr-only">
        <FallbackGallery />
      </div>
    </>
  );
}
