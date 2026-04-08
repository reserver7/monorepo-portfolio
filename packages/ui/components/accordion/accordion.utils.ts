import * as React from "react";
import { ACCORDION_DEFAULTS } from "./accordion.constants";
import type { AccordionChevronPosition, AccordionSize, AccordionVariant } from "./accordion.types";

export type AccordionStyleContextValue = {
  size: AccordionSize;
  variant: AccordionVariant;
  chevronPosition: AccordionChevronPosition;
  rotateChevron: boolean;
};

export const AccordionStyleContext = React.createContext<AccordionStyleContextValue>({
  size: ACCORDION_DEFAULTS.size,
  variant: ACCORDION_DEFAULTS.variant,
  chevronPosition: ACCORDION_DEFAULTS.chevronPosition,
  rotateChevron: ACCORDION_DEFAULTS.rotateChevron
});

export const AccordionStyleProvider = AccordionStyleContext.Provider;
