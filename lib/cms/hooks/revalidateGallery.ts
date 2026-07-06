import { revalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";

// NOTE: this Next.js version requires a second argument on revalidateTag,
// so we deliberately use revalidatePath instead.
const revalidate = (context: Record<string, unknown> | undefined) => {
  if (!context?.disableRevalidate) revalidatePath("/");
};

export const revalidateGallery: CollectionAfterChangeHook & GlobalAfterChangeHook = ({
  doc,
  req,
}) => {
  revalidate(req.context);
  return doc;
};

export const revalidateGalleryAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidate(req.context);
  return doc;
};
