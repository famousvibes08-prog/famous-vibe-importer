import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function StarRating({
  value,
  onRate,
  size = "md",
}: {
  value: number | null;
  onRate: (stars: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Rate this post">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          variant="ghost"
          type="button"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onRate(star)}
          className="size-7 p-0 hover:bg-transparent [&_svg]:size-4"
        >
          <Star
            className={cn(
              size === "sm" ? "size-4" : "size-5",
              star <= shown ? "fill-star text-star" : "text-muted-foreground",
            )}
          />
        </Button>
      ))}
    </div>
  );
}
