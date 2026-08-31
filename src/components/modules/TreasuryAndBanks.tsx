import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Building,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Scale,
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  Search,
  Calendar,
  Layers,
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  Landmark,
  ShieldCheck,
  Phone,
  Eye,
  AlertCircle
} from 'lucide-react';
import {
  TreasuryTransaction,
  BankAccount,
  BankTransaction,
  BankReconciliation,
  Account,
  CostCenter,
  UserAccount,
  JournalEntry,
  CustomerSupplier,
  CompanySettings
} from '../../types';
import { Language, t, getSystemLanguage } from '../../utils/i18n';
import {
  saveTreasuryTxs,
  saveBanks,
  saveBankTxs,
  saveBankRecons,
  getCompanySettings
} from '../../utils/storage';
import { getSystemCurrency, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { getCombinedCashBankSheet } from '../../utils/accounting';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange, formatFilterPeriodDescription } from '../../utils/dateFilter';
import { tafqeet } from '../../utils/tafqeet';
import { BankStatementModal, UnifiedBankMovement } from './BankStatementModal';

// قائمة البنوك الشائعة للاختيار السريع
const POPULAR_BANKS = [
  { name: 'البنك الأهلي المصري', country: 'مصر', swift: 'NBEGEGX' },
  { name: 'بنك مصر', country: 'مصر', swift: 'BMISEGX' },
  { name: 'البنك التجاري الدولي (CIB)', country: 'مصر', swift: 'CIBEEGCX' },
  { name: 'بنك QNB الأهلي', country: 'مصر', swift: 'QNBAEGCX' },
  { name: 'بنك القاهرة', country: 'مصر', swift: 'BCAIEGCX' },
  { name: 'بنك الإسكندرية', country: 'مصر', swift: 'ALEXEGCX' },
  { name: 'مصرف أبوظبي الإسلامي مصر (ADIB)', country: 'مصر', swift: 'ADIBEGCX' },
  { name: 'البنك العربي الأفريقي الدولي', country: 'مصر', swift: 'AAIBEGCX' },
  { name: 'بنك فيصل الإسلامي المصري', country: 'مصر', swift: 'FIBEEGCX' },
  { name: 'مصرف الراجحي', country: 'السعودية', swift: 'RJHISARI' },
  { name: 'البنك الأهلي السعودي (SNB)', country: 'السعودية', swift: 'NCBKSARI' },
  { name: 'بنك الرياض', country: 'السعودية', swift: 'RIBLSARI' },
  { name: 'بنك الإنماء', country: 'السعودية', swift: 'INMASARI' },
  { name: 'بنك البلاد', country: 'السعودية', swift: 'ALBISARI' },
  { name: 'بنك الجزيرة', country: 'السعودية', swift: 'BJAZSARI' }
];

interface TreasuryAndBanksProps {
  treasuryTxs: TreasuryTransaction[];
  banks: BankAccount[];
  bankTxs: BankTransaction[];
  bankRecons: BankReconciliation[];
  journalEntries?: JournalEntry[];
  customersSuppliers?: CustomerSupplier[];
  settings?: CompanySettings;
  accounts: Account[];
  costCenters: CostCenter[];
  currentUser?: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const TreasuryAndBanks: React.FC<TreasuryAndBanksProps> = ({
  treasuryTxs = [],
  banks = [],
  bankTxs = [],
  bankRecons = [],
  journalEntries = [],
  customersSuppliers = [],
  settings: propSettings,
  accounts = [],
  costCenters = [],
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const settings = propSettings || getCompanySettings();
  const sysCurr = settings?.currency || getSystemCurrency();

  const [activeTab, setActiveTab] = useState<'treasury' | 'banks' | 'bank_ledger' | 'reconciliation' | 'combined_sheet'>('treasury');

  // تصفية التاريخ بالأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  // فلترة سجل حركات البنوك
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('all');
  const [bankTxTypeFilter, setBankTxTypeFilter] = useState<string>('all');

  const canAdd = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canAdd !== false) : true;
  const canEdit = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canEdit !== false) : true;
  const canDelete = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canDelete !== false) : true;
  const canSettle = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canSettle !== false) : true;
  const canExport = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canExport !== false) : true;

  // نوافذ الحوار
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [editingTreasury, setEditingTreasury] = useState<TreasuryTransaction | null>(null);

  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  const [showReconModal, setShowReconModal] = useState(false);

  // نافذة كشف الحساب البنكي التفاعلي
  const [activeStatementBank, setActiveStatementBank] = useState<BankAccount | null>(null);

  // نافذة إضافة حركة بنكية مباشرة جديدة
  const [showBankTxModal, setShowBankTxModal] = useState(false);
  const [bankTxBankId, setBankTxBankId] = useState<string>('');
  const [bankTxDate, setBankTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bankTxType, setBankTxType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest'>('deposit');
  const [bankTxAmount, setBankTxAmount] = useState<number>(0);
  const [bankTxDesc, setBankTxDesc] = useState<string>('');
  const [bankTxCheckNum, setBankTxCheckNum] = useState<string>('');
  const [bankTxParty, setBankTxParty] = useState<string>('');
  const [bankTxCostCenter, setBankTxCostCenter] = useState<string>('');

  // فورم الخزينة
  const [trsDate, setTrsDate] = useState(new Date().toISOString().slice(0, 10));
  const [trsType, setTrsType] = useState<'in' | 'out'>('in');
  const [trsAmount, setTrsAmount] = useState<number>(0);
  const [trsCategory, setTrsCategory] = useState<any>('customer_payment');
  const [trsParty, setTrsParty] = useState('');
  const [trsDesc, setTrsDesc] = useState('');
  const [trsCostCenter, setTrsCostCenter] = useState('');

  // فورم البنوك الاحترافي
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [bankBranch, setBankBranch] = useState('');
  const [bankCurrency, setBankCurrency] = useState(sysCurr);
  const [bankSwift, setBankSwift] = useState('');
  const [bankMinBalance, setBankMinBalance] = useState<number>(0);
  const [bankContactPhone, setBankContactPhone] = useState('');
  const [bankPurpose, setBankPurpose] = useState('general');
  const [bankNotes, setBankNotes] = useState('');

  // فورم التسوية
  const [selectedReconBankTab, setSelectedReconBankTab] = useState<string>('all');
  const [reconBankId, setReconBankId] = useState(banks?.[0]?.id || '');
  const [reconDate, setReconDate] = useState(new Date().toISOString().slice(0, 10));
  const [statementBal, setStatementBal] = useState<number>(0);
  const [reconNotes, setReconNotes] = useState('');

  // فتح نافذة إعداد تسوية لبنك محدد
  const handleOpenReconModalForBank = (bankId?: string) => {
    const targetId = bankId || (selectedReconBankTab !== 'all' ? selectedReconBankTab : banks?.[0]?.id) || '';
    setReconBankId(targetId);
    const bObj = banks.find(b => b.id === targetId);
    if (bObj) {
      setStatementBal(bObj.currentBalance);
    }
    setReconDate(new Date().toISOString().slice(0, 10));
    setReconNotes('');
    setShowReconModal(true);
  };

  // تسوية ومطابقة كافة الحركات المعلقة لبنك محدد دفعة واحدة
  const handleReconcileAllPendingForBank = (bankId: string) => {
    const bankObj = banks.find(b => b.id === bankId);
    const updated = bankTxs.map(t => {
      if (t.bankAccountId === bankId) {
        return { ...t, isReconciled: true };
      }
      return t;
    });
    saveBankTxs(updated);
    onRefresh();
    customAlert(`تم تأكيد مطابقة وتسوية كافة حركات بنك "${bankObj?.bankName || 'المحدد'}" بنجاح!`, 'success');
  };

  // فتح نافذة تعديل بنك
  const handleOpenEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setBankName(bank.bankName);
    setAccountNumber(bank.accountNumber);
    setBankBalance(bank.initialBalance);
    setBankBranch(bank.branch || '');
    setBankCurrency(bank.currency || sysCurr);
    setBankSwift((bank as any).swiftCode || '');
    setBankMinBalance((bank as any).minBalance || 0);
    setBankContactPhone((bank as any).contactPhone || '');
    setBankPurpose((bank as any).purpose || 'general');
    setBankNotes((bank as any).notes || '');
    setShowBankModal(true);
  };

  // فتح نافذة إضافة بنك جديد
  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankName('');
    setAccountNumber('');
    setBankBalance(0);
    setBankBranch('');
    setBankCurrency(sysCurr);
    setBankSwift('');
    setBankMinBalance(0);
    setBankContactPhone('');
    setBankPurpose('general');
    setBankNotes('');
    setShowBankModal(true);
  };

  // حفظ حركة خزينة جديدة أو معدلة
  const handleSaveTreasury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trsAmount || !trsDesc.trim()) {
      customAlert('يرجى إدخال المبلغ والبيان', 'warning');
      return;
    }

    let updated: TreasuryTransaction[];
    if (editingTreasury) {
      updated = treasuryTxs.map(t => {
        if (t.id === editingTreasury.id) {
          return {
            ...t,
            date: trsDate,
            type: trsType,
            amount: Number(trsAmount),
            category: trsCategory,
            relatedParty: trsParty,
            description: trsDesc,
            costCenterId: trsCostCenter || undefined
          };
        }
        return t;
      });
    } else {
      const newTx: TreasuryTransaction = {
        id: `trs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        transactionNumber: `TR-${Math.floor(Math.random() * 8999 + 1000)}`,
        date: trsDate,
        type: trsType,
        amount: Number(trsAmount),
        category: trsCategory,
        relatedParty: trsParty,
        description: trsDesc,
        costCenterId: trsCostCenter || undefined,
        enteredBy: 'أمين الصندوق'
      };
      updated = [newTx, ...treasuryTxs];
    }

    saveTreasuryTxs(updated);
    onRefresh();
    setShowTreasuryModal(false);
    customAlert(editingTreasury ? 'تم تعديل حركة الخزينة بنجاح!' : 'تم تسجيل حركة الخزينة وتحديث الرصيد بنجاح!', 'success');
  };

  // حذف حركة خزينة
  const handleDeleteTreasury = (id: string, num: string) => {
    customConfirm(`تنبيه: هل أنت متأكد من حذف حركة الخزينة رقم ${num}؟`, () => {
      const updated = treasuryTxs.filter(t => t.id !== id);
      saveTreasuryTxs(updated);
      onRefresh();
      customAlert('تم حذف الحركة بنجاح', 'success');
    }, 'تأكيد حذف حركة الخزينة');
  };

  // حذف حساب بنكي
  const handleDeleteBank = (id: string, name: string) => {
    customConfirm(`تنبيه: هل أنت متأكد من حذف الحساب البنكي "${name}" نهائياً؟`, () => {
      const updated = banks.filter(b => b.id !== id);
      saveBanks(updated);
      onRefresh();
      customAlert('تم حذف الحساب البنكي بنجاح', 'success');
    }, 'تأكيد حذف الحساب البنكي');
  };

  // حذف تسوية بنكية
  const handleDeleteRecon = (id: string) => {
    customConfirm('تنبيه: هل أنت متأكد من حذف سجل التسوية البنكية؟', () => {
      const updated = bankRecons.filter(r => r.id !== id);
      saveBankRecons(updated);
      onRefresh();
      customAlert('تم حذف سجل التسوية بنجاح', 'success');
    }, 'تأكيد حذف التسوية البنكية');
  };

  // حفظ بيانات حساب بنكي (إضافة أو تعديل)
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) {
      customAlert('يرجى إدخال اسم البنك ورقم الحساب أو الآيبان بدقة', 'warning');
      return;
    }

    if (editingBank) {
      const updated = banks.map(b => {
        if (b.id === editingBank.id) {
          const diff = Number(bankBalance) - b.initialBalance;
          return {
            ...b,
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            currency: bankCurrency || sysCurr,
            initialBalance: Number(bankBalance),
            currentBalance: b.currentBalance + diff,
            branch: bankBranch.trim(),
            swiftCode: bankSwift.trim(),
            minBalance: Number(bankMinBalance),
            contactPhone: bankContactPhone.trim(),
            purpose: bankPurpose,
            notes: bankNotes.trim()
          } as BankAccount;
        }
        return b;
      });
      saveBanks(updated);
      onRefresh();
      setShowBankModal(false);
      customAlert('تم تحديث بيانات الحساب البنكي بنجاح!', 'success');
    } else {
      const newBank: BankAccount = {
        id: `bank_${Date.now()}`,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        currency: bankCurrency || sysCurr,
        initialBalance: Number(bankBalance),
        currentBalance: Number(bankBalance),
        branch: bankBranch.trim(),
        swiftCode: bankSwift.trim(),
        minBalance: Number(bankMinBalance),
        contactPhone: bankContactPhone.trim(),
        purpose: bankPurpose,
        notes: bankNotes.trim()
      } as BankAccount;

      const updated = [...banks, newBank];
      saveBanks(updated);
      onRefresh();
      setShowBankModal(false);
      customAlert(`تم إضافة الحساب البنكي "${bankName}" بنجاح!`, 'success');
    }
  };

  // حفظ حركة بنكية مباشرة جديدة
  const handleSaveBankTx = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBankId = bankTxBankId || banks[0]?.id;
    if (!targetBankId) {
      customAlert('يرجى اختيار الحساب البنكي أولاً', 'warning');
      return;
    }
    if (!bankTxAmount || bankTxAmount <= 0) {
      customAlert('يرجى إدخال مبلغ الحركة البنكية بشكل صحيح', 'warning');
      return;
    }
    if (!bankTxDesc.trim()) {
      customAlert('يرجى إدخال وصف وبيان الحركة البنكية', 'warning');
      return;
    }

    const selectedBankObj = banks.find(b => b.id === targetBankId);
    const isDeposit = bankTxType === 'deposit' || bankTxType === 'interest';

    const newTx: BankTransaction = {
      id: `btx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      bankAccountId: targetBankId,
      date: bankTxDate,
      type: bankTxType,
      amount: Number(bankTxAmount),
      description: bankTxDesc.trim(),
      checkNumber: bankTxCheckNum.trim() || undefined,
      referenceNumber: `BNK-${Math.floor(Math.random() * 89999 + 10000)}`,
      beneficiary: bankTxParty.trim() || undefined,
      source: isDeposit ? (bankTxParty.trim() || 'إيداع بنكي') : undefined,
      isReconciled: false
    };

    const updatedTxs = [newTx, ...bankTxs];
    saveBankTxs(updatedTxs);

    // تحديث رصيد الحساب البنكي الحالي
    if (selectedBankObj) {
      const updatedBanks = banks.map(b => {
        if (b.id === targetBankId) {
          const delta = isDeposit ? Number(bankTxAmount) : -Number(bankTxAmount);
          return {
            ...b,
            currentBalance: b.currentBalance + delta
          };
        }
        return b;
      });
      saveBanks(updatedBanks);
    }

    onRefresh();
    setShowBankTxModal(false);
    customAlert('تم تسجيل الحركة البنكية وتحديث رصيد الحساب بنجاح!', 'success');
  };

  // تبديل حالة المطابقة والتسوية للحركة
  const handleToggleReconcile = (txId: string) => {
    const updated = bankTxs.map(t => {
      if (t.id === txId) {
        return { ...t, isReconciled: !t.isReconciled };
      }
      return t;
    });
    saveBankTxs(updated);
    onRefresh();
    customAlert('تم تحديث حالة مطابقة الحركة البنكية', 'info');
  };

  // حذف حركة بنكية مباشرة
  const handleDeleteBankTx = (txId: string, refNum: string) => {
    customConfirm(`تنبيه: هل أنت متأكد من حذف الحركة البنكية رقم ${refNum}؟`, () => {
      const txToDelete = bankTxs.find(t => t.id === txId);
      if (txToDelete) {
        const isDeposit = txToDelete.type === 'deposit' || txToDelete.type === 'interest';
        // عكس تأثير الرصيد
        const updatedBanks = banks.map(b => {
          if (b.id === txToDelete.bankAccountId) {
            const delta = isDeposit ? -txToDelete.amount : txToDelete.amount;
            return { ...b, currentBalance: b.currentBalance + delta };
          }
          return b;
        });
        saveBanks(updatedBanks);
      }

      const updated = bankTxs.filter(t => t.id !== txId);
      saveBankTxs(updated);
      onRefresh();
      customAlert('تم حذف الحركة البنكية بنجاح', 'success');
    }, 'تأكيد حذف الحركة البنكية');
  };

  // حفظ تسوية بنكية
  const handleSaveRecon = (e: React.FormEvent) => {
    e.preventDefault();
    const bankObj = banks.find(b => b.id === reconBankId);
    if (!bankObj) return;

    const diff = Number(statementBal) - bankObj.currentBalance;
    const newRecon: BankReconciliation = {
      id: `rec_${Date.now()}`,
      bankAccountId: reconBankId,
      date: reconDate,
      statementBalance: Number(statementBal),
      bookBalance: bankObj.currentBalance,
      difference: diff,
      reconciledItemsCount: bankTxs.filter(t => t.bankAccountId === reconBankId).length,
      notes: reconNotes || 'تسوية كشف حساب بنكي دورية',
      status: Math.abs(diff) < 1 ? 'balanced' : 'discrepancy'
    };

    const updated = [newRecon, ...bankRecons];
    saveBankRecons(updated);
    onRefresh();
    setShowReconModal(false);
    customAlert(
      Math.abs(diff) < 1
        ? 'تمت التسوية البنكية بنجاح والتطابق تام!'
        : `تمت التسوية مع وجود فرق قدره (${diff.toLocaleString()} ${bankObj.currency || sysCurr})، يرجى مراجعة قيود العمولات أو الشيكات المعلقة.`,
      Math.abs(diff) < 1 ? 'success' : 'warning'
    );
  };

  // حساب رصيد وحركات الخزينة التراكمية مع دعم التصفية
  const filteredTreasuryTxs = useMemo(() => {
    return treasuryTxs.filter(tx => {
      const matchesSearch = !searchQuery ||
        tx.description.includes(searchQuery) ||
        (tx.relatedParty && tx.relatedParty.includes(searchQuery)) ||
        tx.transactionNumber.includes(searchQuery);
      const matchesDate = isDateInRange(tx.date, startDate, endDate);
      return matchesSearch && matchesDate;
    });
  }, [treasuryTxs, searchQuery, startDate, endDate]);

  const treasuryWithBalance = useMemo(() => {
    let currentRunningBalance = 50000;
    return filteredTreasuryTxs.map(tx => {
      if (tx.type === 'in') {
        currentRunningBalance += tx.amount;
      } else {
        currentRunningBalance -= tx.amount;
      }
      return { ...tx, runningBalance: currentRunningBalance };
    }).reverse();
  }, [filteredTreasuryTxs]);

  const totalTreasuryIn = useMemo(() => {
    return filteredTreasuryTxs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  }, [filteredTreasuryTxs]);

  const totalTreasuryOut = useMemo(() => {
    return filteredTreasuryTxs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  }, [filteredTreasuryTxs]);

  const currentPeriodNetBalance = useMemo(() => {
    return totalTreasuryIn - totalTreasuryOut;
  }, [totalTreasuryIn, totalTreasuryOut]);

  // تجميع سجل حركات البنوك الشامل (Bank Ledger)
  const unifiedBankLedger = useMemo(() => {
    const list: (UnifiedBankMovement & { bankName: string; bankCurrency: string })[] = [];

    // 1. حركات bankTxs
    (bankTxs || []).forEach(tx => {
      const bObj = banks.find(b => b.id === tx.bankAccountId);
      const isDeposit = tx.type === 'deposit' || tx.type === 'interest';
      const debit = isDeposit ? Number(tx.amount) || 0 : 0;
      const credit = !isDeposit ? Number(tx.amount) || 0 : 0;

      let typeLabel = 'إيداع بنكي';
      if (tx.type === 'withdrawal') typeLabel = 'سحب / تحويل صادر';
      else if (tx.type === 'transfer') typeLabel = 'تحويل بين الحسابات';
      else if (tx.type === 'fee') typeLabel = 'عمولات ومصاريف بنكية';
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
        runningBalance: 0,
        isReconciled: tx.isReconciled || false,
        source: 'direct_tx',
        bankName: bObj?.bankName || 'حساب بنكي',
        bankCurrency: bObj?.currency || sysCurr
      });
    });

    // 2. حركات القيود اليومية المرتبطة بالبنوك
    (journalEntries || []).forEach(entry => {
      if (entry.isPosted === false) return;
      (entry.lines || []).forEach((line, idx) => {
        const matchedBank = banks.find(b =>
          b.id === line.accountId ||
          line.accountName?.includes(b.bankName) ||
          (line.description && line.description.includes(b.bankName)) ||
          (b.accountNumber && line.description?.includes(b.accountNumber))
        );

        if (matchedBank) {
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;

          const isDuplicate = list.some(m => m.referenceNumber === entry.entryNumber || (line.checkNumber && m.checkNumber === line.checkNumber));
          if (!isDuplicate) {
            list.push({
              id: `je_${entry.id}_${idx}`,
              date: entry.date,
              referenceNumber: entry.entryNumber,
              type: 'journal_entry',
              typeLabel: debit > 0 ? 'إيداع (قيد محاسبي)' : 'صرف/تحويل (قيد محاسبي)',
              description: line.description || entry.description,
              relatedParty: entry.referenceId || line.costCenterName || '-',
              checkNumber: line.checkNumber,
              costCenterName: line.costCenterName,
              debit,
              credit,
              runningBalance: 0,
              isReconciled: true,
              source: 'journal_entry',
              bankName: matchedBank.bankName,
              bankCurrency: matchedBank.currency || sysCurr
            });
          }
        }
      });
    });

    // فرز الحركات زمنياً
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // احتساب الرصيد التراكمي
    let runBal = 0;
    return list.map(item => {
      runBal += (item.debit - item.credit);
      return {
        ...item,
        runningBalance: runBal
      };
    });
  }, [bankTxs, journalEntries, banks, sysCurr]);

  // تصفية سجل حركات البنوك
  const filteredBankLedger = useMemo(() => {
    return unifiedBankLedger.filter(tx => {
      const matchesBank = selectedBankFilter === 'all' || tx.bankName === selectedBankFilter || banks.find(b => b.id === selectedBankFilter)?.bankName === tx.bankName;
      const matchesDate = isDateInRange(tx.date, startDate, endDate);
      const matchesSearch = !searchQuery ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.relatedParty && tx.relatedParty.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.checkNumber && tx.checkNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.bankName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = bankTxTypeFilter === 'all' ||
        (bankTxTypeFilter === 'deposits' && tx.debit > 0) ||
        (bankTxTypeFilter === 'withdrawals' && tx.credit > 0) ||
        (bankTxTypeFilter === 'fees' && tx.type === 'fee') ||
        (bankTxTypeFilter === 'checks' && !!tx.checkNumber);

      return matchesBank && matchesDate && matchesSearch && matchesType;
    });
  }, [unifiedBankLedger, selectedBankFilter, startDate, endDate, searchQuery, bankTxTypeFilter, banks]);

  // إجماليات حركات البنوك المصفاة
  const bankLedgerTotals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    filteredBankLedger.forEach(t => {
      totalIn += t.debit;
      totalOut += t.credit;
    });
    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      count: filteredBankLedger.length
    };
  }, [filteredBankLedger]);

  // بيانات الشيت المجمع لحركات النقدية والبنك
  const rawCombinedSheet = getCombinedCashBankSheet();
  const filteredCombinedRows = useMemo(() => {
    return rawCombinedSheet.rows.filter(r => {
      const matchesSearch = !searchQuery ||
        r.description.includes(searchQuery) ||
        r.reference.includes(searchQuery) ||
        (r.partyName && r.partyName.includes(searchQuery));
      const matchesDate = isDateInRange(r.date, startDate, endDate);
      return matchesSearch && matchesDate;
    });
  }, [rawCombinedSheet, searchQuery, startDate, endDate]);

  const combinedTotals = useMemo(() => {
    let trsIn = 0;
    let trsOut = 0;
    let totalExpenses = 0;
    let totalRevenues = 0;
    let totalCustodyAdvances = 0;

    filteredCombinedRows.forEach(r => {
      trsIn += (r.treasuryIn || 0);
      trsOut += (r.treasuryOut || 0);
      totalExpenses += (r.expenseAmount || 0);
      totalRevenues += (r.revenueAmount || 0);
      totalCustodyAdvances += (r.custodyAdvanceAmount || 0);
    });

    return {
      treasuryIn: trsIn,
      treasuryOut: trsOut,
      totalExpenses,
      totalRevenues,
      totalCustodyAdvances
    };
  }, [filteredCombinedRows]);

  const filteredBankRecons = useMemo(() => {
    return bankRecons.filter(r => isDateInRange(r.date, startDate, endDate));
  }, [bankRecons, startDate, endDate]);

  // طباعة كشف حساب بنكي مباشر لأحد البنوك
  const handleDirectPrintBankStatement = (targetBank: BankAccount) => {
    setActiveStatementBank(targetBank);
  };

  // طباعة تقرير سجل حركات البنوك الشامل
  const handlePrintBankLedger = () => {
    const title = selectedBankFilter === 'all' ? 'سجل حركات البنوك العام والشامل' : `سجل حركات بنك: ${banks.find(b => b.id === selectedBankFilter)?.bankName || selectedBankFilter}`;
    const subtitle = `الفترة: ${startDate || 'كافة الفترات'} إلى ${endDate || 'حتى تاريخه'} | العملة: ${sysCurr}`;

    const headers = [
      'م',
      'التاريخ',
      'رقم المرجع / القيد',
      'الحساب البنكي',
      'نوع الحركة',
      'البيان والشرح',
      'الطرف المستفيد',
      `إيداع / مدين (+)`,
      `سحب / دائن (-)`,
      `الرصيد بعد الحركة`
    ];

    const rows = filteredBankLedger.map((m, idx) => [
      idx + 1,
      m.date,
      m.referenceNumber + (m.checkNumber ? ` (شيك: ${m.checkNumber})` : ''),
      m.bankName,
      m.typeLabel,
      m.description,
      m.relatedParty || '-',
      m.debit > 0 ? `${m.debit.toLocaleString()} ${m.bankCurrency}` : '-',
      m.credit > 0 ? `${m.credit.toLocaleString()} ${m.bankCurrency}` : '-',
      `${m.runningBalance.toLocaleString()} ${m.bankCurrency}`
    ]);

    const totals = [
      { label: 'إجمالي الإيداعات والتحويلات الواردة (+)', value: `${bankLedgerTotals.totalIn.toLocaleString()} ${sysCurr}` },
      { label: 'إجمالي المسحوبات والمصروفات الصادرة (-)', value: `${bankLedgerTotals.totalOut.toLocaleString()} ${sysCurr}` },
      { label: 'صافي حركة الحسابات البنكية', value: `${bankLedgerTotals.net.toLocaleString()} ${sysCurr}` }
    ];

    printReportAsPDF({
      title,
      subtitle,
      headers,
      rows,
      totals,
      companyName: settings.companyName,
      taxNumber: settings.taxNumber,
      lang: (lang as Language) || 'ar'
    });
  };

  // تحضير بيانات التصدير حسب التبويب
  const getExportData = () => {
    if (activeTab === 'treasury') {
      return treasuryWithBalance.map(t => ({
        'رقم الحركة': t.transactionNumber,
        'التاريخ': t.date,
        'النوع': t.type === 'in' ? 'وارد (مدين)' : 'صادر (دائن)',
        'المبلغ': t.amount,
        'التصنيف': t.category,
        'الطرف ذو العلاقة': t.relatedParty || '-',
        'البيان': t.description,
        'الرصيد التراكمي': t.runningBalance,
        'العملة': sysCurr
      }));
    } else if (activeTab === 'bank_ledger') {
      return filteredBankLedger.map((m, idx) => ({
        'م': idx + 1,
        'التاريخ': m.date,
        'رقم المرجع': m.referenceNumber,
        'رقم الشيك': m.checkNumber || '-',
        'البنك': m.bankName,
        'نوع الحركة': m.typeLabel,
        'البيان': m.description,
        'الطرف': m.relatedParty || '-',
        'وارد / مدين': m.debit,
        'صادر / دائن': m.credit,
        'الرصيد بعد الحركة': m.runningBalance,
        'العملة': m.bankCurrency,
        'حالة المطابقة': m.isReconciled ? 'مطابق' : 'معلق'
      }));
    } else if (activeTab === 'combined_sheet') {
      return filteredCombinedRows.map(r => ({
        'التاريخ': r.date,
        'المرجع': r.reference,
        'البيان': r.description,
        'وارد خزينة': r.treasuryIn,
        'صادر خزينة': r.treasuryOut,
        'مصروفات': r.expenseAmount,
        'إيرادات': r.revenueAmount,
        'عهد وسلف': r.custodyAdvanceAmount,
        'الطرف': r.partyName,
        'المشروع': r.costCenterName || '-'
      }));
    } else if (activeTab === 'reconciliation') {
      return filteredBankRecons.map(rec => {
        const bName = banks.find(b => b.id === rec.bankAccountId)?.bankName || 'حساب بنكي';
        return {
          'تاريخ التسوية': rec.date,
          'البنك': bName,
          'رصيد كشف الحساب': rec.statementBalance,
          'الرصيد الدفتري': rec.bookBalance,
          'الفرق': rec.difference,
          'الحالة': rec.status === 'balanced' ? 'متطابق' : 'فرق معلق',
          'ملاحظات': rec.notes
        };
      });
    }
    return [];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* رأس الصفحة والتنقل بين التبويبات */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
              إدارة السيولة النقدية والمصرفية
            </span>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200 font-mono">
              العملة: {sysCurr}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-600" />
            <span>حركة الخزينة، البنوك، وسجل الحركات والتسويات</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة الخزائن النقدية، الحسابات البنكية، طباعة كشوف الحسابات المعتمدة، سجل الحركات والتسويات البنكية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'treasury' && canAdd && (
            <button
              onClick={() => {
                setEditingTreasury(null);
                setTrsAmount(0);
                setTrsDesc('');
                setTrsParty('');
                setShowTreasuryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل حركة خزينة جديدة</span>
            </button>
          )}

          {activeTab === 'banks' && canAdd && (
            <button
              onClick={handleOpenAddBank}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب بنكي جديد</span>
            </button>
          )}

          {activeTab === 'bank_ledger' && (
            <>
              {canAdd && (
                <button
                  onClick={() => {
                    setBankTxBankId(banks[0]?.id || '');
                    setBankTxAmount(0);
                    setBankTxDesc('');
                    setBankTxCheckNum('');
                    setBankTxParty('');
                    setShowBankTxModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل حركة بنكية جديدة</span>
                </button>
              )}

              <button
                onClick={handlePrintBankLedger}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة سجل حركات البنوك</span>
              </button>
            </>
          )}

          {activeTab === 'reconciliation' && canSettle && (
            <button
              onClick={() => setShowReconModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>إعداد تسوية بنكية جديدة</span>
            </button>
          )}

          {canExport && (
            <ExportButtons
              title={`تقرير ${
                activeTab === 'treasury'
                  ? 'حركة الخزينة الرئيسية'
                  : activeTab === 'bank_ledger'
                  ? 'سجل حركات البنوك الشامل'
                  : activeTab === 'combined_sheet'
                  ? 'الشيت المجمع لحركات النقدية والبنك'
                  : 'حسابات وتسوية البنوك'
              }`}
              subtitle={formatFilterPeriodDescription(startDate, endDate, 'تقرير حركة الخزينة والبنوك والتسويات')}
              data={getExportData()}
              filename={`treasury_bank_${activeTab}`}
            />
          )}
        </div>
      </div>

      {/* شريط البحث المتقدم بالأيام والشهور والسنة */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية حركات الخزينة وسجل البنوك والشيت المجمع والتسويات بالأيام والشهور والسنة"
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

      {/* شريط أزرار التبويبات الرئيسية */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('treasury')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'treasury' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>حركة الخزينة الرئيسية (نقدية)</span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'banks' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Building className="w-4 h-4 text-blue-400" />
          <span>الحسابات البنكية والأرصدة ({banks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_ledger')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'bank_ledger' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Landmark className="w-4 h-4 text-amber-400" />
          <span>سجل حركات البنوك وكشوف الحسابات 🏦</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'reconciliation' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-white'
          }`}
        >
          <Scale className="w-4 h-4 text-purple-400" />
          <span>تسوية البنوك والمطابقة ({bankRecons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('combined_sheet')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'combined_sheet' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-rose-400" />
          <span>الشيت المجمع لحركات النقدية والبنك ⭐</span>
        </button>
      </div>

      {/* محتوى التبويب 1: الخزينة */}
      {activeTab === 'treasury' && (
        <div className="space-y-6">
          {/* كروت ملخص الخزينة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">إجمالي مقبوضات الخزينة (وارد)</span>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  +{totalTreasuryIn.toLocaleString()} <span className="text-xs font-sans font-bold">{sysCurr}</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                  {periodLabel}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">إجمالي مدفوعات الخزينة (صادر)</span>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  -{totalTreasuryOut.toLocaleString()} <span className="text-xs font-sans font-bold">{sysCurr}</span>
                </div>
                <span className="text-[11px] text-rose-600 font-bold mt-1 block">
                  {periodLabel}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-200">صافي التدفق النقدي للخزينة</span>
                <div className="text-2xl font-black font-mono mt-1 text-amber-300">
                  {currentPeriodNetBalance >= 0 ? `+${currentPeriodNetBalance.toLocaleString()}` : currentPeriodNetBalance.toLocaleString()} <span className="text-xs font-sans font-bold text-white">{sysCurr}</span>
                </div>
                <span className="text-[11px] text-slate-300 font-bold mt-1 block">
                  {filteredTreasuryTxs.length} حركة مسجلة
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* جدول حركات الخزينة */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">سجل الحركات النقدية للخزينة الرئيسية</span>
              <span className="text-xs font-bold text-slate-500">الرصيد التراكمي محسوب بدقة بعد كل حركة</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">رقم الحركة</th>
                    <th className="py-3.5 px-4 font-bold">التاريخ</th>
                    <th className="py-3.5 px-4 font-bold">النوع</th>
                    <th className="py-3.5 px-4 font-bold">المبلغ</th>
                    <th className="py-3.5 px-4 font-bold">الطرف المستفيد</th>
                    <th className="py-3.5 px-4 font-bold">البيان والتفاصيل</th>
                    <th className="py-3.5 px-4 font-bold">الرصيد التراكمي</th>
                    <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {treasuryWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        لا توجد حركات خزينة مسجلة خلال الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    treasuryWithBalance.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{tx.transactionNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-600">{tx.date}</td>
                        <td className="py-3 px-4">
                          {tx.type === 'in' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>وارد (مدين)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>صادر (دائن)</span>
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-4 font-mono font-extrabold ${tx.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {tx.amount.toLocaleString()} {sysCurr}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{tx.relatedParty || '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{tx.description}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-blue-900 bg-blue-50/50">
                          {tx.runningBalance.toLocaleString()} {sysCurr}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditingTreasury(tx);
                                  setTrsDate(tx.date);
                                  setTrsType(tx.type);
                                  setTrsAmount(tx.amount);
                                  setTrsDesc(tx.description);
                                  setTrsParty(tx.relatedParty || '');
                                  setShowTreasuryModal(true);
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                                title="تعديل حركة الخزينة"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteTreasury(tx.id, tx.transactionNumber)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                                title="حذف حركة الخزينة"
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
        </div>
      )}

      {/* محتوى التبويب 2: البنوك والأرصدة */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">بطاقات الحسابات البنكية المعتمدة ({banks.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">يمكنك طباعة كشف حساب أي بنك مباشرة أو عرض سجل حركاته التفصيلية وتسوية رصيده</p>
            </div>
            {canAdd && (
              <button
                onClick={handleOpenAddBank}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بنك جديد</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map(bank => {
              const bCurrency = bank.currency || sysCurr;
              const hasMinBal = (bank as any).minBalance > 0;
              const isBelowMin = hasMinBal && bank.currentBalance < (bank as any).minBalance;

              return (
                <div key={bank.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition relative overflow-hidden group">
                  {/* شريط خلفي علوي ملون */}
                  <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800"></div>

                  <div>
                    <div className="flex items-start justify-between mb-4 pt-1">
                      <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>حساب نشط</span>
                        </span>
                        {isBelowMin && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>دون الحد الأدنى</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition">
                      {bank.bankName}
                    </h3>
                    
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-bold text-slate-800 select-all">{bank.accountNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>الفرع: {bank.branch || 'الفرع الرئيسي'}</span>
                      </div>
                      {(bank as any).swiftCode && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">السويفت: {(bank as any).swiftCode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* كتلة الرصيد والتفقيط وأزرار الإجراءات */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                      <span className="text-[11px] font-bold text-slate-400 block">الرصيد الدفتري المتاح الحالي</span>
                      <div className="text-2xl font-black text-blue-950 font-mono mt-0.5">
                        {bank.currentBalance.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-600">{bCurrency}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-1 line-clamp-1">
                        ✍️ {tafqeet(bank.currentBalance, bCurrency)}
                      </div>
                    </div>

                    {/* أزرار العمليات على البنك */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDirectPrintBankStatement(bank)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        title="عرض وطباعة كشف حساب بنكي معتمد بصيغة PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة كشف الحساب</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBankFilter(bank.bankName);
                          setActiveTab('bank_ledger');
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        title="عرض سجل حركات هذا البنك"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>سجل الحركات</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => {
                          setActiveTab('reconciliation');
                          setReconBankId(bank.id);
                        }}
                        className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>تسوية كشف البنك</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditBank(bank)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="تعديل بيانات البنك"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف الحساب البنكي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* محتوى التبويب 3: سجل حركات البنوك الشامل (Bank Ledger) 🏦 */}
      {activeTab === 'bank_ledger' && (
        <div className="space-y-6">
          {/* شريط الفلترة واختيار البنك */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">سجل حركات البنوك العام وكشوف الحسابات</h3>
                  <p className="text-xs text-slate-500">متابعة كافة الإيداعات، المسحوبات، التحويلات، القيود والشيكات المصرفية</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {/* اختيار البنك */}
                <select
                  value={selectedBankFilter}
                  onChange={(e) => setSelectedBankFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">كافة الحسابات البنكية</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.bankName}>{b.bankName} ({b.accountNumber})</option>
                  ))}
                </select>

                {/* زر طباعة كشف الحساب البنكي المحدد */}
                {selectedBankFilter !== 'all' && (
                  <button
                    onClick={() => {
                      const matched = banks.find(b => b.bankName === selectedBankFilter);
                      if (matched) handleDirectPrintBankStatement(matched);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة كشف هذا الحساب</span>
                  </button>
                )}
              </div>
            </div>

            {/* أزرار نوع الحركة والبحث */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setBankTxTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    bankTxTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({unifiedBankLedger.length})
                </button>
                <button
                  onClick={() => setBankTxTypeFilter('deposits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    bankTxTypeFilter === 'deposits' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>الإيداعات والتحويلات الواردة</span>
                </button>
                <button
                  onClick={() => setBankTxTypeFilter('withdrawals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    bankTxTypeFilter === 'withdrawals' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>المسحوبات والمصروفات</span>
                </button>
                <button
                  onClick={() => setBankTxTypeFilter('checks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    bankTxTypeFilter === 'checks' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>شيكات وحوالات</span>
                </button>
              </div>

              <div className="text-xs font-bold text-slate-500">
                إجمالي الحركات المعروضة: <span className="font-mono text-slate-900 font-extrabold">{filteredBankLedger.length}</span>
              </div>
            </div>
          </div>

          {/* كروت ملخص سجل حركات البنوك */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">إجمالي الإيداعات والوارد البنكي (+)</span>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  +{bankLedgerTotals.totalIn.toLocaleString()} <span className="text-xs font-sans font-bold">{sysCurr}</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold mt-1 block">مدين لحسابات البنوك</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">إجمالي المسحوبات والمصروفات (-)</span>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  -{bankLedgerTotals.totalOut.toLocaleString()} <span className="text-xs font-sans font-bold">{sysCurr}</span>
                </div>
                <span className="text-[11px] text-rose-600 font-bold mt-1 block">دائن على حسابات البنوك</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-200">صافي الحركة البنكية للفترة</span>
                <div className="text-2xl font-black font-mono mt-1 text-amber-300">
                  {bankLedgerTotals.net >= 0 ? `+${bankLedgerTotals.net.toLocaleString()}` : bankLedgerTotals.net.toLocaleString()} <span className="text-xs font-sans font-bold text-white">{sysCurr}</span>
                </div>
                <span className="text-[11px] text-slate-300 font-bold mt-1 block">{periodLabel}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* جدول سجل حركات البنوك */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-800 text-sm">جدول حركات الحسابات البنكية المعتمدة</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBankLedger}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الجدول الحالي (PDF)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">م</th>
                    <th className="py-3 px-3 min-w-[90px]">التاريخ</th>
                    <th className="py-3 px-3 min-w-[110px]">رقم المرجع / الشيك</th>
                    <th className="py-3 px-3 min-w-[120px]">الحساب البنكي</th>
                    <th className="py-3 px-3 min-w-[100px]">نوع الحركة</th>
                    <th className="py-3 px-3 min-w-[180px]">البيان والشرح</th>
                    <th className="py-3 px-3 min-w-[120px]">الطرف المستفيد</th>
                    <th className="py-3 px-3 min-w-[100px] text-center bg-emerald-950 text-emerald-200">إيداع / مدين (+)</th>
                    <th className="py-3 px-3 min-w-[100px] text-center bg-rose-950 text-rose-200">سحب / دائن (-)</th>
                    <th className="py-3 px-3 min-w-[120px] text-center bg-blue-950 text-blue-200">الرصيد بعد الحركة</th>
                    <th className="py-3 px-3 text-center">المطابقة</th>
                    <th className="py-3 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBankLedger.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        لا توجد حركات بنكية مسجلة مطابقة لخيارات البحث والتصفية
                      </td>
                    </tr>
                  ) : (
                    filteredBankLedger.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
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
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {m.bankName}
                        </td>
                        <td className="py-2.5 px-3">
                          {m.debit > 0 ? (
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
                        <td className="py-2.5 px-3 font-bold text-slate-800 max-w-xs truncate" title={m.description}>
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
                        <td className="py-2.5 px-3 text-center font-mono font-black text-blue-900 bg-blue-50/50">
                          {m.runningBalance.toLocaleString()} {m.bankCurrency}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {m.source === 'direct_tx' ? (
                            <button
                              onClick={() => handleToggleReconcile(m.id)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                                m.isReconciled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-emerald-100'
                              }`}
                              title="انقر لتغيير حالة المطابقة والتسوية"
                            >
                              {m.isReconciled ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                              <span>{m.isReconciled ? 'مطابق' : 'معلق'}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              قيد معتمد
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {m.source === 'direct_tx' && canDelete ? (
                            <button
                              onClick={() => handleDeleteBankTx(m.id, m.referenceNumber)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="حذف الحركة البنكية"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* صف الإجماليات */}
                  <tr className="bg-slate-900 text-white font-extrabold text-xs">
                    <td colSpan={7} className="py-3 px-3 text-center">
                      إجمالي الحركات المعروضة بالفترة
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-300">
                      +{bankLedgerTotals.totalIn.toLocaleString()} {sysCurr}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-rose-300">
                      -{bankLedgerTotals.totalOut.toLocaleString()} {sysCurr}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-300">
                      {bankLedgerTotals.net.toLocaleString()} {sysCurr}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* محتوى التبويب 4: تسوية البنوك والمطابقة الدفترية مع كشف البنك ⭐ */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-5">
          {/* شريط اختيار البنك للتسوية والمطابقة */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">اختيار البنك للتسوية والمطابقة البنكية (Bank Reconciliation)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">حدد البنك لمطابقة حركاته مع كشف الحساب البنكي الفعلي وحساب الفروقات</p>
                </div>
              </div>

              {canSettle && (
                <button
                  onClick={() => handleOpenReconModalForBank()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إعداد تسوية جديدة {selectedReconBankTab !== 'all' ? `لـ ${banks.find(b => b.id === selectedReconBankTab)?.bankName || ''}` : ''}</span>
                </button>
              )}
            </div>

            {/* أزرار/تبويبات اختيار البنك */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReconBankTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  selectedReconBankTab === 'all'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>كافة البنوك</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedReconBankTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {banks.length}
                </span>
              </button>

              {banks.map(b => {
                const isSelected = selectedReconBankTab === b.id;
                const pendingCount = bankTxs.filter(t => t.bankAccountId === b.id && !t.isReconciled).length;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedReconBankTab(b.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md font-black'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white hover:border-purple-300'
                    }`}
                  >
                    <span>🏦 {b.bankName}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {b.currentBalance.toLocaleString()} {b.currency || sysCurr}
                    </span>
                    {pendingCount > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                      }`} title={`${pendingCount} حركة غير مطابقة`}>
                        {pendingCount} معلق
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* لوحة تفاصيل البنك المحدد للتسوية */}
          {selectedReconBankTab !== 'all' && (() => {
            const currentSelectedBank = banks.find(b => b.id === selectedReconBankTab);
            if (!currentSelectedBank) return null;

            const bTxs = bankTxs.filter(t => t.bankAccountId === currentSelectedBank.id);
            const unreconciledTxs = bTxs.filter(t => !t.isReconciled);
            const reconciledTxs = bTxs.filter(t => t.isReconciled);
            const bankReconHistory = bankRecons.filter(r => r.bankAccountId === currentSelectedBank.id && isDateInRange(r.date, startDate, endDate));
            const lastRecon = bankRecons.filter(r => r.bankAccountId === currentSelectedBank.id)[0];

            return (
              <div className="space-y-4">
                {/* بطاقة معلومات البنك وإحصائيات التسوية */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-purple-800/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-purple-300" />
                        <h4 className="text-lg font-black">{currentSelectedBank.bankName}</h4>
                        <span className="text-[11px] font-mono bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                          {currentSelectedBank.currency || sysCurr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        رقم الحساب: <span className="font-mono font-bold text-white">{currentSelectedBank.accountNumber}</span>
                        {currentSelectedBank.branch && ` | الفرع: ${currentSelectedBank.branch}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOpenReconModalForBank(currentSelectedBank.id)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Scale className="w-4 h-4" />
                        <span>إعداد تسوية جديدة لهذا البنك ⚖️</span>
                      </button>

                      <button
                        onClick={() => setActiveStatementBank(currentSelectedBank)}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>كشف الحساب البنكي 🖨️</span>
                      </button>

                      {unreconciledTxs.length > 0 && (
                        <button
                          onClick={() => handleReconcileAllPendingForBank(currentSelectedBank.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>مطابقة كافة الحركات المعلقة ({unreconciledTxs.length}) ✓</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* إحصائيات المطابقة للبنك */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] text-purple-200 block">الرصيد الدفتري الحالي بالنظام:</span>
                      <span className="text-base font-black font-mono text-white mt-1 block">
                        {currentSelectedBank.currentBalance.toLocaleString()} {currentSelectedBank.currency || sysCurr}
                      </span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] text-purple-200 block">آخر رصيد كشف بنكي مسجل:</span>
                      <span className="text-base font-black font-mono text-emerald-300 mt-1 block">
                        {lastRecon ? `${lastRecon.statementBalance.toLocaleString()} ${currentSelectedBank.currency || sysCurr}` : 'لا يوجد'}
                      </span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] text-purple-200 block">الحركات المطابقة المعتمدة:</span>
                      <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                        {reconciledTxs.length} حركة
                      </span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[11px] text-purple-200 block">حركات معلقة تتطلب مطابقة:</span>
                      <span className={`text-base font-black font-mono mt-1 block ${unreconciledTxs.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {unreconciledTxs.length} حركة معلقة
                      </span>
                    </div>
                  </div>
                </div>

                {/* جدول الحركات المعلقة غير المسواة لهذا البنك */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-black text-slate-800">
                        الحركات البنكية المعلقة غير المطابقة (تحتاج مراجعة مع كشف الحساب) — {unreconciledTxs.length} حركة
                      </h4>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="py-2.5 px-3">التاريخ</th>
                          <th className="py-2.5 px-3">رقم المرجع / الشيك</th>
                          <th className="py-2.5 px-3">نوع الحركة</th>
                          <th className="py-2.5 px-3">البيان والشرح</th>
                          <th className="py-2.5 px-3">المستفيد / الطرف</th>
                          <th className="py-2.5 px-3 text-right">المبلغ ({currentSelectedBank.currency || sysCurr})</th>
                          <th className="py-2.5 px-3 text-center">إجراء المطابقة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unreconciledTxs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-emerald-700 font-bold bg-emerald-50/40">
                              🎉 ممتاز! كافة الحركات البنكية لهذا الحساب مطابقة ومعتمدة بالكامل.
                            </td>
                          </tr>
                        ) : (
                          unreconciledTxs.map(tx => {
                            const isDeposit = tx.type === 'deposit' || tx.type === 'interest';
                            return (
                              <tr key={tx.id} className="hover:bg-purple-50/40">
                                <td className="py-2.5 px-3 font-medium text-slate-700">{tx.date}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                                  {tx.checkNumber || tx.referenceNumber || '-'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isDeposit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {tx.type === 'deposit' ? 'إيداع وارد (+)' : tx.type === 'withdrawal' ? 'سحب صادر (-)' : tx.type === 'fee' ? 'رسوم وعمولة (-)' : tx.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">{tx.description}</td>
                                <td className="py-2.5 px-3 text-slate-600">{tx.beneficiary || tx.source || '-'}</td>
                                <td className={`py-2.5 px-3 font-mono font-black text-right ${isDeposit ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isDeposit ? '+' : '-'}{tx.amount.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => handleToggleReconcile(tx.id)}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-300 rounded-lg text-[11px] font-black transition cursor-pointer shadow-2xs"
                                  >
                                    تأكيد المطابقة ✓
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* سجل التسويات السابقة لهذا البنك المختار */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span>سجل التسويات البنكية المعتمدة لـ ({currentSelectedBank.bankName})</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="py-3 px-4 font-bold">تاريخ التسوية</th>
                          <th className="py-3 px-4 font-bold">رصيد كشف الحساب البنكي</th>
                          <th className="py-3 px-4 font-bold">الرصيد الدفتري بالنظام</th>
                          <th className="py-3 px-4 font-bold">الفرق (Discrepancy)</th>
                          <th className="py-3 px-4 font-bold">الحالة</th>
                          <th className="py-3 px-4 font-bold">ملاحظات المحاسب</th>
                          <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bankReconHistory.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              لا توجد تسويات بنكية مسجلة لهذا البنك خلال الفترة المحددة
                            </td>
                          </tr>
                        ) : (
                          bankReconHistory.map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-slate-700">{rec.date}</td>
                              <td className="py-3 px-4 font-mono font-bold text-blue-900">{rec.statementBalance.toLocaleString()} {currentSelectedBank.currency || sysCurr}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.bookBalance.toLocaleString()} {currentSelectedBank.currency || sysCurr}</td>
                              <td className="py-3 px-4 font-mono font-extrabold">
                                {rec.difference === 0 ? (
                                  <span className="text-emerald-700">0.00 (متطابق تماماً)</span>
                                ) : (
                                  <span className="text-rose-600">{rec.difference.toLocaleString()} {currentSelectedBank.currency || sysCurr}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  rec.status === 'balanced' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {rec.status === 'balanced' ? 'متطابق بنجاح' : 'يوجد فرق معلق'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{rec.notes}</td>
                              <td className="py-3 px-4 text-center">
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteRecon(rec.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                                    title="حذف سجل التسوية"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* في حالة اختيار "كافة البنوك" */}
          {selectedReconBankTab === 'all' && (
            <div className="space-y-4">
              {/* شبكة بطاقات البنوك السريعة للتسوية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {banks.map(b => {
                  const bTxs = bankTxs.filter(t => t.bankAccountId === b.id);
                  const unreconciledCount = bTxs.filter(t => !t.isReconciled).length;
                  const lastRecon = bankRecons.filter(r => r.bankAccountId === b.id)[0];

                  return (
                    <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-purple-600" />
                          <h4 className="text-sm font-black text-slate-900">{b.bankName}</h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {b.currency || sysCurr}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>الرصيد الدفتري الحالي:</span>
                          <span className="font-mono font-bold text-slate-900">{b.currentBalance.toLocaleString()} {b.currency || sysCurr}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>آخر تسوية مسجلة:</span>
                          <span className="font-mono font-bold text-blue-900">
                            {lastRecon ? `${lastRecon.statementBalance.toLocaleString()}` : 'لم تُجرَ بعد'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>حركات معلقة غير مطابقة:</span>
                          <span className={`font-bold ${unreconciledCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {unreconciledCount > 0 ? `${unreconciledCount} حركة معلقة` : 'متطابق بالكامل ✓'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedReconBankTab(b.id)}
                          className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-black transition cursor-pointer text-center"
                        >
                          عرض تسوية {b.bankName} ⚖️
                        </button>
                        <button
                          onClick={() => handleOpenReconModalForBank(b.id)}
                          className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition cursor-pointer"
                          title="إعداد تسوية جديدة"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* سجل التسويات العام لكافة البنوك */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    <span>سجل التسويات البنكية المعتمدة الشامل لكافة البنوك</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">تاريخ التسوية</th>
                        <th className="py-3.5 px-4 font-bold">البنك</th>
                        <th className="py-3.5 px-4 font-bold">رصيد كشف الحساب البنكي</th>
                        <th className="py-3.5 px-4 font-bold">الرصيد الدفتري بالنظام</th>
                        <th className="py-3.5 px-4 font-bold">الفرق (Discrepancy)</th>
                        <th className="py-3.5 px-4 font-bold">الحالة</th>
                        <th className="py-3.5 px-4 font-bold">ملاحظات المحاسب</th>
                        <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBankRecons.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            لا توجد تسويات بنكية مسجلة خلال الفترة المحددة
                          </td>
                        </tr>
                      ) : (
                        filteredBankRecons.map(rec => {
                          const bObj = banks.find(b => b.id === rec.bankAccountId);
                          const bName = bObj?.bankName || 'حساب بنكي';
                          const bCurr = bObj?.currency || sysCurr;
                          return (
                            <tr key={rec.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-slate-700">{rec.date}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{bName}</td>
                              <td className="py-3 px-4 font-mono font-bold text-blue-900">{rec.statementBalance.toLocaleString()} {bCurr}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.bookBalance.toLocaleString()} {bCurr}</td>
                              <td className="py-3 px-4 font-mono font-extrabold">
                                {rec.difference === 0 ? (
                                  <span className="text-emerald-700">0.00 (متطابق تماماً)</span>
                                ) : (
                                  <span className="text-rose-600">{rec.difference.toLocaleString()} {bCurr}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  rec.status === 'balanced' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {rec.status === 'balanced' ? 'متطابق بنجاح' : 'يوجد فرق معلق'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600">{rec.notes}</td>
                              <td className="py-3 px-4 text-center">
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteRecon(rec.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                                    title="حذف سجل التسوية"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* محتوى التبويب 5: الشيت المجمع لحركات النقدية والبنك ⭐ */}
      {activeTab === 'combined_sheet' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-amber-400" />
              <span>الشيت المجمع لحركات النقدية، البنك، المصروفات، الإيرادات والعهد (التفصيلي الكامل)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              يعرض هذا الشيت جميع التدفقات الداخلة والخارجة من الخزينة والبنوك، ومقارنتها بتفاصيل المصروفات والإيرادات والعهد المالية في جدول واحد مجمع لتسهيل المطابقة والمراجعة الفورية.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-[11px] text-slate-300">إجمالي وارد الخزينة</span>
                <div className="font-mono font-bold text-lg text-emerald-400 mt-1">{combinedTotals.treasuryIn.toLocaleString()} {sysCurr}</div>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-[11px] text-slate-300">إجمالي صادر الخزينة</span>
                <div className="font-mono font-bold text-lg text-rose-400 mt-1">{combinedTotals.treasuryOut.toLocaleString()} {sysCurr}</div>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-[11px] text-slate-300">إجمالي المصروفات</span>
                <div className="font-mono font-bold text-lg text-amber-300 mt-1">{combinedTotals.totalExpenses.toLocaleString()} {sysCurr}</div>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-[11px] text-slate-300">إجمالي العهد والسلف</span>
                <div className="font-mono font-bold text-lg text-blue-300 mt-1">{combinedTotals.totalCustodyAdvances.toLocaleString()} {sysCurr}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3 px-3 font-bold">التاريخ</th>
                    <th className="py-3 px-3 font-bold">المرجع</th>
                    <th className="py-3 px-3 font-bold">البيان والتفاصيل</th>
                    <th className="py-3 px-3 font-bold text-emerald-300 bg-emerald-950/40 text-center">وارد خزينة</th>
                    <th className="py-3 px-3 font-bold text-rose-300 bg-rose-950/40 text-center">صادر خزينة</th>
                    <th className="py-3 px-3 font-bold text-amber-300 bg-amber-950/40 text-center">تفصيل مصروفات</th>
                    <th className="py-3 px-3 font-bold text-blue-300 bg-blue-950/40 text-center">تفصيل إيرادات</th>
                    <th className="py-3 px-3 font-bold text-purple-300 bg-purple-950/40 text-center">عهد وسلف</th>
                    <th className="py-3 px-3 font-bold">الطرف المستفيد</th>
                    <th className="py-3 px-3 font-bold">المشروع / المركز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCombinedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        لا توجد حركات نقدية أو بنكية مسجلة خلال الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredCombinedRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono">{row.date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{row.reference}</td>
                        <td className="py-3 px-3 text-slate-800 font-bold max-w-xs">{row.description}</td>
                        
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700 bg-emerald-50/30 text-center">
                          {row.treasuryIn > 0 ? row.treasuryIn.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-700 bg-rose-50/30 text-center">
                          {row.treasuryOut > 0 ? row.treasuryOut.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-800 bg-amber-50/30 text-center">
                          {row.expenseAmount > 0 ? row.expenseAmount.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-800 bg-blue-50/30 text-center">
                          {row.revenueAmount > 0 ? row.revenueAmount.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-purple-800 bg-purple-50/30 text-center">
                          {row.custodyAdvanceAmount > 0 ? row.custodyAdvanceAmount.toLocaleString() : '-'}
                        </td>

                        <td className="py-3 px-3 text-slate-700">{row.partyName}</td>
                        <td className="py-3 px-3 text-slate-600">{row.costCenterName || '-'}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-900 text-white font-extrabold">
                    <td colSpan={3} className="py-3 px-3 text-center">الإجمالي للفترة المحددة بالشيت</td>
                    <td className="py-3 px-3 font-mono text-emerald-300 text-center">{combinedTotals.treasuryIn.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-rose-300 text-center">{combinedTotals.treasuryOut.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-amber-300 text-center">{combinedTotals.totalExpenses.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-blue-300 text-center">{combinedTotals.totalRevenues.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-purple-300 text-center">{combinedTotals.totalCustodyAdvances.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تسجيل حركة خزينة */}
      {showTreasuryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  {editingTreasury ? 'تعديل حركة الخزينة' : 'تسجيل حركة خزينة نقدية جديدة (وارد أو صادر)'}
                </h3>
              </div>
              <button onClick={() => setShowTreasuryModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveTreasury} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة النقدية *</label>
                  <select
                    value={trsType}
                    onChange={(e) => setTrsType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="in">وارد (مقبوضات نقدية - مدين للخزينة)</option>
                    <option value="out">صادر (مدفوعات نقدية - دائن على الخزينة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    value={trsDate}
                    onChange={(e) => setTrsDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ ({sysCurr}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={trsAmount || ''}
                  onChange={(e) => setTrsAmount(Number(e.target.value))}
                  required
                  placeholder="0.00"
                  className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-base font-extrabold text-slate-900"
                />
                {trsAmount > 0 && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1">
                    ✍️ {tafqeet(trsAmount, sysCurr)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف المحاسبي *</label>
                  <select
                    value={trsCategory}
                    onChange={(e) => setTrsCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="customer_payment">تحصيل من عميل</option>
                    <option value="supplier_payment">سداد لمورد</option>
                    <option value="expense">مصروف تشغيلي / إداري</option>
                    <option value="revenue">إيراد متنوع</option>
                    <option value="custody">صرف عهدة موظف</option>
                    <option value="advance">سلف عاملين</option>
                    <option value="transfer">تحويل داخلي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الطرف المستفيد / العميل / الموظف</label>
                  <input
                    type="text"
                    value={trsParty}
                    onChange={(e) => setTrsParty(e.target.value)}
                    placeholder="اسم الجهة أو الشخص..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مشروع / مركز التكلفة (اختياري)</label>
                <select
                  value={trsCostCenter}
                  onChange={(e) => setTrsCostCenter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="">-- بدون ارتباط بمشروع --</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان والشرح *</label>
                <input
                  type="text"
                  value={trsDesc}
                  onChange={(e) => setTrsDesc(e.target.value)}
                  required
                  placeholder="مثال: تحصيل دفعة نقدية من العميل..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTreasuryModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow">حفظ الحركة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة وتعديل الحساب البنكي بشكل احترافي متميز ⭐ */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 my-auto overflow-hidden animate-fadeIn">
            
            {/* رأس النموذج */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingBank ? 'تعديل بيانات الحساب البنكي' : 'إضافة حساب بنكي جديد (Bank Account)'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    أدخل بيانات الحساب البنكي بدقة لربطه بالقيود والتحويلات وكشوف الحسابات والتسويات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-white text-2xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* جسم النموذج */}
            <form onSubmit={handleSaveBank} className="p-5 sm:p-6 space-y-5 bg-slate-50/50 max-h-[80vh] overflow-y-auto">
              
              {/* قسم 1: الاختيار السريع للبنك واسمه */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>بيانات البنك والفرع</span>
                  </span>
                  <span className="text-[11px] text-blue-600 font-bold">
                    اختيار سريع من البنوك الشائعة:
                  </span>
                </div>

                {/* شريط الاختيار السريع */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {POPULAR_BANKS.slice(0, 7).map(pb => (
                    <button
                      key={pb.name}
                      type="button"
                      onClick={() => {
                        setBankName(pb.name);
                        if (pb.swift && !bankSwift) setBankSwift(pb.swift);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition shrink-0 cursor-pointer"
                    >
                      {pb.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم البنك الرسمي *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      required
                      placeholder="مثال: البنك الأهلي المصري / بنك مصر / CIB"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الفرع أو المدينة</label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={e => setBankBranch(e.target.value)}
                      placeholder="مثال: الفرع الرئيسي / فرع التجمع / فرع المعادي"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* قسم 2: رقم الحساب والآيبان وكود السويفت */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>أرقام الحساب والآيبان الدولي والسويفت</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رقم الحساب البنكي / الآيبان (IBAN) *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      required
                      placeholder="EG... أو رقم الحساب البنكي"
                      className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كود السويفت (SWIFT / BIC Code - اختياري)</label>
                    <input
                      type="text"
                      value={bankSwift}
                      onChange={e => setBankSwift(e.target.value)}
                      placeholder="مثال: NBEGEGX..."
                      className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* قسم 3: الرصيد الافتتاحي والعملة والتفقيط */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>الرصيد الافتتاحي والعملة الرسمية</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد الافتتاحي للحساب البنكي</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bankBalance || ''}
                      onChange={e => setBankBalance(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-extrabold text-blue-950 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عملة الحساب البنكي *</label>
                    <select
                      value={bankCurrency}
                      onChange={e => setBankCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.label} ({c.code} - {c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* التفقيط التلقائي للرصيد */}
                <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                  <span className="text-blue-900 font-bold">✍️ الرصيد الافتتاحي كتابةً:</span>
                  <span className="font-bold text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                    {tafqeet(bankBalance || 0, bankCurrency || sysCurr)}
                  </span>
                </div>
              </div>

              {/* قسم 4: إعدادات متقدمة وأمان وسيولة (اختياري) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>الحد الأدنى للسيولة والغرض من الحساب (اختياري)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى للأمان (تنبيه السيولة)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bankMinBalance || ''}
                      onChange={e => setBankMinBalance(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الغرض من الحساب</label>
                    <select
                      value={bankPurpose}
                      onChange={e => setBankPurpose(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold"
                    >
                      <option value="general">حساب رئيسي عام</option>
                      <option value="collections">تحصيل مبيعات وعملاء</option>
                      <option value="payroll">مسيرات رواتب وأجور</option>
                      <option value="operations">مصروفات وتشغيل</option>
                      <option value="lc_guarantees">اعتمادات وخطابات ضمان</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">هاتف مسؤول الحساب بالبنك</label>
                    <input
                      type="text"
                      value={bankContactPhone}
                      onChange={e => setBankContactPhone(e.target.value)}
                      placeholder="010... / 050..."
                      className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={bankNotes}
                    onChange={e => setBankNotes(e.target.value)}
                    placeholder="أي تعليمات أو ملاحظات إضافية بخصوص هذا الحساب..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* أسفل النموذج */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBank ? 'تحديث بيانات الحساب البنكي' : 'حفظ واعتماد الحساب البنكي'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* نافذة تسجيل حركة بنكية مباشرة جديدة */}
      {showBankTxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  تسجيل حركة بنكية جديدة (إيداع / سحب / تحويل / رسوم)
                </h3>
              </div>
              <button onClick={() => setShowBankTxModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveBankTx} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الحساب البنكي *</label>
                <select
                  value={bankTxBankId}
                  onChange={e => setBankTxBankId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                >
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - رقم الحساب: {b.accountNumber} (الرصيد: {b.currentBalance.toLocaleString()} {b.currency || sysCurr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة البنكية *</label>
                  <select
                    value={bankTxType}
                    onChange={(e) => setBankTxType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="deposit">📥 إيداع نقدي / تحويل بنكي وارد (+)</option>
                    <option value="withdrawal">📤 سحب نقدي / تحويل صادر (-)</option>
                    <option value="transfer">🔄 تحويل بين الحسابات البنكية</option>
                    <option value="fee">🏷️ عمولات ومصروفات بنكية (-)</option>
                    <option value="interest">📈 فوائد وعوائد بنكية (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الحركة *</label>
                  <input
                    type="date"
                    value={bankTxDate}
                    onChange={(e) => setBankTxDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bankTxAmount || ''}
                    onChange={(e) => setBankTxAmount(Number(e.target.value))}
                    required
                    placeholder="0.00"
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-base font-extrabold text-blue-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الشيك / الحوالة / الإشعار</label>
                  <input
                    type="text"
                    value={bankTxCheckNum}
                    onChange={(e) => setBankTxCheckNum(e.target.value)}
                    placeholder="رقم الشيك أو الحوالة..."
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              {bankTxAmount > 0 && (
                <p className="text-[11px] font-bold text-blue-800">
                  ✍️ {tafqeet(bankTxAmount, sysCurr)}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الطرف المستفيد / العميل / المورد</label>
                <input
                  type="text"
                  value={bankTxParty}
                  onChange={(e) => setBankTxParty(e.target.value)}
                  placeholder="اسم الطرف ذو العلاقة بالحركة..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان والشرح *</label>
                <input
                  type="text"
                  value={bankTxDesc}
                  onChange={(e) => setBankTxDesc(e.target.value)}
                  required
                  placeholder="مثال: إيداع شيك تحصيل من العميل..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowBankTxModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow">حفظ الحركة البنكية</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة التسوية البنكية */}
      {showReconModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">إعداد تسوية بنكية (Bank Reconciliation)</h3>
              </div>
              <button onClick={() => setShowReconModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveRecon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر البنك *</label>
                <select
                  value={reconBankId}
                  onChange={e => setReconBankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                >
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} (الرصيد الدفتري: {b.currentBalance.toLocaleString()} {b.currency || sysCurr})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ كشف الحساب البنكي *</label>
                <input
                  type="date"
                  value={reconDate}
                  onChange={e => setReconDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد الفعلي في كشف حساب البنك ({sysCurr}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={statementBal || ''}
                  onChange={e => setStatementBal(Number(e.target.value))}
                  required
                  placeholder="0.00"
                  className="w-full font-mono bg-blue-50 border border-blue-300 rounded-xl p-2.5 font-extrabold text-blue-900 text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات ونتيجة المطابقة</label>
                <textarea
                  rows={2}
                  value={reconNotes}
                  onChange={e => setReconNotes(e.target.value)}
                  placeholder="مثال: تم مطابقة كافة الشيكات والإيداعات مع كشف البنك..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowReconModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow">اعتماد وحفظ التسوية</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة معاينة وطباعة كشف الحساب البنكي التفاعلي ⭐ */}
      {activeStatementBank && (
        <BankStatementModal
          bank={activeStatementBank}
          banks={banks}
          bankTxs={bankTxs}
          journalEntries={journalEntries}
          settings={settings}
          initialStartDate={startDate}
          initialEndDate={endDate}
          lang={lang}
          onClose={() => setActiveStatementBank(null)}
          onSelectBank={(b) => setActiveStatementBank(b)}
        />
      )}
    </div>
  );
};
