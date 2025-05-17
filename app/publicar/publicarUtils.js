// Utility functions for publicar page
export function formatNumber(num) {
  if (!num) return '0';
  let [integerPart, decimalPart] = num.toString().split('.');
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}
