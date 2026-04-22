import type { CookieAdapter } from "../orpc/baseProcedure.ts";

export interface User {
  id: string;
  email: string;
}

/**
 * Extensibility seam — replace this implementation to wire in your real auth provider
 * (Supabase, Clerk, Auth0, better-auth, Lucia, etc.). The signature is the one contract
 * the oRPC middleware depends on.
 */
export const authService = {
  async getUserFromRequest(_args: {
    cookieAdapter: CookieAdapter;
    allowAnonymous: boolean;
  }): Promise<{ user: User | undefined; isAnonymousUser: boolean }> {
    // TODO: replace with real auth.
    const stubUser: User = { id: "stub-user-id", email: "stub@example.com" };
    return { user: stubUser, isAnonymousUser: false };
  },
};
