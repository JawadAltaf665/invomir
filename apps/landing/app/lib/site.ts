export const site = {
  name: "InvoMir",
  marketingUrl: "https://invomir.app",
  appUrl: "https://invomirweb.vercel.app",
  registerUrl: "https://invomirweb.vercel.app/auth/register",
  loginUrl: "https://invomirweb.vercel.app/auth/login",
  googleAuthUrl: "https://invomir-production.up.railway.app/api/auth/google",
  dashboardUrl: "https://invomirweb.vercel.app/app/dashboard",
  supportEmail: "hello@invomir.com",
  privacyEmail: "privacy@invomir.com",
  twitterUrl: "https://twitter.com/invomir",
  linkedInUrl: "https://linkedin.com/company/invomir",
  youtubeUrl: "https://youtube.com/@invomir",
} as const;

export const primaryNavItems = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Team", href: "/#team" },
  { label: "FAQ", href: "/#faq" },
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
      { label: "Team", href: "/#team" },
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

