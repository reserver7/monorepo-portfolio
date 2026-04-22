"use client";

import * as React from "react";
import { Box } from "../box";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type TooltipState = {
  open: boolean;
  text: string;
  rect: DOMRect | null;
};

const EMPTY_STATE: TooltipState = {
  open: false,
  text: "",
  rect: null
};

const ELLIPSIS_SELECTOR = '[data-ellipsis-tooltip], .truncate, [class*="line-clamp"]';

const toTooltipText = (element: HTMLElement) => {
  const explicit = element.getAttribute("data-ellipsis-tooltip");
  if (explicit && explicit.trim().length > 0) return explicit.trim();

  const aria = element.getAttribute("aria-label");
  if (aria && aria.trim().length > 0) return aria.trim();

  const text = element.textContent?.trim() ?? "";
  return text;
};

const isOverflowed = (element: HTMLElement) => {
  const horizontalOverflow = element.scrollWidth - element.clientWidth > 1;
  const verticalOverflow = element.scrollHeight - element.clientHeight > 1;
  return horizontalOverflow || verticalOverflow;
};

const resolveCandidate = (eventTarget: EventTarget | null) => {
  if (!(eventTarget instanceof Element)) {
    return null;
  }
  const matched = eventTarget.closest(ELLIPSIS_SELECTOR);
  return matched instanceof HTMLElement ? matched : null;
};

export function AutoEllipsisTooltip() {
  const [state, setState] = React.useState<TooltipState>(EMPTY_STATE);
  const activeElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hideTooltip = () => {
      activeElementRef.current = null;
      setState(EMPTY_STATE);
    };

    const showTooltipFor = (element: HTMLElement) => {
      const text = toTooltipText(element);
      if (!text || !isOverflowed(element)) {
        hideTooltip();
        return;
      }
      activeElementRef.current = element;
      setState({
        open: true,
        text,
        rect: element.getBoundingClientRect()
      });
    };

    const onPointerOver = (event: Event) => {
      const candidate = resolveCandidate(event.target);
      if (!candidate) {
        hideTooltip();
        return;
      }
      if (activeElementRef.current === candidate) {
        return;
      }
      showTooltipFor(candidate);
    };

    const onPointerOut = (event: Event) => {
      const current = activeElementRef.current;
      if (!current) return;
      const relatedTarget = (event as MouseEvent).relatedTarget;
      if (relatedTarget instanceof Node && current.contains(relatedTarget)) {
        return;
      }
      hideTooltip();
    };

    const onFocusIn = (event: Event) => {
      const candidate = resolveCandidate(event.target);
      if (!candidate) return;
      showTooltipFor(candidate);
    };

    const onFocusOut = () => {
      hideTooltip();
    };

    const onViewportChange = () => {
      const current = activeElementRef.current;
      if (!current) return;
      if (!isOverflowed(current)) {
        hideTooltip();
        return;
      }
      setState((prev) =>
        prev.open
          ? {
              ...prev,
              rect: current.getBoundingClientRect()
            }
          : prev
      );
    };

    document.addEventListener("mouseover", onPointerOver, true);
    document.addEventListener("mouseout", onPointerOut, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);

    return () => {
      document.removeEventListener("mouseover", onPointerOver, true);
      document.removeEventListener("mouseout", onPointerOut, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, []);

  if (!state.open || !state.rect) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip open={state.open}>
        <TooltipTrigger asChild>
          <Box
            aria-hidden
            className="pointer-events-none fixed z-[var(--z-tooltip)]"
            style={{
              left: `${state.rect.left}px`,
              top: `${state.rect.top}px`,
              width: `${state.rect.width}px`,
              height: `${state.rect.height}px`
            }}
          />
        </TooltipTrigger>
        <TooltipContent placement="top" alignment="center" withArrow>
          {state.text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
