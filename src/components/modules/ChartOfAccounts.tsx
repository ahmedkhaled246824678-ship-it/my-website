import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Printer,
  FileSpreadsheet,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  FileText,
  Scale,
  Share2,
  Send,
  Zap,
  MessageSquare,
  Building2,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Account, AccountType, AccountSubType, UserAccount, JournalEntry, CostCenter, CompanySettings } from '../../types';
import { saveAccounts, getCompanySettings } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange, formatFilterPeriodDescription } from '../../utils/dateFilter';
import { AccountLedgerModal } from './AccountLedgerModal';
import { ShareReportModal } from '../common/ShareReportModal';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { formatWhatsAppReport, sendWhatsAppMessage } from '../../utils/whatsappPrinter';
import { AccountPdfOptions } from '../../utils/pdfGenerator';
import { Language, t } from '../../utils/i18n';

interface ChartOfAccountsProps {
  accounts: Account[];
  journalEntries?: JournalEntry[];
  costCenters?: CostCenter[];
  companySettings?: CompanySettings;
  currentUser?: UserAccount;
  onAccountsChange: (updated: Account[]) => void;
  searchQuery: string;
  lang?: Language;
}

export const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({
  accounts = [],
  journalEntries = [],
  costCenters = [],
  companySettings: propSettings,
  currentUser,
  onAccountsChange,
  searchQuery,
  lang = 'ar'
}) => {
  const settings = propSettings || getCompanySettings();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<Account | null>(null);

  // حالة نافذة المشاركة والإرسال التفاعلية
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

  // تصفية التاريخ والأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  // شريط البحث المخصص في دليل الحسابات
  const [localSearchInput, setLocalSearchInput] = useState<string>(searchQuery || '');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>(searchQuery || '');
  const [selectedSubTypeFilter, setSelectedSubTypeFilter] = useState<string>('all');

  // مزامنة البحث عند تغيير prop
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearchInput(searchQuery);
      setAppliedSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearchQuery(localSearchInput.trim());
  };

  const handleClearSearch = () => {
    setLocalSearchInput('');
    setAppliedSearchQuery('');
  };

  // نافذة إرسال كشف أي حساب رئيسي أو فرعي عبر واتساب
  const [showUniversalShareModal, setShowUniversalShareModal] = useState<boolean>(false);
  const [universalShareMode, setUniversalShareMode] = useState<'sub' | 'main'>('sub');
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string>('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('asset');
  const [universalSearch, setUniversalSearch] = useState<string>('');

  const canAdd = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canAdd !== false) : true;
  const canEdit = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canEdit !== false) : true;
  const canDelete = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canDelete !== false) : true;
  const canExport = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canExport !== false) : true;

  // تصفية القيود اليومية حسب التاريخ المحدد
  const filteredJournalEntries = useMemo(() => {
    if (!startDate && !endDate) return journalEntries;
    return journalEntries.filter(entry => isDateInRange(entry.date, startDate, endDate));
  }, [journalEntries, startDate, endDate]);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('asset');
  const [formSubType, setFormSubType] = useState<AccountSubType>('current_asset');
  const [formInitialBalance, setFormInitialBalance] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // أسماء الأنواع بالعربي
  const typeMap: Record<AccountType, string> = {
    asset: 'الأصول (المتداولة والثابتة)',
    liability: 'الخصوم والالتزامات',
    equity: 'حقوق الملكية ورأس المال',
    revenue: 'الإيرادات والمبيعات',
    expense: 'المصروفات والتكاليف'
  };

  const subTypeMap: Record<AccountSubType, string> = {
    current_asset: 'أصل متداول',
    fixed_asset: 'أصل ثابت',
    bank: 'حساب بنكي',
    cash: 'خزينة / نقدية',
    customer: 'عميل تجاري',
    supplier: 'مورد تجاري',
    current_liability: 'التزام متداول قصير',
    long_term_liability: 'التزام طويل الأجل',
    capital: 'رأس مال',
    retained_earnings: 'أرباح محتجزة',
    operating_revenue: 'إيراد تشغيلي',
    other_revenue: 'إيراد آخر',
    operating_expense: 'مصروف تشغيلي مباشر',
    admin_expense: 'مصروف إداري وعمومي',
    marketing_expense: 'مصروف تسويق وبيعي'
  };

  // احتساب إحصائيات الحركات المدينة والدائنة وصافي الحركة لكل حساب وفق الفترة المحددة
  const accountsMovementStats = useMemo(() => {
    const statsMap: Record<string, { count: number; totalDebit: number; totalCredit: number; netMovement: number }> = {};

    accounts.forEach(acc => {
      statsMap[acc.id] = { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
    });

    filteredJournalEntries.forEach(entry => {
      if (!entry.lines || !Array.isArray(entry.lines)) return;
      entry.lines.forEach(line => {
        const matchedAcc = accounts.find(
          a =>
            a.id === line.accountId ||
            a.code === line.accountId ||
            a.name === line.accountName ||
            (a.code && line.accountId && String(line.accountId).trim() === String(a.code).trim())
        );

        if (matchedAcc) {
          if (!statsMap[matchedAcc.id]) {
            statsMap[matchedAcc.id] = { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
          }
          const debitVal = Number(line.debit) || 0;
          const creditVal = Number(line.credit) || 0;
          statsMap[matchedAcc.id].count += 1;
          statsMap[matchedAcc.id].totalDebit += debitVal;
          statsMap[matchedAcc.id].totalCredit += creditVal;
        }
      });
    });

    // احتساب صافي الحركة بناءً على طبيعة الحساب
    accounts.forEach(acc => {
      if (statsMap[acc.id]) {
        const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
        if (isDebitNature) {
          statsMap[acc.id].netMovement = statsMap[acc.id].totalDebit - statsMap[acc.id].totalCredit;
        } else {
          statsMap[acc.id].netMovement = statsMap[acc.id].totalCredit - statsMap[acc.id].totalDebit;
        }
      }
    });

    return statsMap;
  }, [accounts, filteredJournalEntries]);

  // تصفيات البحث المتقدم
  const filteredAccounts = useMemo(() => {
    const q = appliedSearchQuery.trim().toLowerCase();
    return accounts.filter(acc => {
      const matchesSearch = !q || 
        acc.name.toLowerCase().includes(q) ||
        acc.code.toLowerCase().includes(q) ||
        (acc.subType && subTypeMap[acc.subType]?.toLowerCase().includes(q)) ||
        (acc.notes && acc.notes.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || acc.type === selectedType;
      const matchesSubType = selectedSubTypeFilter === 'all' || acc.subType === selectedSubTypeFilter;

      return matchesSearch && matchesType && matchesSubType;
    });
  }, [accounts, appliedSearchQuery, selectedType, selectedSubTypeFilter, subTypeMap]);

  // الإجماليات الشاملة للحسابات المفلترة (KPI Summary Totals)
  const totals = useMemo(() => {
    let initialSum = 0;
    let debitSum = 0;
    let creditSum = 0;
    let currentSum = 0;
    let totalMovementsCount = 0;

    filteredAccounts.forEach(acc => {
      const stats = accountsMovementStats[acc.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
      initialSum += Number(acc.initialBalance) || 0;
      debitSum += stats.totalDebit;
      creditSum += stats.totalCredit;
      currentSum += Number(acc.currentBalance) || 0;
      totalMovementsCount += stats.count;
    });

    return {
      initialSum,
      debitSum,
      creditSum,
      currentSum,
      totalMovementsCount
    };
  }, [filteredAccounts, accountsMovementStats]);

  // فتح نموذج الإضافة
  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormCode(`ACC-${Math.floor(Math.random() * 8999 + 1000)}`);
    setFormName('');
    setFormType('asset');
    setFormSubType('current_asset');
    setFormInitialBalance(0);
    setFormNotes('');
    setFormIsActive(true);
    setShowModal(true);
  };

  // فتح نموذج التعديل
  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormCode(acc.code);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormSubType(acc.subType);
    setFormInitialBalance(acc.initialBalance);
    setFormNotes(acc.notes || '');
    setFormIsActive(acc.isActive);
    setShowModal(true);
  };

  // حفظ الحساب (إضافة أو تعديل)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      alert('يرجى إدخال رمز الحساب واسم الحساب بنجاح');
      return;
    }

    let updated: Account[];
    if (editingAccount) {
      // تعديل
      updated = accounts.map(a => {
        if (a.id === editingAccount.id) {
          const stats = accountsMovementStats[a.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
          const newInit = Number(formInitialBalance);
          const newCurrent = newInit + stats.netMovement;
          return {
            ...a,
            code: formCode,
            name: formName,
            type: formType,
            subType: formSubType,
            initialBalance: newInit,
            currentBalance: newCurrent,
            notes: formNotes,
            isActive: formIsActive
          };
        }
        return a;
      });
    } else {
      // إضافة جديد
      const newInit = Number(formInitialBalance);
      const newAcc: Account = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        code: formCode,
        name: formName,
        type: formType,
        subType: formSubType,
        initialBalance: newInit,
        currentBalance: newInit,
        isActive: formIsActive,
        notes: formNotes,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      updated = [...accounts, newAcc];
    }

    saveAccounts(updated);
    onAccountsChange(updated);
    setShowModal(false);
    customAlert(editingAccount ? 'تم تعديل بيانات الحساب والرصيد الافتتاحي بنجاح!' : 'تم إضافة الحساب الجديد بنجاح!', 'success');
  };

  // تفعيل الحذف في كل الحسابات
  const handleDelete = (id: string, name: string) => {
    customConfirm(`تنبيه: هل أنت متأكد من رغبتك في حذف الحساب "${name}" بشكل نهائي؟`, () => {
      const updated = accounts.filter(a => a.id !== id);
      saveAccounts(updated);
      onAccountsChange(updated);
      customAlert('تم حذف الحساب بنجاح!', 'success');
    }, 'تأكيد حذف الحساب المحاسبي');
  };

  // تحضير بيانات التصدير والطباعة
  const exportData = filteredAccounts.map(acc => {
    const stats = accountsMovementStats[acc.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
    return {
      'رمز الحساب': acc.code,
      'اسم الحساب': acc.name,
      'التصنيف الرئيسي': typeMap[acc.type],
      'التصنيف الفرعي': subTypeMap[acc.subType],
      'الرصيد الافتتاحي': acc.initialBalance,
      'حركات الفترة: مدين (+)': stats.totalDebit,
      'حركات الفترة: دائن (-)': stats.totalCredit,
      'صافي الحركة': stats.netMovement,
      'الرصيد الحالي الدفتري': acc.currentBalance,
      'عدد الحركات': stats.count,
      'الحالة': acc.isActive ? 'نشط' : 'موقف',
      'ملاحظات': acc.notes || ''
    };
  });

  // طباعة دفتر الأستاذ العام الشامل لكافة الحسابات
  const handlePrintFullGeneralLedger = () => {
    let ledgerSectionsHtml = '';

    filteredAccounts.forEach((acc) => {
      // تجميع حركات الحساب
      const accMovements: {
        date: string;
        entryNumber: string;
        description: string;
        costCenter?: string;
        debit: number;
        credit: number;
        running: number;
      }[] = [];

      let running = Number(acc.initialBalance) || 0;
      const isDebitNature = acc.type === 'asset' || acc.type === 'expense';

      journalEntries.forEach(entry => {
        if (!entry.lines) return;
        entry.lines.forEach(line => {
          const isMatch =
            line.accountId === acc.id ||
            line.accountId === acc.code ||
            line.accountName === acc.name ||
            (acc.code && line.accountId && String(line.accountId).trim() === String(acc.code).trim());

          if (isMatch) {
            const debit = Number(line.debit) || 0;
            const credit = Number(line.credit) || 0;
            if (isDebitNature) {
              running += debit - credit;
            } else {
              running += credit - debit;
            }
            const cc = costCenters.find(c => c.id === line.costCenterId);
            accMovements.push({
              date: entry.date || '-',
              entryNumber: entry.entryNumber || '-',
              description: line.description || entry.description || 'حركة قيد',
              costCenter: cc ? cc.name : undefined,
              debit,
              credit,
              running
            });
          }
        });
      });

      const stats = accountsMovementStats[acc.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };

      let movementRows = '';
      if (accMovements.length === 0) {
        movementRows = `
          <tr>
            <td colspan="7" style="text-align: center; color: #6b7280; padding: 8px;">لا توجد حركات مسجلة خلال الفترة - الرصيد الحالي يساوي الافتتاحي (${acc.initialBalance.toLocaleString()} ${settings.currency})</td>
          </tr>
        `;
      } else {
        accMovements.forEach((m, mIdx) => {
          movementRows += `
            <tr>
              <td style="text-align: center; font-size: 11px;">${mIdx + 1}</td>
              <td style="text-align: center; font-family: monospace; font-size: 11px;">${m.date}</td>
              <td style="text-align: center; font-family: monospace; font-size: 11px; font-weight: bold; color: #1d4ed8;">${m.entryNumber}</td>
              <td style="font-size: 12px;">${m.description} ${m.costCenter ? `<small style="color: #6b7280;">(${m.costCenter})</small>` : ''}</td>
              <td style="text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; color: #1e3a8a;">${m.debit > 0 ? m.debit.toLocaleString() : '-'}</td>
              <td style="text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; color: #7e22ce;">${m.credit > 0 ? m.credit.toLocaleString() : '-'}</td>
              <td style="text-align: right; font-family: monospace; font-size: 11px; font-weight: bold; color: ${m.running < 0 ? '#b91c1c' : '#15803d'};">${m.running.toLocaleString()}</td>
            </tr>
          `;
        });
      }

      ledgerSectionsHtml += `
        <div style="margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1e293b; color: white; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
            <div>
              <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; margin-left: 8px;">${acc.code}</span>
              <strong>${acc.name}</strong>
              <span style="color: #94a3b8; font-size: 11px; margin-right: 10px;">(${typeMap[acc.type]})</span>
            </div>
            <div style="font-size: 12px;">
              <span>الرصيد الافتتاحي: <strong>${acc.initialBalance.toLocaleString()} ${settings.currency}</strong></span> | 
              <span>إجمالي الحركات: <strong>${stats.count}</strong></span> |
              <span>الرصيد الحالي: <strong style="color: ${acc.currentBalance < 0 ? '#f87171' : '#4ade80'};">${acc.currentBalance.toLocaleString()} ${settings.currency}</strong></span>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 0; font-size: 11px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="width: 5%; text-align: center; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">#</th>
                <th style="width: 12%; text-align: center; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">التاريخ</th>
                <th style="width: 13%; text-align: center; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">رقم القيد</th>
                <th style="width: 38%; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">البيان والشرح</th>
                <th style="width: 11%; text-align: right; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">مدين (+)</th>
                <th style="width: 11%; text-align: right; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">دائن (-)</th>
                <th style="width: 10%; text-align: right; padding: 6px; background-color: #e2e8f0 !important; color: #1e293b !important;">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #fafafa; font-weight: bold;">
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center; color: #2563eb;">افتتاحي</td>
                <td>رصيد أول المدة الافتتاحي للحساب</td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right; font-family: monospace;">${acc.initialBalance.toLocaleString()} ${settings.currency}</td>
              </tr>
              ${movementRows}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8fafc; font-weight: bold; border-top: 1px solid #cbd5e1;">
                <td colspan="4" style="text-align: left; padding: 6px;">مجموع حركات الحساب (${stats.count} حركة):</td>
                <td style="text-align: right; color: #1e3a8a; font-family: monospace; padding: 6px;">${stats.totalDebit.toLocaleString()}</td>
                <td style="text-align: right; color: #7e22ce; font-family: monospace; padding: 6px;">${stats.totalCredit.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; padding: 6px; color: ${acc.currentBalance < 0 ? '#b91c1c' : '#15803d'};">${acc.currentBalance.toLocaleString()} ${settings.currency}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    });

    const reportHtml = `
      <div>
        <div style="margin-bottom: 20px; text-align: center; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">تقرير دليل الحسابات التفصيلي ودفتر الأستاذ العام</h3>
          <p style="font-size: 12px; color: #64748b;">يتضمن الأرصدة الافتتاحية، حركات الفترة المدينة والدائنة، وصافي الأرصدة الحالية الدفترية</p>
        </div>
        ${ledgerSectionsHtml}
      </div>
    `;

    printReportAsPDF(
      `دليل الحسابات ودفتر الأستاذ العام الشامل`,
      reportHtml,
      `إجمالي الحسابات: ${filteredAccounts.length} | إجمالي الأرصدة: ${totals.currentSum.toLocaleString()} ${settings.currency} | السنة: ${settings.fiscalYear}`
    );
  };

  // تصدير حركات جميع الحسابات التفصيلية إلى إكسل
  const handleExportAllLedgerMovements = () => {
    const allRows: Record<string, any>[] = [];

    filteredAccounts.forEach(acc => {
      let running = Number(acc.initialBalance) || 0;
      const isDebitNature = acc.type === 'asset' || acc.type === 'expense';

      // سطر الرصيد الافتتاحي
      allRows.push({
        'رمز الحساب': acc.code,
        'اسم الحساب': acc.name,
        'التصنيف': typeMap[acc.type],
        'التاريخ': '-',
        'رقم القيد': 'افتتاحي',
        'البيان والشرح': 'الرصيد الافتتاحي المسجل للحساب',
        'مركز التكلفة': '-',
        'مدين (+)': 0,
        'دائن (-)': 0,
        'الرصيد التراكمي': acc.initialBalance
      });

      journalEntries.forEach(entry => {
        if (!entry.lines) return;
        entry.lines.forEach(line => {
          const isMatch =
            line.accountId === acc.id ||
            line.accountId === acc.code ||
            line.accountName === acc.name ||
            (acc.code && line.accountId && String(line.accountId).trim() === String(acc.code).trim());

          if (isMatch) {
            const debit = Number(line.debit) || 0;
            const credit = Number(line.credit) || 0;
            if (isDebitNature) {
              running += debit - credit;
            } else {
              running += credit - debit;
            }
            const cc = costCenters.find(c => c.id === line.costCenterId);
            allRows.push({
              'رمز الحساب': acc.code,
              'اسم الحساب': acc.name,
              'التصنيف': typeMap[acc.type],
              'التاريخ': entry.date || '-',
              'رقم القيد': entry.entryNumber || '-',
              'البيان والشرح': line.description || entry.description || 'حركة قيد',
              'مركز التكلفة': cc ? cc.name : '-',
              'مدين (+)': debit,
              'دائن (-)': credit,
              'الرصيد التراكمي': running
            });
          }
        });
      });
    });

    exportToExcel(allRows, `دليل_الحسابات_وحركات_الأستاذ_العام`);
  };

  const handleShareFullAccountsWhatsApp = () => {
    const periodStr = startDate || endDate ? `${startDate || 'البداية'} إلى ${endDate || 'اليوم'}` : 'كافة الفترات';
    const topAccountsList = filteredAccounts.slice(0, 15).map((a, i) => {
      const stats = accountsMovementStats[a.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
      return `${i + 1}. [${a.code}] ${a.name} | مدين: ${stats.totalDebit.toLocaleString()} | دائن: ${stats.totalCredit.toLocaleString()} | رصيد: ${a.currentBalance.toLocaleString()} ${settings.currency}`;
    });

    const report = formatWhatsAppReport({
      title: '📊 *كشف ملخص دليل الحسابات والأستاذ العام*',
      entityName: `${settings.companyName} - دليل الحسابات`,
      entityCode: `COA-${filteredAccounts.length}-ACCS`,
      date: new Date().toISOString().slice(0, 10),
      currency: settings.currency,
      openingBalance: totals.initialSum,
      period: periodStr,
      totalDebit: totals.debitSum,
      totalCredit: totals.creditSum,
      closingBalance: totals.currentSum,
      items: topAccountsList,
      notes: `إجمالي الحسابات: ${filteredAccounts.length} حساب | عدد الحركات: ${totals.totalMovementsCount}. جاهز للطباعة والاعتماد.`
    });

    const pdfRows = filteredAccounts.map((a, i) => {
      const stats = accountsMovementStats[a.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
      return [
        `${i + 1}`,
        a.code,
        a.name,
        typeMap[a.type],
        `${a.initialBalance.toLocaleString()} ${settings.currency}`,
        `${stats.totalDebit.toLocaleString()} ${settings.currency}`,
        `${stats.totalCredit.toLocaleString()} ${settings.currency}`,
        `${a.currentBalance.toLocaleString()} ${settings.currency}`
      ];
    });

    const pdfOptions: AccountPdfOptions = {
      title: 'كشف ملخص دليل الحسابات والأستاذ العام',
      subtitle: `${settings.companyName} - دليل الحسابات المالي`,
      accountName: 'دليل الحسابات والأرصدة',
      period: periodStr,
      date: new Date().toISOString().slice(0, 10),
      currency: settings.currency,
      openingBalance: totals.initialSum,
      totalDebit: totals.debitSum,
      totalCredit: totals.creditSum,
      closingBalance: totals.currentSum,
      headers: ['م', 'كود الحساب', 'اسم الحساب', 'التصنيف', 'الافتتاحي', 'مدين (+)', 'دائن (-)', 'الرصيد النهائي'],
      rows: pdfRows,
      totals: [
        { label: 'إجمالي الأرصدة الافتتاحية', value: `${totals.initialSum.toLocaleString()} ${settings.currency}` },
        { label: 'إجمالي الحركات المدينة (+)', value: `${totals.debitSum.toLocaleString()} ${settings.currency}`, isDebit: true },
        { label: 'إجمالي الحركات الدائنة (-)', value: `${totals.creditSum.toLocaleString()} ${settings.currency}`, isCredit: true },
        { label: 'صافي الأرصدة الختامية', value: `${totals.currentSum.toLocaleString()} ${settings.currency}` }
      ],
      notes: `تم توليد الكشف لعدد ${filteredAccounts.length} حساب. إجمالي الحركات: ${totals.totalMovementsCount}.`
    };

    setShareModalData({
      isOpen: true,
      title: 'مشاركة وإرسال ملخص دليل الحسابات والأستاذ العام',
      subtitle: `الفترة: ${periodStr} | إجمالي الحسابات: ${filteredAccounts.length} حساب`,
      entityName: `${settings.companyName} - دليل الحسابات`,
      text: report,
      pdfOptions: {
        ...pdfOptions,
        companySettings: settings
      },
      onPrintPdf: handlePrintFullGeneralLedger,
      onExportExcel: handleExportAllLedgerMovements
    });
  };

  // استخراج حركات الحساب التفصيلية من القيود اليومية لإنشاء كشف حساب كامل
  const getAccountMovementsData = (acc: Account) => {
    const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
    let running = Number(acc.initialBalance) || 0;
    const movements: {
      date: string;
      entryNumber: string;
      description: string;
      costCenterName?: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }[] = [];

    let debitSum = 0;
    let creditSum = 0;

    filteredJournalEntries.forEach(entry => {
      if (!entry.lines) return;
      entry.lines.forEach(line => {
        const isMatch =
          line.accountId === acc.id ||
          line.accountId === acc.code ||
          line.accountName === acc.name ||
          (acc.code && line.accountId && String(line.accountId).trim() === String(acc.code).trim());

        if (isMatch) {
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;
          debitSum += debit;
          creditSum += credit;
          if (isDebitNature) {
            running += debit - credit;
          } else {
            running += credit - debit;
          }
          const cc = costCenters.find(c => c.id === line.costCenterId);
          movements.push({
            date: entry.date || '-',
            entryNumber: entry.entryNumber || '-',
            description: line.description || entry.description || 'حركة قيد دفتري',
            costCenterName: cc ? cc.name : undefined,
            debit,
            credit,
            runningBalance: running
          });
        }
      });
    });

    const finalBalance = isDebitNature 
      ? (Number(acc.initialBalance) || 0) + debitSum - creditSum
      : (Number(acc.initialBalance) || 0) + creditSum - debitSum;

    return {
      movements,
      debitSum,
      creditSum,
      initialBalance: Number(acc.initialBalance) || 0,
      finalBalance
    };
  };

  // إرسال كشف حساب فرعي محدد عبر واتساب (PDF وتفاصيل)
  const handleShareSingleAccountWhatsApp = (acc: Account) => {
    const { movements, debitSum, creditSum, initialBalance, finalBalance } = getAccountMovementsData(acc);
    const periodStr = startDate || endDate ? `${startDate || 'البداية'} إلى ${endDate || 'اليوم'}` : 'كافة الفترات';

    const recentLines = movements.slice(0, 15).map((m, idx) => 
      `${idx + 1}. [${m.date}] قيد: ${m.entryNumber} | ${m.description} | مدين: ${m.debit.toLocaleString()} | دائن: ${m.credit.toLocaleString()} | رصيد: ${m.runningBalance.toLocaleString()} ${settings.currency}`
    );

    const report = formatWhatsAppReport({
      title: '📑 *كشف حساب تفصيلي - دفتر الأستاذ*',
      entityName: `${acc.name} (${typeMap[acc.type]})`,
      entityCode: acc.code,
      date: new Date().toISOString().slice(0, 10),
      currency: settings.currency,
      openingBalance: initialBalance,
      period: periodStr,
      totalDebit: debitSum,
      totalCredit: creditSum,
      closingBalance: finalBalance,
      items: recentLines.length > 0 ? recentLines : [
        `• التصنيف: ${typeMap[acc.type]} - ${subTypeMap[acc.subType]}`,
        `• لا توجد حركات مقيدة خلال الفترة المحددة`,
        `• صافي الرصيد الحالي: ${finalBalance.toLocaleString()} ${settings.currency}`
      ],
      notes: `إجمالي عدد الحركات: ${movements.length} حركة. تم إنشاء هذا الكشف رسمياً من نظام الرؤية للمحاسبة ويتضمن الشعار والبيانات الدفترية.`
    });

    const pdfRows = movements.length > 0 
      ? movements.map((m, idx) => [
          `${idx + 1}`,
          m.date,
          m.entryNumber,
          m.description,
          m.costCenterName || '-',
          m.debit > 0 ? `${m.debit.toLocaleString()} ${settings.currency}` : '-',
          m.credit > 0 ? `${m.credit.toLocaleString()} ${settings.currency}` : '-',
          `${m.runningBalance.toLocaleString()} ${settings.currency}`
        ])
      : [
          ['1', '-', 'افتتاحي', 'الرصيد الافتتاحي المقيد للحساب', '-', '-', '-', `${initialBalance.toLocaleString()} ${settings.currency}`]
        ];

    const pdfOptions: AccountPdfOptions = {
      title: `كشف حساب تفصيلي - ${acc.name}`,
      subtitle: `رمز الحساب: ${acc.code} • ${typeMap[acc.type]} (${subTypeMap[acc.subType]})`,
      accountName: acc.name,
      accountCode: acc.code,
      accountType: typeMap[acc.type],
      period: periodStr,
      date: new Date().toISOString().slice(0, 10),
      currency: settings.currency,
      openingBalance: initialBalance,
      totalDebit: debitSum,
      totalCredit: creditSum,
      closingBalance: finalBalance,
      headers: ['م', 'التاريخ', 'رقم القيد', 'البيان والشرح', 'مركز التكلفة', 'مدين (+)', 'دائن (-)', 'الرصيد التراكمي'],
      rows: pdfRows,
      totals: [
        { label: 'الرصيد الافتتاحي أول المدة', value: `${initialBalance.toLocaleString()} ${settings.currency}` },
        { label: 'إجمالي الحركات المدينة (+)', value: `${debitSum.toLocaleString()} ${settings.currency}`, isDebit: true },
        { label: 'إجمالي الحركات الدائنة (-)', value: `${creditSum.toLocaleString()} ${settings.currency}`, isCredit: true },
        { label: 'صافي الرصيد الحالي الدفتري', value: `${finalBalance.toLocaleString()} ${settings.currency}` }
      ],
      notes: `تم اعتماد وتجهيز هذا الكشف رسمياً من سجلات الأستاذ العام. عدد الحركات: ${movements.length}.`,
      companySettings: settings
    };

    setShareModalData({
      isOpen: true,
      title: `مشاركة وإرسال كشف حساب: ${acc.name} (PDF عبر واتساب)`,
      subtitle: `رمز الحساب: ${acc.code} | الرصيد: ${finalBalance.toLocaleString()} ${settings.currency}`,
      entityName: `${acc.name} [${acc.code}]`,
      text: report,
      pdfOptions: pdfOptions,
      onPrintPdf: () => setSelectedLedgerAccount(acc),
      onExportExcel: () => setSelectedLedgerAccount(acc)
    });
  };

  // إرسال كشف مجمع لحساب رئيسي / تصنيف كامل عبر واتساب
  const handleShareCategoryWhatsApp = (categoryType: string) => {
    const categoryName = categoryType === 'all' ? 'كافة الحسابات' : typeMap[categoryType as AccountType] || categoryType;
    const catAccounts = categoryType === 'all' ? filteredAccounts : filteredAccounts.filter(a => a.type === categoryType);
    const periodStr = startDate || endDate ? `${startDate || 'البداية'} إلى ${endDate || 'اليوم'}` : 'كافة الفترات';

    let initialSum = 0;
    let debitSum = 0;
    let creditSum = 0;
    let currentSum = 0;

    const pdfRows = catAccounts.map((a, i) => {
      const stats = accountsMovementStats[a.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
      initialSum += Number(a.initialBalance) || 0;
      debitSum += stats.totalDebit;
      creditSum += stats.totalCredit;
      currentSum += Number(a.currentBalance) || 0;

      return [
        `${i + 1}`,
        a.code,
        a.name,
        subTypeMap[a.subType] || a.type,
        `${a.initialBalance.toLocaleString()} ${settings.currency}`,
        `${stats.totalDebit.toLocaleString()} ${settings.currency}`,
        `${stats.totalCredit.toLocaleString()} ${settings.currency}`,
        `${stats.netMovement > 0 ? '+' : ''}${stats.netMovement.toLocaleString()} ${settings.currency}`,
        `${a.currentBalance.toLocaleString()} ${settings.currency}`
      ];
    });

    const report = formatWhatsAppReport({
      title: `📊 *كشف حساب رئيسي مجمع - ${categoryName}*`,
      entityName: `${settings.companyName} - حسابات ${categoryName}`,
      entityCode: `MAIN-${categoryType.toUpperCase()}`,
      date: new Date().toISOString().slice(0, 10),
      currency: settings.currency,
      openingBalance: initialSum,
      period: periodStr,
      totalDebit: debitSum,
      totalCredit: creditSum,
      closingBalance: currentSum,
      items: catAccounts.slice(0, 15).map((a, i) => {
        const stats = accountsMovementStats[a.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
        return `${i + 1}. [${a.code}] ${a.name} | رصيد: ${a.currentBalance.toLocaleString()} ${settings.currency} (مدين: ${stats.totalDebit.toLocaleString()} - دائن: ${stats.totalCredit.toLocaleString()})`;
      }),
      notes: `يتضمن هذا الكشف ${catAccounts.length} حساب فرعي مدرج تحت ${categoryName}. الكشف متاح بصيغة PDF قابلة للتحميل والطباعة والمشاركة.`
    });

    const pdfOptions: AccountPdfOptions = {
      title: `كشف حساب رئيسي مجمع - ${categoryName}`,
      subtitle: `${settings.companyName} • تقرير تصنيف ${categoryName}`,
      accountName: `حسابات ${categoryName}`,
      accountType: categoryName,
      period: periodStr,
      date: new Date().toISOString().slice(0, 10),
      currency: settings.currency,
      openingBalance: initialSum,
      totalDebit: debitSum,
      totalCredit: creditSum,
      closingBalance: currentSum,
      headers: ['م', 'كود الحساب', 'اسم الحساب الفرعي', 'التصنيف التفصيلي', 'الافتتاحي', 'مدين (+)', 'دائن (-)', 'صافي الحركة', 'الرصيد النهائي'],
      rows: pdfRows,
      totals: [
        { label: `إجمالي الأرصدة الافتتاحية لـ ${categoryName}`, value: `${initialSum.toLocaleString()} ${settings.currency}` },
        { label: `إجمالي الحركات المدينة (+)`, value: `${debitSum.toLocaleString()} ${settings.currency}`, isDebit: true },
        { label: `إجمالي الحركات الدائنة (-)`, value: `${creditSum.toLocaleString()} ${settings.currency}`, isCredit: true },
        { label: `صافي الأرصدة الختامية لـ ${categoryName}`, value: `${currentSum.toLocaleString()} ${settings.currency}` }
      ],
      notes: `تم إنشاء كشف الحساب المجمع لـ ${catAccounts.length} حساب فرعي معتمد في ${categoryName}.`,
      companySettings: settings
    };

    setShareModalData({
      isOpen: true,
      title: `مشاركة وإرسال كشف ${categoryName} (PDF عبر واتساب)`,
      subtitle: `الفترة: ${periodStr} | عدد الحسابات: ${catAccounts.length} حساب | صافي الرصيد: ${currentSum.toLocaleString()} ${settings.currency}`,
      entityName: `${settings.companyName} - ${categoryName}`,
      text: report,
      pdfOptions: pdfOptions,
      onPrintPdf: handlePrintFullGeneralLedger,
      onExportExcel: handleExportAllLedgerMovements
    });
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع الأزرار والتصدير */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FolderTree className="w-7 h-7 text-blue-600" />
            <span>دليل الحسابات التفصيلي والأستاذ العام</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            عرض الرصيد الافتتاحي، حركات الفترة (مدين ودائن)، وصافي الرصيد الدفتري مع إمكانية استعراض وطباعة الحركات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* الزر الرئيسي المميز لإرسال كشف أي حساب رئيسي أو فرعي عبر واتساب */}
          <button
            onClick={() => setShowUniversalShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all cursor-pointer"
            title="اختيار وإرسال كشف أي حساب رئيسي أو فرعي بصيغة PDF فوراً عبر واتساب مع الشعار والبيانات المعتمدة"
          >
            <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <span>إرسال كشف أي حساب (رئيسي / فرعي) PDF بالواتساب ⚡</span>
          </button>

          {canExport && (
            <>
              <button
                onClick={handleShareFullAccountsWhatsApp}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                title="إرسال ومشاركة ملخص دليل الحسابات بصيغة قابلة للطباعة عبر الواتساب"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>ملخص الدليل بالواتساب</span>
              </button>

              <button
                onClick={handlePrintFullGeneralLedger}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                title="طباعة تقرير شامل لجميع الحسابات وأرصدتها وحركاتها"
              >
                <BookOpen className="w-4 h-4" />
                <span>طباعة دفتر الأستاذ الشامل</span>
              </button>

              <button
                onClick={handleExportAllLedgerMovements}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                title="تصدير جميع حركات الحسابات إلى ملف إكسل CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير حركات الحسابات</span>
              </button>
            </>
          )}

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب جديد</span>
            </button>
          )}

          {canExport && (
            <ExportButtons
              title="دليل الحسابات التفصيلي للشركة"
              subtitle={`الفترة: ${formatFilterPeriodDescription(startDate, endDate, periodLabel)} | إجمالي عدد الحسابات: ${filteredAccounts.length} حساب | صافي الأرصدة: ${totals.currentSum.toLocaleString()} ${settings.currency}`}
              data={exportData}
              filename="chart_of_accounts_detailed"
            />
          )}
        </div>
      </div>

      {/* شريط البحث المتقدم بالايام والشهور والسنة ومن تاريخ إلى تاريخ */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية حركات دليل الحسابات بالأيام والشهور والسنة"
        onChange={(start, end, label) => {
          setStartDate(start);
          setEndDate(end);
          if (label) setPeriodLabel(label);
        }}
        onReset={() => {
          setStartDate('');
          setEndDate('');
          setPeriodLabel('كافة الفترات');
        }}
      />

      {/* بطاقات الإجماليات والمؤشرات المالية لدليل الحسابات (Summary KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">إجمالي الأرصدة الافتتاحية</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            {totals.initialSum.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">مجموع أرصدة أول المدة للحسابات</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-blue-700">إجمالي الحركات المدينة (+)</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono text-blue-600">
            {totals.debitSum.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">مجموع القيود المدينة ({totals.totalMovementsCount} حركة)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-purple-700">إجمالي الحركات الدائنة (-)</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black font-mono text-purple-600">
            {totals.creditSum.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">مجموع القيود الدائنة المسجلة</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-emerald-800">صافي الأرصدة الحالية</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`text-xl font-black font-mono ${totals.currentSum < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {totals.currentSum.toLocaleString()} <span className="text-xs text-slate-500 font-sans">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">الرصيد الدفتري الحالي لـ {filteredAccounts.length} حساب</div>
        </div>
      </div>

      {/* شريط البحث المخصص وزر البحث في دليل الحسابات التفصيلي */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleExecuteSearch} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={localSearchInput}
              onChange={(e) => setLocalSearchInput(e.target.value)}
              placeholder="ابحث برمز الحساب (مثل 102)، اسم الحساب، التصنيف الفرعي، أو الملاحظات..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {localSearchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                title="مسح البحث"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* زر البحث الصريح في دليل الحسابات */}
            <button
              type="submit"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>بحث في الدليل</span>
            </button>

            {appliedSearchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>إلغاء الفلتر</span>
              </button>
            )}
          </div>
        </form>

        {/* فلاتر سريعة للأنواع الفرعية الأكثر طلباً (بنوك، خزائن، عملاء، موردين، أصول ثابتة، مصروفات...) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 ml-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>فلترة سريعة:</span>
          </span>
          <button
            onClick={() => setSelectedSubTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              selectedSubTypeFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            كافة الحسابات
          </button>
          {[
            { key: 'bank', label: '🏦 البنوك' },
            { key: 'cash', label: '💵 الخزينة والنقدية' },
            { key: 'customer', label: '👥 العملاء' },
            { key: 'supplier', label: '🚚 الموردون' },
            { key: 'fixed_asset', label: '🏗️ أصول ثابتة' },
            { key: 'current_asset', label: '📦 أصول متداولة' },
            { key: 'current_liability', label: '📑 التزامات متداولة' },
            { key: 'operating_expense', label: '⚙️ مصروفات تشغيلية' },
            { key: 'admin_expense', label: '🏢 مصروفات عمومية' },
            { key: 'operating_revenue', label: '📈 إيرادات رئيسية' }
          ].map(st => (
            <button
              key={st.key}
              onClick={() => setSelectedSubTypeFilter(selectedSubTypeFilter === st.key ? 'all' : st.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                selectedSubTypeFilter === st.key ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
          
          <div className="mr-auto text-[11px] font-bold text-slate-500">
            تم العثور على <span className="text-blue-600 font-mono font-black">{filteredAccounts.length}</span> من أصل <span className="font-mono">{accounts.length}</span> حساب
          </div>
        </div>
      </div>

      {/* أزرار الفلترة حسب التصنيف الرئيسي مع زر الإرسال المباشر للتصنيف المحدد */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedType === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white/70 text-slate-700 hover:bg-white'
            }`}
          >
            الكل ({accounts.length})
          </button>
          {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map(t => {
            const count = accounts.filter(a => a.type === t).length;
            const isSelected = selectedType === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                <span>{typeMap[t].split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* زر إرسال كشف التصنيف المحدد الحالي عبر واتساب كـ PDF */}
        <button
          onClick={() => handleShareCategoryWhatsApp(selectedType)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow transition cursor-pointer"
          title={`إرسال كشف مجمع لحسابات (${selectedType === 'all' ? 'كافة الحسابات' : typeMap[selectedType as AccountType] || selectedType}) بصيغة PDF عبر واتساب`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>إرسال كشف {selectedType === 'all' ? 'الحسابات المحددة' : typeMap[selectedType as AccountType]?.split(' ')[0] || selectedType} PDF عبر واتساب ⚡</span>
        </button>
      </div>

      {/* جدول الحسابات التفصيلي متضمناً الرصيد الافتتاحي وحركات الفترة */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900 text-white font-extrabold">
              <tr>
                <th className="py-3.5 px-3 w-24 text-center">رمز الحساب</th>
                <th className="py-3.5 px-4 min-w-[200px]">اسم الحساب والتصنيف</th>
                <th className="py-3.5 px-3 text-right bg-slate-800/80 min-w-[120px]">الرصيد الافتتاحي</th>
                <th className="py-3.5 px-3 text-right bg-blue-950/70 text-blue-200 min-w-[110px]">مدين (+)</th>
                <th className="py-3.5 px-3 text-right bg-purple-950/70 text-purple-200 min-w-[110px]">دائن (-)</th>
                <th className="py-3.5 px-3 text-right min-w-[110px]">صافي الحركة</th>
                <th className="py-3.5 px-3 text-right bg-emerald-950/70 text-emerald-200 min-w-[130px]">الرصيد الحالي</th>
                <th className="py-3.5 px-3 text-center min-w-[110px]">كشف الحركات</th>
                <th className="py-3.5 px-3 text-center w-20">الحالة</th>
                <th className="py-3.5 px-3 text-center w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <span className="font-bold">لا توجد حسابات مطابقة للبحث أو الفلتر الحالي</span>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => {
                  const stats = accountsMovementStats[acc.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
                  const isDebitNature = acc.type === 'asset' || acc.type === 'expense';
                  return (
                    <tr key={acc.id} className="hover:bg-blue-50/50 transition group">
                      {/* رمز الحساب */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedLedgerAccount(acc)}
                          className="font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-lg border border-blue-200 transition cursor-pointer"
                          title="عرض كشف الحركات التفصيلي"
                        >
                          {acc.code}
                        </button>
                      </td>

                      {/* اسم الحساب والتصنيف */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setSelectedLedgerAccount(acc)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition flex items-center gap-1.5"
                          title="انقر لفتح كشف حركات الحساب"
                        >
                          <span>{acc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {typeMap[acc.type]?.split(' ')[0]}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {subTypeMap[acc.subType]}
                          </span>
                          {acc.notes && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">• {acc.notes}</span>}
                        </div>
                      </td>

                      {/* الرصيد الافتتاحي */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 bg-slate-50/70">
                        <div>{acc.initialBalance.toLocaleString()} <span className="text-[10px] font-sans text-slate-400">{settings.currency}</span></div>
                        <div className="text-[9px] text-slate-400 font-sans font-normal">
                          {isDebitNature ? 'مدين افتتاحي' : 'دائن افتتاحي'}
                        </div>
                      </td>

                      {/* حركات الفترة: مدين (+) */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                        {stats.totalDebit > 0 ? (
                          <span>{stats.totalDebit.toLocaleString()} <span className="text-[10px] font-sans text-blue-400">{settings.currency}</span></span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* حركات الفترة: دائن (-) */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-700 bg-purple-50/30">
                        {stats.totalCredit > 0 ? (
                          <span>{stats.totalCredit.toLocaleString()} <span className="text-[10px] font-sans text-purple-400">{settings.currency}</span></span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* صافي الحركة */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {stats.netMovement !== 0 ? (
                          <span className={stats.netMovement < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                            {stats.netMovement > 0 ? `+${stats.netMovement.toLocaleString()}` : stats.netMovement.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* الرصيد الحالي الدفتري */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold bg-emerald-50/40">
                        <span className={`text-sm ${acc.currentBalance < 0 ? 'text-rose-600' : 'text-emerald-800'}`}>
                          {acc.currentBalance.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-sans text-slate-500 mr-1">{settings.currency}</span>
                      </td>

                      {/* زر كشف الحركات */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedLedgerAccount(acc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition shadow-sm cursor-pointer"
                          title="عرض وطباعة جميع الحركات الخاصة بهذا الحساب"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>الحركات</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-200/90 group-hover:bg-white group-hover:text-blue-700 text-[10px]">
                            {stats.count}
                          </span>
                        </button>
                      </td>

                      {/* الحالة */}
                      <td className="py-3 px-3 text-center">
                        {acc.isActive ? (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            <span>موقف</span>
                          </span>
                        )}
                      </td>

                      {/* الإجراءات */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleShareSingleAccountWhatsApp(acc)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 hover:border-emerald-600 transition shadow-sm cursor-pointer"
                            title="إرسال كشف الحساب وتفاصيل حركاته (PDF) عبر واتساب ⚡"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(acc)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                              title="تعديل بيانات الحساب والرصيد الافتتاحي"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(acc.id, acc.name)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* سطر الإجماليات الختامي الشامل (Summary Totals Footer) */}
            {filteredAccounts.length > 0 && (
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 text-left font-bold text-slate-700">
                    المجموع الإجمالي ({filteredAccounts.length} حساب):
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-900 bg-slate-200/70">
                    {totals.initialSum.toLocaleString()} <span className="text-[10px] font-sans font-normal text-slate-600">{settings.currency}</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-blue-700 bg-blue-100/60">
                    {totals.debitSum.toLocaleString()} <span className="text-[10px] font-sans font-normal text-blue-600">{settings.currency}</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-purple-700 bg-purple-100/60">
                    {totals.creditSum.toLocaleString()} <span className="text-[10px] font-sans font-normal text-purple-600">{settings.currency}</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-800">
                    {(totals.debitSum - totals.creditSum).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-800 bg-emerald-100/60 text-sm">
                    {totals.currentSum.toLocaleString()} <span className="text-[10px] font-sans font-normal text-emerald-700">{settings.currency}</span>
                  </td>
                  <td colSpan={3} className="py-3.5 px-3 text-center text-slate-500 font-medium text-[11px]">
                    إجمالي {totals.totalMovementsCount} حركة مسجلة
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* نافذة كشف الحركات ودفتر الأستاذ التفصيلي */}
      {selectedLedgerAccount && (
        <AccountLedgerModal
          account={selectedLedgerAccount}
          accounts={accounts}
          journalEntries={journalEntries}
          costCenters={costCenters}
          settings={settings}
          currentUser={currentUser}
          onClose={() => setSelectedLedgerAccount(null)}
          onSelectAccount={(acc) => setSelectedLedgerAccount(acc)}
          lang={lang}
        />
      )}

      {/* نافذة المشاركة والإرسال التفاعلية */}
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
        lang={lang}
      />

      {/* نافذة الإضافة والتعديل */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAccount ? 'تعديل بيانات الحساب والرصيد الافتتاحي' : 'إضافة حساب جديد إلى دليل الحسابات'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز الحساب (Code) *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    placeholder="مثال: 1070"
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة الحساب</label>
                  <select
                    value={formIsActive ? 'true' : 'false'}
                    onChange={(e) => setFormIsActive(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800"
                  >
                    <option value="true">نشط وفعال</option>
                    <option value="false">موقف مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب (عربي أو إنجليزي) *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="مثال: حساب عهد ومصروفات التسويق"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الرئيسي *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccountType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800"
                  >
                    <option value="asset">أصول</option>
                    <option value="liability">خصوم (التزامات)</option>
                    <option value="equity">حقوق الملكية</option>
                    <option value="revenue">إيرادات</option>
                    <option value="expense">مصروفات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الفرعي *</label>
                  <select
                    value={formSubType}
                    onChange={(e) => setFormSubType(e.target.value as AccountSubType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800"
                  >
                    <option value="current_asset">أصل متداول</option>
                    <option value="fixed_asset">أصل ثابت</option>
                    <option value="cash">خزينة / نقدية</option>
                    <option value="bank">حساب بنكي</option>
                    <option value="customer">عميل تجاري</option>
                    <option value="supplier">مورد تجاري</option>
                    <option value="current_liability">التزام متداول</option>
                    <option value="long_term_liability">التزام طويل الأجل</option>
                    <option value="capital">رأس المال</option>
                    <option value="retained_earnings">أرباح محتجزة</option>
                    <option value="operating_revenue">إيراد تشغيلي</option>
                    <option value="other_revenue">إيراد آخر</option>
                    <option value="operating_expense">مصروف تشغيلي مباشر</option>
                    <option value="admin_expense">مصروف إداري وعمومي</option>
                    <option value="marketing_expense">مصروف تسويق</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد الافتتاحي أول المدة ({settings.currency})</label>
                <input
                  type="number"
                  value={formInitialBalance}
                  onChange={(e) => setFormInitialBalance(Number(e.target.value))}
                  className="w-full font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">رصيد أول المدة المسجل في بداية السنة المالية للحساب</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات أو وصف إضافي</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="أي تفاصيل أو ملاحظات حول طبيعة هذا الحساب..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  {editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة اختيار وإرسال أي حساب (رئيسي أو فرعي) عبر واتساب كـ PDF */}
      {showUniversalShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* رأس النافذة */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-6 h-6 fill-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <span>إرسال كشف أي حساب (رئيسي / فرعي) PDF بالواتساب</span>
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    توليد مستند PDF معتمد بشعار الشركة وتفاصيل الحركات وإرساله فوراً للواتساب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUniversalShareModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* تبويب الاختيار بين حساب فرعي أو رئيسي */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setUniversalShareMode('sub')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                    universalShareMode === 'sub' ? 'bg-white text-emerald-800 shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>حساب فرعي تفصيلي (سجل حركات القيود)</span>
                </button>
                <button
                  onClick={() => setUniversalShareMode('main')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                    universalShareMode === 'main' ? 'bg-white text-emerald-800 shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>حساب رئيسي / تصنيف مجمع كامل</span>
                </button>
              </div>

              {universalShareMode === 'sub' ? (
                <div className="space-y-4">
                  {/* شريط البحث في الحسابات الفرعية */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث باسم الحساب أو رمزه (مثال: الراجحي، الصندوق، العملاء، الإيجار...)"
                      value={universalSearch}
                      onChange={(e) => setUniversalSearch(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* قائمة الحسابات الفرعية للاختيار */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2">اختر الحساب الفرعي المطلوب إرسال كشفه:</label>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                      {accounts
                        .filter(a => {
                          if (!universalSearch) return true;
                          const q = universalSearch.toLowerCase();
                          return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || (typeMap[a.type] && typeMap[a.type].toLowerCase().includes(q));
                        })
                        .map(a => {
                          const isSelected = (selectedSubAccountId || accounts[0]?.id) === a.id;
                          const stats = accountsMovementStats[a.id] || { count: 0, totalDebit: 0, totalCredit: 0, netMovement: 0 };
                          return (
                            <div
                              key={a.id}
                              onClick={() => setSelectedSubAccountId(a.id)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                isSelected ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <div>
                                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                    <span className="font-mono text-emerald-700 font-black">[{a.code}]</span>
                                    <span>{a.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {typeMap[a.type]} • {subTypeMap[a.subType]} • {stats.count} حركة مقيدة
                                  </div>
                                </div>
                              </div>
                              <div className="text-left font-mono">
                                <div className="text-xs font-black text-slate-900">
                                  {a.currentBalance.toLocaleString()} {settings.currency}
                                </div>
                                <div className="text-[10px] text-slate-400">الرصيد الدفتري</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* بطاقة ملخص الحساب المختار */}
                  {(() => {
                    const activeAccount = accounts.find(a => a.id === (selectedSubAccountId || accounts[0]?.id)) || accounts[0];
                    if (!activeAccount) return null;
                    const { movements, debitSum, creditSum, initialBalance, finalBalance } = getAccountMovementsData(activeAccount);
                    return (
                      <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/60">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">الحساب المختار للتقرير</span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">[{activeAccount.code}] {activeAccount.name}</h4>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm font-mono">
                            {movements.length} حركة مسجلة
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-slate-400 block">الافتتاحي</span>
                            <span className="font-bold font-mono text-slate-800">{initialBalance.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-blue-500 block">مدين (+)</span>
                            <span className="font-bold font-mono text-blue-700">{debitSum.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-purple-500 block">دائن (-)</span>
                            <span className="font-bold font-mono text-purple-700">{creditSum.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-emerald-600 block">صافي الرصيد</span>
                            <span className="font-black font-mono text-emerald-800">{finalBalance.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-700">اختر الحساب الرئيسي / التصنيف المالي المطلوب إرساله:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map(t => {
                      const isSelected = selectedMainCategory === t;
                      const catAccs = accounts.filter(a => a.type === t);
                      const totalBal = catAccs.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
                      return (
                        <div
                          key={t}
                          onClick={() => setSelectedMainCategory(t)}
                          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-black text-sm text-slate-900">{typeMap[t]}</span>
                            <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                              {catAccs.length} حساب فرعي
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200/60">
                            <span className="text-[10px] font-sans text-slate-400">إجمالي الرصيد:</span>
                            <span className="font-black text-emerald-800">{totalBal.toLocaleString()} {settings.currency}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowUniversalShareModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                إغلاق
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowUniversalShareModal(false);
                    if (universalShareMode === 'sub') {
                      const acc = accounts.find(a => a.id === (selectedSubAccountId || accounts[0]?.id)) || accounts[0];
                      if (acc) handleShareSingleAccountWhatsApp(acc);
                    } else {
                      handleShareCategoryWhatsApp(selectedMainCategory);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>🚀 فتح واتساب وإرسال كشف الحساب (PDF) فوراً</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
