import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { client } from "./client.ts";

export const orpc = createTanstackQueryUtils(client);
