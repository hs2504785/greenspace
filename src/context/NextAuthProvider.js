'use client';

import { SessionProvider } from "next-auth/react";

export function NextAuthProvider({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}