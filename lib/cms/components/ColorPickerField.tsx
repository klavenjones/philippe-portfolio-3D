"use client";

import type { TextFieldClientProps } from "payload";
import { FieldDescription, FieldLabel, useField } from "@payloadcms/ui";
import React from "react";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Color picker for the frameColor field. Empty value = category default
 * (black for drawings, walnut for paintings), so the picker pairs a swatch
 * with a hex input and a "Use default" clear button.
 */
export function ColorPickerField(props: TextFieldClientProps) {
  const { field, path } = props;
  const { setValue, value } = useField<string>({ path });

  const hex = typeof value === "string" && HEX_COLOR.test(value) ? value : "";

  const description =
    typeof field.admin?.description === "string"
      ? field.admin.description
      : undefined;

  return (
    <div className="field-type text" style={{ marginBottom: "1.5rem" }}>
      <FieldLabel label={field.label ?? field.name} path={path} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="color"
          aria-label="Pick frame color"
          value={hex || "#3d2b1f"}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: "2.5rem",
            height: "2.5rem",
            padding: 0,
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            background: "transparent",
            cursor: "pointer",
            // Dim the swatch when no explicit color is set (default in use).
            opacity: hex ? 1 : 0.45,
          }}
        />
        <input
          type="text"
          aria-label="Frame color hex value"
          placeholder="default"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: "7rem",
            height: "2.5rem",
            padding: "0 0.5rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            background: "var(--theme-input-bg)",
            color: "var(--theme-elevation-800)",
            fontFamily: "monospace",
          }}
        />
        {typeof value === "string" && value !== "" && (
          <button
            type="button"
            onClick={() => setValue("")}
            style={{
              height: "2.5rem",
              padding: "0 0.75rem",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "4px",
              background: "transparent",
              color: "var(--theme-elevation-800)",
              cursor: "pointer",
            }}
          >
            Use default
          </button>
        )}
      </div>
      <FieldDescription description={description} path={path} />
    </div>
  );
}
