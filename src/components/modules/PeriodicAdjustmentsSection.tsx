import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  AlertTriangle,
  Receipt,
  Landmark,
  Package,
  HardHat,
  Search,
  Filter,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  FileCheck,
  Eye,
  Trash2
} from 'lucide-react';
import {
  AccrualAdjustment,
  AccrualAdjustmentType,
  Account,
  CostCenter,
  JournalEntry,
  SiteSettlement,
  BankReconciliation,
  InventoryItem,
  CompanySettings
} from '../../types';
import { sendWhatsAppMessage, formatWhatsAppReport } from '../../utils/whatsappPrinter';
import { customAlert, customConfirm } from '../../utils/dialog';

interface PeriodicAdjustmentsSectionProps {
  adjustments: AccrualAdjustment[];
  onSaveAdjustments: (adjustments: AccrualAdjustment[]) => void;
  accounts: Account[];
  onSaveAccounts: (accounts: Account[]) => void;
  journalEntries: JournalEntry[];
  onSaveJournalEntries: (entries: JournalEntry[]) => void;
  costCenters: CostCenter[];
  siteSettlements: SiteSettlement[];
  bankReconciliations: BankReconciliation[];
  inventory: InventoryItem[];
  settings: CompanySettings;
  onNavigateToModule?: (moduleId: string) => void;
}

export const PeriodicAdjustmentsSection: React.FC<PeriodicAdjustmentsSectionProps> = ({
  adjustments,
  onSaveAdjustments,
  accounts,
  onSaveAccounts,
  journalEntries,
  onSaveJournalEntries,
  costCenters,
  siteSettlements,
  bankReconciliations,
  inventory,
  settings,
  onNavigateToModule
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [presetType, setPresetType] = useState<AccrualAdjustmentType>('prepaid_expense');

  // Form state for new adjustment
  const [formData, setFormData] = useState<{
    type: AccrualAdjustmentType;
    title: string;
    totalAmount: number;
    startDate: string;
    dueDate: string;
    expenseOrRevenueAccountId: string;
    adjustmentAccountId: string;
    costCenterId: string;
    notes: string;
  }>({
    type: 'prepaid_expense',
    title: '',
    totalAmount: 0,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    expenseOrRevenueAccountId: '',
    adjustmentAccountId: '',
    costCenterId: '',
    notes: ''
  });

  // Calculate statistics for each item separately ("كل بند لوحده")
  // 1. المصروفات المدفوعة مقدماً
  const prepaidItems = adjustments.filter(a => a.type === 'prepaid_expense');
  const prepaidTotal = prepaidItems.reduce((sum, a) => sum + a.totalAmount, 0);
  const prepaidAmortized = prepaidItems.reduce((sum, a) => sum + a.amortizedAmount, 0);
  const prepaidRemaining = prepaidItems.reduce((sum, a) => sum + a.remainingAmount, 0);

  // 2. المصروفات المستحقة
  const accruedExpItems = adjustments.filter(a => a.type === 'accrued_expense');
  const accruedExpTotal = accruedExpItems.reduce((sum, a) => sum + a.totalAmount, 0);
  const accruedExpRemaining = accruedExpItems.reduce((sum, a) => sum + a.remainingAmount, 0);

  // 3. الإيرادات المستحقة
  const accruedRevItems = adjustments.filter(a => a.type === 'accrued_revenue');
  const accruedRevTotal = accruedRevItems.reduce((sum, a) => sum + a.totalAmount, 0);
  const accruedRevRemaining = accruedRevItems.reduce((sum, a) => sum + a.remainingAmount, 0);

  // 4. الإيرادات المقدمة (غير المكتسبة)
  const unearnedRevItems = adjustments.filter(a => a.type === 'unearned_revenue');
  const unearnedRevTotal = unearnedRevItems.reduce((sum, a) => sum + a.totalAmount, 0);
  const unearnedRevRemaining = unearnedRevItems.reduce((sum, a) => sum + a.remainingAmount, 0);

  // 5. تسويات المخزون (فوارق الجرد والأصناف الحرجة)
  const criticalStockItems = inventory.filter(i => i.currentStock <= i.minStockAlert);
  const inventoryTotalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.averageCost, 0);

  // 6. تسويات عهد المواقع
  const siteDiscrepancyTotal = siteSettlements.reduce((sum, s) => sum + Math.abs(s.discrepancy), 0);
  const pendingSitesCount = siteSettlements.filter(s => s.status !== 'approved').length;

  // 7. تسويات ومطابقات البنوك
  const bankReconDiscrepancy = bankReconciliations.reduce((sum, r) => sum + Math.abs(r.difference), 0);

  // Open modal with pre-selected type
  const handleOpenAdd = (type: AccrualAdjustmentType) => {
    setPresetType(type);
    setFormData({
      type: type,
      title: '',
      totalAmount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      expenseOrRevenueAccountId: '',
      adjustmentAccountId: '',
      costCenterId: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  // Submit and create adjustment + automated journal entry
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.totalAmount <= 0) {
      customAlert('يرجى كتابة بيان التسوية والمبلغ بشكل صحيح', 'warning');
      return;
    }

    const newCode = `ADJ-${new Date().getFullYear()}-${String(adjustments.length + 1).padStart(3, '0')}`;
    const expRevAcc = accounts.find(a => a.id === formData.expenseOrRevenueAccountId);
    const cc = costCenters.find(c => c.id === formData.costCenterId);

    const newAdj: AccrualAdjustment = {
      id: `adj_${Date.now()}`,
      code: newCode,
      type: formData.type,
      title: formData.title,
      totalAmount: formData.totalAmount,
      amortizedAmount: 0,
      remainingAmount: formData.totalAmount,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      expenseOrRevenueAccountId: formData.expenseOrRevenueAccountId,
      expenseOrRevenueAccountName: expRevAcc?.name,
      adjustmentAccountId: formData.adjustmentAccountId,
      costCenterId: formData.costCenterId,
      costCenterName: cc?.name,
      status: 'active',
      notes: formData.notes,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    // Auto-generate balancing Journal Entry for this adjustment
    const entryNumber = `JE-ADJ-${Date.now().toString().slice(-4)}`;
    let debitAccId = formData.expenseOrRevenueAccountId || 'acc_503';
    let debitAccName = expRevAcc?.name || 'مصروفات تشغيلية';
    let creditAccId = 'acc_101'; // Default Treasury or Bank
    let creditAccName = 'الخزينة الرئيسية / الصندوق';

    if (formData.type === 'prepaid_expense') {
      debitAccId = 'acc_108'; // مصروفات مدفوعة مقدماً (أصل)
      debitAccName = 'مصروفات مدفوعة مقدماً';
      creditAccId = 'acc_101'; // نقدية
      creditAccName = 'الخزينة / البنك';
    } else if (formData.type === 'accrued_expense') {
      debitAccId = formData.expenseOrRevenueAccountId || 'acc_501'; // حساب المصروف
      debitAccName = expRevAcc?.name || 'مصروفات مستحقة الإثبات';
      creditAccId = 'acc_203'; // التزام (مصروفات مستحقة)
      creditAccName = 'مصروفات مستحقة الدفع';
    } else if (formData.type === 'accrued_revenue') {
      debitAccId = 'acc_104'; // إيراد مستحق (أصل متداول)
      debitAccName = 'إيرادات مستحقة القبض';
      creditAccId = formData.expenseOrRevenueAccountId || 'acc_401'; // حساب الإيراد
      creditAccName = expRevAcc?.name || 'إيرادات مشاريع وأعمال';
    } else if (formData.type === 'unearned_revenue') {
      debitAccId = 'acc_101'; // نقدية مقبوضة
      debitAccName = 'الخزينة / الحساب البنكي';
      creditAccId = 'acc_201'; // التزام (إيراد مقدم)
      creditAccName = 'إيرادات مقبوضة مقدماً - التزام';
    }

    const newJournalEntry: JournalEntry = {
      id: `je_${Date.now()}`,
      entryNumber: entryNumber,
      date: formData.startDate,
      fiscalYear: formData.startDate.slice(0, 4) || '2026',
      description: `قيد تسوية جردية: ${formData.title} (${newCode})`,
      totalDebit: formData.totalAmount,
      totalCredit: formData.totalAmount,
      isPosted: true,
      createdBy: 'النظام الآلي للتسويات',
      referenceType: 'adjustment',
      referenceId: newAdj.id,
      lines: [
        {
          id: `line_deb_${Date.now()}`,
          accountId: debitAccId,
          accountName: debitAccName,
          debit: formData.totalAmount,
          credit: 0,
          description: `تسوية: ${formData.title}`,
          costCenterId: formData.costCenterId
        },
        {
          id: `line_crd_${Date.now()}`,
          accountId: creditAccId,
          accountName: creditAccName,
          debit: 0,
          credit: formData.totalAmount,
          description: `تسوية: ${formData.title}`,
          costCenterId: formData.costCenterId
        }
      ]
    };

    onSaveAdjustments([newAdj, ...adjustments]);
    onSaveJournalEntries([newJournalEntry, ...journalEntries]);

    setIsAddModalOpen(false);
    customAlert(`تم تسجيل التسوية الجردية (${newCode}) وتوليد قيد اليومية رقم (${entryNumber}) بنجاح!`, 'success');
  };

  // Perform partial amortization / settlement
  const handleAmortize = (adj: AccrualAdjustment) => {
    const defaultAmort = Math.min(adj.remainingAmount, Math.round(adj.totalAmount / 12) || adj.remainingAmount);
    const amountStr = prompt(
      `تسوية / إهلاك جزئي للبند:\n"${adj.title}"\nالمتبقي الحالي: ${adj.remainingAmount.toLocaleString()} ${settings.currency}\n\nأدخل مبلغ القسط المراد تسويته وإثباته الآن:`,
      String(defaultAmort)
    );

    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > adj.remainingAmount) {
      customAlert('المبلغ المدخل غير صحيح أو يتجاوز الرصيد المتبقي للتسوية!', 'error');
      return;
    }

    const newAmortized = adj.amortizedAmount + amount;
    const newRemaining = adj.totalAmount - newAmortized;
    const newStatus = newRemaining <= 0 ? 'settled' : 'partially_adjusted';

    const updated = adjustments.map(a =>
      a.id === adj.id
        ? {
            ...a,
            amortizedAmount: newAmortized,
            remainingAmount: newRemaining,
            status: newStatus
          }
        : a
    );

    // Create journal entry for the amortized portion
    const today = new Date().toISOString().slice(0, 10);
    const entryNumber = `JE-AMORT-${Date.now().toString().slice(-4)}`;
    const je: JournalEntry = {
      id: `je_${Date.now()}`,
      entryNumber: entryNumber,
      date: today,
      fiscalYear: today.slice(0, 4) || '2026',
      description: `إثبات تسوية واستهلاك قسط جردي دوري: ${adj.title}`,
      totalDebit: amount,
      totalCredit: amount,
      isPosted: true,
      createdBy: 'النظام الآلي للتسويات',
      referenceType: 'adjustment',
      referenceId: adj.id,
      lines: [
        {
          id: `line_1_${Date.now()}`,
          accountId: adj.expenseOrRevenueAccountId || 'acc_503',
          accountName: adj.expenseOrRevenueAccountName || 'مصروفات الفترة الجارية',
          debit: amount,
          credit: 0,
          description: `قسط تسوية دوري: ${adj.title}`,
          costCenterId: adj.costCenterId
        },
        {
          id: `line_2_${Date.now()}`,
          accountId: 'acc_108',
          accountName: 'مصروفات مدفوعة مقدماً / تسويات',
          debit: 0,
          credit: amount,
          description: `تخفيض رصيد التسوية: ${adj.title}`,
          costCenterId: adj.costCenterId
        }
      ]
    };

    onSaveAdjustments(updated);
    onSaveJournalEntries([je, ...journalEntries]);
    customAlert(`تم إثبات تسوية القسط بقيمة (${amount.toLocaleString()} ${settings.currency}) وتوليد القيد بنجاح!`, 'success');
  };

  // Delete adjustment
  const handleDelete = (id: string) => {
    customConfirm('هل أنت متأكد من رغبتك في حذف بند التسوية الجردية هذا؟', () => {
      onSaveAdjustments(adjustments.filter(a => a.id !== id));
      customAlert('تم حذف بند التسوية بنجاح.', 'info');
    }, 'تأكيد حذف التسوية الجردية');
  };

  // WhatsApp Share for specific adjustment item
  const handleShareItemWhatsApp = (adj: AccrualAdjustment) => {
    const reportText = `*📑 إشعار تسوية جردية محاسبية - ${settings.companyName}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *رقم التسوية:* ${adj.code}
📝 *بيان البند:* ${adj.title}
🏷️ *النوع:* ${getAdjustmentTypeLabel(adj.type)}
💰 *إجمالي القيمة:* ${adj.totalAmount.toLocaleString()} ${settings.currency}
✅ *المستهلك / المسوى:* ${adj.amortizedAmount.toLocaleString()} ${settings.currency}
⏳ *الرصيد المتبقي:* ${adj.remainingAmount.toLocaleString()} ${settings.currency}
📅 *تاريخ البدء:* ${adj.startDate}
🎯 *تاريخ الاستحقاق:* ${adj.dueDate || 'نهاية العام'}
📊 *مركز التكلفة:* ${adj.costCenterName || 'المركز العام'}
🏷️ *الحالة:* ${adj.status === 'settled' ? '✅ مقفل ومسوى بالكامل' : '⏳ قيد الاستهلاك والتسوية'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 صادر عن قسم الرقابة المالية والحسابات العامة`;

    sendWhatsAppMessage('', reportText);
  };

  const getAdjustmentTypeLabel = (type: AccrualAdjustmentType) => {
    switch (type) {
      case 'prepaid_expense':
        return 'مصروف مدفوع مقدماً';
      case 'accrued_expense':
        return 'مصروف مستحق الدفع';
      case 'accrued_revenue':
        return 'إيراد مستحق القبض';
      case 'unearned_revenue':
        return 'إيراد مقبوض مقدماً';
      default:
        return 'تسوية جردية عامة';
    }
  };

  // Filtered adjustments list
  const filteredAdjustments = adjustments.filter(a => {
    if (selectedCategory !== 'all' && a.type !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.costCenterName && a.costCenterName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id="periodic-adjustments-section" className="space-y-6">
      {/* رأس قسم التسويات الجردية */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>التسويات الجردية والعمليات الدورية</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-0.5 rounded-full">
                  عرض كل بند لوحده مع الإقفال المحاسبي
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إدارة المصروفات والإيرادات المقدمة والمستحقة، مطابقات البنوك، فوارق المخزون، وتسويات المواقع
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAdd('prepaid_expense')}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة تسوية جردية</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* بطاقات البنود السبعة المستقلة ("كل بند لوحده") */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* البند 1: المصروفات المدفوعة مقدماً */}
        <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">1) المصروفات المدفوعة مقدماً</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {prepaidItems.length} بنود
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {prepaidRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                <span>الإجمالي: {prepaidTotal.toLocaleString()}</span>
                <span>المستهلك: {prepaidAmortized.toLocaleString()}</span>
              </div>
            </div>

            {/* شريط الاستهلاك */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${prepaidTotal > 0 ? (prepaidAmortized / prepaidTotal) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSelectedCategory('prepaid_expense')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
            >
              <span>عرض تفاصيل البند</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleOpenAdd('prepaid_expense')}
              className="p-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg text-xs font-bold"
              title="إضافة مصروف مقدم جديد"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* البند 2: المصروفات المستحقة */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">2) المصروفات المستحقة</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {accruedExpItems.length} التزامات
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {accruedExpRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                <span>رواتب ومرافق مستحقة لم تسدد</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full w-full"></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSelectedCategory('accrued_expense')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>عرض تفاصيل البند</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleOpenAdd('accrued_expense')}
              className="p-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-xs font-bold"
              title="إثبات مصروف مستحق"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* البند 3: الإيرادات المستحقة */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">3) الإيرادات المستحقة</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                {accruedRevItems.length} مستخلصات
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {accruedRevRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                <span>أعمال منجزة قيد الفوترة والتحصيل</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSelectedCategory('accrued_revenue')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <span>عرض تفاصيل البند</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleOpenAdd('accrued_revenue')}
              className="p-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-xs font-bold"
              title="إثبات إيراد مستحق"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* البند 4: الإيرادات المقبوضة مقدماً */}
        <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">4) الإيرادات المقبوضة مقدماً</span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                {unearnedRevItems.length} عقود
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {unearnedRevRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                <span>دفعات عملاء مقدمة كالتزام</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${unearnedRevTotal > 0 ? ((unearnedRevTotal - unearnedRevRemaining) / unearnedRevTotal) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSelectedCategory('unearned_revenue')}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
            >
              <span>عرض تفاصيل البند</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleOpenAdd('unearned_revenue')}
              className="p-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-lg text-xs font-bold"
              title="إثبات إيراد مقبوض مقدماً"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* باقي البنود الثلاثة الجردية المكملة (المخزون، المواقع، البنوك) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* البند 5: تسويات جرد المخزون */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">5) تسويات جرد المخزون</span>
            </div>
            <div className="text-sm font-bold text-slate-300">
              قيمة المخزون الدفتري: <span className="font-mono text-white">{inventoryTotalValue.toLocaleString()} {settings.currency}</span>
            </div>
            <div className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{criticalStockItems.length} أصناف وصلت لحد إعادة الطلب</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToModule && onNavigateToModule('inventory')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            جرد المخزون
          </button>
        </div>

        {/* البند 6: تسويات عهد المواقع */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">6) تسويات عهد المواقع</span>
            </div>
            <div className="text-sm font-bold text-slate-300">
              إجمالي فوارق الجرد: <span className="font-mono text-amber-400">{siteDiscrepancyTotal.toLocaleString()} {settings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {pendingSitesCount} تسويات مواقع قيد المراجعة والاعتماد
            </div>
          </div>

          <button
            onClick={() => onNavigateToModule && onNavigateToModule('site_settlements')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            تسويات المواقع
          </button>
        </div>

        {/* البند 7: مطابقات البنوك */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">7) مطابقات كشوف البنوك</span>
            </div>
            <div className="text-sm font-bold text-slate-300">
              فوارق المطابقة: <span className="font-mono text-emerald-400">{bankReconDiscrepancy.toLocaleString()} {settings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {bankReconciliations.length} مطابقة بنكية مسجلة
            </div>
          </div>

          <button
            onClick={() => onNavigateToModule && onNavigateToModule('treasury_banks')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            المطابقات البنكية
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* جدول التسويات الجردية مع الفلترة والبحث والعمليات */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* شريط الفلاتر والبحث */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60">
          {/* تبويبات الفلترة حسب البند */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'جميع التسويات الجردية' },
              { id: 'prepaid_expense', label: 'مصروفات مدفوعة مقدماً' },
              { id: 'accrued_expense', label: 'مصروفات مستحقة' },
              { id: 'accrued_revenue', label: 'إيرادات مستحقة' },
              { id: 'unearned_revenue', label: 'إيرادات مقدمة' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  selectedCategory === tab.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* مربع البحث */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في بنود التسويات..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* الجدول التفصيلي */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">الكود</th>
                <th className="p-3.5">نوع البند الجردي</th>
                <th className="p-3.5">بيان التسوية والعقد</th>
                <th className="p-3.5">إجمالي المبلغ</th>
                <th className="p-3.5">المسوى / المستهلك</th>
                <th className="p-3.5">الرصيد المتبقي</th>
                <th className="p-3.5">تاريخ الاستحقاق</th>
                <th className="p-3.5">مركز التكلفة</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات المحاسبية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    لا توجد بنود تسويات جردية مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-indigo-400 font-bold">{adj.code}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          adj.type === 'prepaid_expense'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : adj.type === 'accrued_expense'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : adj.type === 'accrued_revenue'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {getAdjustmentTypeLabel(adj.type)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{adj.title}</div>
                      {adj.notes && <div className="text-[10px] text-slate-400 mt-0.5">{adj.notes}</div>}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      {adj.totalAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400">
                      {adj.amortizedAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {adj.remainingAmount.toLocaleString()} {settings.currency}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{adj.dueDate || adj.startDate}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400">{adj.costCenterName || '-'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          adj.status === 'settled'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : adj.status === 'partially_adjusted'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {adj.status === 'settled'
                          ? 'مقفلة بالكامل'
                          : adj.status === 'partially_adjusted'
                          ? 'مسواة جزئياً'
                          : 'نشطة قيد التسوية'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {adj.remainingAmount > 0 && (
                          <button
                            onClick={() => handleAmortize(adj)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition shadow flex items-center gap-1"
                            title="إهلاك / تسوية قسط من هذا البند"
                          >
                            <FileCheck className="w-3 h-3" />
                            <span>تسوية قسط</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleShareItemWhatsApp(adj)}
                          className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs transition"
                          title="إرسال تقرير البند عبر واتساب"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(adj.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition"
                          title="حذف البند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* نافذة إضافة تسوية جردية جديدة */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>إضافة وقيد تسوية جردية دورية</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نوع التسوية الجردية *</label>
                  <select
                    value={formData.type}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        type: e.target.value as AccrualAdjustmentType
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="prepaid_expense">1) مصروف مدفوع مقدماً (Prepaid Expense)</option>
                    <option value="accrued_expense">2) مصروف مستحق غير مسدد (Accrued Expense)</option>
                    <option value="accrued_revenue">3) إيراد مستحق غير محصل (Accrued Revenue)</option>
                    <option value="unearned_revenue">4) إيراد مقبوض مقدماً (Unearned Revenue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المبلغ الإجمالي ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.totalAmount || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        totalAmount: Number(e.target.value) || 0
                      }))
                    }
                    placeholder="مثال: 60000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">بيان التسوية / اسم العقد أو البند *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: عقد إيجار مكاتب الإدارة العامة لسنة 2026"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ البدء / الإثبات *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الاستحقاق / نهاية الفترة</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الحساب المعني (المصروف / الإيراد)</label>
                  <select
                    value={formData.expenseOrRevenueAccountId}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        expenseOrRevenueAccountId: e.target.value
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- اختياري (تحديد تلقائي) --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مركز التكلفة / المشروع</label>
                  <select
                    value={formData.costCenterId}
                    onChange={e => setFormData(prev => ({ ...prev, costCenterId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- اختياري --</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات وشروط الاستهلاك</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="طريقة الاستهلاك، تفاصيل المستند المرفق..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-300">
                ⚡ <strong>إجراء آلي:</strong> سيقوم النظام بإنشاء قيد اليومية المحاسبي المتوازن فوراً وتحديث الأرصدة.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  حفظ وتوليد القيد المحاسبي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
