import { createServerClient } from "@supabase/ssr";
import { createFileRoute } from "@tanstack/react-router";
import {
  deleteCookie,
  getCookies,
  setCookie,
} from "@tanstack/react-start/server";

export const Route = createFileRoute("/api/v1/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const next = url.searchParams.get("next") ?? "/";
        if (!code) {
          return new Response("Missing code", { status: 400 });
        }
        const supabase = createServerClient(
          process.env.VITE_SUPABASE_URL ?? "",
          process.env.VITE_SUPABASE_ANON_KEY ?? "",
          {
            cookies: {
              getAll: () =>
                Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
              setAll: (cookies) => {
                for (const { name, value, options } of cookies) {
                  if (value) {
                    setCookie(name, value, options ?? {});
                  } else {
                    deleteCookie(name);
                  }
                }
              },
            },
          },
        );
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return new Response(`Auth error: ${error.message}`, { status: 400 });
        }
        return new Response(null, { status: 302, headers: { Location: next } });
      },
    },
  },
});
