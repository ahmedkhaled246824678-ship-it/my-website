import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Send,
  Eye,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Building2,
  CreditCard,
  Receipt,
  Copy,
  Type,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCheck
} from 'lucide-react';
import { JournalEntry, JournalLine, Account, CostCenter, UserAccount } from '../../types';
import { saveJournalEntries, getCompanySettings } from '../../utils/storage';
import { postJournalEntryToAccounts, recalculateAllAccountBalances } from '../../utils/accounting';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { printReportAsPDF } from '../../utils/export';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange, formatFilterPeriodDescription } from '../../utils/dateFilter';
import { tafqeet } from '../../utils/tafqeet';

interface JournalEntriesProps {
  entries: JournalEntry[];
  accounts: Account[];
  costCenters: CostCenter[];
  currentUser?: UserAccount;
  onEntriesChange: (updated: JournalEntry[]) => void;
  onRefreshBalances: () => void;
  searchQuery: string;
  fiscalYear: string;
}

export const JournalEntries: React.FC<JournalEntriesProps> = ({
  entries = [],
  accounts = [],
  costCenters = [],
  currentUser,
  onEntriesChange,
  onRefreshBalances,
  searchQuery,
  fiscalYear
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<JournalEntry | null>(null);
  const [showImpactModal, setShowImpactModal] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  // تصفية التاريخ والأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  const canAdd = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canAdd !== false) : true;
  const canEdit = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canEdit !== false) : true;
  const canDelete = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canDelete !== false) : true;
  const canPost = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canPost !== false) : true;
  const canExport = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canExport !== false) : true;

  // إعادة ترحيل ومطابقة كافة أرصدة الحسابات المختارة
  const handleRecalculateAll = () => {
    if (!canPost) {
      customAlert('ليس لديك صلاحية لترحيل ومطابقة الحسابات في الأستاذ العام.', 'error');
      return;
    }
    customConfirm('هل أنت متأكد من رغبتك في إعادة ترحيل كافة القيود ومطابقة وتحديث أرصدة الحسابات المختارة في دليل الحسابات والبنوك والعملاء والموردين؟', () => {
      const res = recalculateAllAccountBalances();
      onRefreshBalances();
      customAlert(`تم ترحيل ومطابقة (${res.postedEntriesCount}) قيد محاسبي مع أرصدة (${res.updatedAccountsCount}) حساب في الدليل والبنوك والعملاء والموردين بنجاح. كافة الحسابات المختارة تعكس الآن التأثير الدقيق للقيود (مدين ودائن)!`, 'success');
    }, 'تأكيد إعادة الترحيل ومطابقة الأرصدة');
  };

  // ترحيل / إلغاء ترحيل قيد محدد وتحديث تأثيره على الحسابات المختارة
  const handleTogglePost = (entry: JournalEntry) => {
    if (!canPost) {
      customAlert('ليس لديك صلاحية لترحيل أو إلغاء ترحيل القيود.', 'error');
      return;
    }
    const newStatus = entry.isPosted === false ? true : false;
    const updated = entries.map(e => e.id === entry.id ? { ...e, isPosted: newStatus } : e);
    saveJournalEntries(updated);
    onEntriesChange(updated);
    recalculateAllAccountBalances();
    onRefreshBalances();
    customAlert(
      newStatus
        ? `تم ترحيل القيد رقم (${entry.entryNumber}) وتحديث أرصدة الحسابات المختارة (مدين ودائن) في الأستاذ العام بنجاح!`
        : `تم إلغاء ترحيل القيد رقم (${entry.entryNumber}) وخصم تأثيره من أرصدة الحسابات المختارة!`,
      'success'
    );
  };

  // Form State
  const [entryNumber, setEntryNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountId: '', accountName: '', debit: 0, credit: 0, description: '', checkNumber: '' },
    { id: '2', accountId: '', accountName: '', debit: 0, credit: 0, description: '', checkNumber: '' }
  ]);

  const settings = getCompanySettings();

  // تحديث البيان العام مع مزامنة وظهور الشرح فورياً في أطراف وسطور القيد
  const handleDescriptionChange = (newDesc: string) => {
    const oldDesc = description;
    setDescription(newDesc);
    // تعميم وتحديث الشرح فورياً على أسطر القيد التي تطابق الشرح القديم أو كانت فارغة
    setLines(prevLines =>
      prevLines.map(line => {
        if (!line.description || line.description === oldDesc) {
          return { ...line, description: newDesc };
        }
        return line;
      })
    );
  };

  // نسخ وتعميم البيان العام لكافة أطراف القيد
  const handleCopyDescriptionToAllLines = () => {
    if (!description.trim()) {
      customAlert('يرجى كتابة البيان العام أولاً لتعميمه على أطراف القيد.', 'warning');
      return;
    }
    setLines(lines.map(l => ({ ...l, description })));
    customAlert('تم تعميم وتطبيق البيان العام على كافة أسطر القيد بنجاح!', 'success');
  };

  // دالة فحص ما إذا كان الحساب بنكياً
  const isBankAccount = (accId?: string, accName?: string): boolean => {
    if (!accId && !accName) return false;
    const acc = accounts.find(a => a.id === accId || a.code === accId || (accName && a.name === accName));
    if (acc) {
      return acc.subType === 'bank' || acc.name.includes('بنك') || acc.name.includes('مصرف') || acc.code.startsWith('102') || acc.code.startsWith('103');
    }
    const name = accName || '';
    return name.includes('بنك') || name.includes('مصرف') || name.includes('Bank') || name.includes('الراجحي') || name.includes('الأهلي') || name.includes('الرياض');
  };

  // هل يحتوي القيد على حساب بنكي
  const hasBankLine = useMemo(() => {
    return lines.some(l => isBankAccount(l.accountId, l.accountName));
  }, [lines, accounts]);

  // تصفيات البحث مع دعم فلترة التاريخ بالايام والشهور والسنة ورقم الشيك
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        e.entryNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.checkNumber && e.checkNumber.toLowerCase().includes(q)) ||
        e.lines.some(l => 
          l.accountName.toLowerCase().includes(q) || 
          l.description.toLowerCase().includes(q) ||
          (l.checkNumber && l.checkNumber.toLowerCase().includes(q))
        );

      const matchesYear = fiscalYear === 'all' || e.fiscalYear === fiscalYear || e.date.startsWith(fiscalYear);
      const matchesDateRange = isDateInRange(e.date, startDate, endDate);

      return matchesSearch && matchesYear && matchesDateRange;
    });
  }, [entries, searchQuery, fiscalYear, startDate, endDate]);

  // إحصائيات الفترة المحددة
  const stats = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let postedCount = 0;
    let draftCount = 0;

    filteredEntries.forEach(e => {
      totalDebit += (Number(e.totalDebit) || 0);
      totalCredit += (Number(e.totalCredit) || 0);
      if (e.isPosted !== false) {
        postedCount++;
      } else {
        draftCount++;
      }
    });

    return {
      totalDebit,
      totalCredit,
      postedCount,
      draftCount,
      count: filteredEntries.length
    };
  }, [filteredEntries]);

  // حساب الإجمالي الحالي في النموذج
  const totalDebitForm = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCreditForm = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const differenceForm = totalDebitForm - totalCreditForm;
  const isBalanced = Math.abs(differenceForm) < 0.01 && totalDebitForm > 0;

  // فتح نموذج الإضافة
  const handleOpenAdd = () => {
    setEditingEntry(null);
    const nextNum = `Q-${fiscalYear !== 'all' ? fiscalYear : '2026'}-${String(entries.length + 1).padStart(4, '0')}`;
    setEntryNumber(nextNum);
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setLines([
      { id: '1', accountId: '', accountName: '', debit: 0, credit: 0, description: '', checkNumber: '' },
      { id: '2', accountId: '', accountName: '', debit: 0, credit: 0, description: '', checkNumber: '' }
    ]);
    setShowModal(true);
  };

  // فتح نموذج التعديل
  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEntryNumber(entry.entryNumber);
    setDate(entry.date);
    setDescription(entry.description);
    setLines(entry.lines.map(l => ({ ...l, checkNumber: l.checkNumber || '' })));
    setShowModal(true);
  };

  // إضافة سطر جديد للقيد
  const handleAddLine = (type?: 'debit' | 'credit') => {
    setLines([
      ...lines,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        accountId: '',
        accountName: '',
        debit: 0,
        credit: 0,
        description: '',
        checkNumber: ''
      }
    ]);
  };

  // إضافة طرف مدين مخصص
  const handleAddDebitLine = () => {
    const remainingDebit = Math.max(0, totalCreditForm - totalDebitForm);
    setLines([
      ...lines,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        accountId: '',
        accountName: '',
        debit: remainingDebit > 0 ? remainingDebit : 0,
        credit: 0,
        description: '',
        checkNumber: ''
      }
    ]);
  };

  // إضافة طرف دائن مخصص
  const handleAddCreditLine = () => {
    const remainingCredit = Math.max(0, totalDebitForm - totalCreditForm);
    setLines([
      ...lines,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        accountId: '',
        accountName: '',
        debit: 0,
        credit: remainingCredit > 0 ? remainingCredit : 0,
        description: '',
        checkNumber: ''
      }
    ]);
  };

  // حذف سطر من القيد
  const handleRemoveLine = (id: string) => {
    if (lines.length <= 2) {
      alert('يجب أن يحتوي القيد على سطرين على الأقل (مدين ودائن)');
      return;
    }
    setLines(lines.filter(l => l.id !== id));
  };

  // تحديث بيانات سطر
  const handleLineChange = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    if (field === 'accountId') {
      const acc = accounts.find(a => a.id === value || a.code === value);
      newLines[index].accountId = value;
      newLines[index].accountName = acc ? `${acc.code} - ${acc.name}` : value;
    } else if (field === 'debit') {
      const numVal = parseFloat(value) || 0;
      newLines[index].debit = numVal;
      if (numVal > 0) {
        newLines[index].credit = 0; // تفريغ الدائن تلقائياً عند إدخال المدين لمنع الخلط
      }
    } else if (field === 'credit') {
      const numVal = parseFloat(value) || 0;
      newLines[index].credit = numVal;
      if (numVal > 0) {
        newLines[index].debit = 0; // تفريغ المدين تلقائياً عند إدخال الدائن لمنع الخلط
      }
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setLines(newLines);
  };

  // حفظ القيد والترحيل المباشر
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryNumber.trim() || !description.trim()) {
      alert('يرجى إدخال رقم القيد والبيان العام للقيد');
      return;
    }
    if (!isBalanced) {
      alert('القيد المحاسبي غير متزن! إجمالي المدين يجب أن يساوي إجمالي الدائن بدقة.');
      return;
    }
    if (lines.some(l => !l.accountId)) {
      alert('يرجى اختيار الحساب المحاسبي لكل الأسطر');
      return;
    }

    const year = date.split('-')[0] || '2026';
    const firstCheckNumber = lines.find(l => l.checkNumber?.trim())?.checkNumber || '';
    let updated: JournalEntry[];

    if (editingEntry) {
      updated = entries.map(ent => {
        if (ent.id === editingEntry.id) {
          const modEntry: JournalEntry = {
            ...ent,
            entryNumber,
            date,
            fiscalYear: year,
            description,
            checkNumber: firstCheckNumber,
            lines: lines.map(l => ({
              ...l,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
              checkNumber: l.checkNumber || ''
            })),
            totalDebit: totalDebitForm,
            totalCredit: totalCreditForm,
            isPosted: true // ترحيل مباشر
          };
          postJournalEntryToAccounts(modEntry);
          return modEntry;
        }
        return ent;
      });
    } else {
      const newEntry: JournalEntry = {
        id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        entryNumber,
        date,
        fiscalYear: year,
        description,
        checkNumber: firstCheckNumber,
        lines: lines.map(l => ({
          ...l,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          checkNumber: l.checkNumber || ''
        })),
        totalDebit: totalDebitForm,
        totalCredit: totalCreditForm,
        isPosted: true, // ترحيل مباشر للحسابات بعد الإعداد بالمبلغ المسجل
        createdBy: 'المحاسب المالي'
      };
      updated = [newEntry, ...entries];
      postJournalEntryToAccounts(newEntry);
    }

    saveJournalEntries(updated);
    onEntriesChange(updated);
    onRefreshBalances();
    setShowModal(false);
    customAlert(editingEntry ? 'تم تعديل القيد وترحيله بنجاح!' : 'تم حفظ القيد المحاسبي وترحيله فورياً إلى الحسابات والأرصدة!', 'success');
  };

  // حذف القيد
  const handleDelete = (id: string, num: string) => {
    customConfirm(`تنبيه: هل أنت متأكد من حذف القيد المحاسبي رقم "${num}"؟`, () => {
      const updated = entries.filter(e => e.id !== id);
      saveJournalEntries(updated);
      onEntriesChange(updated);
      recalculateAllAccountBalances();
      onRefreshBalances();
      customAlert('تم حذف القيد وخصم تأثيره من أرصدة الحسابات بنجاح!', 'success');
    }, 'تأكيد حذف القيد المحاسبي');
  };

  // طباعة قيد فردي
  const handlePrintSingleEntry = (entry: JournalEntry) => {
    let rowsHtml = '';
    entry.lines.forEach((l, i) => {
      rowsHtml += `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td><strong>${l.accountName}</strong>${l.checkNumber ? `<br><span style="color: #1d4ed8; font-size: 11px; font-family: monospace;">(شيك رقم: ${l.checkNumber})</span>` : ''}</td>
          <td>${l.description || entry.description}</td>
          <td class="text-center font-bold text-green">${l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
          <td class="text-center font-bold text-red">${l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <table style="margin: 0; border: none;">
          <tr style="background: transparent !important;">
            <td style="border: none;"><strong>رقم القيد:</strong> ${entry.entryNumber}</td>
            <td style="border: none;"><strong>تاريخ القيد:</strong> ${entry.date}</td>
            <td style="border: none;"><strong>حالة القيد:</strong> مرحّل ومعتمد</td>
          </tr>
          <tr style="background: transparent !important;">
            <td colspan="3" style="border: none; padding-top: 10px;"><strong>البيان العام:</strong> ${entry.description}</td>
          </tr>
        </table>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50px;">م</th>
            <th>اسم الحساب المحاسبي</th>
            <th>بيان تفصيلي للسطر</th>
            <th style="width: 120px;">مدين (ر.س)</th>
            <th style="width: 120px;">دائن (ر.س)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">
            <td colspan="3" class="text-center"><strong>الإجمالي الكلي للقيد المحاسبي</strong></td>
            <td class="text-center"><strong>${entry.totalDebit.toLocaleString()} ${settings.currency}</strong></td>
            <td class="text-center"><strong>${entry.totalCredit.toLocaleString()} ${settings.currency}</strong></td>
          </tr>
          <tr>
            <td colspan="5" style="background: #ecfdf5; padding: 10px; font-weight: bold; color: #065f46; border: 1px solid #a7f3d0; text-align: right;">
              <strong>المبلغ الإجمالي كتابةً بالكلمات (تفقيط معتمد):</strong> ${tafqeet(entry.totalDebit, settings.currency)}
            </td>
          </tr>
        </tbody>
      </table>
    `;

    printReportAsPDF(`سند قيد يومية محاسبي - ${entry.entryNumber}`, htmlContent, `تاريخ القيد: ${entry.date} | السنة المالية: ${entry.fiscalYear}`);
  };

  // تحضير بيانات التصدير
  const exportData = filteredEntries.map(e => {
    const debitParties = e.lines
      .filter(l => (l.debit || 0) > 0)
      .map(l => `من حـ/ ${l.accountName} (+${(l.debit || 0).toLocaleString()} ${settings.currency})`)
      .join(' | ');

    const creditParties = e.lines
      .filter(l => (l.credit || 0) > 0)
      .map(l => `إلى حـ/ ${l.accountName} (-${(l.credit || 0).toLocaleString()} ${settings.currency})`)
      .join(' | ');

    return {
      'رقم القيد': e.entryNumber,
      'التاريخ': e.date,
      'السنة المالية': e.fiscalYear,
      'البيان': e.description,
      'الطرف المدين (من حـ/)': debitParties || '-',
      'الطرف الدائن (إلى حـ/)': creditParties || '-',
      'إجمالي المدين': e.totalDebit,
      'إجمالي الدائن': e.totalCredit,
      'الحالة': e.isPosted !== false ? 'مرحّل للحسابات' : 'مسودة',
      'بواسطة': e.createdBy || 'النظام'
    };
  });

  const toggleExpand = (id: string) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = filteredEntries.every(e => expandedEntries[e.id]);
    const newState: Record<string, boolean> = {};
    filteredEntries.forEach(e => {
      newState[e.id] = !allExpanded;
    });
    setExpandedEntries(newState);
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع الأزرار */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            <span>القيود اليومية المحاسبية والترحيل الفوري</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            إدخال رقم القيد والسطور يدوياً، مع الترحيل التلقائي المباشر إلى أرصدة الحسابات والأستاذ العام
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPost && (
            <button
              onClick={handleRecalculateAll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
              title="إعادة ترحيل القيود وتحديث أرصدة الحسابات المختارة في الدليل"
            >
              <Layers className="w-5 h-5" />
              <span>ترحيل ومطابقة الحسابات</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>إعداد قيد يومية جديد</span>
            </button>
          )}

          {canExport && (
            <ExportButtons
              title="سجل القيود اليومية المحاسبية"
              subtitle={`${formatFilterPeriodDescription(startDate, endDate, `السنة المالية: ${fiscalYear}`)} | عدد القيود: ${filteredEntries.length}`}
              data={exportData}
              filename="journal_entries"
            />
          )}
        </div>
      </div>

      {/* شريط البحث المتقدم بالايام والشهور والسنة ومن تاريخ إلى تاريخ */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية قيود اليومية المحاسبية بالأيام والشهور والسنة"
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

      {/* بطاقات إحصائيات الفترة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>إجمالي القيود في الفترة</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{stats.count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.postedCount} مرحّل | {stats.draftCount} مسودة</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>إجمالي حركات المدين</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{stats.totalDebit.toLocaleString()} <span className="text-xs font-normal">{settings.currency}</span></div>
          <div className="text-[11px] text-emerald-600 mt-0.5">مجموع الجانب المدين للقيود</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-red-600" />
            <span>إجمالي حركات الدائن</span>
          </div>
          <div className="text-2xl font-black text-red-700 font-mono mt-1">{stats.totalCredit.toLocaleString()} <span className="text-xs font-normal">{settings.currency}</span></div>
          <div className="text-[11px] text-red-600 mt-0.5">مجموع الجانب الدائن للقيود</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>حالة توازن القيود</span>
          </div>
          <div className="text-xl font-black font-mono mt-1">
            {stats.totalDebit === stats.totalCredit ? (
              <span className="text-emerald-700 font-bold text-base">متوازنة بالكامل ✅</span>
            ) : (
              <span className="text-red-600 font-bold text-base">فارق: {Math.abs(stats.totalDebit - stats.totalCredit).toLocaleString()} {settings.currency}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">مجموع المدين = مجموع الدائن</div>
        </div>
      </div>

      {/* جدول القيود اليومية */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="py-4 px-4 font-bold">رقم القيد</th>
                <th className="py-4 px-4 font-bold">التاريخ</th>
                <th className="py-4 px-4 font-bold">البيان العام</th>
                <th className="py-4 px-4 font-bold">إجمالي المدين</th>
                <th className="py-4 px-4 font-bold">إجمالي الدائن</th>
                <th className="py-4 px-4 font-bold">الحالة والترحيل</th>
                <th className="py-4 px-4 font-bold text-center">إجراءات (عرض / تعديل / حذف)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <span>لا توجد قيود يومية مسجلة في هذه الفترة</span>
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-blue-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{entry.entryNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{entry.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{entry.description}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">عدد السطور: {entry.lines.length} أطراف</span>
                        {entry.lines.some(l => l.checkNumber) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <span>شيك: {entry.lines.find(l => l.checkNumber)?.checkNumber}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-700">
                      {entry.totalDebit.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-red-700">
                      {entry.totalCredit.toLocaleString()} {settings.currency}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePost(entry)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition cursor-pointer shadow-2xs ${
                          entry.isPosted !== false
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                            : 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={entry.isPosted !== false ? "انقر لإلغاء ترحيل القيد وخصم تأثيره" : "انقر لترحيل القيد للحسابات المختارة الآن"}
                      >
                        {entry.isPosted !== false ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>مرحّل للحسابات</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>مسودة (غير مرحّل)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setShowImpactModal(entry)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition flex items-center gap-1 px-2.5 border border-indigo-200 cursor-pointer shadow-2xs"
                          title="عرض تأثير القيد على رصيد الحسابات المختارة"
                        >
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>تأثير الحسابات</span>
                        </button>

                        <button
                          onClick={() => setShowDetailModal(entry)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="عرض أطراف القيد وتفاصيله"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePrintSingleEntry(entry)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                          title="طباعة سند القيد كملف PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                            title="تعديل القيد وأرصدته"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(entry.id, entry.entryNumber)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                            title="حذف القيد نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة عرض تفاصيل القيد */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">سند قيد محاسبي رقم: {showDetailModal.entryNumber}</h3>
                <p className="text-xs text-slate-500 mt-1">تاريخ القيد: {showDetailModal.date} | بواسطة: {showDetailModal.createdBy || 'النظام'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintSingleEntry(showDetailModal)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>طباعة PDF</span>
                </button>
                <button onClick={() => setShowDetailModal(null)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">×</button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <span className="text-xs font-bold text-slate-500 block mb-1">البيان العام للقيد:</span>
              <p className="text-sm font-bold text-slate-900">{showDetailModal.description}</p>
            </div>

            <h4 className="font-bold text-sm text-slate-800 mb-3">أطراف القيد المحاسبي (المدين والدائن):</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">م</th>
                    <th className="py-2.5 px-3 font-bold">الحساب المحاسبي</th>
                    <th className="py-2.5 px-3 font-bold">البيان الفرعي</th>
                    <th className="py-2.5 px-3 font-bold text-center">مدين ({settings.currency})</th>
                    <th className="py-2.5 px-3 font-bold text-center">دائن ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {showDetailModal.lines.map((l, i) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-500 text-center">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{l.accountName}</span>
                          {l.checkNumber && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-extrabold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-300">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>رقم الشيك / الحوالة: {l.checkNumber}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{l.description || showDetailModal.description}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-center">{l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700 text-center">{l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-extrabold text-slate-900">
                    <td colSpan={3} className="py-3 px-3 text-center">الإجمالي العام</td>
                    <td className="py-3 px-3 font-mono text-emerald-700 text-center">{showDetailModal.totalDebit.toLocaleString()} {settings.currency}</td>
                    <td className="py-3 px-3 font-mono text-red-700 text-center">{showDetailModal.totalCredit.toLocaleString()} {settings.currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* تفقيط المبلغ بالكلمات في تفاصيل القيد */}
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-900">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black">المبلغ الإجمالي كتابةً بالكلمات (تفقيط معتمد):</span>
              </div>
              <div className="text-xs font-black bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs">
                {tafqeet(showDetailModal.totalDebit, settings.currency)}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تحليل تأثير القيد على الحسابات المختارة (ترحيل القيود الي الحسابات المختارة وتاثيرها) */}
      {showImpactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>تحليل الترحيل المحاسبي والتأثير على دفتر الأستاذ</span>
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">تأثير القيد رقم: {showImpactModal.entryNumber} على الحسابات المختارة</h3>
                <p className="text-xs text-slate-500 mt-1">تاريخ القيد: {showImpactModal.date} | الحالة: {showImpactModal.isPosted !== false ? 'مرحّل ومعتمد في الأرصدة' : 'مسودة غير مرحّلة'}</p>
              </div>
              <button onClick={() => setShowImpactModal(null)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer">×</button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed font-medium">
                <span className="font-bold text-sm block mb-1">آلية الترحيل والتأثير المباشر على الحسابات المختارة:</span>
                يوضح هذا التقرير التحليلي كيفية ترحيل كل طرف من أطراف القيد (المدين والدائن) إلى الرصيد الدفتري المحدث في دليل الحسابات العام والأرصدة البنكية وخزائن النقدية وحسابات العملاء والموردين وفقاً لطبيعة كل حساب (أصول ومصروفات تزيد بالمدين، خصوم وحقوق ملكية وإيرادات تزيد بالدائن).
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900 text-white text-xs">
                  <tr>
                    <th className="py-3 px-3 font-bold text-center">م</th>
                    <th className="py-3 px-3 font-bold">الحساب المختار (الاسم والرمز)</th>
                    <th className="py-3 px-3 font-bold">التصنيف المحاسبي</th>
                    <th className="py-3 px-3 font-bold text-center">الحركة بالمدين ({settings.currency})</th>
                    <th className="py-3 px-3 font-bold text-center">الحركة بالدائن ({settings.currency})</th>
                    <th className="py-3 px-3 font-bold text-center">الرصيد الدفتري الحالي بعد الترحيل</th>
                    <th className="py-3 px-3 font-bold">تأثير الترحيل على رصيد الحساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {showImpactModal.lines.map((l, i) => {
                    const matchedAccount = accounts.find(a => a.id === l.accountId || a.code === l.accountId || a.name === l.accountName);
                    const isAssetOrExpense = matchedAccount ? (matchedAccount.type === 'asset' || matchedAccount.type === 'expense') : true;
                    const debitVal = Number(l.debit) || 0;
                    const creditVal = Number(l.credit) || 0;

                    // تحديد نوع التأثير
                    let impactText = 'تأثير مباشر على الرصيد';
                    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
                    if (isAssetOrExpense) {
                      if (debitVal > 0) {
                        impactText = '📈 زيادة رصيد الحساب (مدين)';
                        badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                      } else if (creditVal > 0) {
                        impactText = '📉 انخفاض رصيد الحساب (دائن)';
                        badgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                      }
                    } else {
                      if (creditVal > 0) {
                        impactText = '📈 زيادة رصيد الحساب (دائن)';
                        badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                      } else if (debitVal > 0) {
                        impactText = '📉 انخفاض رصيد الحساب (مدين)';
                        badgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                      }
                    }

                    return (
                      <tr key={l.id} className="hover:bg-indigo-50/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-400 text-center">{i + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{l.accountName}</div>
                          {matchedAccount && <div className="text-xs font-mono text-indigo-600 mt-0.5">رمز الحساب: {matchedAccount.code || matchedAccount.id}</div>}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">
                          {matchedAccount ? (
                            matchedAccount.type === 'asset' ? 'أصل (طبيعته مدين)' :
                            matchedAccount.type === 'liability' ? 'خصم (طبيعته دائن)' :
                            matchedAccount.type === 'equity' ? 'حقوق ملكية (طبيعتها دائن)' :
                            matchedAccount.type === 'revenue' ? 'إيراد (طبيعته دائن)' : 'مصروف (طبيعته مدين)'
                          ) : 'حساب فرعي / بنك / عميل / مورد'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700 text-center">{debitVal > 0 ? debitVal.toLocaleString() : '-'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-red-700 text-center">{creditVal > 0 ? creditVal.toLocaleString() : '-'}</td>
                        <td className="py-3 px-3 font-mono font-extrabold text-blue-900 text-center bg-slate-50/70">
                          {matchedAccount ? `${Number(matchedAccount.currentBalance).toLocaleString()} ${settings.currency}` : 'رصيد فرعي مباشر'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${badgeClass}`}>
                            <span>{impactText}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">إجمالي حركة القيد:</span> مدين ({showImpactModal.totalDebit.toLocaleString()} {settings.currency}) = دائن ({showImpactModal.totalCredit.toLocaleString()} {settings.currency}) — <span className="text-emerald-700 font-bold">قيد متزن ومطابق 100%</span>
              </div>
              <button
                onClick={() => setShowImpactModal(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition cursor-pointer"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة أو تعديل قيد محاسبي */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{editingEntry ? 'تعديل القيد المحاسبي والترحيل' : 'إعداد قيد محاسبي جديد وترحيله مباشرة للحسابات'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم القيد (يدوي أو تلقائي) *</label>
                  <input
                    type="text"
                    value={entryNumber}
                    onChange={(e) => setEntryNumber(e.target.value)}
                    required
                    placeholder="مثال: Q-2026-0005"
                    className="w-full font-mono bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">يمكنك تعديل رقم القيد يدوياً</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">تاريخ القيد (إدخال يدوي حر) *</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded transition cursor-pointer"
                        title="تحديد تاريخ اليوم"
                      >
                        اليوم
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 1);
                          setDate(d.toISOString().slice(0, 10));
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded transition cursor-pointer"
                        title="تحديد تاريخ أمس"
                      >
                        أمس
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      placeholder="YYYY-MM-DD (مثال: 2026-08-29)"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold font-mono focus:outline-none focus:border-blue-500 pl-10"
                    />
                    <label className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer p-1" title="اختيار من التقويم">
                      <Calendar className="w-4 h-4" />
                      <input
                        type="date"
                        value={date.length === 10 ? date : ''}
                        onChange={(e) => {
                          if (e.target.value) setDate(e.target.value);
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">اكتب التاريخ مباشرة بالأرقام أو اختر من أيقونة التقويم</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الترحيل التلقائي</label>
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-2.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ترحيل فوري لأرصدة الحسابات</span>
                  </div>
                </div>
              </div>

              {/* حقل البيان والشرح المحاسبي */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">البيان أو الشرح العام للقيد *</label>
                  <button
                    type="button"
                    onClick={handleCopyDescriptionToAllLines}
                    className="text-[11px] font-bold text-slate-600 hover:text-blue-700 flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-blue-50 rounded border border-slate-200 transition cursor-pointer"
                    title="تطبيق هذا البيان على جميع أسطر القيد أدناه"
                  >
                    <Copy className="w-3 h-3 text-blue-600" />
                    <span>تعميم البيان على كافة أطراف القيد 📋</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  required
                  placeholder="اكتب بيان وشرح القيد هنا... (مثال: سداد دفعة للمورد شركة الحديد والصلب بموجب الفاتورة رقم 1022...)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-blue-500"
                />

                {/* ظهور الشرح فورياً عند كتابة البيان */}
                {description.trim() && (
                  <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex items-start gap-2.5 shadow-2xs animate-fadeIn">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-blue-950">شرح وتفصيل القيد المحاسبي المعتمد (يظهر فورياً في التقرير والأسطر):</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          شرح نشط ومعمم ✍️
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 bg-white p-2 rounded-lg border border-blue-200 shadow-2xs font-mono leading-relaxed">
                        {description}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* إشعار الحساب البنكي ورقم الشيك */}
              {hasBankLine && (
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 rounded-xl border border-blue-400/50 shadow-md flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="p-1.5 bg-blue-500/30 rounded-lg text-blue-300">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-blue-200">تم اختيار حساب بنكي في أطراف القيد:</span>
                      <span className="text-slate-200 mr-1">يرجى تسجيل رقم الشيك أو إيصال الحوالة البنكية في الحقل المخصص أدناه لتوثيق التسوية البنكية.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 shrink-0">
                    تسوية شيكات 💳
                  </span>
                </div>
              )}

              {/* جدول أطراف القيد مع تمييز الحساب المدين والدائن بوضوح */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-bold text-slate-800">أطراف القيد المحاسبي (المدين والدائن) *</label>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✨ تمييز فوري للأطراف المدينة والدائنة والتفقيط
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAddDebitLine}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ طرف مدين (من حـ/)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCreditLine}
                      className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ طرف دائن (إلى حـ/)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLine()}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <span>سطر فارغ</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="py-2.5 px-3 w-32 text-center">نوع الطرف</th>
                        <th className="py-2.5 px-3 min-w-[220px]">الحساب المحاسبي ورقم الشيك *</th>
                        <th className="py-2.5 px-3 min-w-[130px]">مركز التكلفة / المشروع</th>
                        <th className="py-2.5 px-3 min-w-[150px]">البيان الخاص بالطرف</th>
                        <th className="py-2.5 px-3 min-w-[130px] text-center">مدين ({settings.currency})</th>
                        <th className="py-2.5 px-3 min-w-[130px] text-center">دائن ({settings.currency})</th>
                        <th className="py-2.5 px-3 w-12 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {lines.map((line, idx) => {
                        const isBank = isBankAccount(line.accountId, line.accountName);
                        const isDebit = Number(line.debit) > 0;
                        const isCredit = Number(line.credit) > 0;

                        return (
                          <tr key={line.id} className={`${
                            isDebit ? 'bg-emerald-50/20' : isCredit ? 'bg-rose-50/20' : ''
                          } ${isBank ? 'ring-1 ring-inset ring-blue-300' : ''}`}>
                            {/* شارة توضيح نوع الطرف (من حـ / إلى حـ) */}
                            <td className="p-2.5 text-center align-top">
                              {isDebit ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                  من حـ/ (مدين)
                                </span>
                              ) : isCredit ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs whitespace-nowrap">
                                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                                  إلى حـ/ (دائن)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                                  حدد المبلغ
                                </span>
                              )}
                            </td>

                            <td className="p-2.5">
                              <select
                                value={line.accountId}
                                onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                                required
                                className={`w-full border rounded p-1.5 font-bold text-slate-800 text-xs ${
                                  isDebit ? 'border-emerald-400 bg-emerald-50/30' : isCredit ? 'border-rose-400 bg-rose-50/30' : isBank ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-300'
                                }`}
                              >
                                <option value="">-- اختر الحساب المحاسبي --</option>
                                {accounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name} {acc.subType === 'bank' ? '🏦 (بنك)' : ''}
                                  </option>
                                ))}
                              </select>

                              {/* عند اختيار أي حساب بنك يتم إظهار حقل رقم الشيك */}
                              {isBank && (
                                <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-2 flex items-center gap-2 shadow-xs animate-fadeIn">
                                  <div className="flex items-center gap-1 text-[11px] font-black text-blue-900 shrink-0">
                                    <CreditCard className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                    <span>رقم الشيك / الحوالة:</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={line.checkNumber || ''}
                                    onChange={(e) => handleLineChange(idx, 'checkNumber', e.target.value)}
                                    placeholder="مثال: CHQ-99824 أو رقم التحويل"
                                    className="w-full bg-white border border-blue-400 rounded px-2 py-1 text-xs font-mono font-bold text-blue-950 placeholder:text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 align-top">
                              <select
                                value={line.costCenterId || ''}
                                onChange={(e) => handleLineChange(idx, 'costCenterId', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-700"
                              >
                                <option value="">-- بدون مركز تكلفة --</option>
                                {costCenters.map(cc => (
                                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2.5 align-top">
                              <input
                                type="text"
                                value={line.description}
                                onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                placeholder="بيان خاص بالطرف..."
                                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
                              />
                            </td>
                            <td className="p-2.5 align-top">
                              <input
                                type="number"
                                step="0.01"
                                value={line.debit || ''}
                                onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                                placeholder="0.00"
                                className="w-full font-mono bg-emerald-50/60 border border-emerald-300 text-emerald-900 rounded p-1.5 text-center font-black focus:ring-2 focus:ring-emerald-500"
                              />
                              {/* ظهور الكلمات تفقيط للمدين */}
                              {Number(line.debit) > 0 && (
                                <div className="text-[10px] text-emerald-900 font-bold bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded mt-1 text-center shadow-2xs font-sans">
                                  ✍️ {tafqeet(Number(line.debit), settings.currency)}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 align-top">
                              <input
                                type="number"
                                step="0.01"
                                value={line.credit || ''}
                                onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                                placeholder="0.00"
                                className="w-full font-mono bg-rose-50/60 border border-rose-300 text-rose-900 rounded p-1.5 text-center font-black focus:ring-2 focus:ring-rose-500"
                              />
                              {/* ظهور الكلمات تفقيط للدائن */}
                              {Number(line.credit) > 0 && (
                                <div className="text-[10px] text-rose-900 font-bold bg-rose-100/90 border border-rose-300 px-1.5 py-0.5 rounded mt-1 text-center shadow-2xs font-sans">
                                  ✍️ {tafqeet(Number(line.credit), settings.currency)}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 align-top text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(line.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* كارت ملخص الأطراف المدينة والدائنة المنفصلة بوضوح للمحاسب */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {/* أطراف المدين */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span>أطراف القيد المدينة (من حـ/):</span>
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-900">
                        {totalDebitForm.toLocaleString()} {settings.currency}
                      </span>
                    </div>
                    {lines.filter(l => Number(l.debit) > 0).length === 0 ? (
                      <div className="text-center py-2 text-xs text-emerald-600/70 italic">لم يتم إدخال مبالغ مدينة بعد</div>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {lines.filter(l => Number(l.debit) > 0).map((l, i) => (
                          <li key={i} className="flex items-center justify-between bg-white/80 px-2 py-1 rounded border border-emerald-100">
                            <span className="font-bold text-slate-800 truncate max-w-[220px]">
                              {l.accountName || 'حساب غير محدد'} {l.description ? `(${l.description})` : ''}
                            </span>
                            <span className="font-mono font-black text-emerald-800 shrink-0">
                              +{Number(l.debit).toLocaleString()} {settings.currency}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* أطراف الدائن */}
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3">
                    <div className="flex items-center justify-between border-b border-rose-200 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        <span>أطراف القيد الدائنة (إلى حـ/):</span>
                      </div>
                      <span className="text-xs font-mono font-black text-rose-900">
                        {totalCreditForm.toLocaleString()} {settings.currency}
                      </span>
                    </div>
                    {lines.filter(l => Number(l.credit) > 0).length === 0 ? (
                      <div className="text-center py-2 text-xs text-rose-600/70 italic">لم يتم إدخال مبالغ دائنة بعد</div>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {lines.filter(l => Number(l.credit) > 0).map((l, i) => (
                          <li key={i} className="flex items-center justify-between bg-white/80 px-2 py-1 rounded border border-rose-100">
                            <span className="font-bold text-slate-800 truncate max-w-[220px]">
                              {l.accountName || 'حساب غير محدد'} {l.description ? `(${l.description})` : ''}
                            </span>
                            <span className="font-mono font-black text-rose-800 shrink-0">
                              +{Number(l.credit).toLocaleString()} {settings.currency}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* شريط الاتزان والمجاميع مع ظهور التفقيط بالكلمات */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                isBalanced ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <div className="flex flex-wrap items-center justify-between text-sm font-bold gap-2">
                  <div className="flex items-center gap-2">
                    {isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span>{isBalanced ? 'القيد متزن وجاهز للترحيل الفوري!' : `القيد غير متزن (الفرق: ${Math.abs(differenceForm).toLocaleString()} ${settings.currency})`}</span>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-sm">
                    <span>إجمالي المدين: <span className="text-emerald-700 font-black">{totalDebitForm.toLocaleString()} {settings.currency}</span></span>
                    <span>إجمالي الدائن: <span className="text-red-700 font-black">{totalCreditForm.toLocaleString()} {settings.currency}</span></span>
                  </div>
                </div>

                {/* ظهور الكلمات والتفقيط المالي الإجمالي للقيد */}
                <div className="pt-2.5 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Type className="w-4 h-4 text-emerald-600" />
                    <span>المبلغ الإجمالي كتابةً بالكلمات (التفقيط المالي المعتمد):</span>
                  </div>
                  <div className="text-xs font-black text-emerald-950 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded-md shadow-2xs font-sans">
                    ✍️ {tafqeet(totalDebitForm, settings.currency)}
                  </div>
                </div>
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
                  disabled={!isBalanced}
                  className={`px-6 py-2.5 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 ${
                    isBalanced ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{editingEntry ? 'حفظ التعديلات وترحيلها' : 'حفظ القيد وترحيله للحسابات الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
