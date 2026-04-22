import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, getCookie, getCookies, setCookie } from "@tanstack/react-start/server";
import { router } from "@/lib/orpc/router.ts";

const orpcHandler = new RPCHandler(router);

export const Route = createFileRoute("/api/v1/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { response } = await orpcHandler.handle(request, {
          prefix: "/api/v1/rpc",
          context: {
            cookieAdapter: {
              getAll: () => getCookies(),
              get: (name: string) => getCookie(name),
              set: (name: string, value: string, options?: Record<string, unknown>) =>
                setCookie(name, value, options),
              delete: (name: string) => deleteCookie(name),
            },
          },
        });
        return response ?? new Response("Not Found", { status: 404 });
      },
    },
  },
});
