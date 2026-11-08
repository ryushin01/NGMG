export const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY', 'GBP'] as const;

export const CURRENCY_LABELS: Record<string, string> = {
  KRW: '원',
  USD: '달러',
  EUR: '유로',
  JPY: '엔',
  CNY: '위안',
  GBP: '파운드',
};

export const formatMoney = (amount: number, currency: string) =>
  `${amount.toLocaleString('ko-KR')}${CURRENCY_LABELS[currency] ?? ` ${currency}`}`;
