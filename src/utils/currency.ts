/**
 * Currency and Number Formatting using Indian Numbering System (₹)
 */

export function formatIndianCurrency(amount: number | null | undefined, compact = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (compact && absAmount >= 10000000) {
    const crores = (absAmount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${isNegative ? '-' : ''}₹${crores} Cr`;
  }

  if (compact && absAmount >= 100000) {
    const lakhs = (absAmount / 100000).toFixed(2).replace(/\.00$/, '');
    return `${isNegative ? '-' : ''}₹${lakhs} L`;
  }

  if (compact && absAmount >= 1000) {
    const thousands = (absAmount / 1000).toFixed(1).replace(/\.0$/, '');
    return `${isNegative ? '-' : ''}₹${thousands} k`;
  }

  // Exact Indian Currency Formatting: ₹1,25,000
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(absAmount);
    return isNegative ? `-${formatted}` : formatted;
  } catch {
    // Fallback Indian numbering format regex
    const str = Math.round(absAmount).toString();
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const withCommas = otherNumbers !== '' ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
    return `${isNegative ? '-' : ''}₹${withCommas}`;
  }
}

/**
 * Format date for display: "24 Oct 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format relative or short date: "Today", "Yesterday", "24 Oct"
 */
export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const today = new Date().toISOString().split('T')[0];
    if (dateString === today) return 'Today';
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}
