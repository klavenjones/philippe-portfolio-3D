# Color Picker for frameColor in the Artworks Admin

## Context

The `frameColor` field on the Artworks collection is a plain hex text input (`lib/cms/collections/Artworks.ts`), which is awkward for a non-technical artist. Payload 3 supports custom admin field components, so we'll render it as a native color picker while keeping the underlying field a plain text/hex value — no schema or migration changes, no impact on the site's rendering path (`mapArtworks.ts` keeps reading a hex string).

## Design

**New file: `lib/cms/components/ColorPickerField.tsx`** — a `"use client"` component using `useField<string>` from `@payloadcms/ui` (verified exported by the installed 3.85.2), typed with `TextFieldClientProps` from `payload`. UI:

- A native `<input type="color">` swatch (instant visual picking) side by side with a small hex text input (for pasting exact values), both bound to the same field value.
- Because empty = "use the category default" (black for drawings, walnut for paintings) and `<input type="color">` can't be empty, include a **"Use default" clear button** shown when a value is set; when the field is empty the swatch shows the category default hint from the existing description text.
- Render the field label + existing description via `FieldLabel`/`FieldDescription` from `@payloadcms/ui` so it looks native in the sidebar.
- Keep it dependency-free (no react-colorful etc.) — the native picker is sufficient.

**Modify `lib/cms/collections/Artworks.ts`** — on the `frameColor` field add:
```ts
admin: {
  position: "sidebar",
  components: { Field: "/lib/cms/components/ColorPickerField#ColorPickerField" },
  description: … (unchanged)
}
```
Path is resolved against `admin.importMap.baseDir` (already set to project root in `payload.config.ts`). Keep the existing hex `validate` as the server-side guard.

**Regenerate the import map**: `pnpm generate:importmap` (updates `app/(payload)/admin/importMap.js` — same generated-file pattern already in place). No type changes (`payload-types.ts` unaffected; field is still `text`).

## Files

- `lib/cms/components/ColorPickerField.tsx` (new)
- `lib/cms/collections/Artworks.ts` (one field's `admin.components`)
- `app/(payload)/admin/importMap.js` (regenerated)

## Verification

1. `pnpm dev` → log into local admin (`dev@localhost.test` / `dev-password-123`) → open any artwork → sidebar shows the color swatch + hex input; pick a color → Save → value persists as `#rrggbb`; Clear button empties it back to default.
2. Confirm the site reflects a changed frame color locally (edit a drawing's frame to e.g. red, reload `/`, check the 3D frame).
3. `pnpm lint` + `pnpm build` pass.
4. Commit, push → Vercel auto-deploys; spot-check the picker on production `/admin` and revert any test color.

## Notes

- No DB migration needed (field type unchanged).
- The site's default-color logic in `lib/cms/mapArtworks.ts` (`DEFAULT_FRAME_COLOR`) is untouched.
