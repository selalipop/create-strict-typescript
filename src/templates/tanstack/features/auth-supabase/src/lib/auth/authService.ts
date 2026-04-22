import { createServerClient } from "@supabase/ssr";
import type { CookieAdapter } from "../orpc/baseProcedure.ts";

export interface User {
  id: string;
  email: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

export const authService = {
  async getUserFromRequest({
    cookieAdapter,
    allowAnonymous,
  }: {
    cookieAdapter: CookieAdapter;
    allowAnonymous: boolean;
  }): Promise<{ user: User | undefined; isAnonymousUser: boolean }> {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () =>
          Object.entries(cookieAdapter.getAll()).map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            cookieAdapter.set(name, value, options);
          }
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      if (!allowAnonymous) {
        throw new Error("Unauthorized");
      }
      return { user: undefined, isAnonymousUser: true };
    }
    return {
      user: { id: data.user.id, email: data.user.email ?? "" },
      isAnonymousUser: data.user.is_anonymous === true,
    };
  },
};
