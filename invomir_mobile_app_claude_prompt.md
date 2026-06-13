# Claude Prompt — Build InvoMir Mobile App in React Native

You are a senior mobile app architect, product designer, React Native engineer, and UI/UX mentor. You already have access to the full InvoMir context including PRD, ERD, API documentation, existing Angular web app, PostgreSQL backend, authentication flow, subscription plans, marketing website, branding direction, and SaaS business requirements.

Your task is to plan and implement a modern, professional, production-ready React Native mobile app for InvoMir.

InvoMir is an invoice SaaS platform for freelancers and small businesses. It supports multi-tenancy, role-based access, multi-language, multi-currency, subscription plans, invoices, clients, reminders, reporting, PDF/Excel export, invoice sending, dashboard analytics, and organization/team workflows.

The mobile app must feel premium, clean, fast, trustworthy, and business-focused. It should be consistent with the existing InvoMir web app and marketing website, while being optimized for mobile-first UX.

---

## 1. Main Goal

Build a complete React Native mobile application for InvoMir with:

- Modern professional UI/UX
- Clean and consistent design system
- Smooth animations and transitions
- Scalable folder structure
- Secure authentication
- API integration with existing backend
- Multi-tenant support
- Role-based access control
- Invoice management
- Client management
- Dashboard analytics
- Reports
- Subscription/plan awareness
- Settings/profile/company management
- Offline-friendly UX where useful
- Production-grade coding practices

The app should not look like a basic CRUD mobile app. It should feel like a polished SaaS mobile product similar in quality to modern fintech, accounting, invoicing, and productivity apps.

---

## 2. Tech Stack Recommendation

Use React Native with a production-friendly setup.

Recommended stack:

- React Native or Expo depending on existing project preference
- TypeScript required
- React Navigation for navigation
- React Query/TanStack Query for API state
- Zustand or Redux Toolkit for lightweight app state
- React Hook Form for forms
- Zod/Yup for validation
- Axios or generated API client for backend calls
- i18n support for multi-language
- SecureStore/Keychain for tokens
- AsyncStorage only for non-sensitive local preferences
- Reanimated for smooth animations
- Gesture Handler for gestures
- Bottom sheets where useful
- FlashList for large lists
- Date/time library such as date-fns/dayjs
- Toast/snackbar feedback system
- Error boundary and global API error handling

Do not hardcode backend URLs, colors, font sizes, strings, roles, plan limits, or currencies directly inside screens.

---

## 3. App Architecture

Create a scalable architecture that can grow with the product.

Suggested folder structure:

```txt
src/
  app/
    navigation/
    providers/
    config/
  assets/
    icons/
    images/
    fonts/
  components/
    common/
    forms/
    layout/
    feedback/
    invoice/
    client/
    dashboard/
  constants/
    colors.ts
    typography.ts
    spacing.ts
    radius.ts
    shadows.ts
    animations.ts
    currencies.ts
    languages.ts
  features/
    auth/
    dashboard/
    invoices/
    clients/
    reports/
    reminders/
    subscriptions/
    settings/
    company/
    team/
  hooks/
  services/
    api/
    auth/
    storage/
    pdf/
    notifications/
  store/
  theme/
  translations/
  types/
  utils/
```

Rules:

- Each feature should own its screens, components, hooks, API calls, and types where possible.
- Shared UI components should be reusable and not tied to business logic.
- API logic should not be written directly inside UI components.
- Screens should be clean and mostly compose hooks/components.
- Use strict TypeScript.
- Avoid `any` unless absolutely necessary and documented.

---

## 4. Design System Requirements

Create a mobile design system before building screens.

### Colors

Define semantic color tokens, not random colors.

Required tokens:

- Primary
- Primary light
- Primary dark
- Secondary/accent
- Background
- Surface/card
- Border
- Text primary
- Text secondary
- Text muted
- Success
- Warning
- Error
- Info
- Disabled
- Overlay

Use colors consistently across buttons, cards, charts, forms, statuses, and invoice states.

The UI should feel premium, minimal, and business-friendly. Avoid too many bright colors. Use status colors only when meaningful.

### Typography

Define typography scale:

- Display
- H1
- H2
- H3
- Body large
- Body regular
- Body small
- Caption
- Button
- Label

Requirements:

- Use one clean professional font family.
- Make numbers, totals, invoice amounts, and dashboard metrics highly readable.
- Maintain proper line height.
- Avoid tiny text.
- All text should support localization.

### Spacing

Use consistent spacing scale:

```txt
4, 8, 12, 16, 20, 24, 32, 40, 48
```

Do not use random margins or padding.

### Radius

Define radius tokens:

- Small
- Medium
- Large
- XL
- Full

Use rounded cards/buttons but avoid over-rounded childish UI.

### Shadows/Elevation

Use subtle elevation for cards, modals, bottom sheets, and floating actions.

Avoid heavy shadows.

### Icons

Use one consistent icon family. Icons should be simple, line-based, and readable.

### Empty States

Every list screen must have professional empty states with:

- Clear title
- Helpful explanation
- Primary action
- Optional illustration/icon

Examples:

- No invoices yet
- No clients yet
- No reports available
- No reminders scheduled

### Loading States

Use skeleton loaders for dashboard cards, invoice lists, and client lists.

Avoid showing blank screens.

### Error States

Handle:

- Network error
- Unauthorized session expired
- API validation error
- Empty API result
- Permission denied
- Plan limit reached
- Server error

Error messages should be human-friendly and actionable.

---

## 5. Animation and Interaction Guidelines

Use animation carefully to improve UX, not to distract.

Required animation standards:

- Smooth screen transitions
- Button press feedback
- Card press feedback
- Bottom sheet opening/closing
- Form validation feedback
- Success confirmation animation after invoice creation/sending
- Pull-to-refresh feedback
- Skeleton loading shimmer or clean placeholder
- Modal fade/slide transitions

Avoid overusing animations.

Animation timings:

- Micro interaction: 100–180ms
- Screen/card transition: 220–320ms
- Bottom sheet/modal: 250–350ms

Use Reanimated where suitable.

---

## 6. Navigation Structure

Design mobile navigation carefully.

Recommended navigation:

### Public Stack

- Splash Screen
- Onboarding/Welcome Screen
- Login
- Register
- Forgot Password
- Google OAuth entry if supported

### Authenticated App

Use bottom tabs:

1. Dashboard
2. Invoices
3. Clients
4. Reports
5. More

### More Section

- Company Profile
- Team Members
- Subscription & Plan
- Settings
- Language
- Currency
- Tax Settings
- Notifications
- Help & Support
- Logout

Use stack navigation inside each tab.

---

## 7. Authentication Requirements

Implement secure auth flow.

Required:

- Email/password login
- Register account
- Google login if existing backend supports it
- Forgot password if API exists
- Secure token storage
- Auto-login on app restart if token valid
- Session expired handling
- Logout clears sensitive data
- Tenant context handling
- Owner role handling
- Team member role handling

Do not store JWT/access tokens in plain AsyncStorage.

Use secure storage.

---

## 8. Role-Based Access Control

App must respect InvoMir roles.

Expected roles:

- Super Admin / Owner / Subscriber
- Team Member
- Other roles supported by backend

UI should hide or disable actions based on permissions.

Examples:

- Only owner/admin can manage subscription
- Only allowed users can create/edit/delete invoices
- Only allowed users can manage company settings
- Team members may have restricted dashboard visibility

Do not rely only on frontend permission checks. Backend remains source of truth, but frontend should provide clean UX.

---

## 9. Multi-Tenancy Requirements

InvoMir supports multi-tenancy.

Mobile app must:

- Load current tenant/company context after login
- Display correct company branding/details
- Send tenant-aware requests as required by backend
- Prevent data leakage across tenants
- Support future tenant switching if needed

---

## 10. Main Mobile App Features

## 10.1 Dashboard

Dashboard should be the main business overview.

Include:

- Total revenue
- Paid invoices
- Unpaid invoices
- Overdue invoices
- Draft invoices
- Recent invoices
- Recent clients
- Monthly revenue trend
- Quick actions

Quick actions:

- Create invoice
- Add client
- Send reminder
- View reports

Dashboard UI should use cards, charts, and clear hierarchy.

Use mobile-friendly charts. Avoid clutter.

---

## 10.2 Invoices

Invoice module is the core of the app.

Required screens:

- Invoice list
- Invoice detail
- Create invoice
- Edit invoice
- Preview invoice
- Send invoice
- Download/share PDF
- Mark as paid/unpaid if backend supports it
- Delete/cancel invoice if backend supports it

Invoice list requirements:

- Search
- Filter by status
- Filter by date range
- Filter by client
- Sort by newest, oldest, amount, due date
- Pull to refresh
- Pagination/infinite scroll

Invoice statuses:

- Draft
- Sent
- Paid
- Unpaid
- Overdue
- Cancelled/Void if supported

Create invoice flow should be very smooth:

1. Select client
2. Add invoice details
3. Add line items
4. Add tax/discount/currency
5. Add due date
6. Add notes/payment instructions
7. Preview
8. Save draft or send

Line item UX:

- Add item
- Edit item
- Remove item
- Quantity
- Unit price
- Tax
- Discount if supported
- Auto-calculate subtotal, tax, discount, total

Make invoice totals sticky or easy to review.

---

## 10.3 Clients

Required screens:

- Client list
- Client detail
- Add client
- Edit client
- Client invoice history

Client fields:

- Name/company name
- Email
- Phone
- Address
- Country
- Tax/VAT number if supported
- Notes

Client list:

- Search
- Sort
- Pull to refresh
- Empty state

Client detail:

- Basic details
- Total invoices
- Total paid
- Outstanding balance
- Recent invoices
- Quick create invoice for this client

---

## 10.4 Reports

Reports should be readable on mobile.

Required:

- Revenue summary
- Paid/unpaid invoice summary
- Client-wise revenue
- Date range filters
- Export/share options if backend supports

Use simple cards and charts.

Avoid complex tables on small screens. Use expandable rows/cards instead.

---

## 10.5 Reminders

If backend supports reminders:

- Reminder list
- Create reminder
- Reminder status
- Reminder schedule
- Reminder history
- Send manual reminder

Use clear status labels and human-readable dates.

---

## 10.6 Subscription and Plan Awareness

InvoMir has subscription plans:

- Free
- Starter
- Professional
- Business
- Yearly discount / two months free

Mobile app must show:

- Current plan
- Plan limits
- Usage progress
- Upgrade prompts
- Plan limit reached messages

Examples:

- Invoice limit reached
- Client limit reached
- Feature requires Professional plan

Do not make upgrade prompts annoying. Make them helpful and business-friendly.

If payment/subscription cannot be handled in mobile due to platform policy, show plan info and redirect to web billing page if appropriate.

---

## 10.7 Settings

Settings should include:

- Profile
- Company profile
- Logo
- Currency
- Language
- Tax percentage
- Invoice numbering settings
- Notification preferences
- Security/logout
- Help/support

Use clean grouped settings sections.

---

## 11. Internationalization and Localization

InvoMir supports multiple languages.

Requirements:

- No hardcoded user-facing strings
- Use translation keys
- Support RTL-ready layout where possible for Arabic/Urdu future support
- Currency formatting by selected currency
- Date formatting by locale
- Number formatting by locale

Design text layouts to handle longer translated strings.

---

## 12. Currency and Money Formatting

InvoMir supports multiple currencies.

Requirements:

- Use central money formatter
- Never manually concatenate currency symbols everywhere
- Support currencies such as USD, AED, SAR, PKR and others from backend config
- Show decimals consistently
- Align money values properly
- Dashboard totals must be easy to read

---

## 13. Forms and Validation

All forms must be professional and user-friendly.

Rules:

- Use React Hook Form
- Use validation schema
- Show inline validation errors
- Disable submit during API request
- Prevent double submit
- Preserve input where possible after validation error
- Use proper keyboard types
- Use date picker for dates
- Use bottom sheet/dropdown for client/currency/status selection
- Use confirmation dialogs for destructive actions

Form UX should be mobile-first and fast.

---

## 14. API Integration Rules

Use existing InvoMir API documentation.

Rules:

- Create central API client
- Attach auth token automatically
- Handle 401 globally
- Handle tenant headers/context if required
- Use typed DTOs
- Use React Query for server state
- Use optimistic updates only where safe
- Invalidate queries after create/update/delete
- Normalize API errors into user-friendly messages

Do not duplicate API call logic in screens.

---

## 15. Security Requirements

Mobile app must follow security best practices.

Required:

- Secure token storage
- No sensitive logs
- No API keys in source code
- Environment-based config
- Logout clears secure storage
- Session expiry handling
- Optional biometric unlock if planned
- Avoid exposing tenant/user IDs unnecessarily in UI
- Validate all user input

---

## 16. Performance Requirements

App must feel fast.

Requirements:

- Lazy-load screens where possible
- Use FlashList for long invoice/client lists
- Cache dashboard data using React Query
- Use pagination/infinite loading
- Avoid unnecessary re-renders
- Memoize expensive components
- Use optimized images/icons
- Avoid heavy chart libraries unless necessary
- Keep bundle size reasonable

Performance goals:

- Splash to login/home should feel quick
- Dashboard should show skeleton quickly
- Lists should scroll smoothly
- Form interactions should be instant

---

## 17. Accessibility Requirements

The app should be usable and professional.

Requirements:

- Proper touch target sizes
- Good color contrast
- Labels for inputs
- Accessible buttons/icons
- Font scaling support where possible
- Do not rely only on color for status
- Clear error messages

---

## 18. UX Writing and Text Guidelines

Use simple, clear, business-friendly text.

Examples:

Bad:
- Error occurred
- Invalid payload
- Action failed

Good:
- We couldn’t save this invoice. Please check your details and try again.
- Your session has expired. Please log in again.
- You’ve reached your invoice limit on the Free plan.

Tone:

- Professional
- Helpful
- Calm
- Clear
- Not childish
- Not overly casual

---

## 19. Important Screens to Design First

Before coding everything, create a screen plan and component plan for:

1. Splash screen
2. Welcome/onboarding screen
3. Login screen
4. Register screen
5. Dashboard
6. Invoice list
7. Invoice detail
8. Create invoice flow
9. Client list
10. Client detail
11. Reports
12. More/settings
13. Subscription plan screen
14. Empty states
15. Loading and error states

---

## 20. UI Component Library to Build

Create reusable components:

- AppButton
- AppText
- AppInput
- AppCard
- AppHeader
- AppScreen
- AppModal
- AppBottomSheet
- AppToast
- AppBadge
- StatusBadge
- MoneyText
- EmptyState
- ErrorState
- LoadingSkeleton
- ConfirmDialog
- SearchInput
- FilterChip
- DateRangePicker
- CurrencySelector
- LanguageSelector
- InvoiceCard
- ClientCard
- DashboardMetricCard
- PlanUsageCard

All components should follow the theme system.

---

## 21. Coding Standards

Follow these rules:

- TypeScript everywhere
- No business logic hidden inside UI components
- No hardcoded colors/spacings/font sizes
- No hardcoded API URLs
- No hardcoded user-facing text
- Use feature-based structure
- Use clean naming
- Use small reusable components
- Keep files focused
- Add comments only when logic is not obvious
- Use linting and formatting
- Handle loading/error/success states in every API screen

---

## 22. Development Flow

Before implementation, produce:

1. Mobile app requirement summary
2. Recommended React Native architecture
3. Final folder structure
4. Theme/design token plan
5. Navigation map
6. API integration plan
7. Screen-by-screen implementation plan
8. Component inventory
9. First milestone implementation plan

Then start implementation step by step.

Do not randomly create screens without confirming structure and reusable components first.

---

## 23. Milestone Plan

### Milestone 1 — Foundation

- Project setup
- TypeScript config
- Navigation
- Theme system
- Base components
- API client
- Auth storage
- Global providers

### Milestone 2 — Auth

- Splash
- Login
- Register
- Forgot password
- Token handling
- Session restore
- Logout

### Milestone 3 — Dashboard

- Dashboard API integration
- Metric cards
- Recent invoices
- Quick actions
- Loading/empty/error states

### Milestone 4 — Clients

- Client list
- Client detail
- Add/edit client
- Search/filter

### Milestone 5 — Invoices

- Invoice list
- Invoice detail
- Create/edit invoice
- Line items
- Preview
- Send/share/download

### Milestone 6 — Reports and Reminders

- Reports dashboard
- Charts
- Reminder workflows

### Milestone 7 — Settings and Subscription

- Profile
- Company settings
- Currency/language
- Plan usage
- Subscription screen

### Milestone 8 — Polish and Production

- Animations
- Accessibility
- Performance optimization
- Error handling
- QA checklist
- Build configuration

---

## 24. QA Checklist

Before considering the app complete, verify:

- Login works
- Register works
- Token restore works
- Logout clears session
- Dashboard loads correct tenant data
- Invoice list loads and paginates
- Invoice filters work
- Create invoice works
- Edit invoice works
- Invoice preview works
- Send/share/download works if supported
- Client create/edit works
- Reports load correctly
- Currency formatting is correct
- Language switching is supported
- Role permissions are respected
- Plan limits are shown correctly
- Network errors are handled
- Empty states are polished
- Loading states are polished
- App works on Android and iOS
- App works on small and large screens
- No sensitive data appears in logs

---

## 25. Final Instruction to Claude

Start by reading the existing InvoMir PRD, ERD, API documentation, web app implementation, and marketing website. Then create a complete mobile implementation plan before writing code.

After the plan, implement the React Native app step by step using the milestone approach above.

For every feature, prioritize:

1. Consistency with InvoMir brand
2. Mobile-first UX
3. Clean architecture
4. Reusable components
5. Secure API integration
6. Performance
7. Professional polish

Do not produce a basic demo app. Build it like a serious SaaS mobile application ready for real users.
