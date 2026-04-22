import { authService } from "../auth/authService.ts";
import { base } from "./baseProcedure.ts";

export const authMiddleware = (allowAnonymous: boolean) =>
  base.middleware(async ({ context: _context, next }) => {
    const { user, isAnonymousUser } = await authService.getUserFromRequest({
      cookieAdapter: _context.cookieAdapter,
      allowAnonymous,
    });
    if (!allowAnonymous && user === undefined) {
      throw new Error("Unauthorized");
    }
    return await next({ context: { user, isAnonymousUser } });
  });

export const unauthenticated = base;
export const anonymous = base.use(authMiddleware(true));
export const authenticated = base.use(authMiddleware(false));
