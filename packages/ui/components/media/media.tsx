"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../cn";
import type { CarouselProps, ImageProps, WatermarkProps } from "./media.types";

export function Image({
  fallback,
  preview = false,
  previewSrc,
  alt = "",
  src,
  onPreviewClose,
  onError,
  onClick,
  className,
  ...props
}: ImageProps) {
  const [failed, setFailed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const resolvedSrc = previewSrc ?? src;
  const closePreview = () => {
    setOpen(false);
    onPreviewClose?.();
  };
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  if (failed)
    return (
      <span
        className={cn(
          "bg-surface-muted text-text-tertiary inline-flex items-center justify-center text-sm",
          className
        )}
      >
        {fallback ?? "Image unavailable"}
      </span>
    );
  return (
    <>
      {preview ? (
        <button
          type="button"
          aria-label={`Preview ${alt || "image"}`}
          className={cn(
            "focus-visible:ring-primary block max-w-full cursor-zoom-in rounded focus-visible:outline-none focus-visible:ring-2",
            className
          )}
          onClick={() => {
            setOpen(true);
          }}
        >
          <img
            src={src}
            alt={alt}
            width={props.width}
            height={props.height}
            className="max-w-full"
            onError={(event) => {
              setFailed(true);
              onError?.(event);
            }}
            onClick={onClick}
            {...props}
          />
        </button>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={(event) => {
            setFailed(true);
            onError?.(event);
          }}
          {...props}
        />
      )}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image preview"}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6"
          onClick={closePreview}
        >
          <button
            type="button"
            aria-label="Close preview"
            className="absolute right-5 top-5 rounded text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={(event) => {
              event.stopPropagation();
              closePreview();
            }}
          >
            <X aria-hidden />
          </button>
          <img
            src={resolvedSrc}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

export function Carousel({
  items = [],
  current,
  defaultCurrent = 0,
  onChange,
  autoplay = false,
  autoplaySpeed = 3000,
  dots = true,
  className,
  onKeyDown,
  ...props
}: CarouselProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultCurrent);
  const active = current ?? uncontrolled;
  const total = items.length;
  const change = (next: number) => {
    const normalized = (next + total) % total;
    if (current === undefined) setUncontrolled(normalized);
    onChange?.(normalized);
  };
  React.useEffect(() => {
    if (!autoplay || total < 2) return;
    const timer = window.setInterval(() => change(active + 1), autoplaySpeed);
    return () => window.clearInterval(timer);
  }, [active, autoplay, autoplaySpeed, total]);
  if (!total) return null;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          change(active - 1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          change(active + 1);
        }
      }}
      {...props}
    >
      <div
        className="flex transition-transform duration-300"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}`}
          >
            {item}
          </div>
        ))}
      </div>
      {total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
            onClick={() => change(active - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
            onClick={() => change(active + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
          {dots ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {items.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === active}
                  className={cn("size-2 rounded-full bg-white/55", index === active && "bg-white")}
                  onClick={() => change(index)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function Watermark({
  content,
  rotate = -22,
  gap = 24,
  opacity = 0.12,
  fontSize = 16,
  color = "#000",
  children,
  className,
  style,
  ...props
}: WatermarkProps) {
  const text = Array.isArray(content) ? content.join(" ") : content;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${180 + gap}" height="${100 + gap}"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="${color}" fill-opacity="${opacity}" font-size="${fontSize}" transform="rotate(${rotate} 100 50)">${text}</text></svg>`;
  return (
    <div
      className={cn("relative", className)}
      style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
