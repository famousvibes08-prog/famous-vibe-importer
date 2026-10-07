import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ReelShareIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M14 3.5 22 10.5 14 17.5v-4.2C7.7 13.3 4.2 15.5 2 20c0-8.4 4.2-13.5 12-13.5z" />
  </svg>;
}

export function ReelTabIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M3 8.5h18M8 3l3.5 5.5M15 3l3.5 5.5" />
    <path d="m10 12 5 3-5 3z" fill="currentColor" strokeWidth="1" />
  </svg>;
}