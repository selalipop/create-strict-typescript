import { Link } from "@tanstack/react-router";

interface NavProps {
  projectName: string;
  user?: { email: string } | undefined;
}

export function Nav({ projectName, user }: NavProps) {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
        <Link to="/" className="font-semibold text-slate-900">
          {projectName}
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <span className="text-slate-600">{user.email}</span>
          ) : (
            <span className="text-slate-400">not signed in</span>
          )}
        </div>
      </div>
    </nav>
  );
}
