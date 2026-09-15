import * as React from "react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  preview?: boolean;
  previewSrc?: string;
  onPreviewClose?: () => void;
}
export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: readonly React.ReactNode[];
  current?: number;
  defaultCurrent?: number;
  onChange?: (current: number) => void;
  autoplay?: boolean;
  autoplaySpeed?: number;
  dots?: boolean;
}
export interface WatermarkProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  content: string | readonly string[];
  rotate?: number;
  gap?: number;
  opacity?: number;
  fontSize?: number;
  color?: string;
  children?: React.ReactNode;
}
