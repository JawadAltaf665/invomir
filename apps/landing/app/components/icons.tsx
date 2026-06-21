import type { ReactElement, SVGProps } from "react";

export type IconName =
  | "apple"
  | "arrowRight"
  | "barChart"
  | "bell"
  | "check"
  | "chevronDown"
  | "creditCard"
  | "dollarSign"
  | "eye"
  | "fileText"
  | "globe"
  | "lock"
  | "menu"
  | "penLine"
  | "play"
  | "search"
  | "send"
  | "shield"
  | "smartphone"
  | "sparkles"
  | "twitter"
  | "users"
  | "zap"
  | "linkedin"
  | "instagram"
  | "x";

const iconPaths: Record<IconName, readonly ReactElement[]> = {
  apple: [
    <path key="a" d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />,
    <path key="b" d="M10 2c1 .5 2 2 2 5" />
  ],
  arrowRight: [<path key="a" d="M5 12h14" />, <path key="b" d="m13 6 6 6-6 6" />],
  barChart: [
    <path key="a" d="M3 3v18h18" />,
    <path key="b" d="M7 16v-5" />,
    <path key="c" d="M12 16V8" />,
    <path key="d" d="M17 16v-3" />,
  ],
  bell: [
    <path key="a" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />,
    <path key="b" d="M10 21h4" />,
  ],
  check: [<path key="a" d="m5 12 4 4L19 6" />],
  chevronDown: [<path key="a" d="m6 9 6 6 6-6" />],
  creditCard: [
    <rect key="a" width="20" height="14" x="2" y="5" rx="2" />,
    <path key="b" d="M2 10h20" />,
  ],
  dollarSign: [
    <path key="a" d="M12 2v20" />,
    <path key="b" d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />,
  ],
  eye: [
    <path key="a" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />,
    <circle key="b" cx="12" cy="12" r="3" />,
  ],
  fileText: [
    <path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />,
    <path key="b" d="M14 2v6h6" />,
    <path key="c" d="M8 13h8" />,
    <path key="d" d="M8 17h6" />,
  ],
  globe: [
    <circle key="a" cx="12" cy="12" r="10" />,
    <path key="b" d="M2 12h20" />,
    <path key="c" d="M12 2a15 15 0 0 1 0 20" />,
    <path key="d" d="M12 2a15 15 0 0 0 0 20" />,
  ],
  instagram: [
    <rect key="a" width="20" height="20" x="2" y="2" rx="5" ry="5" />,
    <path key="b" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />,
    <line key="c" x1="17.5" x2="17.51" y1="6.5" y2="6.5" />,
  ],
  linkedin: [
    <path key="a" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />,
    <rect key="b" width="4" height="12" x="2" y="9" />,
    <circle key="c" cx="4" cy="4" r="2" />,
  ],
  lock: [
    <rect key="a" x="4" y="10" width="16" height="10" rx="2" />,
    <path key="b" d="M8 10V7a4 4 0 0 1 8 0v3" />,
  ],
  menu: [<path key="a" d="M4 6h16" />, <path key="b" d="M4 12h16" />, <path key="c" d="M4 18h16" />],
  penLine: [
    <path key="a" d="M12 20h9" />,
    <path key="b" d="m16.5 3.5 4 4L8 20l-5 1 1-5Z" />,
  ],
  play: [<path key="a" d="m8 5 11 7-11 7Z" />],
  search: [<circle key="a" cx="11" cy="11" r="7" />, <path key="b" d="m21 21-4.3-4.3" />],
  send: [<path key="a" d="m22 2-7 20-4-9-9-4Z" />, <path key="b" d="M22 2 11 13" />],
  shield: [
    <path key="a" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    <path key="b" d="m9 12 2 2 4-4" />,
  ],
  smartphone: [
    <rect key="a" width="12" height="20" x="6" y="2" rx="2" />,
    <path key="b" d="M11 18h2" />,
  ],
  sparkles: [
    <path key="a" d="m12 3 1.6 4.8L18 10l-4.4 2.2L12 17l-1.6-4.8L6 10l4.4-2.2Z" />,
    <path key="b" d="M5 3v4" />,
    <path key="c" d="M3 5h4" />,
    <path key="d" d="M19 17v4" />,
    <path key="e" d="M17 19h4" />,
  ],
  twitter: [
    <path key="a" d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  ],
  users: [
    <path key="a" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
    <circle key="b" cx="9" cy="7" r="4" />,
    <path key="c" d="M22 21v-2a4 4 0 0 0-3-3.87" />,
    <path key="d" d="M16 3.13a4 4 0 0 1 0 7.75" />,
  ],
  zap: [
    <polygon key="a" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ],
  x: [<path key="a" d="M18 6 6 18" />, <path key="b" d="m6 6 12 12" />],
};

export function Icon({
  name,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
