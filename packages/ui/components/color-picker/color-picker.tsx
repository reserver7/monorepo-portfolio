"use client";

import * as React from "react";
import { Pipette } from "lucide-react";
import { Box } from "../box";
import { Button } from "../button";
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Select } from "../select";
import { Typography } from "../typography";

type ColorPickerProps = {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  label?: string;
  presets?: string[];
};

type Rgb = { r: number; g: number; b: number };
type Hsv = { h: number; s: number; v: number };
type Hsva = { h: number; s: number; v: number; a: number };
type Format = "hex" | "rgb" | "hsb";

const HEX_PATTERN = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA_PATTERN = /^rgba?\(([^)]+)\)$/i;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, precision = 2) => {
  const base = 10 ** precision;
  return Math.round(value * base) / base;
};

const formatOptions = [
  { label: "HEX", value: "hex" },
  { label: "RGB", value: "rgb" },
  { label: "HSB", value: "hsb" }
];

const parseTuple = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const isCompleteHex = (value: string) => /^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(value.toUpperCase());

const normalizeHexInput = (value: string) => {
  const cleaned = value
    .toUpperCase()
    .replace(/[^0-9A-F#]/g, "")
    .replace(/^([^#]*)/, "#$1")
    .replace(/#/g, (_m, i) => (i === 0 ? "#" : ""));
  return cleaned.slice(0, 9);
};

const normalizeRgbInput = (value: string) => {
  const numbers = value
    .replace(/[^\d,\s]/g, "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((v) => String(clamp(Number.parseInt(v, 10) || 0, 0, 255)));
  return numbers.join(", ");
};

const normalizeHsbInput = (value: string) => {
  const numbers = value
    .replace(/[^\d,\s%]/g, "")
    .replaceAll("%", "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 3);
  const [h = "0", s = "0", b = "0"] = numbers;
  const hh = clamp(Number.parseInt(h, 10) || 0, 0, 360);
  const ss = clamp(Number.parseInt(s, 10) || 0, 0, 100);
  const bb = clamp(Number.parseInt(b, 10) || 0, 0, 100);
  return `${hh}, ${ss}%, ${bb}%`;
};

const sliderClass =
  "absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.45)]";

const rgbToHex = (r: number, g: number, b: number, a = 1) => {
  const rr = clamp(Math.round(r), 0, 255);
  const gg = clamp(Math.round(g), 0, 255);
  const bb = clamp(Math.round(b), 0, 255);
  if (a < 1) {
    const aa = clamp(Math.round(a * 255), 0, 255);
    return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}${aa.toString(16).padStart(2, "0")}`.toUpperCase();
  }
  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase();
};

const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
};

const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  const c = v * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh >= 0 && hh < 1) [r, g, b] = [c, x, 0];
  else if (hh >= 1 && hh < 2) [r, g, b] = [x, c, 0];
  else if (hh >= 2 && hh < 3) [r, g, b] = [0, c, x];
  else if (hh >= 3 && hh < 4) [r, g, b] = [0, x, c];
  else if (hh >= 4 && hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

const parseColor = (input?: string): Hsva => {
  if (!input) return { h: 216, s: 0.76, v: 0.96, a: 1 };
  const trimmed = input.trim();
  if (HEX_PATTERN.test(trimmed)) {
    const hex = trimmed.slice(1);
    const hasAlpha = hex.length === 8;
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    const a = hasAlpha ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
    const hsv = rgbToHsv({ r, g, b });
    return { ...hsv, a: round(a) };
  }
  const rgbaMatch = trimmed.match(RGBA_PATTERN);
  if (rgbaMatch?.[1]) {
    const [rRaw = "59", gRaw = "130", bRaw = "246", aRaw = "1"] = rgbaMatch[1].split(",").map((part) => part.trim());
    const r = clamp(Number.parseInt(rRaw, 10) || 59, 0, 255);
    const g = clamp(Number.parseInt(gRaw, 10) || 130, 0, 255);
    const b = clamp(Number.parseInt(bRaw, 10) || 246, 0, 255);
    const a = clamp(Number.parseFloat(aRaw) || 1, 0, 1);
    const hsv = rgbToHsv({ r, g, b });
    return { ...hsv, a: round(a) };
  }
  return { h: 216, s: 0.76, v: 0.96, a: 1 };
};

const toCss = (hsva: Hsva) => {
  const rgb = hsvToRgb(hsva);
  if (hsva.a >= 1) return rgbToHex(rgb.r, rgb.g, rgb.b);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${round(hsva.a)})`;
};

const toHexText = (hsva: Hsva) => {
  const rgb = hsvToRgb(hsva);
  return rgbToHex(rgb.r, rgb.g, rgb.b, hsva.a);
};

export function ColorPicker({ value, onChange, disabled, label = "Color" }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [format, setFormat] = React.useState<Format>("hex");
  const [hsva, setHsva] = React.useState<Hsva>(() => parseColor(value));
  const [rawValue, setRawValue] = React.useState("");
  const [isRawEditing, setIsRawEditing] = React.useState(false);

  React.useEffect(() => {
    setHsva(parseColor(value));
  }, [value]);

  const hue = hsva.h;
  const saturation = Math.round(hsva.s * 100);
  const brightness = Math.round(hsva.v * 100);
  const alphaPercent = Math.round(hsva.a * 100);
  const currentCss = toCss(hsva);
  const currentHex = toHexText(hsva);
  const rgb = hsvToRgb(hsva);
  const pureHue = rgbToHex(...Object.values(hsvToRgb({ h: hue, s: 1, v: 1 })) as [number, number, number]);
  const svRef = React.useRef<HTMLDivElement | null>(null);
  const hsvaRef = React.useRef<Hsva>(hsva);

  React.useEffect(() => {
    hsvaRef.current = hsva;
  }, [hsva]);

  const emit = React.useCallback(
    (next: Hsva) => {
      onChange?.(toCss(next));
    },
    [onChange]
  );

  const patch = React.useCallback(
    (partial: Partial<Hsva>) => {
      const current = hsvaRef.current;
      const next = {
        h: clamp(partial.h ?? current.h, 0, 360),
        s: clamp(partial.s ?? current.s, 0, 1),
        v: clamp(partial.v ?? current.v, 0, 1),
        a: clamp(partial.a ?? current.a, 0, 1)
      };
      hsvaRef.current = next;
      setHsva(next);
      setIsRawEditing(false);
      emit(next);
    },
    [emit]
  );

  React.useEffect(() => {
    if (isRawEditing) return;
    if (format === "hex") setRawValue(currentHex);
    else if (format === "rgb") setRawValue(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    else setRawValue(`${Math.round(hsva.h)}, ${saturation}%, ${brightness}%`);
  }, [brightness, currentHex, format, hsva.h, isRawEditing, rgb.b, rgb.g, rgb.r, saturation]);

  const updateSvFromClient = (clientX: number, clientY: number) => {
    const node = svRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    patch({
      s: rect.width ? x / rect.width : 0,
      v: rect.height ? 1 - y / rect.height : 0
    });
  };

  const onSvPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateSvFromClient(event.clientX, event.clientY);
    const onMove = (moveEvent: PointerEvent) => updateSvFromClient(moveEvent.clientX, moveEvent.clientY);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const applyRawInput = () => {
    if (format === "hex") {
      const parsed = parseColor(rawValue);
      hsvaRef.current = parsed;
      setHsva(parsed);
      emit(parsed);
      return;
    }
    if (format === "rgb") {
      const [rRaw = "0", gRaw = "0", bRaw = "0"] = rawValue.split(",").map((part) => part.trim());
      const nextRgb: Rgb = {
        r: clamp(Number.parseInt(rRaw, 10) || 0, 0, 255),
        g: clamp(Number.parseInt(gRaw, 10) || 0, 0, 255),
        b: clamp(Number.parseInt(bRaw, 10) || 0, 0, 255)
      };
      const next = { ...rgbToHsv(nextRgb), a: hsva.a };
      hsvaRef.current = next;
      setHsva(next);
      emit(next);
      return;
    }
    const [hRaw = "0", sRaw = "0", vRaw = "0"] = rawValue
      .replaceAll("%", "")
      .split(",")
      .map((part) => part.trim());
    const next = {
      h: clamp(Number.parseFloat(hRaw) || 0, 0, 360),
      s: clamp((Number.parseFloat(sRaw) || 0) / 100, 0, 1),
      v: clamp((Number.parseFloat(vRaw) || 0) / 100, 0, 1),
      a: hsva.a
    };
    hsvaRef.current = next;
    setHsva(next);
    emit(next);
  };

  const applyMaskedRawValue = (input: string) => {
    if (format === "hex") return normalizeHexInput(input);
    if (format === "rgb") return normalizeRgbInput(input);
    return normalizeHsbInput(input);
  };

  const tryParseRawInput = React.useCallback(
    (input: string): Hsva | null => {
      if (format === "hex") {
        if (!isCompleteHex(input)) return null;
        return parseColor(input);
      }
      if (format === "rgb") {
        const tuple = parseTuple(input);
        if (tuple.length !== 3) return null;
        const [rRaw = "0", gRaw = "0", bRaw = "0"] = tuple;
        const nextRgb: Rgb = {
          r: clamp(Number.parseInt(rRaw, 10) || 0, 0, 255),
          g: clamp(Number.parseInt(gRaw, 10) || 0, 0, 255),
          b: clamp(Number.parseInt(bRaw, 10) || 0, 0, 255)
        };
        return { ...rgbToHsv(nextRgb), a: hsvaRef.current.a };
      }
      const tuple = parseTuple(input.replaceAll("%", ""));
      if (tuple.length !== 3) return null;
      const [hRaw = "0", sRaw = "0", vRaw = "0"] = tuple;
      return {
        h: clamp(Number.parseFloat(hRaw) || 0, 0, 360),
        s: clamp((Number.parseFloat(sRaw) || 0) / 100, 0, 1),
        v: clamp((Number.parseFloat(vRaw) || 0) / 100, 0, 1),
        a: hsvaRef.current.a
      };
    },
    [format]
  );

  const handleRawKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    const delta = event.key === "ArrowUp" ? step : -step;

    if (format === "hex") {
      const parsed = parseColor(rawValue);
      const next = { ...parsed, h: (parsed.h + delta + 360) % 360 };
      hsvaRef.current = next;
      setHsva(next);
      emit(next);
      return;
    }

    if (format === "rgb") {
      const tuple = parseTuple(rawValue);
      const [r = "0", g = "0", b = "0"] = tuple;
      const rr = clamp((Number.parseInt(r, 10) || 0) + delta, 0, 255);
      const gg = clamp((Number.parseInt(g, 10) || 0) + delta, 0, 255);
      const bb = clamp((Number.parseInt(b, 10) || 0) + delta, 0, 255);
      const next = { ...rgbToHsv({ r: rr, g: gg, b: bb }), a: hsva.a };
      hsvaRef.current = next;
      setHsva(next);
      emit(next);
      return;
    }

    const tuple = parseTuple(rawValue.replaceAll("%", ""));
    const [h = "0", s = "0", v = "0"] = tuple;
    const next = {
      h: clamp((Number.parseInt(h, 10) || 0) + delta, 0, 360),
      s: clamp((Number.parseInt(s, 10) || 0) / 100, 0, 1),
      v: clamp((Number.parseInt(v, 10) || 0) / 100, 0, 1),
      a: hsva.a
    };
    hsvaRef.current = next;
    setHsva(next);
    emit(next);
  };

  const pickFromScreen = async () => {
    if (disabled) return;
    const eyeDropperCtor = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!eyeDropperCtor) return;
    try {
      const picker = new eyeDropperCtor();
      const result = await picker.open();
      const next = parseColor(result.sRGBHex);
      setHsva(next);
      emit(next);
    } catch {
      // ignore cancelled picker
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          className="border-default bg-surface text-foreground h-10 w-full justify-between rounded-[var(--radius-md)] border px-3"
          aria-label={label}
        >
          <Box className="flex items-center gap-2">
            <Box className="h-4 w-4 rounded-[4px] border border-white/60 shadow-sm" style={{ background: currentCss }} />
            <Typography className="text-body-sm font-medium uppercase">{currentHex}</Typography>
          </Box>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-surface-elevated border-default w-[336px] rounded-[var(--radius-lg)] border p-3 shadow-lg">
        <Box className="space-y-3">
          <Box
            ref={svRef}
            onPointerDown={onSvPointerDown}
            className="relative h-[184px] w-full cursor-crosshair overflow-hidden rounded-[10px]"
            style={{
              backgroundColor: pureHue,
              backgroundImage:
                "linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, #000000 100%)"
            }}
          >
            <Box
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
              style={{ left: `${saturation}%`, top: `${100 - brightness}%` }}
            />
          </Box>

          <Box className="grid grid-cols-[36px_1fr] gap-2">
            <Button
              type="button"
              iconOnly
              variant="secondary"
              size="sm"
              className="border-default bg-surface text-foreground h-9 w-9 rounded-[10px] border"
              onClick={pickFromScreen}
              aria-label="Pick color from screen"
              title="Pick color from screen"
              leftIcon={<Pipette className="text-foreground h-[18px] w-[18px]" strokeWidth={2.25} />}
            />

            <Box className="space-y-2">
              <Box className="relative h-5 rounded-full">
                <Box
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)"
                  }}
                />
                <Input
                  type="range"
                  min={0}
                  max={360}
                  value={String(Math.round(hue))}
                  onChange={(event) => patch({ h: Number(event.target.value) })}
                  className={sliderClass}
                />
              </Box>
              <Box
                className="border-default relative h-5 rounded-full border"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgba(120,130,150,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(120,130,150,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(120,130,150,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(120,130,150,0.18) 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0"
                }}
              >
                <Box className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgbToHex(rgb.r, rgb.g, rgb.b)})` }} />
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={String(alphaPercent)}
                  onChange={(event) => patch({ a: Number(event.target.value) / 100 })}
                  className={sliderClass}
                />
              </Box>
            </Box>
          </Box>

          <Box className="grid grid-cols-[88px_1fr_70px] gap-2">
            <Select
              options={formatOptions}
              value={format}
              onChange={(next) => setFormat((next as Format) ?? "hex")}
              size="sm"
            />
            <Input
              value={rawValue}
              onChange={(event) => {
                const masked = applyMaskedRawValue(event.target.value);
                setRawValue(masked);
                const parsed = tryParseRawInput(masked);
                if (!parsed) return;
                hsvaRef.current = parsed;
                setHsva(parsed);
                emit(parsed);
              }}
              onFocus={() => setIsRawEditing(true)}
              onBlur={() => {
                applyRawInput();
                setIsRawEditing(false);
              }}
              onEnter={applyRawInput}
              onKeyDown={handleRawKeyDown}
              className="h-9 font-medium"
            />
            <Input
              value={`${alphaPercent}%`}
              onChange={(event) => {
                const next = clamp(Number.parseInt(event.target.value.replace(/[^0-9]/g, ""), 10) || 0, 0, 100);
                patch({ a: next / 100 });
              }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                const step = event.shiftKey ? 10 : 1;
                const delta = event.key === "ArrowUp" ? step : -step;
                const next = clamp(alphaPercent + delta, 0, 100);
                patch({ a: next / 100 });
              }}
              className="h-9 text-right font-medium"
            />
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  );
}
