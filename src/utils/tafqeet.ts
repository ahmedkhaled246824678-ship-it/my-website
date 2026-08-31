/**
 * أداة تحويل الأرقام والمبالغ المالية إلى كلمات وحروف باللغة العربية (التفقيط المحاسبي)
 * Tafqeet Utility: Converts financial numbers into precise Arabic written words
 */

export interface CurrencyConfig {
  singular: string;      // ريال
  plural: string;        // ريالات
  dual: string;          // ريالان
  fractionSingular: string; // هللة
  fractionPlural: string;   // هللات
  fractionDual: string;     // هللتان
  fractionsCount: number;   // 100
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  'ر.س': {
    singular: 'ريال سعودي',
    plural: 'ريالات سعودية',
    dual: 'ريالان سعوديان',
    fractionSingular: 'هللة',
    fractionPlural: 'هللات',
    fractionDual: 'هللتان',
    fractionsCount: 100
  },
  'SAR': {
    singular: 'ريال سعودي',
    plural: 'ريالات سعودية',
    dual: 'ريالان سعوديان',
    fractionSingular: 'هللة',
    fractionPlural: 'هللات',
    fractionDual: 'هللتان',
    fractionsCount: 100
  },
  'USD': {
    singular: 'دولار أمريكي',
    plural: 'دولارات أمريكية',
    dual: 'دولاران أمريكيان',
    fractionSingular: 'سنت',
    fractionPlural: 'سنتات',
    fractionDual: 'سنتان',
    fractionsCount: 100
  },
  '$': {
    singular: 'دولار أمريكي',
    plural: 'دولارات أمريكية',
    dual: 'دولاران أمريكيان',
    fractionSingular: 'سنت',
    fractionPlural: 'سنتات',
    fractionDual: 'سنتان',
    fractionsCount: 100
  },
  'EUR': {
    singular: 'يورو أوروبي',
    plural: 'يورو',
    dual: 'يوروان',
    fractionSingular: 'سنت',
    fractionPlural: 'سنتات',
    fractionDual: 'سنتان',
    fractionsCount: 100
  },
  '€': {
    singular: 'يورو أوروبي',
    plural: 'يورو',
    dual: 'يوروان',
    fractionSingular: 'سنت',
    fractionPlural: 'سنتات',
    fractionDual: 'سنتان',
    fractionsCount: 100
  },
  'ج.م': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'ج.م.': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'جنيه': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'الجنيه': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'الجنيه المصري': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'EGP': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'LE': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'L.E': {
    singular: 'جنيه مصري',
    plural: 'جنيهات مصرية',
    dual: 'جنيهان مصريان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  },
  'د.إ': {
    singular: 'درهم إماراتي',
    plural: 'دراهم إماراتية',
    dual: 'درهمان إماراتيان',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionDual: 'فلسان',
    fractionsCount: 100
  },
  'AED': {
    singular: 'درهم إماراتي',
    plural: 'دراهم إماراتية',
    dual: 'درهمان إماراتيان',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionDual: 'فلسان',
    fractionsCount: 100
  },
  'د.ك': {
    singular: 'دينار كويتي',
    plural: 'دنانير كويتية',
    dual: 'ديناران كويتيان',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionDual: 'فلسان',
    fractionsCount: 1000
  },
  'KWD': {
    singular: 'دينار كويتي',
    plural: 'دنانير كويتية',
    dual: 'ديناران كويتيان',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionDual: 'فلسان',
    fractionsCount: 1000
  },
  'ر.ق': {
    singular: 'ريال قطري',
    plural: 'ريالات قطرية',
    dual: 'ريالان قطريان',
    fractionSingular: 'درهم',
    fractionPlural: 'دراهم',
    fractionDual: 'درهمان',
    fractionsCount: 100
  },
  'د.ب': {
    singular: 'دينار بحريني',
    plural: 'دنانير بحرينية',
    dual: 'ديناران بحرينيان',
    fractionSingular: 'فلس',
    fractionPlural: 'فلوس',
    fractionDual: 'فلسان',
    fractionsCount: 1000
  },
  'ر.ع': {
    singular: 'ريال عماني',
    plural: 'ريالات عمانية',
    dual: 'ريالان عمانيان',
    fractionSingular: 'بيسة',
    fractionPlural: 'بيسات',
    fractionDual: 'بيستان',
    fractionsCount: 1000
  },
  'د.أ': {
    singular: 'دينار أردني',
    plural: 'دنانير أردنية',
    dual: 'ديناران أردنيان',
    fractionSingular: 'قرش',
    fractionPlural: 'قروش',
    fractionDual: 'قرشان',
    fractionsCount: 100
  }
};

const ones = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر'
];

const tens = [
  '',
  'عشرة',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون'
];

const hundreds = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة'
];

const scales = [
  '',
  'ألف',
  'مليون',
  'مليار',
  'تريليون'
];

const scalesPlural = [
  '',
  'آلاف',
  'ملايين',
  'مليارات',
  'تريليونات'
];

const scalesDual = [
  '',
  'ألفان',
  'مليونان',
  'ملياران',
  'تريليونان'
];

function convertGroup(n: number): string {
  let res = '';
  const h = Math.floor(n / 100);
  const remainder = n % 100;

  if (h > 0) {
    res += hundreds[h];
  }

  if (remainder > 0) {
    if (res !== '') res += ' و';
    if (remainder < 20) {
      res += ones[remainder];
    } else {
      const o = remainder % 10;
      const t = Math.floor(remainder / 10);
      if (o > 0) {
        res += ones[o] + ' و' + tens[t];
      } else {
        res += tens[t];
      }
    }
  }

  return res;
}

/**
 * تحويل عدد صحيح إلى كلمات عربية
 */
export function integerToWords(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + integerToWords(Math.abs(num));

  let n = Math.floor(num);
  const groups: number[] = [];

  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const parts: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;

    const scale = scales[i];
    const scalePlural = scalesPlural[i];
    const scaleDual = scalesDual[i];

    if (i === 0) {
      parts.push(convertGroup(g));
    } else if (g === 1) {
      parts.push(scale);
    } else if (g === 2) {
      parts.push(scaleDual);
    } else if (g >= 3 && g <= 10) {
      parts.push(convertGroup(g) + ' ' + scalePlural);
    } else {
      parts.push(convertGroup(g) + ' ' + scale);
    }
  }

  return parts.join(' و');
}

/**
 * تحويل المبلغ المالي كاملاً إلى كلمات مع العملة والكسور (تفقيط محاسبي معتمد)
 * مثال: tafqeet(1520.50, 'ج.م') -> "فقط ألف وخمسمائة وعشرون جنيهاً مصرياً وخمسون قرشاً لا غير"
 */
export function tafqeet(amount: number, currencyCode: string = 'ج.م'): string {
  if (isNaN(amount) || amount === 0) {
    return 'فقط صفر لا غير';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  
  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS['ج.م'] || {
    singular: currencyCode,
    plural: currencyCode,
    dual: currencyCode,
    fractionSingular: 'جزء',
    fractionPlural: 'أجزاء',
    fractionDual: 'جزآن',
    fractionsCount: 100
  };

  const fractionMultiplier = config.fractionsCount;
  const fractionPart = Math.round((absAmount - integerPart) * fractionMultiplier);

  let result = 'فقط ';
  if (isNegative) {
    result += 'سالب ';
  }

  if (integerPart > 0) {
    const intWords = integerToWords(integerPart);
    let currencyWord = config.singular;
    if (integerPart === 1) {
      currencyWord = config.singular;
    } else if (integerPart === 2) {
      currencyWord = config.dual;
    } else if (integerPart >= 3 && integerPart <= 10) {
      currencyWord = config.plural;
    } else {
      currencyWord = config.singular;
    }

    if (integerPart === 1) {
      result += config.singular;
    } else if (integerPart === 2) {
      result += config.dual;
    } else {
      result += `${intWords} ${currencyWord}`;
    }
  }

  if (fractionPart > 0) {
    const fracWords = integerToWords(fractionPart);
    let fractionUnit = config.fractionSingular;
    if (fractionPart === 1) {
      fractionUnit = config.fractionSingular;
    } else if (fractionPart === 2) {
      fractionUnit = config.fractionDual;
    } else if (fractionPart >= 3 && fractionPart <= 10) {
      fractionUnit = config.fractionPlural;
    } else {
      fractionUnit = config.fractionSingular;
    }

    if (integerPart > 0) {
      result += ' و';
    }

    if (fractionPart === 1) {
      result += config.fractionSingular;
    } else if (fractionPart === 2) {
      result += config.fractionDual;
    } else {
      result += `${fracWords} ${fractionUnit}`;
    }
  }

  result += ' لا غير';
  return result;
}

/**
 * بنك الكلمات ونماذج الشروحات المحاسبية الجاهزة للقيود اليومية
 */
export interface JournalWordTemplate {
  id?: string;
  category: string;
  title: string;
  description: string;
  keywords?: string[];
  suggestedDebitAccountType?: string;
  suggestedCreditAccountType?: string;
}

export const JOURNAL_DESCRIPTION_TEMPLATES: JournalWordTemplate[] = [
  {
    id: 'tmpl-1',
    category: 'موردين ومدفوعات',
    title: 'سداد دفعة للمورد',
    description: 'سداد دفعة نقدية / تحويل بنكي للمورد بموجب الفاتورة رقم ...',
    keywords: ['سداد', 'مورد', 'دفعة', 'فاتورة', 'تحويل']
  },
  {
    id: 'tmpl-2',
    category: 'موردين ومدفوعات',
    title: 'سداد كامل مستحقات مورد',
    description: 'سداد كامل رصيد ومستحقات المورد وإقفال الحساب حتى تاريخه',
    keywords: ['إقفال', 'مورد', 'سداد كامل', 'مستحقات']
  },
  {
    id: 'tmpl-3',
    category: 'عملاء ومقبوضات',
    title: 'تحصيل دفعة من عميل',
    description: 'تحصيل دفعة نقدية / إيداع بنكي من العميل لحساب الفاتورة رقم ...',
    keywords: ['تحصيل', 'عميل', 'إيداع', 'فاتورة', 'دفعة']
  },
  {
    id: 'tmpl-4',
    category: 'عملاء ومقبوضات',
    title: 'تحصيل كامل حساب عميل',
    description: 'تحصيل كامل المستحق على العميل وإيداع المبلغ في الحساب البنكي',
    keywords: ['تحصيل كامل', 'عميل', 'إيداع بنكي']
  },
  {
    id: 'tmpl-5',
    category: 'رواتب وأجور',
    title: 'صرف مسيرات الرواتب',
    description: 'صرف مسير رواتب وأجور الموظفين والعمال لشهر ...',
    keywords: ['رواتب', 'أجور', 'مسير', 'عمال', 'موظفين']
  },
  {
    id: 'tmpl-6',
    category: 'رواتب وأجور',
    title: 'صرف سلفة لموظف',
    description: 'صرف سلفة مستردة للموظف تخصم من الراتب الشهري القادم',
    keywords: ['سلفة', 'موظف', 'خصم راتب']
  },
  {
    id: 'tmpl-7',
    category: 'عهد ومصروفات',
    title: 'تسوية وإقفال عهدة',
    description: 'تسوية عهدة موظف بموجب فواتير ومستندات الصرف المعتمدة',
    keywords: ['تسوية', 'عهدة', 'مصروفات', 'فواتير']
  },
  {
    id: 'tmpl-8',
    category: 'عهد ومصروفات',
    title: 'تغذية صندوق العهدة',
    description: 'تغذية صندوق العهدة النثرية بشيك / تحويل بنكي لاستمرار المصروفات',
    keywords: ['تغذية', 'صندوق', 'عهدة نثرية', 'شيك']
  },
  {
    id: 'tmpl-9',
    category: 'إيجارات ومرافق',
    title: 'سداد إيجار المقر / المعرض',
    description: 'سداد دفعة إيجار المقر / المستودع عن الفترة من ... إلى ...',
    keywords: ['إيجار', 'مقر', 'معرض', 'مستودع']
  },
  {
    id: 'tmpl-10',
    category: 'إيجارات ومرافق',
    title: 'سداد فواتير الخدمات',
    description: 'سداد فواتير الكهرباء والماء والإنترنت والهاتف عن الشهر الحالي',
    keywords: ['كهرباء', 'ماء', 'إنترنت', 'هاتف', 'فواتير']
  },
  {
    id: 'tmpl-11',
    category: 'بنوك وتحويلات',
    title: 'تحويل بين الحسابات البنكية',
    description: 'تحويل رصيد نقدي بين حسابات الشركة البنكية لتغطية العمليات',
    keywords: ['تحويل بنكي', 'بين الحسابات', 'تغطية']
  },
  {
    id: 'tmpl-12',
    category: 'بنوك وتحويلات',
    title: 'إيداع نقدي بالبنك',
    description: 'إيداع نقدي محصل من المبيعات اليومية في الحساب البنكي',
    keywords: ['إيداع', 'نقدي', 'مبيعات يومية', 'بنك']
  },
  {
    id: 'tmpl-13',
    category: 'بنوك وتحويلات',
    title: 'سحب نقدي للصندوق',
    description: 'سحب نقدي من البنك لتغذية خزينة النقدية الرئيسية',
    keywords: ['سحب نقدي', 'خزينة', 'صندوق', 'تغذية']
  },
  {
    id: 'tmpl-14',
    category: 'ضرائب ورسوم',
    title: 'سداد ضريبة القيمة المضافة',
    description: 'سداد إقرار ضريبة القيمة المضافة لهيئة الزكاة والضريبة والجمارك',
    keywords: ['ضريبة', 'القيمة المضافة', 'زكاة', 'إقرار']
  },
  {
    id: 'tmpl-15',
    category: 'ضرائب ورسوم',
    title: 'سداد رسوم حكومية وتراخيص',
    description: 'سداد رسوم تجديد السجل التجاري / الغرفة التجارية / الرخص البلدية',
    keywords: ['رسوم حكومية', 'سجل تجاري', 'غرفة تجارية', 'رخص بلدية']
  },
  {
    id: 'tmpl-16',
    category: 'أصول وتسويات',
    title: 'إثبات قسط استهلاك أصول',
    description: 'إثبات مخصص وقسط استهلاك الأصول الثابتة السنوي / الشهري',
    keywords: ['استهلاك', 'أصول ثابتة', 'إهلاك', 'مخصص']
  }
];

/**
 * الكلمات والعبارات المحاسبية المفتاحية السريعة
 */
export const QUICK_ACCOUNTING_WORDS = [
  'سداد',
  'تحصيل',
  'صرف رواتب',
  'سلفة موظف',
  'تسوية عهدة',
  'سداد إيجار',
  'فواتير كهرباء ومياه',
  'تحويل بنكي',
  'إيداع نقدي',
  'سحب نقدي',
  'مشتريات بضاعة',
  'مبيعات نقدية',
  'رسوم حكومية',
  'ضريبة القيمة المضافة',
  'مصروفات صيانة وتصليح',
  'نقل وشحن ومناولة',
  'دعاية وإعلان وتسويق',
  'عمولات ورسوم بنكية',
  'إثبات استهلاك أصول',
  'مردودات ومسموحات'
];
