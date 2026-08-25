import { Download, Flag, MoreHorizontal, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PostMenu({
  onInterested,
  onNotInterested,
  onReport,
  onDownload,
}: {
  onInterested: () => void;
  onNotInterested: () => void;
  onReport: () => void;
  onDownload: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More options"
        className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <MoreHorizontal className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onInterested}>
          <ThumbsUp className="mr-2 size-4" /> Interested
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onNotInterested}>
          <ThumbsDown className="mr-2 size-4" /> Not interested
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDownload}>
          <Download className="mr-2 size-4" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReport} className="text-destructive focus:text-destructive">
          <Flag className="mr-2 size-4" /> Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
