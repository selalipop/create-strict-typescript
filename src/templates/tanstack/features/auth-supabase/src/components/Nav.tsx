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
            <>
              <span className="text-slate-600">{user.email}</span>
              <Link to="/auth/logout" className="text-slate-600 hover:text-slate-900">
                Sign out
              </Link>
            </>
          ) : (
            <Link to="/auth/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
