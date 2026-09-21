/*
  Mobile port of yogi-mart-next's lib/products/variantSelection.ts — the
  web's authoritative rule for how a customer picks a variant. Ported rather
  than imported (the two apps are separate repos/bundles) but kept
  function-for-function identical in behavior, so a product's variants
  resolve the same way on both platforms.

  Product documents store variants as one entry PER COMBINATION:
    variants: [{ id, attributes: { Size: "M", Color: "Brown" }, stock, price }, ...]
  NOT as one entry per dimension with an options[] list — that older
  {label, options[]} shape this screen used to assume never matches real
  product data, which is why the selector never rendered and a customer
  could add an incomplete variant straight into the cart.
*/

export interface SelectableVariant {
  id?: string;
  attributes?: Record<string, string> | null;
  stock?: number;
  price?: number;
}

/** A partial or complete choice: dimension name -> chosen value. */
export type VariantSelection = Record<string, string>;

const PREFERRED_ORDER = [
  "Color",
  "Shade",
  "Size",
  "Capacity",
  "Pack Size",
  "RAM",
  "Storage",
  "Processor",
  "Material",
];

function attributesOf(variant: SelectableVariant): Record<string, string> {
  const raw = variant?.attributes;
  if (!raw || typeof raw !== "object") return {};

  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "") {
      clean[key] = value;
    }
  }
  return clean;
}

/** Every dimension this product actually varies on, in display order. */
export function variantDimensions(
  variants: SelectableVariant[] | null | undefined
): string[] {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  const seen: string[] = [];
  for (const variant of variants) {
    for (const key of Object.keys(attributesOf(variant))) {
      if (!seen.includes(key)) seen.push(key);
    }
  }

  const known = PREFERRED_ORDER.filter((name) => seen.includes(name));
  const rest = seen.filter((name) => !PREFERRED_ORDER.includes(name));
  return [...known, ...rest];
}

/** The values still available for one dimension, given what is already chosen. */
export function optionsForDimension(
  variants: SelectableVariant[] | null | undefined,
  dimension: string,
  selection: VariantSelection = {}
): string[] {
  if (!Array.isArray(variants)) return [];

  const values: string[] = [];

  for (const variant of variants) {
    const attrs = attributesOf(variant);
    const value = attrs[dimension];
    if (!value) continue;

    const compatible = Object.entries(selection).every(
      ([key, chosen]) => key === dimension || !chosen || attrs[key] === chosen
    );

    if (compatible && !values.includes(value)) values.push(value);
  }

  return values;
}

/**
 * Whether a dimension value has at least one IN-STOCK variant compatible with
 * the current selection. Combination-aware exactly like optionsForDimension,
 * plus a per-variant stock check: the option stays a valid CHOICE but is
 * unavailable to BUY, so the UI can disable (never hide) sold-out options.
 * Deliberately does NOT use the product's total stock.
 */
export function isOptionInStock(
  variants: SelectableVariant[] | null | undefined,
  dimension: string,
  value: string,
  selection: VariantSelection = {}
): boolean {
  if (!Array.isArray(variants)) return false;

  return variants.some((variant) => {
    const attrs = attributesOf(variant);
    if (attrs[dimension] !== value) return false;

    const compatible = Object.entries(selection).every(
      ([key, chosen]) => key === dimension || !chosen || attrs[key] === chosen
    );
    if (!compatible) return false;

    return Number(variant.stock) > 0;
  });
}

/** Whether every dimension this product varies on has been chosen. */
export function isSelectionComplete(
  variants: SelectableVariant[] | null | undefined,
  selection: VariantSelection = {}
): boolean {
  const dimensions = variantDimensions(variants);
  if (dimensions.length === 0) return true;
  return dimensions.every((d) => Boolean(selection[d]));
}

/** The one variant matching a complete selection, or null. */
export function resolveVariant<T extends SelectableVariant>(
  variants: T[] | null | undefined,
  selection: VariantSelection = {}
): T | null {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  if (!isSelectionComplete(variants, selection)) return null;

  const dimensions = variantDimensions(variants);

  const matches = variants.filter((variant) => {
    const attrs = attributesOf(variant);
    return dimensions.every((d) => attrs[d] === selection[d]);
  });

  return matches.length === 1 ? matches[0] : null;
}

/** The attributes of a variant, cleaned — what gets stored on a cart line. */
export function variantAttributes(
  variant: SelectableVariant | null | undefined
): Record<string, string> {
  return variant ? attributesOf(variant) : {};
}

/** Legacy bridge: the flat size/color a cart line has always carried. */
export function legacySizeColor(attributes: Record<string, string>): {
  size: string;
  color: string;
} {
  return {
    size: attributes.Size || "",
    color: attributes.Color || attributes.Shade || "",
  };
}
