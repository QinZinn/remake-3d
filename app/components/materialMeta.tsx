import { MATERIALS, type MaterialCategory, type MaterialId } from "@/lib/taxonomy";

export interface StreamTheme {
  readonly category: MaterialCategory;
  readonly label: string;
  readonly ink: string;
  readonly mat: string;
  readonly rule: string;
  readonly bar: string;
}

export const STREAM_THEMES: Record<MaterialCategory, StreamTheme> = {
  plastic: {
    category: "plastic",
    label: "Plastic",
    ink: "#164A68",
    mat: "#E3EEF4",
    rule: "#B5CEDD",
    bar: "#1D5E82",
  },
  paper: {
    category: "paper",
    label: "Paper & Card",
    ink: "#734210",
    mat: "#F3E8D6",
    rule: "#DBC39D",
    bar: "#965819",
  },
  glass: {
    category: "glass",
    label: "Glass",
    ink: "#12544E",
    mat: "#DFEFEC",
    rule: "#AED0C9",
    bar: "#196B63",
  },
  metal: {
    category: "metal",
    label: "Metal",
    ink: "#35414D",
    mat: "#E6ECEF",
    rule: "#BAC6CF",
    bar: "#485867",
  },
  textile: {
    category: "textile",
    label: "Textile",
    ink: "#6D293E",
    mat: "#F3E4E8",
    rule: "#D7B4BE",
    bar: "#8C3852",
  },
  rubber: {
    category: "rubber",
    label: "Rubber",
    ink: "#384237",
    mat: "#E5EAE3",
    rule: "#BEC8BA",
    bar: "#4B5949",
  },
  wood: {
    category: "wood",
    label: "Wood",
    ink: "#63401F",
    mat: "#EFE6DA",
    rule: "#D2BEA6",
    bar: "#7D5229",
  },
  supply: {
    category: "supply",
    label: "Supply",
    ink: "#365032",
    mat: "#E5EEE2",
    rule: "#B8CCB2",
    bar: "#476942",
  },
};

export function streamThemeForMaterial(id: MaterialId): StreamTheme {
  return STREAM_THEMES[MATERIALS[id].category];
}

/**
 * Orthographic workshop schematic SVG for each primary recyclable material.
 * Drawn in a single consistent 1.5px stroke weight with a vermilion dashed cut/fold cue.
 */
export function MaterialSchematic({
  materialId,
  className = "h-16 w-24",
}: {
  materialId: MaterialId;
  className?: string;
}) {
  const stroke = "currentColor";
  const cut = "#BD3B20";

  switch (materialId) {
    case "pet-bottle":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <path d="M42 7h12v5H42z" stroke={stroke} strokeWidth="1.5" />
          <path d="M44 12v4l-9 7v31a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3V23l-9-7v-4" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M35 39h26M35 46h26" stroke={stroke} strokeWidth="1" opacity="0.35" />
          <path d="M27 33h42" stroke={cut} strokeWidth="1.6" strokeDasharray="3.5 2.5" />
          <path d="M25 30.5 28.5 33 25 35.5M71 30.5 67.5 33 71 35.5" stroke={cut} strokeWidth="1.3" />
        </svg>
      );
    case "hdpe-jug":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <path d="M35 9h10v4H35z" stroke={stroke} strokeWidth="1.5" />
          <path d="M37 13l-8 8v34a2 2 0 0 0 2 2h34a2 2 0 0 0 2-2V23l-14-10H37Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M55 24h7v16h-7a3 3 0 0 1-3-3V27a3 3 0 0 1 3-3Z" stroke={stroke} strokeWidth="1.4" />
          <path d="M25 41h46" stroke={cut} strokeWidth="1.6" strokeDasharray="3.5 2.5" />
        </svg>
      );
    case "bottle-cap":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <circle cx="48" cy="32" r="20" stroke={stroke} strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="48" cy="32" r="6" stroke={cut} strokeWidth="1.6" />
          <circle cx="48" cy="18" r="4.5" stroke={stroke} strokeWidth="1.4" />
          <circle cx="60" cy="25" r="4.5" stroke={stroke} strokeWidth="1.4" />
          <circle cx="60" cy="39" r="4.5" stroke={stroke} strokeWidth="1.4" />
          <circle cx="48" cy="46" r="4.5" stroke={stroke} strokeWidth="1.4" />
          <circle cx="36" cy="39" r="4.5" stroke={stroke} strokeWidth="1.4" />
          <circle cx="36" cy="25" r="4.5" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case "cardboard":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <rect x="20" y="14" width="56" height="36" stroke={stroke} strokeWidth="1.5" />
          <path d="M32 14v36M64 14v36M20 24h56M20 40h56" stroke={cut} strokeWidth="1.4" strokeDasharray="3.5 2.5" />
          <path d="M20 14l6 5M76 14l-6 5M20 50l6-5M76 50l-6-5" stroke={stroke} strokeWidth="1.2" opacity="0.55" />
        </svg>
      );
    case "milk-carton":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <path d="M34 11h28v4H34z" stroke={stroke} strokeWidth="1.5" />
          <path d="M34 15 28 24v32h40V24l-6-9" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M28 24h40M48 15v41" stroke={stroke} strokeWidth="1.2" opacity="0.4" />
          <path d="M23 36h50" stroke={cut} strokeWidth="1.6" strokeDasharray="3.5 2.5" />
        </svg>
      );
    case "newspaper":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <rect x="22" y="13" width="52" height="38" stroke={stroke} strokeWidth="1.5" />
          <path d="M48 13v38" stroke={cut} strokeWidth="1.5" strokeDasharray="3.5 2.5" />
          <path d="M28 21h14M28 27h14M28 33h11M54 21h14M54 27h14M54 33h14M54 39h10" stroke={stroke} strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    case "glass-jar":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <rect x="35" y="9" width="26" height="6" stroke={stroke} strokeWidth="1.5" />
          <path d="M37 15v3l-6 4v31a3 3 0 0 0 3 3h28a3 3 0 0 0 3-3V22l-6-4v-3" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <rect x="37" y="29" width="22" height="14" stroke={cut} strokeWidth="1.4" strokeDasharray="3 2" />
          <path d="M37 18h22" stroke={stroke} strokeWidth="1.2" opacity="0.45" />
        </svg>
      );
    case "glass-bottle":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <path d="M44 7h8v14l9 10v24a2 2 0 0 1-2 2H37a2 2 0 0 1-2-2V31l9-10V7Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M44 14h8M44 17.5h8M44 21h8" stroke={cut} strokeWidth="1.5" />
          <path d="M35 45h26" stroke={stroke} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.55" />
        </svg>
      );
    case "steel-can":
    case "aluminium-can":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <ellipse cx="48" cy="14" rx="17" ry="4.5" stroke={stroke} strokeWidth="1.5" />
          <path d="M31 14v36c0 2.5 7.6 4.5 17 4.5s17-2 17-4.5V14" stroke={stroke} strokeWidth="1.5" />
          <path d="M31 24c0 2 7.6 3.5 17 3.5s17-1.5 17-3.5M31 33c0 2 7.6 3.5 17 3.5s17-1.5 17-3.5M31 42c0 2 7.6 3.5 17 3.5s17-1.5 17-3.5" stroke={stroke} strokeWidth="1.1" opacity="0.45" />
          <path d="M31 18.5c0 2 7.6 3.5 17 3.5s17-1.5 17-3.5" stroke={cut} strokeWidth="1.6" strokeDasharray="3 2" />
        </svg>
      );
    case "t-shirt":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <path d="M36 12c3 4 21 4 24 0l13 8-6 10-7-4v29H36V26l-7 4-6-10 13-8Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M36 45h24M41 45v10M48 45v10M55 45v10" stroke={cut} strokeWidth="1.4" strokeDasharray="3 2" />
        </svg>
      );
    case "jeans":
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <path d="M31 10h34v45H51l-3-25-3 25H31V10Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="miter" />
          <path d="M31 16h34" stroke={stroke} strokeWidth="1.2" opacity="0.45" />
          <path d="M27 36h20" stroke={cut} strokeWidth="1.6" strokeDasharray="3.5 2.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 96 64" fill="none" aria-hidden="true" className={className}>
          <rect x="26" y="14" width="44" height="36" stroke={stroke} strokeWidth="1.5" />
          <path d="M26 32h44M48 14v36" stroke={cut} strokeWidth="1.4" strokeDasharray="3.5 2.5" />
        </svg>
      );
  }
}
