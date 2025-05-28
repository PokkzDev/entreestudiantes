"use client";
import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";
import { useSessionValidation } from "@/lib/useSessionValidation";

function SessionValidator() {
  // Check session validity every 30 seconds
  useSessionValidation(30000);
  return null;
}

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <SessionValidator />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
