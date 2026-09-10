"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await fetch("/api/logout", { method: "POST" });
    // Hard navigation, same reason as login: guarantees a fresh
    // request instead of a possibly cached client-side route.
    window.location.href = "/";
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? "Выходим..." : "Выйти"}
    </Button>
  );
}
