import {
  CATEGORY_LABELS,
  type Artwork,
  type Category,
  type GallerySettings,
} from "@/lib/gallery/artworks";

const ORDER: Category[] = ["oils", "food-and-shoes", "drawings"];

/**
 * Plain HTML version of the gallery — shown when WebGL is unavailable and
 * always rendered sr-only for screen readers.
 */
export default function FallbackGallery({
  artworks,
  settings,
}: {
  artworks: Artwork[];
  settings: GallerySettings;
}) {
  const portrait = artworks.find((a) => a.category === "intro");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-12">
        <h1 className="font-serif text-3xl uppercase tracking-widest">
          {settings.artistName}
        </h1>
        {portrait && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait.src}
            alt={`${portrait.title} — self portrait of ${settings.artistName}`}
            width={portrait.px[0]}
            height={portrait.px[1]}
            className="mt-6 max-w-xs"
          />
        )}
        <p className="mt-6 max-w-prose text-neutral-700">{settings.bioText}</p>
      </header>

      {ORDER.filter((category) => artworks.some((a) => a.category === category)).map(
        (category) => (
          <section key={category} className="mb-12" aria-label={CATEGORY_LABELS[category]}>
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {artworks
                .filter((a) => a.category === category)
                .map((a) => (
                  <li key={a.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.src}
                      alt={`${a.title}, ${a.year}, ${a.medium}`}
                      width={a.px[0]}
                      height={a.px[1]}
                      loading="lazy"
                      className="w-full"
                    />
                    <p className="mt-2 text-sm text-neutral-700">
                      {a.title}, {a.year} — {a.medium}
                    </p>
                  </li>
                ))}
            </ul>
          </section>
        ),
      )}

      <footer>
        <h2 className="font-serif text-xl">Contact</h2>
        <a href={`mailto:${settings.contactEmail}`} className="mt-2 block underline">
          {settings.contactEmail}
        </a>
      </footer>
    </main>
  );
}
