import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PlusSquare, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/vibes", label: "Vibes", icon: Sparkles },
  { to: "/create", label: "Create", icon: PlusSquare },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pt-2 backdrop-blur-xl">
      <ul className="mx-auto flex w-full max-w-lg items-center justify-around px-4">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-label={item.label}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-all",
                    active ? "bg-brand shadow-neon" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
