import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Router } from "./router.ts";

const getClient = createIsomorphicFn()
  .client((): RouterClient<Router> =>
    createORPCClient(new RPCLink({ url: `${window.location.origin}/api/v1/rpc` })),
  )
  .server((): RouterClient<Router> =>
    createORPCClient(
      new RPCLink({
        url: "http://localhost:3000/api/v1/rpc",
        headers: () => getRequestHeaders(),
      }),
    ),
  );

export const client: RouterClient<Router> = getClient();
