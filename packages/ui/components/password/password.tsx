"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../input";
import type { PasswordProps } from "./password.types";

export const Password = React.forwardRef<HTMLInputElement, PasswordProps>(function Password(
  { visibilityToggle = true, iconRender, ...props },
  ref
) {
  const controlled = typeof visibilityToggle === "object" ? visibilityToggle.visible : undefined;
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const visible = controlled ?? uncontrolled;
  const toggle = () => {
    const next = !visible;
    if (controlled === undefined) setUncontrolled(next);
    if (typeof visibilityToggle === "object") visibilityToggle.onVisibleChange?.(next);
  };
  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      suffix={
        visibilityToggle ? (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggle}
            className="text-muted hover:text-foreground inline-flex items-center"
          >
            <span className="sr-only">{visible ? "Hide password" : "Show password"}</span>
            {iconRender ? (
              iconRender(visible)
            ) : visible ? (
              <EyeOff aria-hidden className="h-4 w-4" />
            ) : (
              <Eye aria-hidden className="h-4 w-4" />
            )}
          </button>
        ) : undefined
      }
    />
  );
});
Password.displayName = "Password";
