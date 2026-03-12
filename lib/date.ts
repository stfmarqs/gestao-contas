export const toIsoDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida.");
  }
  return date.toISOString();
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDatePt = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(value));


