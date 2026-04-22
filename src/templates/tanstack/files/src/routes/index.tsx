import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc/query.ts";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const { data, isLoading } = useQuery(orpc.health.queryOptions());
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">{{name}}</h1>
      <p className="opacity-70">
        {isLoading ? "Checking..." : `oRPC says: ${JSON.stringify(data)}`}
      </p>
    </main>
  );
}
