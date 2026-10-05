import logoAsset from "@/assets/famousvibe-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <img src={logoAsset.url} alt="FamousVibe" className="size-9 shrink-0 rounded-xl object-cover" />
      {showName ? <span className="font-script text-brand text-3xl leading-none">FamousVibe</span> : null}
    </span>
  );
}