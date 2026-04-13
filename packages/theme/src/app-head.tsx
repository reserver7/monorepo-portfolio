import * as React from "react";
import { THEME_BOOTSTRAP_SCRIPT } from "./bootstrap-script";
import { THEME_PRELOAD_FONT_HREFS } from "./constants";

export interface AppHeadProps {
  preloadFonts?: readonly string[];
}

export function AppHead({ preloadFonts = THEME_PRELOAD_FONT_HREFS }: AppHeadProps) {
  return (
    <>
      {preloadFonts.map((href) => (
        <link
          key={href}
          rel="preload"
          href={href}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      ))}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
    </>
  );
}
