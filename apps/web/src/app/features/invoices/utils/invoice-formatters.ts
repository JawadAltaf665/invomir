import {
  InvoiceDiscountDto,
  InvoiceDiscountType,
  InvoiceItemInputDto,
  InvoicePaymentTerms,
  InvoiceStatus,
} from '../models/invoice.models';

export interface InvoiceDraftTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export function invoiceStatusLabel(status: string): string {
  return toTitleCase(status);
}

export function invoiceStatusClass(status: InvoiceStatus): string {
  const classByStatus: Record<InvoiceStatus, string> = {
    draft: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
    sent: 'bg-blue-50 text-blue-700 ring-blue-200',
    viewed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    overdue: 'bg-red-50 text-red-700 ring-red-200',
    cancelled: 'bg-neutral-100 text-neutral-500 ring-neutral-200',
  };

  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classByStatus[status]}`;
}

export function paymentTermsLabel(paymentTerms: InvoicePaymentTerms): string {
  const labelByTerms: Record<InvoicePaymentTerms, string> = {
    due_on_receipt: 'Due on receipt',
    net_7: 'Net 7',
    net_14: 'Net 14',
    net_30: 'Net 30',
  };

  return labelByTerms[paymentTerms];
}

export function discountTypeLabel(type: InvoiceDiscountType): string {
  return type === 'percent' ? 'Percent' : 'Fixed amount';
}

export function formatInvoiceCurrency(value: number, currency: string): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(safeValue)}`;
  }
}

export function formatInvoiceDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatInvoiceDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function calculateInvoiceDraftTotals(
  items: readonly InvoiceItemInputDto[],
  taxPercent: number | null | undefined,
  discount: InvoiceDiscountDto | null | undefined,
): InvoiceDraftTotals {
  const subtotal = roundCurrency(
    items.reduce(
      (sum, item) => sum + normalizeNumber(item.quantity) * normalizeNumber(item.unitPrice),
      0,
    ),
  );
  const discountAmount = calculateDiscountAmount(subtotal, discount);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = roundCurrency(taxableAmount * (normalizeNumber(taxPercent) / 100));
  const total = roundCurrency(taxableAmount + taxAmount);

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
  };
}

function calculateDiscountAmount(
  subtotal: number,
  discount: InvoiceDiscountDto | null | undefined,
): number {
  if (!discount || discount.value <= 0) {
    return 0;
  }

  if (discount.type === 'percent') {
    return roundCurrency(subtotal * (discount.value / 100));
  }

  return roundCurrency(Math.min(discount.value, subtotal));
}

function normalizeNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}
