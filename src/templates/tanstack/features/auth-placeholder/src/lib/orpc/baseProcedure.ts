import { os } from "@orpc/server";
import { z } from "zod/v4";

export interface CookieAdapter {
  getAll: () => Record<string, string>;
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  delete: (name: string) => void;
}

export interface RootContext {
  cookieAdapter: CookieAdapter;
}

export const base = os.$input(z.void()).$context<RootContext>();
