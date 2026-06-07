import { site } from "./site";

export type PlanId = "free" | "starter" | "professional" | "business";
export type BillingInterval = "monthly" | "yearly";

export interface PricingPlan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  disabled?: boolean;
}

export const pricingPlans: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "2 clients",
      "5 invoices/month",
      "1 seat",
      "No auto reminders",
      "No online payments",
      "No report exports",
      "No team seats",
    ],
    ctaLabel: "Current plan",
    ctaHref: site.registerUrl,
    disabled: true,
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 9,
    yearlyPrice: 90,
    badge: "Most popular",
    features: [
      "10 clients",
      "Unlimited invoices",
      "1 seat",
      "Auto reminders",
      "Online payments",
      "No report exports",
      "No team seats",
    ],
    ctaLabel: "Start free trial",
    ctaHref: `${site.registerUrl}?plan=starter`,
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 19,
    yearlyPrice: 190,
    badge: "Recommended",
    features: [
      "Unlimited clients",
      "Unlimited invoices",
      "1 seat",
      "Auto reminders",
      "Online payments",
      "Report exports",
      "No team seats",
    ],
    ctaLabel: "Start free trial",
    ctaHref: `${site.registerUrl}?plan=professional`,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "Unlimited clients",
      "Unlimited invoices",
      "3 seats",
      "Auto reminders",
      "Online payments",
      "Report exports",
      "Team seats",
    ],
    ctaLabel: "Start free trial",
    ctaHref: `${site.registerUrl}?plan=business`,
  },
] as const;

export const homepageFeatures = [
  {
    eyebrow: "Create Invoices in 2 Minutes",
    icon: "fileText",
    title: "From zero to sent in 2 minutes",
    body: "Select a client, add your work, set a due date. InvoMir calculates tax, applies discounts, and generates a branded PDF. No spreadsheet, no template hunting.",
    chips: ["100 line items", "Auto tax calc", "Discount support", "INV-001 auto-numbering"],
    mockup: "invoice",
  },
  {
    eyebrow: "Get Paid Online, Instantly",
    icon: "creditCard",
    title: "Every invoice is a payment link",
    body: "Clients click Pay Now and pay by card. No login required. Money goes directly to your Stripe account. InvoMir never touches it.",
    chips: ["Visa / Mastercard / Amex", "Direct to your Stripe", "No fees from us"],
    mockup: "payment",
  },
  {
    eyebrow: "Automatic Reminders",
    icon: "bell",
    title: "Stop chasing. Let InvoMir ask.",
    body: "InvoMir sends a polite reminder 3 days before the due date, then again the day after if unpaid, then 7 days overdue. Professionally worded. Automatically.",
    chips: ["Pre-due reminder", "Day 1 overdue", "Day 7 overdue", "Toggle per invoice"],
    mockup: "reminders",
  },
  {
    eyebrow: "Invoice Open Tracking",
    icon: "eye",
    title: "Did they even see it?",
    body: "InvoMir embeds a tracking pixel in every invoice email. The moment your client opens it, the status updates from Sent to Viewed. Now you know.",
    chips: ["Real-time status", "Viewed timestamp", "No more guessing"],
    mockup: "viewed",
  },
  {
    eyebrow: "Dashboard That Shows Your Money",
    icon: "barChart",
    title: "Your revenue at a glance",
    body: "See this month's revenue, outstanding invoices, what is overdue, and your top-paying clients on one screen. Updated in real time.",
    chips: ["Revenue this month", "Outstanding total", "Top clients", "Currency conversion"],
    mockup: "dashboard",
  },
  {
    eyebrow: "Works on Any Device",
    icon: "smartphone",
    title: "Invoice from the job site",
    body: "The full InvoMir experience is available from any browser, anywhere. Create and send an invoice from your phone before you leave.",
    chips: ["Mobile-optimised", "Works on any browser", "No app download needed"],
    mockup: "mobile",
  },
] as const;

export const howItWorksSteps = [
  {
    icon: "penLine",
    title: "Create a client, create an invoice",
    body: "Add your client once. Reuse for every invoice. Choose payment terms or a due date. Add your line items. Done.",
  },
  {
    icon: "send",
    title: "Send with one click",
    body: "InvoMir emails a beautiful PDF to your client with a Pay Now button. You get notified when they open it.",
  },
  {
    icon: "dollarSign",
    title: "Get paid automatically chased",
    body: "Your client pays online, or InvoMir sends reminders until they do. You get paid faster without asking.",
  },
] as const;

export const testimonials = [
  {
    quote:
      "I used to dread following up on unpaid invoices. Now I do not think about it. InvoMir sends the reminders and I just watch the payments come in.",
    name: "Sara K.",
    role: "Freelance Designer",
    location: "Dubai",
    initials: "SK",
  },
  {
    quote:
      "We manage 25 clients. Before InvoMir, I had a spreadsheet nightmare. Now I can see who owes what in 10 seconds. The team invite feature saves me hours every week.",
    name: "Ahmed M.",
    role: "Agency Owner",
    location: "Lahore",
    initials: "AM",
  },
  {
    quote:
      "I do AC repairs. I finish a job, create an invoice on my phone, and the client pays before I leave their house. No more bank transfer delays. Game changer.",
    name: "Omar R.",
    role: "Service Business",
    location: "Riyadh",
    initials: "OR",
  },
] as const;

export const comparisonRows = [
  ["Starting price", "$0", "$17/mo", "$30/mo", "$0"],
  ["Auto reminders", "Starter+", "All plans", "All plans", "No"],
  ["Online payments", "Starter+", "All plans", "All plans", "Fees"],
  ["Mobile-optimised", "Full", "Partial", "Partial", "Partial"],
  ["Invoice only (simple)", "Yes", "Full accounting", "Full accounting", "Mixed"],
  ["No percent cut on payments", "Yes", "Yes", "Yes", "Percent fee"],
] as const;

export const pricingFaqs = [
  {
    question: "Is my financial data safe?",
    answer:
      "Yes. InvoMir is built around secure authentication, workspace isolation, and HTTPS-only app access.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "You can choose a paid plan or stay on the free plan limits. No credit card is required to start.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. You can cancel a paid subscription anytime from billing settings.",
  },
  {
    question: "Do you take a percentage of my invoice payments?",
    answer:
      "No. Your client payment goes directly to your connected Stripe account. InvoMir does not add a percentage fee.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes. You can move between plans as your client list, invoice volume, and team needs change.",
  },
] as const;

export const extendedPricingFaqs = [
  ...pricingFaqs,
  {
    question: "Is there a free plan?",
    answer: "Yes. The free plan includes 2 clients and 5 invoices per month.",
  },
  {
    question: "Which plan includes online payments?",
    answer: "Online payments are available on Starter, Professional, and Business.",
  },
  {
    question: "Which plan includes report exports?",
    answer: "Report exports are available on Professional and Business.",
  },
  {
    question: "Which plan includes team seats?",
    answer: "Business includes 3 seats for workspace collaboration.",
  },
  {
    question: "Do all plans include the trial?",
    answer: "Yes. All paid plans start with a 14-day full-feature trial.",
  },
] as const;

export const blogPosts = [
  {
    slug: "how-to-invoice-clients",
    category: "How to invoice clients",
    title: "How to invoice clients without awkward follow-ups",
    excerpt:
      "Create a clear invoice, send it professionally, and let reminders handle the hard part.",
    date: "June 2026",
    readTime: "6 min read",
    keyword: "how to invoice clients",
    sections: [
      {
        heading: "Start with a clear client record",
        body: "Keep the client's name, email, company, and tax details in one place. It keeps every future invoice consistent.",
      },
      {
        heading: "Use simple payment terms",
        body: "A due date removes guesswork. InvoMir can send reminders before and after that date so the follow-up is not awkward.",
      },
      {
        heading: "Make payment easy",
        body: "Online payment links reduce delays because the client can pay from the invoice without asking for bank details.",
      },
    ],
  },
  {
    slug: "get-paid-faster-freelancer",
    category: "Freelancer finance",
    title: "How freelancers get paid faster without chasing clients",
    excerpt:
      "Use payment links, clear due dates, and automatic reminders to shorten payment cycles.",
    date: "June 2026",
    readTime: "7 min read",
    keyword: "get paid faster freelancer",
    sections: [
      {
        heading: "Send invoices as soon as work is complete",
        body: "The faster the invoice goes out, the faster the payment clock starts. A 2-minute workflow helps you send before the day ends.",
      },
      {
        heading: "Let reminders carry the pressure",
        body: "A polite automated reminder is easier to receive than a late-night manual message. It also keeps your tone consistent.",
      },
      {
        heading: "Track viewed and unpaid invoices",
        body: "Knowing whether a client opened an invoice helps you decide when to follow up and when to wait.",
      },
    ],
  },
  {
    slug: "invoice-app-pakistan",
    category: "Geo guide",
    title: "Invoice app for Pakistan freelancers and agencies",
    excerpt:
      "Send professional invoices, track PKR reporting, and manage clients from one browser-based workspace.",
    date: "June 2026",
    readTime: "5 min read",
    keyword: "invoice app Pakistan",
    sections: [
      {
        heading: "Use one workspace for PKR reporting",
        body: "InvoMir keeps dashboard totals in your workspace reporting currency while preserving invoice records.",
      },
      {
        heading: "Create branded PDFs for clients",
        body: "Add your client, line items, tax, discount, and notes, then generate a clean invoice for local or international clients.",
      },
      {
        heading: "Track who still owes you",
        body: "The dashboard shows outstanding, overdue, and all-time paid revenue so you can follow the money without a spreadsheet.",
      },
    ],
  },
  {
    slug: "invoice-app-uae",
    category: "Geo guide",
    title: "Invoice app for UAE freelancers and service businesses",
    excerpt:
      "Create invoices quickly, accept online payments, and follow up professionally with automatic reminders.",
    date: "June 2026",
    readTime: "5 min read",
    keyword: "invoice app UAE",
    sections: [
      {
        heading: "Send invoices from any browser",
        body: "Whether you are in the office or on site, InvoMir helps you create and send an invoice without installing an app.",
      },
      {
        heading: "Accept card payments through Stripe",
        body: "Connect your Stripe account and let clients pay online from the invoice link.",
      },
      {
        heading: "Keep follow-ups professional",
        body: "Automatic reminders make payment follow-up predictable and polite, without turning it into a personal message thread.",
      },
    ],
  },
] as const;

export type BlogPost = (typeof blogPosts)[number];

export const alternatives = [
  {
    slug: "freshbooks",
    name: "FreshBooks",
    keyword: "freshbooks alternative",
    title: "FreshBooks alternative for simple invoicing",
    intro:
      "InvoMir focuses on invoice creation, online payment links, and automatic follow-up without turning into full accounting software.",
  },
  {
    slug: "quickbooks",
    name: "QuickBooks",
    keyword: "quickbooks alternative",
    title: "QuickBooks alternative for freelancers who just need invoices",
    intro:
      "InvoMir keeps the workflow focused: create invoices, send payment links, track what is due, and get paid faster.",
  },
] as const;

export type Alternative = (typeof alternatives)[number];

