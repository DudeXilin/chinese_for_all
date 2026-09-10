"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
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
