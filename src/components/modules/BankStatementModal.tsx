import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Scale,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronDown,
  Layers,
  Receipt,
  FileText
} from 'lucide-react';
import { BankAccount, BankTransaction, JournalEntry, CompanySettings, Language } from '../../types';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { getCompanySettings } from '../../utils/storage';
import { tafqeet } from '../../utils/tafqeet';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange } from '../../utils/dateFilter';
import { t, getSystemLanguage } from '../../utils/i18n';

export interface UnifiedBankMovement {
  id: string;
  date: string;
  referenceNumber: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'journal_entry';
  typeLabel: string;
  description: string;
  relatedParty?: string;
  checkNumber?: string;
  costCenterName?: string;
  debit: number;   // وارد / إيداع (يزيد رصيد البنك)
  credit: number;  // صادر / مسحوبات ورسوم (ينقص رصيد البنك)
  runningBalance: number;
  isReconciled: boolean;
  source: 'direct_tx' | 'journal_entry';
}

interface BankStatementModalProps {
  bank: BankAccount;
  banks: BankAccount[];
  bankTxs?: BankTransaction[];
  journalEntries?: JournalEntry[];
  settings?: CompanySettings;
  initialStartDate?: string;
  initialEndDate?: string;
  lang?: Language;
  onClose: () => void;
  onSelectBank?: (bank: BankAccount) => void;
}

export const BankStatementModal: React.FC<BankStatementModalProps> = ({
  bank,
  banks = [],
  bankTxs = [],
  journalEntries = [],
  settings: propSettings,
  initialStartDate = '',
  initialEndDate = '',
  lang: propLang,
  onClose,
  onSelectBank
}) => {
  const currentLang = propLang || getSystemLanguage();
  const isRtl = currentLang === 'ar';
  const settings = propSettings || getCompanySettings();
  const [selectedBankId, setSelectedBankId] = useState<string>(bank.id);
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const currentBank = useMemo(() => {
    return banks.find(b => b.id === selectedBankId) || bank;
  }, [banks, selectedBankId, bank]);

  // تجميع كافة الحركات البنكية الخاصة بالبنك المحدد
  const allBankMovements = useMemo(() => {
    const list: Omit<UnifiedBankMovement, 'runningBalance'>[] = [];

    // 1. الحركات المباشرة من سجل bankTxs
    (bankTxs || []).forEach(tx => {
      if (tx.bankAccountId === currentBank.id) {
        const isDeposit = tx.type === 'deposit' || tx.type === 'interest';
        const debit = isDeposit ? Number(tx.amount) || 0 : 0;
        const credit = !isDeposit ? Number(tx.amount) || 0 : 0;

        let typeLabel = 'إيداع بنكي';
        if (tx.type === 'withdrawal') typeLabel = 'سحب نقدي / تحويل';
        else if (tx.type === 'transfer') typeLabel = 'تحويل بين البنوك';
        else if (tx.type === 'fee') typeLabel = 'عمولات ورسوم بنكية';
        else if (tx.type === 'interest') typeLabel = 'عوائد وأرباح بنكية';

        list.push({
          id: tx.id,
          date: tx.date,
          referenceNumber: tx.referenceNumber || tx.checkNumber || `TX-${tx.id.slice(-5)}`,
          type: tx.type,
          typeLabel,
          description: tx.description,
          relatedParty: tx.beneficiary || tx.source || '-',
          checkNumber: tx.checkNumber,
          debit,
          credit,
          isReconciled: tx.isReconciled || false,
          source: 'direct_tx'
        });
      }
    });

    // 2. الحركات الناتجة من القيود اليومية المرحّلة التي تمس هذا البنك
    (journalEntries || []).forEach(entry => {
      if (entry.isPosted === false) return; // استبعاد المسودات
      (entry.lines || []).forEach((line, idx) => {
        const matchesBank =
          line.accountId === currentBank.id ||
          (line.accountName && line.accountName.includes(currentBank.bankName)) ||
          (line.description && line.description.includes(currentBank.bankName)) ||
          (currentBank.accountNumber && line.description?.includes(currentBank.accountNumber));

        if (matchesBank) {
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;

          // تجنب التكرار إذا كانت الحركة مسجلة أصلاً في bankTxs بنفس المرجع
          const isDuplicate = list.some(m => m.referenceNumber === entry.entryNumber || (line.checkNumber && m.checkNumber === line.checkNumber));
          if (!isDuplicate) {
            list.push({
              id: `je_${entry.id}_${idx}`,
              date: entry.date,
              referenceNumber: entry.entryNumber,
              type: 'journal_entry',
              typeLabel: debit > 0 ? 'إيداع (قيد يومية)' : 'صرف/تحويل (قيد يومية)',
              description: line.description || entry.description,
              relatedParty: entry.referenceId || line.costCenterName || '-',
              checkNumber: line.checkNumber,
              costCenterName: line.costCenterName,
              debit,
              credit,
              isReconciled: true,
              source: 'journal_entry'
            });
          }
        }
      });
    });

    // الترتيب الزمني من الأقدم للأحدث لحساب الرصيد التراكمي بدقة
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // احتساب الرصيد التراكمي بدءاً من الرصيد الافتتاحي
    let currentBal = Number(currentBank.initialBalance) || 0;
    const result: UnifiedBankMovement[] = list.map(item => {
      currentBal += (item.debit - item.credit);
      return {
        ...item,
        runningBalance: currentBal
      };
    });

    return result;
  }, [currentBank, bankTxs, journalEntries]);

  // حساب الرصيد الافتتاحي قبل فترة التصفية
  const openingBalanceForPeriod = useMemo(() => {
    let bal = Number(currentBank.initialBalance) || 0;
    if (!startDate) return bal;

    allBankMovements.forEach(m => {
      if (m.date < startDate) {
        bal += (m.debit - m.credit);
      }
    });
    return bal;
  }, [allBankMovements, currentBank, startDate]);

  // تصفية الحركات وفق الفلاتر النشطة
  const filteredMovements = useMemo(() => {
    return allBankMovements.filter(m => {
      const matchesDate = isDateInRange(m.date, startDate, endDate);
      const matchesSearch = !searchQuery ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.relatedParty && m.relatedParty.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.checkNumber && m.checkNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' ||
        (typeFilter === 'deposits' && m.debit > 0) ||
        (typeFilter === 'withdrawals' && m.credit > 0) ||
        (typeFilter === 'fees' && m.type === 'fee') ||
        (typeFilter === 'checks' && !!m.checkNumber);

      return matchesDate && matchesSearch && matchesType;
    });
  }, [allBankMovements, startDate, endDate, searchQuery, typeFilter]);

  // إجماليات الفترة
  const periodTotals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    filteredMovements.forEach(m => {
      totalIn += m.debit;
      totalOut += m.credit;
    });

    const netMovement = totalIn - totalOut;
    const endingBalance = openingBalanceForPeriod + netMovement;

    return {
      totalIn,
      totalOut,
      netMovement,
      endingBalance,
      count: filteredMovements.length
    };
  }, [filteredMovements, openingBalanceForPeriod]);

  // طباعة كشف الحساب البنكي الرسمي بصيغة PDF
  const handlePrintStatement = () => {
    const isAr = currentLang === 'ar';
    const isDe = currentLang === 'de';
    const curr = currentBank.currency || settings.currency;

    const title = isDe
      ? `Bankkontoauszug - ${currentBank.bankName}`
      : isAr
      ? `كشف حساب بنكي - ${currentBank.bankName}`
      : `Bank Statement - ${currentBank.bankName}`;

    const subtitle = isDe
      ? `Konto-Nr: ${currentBank.accountNumber} | Filiale: ${currentBank.branch || 'Hauptstelle'} | Währung: ${curr} | Zeitraum: ${startDate || 'Beginn'} bis ${endDate || 'Heute'}`
      : isAr
      ? `رقم الحساب: ${currentBank.accountNumber} | الفرع: ${currentBank.branch || 'الرئيسي'} | العملة: ${curr} | الفترة: ${startDate || 'البداية'} إلى ${endDate || 'حتى تاريخه'}`
      : `Account No: ${currentBank.accountNumber} | Branch: ${currentBank.branch || 'Main'} | Currency: ${curr} | Period: ${startDate || 'Start'} to ${endDate || 'Today'}`;

    const headers = isDe
      ? ['Nr.', 'Datum', 'Referenz / Beleg', 'Scheck-Nr.', 'Buchungsart', 'Beschreibung', 'Begünstigter / Partner', 'Eingang / Soll (+)', 'Ausgang / Haben (-)', 'Saldo']
      : isAr
      ? ['م', 'التاريخ', 'رقم المرجع / القيد', 'رقم الشيك', 'نوع الحركة', 'البيان والشرح', 'الطرف ذو العلاقة', 'إيداع / مدين (+)', 'سحب / دائن (-)', 'الرصيد بعد الحركة']
      : ['#', 'Date', 'Ref / Voucher', 'Check #', 'Tx Type', 'Description', 'Party / Beneficiary', 'Debit / In (+)', 'Credit / Out (-)', 'Running Balance'];

    let running = openingBalanceForPeriod;
    const locale = isAr ? 'ar-EG' : isDe ? 'de-DE' : 'en-US';

    const rows = filteredMovements.map((m, idx) => {
      running += (m.debit - m.credit);
      return [
        idx + 1,
        m.date,
        m.referenceNumber,
        m.checkNumber || '-',
        m.typeLabel,
        m.description,
        m.relatedParty || '-',
        m.debit > 0 ? `${m.debit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` : '-',
        m.credit > 0 ? `${m.credit.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` : '-',
        `${running.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`
      ];
    });

    const totals = isDe
      ? [
          { label: 'Anfangsbestand zu Periodenbeginn', value: `${openingBalanceForPeriod.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Summe Eingänge und Einzahlungen (+)', value: `${periodTotals.totalIn.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Summe Ausgänge und Gebühren (-)', value: `${periodTotals.totalOut.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Netto-Periodenveränderung', value: `${periodTotals.netMovement.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Schlussbestand am Periodenende', value: `${periodTotals.endingBalance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` }
        ]
      : isAr
      ? [
          { label: 'الرصيد الافتتاحي للبنك بداية الفترة', value: `${openingBalanceForPeriod.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'إجمالي الإيداعات والتحويلات الواردة (+)', value: `${periodTotals.totalIn.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'إجمالي المسحوبات والمصروفات والرسوم (-)', value: `${periodTotals.totalOut.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'صافي حركة الفترة البنكية', value: `${periodTotals.netMovement.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'الرصيد الختامي الحالي بنهاية الفترة', value: `${periodTotals.endingBalance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` }
        ]
      : [
          { label: 'Period Opening Balance', value: `${openingBalanceForPeriod.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Total Inflows / Deposits (+)', value: `${periodTotals.totalIn.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Total Outflows / Withdrawals (-)', value: `${periodTotals.totalOut.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Net Period Movement', value: `${periodTotals.netMovement.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` },
          { label: 'Period Closing Balance', value: `${periodTotals.endingBalance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` }
        ];

    printReportAsPDF({
      title,
      subtitle,
      headers,
      rows,
      totals,
      companyName: settings.companyName,
      taxNumber: settings.taxNumber,
      lang: currentLang
    });
  };

  // تصدير كشف الحساب إلى Excel
  const handleExportExcel = () => {
    let running = openingBalanceForPeriod;
    const exportData = filteredMovements.map((m, idx) => {
      running += (m.debit - m.credit);
      return {
        'م': idx + 1,
        'التاريخ': m.date,
        'رقم المرجع': m.referenceNumber,
        'رقم الشيك / الحوالة': m.checkNumber || '-',
        'نوع الحركة': m.typeLabel,
        'البيان': m.description,
        'الطرف': m.relatedParty || '-',
        'وارد / مدين': m.debit,
        'صادر / دائن': m.credit,
        'الرصيد بعد الحركة': running,
        'العملة': currentBank.currency || settings.currency,
        'حالة المطابقة': m.isReconciled ? 'مطابق' : 'قيد التسوية'
      };
    });

    exportToExcel(exportData, `Bank_Statement_${currentBank.bankName.replace(/\s+/g, '_')}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 my-auto max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  كشف حساب بنكي معتمد
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {currentBank.currency || settings.currency}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                كشف حساب: {currentBank.bankName}
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                رقم الحساب / الآيبان: {currentBank.accountNumber} | الفرع: {currentBank.branch || 'الفرع الرئيسي'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* اختيار البنك */}
            {banks.length > 1 && (
              <select
                value={selectedBankId}
                onChange={(e) => {
                  setSelectedBankId(e.target.value);
                  const selected = banks.find(b => b.id === e.target.value);
                  if (selected && onSelectBank) onSelectBank(selected);
                }}
                className="bg-slate-800/90 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber})</option>
                ))}
              </select>
            )}

            {/* أزرار الطباعة والتصدير */}
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب (PDF)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* جسم النافذة */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          
          {/* فلتر التاريخ والبحث ونوع الحركة */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <AdvancedDateFilter
              startDate={startDate}
              endDate={endDate}
              title="تحديد الفترة الزمنية لكشف الحساب البنكي"
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
              onReset={() => {
                setStartDate('');
                setEndDate('');
              }}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الشيك، المرجع، البيان، الجهة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  كافة الحركات ({allBankMovements.length})
                </button>
                <button
                  onClick={() => setTypeFilter('deposits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    typeFilter === 'deposits' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>الإيداعات والوارد</span>
                </button>
                <button
                  onClick={() => setTypeFilter('withdrawals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    typeFilter === 'withdrawals' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>المسحوبات والصادر</span>
                </button>
                <button
                  onClick={() => setTypeFilter('checks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    typeFilter === 'checks' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>شيكات وحوالات</span>
                </button>
              </div>
            </div>
          </div>

          {/* كروت ملخص كشف الحساب البنكي */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* الرصيد الافتتاحي */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">الرصيد الافتتاحي</span>
              <div className="font-mono font-black text-base sm:text-lg text-slate-800 mt-1">
                {openingBalanceForPeriod.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-500">{currentBank.currency}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{startDate ? `حتى ${startDate}` : 'بداية الحساب'}</span>
            </div>

            {/* إجمالي الوارد / الإيداعات */}
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800">إجمالي الإيداعات (+)</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-mono font-black text-base sm:text-lg text-emerald-700 mt-1">
                +{periodTotals.totalIn.toLocaleString()} <span className="text-xs font-sans font-bold text-emerald-600">{currentBank.currency}</span>
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">مدين لحساب البنك</span>
            </div>

            {/* إجمالي الصادر / المسحوبات والرسوم */}
            <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800">إجمالي المسحوبات (-)</span>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="font-mono font-black text-base sm:text-lg text-rose-700 mt-1">
                -{periodTotals.totalOut.toLocaleString()} <span className="text-xs font-sans font-bold text-rose-600">{currentBank.currency}</span>
              </div>
              <span className="text-[10px] text-rose-600 mt-0.5 block">دائن على حساب البنك</span>
            </div>

            {/* صافي حركة الفترة */}
            <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800">صافي حركة الفترة</span>
                <Scale className="w-4 h-4 text-blue-600" />
              </div>
              <div className={`font-mono font-black text-base sm:text-lg mt-1 ${
                periodTotals.netMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {periodTotals.netMovement >= 0 ? `+${periodTotals.netMovement.toLocaleString()}` : periodTotals.netMovement.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-500">{currentBank.currency}</span>
              </div>
              <span className="text-[10px] text-blue-600 mt-0.5 block">فرق الوارد والصادر</span>
            </div>

            {/* الرصيد الختامي الحالي */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-3.5 rounded-2xl shadow-md col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-blue-200 block">الرصيد الختامي المتاح</span>
              <div className="font-mono font-black text-base sm:text-lg text-amber-300 mt-1">
                {periodTotals.endingBalance.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-200">{currentBank.currency}</span>
              </div>
              <span className="text-[10px] text-slate-300 mt-0.5 block">{periodTotals.count} حركة مسجلة</span>
            </div>
          </div>

          {/* شريط التفقيط بالكلمات للرصيد الختامي */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>الرصيد الختامي كتابةً بالكلمات (التفقيط المالي):</span>
            </div>
            <div className="text-xs font-black text-blue-950 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 font-sans shadow-2xs">
              ✍️ {tafqeet(periodTotals.endingBalance, currentBank.currency || settings.currency)}
            </div>
          </div>

          {/* جدول الحركات البنكية التفصيلي */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">تفاصيل حركات كشف الحساب البنكي ({filteredMovements.length} حركة)</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                مرتبة زمنياً مع الرصيد التراكمي بعد كل حركة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">م</th>
                    <th className="py-3 px-3 min-w-[90px]">التاريخ</th>
                    <th className="py-3 px-3 min-w-[110px]">رقم المرجع / القيد</th>
                    <th className="py-3 px-3 min-w-[100px]">نوع الحركة</th>
                    <th className="py-3 px-3 min-w-[200px]">البيان والتفاصيل</th>
                    <th className="py-3 px-3 min-w-[130px]">الطرف ذو العلاقة</th>
                    <th className="py-3 px-3 min-w-[110px] text-center bg-emerald-950 text-emerald-200">وارد / مدين (+)</th>
                    <th className="py-3 px-3 min-w-[110px] text-center bg-rose-950 text-rose-200">صادر / دائن (-)</th>
                    <th className="py-3 px-3 min-w-[130px] text-center bg-blue-950 text-blue-200">الرصيد بعد الحركة</th>
                    <th className="py-3 px-3 w-24 text-center">حالة التسوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* صف الرصيد الافتتاحي */}
                  <tr className="bg-slate-100/80 font-bold text-slate-700">
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-3 font-mono">{startDate || '-'}</td>
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">رصيد بداية الفترة</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">الرصيد الدفتري الافتتاحي للبنك قبل الحركات</td>
                    <td className="py-2.5 px-3">-</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-3 text-center">-</td>
                    <td className="py-2.5 px-3 text-center font-mono font-extrabold text-blue-900 bg-blue-50/50">
                      {openingBalanceForPeriod.toLocaleString()} {currentBank.currency}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-emerald-700 font-bold">معتمد</span>
                    </td>
                  </tr>

                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        لا توجد حركات بنكية مسجلة لهذا الحساب خلال الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      let running = openingBalanceForPeriod;
                      return filteredMovements.map((m, idx) => {
                        running += (m.debit - m.credit);
                        const isDeposit = m.debit > 0;
                        const isWithdrawal = m.credit > 0;

                        return (
                          <tr key={m.id} className="hover:bg-blue-50/30 transition">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{m.date}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-slate-900">{m.referenceNumber}</span>
                              {m.checkNumber && (
                                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-0.5 w-fit">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  <span>شيك: {m.checkNumber}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isDeposit ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  <span>{m.typeLabel}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>{m.typeLabel}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 max-w-[240px] truncate" title={m.description}>
                              {m.description}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {m.relatedParty || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                              {m.debit > 0 ? `+${m.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700 bg-rose-50/30">
                              {m.credit > 0 ? `-${m.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-blue-900 bg-blue-50/60 text-sm">
                              {running.toLocaleString()} <span className="text-[10px] font-sans font-bold text-slate-500">{currentBank.currency}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.isReconciled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {m.isReconciled ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                <span>{m.isReconciled ? 'مطابق' : 'معلق'}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}

                  {/* صف الإجماليات */}
                  <tr className="bg-slate-900 text-white font-extrabold text-xs">
                    <td colSpan={6} className="py-3 px-3 text-center">
                      إجمالي حركة كشف الحساب والرصيد الختامي
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-300">
                      +{periodTotals.totalIn.toLocaleString()} {currentBank.currency}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-rose-300">
                      -{periodTotals.totalOut.toLocaleString()} {currentBank.currency}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-300 text-sm">
                      {periodTotals.endingBalance.toLocaleString()} {currentBank.currency}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* أسفل النافذة */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 يمكنك طباعة هذا الكشف كتقرير رسمي أو تصديره إلى ملف Excel للمطابقة والمراجعة مع البنك.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStatement}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الحساب الآن</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
