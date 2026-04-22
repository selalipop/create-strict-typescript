import { authService } from "../auth/authService.ts";
import { base } from "./baseProcedure.ts";

const anonymousMiddleware = base.middleware(async ({ context, next }) => {
  const { user, isAnonymousUser } = await authService.getUserFromRequest({
    cookieAdapter: context.cookieAdapter,
    allowAnonymous: true,
  });
  return await next({ context: { user, isAnonymousUser } });
});

const authenticatedMiddleware = base.middleware(async ({ context, next }) => {
  const { user, isAnonymousUser } = await authService.getUserFromRequest({
    cookieAdapter: context.cookieAdapter,
    allowAnonymous: false,
  });
  if (user === undefined) {
    throw new Error("Unauthorized");
  }
  return await next({ context: { user, isAnonymousUser } });
});

export const unauthenticated = base;
export const anonymous = base.use(anonymousMiddleware);
export const authenticated = base.use(authenticatedMiddleware);
