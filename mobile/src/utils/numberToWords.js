/**
 * Currency Number to Words Converter for Mobile App
 * Supports GCC (BHD, SAR, AED, QAR, KWD, OMR), India (INR), and International currencies.
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertThreeDigit(num) {
  let str = '';
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    str += ONES[hundreds] + ' Hundred';
    if (remainder > 0) str += ' and ';
  }

  if (remainder > 0) {
    if (remainder < 20) {
      str += ONES[remainder];
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      str += TENS[ten];
      if (one > 0) str += '-' + ONES[one];
    }
  }

  return str;
}

export function numberToWords(amount, currencyCode = 'BHD') {
  const num = parseFloat(amount);
  if (isNaN(num) || num === 0) return 'Zero';

  const code = (currencyCode || 'BHD').toUpperCase();
  const is3Dec = ['BHD', 'KWD', 'OMR'].includes(code);
  const decimals = is3Dec ? 3 : 2;

  const parts = Math.abs(num).toFixed(decimals).split('.');
  const integerPart = parseInt(parts[0], 10);
  const fractionalPart = parseInt(parts[1], 10);

  const currencyConfigs = {
    BHD: { mainSingle: 'Bahraini Dinar', mainPlural: 'Bahraini Dinars', subSingle: 'Fils', subPlural: 'Fils' },
    KWD: { mainSingle: 'Kuwaiti Dinar', mainPlural: 'Kuwaiti Dinars', subSingle: 'Fils', subPlural: 'Fils' },
    OMR: { mainSingle: 'Omani Rial', mainPlural: 'Omani Rials', subSingle: 'Baisa', subPlural: 'Baisa' },
    SAR: { mainSingle: 'Saudi Riyal', mainPlural: 'Saudi Riyals', subSingle: 'Halala', subPlural: 'Halalas' },
    AED: { mainSingle: 'UAE Dirham', mainPlural: 'UAE Dirhams', subSingle: 'Fils', subPlural: 'Fils' },
    QAR: { mainSingle: 'Qatari Riyal', mainPlural: 'Qatari Riyals', subSingle: 'Dirham', subPlural: 'Dirhams' },
    INR: { mainSingle: 'Indian Rupee', mainPlural: 'Indian Rupees', subSingle: 'Paise', subPlural: 'Paise' },
    USD: { mainSingle: 'US Dollar', mainPlural: 'US Dollars', subSingle: 'Cent', subPlural: 'Cents' },
    EUR: { mainSingle: 'Euro', mainPlural: 'Euros', subSingle: 'Cent', subPlural: 'Cents' },
    GBP: { mainSingle: 'British Pound', mainPlural: 'British Pounds', subSingle: 'Pence', subPlural: 'Pence' }
  };

  const config = currencyConfigs[code] || {
    mainSingle: code,
    mainPlural: code,
    subSingle: 'Cent',
    subPlural: 'Cents'
  };

  let words = '';

  if (integerPart === 0) {
    words = 'Zero ' + config.mainPlural;
  } else {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;

    let result = [];
    if (billions > 0) result.push(convertThreeDigit(billions) + ' Billion');
    if (millions > 0) result.push(convertThreeDigit(millions) + ' Million');
    if (thousands > 0) result.push(convertThreeDigit(thousands) + ' Thousand');
    if (remainder > 0) result.push(convertThreeDigit(remainder));

    const mainUnit = integerPart === 1 ? config.mainSingle : config.mainPlural;
    words = result.join(', ') + ' ' + mainUnit;
  }

  if (fractionalPart > 0) {
    const subUnit = fractionalPart === 1 ? config.subSingle : config.subPlural;
    const fractionWords = convertThreeDigit(fractionalPart);
    words += ' and ' + fractionWords + ' ' + subUnit;
  }

  return words + ' Only';
}
