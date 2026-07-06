import GalleryShell from "@/components/GalleryShell";
import { getGalleryData } from "@/lib/cms/getGalleryData";

// Safety net: revalidate hourly. Content edits go live faster via the
// revalidatePath('/') hooks in lib/cms/hooks/revalidateGallery.ts.
export const revalidate = 3600;

export default async function Home() {
  const data = await getGalleryData();
  return <GalleryShell data={data} />;
}
