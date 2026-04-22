import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/Nav.tsx";
import { orpc } from "@/lib/orpc/query.ts";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const meQuery = useQuery({
    ...orpc.me.queryOptions(),
    retry: false,
  });
  const thingsQuery = useQuery(orpc.things.list.queryOptions());
  const createThing = useMutation({
    ...orpc.things.create.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orpc.things.list.queryKey() });
    },
  });
  const deleteThing = useMutation({
    ...orpc.things.delete.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orpc.things.list.queryKey() });
    },
  });

  const user = meQuery.data?.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav projectName="{{name}}" user={user} />
      <main className="mx-auto max-w-3xl space-y-10 p-8">
        <section>
          <h1 className="text-4xl font-bold tracking-tight">Welcome to {{name}}</h1>
          <p className="mt-3 max-w-prose text-slate-600">
            TanStack Start + oRPC + a strict TypeScript baseline. Auth is wired through the
            <code className="mx-1 rounded bg-slate-100 px-1">authService</code> seam — see the{" "}
            <code className="rounded bg-slate-100 px-1">auth-seam</code> skill to swap providers.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Edit <code className="rounded bg-slate-100 px-1">src/routes/index.tsx</code> to make it yours.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Things</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = title.trim();
              if (trimmed.length === 0) {
                return;
              }
              createThing.mutate({ title: trimmed });
              setTitle("");
            }}
            className="mb-4 flex gap-2"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a thing…"
              className="flex-1 rounded border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              maxLength={120}
            />
            <button
              type="submit"
              disabled={title.trim().length === 0 || createThing.isPending}
              className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Add
            </button>
          </form>

          {thingsQuery.isLoading ? (
            <p className="text-slate-500">Loading…</p>
          ) : thingsQuery.data && thingsQuery.data.length > 0 ? (
            <ul className="space-y-2">
              {thingsQuery.data.map((thing) => (
                <li
                  key={thing.id}
                  className="flex items-center justify-between rounded border border-slate-200 bg-white p-3"
                >
                  <span>{thing.title}</span>
                  <button
                    type="button"
                    onClick={() => deleteThing.mutate({ id: thing.id })}
                    className="text-sm text-rose-600 hover:underline disabled:opacity-50"
                    disabled={deleteThing.isPending}
                  >
                    delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No things yet — add one above.</p>
          )}
        </section>
      </main>
    </div>
  );
}
