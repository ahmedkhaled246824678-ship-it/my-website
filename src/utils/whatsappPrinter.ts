/**
 * WhatsApp Print-Friendly Formatter Utility
 * يقوم بتنسيق التقارير والكشوفات بصيغة معيارية مهيكلة تتيح الطباعة والمراجعة الرسمية المباشرة من الواتساب
 */

export interface WhatsAppReportOptions {
  title: string;
  entityName?: string;
  entityCode?: string;
  date?: string;
  period?: string;
  currency?: string;
  openingBalance?: number;
  totalDebit?: number;
  totalCredit?: number;
  closingBalance?: number;
  headers?: string[];
  rows?: (string | number)[][];
  items?: string[];
  totals?: { label: string; value: string | number }[];
  notes?: string;
  footer?: string;
}

/**
 * دالة لتنسيق أي كشف أو تقرير بصيغة طباعية جاهزة ومحكمة للواتساب
 */
export const formatWhatsAppReport = (opts: WhatsAppReportOptions): string => {
  const dateStr = opts.date || new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const curr = opts.currency || 'ر.س';

  let msg = `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🏛️ *نظام الرؤية المحاسبي الشامل - ERP*\n`;
  msg += `📑 *${opts.title}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📅 *التاريخ:* ${dateStr} | ${timeStr}\n`;
  if (opts.period) {
    msg += `🗓️ *الفترة:* ${opts.period}\n`;
  }

  if (opts.entityName) {
    msg += `👤 *الجهة/الحساب:* ${opts.entityName}`;
    if (opts.entityCode) msg += ` (${opts.entityCode})`;
    msg += `\n`;
  }
  msg += `💰 *عملة التقرير:* ${curr}\n`;
  msg += `──────────────────────\n`;

  // في حال وجود رصيد افتتاحي وحركات
  if (opts.openingBalance !== undefined) {
    msg += `🔹 *الرصيد الافتتاحي:* ${opts.openingBalance.toLocaleString()} ${curr}\n`;
  }
  if (opts.totalDebit !== undefined) {
    msg += `📥 *إجمالي المدين / الوارد:* ${opts.totalDebit.toLocaleString()} ${curr}\n`;
  }
  if (opts.totalCredit !== undefined) {
    msg += `📤 *إجمالي الدائن / المنصرف:* ${opts.totalCredit.toLocaleString()} ${curr}\n`;
  }
  if (opts.closingBalance !== undefined) {
    msg += `💎 *صافي الرصيد الختامي:* ${opts.closingBalance.toLocaleString()} ${curr}\n`;
    msg += `──────────────────────\n`;
  }

  // في حال وجود قائمة بنود مباشرة
  if (opts.items && opts.items.length > 0) {
    opts.items.forEach((item) => {
      msg += `▫️ ${item}\n`;
    });
    msg += `──────────────────────\n`;
  }

  // في حال وجود جدول أعمدة وصفوف
  if (opts.headers && opts.rows && opts.rows.length > 0) {
    msg += `📋 *التفاصيل والبيانات:* \n`;
    opts.rows.forEach((row, idx) => {
      msg += `\n*(${idx + 1}) ${row[0] || ''}*\n`;
      opts.headers!.slice(1).forEach((header, colIdx) => {
        const val = row[colIdx + 1] !== undefined ? row[colIdx + 1] : '-';
        msg += `   ▪ ${header}: ${val}\n`;
      });
    });
    msg += `──────────────────────\n`;
  }

  // المجاميع والإجماليات
  if (opts.totals && opts.totals.length > 0) {
    msg += `📊 *المجاميع والأرصدة النهائية:*\n`;
    opts.totals.forEach((t) => {
      msg += `🔹 *${t.label}:* ${typeof t.value === 'number' ? t.value.toLocaleString() : t.value} ${curr}\n`;
    });
    msg += `──────────────────────\n`;
  }

  // الملاحظات
  if (opts.notes) {
    msg += `📝 *ملاحظات واعتماد:* \n${opts.notes}\n`;
    msg += `──────────────────────\n`;
  }

  msg += `🖨️ _تم استخراج هذا السند رسمياً وهو معتمد للطباعة والمطابقة._\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━`;

  return msg;
};

/**
 * إرسال الرسالة إلى رقم واتساب مباشرة عبر الرابط المعتمد
 */
export const sendWhatsAppMessage = (phone: string, text: string) => {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
};
