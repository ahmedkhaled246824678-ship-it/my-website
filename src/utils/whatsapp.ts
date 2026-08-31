/**
 * Utility to format and send WhatsApp messages directly from the ERP
 */

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If starts with 0 (e.g. 0501234567 in Saudi Arabia), convert to 966501234567
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.slice(1);
  } else if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '966' + cleaned.slice(1);
  } else if (cleaned.startsWith('010') || cleaned.startsWith('011') || cleaned.startsWith('012') || cleaned.startsWith('015')) {
    if (cleaned.length === 11) {
      cleaned = '20' + cleaned.slice(1);
    }
  }
  return cleaned;
}

export function openWhatsApp(phone?: string, message: string = ''): void {
  const cleaned = phone ? cleanPhoneNumber(phone) : '';
  const encoded = encodeURIComponent(message);
  // إذا تم تحديد رقم يتم فتح المحادثة مباشرة، وإذا لم يُحدد يتم فتح واتساب العام لاختيار أي مرسل إليه من قائمة المحادثات
  const url = cleaned ? `https://wa.me/${cleaned}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}

/**
 * فتح واتساب العام مباشرة وإظهار قائمة جهات الاتصال والمحادثات لاختيار المرسل إليه
 */
export function openGeneralWhatsApp(message: string): void {
  const encoded = encodeURIComponent(message);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}

export interface StatementData {
  companyName: string;
  accountName: string;
  accountCode?: string;
  phone?: string;
  currency: string;
  currentBalance: number;
  type: 'customer' | 'supplier' | 'employee' | 'custody' | 'site';
  date?: string;
  details?: string[];
}

export function generateStatementWhatsAppMessage(data: StatementData): string {
  const isNegative = data.currentBalance < 0;
  const absBal = Math.abs(data.currentBalance).toLocaleString();
  const dateStr = data.date || new Date().toISOString().slice(0, 10);

  let balanceText = '';
  if (data.type === 'customer') {
    balanceText = data.currentBalance > 0 
      ? `📈 الرصيد المستحق عليكم (مدين): *${absBal} ${data.currency}*` 
      : data.currentBalance < 0 
      ? `📉 رصيد دائن لكم: *${absBal} ${data.currency}*` 
      : `✅ الحساب متزن (0 ${data.currency})`;
  } else if (data.type === 'supplier') {
    balanceText = data.currentBalance < 0 
      ? `📉 الرصيد المستحق لكم طرفنا (دائن): *${absBal} ${data.currency}*` 
      : data.currentBalance > 0 
      ? `📈 رصيد مدين طرفكم: *${absBal} ${data.currency}*` 
      : `✅ الحساب متزن (0 ${data.currency})`;
  } else if (data.type === 'custody') {
    balanceText = `💼 الرصيد المتبقي طرفكم من العهدة: *${absBal} ${data.currency}*`;
  } else if (data.type === 'employee') {
    balanceText = `💳 الرصيد المتبقي من السلفة: *${absBal} ${data.currency}*`;
  } else {
    balanceText = `📊 صافي الرصيد: *${absBal} ${data.currency}*`;
  }

  let text = `*🏛️ ${data.companyName}*\n`;
  text += `*📄 كشف حساب رسمي ومطابقة أرصدة*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 *الاسم / الحساب:* ${data.accountName}\n`;
  if (data.accountCode) text += `🔢 *كود الحساب:* ${data.accountCode}\n`;
  text += `📅 *تاريخ التقرير:* ${dateStr}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `${balanceText}\n`;

  if (data.details && data.details.length > 0) {
    text += `\n*📋 ملخص البنود والعمليات الأخيرة:*\n`;
    data.details.forEach(item => {
      text += `• ${item}\n`;
    });
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `يرجى مراجعة الرصيد وإبلاغ الإدارة المالية في حال وجود أي ملاحظات.\n`;
  text += `_تم الإصدار آلياً عبر نظام الرؤية المتكامل ERP_`;

  return text;
}

export function generateSiteSettlementWhatsAppMessage(settlement: {
  companyName: string;
  siteName: string;
  settlementNumber: string;
  supervisorName: string;
  date: string;
  currency: string;
  openingCash: number;
  transfersReceived: number;
  totalSpent: number;
  expectedClosingBalance: number;
  actualCashInHand: number;
  discrepancy: number;
  status: string;
  notes?: string;
}): string {
  const statusLabel = settlement.status === 'approved' ? 'معتمدة ومقفلة ✅' : 'قيد المراجعة والتدقيق ⏳';
  const discText = settlement.discrepancy === 0 
    ? '✅ لا يوجد فروقات (مطابقة تامة 0)' 
    : settlement.discrepancy > 0 
    ? `📈 فائض نقدي بمبلغ: +${settlement.discrepancy.toLocaleString()} ${settlement.currency}` 
    : `📉 عجز نقدي بمبلغ: ${settlement.discrepancy.toLocaleString()} ${settlement.currency}`;

  let text = `*🏛️ ${settlement.companyName}*\n`;
  text += `*🏗️ تقرير تسوية وجرد الموقع الميداني*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 *اسم الموقع / المشروع:* ${settlement.siteName}\n`;
  text += `🔢 *رقم إذن التسوية:* ${settlement.settlementNumber}\n`;
  text += `👷 *المشرف الميداني:* ${settlement.supervisorName}\n`;
  text += `📅 *التاريخ:* ${settlement.date}\n`;
  text += `🏷️ *حالة التسوية:* ${statusLabel}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 *النقدية الافتتاحية:* ${settlement.openingCash.toLocaleString()} ${settlement.currency}\n`;
  text += `📥 *الدفعات والتحويلات المستلمة:* ${settlement.transfersReceived.toLocaleString()} ${settlement.currency}\n`;
  text += `💰 *إجمالي المتاح بالموقع:* ${(settlement.openingCash + settlement.transfersReceived).toLocaleString()} ${settlement.currency}\n`;
  text += `📤 *إجمالي المصروف بالموقع:* ${settlement.totalSpent.toLocaleString()} ${settlement.currency}\n`;
  text += `📊 *الرصيد الدفتري المتبقي:* ${settlement.expectedClosingBalance.toLocaleString()} ${settlement.currency}\n`;
  text += `🔍 *النقدية الفعلية بالموقع (الجرد):* ${settlement.actualCashInHand.toLocaleString()} ${settlement.currency}\n`;
  text += `⚖️ *نتيجة الفحص:* ${discText}\n`;
  
  if (settlement.notes) {
    text += `📝 *ملاحظات:* ${settlement.notes}\n`;
  }
  
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_تم إرسال التقرير للمطابقة الميدانية عبر نظام الرؤية المتكامل ERP_`;

  return text;
}
