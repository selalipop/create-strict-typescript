import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/browser-client.ts";

export const Route = createFileRoute("/auth/logout")({ component: LogoutPage });

function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.signOut().then(() => navigate({ to: "/" }));
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-slate-600">Signing out…</p>
    </main>
  );
}
