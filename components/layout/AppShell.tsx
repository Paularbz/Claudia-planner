"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { InitDb } from "@/components/InitDb";
import { cn } from "@/lib/utils/cn";
import { supabase } from "@/lib/supabase/client";

const PUBLIC_PATHS = ["/login"];

interface AppShellProps {
  children: React.ReactNode;
  topBarAction?: React.ReactNode;
}

export function AppShell({ children, topBarAction }: AppShellProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isPublic) return;

    // Em localhost, pula autenticação para facilitar visualização local
    if (window.location.hostname === "localhost") {
      setAuthed(true);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthed(true);
      } else {
        router.replace("/login");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
      else setAuthed(true);
    });

    return () => subscription.unsubscribe();
  }, [router, isPublic]);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-[#fff8f9] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-fuchsia-200 border-t-fuchsia-500 rounded-full animate-spin" />
    </div>
  );

  if (isPublic) return <>{children}</>;

  if (!authed) return (
    <div className="min-h-screen bg-[#fff8f9] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-fuchsia-200 border-t-fuchsia-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fff8f9]">
      <InitDb />
      {isMobile ? (
        <>
          <TopBar action={topBarAction} />
          <main className="pt-14 pb-20 px-4 min-h-screen">{children}</main>
          <BottomNav />
        </>
      ) : (
        <>
          <Sidebar />
          <main className={cn("ml-60 p-6 min-h-screen")}>{children}</main>
        </>
      )}
    </div>
  );
}
