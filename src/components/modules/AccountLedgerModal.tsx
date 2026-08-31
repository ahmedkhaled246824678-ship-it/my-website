import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Calendar,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Layers,
  BookOpen,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  ChevronDown,
  Share2,
  FileText
} from 'lucide-react';
import { Account, JournalEntry, CostCenter, CompanySettings, UserAccount, CustomerSupplier, Employee, BankAccount } from '../../types';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { getCompanySettings } from '../../utils/storage';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { formatFilterPeriodDescription } from '../../utils/dateFilter';
import { formatWhatsAppReport, sendWhatsAppMessage } from '../../utils/whatsappPrinter';
import { ShareReportModal } from '../common/ShareReportModal';
import { AccountPdfOptions, shareAccountPdfViaWhatsApp } from '../../utils/pdfGenerator';
import { Language, t } from '../../utils/i18n';

export interface AccountMovement {
  id: string;
  entryId: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  costCenterId?: string;
  costCenterName?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  isPosted: boolean;
  createdBy?: string;
}

interface AccountLedgerModalProps {
  account: Account;
  accounts: Account[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  settings?: CompanySettings;
  currentUser?: UserAccount;
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  users?: UserAccount[];
  onClose: () => void;
  onSelectAccount: (acc: Account) => void;
  lang?: Language;
}

export const AccountLedgerModal: React.FC<AccountLedgerModalProps> = ({
  account,
  accounts = [],
  journalEntries = [],
  costCenters = [],
  settings: propSettings,
  currentUser,
  customersSuppliers = [],
  employees = [],
  banks = [],
  users = [],
  onClose,
  onSelectAccount,
  lang = 'ar'
}) => {
  const companySettings = propSettings || getCompanySettings();

  // حالة نافذة المشاركة والإرسال
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    entityName?: string;
    text: string;
    pdfOptions?: AccountPdfOptions;
    onPrintPdf?: () => void;
    onExportExcel?: () => void;
  }>({
    isOpen: false,
    title: '',
    text: ''
  });

  // الفلاتر
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [postFilter, setPostFilter] = useState<'all' | 'posted' | 'draft'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');

  const canExport = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canExport !== false) : true;

  // استخراج وترتيب جميع حركات الحساب
  const { allMovements, initialBalance, totalDebit, totalCredit, finalBalance } = useMemo(() => {
    const rawMovements: Omit<AccountMovement, 'runningBalance'>[] = [];

    // استخراج من القيود اليومية
    journalEntries.forEach(entry => {
      if (!entry.lines || !Array.isArray(entry.lines)) return;

      entry.lines.forEach((line, index) => {
        const isMatch =
          line.accountId === account.id ||
          line.accountId === account.code ||
          line.accountName === account.name ||
          (account.code && line.accountId && String(line.accountId).trim() === String(account.code).trim());

        if (isMatch) {
          const costCenterObj = costCenters.find(c => c.id === line.costCenterId);
          rawMovements.push({
            id: `${entry.id}_${line.id || index}`,
            entryId: entry.id,
            entryNumber: entry.entryNumber || 'قيد غير مرقم',
            date: entry.date || '',
            description: line.description || entry.description || 'حركة قيد محاسبي',
            referenceType: entry.referenceType,
            referenceId: entry.referenceId,
            costCenterId: line.costCenterId,
            costCenterName: costCenterObj ? costCenterObj.name : undefined,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            isPosted: entry.isPosted !== false,
            createdBy: entry.createdBy
          });
        }
      });
    });

    // ترتيب الحركات تصاعدياً بالتاريخ ورقم القيد
    rawMovements.sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (a.entryNumber || '').localeCompare(b.entryNumber || '');
    });

    // احتساب الرصيد التراكمي
    const isDebitNature = account.type === 'asset' || account.type === 'expense';
    let running = Number(account.initialBalance) || 0;
    let sumDebit = 0;
    let sumCredit = 0;

    const movementsWithBalance: AccountMovement[] = rawMovements.map(m => {
      if (isDebitNature) {
        running += m.debit - m.credit;
      } else {
        running += m.credit - m.debit;
      }
      sumDebit += m.debit;
      sumCredit += m.credit;

      return {
        ...m,
        runningBalance: running
      };
    });

    return {
      allMovements: movementsWithBalance,
      initialBalance: Number(account.initialBalance) || 0,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      finalBalance: running
    };
  }, [account, journalEntries, costCenters]);

  // تطبيق الفلاتر على الحركات
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      // فلتر التاريخ
      if (fromDate && m.date && m.date < fromDate) return false;
      if (toDate && m.date && m.date > toDate) return false;

      // فلتر الترحيل
      if (postFilter === 'posted' && !m.isPosted) return false;
      if (postFilter === 'draft' && m.isPosted) return false;

      // فلتر مركز التكلفة
      if (selectedCostCenter !== 'all' && m.costCenterId !== selectedCostCenter) return false;

      // فلتر البحث النصي
      if (searchFilter) {
        const query = searchFilter.toLowerCase().trim();
        const inDesc = m.description.toLowerCase().includes(query);
        const inNum = m.entryNumber.toLowerCase().includes(query);
        const inCC = (m.costCenterName || '').toLowerCase().includes(query);
        const inCreated = (m.createdBy || '').toLowerCase().includes(query);
        if (!inDesc && !inNum && !inCC && !inCreated) return false;
      }

      return true;
    });
  }, [allMovements, fromDate, toDate, postFilter, selectedCostCenter, searchFilter]);

  // مجاميع الحركات بعد الفلترة
  const filteredDebitSum = useMemo(() => filteredMovements.reduce((acc, m) => acc + m.debit, 0), [filteredMovements]);
  const filteredCreditSum = useMemo(() => filteredMovements.reduce((acc, m) => acc + m.credit, 0), [filteredMovements]);

  // مسميات التصنيفات
  const typeMap: Record<string, string> = {
    asset: 'أصول',
    liability: 'خصوم والتزامات',
    equity: 'حقوق ملكية',
    revenue: 'إيرادات',
    expense: 'مصروفات'
  };

  const isDebitNature = account.type === 'asset' || account.type === 'expense';
  const balanceNatureLabel = isDebitNature ? 'طبيعة الحساب: مدين (+)' : 'طبيعة الحساب: دائن (+)';

  // مرجع نوع الحركة بالعربي
  const refTypeMap: Record<string, string> = {
    manual: 'قيد يدوي',
    treasury: 'حركة خزينة',
    bank: 'حركة بنكية',
    expense: 'سند مصروفات',
    custody: 'عهدة وسلفة موقع',
    advance: 'سلفة موظف',
    payroll: 'مسير رواتب',
    site_settlement: 'تسوية موقع',
    invoice: 'فاتورة مبيعات/مشتريات'
  };

  // طباعة كشف الحساب الرسمي
  const handlePrintStatement = () => {
    const periodText = (fromDate || toDate)
      ? `الفترة: ${fromDate ? `من ${fromDate}` : ''} ${toDate ? `إلى ${toDate}` : ''}`
      : 'كامل الحركات المسجلة في السنة المالية';

    let tableRows = `
      <tr class="initial-row" style="background-color: #f8fafc; font-weight: bold;">
        <td style="text-align: center;">-</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: center; color: #1e3a8a;">-</td>
        <td><strong>الرصيد الافتتاحي للحساب (Opening Balance)</strong></td>
        <td style="text-align: center;">-</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: right; font-family: monospace; font-weight: bold; color: ${initialBalance < 0 ? '#b91c1c' : '#15803d'};">
          ${initialBalance.toLocaleString()} ${companySettings.currency}
        </td>
        <td style="text-align: center;"><span style="color: #059669;">معتمد</span></td>
      </tr>
    `;

    filteredMovements.forEach((m, idx) => {
      tableRows += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: center; font-family: monospace;">${m.date || '-'}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; color: #1d4ed8;">${m.entryNumber}</td>
          <td>
            <strong>${m.description}</strong>
            ${m.costCenterName ? `<br><small style="color: #6b7280;">مركز التكلفة: ${m.costCenterName}</small>` : ''}
            ${m.referenceType ? `<br><small style="color: #4b5563;">المصدر: ${refTypeMap[m.referenceType] || m.referenceType}</small>` : ''}
          </td>
          <td style="text-align: right; font-family: monospace; font-weight: bold; color: #1e3a8a;">
            ${m.debit > 0 ? `${m.debit.toLocaleString()} ${companySettings.currency}` : '-'}
          </td>
          <td style="text-align: right; font-family: monospace; font-weight: bold; color: #9333ea;">
            ${m.credit > 0 ? `${m.credit.toLocaleString()} ${companySettings.currency}` : '-'}
          </td>
          <td style="text-align: right; font-family: monospace; font-weight: bold; color: ${m.runningBalance < 0 ? '#b91c1c' : '#15803d'};">
            ${m.runningBalance.toLocaleString()} ${companySettings.currency}
          </td>
          <td style="text-align: center;">
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; ${m.isPosted ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fef3c7; color: #92400e;'}">
              ${m.isPosted ? 'مرحل' : 'مسودة'}
            </span>
          </td>
        </tr>
      `;
    });

    const statementHtml = `
      <div style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 11px; color: #1e40af; font-weight: bold;">الرصيد الافتتاحي</div>
            <div style="font-size: 16px; font-weight: 800; color: #1e3a8a; font-family: monospace;">${initialBalance.toLocaleString()} ${companySettings.currency}</div>
          </div>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 11px; color: #166534; font-weight: bold;">إجمالي المدين (+)</div>
            <div style="font-size: 16px; font-weight: 800; color: #15803d; font-family: monospace;">${filteredDebitSum.toLocaleString()} ${companySettings.currency}</div>
          </div>
          <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 11px; color: #6b21a8; font-weight: bold;">إجمالي الدائن (-)</div>
            <div style="font-size: 16px; font-weight: 800; color: #7e22ce; font-family: monospace;">${filteredCreditSum.toLocaleString()} ${companySettings.currency}</div>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 11px; color: #334155; font-weight: bold;">صافي الرصيد الحالي</div>
            <div style="font-size: 16px; font-weight: 800; color: ${finalBalance < 0 ? '#b91c1c' : '#0f172a'}; font-family: monospace;">${finalBalance.toLocaleString()} ${companySettings.currency}</div>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
          <div>رمز الحساب: <span style="font-family: monospace; color: #1e3a8a;">${account.code}</span> | اسم الحساب: <span style="color: #0f172a;">${account.name}</span></div>
          <div>التصنيف: <span>${typeMap[account.type] || account.type}</span> | عدد الحركات: <span>${filteredMovements.length}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 12%; text-align: center;">التاريخ</th>
              <th style="width: 12%; text-align: center;">رقم القيد</th>
              <th style="width: 35%;">البيان والشرح</th>
              <th style="width: 12%; text-align: right;">مدين (+)</th>
              <th style="width: 12%; text-align: right;">دائن (-)</th>
              <th style="width: 12%; text-align: right;">الرصيد المتحرك</th>
              <th style="width: 8%; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr class="total-row" style="background-color: #e2e8f0; font-weight: 800;">
              <td colspan="4" style="text-align: left; padding: 12px;">المجموع الإجمالي للحركات المحددة:</td>
              <td style="text-align: right; font-family: monospace; font-size: 14px; color: #1e3a8a;">${filteredDebitSum.toLocaleString()} ${companySettings.currency}</td>
              <td style="text-align: right; font-family: monospace; font-size: 14px; color: #7e22ce;">${filteredCreditSum.toLocaleString()} ${companySettings.currency}</td>
              <td style="text-align: right; font-family: monospace; font-size: 14px; color: ${finalBalance < 0 ? '#b91c1c' : '#15803d'};">${finalBalance.toLocaleString()} ${companySettings.currency}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    printReportAsPDF(`كشف حساب تفصيلي - ${account.name} (${account.code})`, statementHtml, periodText);
  };

  // تصدير كشف الحساب إلى ملف Excel CSV
  const handleExportExcel = () => {
    const excelRows: Record<string, any>[] = [
      {
        'م': 'الرصيد الافتتاحي',
        'التاريخ': '-',
        'رقم القيد': '-',
        'البيان والشرح': 'الرصيد الافتتاحي المسجل للحساب',
        'المصدر': 'افتتاحي',
        'مركز التكلفة': '-',
        'مدين (+)': 0,
        'دائن (-)': 0,
        'الرصيد التراكمي': initialBalance,
        'الحالة': 'معتمد'
      }
    ];

    filteredMovements.forEach((m, idx) => {
      excelRows.push({
        'م': idx + 1,
        'التاريخ': m.date || '-',
        'رقم القيد': m.entryNumber,
        'البيان والشرح': m.description,
        'المصدر': refTypeMap[m.referenceType || ''] || m.referenceType || 'قيد',
        'مركز التكلفة': m.costCenterName || '-',
        'مدين (+)': m.debit,
        'دائن (-)': m.credit,
        'الرصيد التراكمي': m.runningBalance,
        'الحالة': m.isPosted ? 'مرحل' : 'مسودة'
      });
    });

    // سطر الإجمالي
    excelRows.push({
      'م': 'المجموع',
      'التاريخ': '-',
      'رقم القيد': '-',
      'البيان والشرح': 'إجمالي الحركات وصافي الرصيد النهائي',
      'المصدر': '-',
      'مركز التكلفة': '-',
      'مدين (+)': filteredDebitSum,
      'دائن (-)': filteredCreditSum,
      'الرصيد التراكمي': finalBalance,
      'الحالة': '-'
    });

    exportToExcel(excelRows, `كشف_حساب_${account.code}_${account.name.replace(/\s+/g, '_')}`);
  };

  const handleShareWhatsApp = () => {
    const periodStr = fromDate || toDate ? `${fromDate || 'البداية'} إلى ${toDate || 'اليوم'}` : 'كافة الفترات';
    const recentRows = filteredMovements.slice(0, 15).map((m, idx) => 
      `${idx + 1}. [${m.date}] قيد: ${m.entryNumber} | ${m.description} | مدين: ${m.debit.toLocaleString()} | دائن: ${m.credit.toLocaleString()} | رصيد: ${m.runningBalance.toLocaleString()} ${companySettings.currency}`
    );

    const report = formatWhatsAppReport({
      title: '📑 *كشف حساب تفصيلي - دفتر الأستاذ*',
      entityName: `${account.name} (${typeMap[account.type] || account.type})`,
      entityCode: account.code,
      date: new Date().toISOString().slice(0, 10),
      currency: companySettings.currency,
      openingBalance: initialBalance,
      period: periodStr,
      totalDebit: filteredDebitSum,
      totalCredit: filteredCreditSum,
      closingBalance: finalBalance,
      items: recentRows.length > 0 ? recentRows : ['لا توجد حركات مسجلة في الفترة المحددة'],
      notes: `إجمالي عدد الحركات: ${filteredMovements.length} حركة. تم إنشاء هذا الكشف من نظام الرؤية للمحاسبة وهو جاهز للطباعة والاعتماد.`
    });

    const pdfRows = filteredMovements.map((m, idx) => [
      `${idx + 1}`,
      m.date || '-',
      m.entryNumber,
      m.description,
      m.costCenterName || '-',
      m.debit > 0 ? m.debit.toLocaleString() : '-',
      m.credit > 0 ? m.credit.toLocaleString() : '-',
      `${m.runningBalance.toLocaleString()} ${companySettings.currency}`
    ]);

    const pdfOptions: AccountPdfOptions = {
      title: `كشف حساب تفصيلي - دفتر الأستاذ`,
      subtitle: `حساب: ${account.name} (${account.code})`,
      accountName: account.name,
      accountCode: account.code,
      accountType: typeMap[account.type] || account.type,
      period: periodStr,
      date: new Date().toISOString().slice(0, 10),
      currency: companySettings.currency,
      openingBalance: initialBalance,
      totalDebit: filteredDebitSum,
      totalCredit: filteredCreditSum,
      closingBalance: finalBalance,
      headers: ['م', 'التاريخ', 'رقم القيد', 'البيان والشرح', 'مركز التكلفة', 'مدين (+)', 'دائن (-)', 'الرصيد التراكمي'],
      rows: pdfRows,
      totals: [
        { label: 'إجمالي الحركات المدينة (+)', value: `${filteredDebitSum.toLocaleString()} ${companySettings.currency}`, isDebit: true },
        { label: 'إجمالي الحركات الدائنة (-)', value: `${filteredCreditSum.toLocaleString()} ${companySettings.currency}`, isCredit: true },
        { label: 'صافي الرصيد الختامي للحساب', value: `${finalBalance.toLocaleString()} ${companySettings.currency}` }
      ],
      notes: `تم إنشاء كشف الحساب رسمياً بناءً على قيود الأستاذ العام المعتمدة. عدد الحركات: ${filteredMovements.length}.`,
      companySettings: companySettings
    };

    setShareModalData({
      isOpen: true,
      title: `مشاركة وإرسال كشف حساب: ${account.name}`,
      subtitle: `رمز الحساب: ${account.code} | الفترة: ${periodStr}`,
      entityName: `${account.name} [${account.code}]`,
      text: report,
      pdfOptions: pdfOptions,
      onPrintPdf: handlePrintStatement,
      onExportExcel: handleExportExcel
    });
  };

  const handleShareMovement = (m: AccountMovement) => {
    const report = formatWhatsAppReport({
      title: '🧾 *إشعار حركة وقيد محاسبي*',
      entityName: `${account.name} [${account.code}]`,
      entityCode: `ENTRY-${m.entryNumber}`,
      date: m.date || new Date().toISOString().slice(0, 10),
      currency: companySettings.currency,
      openingBalance: 0,
      period: m.date || 'اليوم',
      totalDebit: m.debit,
      totalCredit: m.credit,
      closingBalance: m.runningBalance,
      items: [
        `• رقم القيد: ${m.entryNumber}`,
        `• البيان: ${m.description}`,
        m.costCenterName ? `• مركز التكلفة: ${m.costCenterName}` : '',
        m.referenceType ? `• المصدر: ${refTypeMap[m.referenceType] || m.referenceType}` : '',
        `• مدين (+): ${m.debit.toLocaleString()} ${companySettings.currency}`,
        `• دائن (-): ${m.credit.toLocaleString()} ${companySettings.currency}`,
        `• الرصيد بعد الحركة: ${m.runningBalance.toLocaleString()} ${companySettings.currency}`,
        `• الحالة: ${m.isPosted ? 'مرحل ومعتمد' : 'مسودة'}`
      ].filter(Boolean),
      notes: 'إشعار حركة محاسبية معتمد صادر من نظام الرؤية المحاسبي.'
    });

    setShareModalData({
      isOpen: true,
      title: `مشاركة إشعار قيد: ${m.entryNumber}`,
      subtitle: `${m.date} | ${m.description}`,
      entityName: `${account.name} - قيد ${m.entryNumber}`,
      text: report
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        
        {/* رأس النافذة (Header) */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                  {account.code}
                </span>
                <h3 className="text-xl font-black text-white">{account.name}</h3>
                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {typeMap[account.type] || account.type}
                </span>
                {account.isActive ? (
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    نشط
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                    موقف
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>كشف الحساب التفصيلي ودفتر الأستاذ المساعد</span>
                <span>•</span>
                <span className="text-amber-400">{balanceNatureLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* التبديل السريع بين الحسابات */}
            <div className="relative">
              <select
                value={account.id}
                onChange={(e) => {
                  const target = accounts.find(a => a.id === e.target.value);
                  if (target) onSelectAccount(target);
                }}
                className="bg-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                title="التبديل إلى حساب آخر مباشرة"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            {canExport && (
              <>
                <button
                  onClick={handlePrintStatement}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  title="طباعة كشف الحساب أو تصديره كـ PDF رسمي"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة كشف الحساب</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  title="مشاركة وإرسال كشف الحساب بتنسيق قابل للطباعة عبر واتساب"
                >
                  <Share2 className="w-4 h-4" />
                  <span>إرسال بالواتساب</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  title="تصدير الحركات إلى ملف إكسل CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير إكسل</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* بطاقات الإحصائيات والأرصدة (Summary KPI Cards) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">الرصيد الافتتاحي</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black font-mono text-slate-900">
              {initialBalance.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{companySettings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">رصيد أول المدة المسجل</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-blue-700">إجمالي المدين (+)</span>
              <ArrowDownLeft className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black font-mono text-blue-600">
              {filteredDebitSum.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{companySettings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">مجموع الحركات المدينة</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-purple-700">إجمالي الدائن (-)</span>
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-black font-mono text-purple-600">
              {filteredCreditSum.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{companySettings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">مجموع الحركات الدائنة</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-emerald-800">صافي الرصيد الحالي</span>
              {finalBalance >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
            </div>
            <div className={`text-lg font-black font-mono ${finalBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {finalBalance.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{companySettings.currency}</span>
            </div>
            <div className="text-[11px] font-bold">
              {finalBalance > 0 ? (
                <span className="text-emerald-700">رصيد مدين {isDebitNature ? '(موجب)' : ''}</span>
              ) : finalBalance < 0 ? (
                <span className="text-rose-600">رصيد دائن {isDebitNature ? '(سالب)' : ''}</span>
              ) : (
                <span className="text-slate-500">حساب متزن (0)</span>
              )}
            </div>
          </div>
        </div>

        {/* شريط الفلاتر والبحث (Filters Toolbar) */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <AdvancedDateFilter
            startDate={fromDate}
            endDate={toDate}
            title="تصفية حركات هذا الحساب بالأيام والشهور والسنة"
            compact={true}
            onChange={(start, end) => {
              setFromDate(start);
              setToDate(end);
            }}
            onReset={() => {
              setFromDate('');
              setToDate('');
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold pt-1">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* البحث السريع */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="بحث في البيان، رقم القيد، المرجع..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* فلتر حالة الترحيل */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPostFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${postFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
                >
                  الكل ({allMovements.length})
                </button>
                <button
                  onClick={() => setPostFilter('posted')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${postFilter === 'posted' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'}`}
                >
                  المرحّلة فقط
                </button>
                <button
                  onClick={() => setPostFilter('draft')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${postFilter === 'draft' ? 'bg-amber-500 text-white shadow' : 'text-slate-600'}`}
                >
                  مسودات
                </button>
              </div>

              {/* مركز التكلفة */}
              {costCenters.length > 0 && (
                <select
                  value={selectedCostCenter}
                  onChange={(e) => setSelectedCostCenter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كافة مراكز التكلفة والمشاريع</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-slate-500 text-xs font-medium">
              عرض <span className="font-bold text-slate-800">{filteredMovements.length}</span> حركة من إجمالي <span className="font-bold text-slate-800">{allMovements.length}</span>
            </div>
          </div>
        </div>

        {/* جدول الحركات التفصيلي (Scrollable Movements Table) */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 font-extrabold">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3 w-24 text-center">التاريخ</th>
                <th className="py-3 px-3 w-28 text-center">رقم القيد</th>
                <th className="py-3 px-3">البيان والشرح المحاسبي</th>
                <th className="py-3 px-3 w-28 text-right text-blue-800">مدين (+)</th>
                <th className="py-3 px-3 w-28 text-right text-purple-800">دائن (-)</th>
                <th className="py-3 px-3 w-32 text-right text-slate-900">الرصيد التراكمي</th>
                <th className="py-3 px-3 w-20 text-center">الحالة</th>
                <th className="py-3 px-3 w-16 text-center">مشاركة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* سطر الرصيد الافتتاحي */}
              <tr className="bg-blue-50/60 font-bold border-b border-blue-100">
                <td className="py-3 px-3 text-center text-slate-400">-</td>
                <td className="py-3 px-3 text-center font-mono text-slate-500">-</td>
                <td className="py-3 px-3 text-center font-mono text-blue-600 font-bold">افتتاحي</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-slate-900 font-extrabold">الرصيد الافتتاحي المسجل للحساب (Opening Balance)</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">-</td>
                <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-900">
                  {initialBalance.toLocaleString()} {companySettings.currency}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700">
                    رصيد أول
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-slate-300">-</td>
              </tr>

              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-600" />
                    <p className="font-bold text-slate-600">لا توجد حركات مسجلة لهذا الحساب تطابق معايير الفلترة</p>
                    <p className="text-[11px] text-slate-400 mt-1">تأكد من اختيار نطاق تاريخ واسع أو إلغاء فلاتر البحث</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-semibold">{m.date || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {m.entryNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{m.description}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                        {m.costCenterName && (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Building className="w-3 h-3 text-slate-400" />
                            {m.costCenterName}
                          </span>
                        )}
                        {m.referenceType && (
                          <span className="text-slate-500">
                            المصدر: {refTypeMap[m.referenceType] || m.referenceType}
                          </span>
                        )}
                        {m.createdBy && (
                          <span className="text-slate-400">بواسطة: {m.createdBy}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                      {m.debit > 0 ? (
                        <span>{m.debit.toLocaleString()} {companySettings.currency}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                      {m.credit > 0 ? (
                        <span>{m.credit.toLocaleString()} {companySettings.currency}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold">
                      <span className={m.runningBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {m.runningBalance.toLocaleString()} {companySettings.currency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.isPosted ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مرحل</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>مسودة</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleShareMovement(m)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition cursor-pointer"
                        title="مشاركة وإرسال إشعار هذه الحركة / القيد عبر واتساب أو البريد"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* تذييل النافذة (Footer with Totals) */}
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-400 ml-1">إجمالي الحركات المدينة:</span>
              <span className="font-mono font-bold text-blue-400 text-sm">{filteredDebitSum.toLocaleString()} {companySettings.currency}</span>
            </div>
            <div className="text-slate-600">|</div>
            <div>
              <span className="text-slate-400 ml-1">إجمالي الحركات الدائنة:</span>
              <span className="font-mono font-bold text-purple-400 text-sm">{filteredCreditSum.toLocaleString()} {companySettings.currency}</span>
            </div>
            <div className="text-slate-600">|</div>
            <div>
              <span className="text-slate-400 ml-1">صافي الرصيد الختامي:</span>
              <span className={`font-mono font-extrabold text-sm ${finalBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {finalBalance.toLocaleString()} {companySettings.currency}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canExport && (
              <>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
                  title="مشاركة وإرسال كشف الحساب عبر الواتساب أو البريد أو النسخ المباشر"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة وإرسال الكشف</span>
                </button>

                <button
                  onClick={handlePrintStatement}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة كشف الحساب الرسمي</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* نافذة المشاركة والإرسال التفاعلية الموحدة */}
        <ShareReportModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
          title={shareModalData.title}
          subtitle={shareModalData.subtitle}
          entityName={shareModalData.entityName}
          initialReportText={shareModalData.text}
          pdfOptions={shareModalData.pdfOptions}
          onPrintPdf={shareModalData.onPrintPdf}
          onExportExcel={shareModalData.onExportExcel}
          customersSuppliers={customersSuppliers}
          employees={employees}
          banks={banks}
          settings={companySettings}
          users={users}
          lang={lang}
        />

      </div>
    </div>
  );
};
