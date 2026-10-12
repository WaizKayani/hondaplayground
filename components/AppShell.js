"use client";

import { useRouter } from "next/navigation";
import Header from "./Header";
import { resetDemoData } from "../lib/storage";

export default function AppShell({ children }) {
  const router = useRouter();

  function handleResetDemo() {
    const confirmed = window.confirm(
      "Reset the demo? This restores the original five projects and three students, and clears all applications."
    );
    if (!confirmed) return;
    resetDemoData();
    router.refresh();
    window.location.reload();
  }

  return (
    <>
      <Header onResetDemo={handleResetDemo} />
      {children}
    </>
  );
}
