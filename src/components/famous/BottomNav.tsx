import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PlusSquare, Search, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReelTabIcon } from "./ReelIcons";

const items: ReadonlyArray<{ to: "/" | "/explore" | "/vibes" | "/create" | "/profile"; label: string; icon: typeof Home; primary?: boolean }> = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/vibes", label: "Vibe", icon: ReelTabIcon, primary: true },
  { to: "/create", label: "Upload", icon: PlusSquare },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 h-[calc(5rem+env(safe-area-inset-bottom,0px))] border-t border-border bg-background/90 pt-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl">
      <ul className="mx-auto flex w-full max-w-lg items-center justify-around px-4">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
                <Button asChild variant="ghost" className="h-auto rounded-none p-0 hover:bg-transparent">
                <Link
                to={item.to}
                aria-label={item.label}
                 aria-current={active ? "page" : undefined}
                 title={item.label}
                 className="flex w-14 flex-col items-center gap-1 px-1 py-1"
              >
                <span
                  className={cn(
                     "grid size-9 place-items-center transition-colors",
                     active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                       "size-7",
                       item.primary && "text-neon-pink",
                       active && item.primary && "drop-shadow-[0_0_8px_var(--color-neon-purple)]",
                    )}
                     strokeWidth={active ? 2.2 : 1.8}
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
               </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
