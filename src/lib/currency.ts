const currencyConfig: Record<string, { locale: string; symbol: string }> = {
  BRL: { locale: "pt-BR", symbol: "R$" },
  USD: { locale: "en-US", symbol: "$" },
  EUR: { locale: "de-DE", symbol: "€" },
  GBP: { locale: "en-GB", symbol: "£" },
};

export function formatCurrency(value: number, currencyCode: string = "BRL"): string {
  const config = currencyConfig[currencyCode] || currencyConfig.BRL;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  } catch {
    return `${config.symbol} ${value.toLocaleString()}`;
  }
}
