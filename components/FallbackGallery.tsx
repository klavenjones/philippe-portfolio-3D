import {
  ARTIST_NAME,
  ARTWORKS,
  BIO_TEXT,
  CATEGORY_LABELS,
  CONTACT_EMAIL,
  type Category,
} from "@/lib/gallery/artworks";

const ORDER: Category[] = ["oils", "food-and-shoes", "drawings"];

/**
 * Plain HTML version of the gallery — shown when WebGL is unavailable and
 * always rendered sr-only for screen readers.
 */
export default function FallbackGallery() {
  const portrait = ARTWORKS.find((a) => a.category === "intro");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-12">
        <h1 className="font-serif text-3xl uppercase tracking-widest">
          {ARTIST_NAME}
        </h1>
        {portrait && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait.src}
            alt={`${portrait.title} — self portrait of ${ARTIST_NAME}`}
            width={portrait.px[0]}
            height={portrait.px[1]}
            className="mt-6 max-w-xs"
          />
        )}
        <p className="mt-6 max-w-prose text-neutral-700">{BIO_TEXT}</p>
      </header>

      {ORDER.map((category) => (
        <section key={category} className="mb-12">
          {/* <h2 className="mb-6 font-serif text-xl">{CATEGORY_LABELS[category]}</h2> */}
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {ARTWORKS.filter((a) => a.category === category).map((a) => (
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
      ))}

      <footer>
        <h2 className="font-serif text-xl">Contact</h2>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 block underline">
          {CONTACT_EMAIL}
        </a>
      </footer>
    </main>
  );
}
