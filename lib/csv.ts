const escapeCell = (value: string): string => {
  const normalized = value.replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
};

export const toCsv = (headers: string[], rows: string[][]): string => {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCell(cell)).join(","));
  }
  return `${lines.join("\n")}\n`;
};


