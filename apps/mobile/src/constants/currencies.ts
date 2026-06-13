export type SupportedCurrency = 'USD' | 'PKR' | 'AED' | 'GBP' | 'EUR' | 'SAR';

export const supportedCurrencies: readonly SupportedCurrency[] = [
  'USD',
  'PKR',
  'AED',
  'GBP',
  'EUR',
  'SAR',
] as const;

export const currencyHelpers: Record<SupportedCurrency, string> = {
  USD: 'US dollar',
  PKR: 'Pakistani rupee',
  AED: 'UAE dirham',
  GBP: 'British pound',
  EUR: 'Euro',
  SAR: 'Saudi riyal',
};
