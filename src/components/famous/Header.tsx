import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/use-session";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signedIn } = useSessionUser();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
        <Link to="/" aria-label="FamousVibe home"><BrandLogo /></Link>
        {signedIn ? (
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-5" />
          </button>
        ) : (
          <Link
            to="/auth"
            aria-label="Sign in"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground"
          >
            <LogIn className="size-4" />
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
