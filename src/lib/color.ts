export type Rgb = {
  r: number;
  g: number;
  b: number;
};

export type ColorDecision = {
  base: string;
  foreground: "#FFFFFF" | "#000000";
  whiteContrast: number;
  blackContrast: number;
  luminance: number;
  oklch: {
    l: number;
    c: number;
    h: number;
  };
  states: {
    normal: string;
    hover: string;
    selected: string;
    active: string;
    dragging: string;
  };
  notes: string[];
};

export type InteractionWeights = {
  hover: number;
  selected: number;
  active: number;
  dragging: number;
};

export type ColorMethodConfig = {
  rgbDarken: InteractionWeights;
  rgbLighten: InteractionWeights;
  oklchLightness: InteractionWeights;
};

export const defaultColorMethodConfig: ColorMethodConfig = {
  rgbDarken: {
    hover: 0.14,
    selected: 0.17,
    active: 0.2,
    dragging: 0.24,
  },
  rgbLighten: {
    hover: 0.1,
    selected: 0.13,
    active: 0.16,
    dragging: 0.2,
  },
  oklchLightness: {
    hover: 0.055,
    selected: 0.095,
    active: 0.13,
    dragging: 0.18,
  },
};

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

export function normalizeHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }

  return "#1D1478";
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [linearR, linearG, linearB] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

export function contrastRatio(colorA: string, colorB: string) {
  const l1 = relativeLuminance(colorA);
  const l2 = relativeLuminance(colorB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function bestForeground(hex: string): "#FFFFFF" | "#000000" {
  const whiteContrast = contrastRatio(hex, "#FFFFFF");
  const blackContrast = contrastRatio(hex, "#000000");

  return whiteContrast >= blackContrast ? "#FFFFFF" : "#000000";
}

export function getWcagRgbDecision(hex: string, config = defaultColorMethodConfig): ColorDecision {
  const base = normalizeHex(hex);
  const foreground = bestForeground(base);
  const luminance = relativeLuminance(base);
  const target = getRgbInteractionTarget(luminance, foreground);
  const weights = target === "white" ? config.rgbLighten : config.rgbDarken;
  const notes = [
    foreground === "#FFFFFF"
      ? "Texto branco tem maior contraste que texto preto."
      : "Texto preto tem maior contraste que texto branco.",
    target === "white"
      ? "Estados misturam em RGB com branco para clarear cores extremas escuras."
      : "Estados misturam em RGB com preto para escurecer cores claras/intermediarias.",
  ];

  return {
    base,
    foreground,
    whiteContrast: contrastRatio(base, "#FFFFFF"),
    blackContrast: contrastRatio(base, "#000000"),
    luminance,
    oklch: rgbToOklch(hexToRgb(base)),
    states: {
      normal: base,
      hover: mixRgb(base, target === "white" ? WHITE : BLACK, weights.hover),
      selected: mixRgb(base, target === "white" ? WHITE : BLACK, weights.selected),
      active: mixRgb(base, target === "white" ? WHITE : BLACK, weights.active),
      dragging: mixRgb(base, target === "white" ? WHITE : BLACK, weights.dragging),
    },
    notes,
  };
}

export function getOklchDecision(hex: string, config = defaultColorMethodConfig): ColorDecision {
  const base = normalizeHex(hex);
  const foreground = bestForeground(base);
  const luminance = relativeLuminance(base);
  const oklch = rgbToOklch(hexToRgb(base));
  const direction = getOklchInteractionDirection(oklch.l);
  const notes = [
    foreground === "#FFFFFF"
      ? "Texto branco continua sendo escolhido por contraste WCAG."
      : "Texto preto continua sendo escolhido por contraste WCAG.",
    direction > 0
      ? "Estados aumentam a luminosidade OKLCH para clarear sem perder matiz."
      : "Estados reduzem a luminosidade OKLCH para escurecer sem perder matiz.",
  ];

  return {
    base,
    foreground,
    whiteContrast: contrastRatio(base, "#FFFFFF"),
    blackContrast: contrastRatio(base, "#000000"),
    luminance,
    oklch,
    states: {
      normal: base,
      hover: shiftOklchLightness(base, direction * config.oklchLightness.hover),
      selected: shiftOklchLightness(base, direction * config.oklchLightness.selected),
      active: shiftOklchLightness(base, direction * config.oklchLightness.active),
      dragging: shiftOklchLightness(base, direction * config.oklchLightness.dragging),
    },
    notes,
  };
}

function getRgbInteractionTarget(luminance: number, foreground: "#FFFFFF" | "#000000") {
  if (luminance < 0.08) {
    return "white";
  }

  if (luminance > 0.84) {
    return "black";
  }

  return foreground === "#FFFFFF" ? "black" : "white";
}

function getOklchInteractionDirection(lightness: number) {
  if (lightness < 0.34) {
    return 1;
  }

  if (lightness > 0.78) {
    return -1;
  }

  return lightness < 0.58 ? 1 : -1;
}

function mixRgb(base: string, target: Rgb, weight: number) {
  const rgb = hexToRgb(base);

  return rgbToHex({
    r: rgb.r * (1 - weight) + target.r * weight,
    g: rgb.g * (1 - weight) + target.g * weight,
    b: rgb.b * (1 - weight) + target.b * weight,
  });
}

function shiftOklchLightness(hex: string, delta: number) {
  const oklch = rgbToOklch(hexToRgb(hex));
  const next = {
    ...oklch,
    l: clamp(oklch.l + delta, 0.08, 0.94),
  };

  return rgbToHex(oklchToRgb(next));
}

function rgbToOklch(rgb: Rgb) {
  const r = srgbToLinear(rgb.r / 255);
  const g = srgbToLinear(rgb.g / 255);
  const b = srgbToLinear(rgb.b / 255);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const okL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const okA = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const okB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  const c = Math.sqrt(okA * okA + okB * okB);
  const h = ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;

  return { l: okL, c, h };
}

function oklchToRgb({ l, c, h }: { l: number; c: number; h: number }): Rgb {
  const hueRad = (h * Math.PI) / 180;
  const a = Math.cos(hueRad) * c;
  const b = Math.sin(hueRad) * c;

  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b;

  const long = lRoot ** 3;
  const medium = mRoot ** 3;
  const short = sRoot ** 3;

  const linearR = 4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short;
  const linearG = -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short;
  const linearB = -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short;

  return {
    r: linearToSrgb(linearR) * 255,
    g: linearToSrgb(linearG) * 255,
    b: linearToSrgb(linearB) * 255,
  };
}

function srgbToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number) {
  const clamped = clamp(value, 0, 1);
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
