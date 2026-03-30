"use client";

import { useCallback, useState } from "react";

export interface UseDisclosureOptions {
  defaultOpen?: boolean;
}

export function useDisclosure(options: UseDisclosureOptions = {}) {
  const [isOpen, setIsOpen] = useState(Boolean(options.defaultOpen));

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    setIsOpen,
    onOpen,
    onClose,
    onToggle
  };
}

