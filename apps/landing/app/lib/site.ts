export const site = {
  name: "InvoMir",
  marketingUrl: "https://invomir.app",
  appUrl: "https://invomir.com",
  registerUrl: "https://invomir.com/auth/register",
  loginUrl: "https://invomir.com/auth/login",
  dashboardUrl: "https://invomir.com/app/dashboard",
  supportEmail: "hello@invomir.com",
  privacyEmail: "privacy@invomir.com",
  twitterUrl: "https://twitter.com/invomir",
  linkedInUrl: "https://linkedin.com/company/invomir",
  youtubeUrl: "https://youtube.com/@invomir",
} as const;

export const primaryNavItems = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
] as const;

export const resourceNavItems = [
  { label: "Help Center", href: "/help" },
  { label: "API Docs", href: "/api-docs" },
  { label: "Changelog", href: "/changelog" },
  { label: "System Status", href: "/status" },
] as const;

export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "System status", href: "/status" },
      { label: "API docs", href: "/api-docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Help center", href: "/help" },
      { label: "Contact", href: `mailto:${site.supportEmail}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
] as const;

