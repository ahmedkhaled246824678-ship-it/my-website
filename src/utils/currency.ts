import { getCompanySettings } from './storage';

export interface CurrencyInfo {
  code: string;
  label: string;
  symbol: string;
  iso: string;
  flag: string;
  defaultRateToSAR: number; // سعر الصرف الافتراضي مقابل الريال السعودي (كم ريال يساوي 1 وحدة من هذه العملة)
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'ج.م', label: 'الجنيه المصري', symbol: 'ج.م', iso: 'EGP', flag: '🇪🇬', defaultRateToSAR: 0.078 },
  { code: 'ر.س', label: 'الريال السعودي', symbol: 'ر.س', iso: 'SAR', flag: '🇸🇦', defaultRateToSAR: 1.0 },
  { code: 'USD', label: 'الدولار الأمريكي', symbol: '$', iso: 'USD', flag: '🇺🇸', defaultRateToSAR: 3.75 },
  { code: 'EUR', label: 'اليورو الأوروبي', symbol: '€', iso: 'EUR', flag: '🇪🇺', defaultRateToSAR: 4.05 },
  { code: 'GBP', label: 'الجنيه الإسترليني', symbol: '£', iso: 'GBP', flag: '🇬🇧', defaultRateToSAR: 4.88 },
  { code: 'د.إ', label: 'الدرهم الإماراتي', symbol: 'د.إ', iso: 'AED', flag: '🇦🇪', defaultRateToSAR: 1.021 },
  { code: 'د.ك', label: 'الدينار الكويتي', symbol: 'د.ك', iso: 'KWD', flag: '🇰🇼', defaultRateToSAR: 12.24 },
  { code: 'ر.ق', label: 'الريال القطري', symbol: 'ر.ق', iso: 'QAR', flag: '🇶🇦', defaultRateToSAR: 1.03 },
  { code: 'د.ب', label: 'الدينار البحريني', symbol: 'د.ب', iso: 'BHD', flag: '🇧🇭', defaultRateToSAR: 9.95 },
  { code: 'ر.ع', label: 'الريال العماني', symbol: 'ر.ع', iso: 'OMR', flag: '🇴🇲', defaultRateToSAR: 9.75 },
  { code: 'د.أ', label: 'الدينار الأردني', symbol: 'د.أ', iso: 'JOD', flag: '🇯🇴', defaultRateToSAR: 5.29 },
  { code: 'TRY', label: 'الليرة التركية', symbol: '₺', iso: 'TRY', flag: '🇹🇷', defaultRateToSAR: 0.095 },
  { code: 'CNY', label: 'اليوان الصيني', symbol: '¥', iso: 'CNY', flag: '🇨🇳', defaultRateToSAR: 0.52 },
  { code: 'CHF', label: 'الفرنك السويسري', symbol: 'CHF', iso: 'CHF', flag: '🇨🇭', defaultRateToSAR: 4.25 },
  { code: 'CAD', label: 'الدولار الكندي', symbol: 'C$', iso: 'CAD', flag: '🇨🇦', defaultRateToSAR: 2.72 },
  { code: 'AUD', label: 'الدولار الأسترالي', symbol: 'A$', iso: 'AUD', flag: '🇦🇺', defaultRateToSAR: 2.45 },
  { code: 'INR', label: 'الروبية الهندية', symbol: '₹', iso: 'INR', flag: '🇮🇳', defaultRateToSAR: 0.043 },
  { code: 'د.ع', label: 'الدينار العراقي', symbol: 'د.ع', iso: 'IQD', flag: '🇮🇶', defaultRateToSAR: 0.0028 },
  { code: 'ر.ي', label: 'الريال اليمني', symbol: 'ر.ي', iso: 'YER', flag: '🇾🇪', defaultRateToSAR: 0.015 },
  { code: 'د.ت', label: 'الدينار التونسي', symbol: 'د.ت', iso: 'TND', flag: '🇹🇳', defaultRateToSAR: 1.21 },
  { code: 'د.م', label: 'الدرهم المغربي', symbol: 'د.م', iso: 'MAD', flag: '🇲🇦', defaultRateToSAR: 0.38 },
  { code: 'د.ج', label: 'الدينار الجزائري', symbol: 'د.ج', iso: 'DZD', flag: '🇩🇿', defaultRateToSAR: 0.028 },
  { code: 'ج.س', label: 'الجنيه السوداني', symbol: 'ج.س', iso: 'SDG', flag: '🇸🇩', defaultRateToSAR: 0.0062 },
];

const EXCHANGE_RATES_KEY = 'roeya_erp_custom_exchange_rates';
const EXCHANGE_META_KEY = 'roeya_erp_exchange_meta_rates';

export interface ExchangeMeta {
  lastUpdated: string; // ISO string
  lastDateFormatted: string; // Arabic formatted string
  source: string;
  isLive: boolean;
  autoDailyUpdate: boolean;
  baseCurrency: string;
}

export function getSystemCurrency(): string {
  try {
    const settings = getCompanySettings();
    return settings?.currency || 'ج.م';
  } catch {
    return 'ج.م';
  }
}

export function getCurrencyInfo(code: string): CurrencyInfo {
  const found = SUPPORTED_CURRENCIES.find(
    c => c.code === code || c.iso === code || c.symbol === code || c.label.includes(code)
  );
  if (found) return found;
  return {
    code: code || 'ج.م',
    label: `عملة (${code || 'ج.م'})`,
    symbol: code || 'ج.م',
    iso: code || 'CUSTOM',
    flag: '🌐',
    defaultRateToSAR: 1.0
  };
}

export function formatCurrency(amount: number, currency?: string): string {
  const curr = currency || getSystemCurrency();
  const numStr = (Number(amount) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${numStr} ${curr}`;
}

export function getExchangeRates(): Record<string, number> {
  try {
    const data = localStorage.getItem(EXCHANGE_RATES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return { ...getDefaultExchangeRates(), ...parsed };
      }
    }
  } catch {
    // ignore
  }
  return getDefaultExchangeRates();
}

export function getDefaultExchangeRates(): Record<string, number> {
  const defaultRates: Record<string, number> = {};
  SUPPORTED_CURRENCIES.forEach(c => {
    defaultRates[c.code] = c.defaultRateToSAR;
  });
  return defaultRates;
}

export function saveExchangeRates(rates: Record<string, number>): void {
  try {
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(rates));
  } catch {
    // ignore
  }
}

export function getExchangeMeta(): ExchangeMeta {
  try {
    const data = localStorage.getItem(EXCHANGE_META_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return {
    lastUpdated: new Date().toISOString(),
    lastDateFormatted: new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' - ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    source: 'الأسعار المحفوظة المعتمدة (تحديث وتحكم يدوي)',
    isLive: false,
    autoDailyUpdate: false,
    baseCurrency: 'SAR'
  };
}

export function saveExchangeMeta(meta: ExchangeMeta): void {
  try {
    localStorage.setItem(EXCHANGE_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

/**
 * جلب أسعار الصرف الحية اليومية مباشرة من واجهات البيانات المالية العالمية الحقيقية
 */
export async function fetchLiveDailyExchangeRates(baseCurrencyIso: string = 'SAR'): Promise<{
  success: boolean;
  rates: Record<string, number>;
  meta: ExchangeMeta;
  error?: string;
}> {
  try {
    let ratesMap: Record<string, number> = {};
    let isFetched = false;
    let successfulSource = '';

    // 1. مزود الأسعار الرئيسي: Open Exchange Rates / ExchangeRate-API
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        headers: { Accept: 'application/json' },
        cache: 'no-cache'
      });
      if (response.ok) {
        const json = await response.json();
        if (json && json.rates) {
          const usdRates = json.rates;
          const usdToSar = Number(usdRates['SAR']) || 3.75;

          SUPPORTED_CURRENCIES.forEach(curr => {
            const iso = curr.iso;
            if (iso === 'SAR') {
              ratesMap[curr.code] = 1.0;
            } else if (iso === 'USD') {
              ratesMap[curr.code] = Number(usdToSar.toFixed(4));
            } else if (usdRates[iso] && Number(usdRates[iso]) > 0) {
              // 1 Unit of Curr = (1 / usdRates[iso]) USD = (usdToSar / usdRates[iso]) SAR
              const rateInSar = usdToSar / Number(usdRates[iso]);
              ratesMap[curr.code] = Number(rateInSar.toFixed(4));
            } else {
              ratesMap[curr.code] = curr.defaultRateToSAR;
            }
          });
          isFetched = true;
          successfulSource = 'مؤشرات أسواق الصرف العالمية الحقيقية (Open Exchange Live)';
        }
      }
    } catch (e) {
      console.warn('API Provider 1 failed, trying Provider 2 fallback...');
    }

    // 2. مزود الأسعار الاحتياطي 1: ExchangeRate-API Standard
    if (!isFetched) {
      try {
        const response2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          headers: { Accept: 'application/json' },
          cache: 'no-cache'
        });
        if (response2.ok) {
          const json2 = await response2.json();
          if (json2 && json2.rates) {
            const usdRates = json2.rates;
            const usdToSar = Number(usdRates['SAR']) || 3.75;
            SUPPORTED_CURRENCIES.forEach(curr => {
              const iso = curr.iso;
              if (iso === 'SAR') {
                ratesMap[curr.code] = 1.0;
              } else if (iso === 'USD') {
                ratesMap[curr.code] = Number(usdToSar.toFixed(4));
              } else if (usdRates[iso] && Number(usdRates[iso]) > 0) {
                const rateInSar = usdToSar / Number(usdRates[iso]);
                ratesMap[curr.code] = Number(rateInSar.toFixed(4));
              } else {
                ratesMap[curr.code] = curr.defaultRateToSAR;
              }
            });
            isFetched = true;
            successfulSource = 'سوق الصرف الفوري العالمي (ExchangeRate-API Live)';
          }
        }
      } catch (e2) {
        console.warn('API Provider 2 fallback failed, trying Provider 3...');
      }
    }

    // 3. مزود الأسعار الاحتياطي 2: FawazAhmed Currency API (CDN)
    if (!isFetched) {
      try {
        const response3 = await fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json', {
          headers: { Accept: 'application/json' },
          cache: 'no-cache'
        });
        if (response3.ok) {
          const json3 = await response3.json();
          const usdData = json3?.usd || json3;
          if (usdData && typeof usdData === 'object') {
            const usdToSar = Number(usdData['sar']) || 3.75;
            SUPPORTED_CURRENCIES.forEach(curr => {
              const isoLower = curr.iso.toLowerCase();
              if (curr.iso === 'SAR') {
                ratesMap[curr.code] = 1.0;
              } else if (curr.iso === 'USD') {
                ratesMap[curr.code] = Number(usdToSar.toFixed(4));
              } else if (usdData[isoLower] && Number(usdData[isoLower]) > 0) {
                const rateInSar = usdToSar / Number(usdData[isoLower]);
                ratesMap[curr.code] = Number(rateInSar.toFixed(4));
              } else {
                ratesMap[curr.code] = curr.defaultRateToSAR;
              }
            });
            isFetched = true;
            successfulSource = 'الشبكة العالمية لمؤشرات العملات والبنوك المركزية (Global Currency FX)';
          }
        }
      } catch (e3) {
        console.warn('API Provider 3 failed');
      }
    }

    if (!isFetched) {
      ratesMap = getExchangeRates();
      const currentMeta = getExchangeMeta();
      return {
        success: false,
        rates: ratesMap,
        meta: currentMeta,
        error: 'تعذر الاتصال المباشر بخادم أسعار الصرف الحية، تم الحفاظ على آخر أسعار مسجلة.'
      };
    }

    // حفظ الأسعار الحقيقية المحدثة
    saveExchangeRates(ratesMap);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' الساعة ' + now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const newMeta: ExchangeMeta = {
      lastUpdated: now.toISOString(),
      lastDateFormatted: dateFormatted,
      source: successfulSource || 'مؤشرات أسواق الصرف والبنوك العالمية المباشرة (Live Daily FX)',
      isLive: true,
      autoDailyUpdate: true,
      baseCurrency: 'SAR'
    };

    saveExchangeMeta(newMeta);

    return {
      success: true,
      rates: ratesMap,
      meta: newMeta
    };
  } catch (error: any) {
    return {
      success: false,
      rates: getExchangeRates(),
      meta: getExchangeMeta(),
      error: error?.message || 'حدث خطأ أثناء جلب أسعار الصرف الحية.'
    };
  }
}

/**
 * تحويل مبلغ مالي بين أي عملتين بناء على أسعار الصرف المعتمدة
 */
export function convertCurrency(
  amount: number,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  customRates?: Record<string, number>
): number {
  if (fromCurrencyCode === toCurrencyCode) return amount;

  const rates = customRates || getExchangeRates();
  
  // سعر الصرف مقابل الريال السعودي
  const fromRateToSAR = rates[fromCurrencyCode] || getCurrencyInfo(fromCurrencyCode).defaultRateToSAR || 1.0;
  const toRateToSAR = rates[toCurrencyCode] || getCurrencyInfo(toCurrencyCode).defaultRateToSAR || 1.0;

  // المبلغ بالريال السعودي
  const amountInSAR = amount * fromRateToSAR;
  // المبلغ بالعملة الهدف
  const converted = amountInSAR / toRateToSAR;

  return Number(converted.toFixed(4));
}
