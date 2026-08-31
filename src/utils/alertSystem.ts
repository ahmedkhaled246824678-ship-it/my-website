import {
  BankAccount,
  CustomerSupplier,
  Custody,
  EmployeeAdvance,
  SiteSettlement,
  InventoryItem,
  AccrualAdjustment,
  CompanySettings,
  SystemAlert
} from '../types';
import { sendWhatsAppMessage, formatWhatsAppReport } from './whatsappPrinter';

export interface AlertScanParams {
  banks: BankAccount[];
  customersSuppliers?: CustomerSupplier[];
  custodies?: Custody[];
  advances?: EmployeeAdvance[];
  siteSettlements?: SiteSettlement[];
  inventory?: InventoryItem[];
  accrualAdjustments?: AccrualAdjustment[];
  settings: CompanySettings;
}

export function generateSystemAlerts(params?: Partial<AlertScanParams>): SystemAlert[] {
  if (!params) return [];
  const {
    banks = [],
    customersSuppliers = [],
    custodies = [],
    advances = [],
    siteSettlements = [],
    inventory = [],
    accrualAdjustments = [],
    settings
  } = params;

  const alerts: SystemAlert[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const notifConfig = settings?.notificationSettings;
  const defaultBankThreshold = notifConfig?.defaultBankThreshold ?? 50000;
  const defaultManagerPhone = notifConfig?.managerPhone || settings?.phone || '';
  const curr = settings?.currency || 'ر.س';

  // 1. فحص أرصدة البنوك والحدود الدنيا (Bank Balance Threshold Alerts)
  (banks || []).forEach(bank => {
    if (!bank) return;
    const threshold = bank.minThreshold ?? defaultBankThreshold;
    if (bank.currentBalance < threshold) {
      const isCritical = bank.currentBalance <= threshold * 0.3 || bank.currentBalance <= 0;
      alerts.push({
        id: `alert_bank_${bank.id}_${todayStr}`,
        type: 'bank_low_balance',
        severity: isCritical ? 'critical' : 'warning',
        title: `انخفاض رصيد حساب ${bank.bankName}`,
        message: `الرصيد الفعلي الحالي (${bank.currentBalance.toLocaleString()} ${bank.currency}) أقل من الحد الأدنى المحدد (${threshold.toLocaleString()} ${bank.currency}). يرجى تغذية الحساب لتجنب تعطل المدفوعات أو الشيكات.`,
        date: todayStr,
        amount: bank.currentBalance,
        threshold: threshold,
        currency: bank.currency,
        relatedEntityName: bank.bankName,
        relatedEntityId: bank.id,
        relatedModule: 'treasury_banks',
        phoneForWhatsApp: bank.alertRecipientPhone || defaultManagerPhone
      });
    }
  });

  // 2. فحص استحقاقات سداد الموردين والمدفوعات الهامة (Important Payments Due)
  (customersSuppliers || []).filter(cs => cs && cs.type === 'supplier').forEach(supp => {
    const payableAmount = Math.abs(supp.currentBalance);
    // إذا كان هناك رصيد دائن معتبر للمورد
    if (supp.currentBalance < -30000 || (supp.creditLimit && payableAmount >= supp.creditLimit * 0.8)) {
      alerts.push({
        id: `alert_supp_${supp.id}`,
        type: 'payment_due',
        severity: payableAmount >= 50000 ? 'critical' : 'warning',
        title: `استحقاق سداد للمورد: ${supp.name}`,
        message: `مستحق سداد دفعة للمورد بقيمة (${payableAmount.toLocaleString()} ${curr}) لصالح (${supp.companyName || supp.name}).`,
        date: todayStr,
        amount: payableAmount,
        currency: curr,
        relatedEntityName: supp.name,
        relatedEntityId: supp.id,
        relatedModule: 'customers_suppliers',
        phoneForWhatsApp: supp.phone || defaultManagerPhone
      });
    }
  });

  // 3. فحص استحقاق التسويات الجردية الدورية (Accruals & Prepaid Due)
  (accrualAdjustments || []).filter(adj => adj && adj.status !== 'settled').forEach(adj => {
    const isOverdue = adj.dueDate && adj.dueDate <= todayStr;
    const isDueSoon = adj.dueDate && !isOverdue && new Date(adj.dueDate).getTime() - new Date().getTime() <= (7 * 24 * 3600 * 1000);
    
    if (isOverdue || isDueSoon || adj.type === 'accrued_expense') {
      alerts.push({
        id: `alert_adj_${adj.id}`,
        type: 'accrual_due',
        severity: isOverdue ? 'critical' : 'warning',
        title: `استحقاق تسوية جردية: ${adj.title}`,
        message: `متبقي تسوية مبلغ (${adj.remainingAmount.toLocaleString()} ${curr}) لتاريخ استحقاق (${adj.dueDate || 'نهاية الفترة'}). ${isOverdue ? '🔴 متأخر عن موعد الإقفال' : '⏳ يرجى إثبات قيد التسوية'}.`,
        date: todayStr,
        dueDate: adj.dueDate,
        amount: adj.remainingAmount,
        currency: curr,
        relatedEntityName: adj.title,
        relatedEntityId: adj.id,
        relatedModule: 'dashboard',
        phoneForWhatsApp: defaultManagerPhone
      });
    }
  });

  // 4. فحص العهد المتأخرة عن التسوية (Overdue Custodies)
  (custodies || []).filter(c => c && (c.status === 'active' || c.status === 'partially_settled')).forEach(cus => {
    const dateVal = cus.dateGiven || todayStr;
    const daysSince = Math.floor((new Date().getTime() - new Date(dateVal).getTime()) / (1000 * 3600 * 24));
    const remaining = (cus.remainingAmount !== undefined ? cus.remainingAmount : (cus.amount - (cus.settledAmount || 0))) || 0;
    if (daysSince > 14 && remaining > 0) {
      alerts.push({
        id: `alert_cus_${cus.id}`,
        type: 'custody_due',
        severity: daysSince > 30 ? 'critical' : 'warning',
        title: `تأخر تسوية عهدة: ${cus.employeeName}`,
        message: `العهدة النقدية رقم (${cus.custodyNumber || cus.id}) المسلمة للموظف بقيمة (${cus.amount.toLocaleString()} ${curr}) متبقي منها (${remaining.toLocaleString()} ${curr}) منذ ${daysSince} يوماً دون تسوية نهائية.`,
        date: dateVal,
        amount: remaining,
        currency: curr,
        relatedEntityName: cus.employeeName,
        relatedEntityId: cus.id,
        relatedModule: 'custodies',
        phoneForWhatsApp: cus.employeePhone || defaultManagerPhone
      });
    }
  });

  // 5. فحص نقص المخزون تحت الحد الأدنى (Min Stock Alert)
  (inventory || []).filter(item => item && item.currentStock <= item.minStockAlert).forEach(item => {
    alerts.push({
      id: `alert_inv_${item.id}`,
      type: 'inventory_low',
      severity: item.currentStock <= 0 ? 'critical' : 'warning',
      title: item.currentStock <= 0 ? `نفاد كمية الصنف: ${item.name}` : `نقص حاد في المخزون: ${item.name}`,
      message: `الرصيد المتبقي بالمستودع (${item.currentStock} ${item.unit}) وصل للحد الحرج (حد الأمان: ${item.minStockAlert} ${item.unit}). يرجى إصدار أمر شراء وتوريد فوري.`,
      date: todayStr,
      amount: item.currentStock,
      threshold: item.minStockAlert,
      relatedEntityName: item.name,
      relatedEntityId: item.id,
      relatedModule: 'inventory',
      phoneForWhatsApp: defaultManagerPhone
    });
  });

  // 6. فحص فوارق تسوية المواقع (Site Discrepancy Alerts)
  (siteSettlements || []).filter(s => s && (s.status === 'under_review' || s.status === 'draft' || Math.abs(s.discrepancy || 0) > 500)).forEach(site => {
    const disc = site.discrepancy || 0;
    if (Math.abs(disc) > 0) {
      alerts.push({
        id: `alert_site_${site.id}`,
        type: 'settlement_due',
        severity: Math.abs(disc) > 2000 ? 'critical' : 'warning',
        title: `فارق تسوية بموقع: ${site.siteName}`,
        message: `تسوية الموقع رقم (${site.settlementNumber || site.id}) تتضمن فارق جرد فعلي بقيمة (${disc > 0 ? '+' : ''}${disc.toLocaleString()} ${curr}) [${disc > 0 ? 'فائض نقدي' : 'عجز نقدي'}] بانتظار الاعتماد.`,
        date: site.date || todayStr,
        amount: Math.abs(disc),
        currency: curr,
        relatedEntityName: site.siteName,
        relatedEntityId: site.id,
        relatedModule: 'site_settlements',
        phoneForWhatsApp: site.supervisorPhone || defaultManagerPhone
      });
    }
  });

  return alerts;
}

export function formatWhatsAppAlertMessage(alert: SystemAlert, settings: CompanySettings): string {
  const isCritical = alert.severity === 'critical';
  const icon = isCritical ? '🚨' : '⚠️';
  const severityBadge = isCritical ? '🔴 حرج وعاجل جداً' : '🟡 تحذير إداري هام';

  const typeLabels: Record<string, string> = {
    bank_low_balance: '🏦 هبوط رصيد حساب بنكي دون الحد الأدنى',
    payment_due: '💳 استحقاق سداد دفعات ومستحقات موردين',
    accrual_due: '📑 استحقاق تسوية جردية دورية',
    custody_due: '💼 تأخر تسوية وإقفال عهدة موظف',
    inventory_low: '📦 وصول المخزون للحد الحرج وإعادة الطلب',
    settlement_due: '🏗️ وجود فارق أو عجز بتسوية موقع ميداني'
  };

  const typeName = typeLabels[alert.type] || alert.title;

  return `*${icon} إشعار وتنبيه آلي من نظام الرؤية ERP ${icon}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *المنشأة:* ${settings.companyName}
📌 *نوع التنبيه:* ${typeName}
📊 *مستوى الأهمية:* ${severityBadge}
📅 *تاريخ الإشعار:* ${alert.date || new Date().toISOString().slice(0, 10)}
${alert.dueDate ? `⏳ *تاريخ الاستحقاق:* ${alert.dueDate}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 *تفاصيل البند:*
${alert.message}

${alert.amount !== undefined ? `💰 *المبلغ / القيمة المعنية:* ${alert.amount.toLocaleString()} ${alert.currency || settings.currency}\n` : ''}${alert.threshold !== undefined ? `🎯 *الحد المرجعي المسموح:* ${alert.threshold.toLocaleString()}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ تم توليد هذا التنبيه آلياً من الرقابة المالية ونظام المراقبة المستمرة.
يرجى المراجعة واتخاذ الإجراء اللازم في النظام.`;
}

export function sendAlertViaWhatsApp(alert: SystemAlert, settings: CompanySettings, customPhone?: string): void {
  const targetPhone = customPhone || alert.phoneForWhatsApp || settings.phone || '';
  const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
  const message = formatWhatsAppAlertMessage(alert, settings);
  sendWhatsAppMessage(cleanPhone, message);
}
