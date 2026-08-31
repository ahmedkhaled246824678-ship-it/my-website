import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  FileSpreadsheet,
  Share2,
  ChevronDown,
  Building,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { Account, JournalEntry, CostCenter, CompanySettings, CustomerSupplier, Employee, BankAccount, UserAccount } from '../../types';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { formatWhatsAppReport } from '../../utils/whatsappPrinter';
import { ShareReportModal } from '../common/ShareReportModal';
import { AccountMovement } from './AccountLedgerModal';
import { Language } from '../../utils/i18n';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';

interface GeneralLedgerDashboardSectionProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  settings?: CompanySettings;
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  users?: UserAccount[];
  onOpenFullLedgerModal?: (account: Account) => void;
  onNavigate?: (module: string) => void;
  lang?: Language;
}

export const GeneralLedgerDashboardSection: React.FC<GeneralLedgerDashboardSectionProps> = ({
  accounts = [],
  journalEntries = [],
  costCenters = [],
  settings,
  customersSuppliers = [],
  employees = [],
  banks = [],
  users = [],
  onOpenFullLedgerModal,
  onNavigate,
  lang = 'ar'
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    // Default to main bank or main treasury or first account
    const bankOrCash = (accounts || []).find(a => a && (a.subType === 'bank' || a.subType === 'cash'));
    return bankOrCash ? bankOrCash.id : (accounts[0]?.id || '');
  });

  const [accountCategoryFilter, setAccountCategoryFilter] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  const [accountSearch, setAccountSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [costCenterFilter, setCostCenterFilter] = useState('all');
  const [searchEntryQuery, setSearchEntryQuery] = useState('');

  // Share Modal State
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    entityName?: string;
    text: string;
    defaultPhone?: string;
  }>({
    isOpen: false,
    title: '',
    text: ''
  });

  // Currently selected account
  const currentAccount = accounts.find(a => a.id === selectedAccountId || a.code === selectedAccountId) || accounts[0];

  // Filtered account options for the dropdown/selector
  const filteredAccountOptions = useMemo(() => {
    return accounts.filter(a => {
      const matchCat = accountCategoryFilter === 'all' || a.type === accountCategoryFilter;
      const q = accountSearch.trim().toLowerCase();
      const matchQuery = !q || a.name.toLowerCase().includes(q) || a.code.includes(q);
      return matchCat && matchQuery;
    });
  }, [accounts, accountCategoryFilter, accountSearch]);

  // Compute ledger movements for selected account
  const { movements, initialBalance, totalDebit, totalCredit, finalBalance } = useMemo(() => {
    if (!currentAccount) {
      return { movements: [], initialBalance: 0, totalDebit: 0, totalCredit: 0, finalBalance: 0 };
    }

    const rawMovements: Omit<AccountMovement, 'runningBalance'>[] = [];
    const postedEntries = journalEntries.filter(e => e.isPosted !== false);

    postedEntries.forEach(entry => {
      entry.lines.forEach((line, lineIdx) => {
        const isTarget =
          line.accountId === currentAccount.id ||
          line.accountId === currentAccount.code ||
          line.accountName === currentAccount.name ||
          (currentAccount.code && line.accountId && String(line.accountId).trim() === String(currentAccount.code).trim());

        if (isTarget) {
          const cc = costCenters.find(c => c.id === line.costCenterId);
          rawMovements.push({
            id: `${entry.id}_${lineIdx}`,
            entryId: entry.id,
            entryNumber: entry.entryNumber,
            date: entry.date,
            description: line.description || entry.description,
            referenceType: entry.referenceType,
            referenceId: entry.referenceId,
            costCenterId: line.costCenterId,
            costCenterName: cc ? cc.name : undefined,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            isPosted: entry.isPosted !== false,
            createdBy: entry.createdBy
          });
        }
      });
    });

    // Sort chronologically
    rawMovements.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate opening balance before fromDate
    const initBal = Number(currentAccount.initialBalance) || 0;
    let preDebit = 0;
    let preCredit = 0;

    const filteredMovements: Omit<AccountMovement, 'runningBalance'>[] = [];

    rawMovements.forEach(m => {
      if (fromDate && m.date < fromDate) {
        preDebit += m.debit;
        preCredit += m.credit;
        return;
      }
      if (toDate && m.date > toDate) {
        return;
      }
      if (costCenterFilter !== 'all' && m.costCenterId !== costCenterFilter) {
        return;
      }
      if (searchEntryQuery.trim()) {
        const q = searchEntryQuery.toLowerCase();
        const match =
          m.description.toLowerCase().includes(q) ||
          m.entryNumber.toLowerCase().includes(q) ||
          (m.costCenterName && m.costCenterName.toLowerCase().includes(q));
        if (!match) return;
      }
      filteredMovements.push(m);
    });

    const isDebitNature = currentAccount.type === 'asset' || currentAccount.type === 'expense';
    let running = isDebitNature
      ? initBal + (preDebit - preCredit)
      : initBal + (preCredit - preDebit);

    const calculatedInitialBal = running;
    let tDebit = 0;
    let tCredit = 0;

    const finalMovementsList: AccountMovement[] = filteredMovements.map(m => {
      tDebit += m.debit;
      tCredit += m.credit;
      if (isDebitNature) {
        running += (m.debit - m.credit);
      } else {
        running += (m.credit - m.debit);
      }
      return {
        ...m,
        runningBalance: running
      };
    });

    return {
      movements: finalMovementsList,
      initialBalance: calculatedInitialBal,
      totalDebit: tDebit,
      totalCredit: tCredit,
      finalBalance: running
    };
  }, [currentAccount, journalEntries, costCenters, fromDate, toDate, costCenterFilter, searchEntryQuery]);

  const curr = settings?.currency || 'ر.س';

  // Export & Share Handlers
  const handleExportExcel = () => {
    if (!currentAccount) return;
    const dataToExport = movements.map((m, idx) => ({
      'م': idx + 1,
      'رقم القيد': m.entryNumber,
      'التاريخ': m.date,
      'البيان': m.description,
      'مركز التكلفة': m.costCenterName || '-',
      'مدين': m.debit,
      'دائن': m.credit,
      'الرصيد التراكمي': m.runningBalance
    }));

    dataToExport.unshift({
      'م': 0 as any,
      'رقم القيد': 'رصيد سابق',
      'التاريخ': fromDate || '-',
      'البيان': 'الرصيد الافتتاحي / رصيد ما قبل الفترة',
      'مركز التكلفة': '-',
      'مدين': 0,
      'دائن': 0,
      'الرصيد التراكمي': initialBalance
    });

    exportToExcel(dataToExport, `كشف_حساب_${currentAccount.name}_${currentAccount.code}`);
  };

  const handlePrintPDF = () => {
    if (!currentAccount) return;
    const rows = movements.map((m, idx) => [
      String(idx + 1),
      m.entryNumber,
      m.date,
      m.description,
      m.costCenterName || '-',
      m.debit > 0 ? `${m.debit.toLocaleString()} ${curr}` : '-',
      m.credit > 0 ? `${m.credit.toLocaleString()} ${curr}` : '-',
      `${m.runningBalance.toLocaleString()} ${curr}`
    ]);

    rows.unshift([
      '0',
      '-',
      fromDate || '-',
      'الرصيد الافتتاحي / رصيد ما قبل الفترة',
      '-',
      '-',
      '-',
      `${initialBalance.toLocaleString()} ${curr}`
    ]);

    printReportAsPDF({
      title: `كشف حساب دفتر الأستاذ العام: ${currentAccount.name} (${currentAccount.code})`,
      subtitle: `الفترة من ${fromDate || 'البداية'} إلى ${toDate || 'اليوم'} | طبيعة الحساب: ${currentAccount.type === 'asset' || currentAccount.type === 'expense' ? 'مدين' : 'دائن'}`,
      headers: ['م', 'رقم القيد', 'التاريخ', 'البيان والتفاصيل', 'مركز التكلفة', 'مدين', 'دائن', 'الرصيد الجاري'],
      rows,
      totals: [
        { label: 'الرصيد الافتتاحي', value: `${initialBalance.toLocaleString()} ${curr}` },
        { label: 'إجمالي الحركات المدينة', value: `${totalDebit.toLocaleString()} ${curr}` },
        { label: 'إجمالي الحركات الدائنة', value: `${totalCredit.toLocaleString()} ${curr}` },
        { label: 'صافي الرصيد الختامي', value: `${finalBalance.toLocaleString()} ${curr}` }
      ],
      companyName: settings?.companyName,
      taxNumber: settings?.taxNumber
    });
  };

  const handleOpenShareModal = () => {
    if (!currentAccount) return;
    const reportText = formatWhatsAppReport({
      title: `كشف حساب دفتر الأستاذ - ${currentAccount.name}`,
      entityName: currentAccount.name,
      entityCode: currentAccount.code,
      period: fromDate && toDate ? `من ${fromDate} إلى ${toDate}` : 'كامل الفترة المالية',
      currency: curr,
      openingBalance: initialBalance,
      totalDebit,
      totalCredit,
      closingBalance: finalBalance,
      headers: ['القيد', 'التاريخ', 'البيان', 'مدين', 'دائن', 'الرصيد'],
      rows: movements.slice(-10).map(m => [
        m.entryNumber,
        m.date,
        m.description,
        m.debit > 0 ? m.debit.toLocaleString() : '-',
        m.credit > 0 ? m.credit.toLocaleString() : '-',
        m.runningBalance.toLocaleString()
      ]),
      notes: `تم استخراج كشف الحساب آلياً من دفتر الأستاذ العام بنظام الرؤية المحاسبي.`
    });

    setShareModalData({
      isOpen: true,
      title: `مشاركة كشف حساب: ${currentAccount.name}`,
      subtitle: `رقم الحساب: ${currentAccount.code} | الرصيد الختامي: ${finalBalance.toLocaleString()} ${curr}`,
      entityName: currentAccount.name,
      text: reportText
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-md shadow-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>دفتر الأستاذ العام وكشوف الحسابات المباشرة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  مباشر من الرئيسية
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                استعراض فوري لكشف أي حساب في شجرة الحسابات مع كشف الحركات، الأرصدة التراكمية، والمشاركة السريعة بالواتساب.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenFullLedgerModal && currentAccount && (
            <button
              onClick={() => onOpenFullLedgerModal(currentAccount)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>نافذة دفتر الأستاذ المنبثقة</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800/60 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير إكسل</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة PDF</span>
          </button>

          <button
            onClick={handleOpenShareModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة بالواتساب</span>
          </button>
        </div>
      </div>

      {/* Account Selector & Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
        {/* Account Selector Dropdown */}
        <div className="md:col-span-6 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>اختر الحساب المطلوب استعراض دفتر أستاذه:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono font-normal">
              {filteredAccountOptions.length} حساب متاح
            </span>
          </label>

          <div className="flex gap-2">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filteredAccountOptions.map(acc => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] {acc.name} - ({acc.currentBalance.toLocaleString()} {curr})
                </option>
              ))}
            </select>

            <select
              value={accountCategoryFilter}
              onChange={(e) => setAccountCategoryFilter(e.target.value as any)}
              className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">كل الأنواع</option>
              <option value="asset">الأصول</option>
              <option value="liability">الخصوم</option>
              <option value="equity">حقوق الملكية</option>
              <option value="revenue">الإيرادات</option>
              <option value="expense">المصروفات</option>
            </select>
          </div>
        </div>

        {/* Date Filter Quick Inputs */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>من تاريخ:</span>
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>إلى تاريخ:</span>
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Account Info Header & KPI Cards */}
      {currentAccount && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-bold border border-emerald-500/40">
                  {currentAccount.code}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{currentAccount.name}</h3>
                <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {currentAccount.type === 'asset' ? 'أصل' :
                   currentAccount.type === 'liability' ? 'التزام' :
                   currentAccount.type === 'equity' ? 'حقوق ملكية' :
                   currentAccount.type === 'revenue' ? 'إيراد' : 'مصروف'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                طبيعة الحساب: <span className="font-bold text-emerald-400">{currentAccount.type === 'asset' || currentAccount.type === 'expense' ? 'مدين بطبيعته' : 'دائن بطبيعته'}</span> | المستوى: {currentAccount.level || 3}
              </p>
            </div>

            <div className="mt-3 sm:mt-0 text-left">
              <div className="text-xs text-slate-400">الرصيد الختامي الحالي</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400" dir="ltr">
                {finalBalance.toLocaleString()} {curr}
              </div>
            </div>
          </div>

          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الرصيد الافتتاحي / السابق</div>
              <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 font-mono mt-1" dir="ltr">
                {initialBalance.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>إجمالي حركات المدين</span>
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-1" dir="ltr">
                {totalDebit.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>إجمالي حركات الدائن</span>
              </div>
              <div className="text-base sm:text-lg font-black text-rose-800 dark:text-rose-300 font-mono mt-1" dir="ltr">
                {totalCredit.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>صافي حركة الفترة</span>
              </div>
              <div className="text-base sm:text-lg font-black text-blue-800 dark:text-blue-300 font-mono mt-1" dir="ltr">
                {(totalDebit - totalCredit).toLocaleString()} {curr}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
              حركات القيد لدفتر الأستاذ ({movements.length} حركة مرحلة)
            </h4>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchEntryQuery}
              onChange={(e) => setSearchEntryQuery(e.target.value)}
              placeholder="بحث في البيان أو رقم القيد..."
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-3 py-1.5 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 w-full sm:w-60"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 w-28">رقم القيد</th>
                <th className="p-3 w-24">التاريخ</th>
                <th className="p-3">البيان والشرح المحاسبي</th>
                <th className="p-3 w-32">مركز التكلفة / المشروع</th>
                <th className="p-3 text-left w-28 text-emerald-700 dark:text-emerald-400">مدين (+)</th>
                <th className="p-3 text-left w-28 text-rose-700 dark:text-rose-400">دائن (-)</th>
                <th className="p-3 text-left w-32 text-blue-700 dark:text-blue-400 font-black">الرصيد الجاري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {/* Row for Opening Balance */}
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold">
                <td className="p-3 text-center">-</td>
                <td className="p-3 font-mono">-</td>
                <td className="p-3 font-mono">{fromDate || '-'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <span>📌 رصيد أول المدة / الرصيد الافتتاحي السابق</span>
                  </div>
                </td>
                <td className="p-3">-</td>
                <td className="p-3 text-left font-mono">-</td>
                <td className="p-3 text-left font-mono">-</td>
                <td className="p-3 text-left font-mono font-black text-slate-800 dark:text-slate-200" dir="ltr">
                  {initialBalance.toLocaleString()} {curr}
                </td>
              </tr>

              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    لا توجد حركات قيود مسجلة لهذا الحساب خلال الفترة المحددة
                  </td>
                </tr>
              ) : (
                movements.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {m.entryNumber}
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="p-3 text-slate-900 dark:text-slate-100 font-medium">
                      {m.description}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {m.costCenterName ? (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold">
                          {m.costCenterName}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {m.debit > 0 ? `${m.debit.toLocaleString()} ${curr}` : '-'}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-rose-600 dark:text-rose-400" dir="ltr">
                      {m.credit > 0 ? `${m.credit.toLocaleString()} ${curr}` : '-'}
                    </td>
                    <td className="p-3 text-left font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20" dir="ltr">
                      {m.runningBalance.toLocaleString()} {curr}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-xs text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
              <tr>
                <td colSpan={5} className="p-3 text-right">المجموع الكلي للحركات والرصيد الختامي:</td>
                <td className="p-3 text-left font-mono text-emerald-700 dark:text-emerald-400" dir="ltr">
                  {totalDebit.toLocaleString()} {curr}
                </td>
                <td className="p-3 text-left font-mono text-rose-700 dark:text-rose-400" dir="ltr">
                  {totalCredit.toLocaleString()} {curr}
                </td>
                <td className="p-3 text-left font-mono text-blue-700 dark:text-blue-400 text-sm" dir="ltr">
                  {finalBalance.toLocaleString()} {curr}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Share Report Modal */}
      {shareModalData.isOpen && (
        <ShareReportModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData({ ...shareModalData, isOpen: false })}
          title={shareModalData.title}
          subtitle={shareModalData.subtitle}
          entityName={shareModalData.entityName}
          initialReportText={shareModalData.text}
          onPrintPdf={handlePrintPDF}
          onExportExcel={handleExportExcel}
          customersSuppliers={customersSuppliers}
          employees={employees}
          banks={banks}
          settings={settings}
          users={users}
          lang={lang}
        />
      )}
    </div>
  );
};
