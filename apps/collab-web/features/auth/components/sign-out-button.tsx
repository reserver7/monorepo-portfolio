"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await fetch("/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
