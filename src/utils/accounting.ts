import {
  Account,
  JournalEntry,
  CustomerSupplier,
  TreasuryTransaction,
  BankAccount,
  CostCenter,
  ExpenseItem
} from '../types';
import {
  getAccounts, saveAccounts,
  getCustomersSuppliers, saveCustomersSuppliers,
  getTreasuryTxs, saveTreasuryTxs,
  getBanks, saveBanks,
  getCostCenters, saveCostCenters,
  getExpenses, saveExpenses,
  getJournalEntries
} from './storage';

// إعادة احتساب ومطابقة كافة أرصدة الحسابات من القيود المرحّلة (Recalculate all account balances from posted journal entries)
export function recalculateAllAccountBalances(): {
  updatedAccountsCount: number;
  postedEntriesCount: number;
} {
  const accounts = getAccounts() || [];
  const banks = getBanks() || [];
  const customersSuppliers = getCustomersSuppliers() || [];
  const entries = getJournalEntries() || [];

  // تصفية القيود المرحّلة فقط (الأرصدة تعتمد على القيود المعتمدة والمرحّلة)
  const postedEntries = (entries || []).filter(e => e && e.isPosted !== false);

  // 1. إعادة حساب أرصدة دليل الحسابات
  (accounts || []).forEach(acc => {
    if (!acc) return;
    let initialBal = Number(acc.initialBalance) || 0;
    let netDebit = 0;
    let netCredit = 0;

    postedEntries.forEach(entry => {
      (entry.lines || []).forEach(line => {
        if (
          line.accountId === acc.id ||
          line.accountId === acc.code ||
          line.accountName === acc.name ||
          (acc.code && line.accountId && String(line.accountId).trim() === String(acc.code).trim())
        ) {
          netDebit += Number(line.debit) || 0;
          netCredit += Number(line.credit) || 0;
        }
      });
    });

    // في الأصول والمصروفات: المدين يزيد الرصيد، الدائن ينقصه
    if (acc.type === 'asset' || acc.type === 'expense') {
      acc.currentBalance = initialBal + (netDebit - netCredit);
    } else {
      // في الخصوم وحقوق الملكية والإيرادات: الدائن يزيد الرصيد، المدين ينقصه
      acc.currentBalance = initialBal + (netCredit - netDebit);
    }
  });

  // 2. إعادة حساب أرصدة البنوك
  (banks || []).forEach(bank => {
    if (!bank) return;
    let initialBal = Number(bank.initialBalance) || 0;
    let netDebit = 0;
    let netCredit = 0;

    const linkedAcc = accounts.find(a =>
      a && a.subType === 'bank' &&
      (a.name?.includes(bank.bankName) || bank.bankName?.includes(a.name) || a.id === bank.id || a.code === bank.id)
    );

    postedEntries.forEach(entry => {
      (entry.lines || []).forEach(line => {
        if (
          (linkedAcc && (line.accountId === linkedAcc.id || line.accountId === linkedAcc.code || line.accountName === linkedAcc.name)) ||
          (line.accountName && line.accountName.includes(bank.bankName)) ||
          (line.description && line.description.includes(bank.bankName))
        ) {
          netDebit += Number(line.debit) || 0;
          netCredit += Number(line.credit) || 0;
        }
      });
    });

    bank.currentBalance = initialBal + (netDebit - netCredit);
  });

  // 3. إعادة حساب أرصدة العملاء والموردين
  (customersSuppliers || []).forEach(cs => {
    if (!cs) return;
    let openingBal = Number(cs.openingBalance) || 0;
    let netDebit = 0;
    let netCredit = 0;

    postedEntries.forEach(entry => {
      const isReference = entry.referenceId === cs.id;
      (entry.lines || []).forEach(line => {
        if (
          isReference ||
          (line.accountName && line.accountName.includes(cs.name)) ||
          (line.description && line.description.includes(cs.name)) ||
          (cs.companyName && ((line.accountName && line.accountName.includes(cs.companyName)) || (line.description && line.description.includes(cs.companyName))))
        ) {
          netDebit += Number(line.debit) || 0;
          netCredit += Number(line.credit) || 0;
        }
      });
    });

    if (cs.type === 'customer') {
      cs.currentBalance = openingBal + (netDebit - netCredit);
    } else {
      cs.currentBalance = openingBal + (netCredit - netDebit);
    }
  });

  saveAccounts(accounts);
  saveBanks(banks);
  saveCustomersSuppliers(customersSuppliers);

  return {
    updatedAccountsCount: accounts.length,
    postedEntriesCount: postedEntries.length
  };
}

// 1. ترحيل القيد المحاسبي مباشرة إلى الحسابات والأرصدة الدفتريّة
export function postJournalEntryToAccounts(entry: JournalEntry): boolean {
  if (!entry || entry.isPosted === false) return false; // القيد مسودة وغير مرحل
  if (Math.abs((Number(entry.totalDebit) || 0) - (Number(entry.totalCredit) || 0)) > 0.01) {
    console.error('القيد غير متزن! لا يمكن الترحيل.');
    return false;
  }

  const accounts = getAccounts() || [];
  const treasuryTxs = getTreasuryTxs() || [];

  (entry.lines || []).forEach(line => {
    if (!line) return;
    // تحديث رصيد الخزينة وتوليد حركة خزينة إذا كان الحساب خزينة ولم يتم تسجيلها مسبقاً
    const accObj = accounts.find(a => a && (a.id === line.accountId || a.code === line.accountId || a.name === line.accountName));
    if (accObj && accObj.subType === 'cash') {
      const exists = treasuryTxs.some(t => t.description && t.description.includes(entry.entryNumber));
      if (!exists) {
        if (line.debit > 0) {
          // وارد للخزينة
          const newTx: TreasuryTransaction = {
            id: `trs_post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            transactionNumber: `TR-P-${Math.floor(Math.random() * 8999 + 1000)}`,
            date: entry.date,
            type: 'in',
            amount: line.debit,
            category: 'other',
            description: `ترحيل تلقائي من القيد ${entry.entryNumber}: ${entry.description}`,
            accountId: line.accountId,
            costCenterId: line.costCenterId,
            enteredBy: entry.createdBy || 'النظام التلقائي'
          };
          treasuryTxs.unshift(newTx);
        } else if (line.credit > 0) {
          // صادر من الخزينة
          const newTx: TreasuryTransaction = {
            id: `trs_post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            transactionNumber: `TR-P-${Math.floor(Math.random() * 8999 + 1000)}`,
            date: entry.date,
            type: 'out',
            amount: line.credit,
            category: 'expense',
            description: `ترحيل تلقائي من القيد ${entry.entryNumber}: ${entry.description}`,
            accountId: line.accountId,
            costCenterId: line.costCenterId,
            enteredBy: entry.createdBy || 'النظام التلقائي'
          };
          treasuryTxs.unshift(newTx);
        }
      }
    }
  });

  saveTreasuryTxs(treasuryTxs);

  // إعادة احتساب ومطابقة أرصدة كافة الحسابات (أصول، خصوم، إيرادات، مصروفات، بنوك، عملاء، موردين)
  recalculateAllAccountBalances();

  return true;
}

// 2. حساب ميزان المراجعة بالأرصدة والمجاميع
export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  initialDebit: number;
  initialCredit: number;
  movementDebit: number;
  movementCredit: number;
  endingDebit: number;
  endingCredit: number;
  // Aliases for compatibility
  totalDebit?: number;
  totalCredit?: number;
  balanceDebit?: number;
  balanceCredit?: number;
}

export function calculateTrialBalance(
  accounts: Account[] = [],
  entries: JournalEntry[] = [],
  startDate?: string,
  endDate?: string
): {
  rows: TrialBalanceRow[];
  totalInitialDebit: number;
  totalInitialCredit: number;
  totalMovementDebit: number;
  totalMovementCredit: number;
  totalEndingDebit: number;
  totalEndingCredit: number;
  totalDebitSum: number;
  totalCreditSum: number;
  balanceDebitSum: number;
  balanceCreditSum: number;
} {
  const rows: TrialBalanceRow[] = [];
  let totalInitialDebit = 0;
  let totalInitialCredit = 0;
  let totalMovementDebit = 0;
  let totalMovementCredit = 0;
  let totalEndingDebit = 0;
  let totalEndingCredit = 0;

  // تصفية القيود حسب التاريخ إن وُجد
  const filteredEntries = (entries || []).filter(e => {
    if (!e || e.isPosted === false) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  (accounts || []).forEach(acc => {
    if (!acc) return;
    // الرصيد الافتتاحي
    let initialDebit = 0;
    let initialCredit = 0;
    const initBal = Number(acc.initialBalance) || 0;
    if (initBal >= 0) {
      initialDebit = initBal;
    } else {
      initialCredit = Math.abs(initBal);
    }

    // حركة المدين والدائن من القيود المرحّلة
    let movementDebit = 0;
    let movementCredit = 0;
    filteredEntries.forEach(entry => {
      (entry.lines || []).forEach(line => {
        if (
          line.accountId === acc.id ||
          line.accountId === acc.code ||
          line.accountName === acc.name ||
          (acc.code && line.accountId && String(line.accountId).trim() === String(acc.code).trim())
        ) {
          movementDebit += Number(line.debit) || 0;
          movementCredit += Number(line.credit) || 0;
        }
      });
    });

    // الرصيد الختامي
    const netBalance = (initialDebit - initialCredit) + (movementDebit - movementCredit);
    let endingDebit = 0;
    let endingCredit = 0;
    if (netBalance >= 0) {
      endingDebit = netBalance;
    } else {
      endingCredit = Math.abs(netBalance);
    }

    rows.push({
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      initialDebit,
      initialCredit,
      movementDebit,
      movementCredit,
      endingDebit,
      endingCredit,
      totalDebit: movementDebit,
      totalCredit: movementCredit,
      balanceDebit: endingDebit,
      balanceCredit: endingCredit
    });

    totalInitialDebit += initialDebit;
    totalInitialCredit += initialCredit;
    totalMovementDebit += movementDebit;
    totalMovementCredit += movementCredit;
    totalEndingDebit += endingDebit;
    totalEndingCredit += endingCredit;
  });

  return {
    rows: rows.sort((a, b) => (a.code || '').localeCompare(b.code || '')),
    totalInitialDebit,
    totalInitialCredit,
    totalMovementDebit,
    totalMovementCredit,
    totalEndingDebit,
    totalEndingCredit,
    totalDebitSum: totalMovementDebit,
    totalCreditSum: totalMovementCredit,
    balanceDebitSum: totalEndingDebit,
    balanceCreditSum: totalEndingCredit
  };
}

// 3. قائمة الدخل (Profit & Loss / Income Statement)
export interface IncomeStatementReport {
  operatingRevenues: { name: string; amount: number }[];
  totalOperatingRevenues: number;
  otherRevenues: { name: string; amount: number }[];
  totalOtherRevenues: number;
  totalRevenues: number;

  operatingExpenses: { name: string; amount: number }[];
  totalOperatingExpenses: number;
  adminExpenses: { name: string; amount: number }[];
  totalAdminExpenses: number;
  marketingExpenses: { name: string; amount: number }[];
  totalMarketingExpenses: number;
  totalExpenses: number;

  grossProfit: number; // الإيرادات التشغيلية - التكاليف التشغيلية
  netProfit: number; // إجمالي الإيرادات - إجمالي المصروفات
}

export function calculateIncomeStatement(
  accounts: Account[] = [],
  entries?: JournalEntry[],
  startDate?: string,
  endDate?: string
): IncomeStatementReport {
  const operatingRevenues: { name: string; amount: number }[] = [];
  const otherRevenues: { name: string; amount: number }[] = [];
  const operatingExpenses: { name: string; amount: number }[] = [];
  const adminExpenses: { name: string; amount: number }[] = [];
  const marketingExpenses: { name: string; amount: number }[] = [];

  // إذا تم تمرير قيود وفترة زمنية، نحسب الحركات خلال الفترة بدقة
  if (entries && (startDate || endDate)) {
    const periodEntries = (entries || []).filter(e => {
      if (!e || e.isPosted === false) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });

    (accounts || []).forEach(acc => {
      if (!acc || (acc.type !== 'revenue' && acc.type !== 'expense')) return;

      let netMove = 0;
      periodEntries.forEach(entry => {
        (entry.lines || []).forEach(line => {
          if (
            line.accountId === acc.id ||
            line.accountId === acc.code ||
            line.accountName === acc.name ||
            (acc.code && line.accountId && String(line.accountId).trim() === String(acc.code).trim())
          ) {
            if (acc.type === 'revenue') {
              netMove += (Number(line.credit) || 0) - (Number(line.debit) || 0);
            } else {
              netMove += (Number(line.debit) || 0) - (Number(line.credit) || 0);
            }
          }
        });
      });

      const absBal = Math.max(0, netMove);
      if (absBal === 0) return;

      if (acc.type === 'revenue') {
        if (acc.subType === 'operating_revenue') {
          operatingRevenues.push({ name: acc.name, amount: absBal });
        } else {
          otherRevenues.push({ name: acc.name, amount: absBal });
        }
      } else if (acc.type === 'expense') {
        if (acc.subType === 'operating_expense') {
          operatingExpenses.push({ name: acc.name, amount: absBal });
        } else if (acc.subType === 'marketing_expense') {
          marketingExpenses.push({ name: acc.name, amount: absBal });
        } else {
          adminExpenses.push({ name: acc.name, amount: absBal });
        }
      }
    });
  } else {
    // الحساب العام التراكمي
    (accounts || []).forEach(acc => {
      if (!acc) return;
      const absBal = Math.abs(Number(acc.currentBalance) || 0);
      if (acc.type === 'revenue') {
        if (acc.subType === 'operating_revenue') {
          operatingRevenues.push({ name: acc.name, amount: absBal });
        } else {
          otherRevenues.push({ name: acc.name, amount: absBal });
        }
      } else if (acc.type === 'expense') {
        if (acc.subType === 'operating_expense') {
          operatingExpenses.push({ name: acc.name, amount: absBal });
        } else if (acc.subType === 'marketing_expense') {
          marketingExpenses.push({ name: acc.name, amount: absBal });
        } else {
          adminExpenses.push({ name: acc.name, amount: absBal });
        }
      }
    });
  }

  const totalOperatingRevenues = operatingRevenues.reduce((s, r) => s + r.amount, 0);
  const totalOtherRevenues = otherRevenues.reduce((s, r) => s + r.amount, 0);
  const totalRevenues = totalOperatingRevenues + totalOtherRevenues;

  const totalOperatingExpenses = operatingExpenses.reduce((s, r) => s + r.amount, 0);
  const totalAdminExpenses = adminExpenses.reduce((s, r) => s + r.amount, 0);
  const totalMarketingExpenses = marketingExpenses.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = totalOperatingExpenses + totalAdminExpenses + totalMarketingExpenses;

  const grossProfit = totalOperatingRevenues - totalOperatingExpenses;
  const netProfit = totalRevenues - totalExpenses;

  return {
    operatingRevenues, totalOperatingRevenues,
    otherRevenues, totalOtherRevenues, totalRevenues,
    operatingExpenses, totalOperatingExpenses,
    adminExpenses, totalAdminExpenses,
    marketingExpenses, totalMarketingExpenses, totalExpenses,
    grossProfit, netProfit
  };
}

// 4. الميزانية العمومية (Balance Sheet)
export interface BalanceSheetReport {
  currentAssets: { name: string; amount: number }[];
  totalCurrentAssets: number;
  fixedAssets: { name: string; amount: number }[];
  totalFixedAssets: number;
  totalAssets: number;

  currentLiabilities: { name: string; amount: number }[];
  totalCurrentLiabilities: number;
  longTermLiabilities: { name: string; amount: number }[];
  totalLongTermLiabilities: number;
  totalLiabilities: number;

  equityItems: { name: string; amount: number }[];
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export function calculateBalanceSheet(accounts: Account[] = [], netProfitFromIncome: number = 0): BalanceSheetReport {
  const currentAssets: { name: string; amount: number }[] = [];
  const fixedAssets: { name: string; amount: number }[] = [];
  const currentLiabilities: { name: string; amount: number }[] = [];
  const longTermLiabilities: { name: string; amount: number }[] = [];
  const equityItems: { name: string; amount: number }[] = [];

  (accounts || []).forEach(acc => {
    if (!acc) return;
    const val = Math.abs(Number(acc.currentBalance) || 0);
    if (acc.type === 'asset') {
      if (acc.subType === 'fixed_asset') {
        fixedAssets.push({ name: acc.name, amount: val });
      } else {
        currentAssets.push({ name: acc.name, amount: val });
      }
    } else if (acc.type === 'liability') {
      if (acc.subType === 'long_term_liability') {
        longTermLiabilities.push({ name: acc.name, amount: val });
      } else {
        currentLiabilities.push({ name: acc.name, amount: val });
      }
    } else if (acc.type === 'equity') {
      equityItems.push({ name: acc.name, amount: val });
    }
  });

  // إضافة صافي ربح الفترة الحالية إلى حقوق الملكية
  equityItems.push({ name: 'صافي أرباح (خسائر) الفترة الحالية', amount: netProfitFromIncome });

  const totalCurrentAssets = currentAssets.reduce((s, r) => s + r.amount, 0);
  const totalFixedAssets = fixedAssets.reduce((s, r) => s + r.amount, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce((s, r) => s + r.amount, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = equityItems.reduce((s, r) => s + r.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return {
    currentAssets, totalCurrentAssets,
    fixedAssets, totalFixedAssets, totalAssets,
    currentLiabilities, totalCurrentLiabilities,
    longTermLiabilities, totalLongTermLiabilities, totalLiabilities,
    equityItems, totalEquity, totalLiabilitiesAndEquity
  };
}

// 5. تقرير الضرائب المستحقة (VAT & Tax Report)
export interface TaxReport {
  outputVatRevenues: number; // ضريبة المبيعات المحصلة من الإيرادات والعملاء
  inputVatExpenses: number;  // ضريبة المشتريات المدفوعة على المصروفات والمواد
  netTaxPayable: number;     // صافي الضريبة المستحقة للدفع للزكاة والضريبة
  details: { date: string; reference: string; description: string; type: 'output' | 'input'; amount: number }[];
}

export function calculateTaxReport(
  entries: JournalEntry[] = [],
  expenses: ExpenseItem[] = [],
  startDate?: string,
  endDate?: string
): TaxReport {
  let outputVatRevenues = 0;
  let inputVatExpenses = 0;
  const details: { date: string; reference: string; description: string; type: 'output' | 'input'; amount: number }[] = [];

  // جمع ضريبة القيمة المضافة من القيود
  (entries || []).forEach(entry => {
    if (!entry || entry.isPosted === false) return;
    if (startDate && entry.date < startDate) return;
    if (endDate && entry.date > endDate) return;

    (entry.lines || []).forEach(line => {
      if (!line) return;
      if ((line.accountName && line.accountName.includes('ضريبة القيمة المضافة')) || (line.accountId && line.accountId.includes('2020'))) {
        if (line.credit > 0) {
          // دائن يعني ضريبة مبيعات محصلة
          outputVatRevenues += Number(line.credit) || 0;
          details.push({ date: entry.date, reference: entry.entryNumber, description: line.description || entry.description, type: 'output', amount: line.credit });
        } else if (line.debit > 0) {
          // مدين يعني ضريبة مشتريات مدفوعة
          inputVatExpenses += Number(line.debit) || 0;
          details.push({ date: entry.date, reference: entry.entryNumber, description: line.description || entry.description, type: 'input', amount: line.debit });
        }
      }
    });
  });

  // جمع ضريبة القيمة المضافة من المصروفات المسجلة
  (expenses || []).forEach(exp => {
    if (!exp) return;
    if (startDate && exp.date < startDate) return;
    if (endDate && exp.date > endDate) return;

    if (exp.taxAmount > 0) {
      inputVatExpenses += Number(exp.taxAmount) || 0;
      details.push({ date: exp.date, reference: exp.receiptNumber || 'مصروف مباشر', description: exp.description, type: 'input', amount: exp.taxAmount });
    }
  });

  return {
    outputVatRevenues,
    inputVatExpenses,
    netTaxPayable: outputVatRevenues - inputVatExpenses,
    details: details.sort((a, b) => b.date.localeCompare(a.date))
  };
}

// 6. الشيت المجمع لحركات النقدية والبنك (Combined Cash & Bank Sheet with detailed columns)
export interface CombinedCashBankRow {
  id: string;
  date: string;
  reference: string;
  description: string;
  treasuryIn: number;
  treasuryOut: number;
  bankIn: number;
  bankOut: number;
  expenseAmount: number;
  revenueAmount: number;
  custodyAdvanceAmount: number;
  partyName: string;
  costCenterName?: string;
}

export function getCombinedCashBankSheet(): {
  rows: CombinedCashBankRow[];
  totals: {
    treasuryIn: number; treasuryOut: number; treasuryNet: number;
    bankIn: number; bankOut: number; bankNet: number;
    totalExpenses: number; totalRevenues: number; totalCustodyAdvances: number;
  }
} {
  const rows: CombinedCashBankRow[] = [];
  const treasuryTxs = getTreasuryTxs() || [];
  const banks = getBanks() || [];
  const costCenters = getCostCenters() || [];
  const expenses = getExpenses() || [];

  // 1. إدراج حركات الخزينة
  (treasuryTxs || []).forEach(tx => {
    if (!tx) return;
    const cc = (costCenters || []).find(c => c && c.id === tx.costCenterId);
    rows.push({
      id: tx.id,
      date: tx.date,
      reference: tx.transactionNumber,
      description: tx.description,
      treasuryIn: tx.type === 'in' ? (Number(tx.amount) || 0) : 0,
      treasuryOut: tx.type === 'out' ? (Number(tx.amount) || 0) : 0,
      bankIn: 0,
      bankOut: 0,
      expenseAmount: tx.category === 'expense' ? (Number(tx.amount) || 0) : 0,
      revenueAmount: tx.category === 'revenue' || tx.category === 'customer_payment' ? (Number(tx.amount) || 0) : 0,
      custodyAdvanceAmount: tx.category === 'custody' || tx.category === 'advance' ? (Number(tx.amount) || 0) : 0,
      partyName: tx.relatedParty || 'عام',
      costCenterName: cc ? cc.name : undefined
    });
  });

  // 2. إدراج فواتير المصروفات المدفوعة بنكياً أو نقداً
  (expenses || []).forEach(exp => {
    if (!exp) return;
    const isAlreadyInTreasury = (treasuryTxs || []).some(t => t && (t.description?.includes(exp.description) || t.amount === exp.totalWithTax));
    if (!isAlreadyInTreasury) {
      rows.push({
        id: exp.id,
        date: exp.date,
        reference: exp.receiptNumber || 'EXP-REC',
        description: `${exp.category}: ${exp.description}`,
        treasuryIn: 0,
        treasuryOut: exp.paymentMethod === 'cash' ? (Number(exp.totalWithTax) || 0) : 0,
        bankIn: 0,
        bankOut: exp.paymentMethod === 'bank' ? (Number(exp.totalWithTax) || 0) : 0,
        expenseAmount: Number(exp.totalWithTax) || 0,
        revenueAmount: 0,
        custodyAdvanceAmount: exp.paymentMethod === 'custody' ? (Number(exp.totalWithTax) || 0) : 0,
        partyName: exp.payee,
        costCenterName: exp.costCenterName
      });
    }
  });

  // 3. إدراج الحركات البنكية (افتراضية أو من البنوك)
  (banks || []).forEach(b => {
    // رصيد البنك كحركة أو إجمالي
  });

  // حساب المجاميع
  const totals = rows.reduce((acc, row) => ({
    treasuryIn: acc.treasuryIn + row.treasuryIn,
    treasuryOut: acc.treasuryOut + row.treasuryOut,
    treasuryNet: (acc.treasuryIn + row.treasuryIn) - (acc.treasuryOut + row.treasuryOut),
    bankIn: acc.bankIn + row.bankIn,
    bankOut: acc.bankOut + row.bankOut,
    bankNet: (acc.bankIn + row.bankIn) - (acc.bankOut + row.bankOut),
    totalExpenses: acc.totalExpenses + row.expenseAmount,
    totalRevenues: acc.totalRevenues + row.revenueAmount,
    totalCustodyAdvances: acc.totalCustodyAdvances + row.custodyAdvanceAmount
  }), {
    treasuryIn: 0, treasuryOut: 0, treasuryNet: 0,
    bankIn: 0, bankOut: 0, bankNet: 0,
    totalExpenses: 0, totalRevenues: 0, totalCustodyAdvances: 0
  });

  return {
    rows: rows.sort((a, b) => b.date.localeCompare(a.date)),
    totals
  };
}

// 7. قائمة التدفقات النقدية (Cash Flow Statement - IAS 7 / GAAP)
export interface CashFlowStatementReport {
  operatingActivities: {
    netIncome: number;
    depreciation: number;
    changeInReceivables: number;
    changeInInventory: number;
    changeInPayables: number;
    changeInOtherWorkingCapital: number;
    netOperatingCash: number;
  };
  investingActivities: {
    purchaseOfFixedAssets: number;
    saleOfFixedAssets: number;
    otherInvesting: number;
    netInvestingCash: number;
  };
  financingActivities: {
    capitalContributions: number;
    loansAndFinancing: number;
    dividendsAndDrawings: number;
    netFinancingCash: number;
  };
  summary: {
    netChangeInCash: number;
    beginningCash: number;
    endingCash: number;
  };
}

export function calculateCashFlowStatement(
  accounts: Account[] = [],
  entries: JournalEntry[] = [],
  startDate?: string,
  endDate?: string
): CashFlowStatementReport {
  const inc = calculateIncomeStatement(accounts, entries, startDate, endDate);
  const netIncome = inc.netProfit;

  // فحص حركات القيود خلال الفترة
  const periodEntries = (entries || []).filter(e => {
    if (!e || e.isPosted === false) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  let depreciation = 0;
  let purchaseOfFixedAssets = 0;
  let saleOfFixedAssets = 0;
  let changeInReceivables = 0;
  let changeInPayables = 0;
  let changeInInventory = 0;
  let changeInOtherWorkingCapital = 0;
  let capitalContributions = 0;
  let dividendsAndDrawings = 0;
  let loansAndFinancing = 0;

  periodEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
      const name = line.accountName || '';
      const deb = Number(line.debit) || 0;
      const cred = Number(line.credit) || 0;

      if (name.includes('إهلاك') || name.includes('استهلاك') || name.includes('مجمع إهلاك')) {
        depreciation += deb;
      } else if (name.includes('أصول ثابتة') || name.includes('سيارات') || name.includes('معدات') || name.includes('أجهزة')) {
        purchaseOfFixedAssets += deb;
        saleOfFixedAssets += cred;
      } else if (name.includes('عملاء') || name.includes('ذمم مدينة') || name.includes('مستخلصات')) {
        changeInReceivables += (deb - cred); // زيادة في المدينين تعتبر تدفق نقدي خارج
      } else if (name.includes('موردين') || name.includes('ذمم دائنة') || name.includes('أوراق دفع')) {
        changeInPayables += (cred - deb); // زيادة في الدائنين تعتبر تدفق نقدي داخل
      } else if (name.includes('مخزون') || name.includes('بضاعة')) {
        changeInInventory += (deb - cred);
      } else if (name.includes('رأس المال')) {
        capitalContributions += (cred - deb);
      } else if (name.includes('مسحوبات') || name.includes('توزيعات')) {
        dividendsAndDrawings += (deb - cred);
      } else if (name.includes('قروض') || name.includes('تمويل')) {
        loansAndFinancing += (cred - deb);
      }
    });
  });

  // إذا لم توجد حركات مفصلة للبنود غير النقدية، نأخذ تقديرات أرصدة دليل الحسابات
  if (purchaseOfFixedAssets === 0) {
    const fixedAssetsAccs = (accounts || []).filter(a => a && a.subType === 'fixed_asset');
    purchaseOfFixedAssets = fixedAssetsAccs.reduce((sum, a) => sum + Math.max(0, (Number(a.currentBalance) || 0) - (Number(a.initialBalance) || 0)), 0);
  }

  const netOperatingCash = netIncome + depreciation - changeInReceivables - changeInInventory + changeInPayables + changeInOtherWorkingCapital;
  const netInvestingCash = saleOfFixedAssets - purchaseOfFixedAssets;
  const netFinancingCash = capitalContributions + loansAndFinancing - dividendsAndDrawings;

  // حساب النقدية وما في حكمها (خزينة + بنوك)
  const cashAccounts = (accounts || []).filter(a =>
    a && (
      a.subType === 'cash' ||
      a.subType === 'bank' ||
      (a.code && (a.code.startsWith('101') || a.code.startsWith('102'))) ||
      (a.name && (a.name.includes('صندوق') || a.name.includes('خزينة') || a.name.includes('بنك')))
    )
  );

  const beginningCash = cashAccounts.reduce((sum, a) => sum + (Number(a.initialBalance) || 0), 0);
  const endingCash = cashAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const netChangeInCash = endingCash - beginningCash;

  return {
    operatingActivities: {
      netIncome,
      depreciation,
      changeInReceivables,
      changeInInventory,
      changeInPayables,
      changeInOtherWorkingCapital,
      netOperatingCash
    },
    investingActivities: {
      purchaseOfFixedAssets,
      saleOfFixedAssets,
      otherInvesting: 0,
      netInvestingCash
    },
    financingActivities: {
      capitalContributions,
      loansAndFinancing,
      dividendsAndDrawings,
      netFinancingCash
    },
    summary: {
      netChangeInCash,
      beginningCash,
      endingCash
    }
  };
}

// 8. قائمة التغير في حقوق الملكية (Statement of Changes in Equity)
export interface ChangesInEquityReport {
  capital: { opening: number; additions: number; closing: number };
  retainedEarnings: { opening: number; netIncome: number; distributions: number; closing: number };
  reserves: { opening: number; additions: number; closing: number };
  drawings: { total: number };
  totalEquityBeginning: number;
  totalEquityEnding: number;
  netChange: number;
}

export function calculateChangesInEquity(
  accounts: Account[] = [],
  entries: JournalEntry[] = [],
  startDate?: string,
  endDate?: string
): ChangesInEquityReport {
  const inc = calculateIncomeStatement(accounts, entries, startDate, endDate);
  const netIncome = inc.netProfit;

  const capitalAccs = (accounts || []).filter(a => a && a.type === 'equity' && (a.name?.includes('رأس المال') || a.code?.startsWith('301')));
  const retainedAccs = (accounts || []).filter(a => a && a.type === 'equity' && (a.name?.includes('أرباح مبقاة') || a.name?.includes('أرباح مرحلة') || a.code?.startsWith('303')));
  const reservesAccs = (accounts || []).filter(a => a && a.type === 'equity' && (a.name?.includes('احتياطي') || a.code?.startsWith('302')));
  const drawingsAccs = (accounts || []).filter(a => a && (a.name?.includes('مسحوبات') || a.name?.includes('جاري الشركاء') || a.code?.startsWith('304')));

  const capOpening = capitalAccs.reduce((s, a) => s + (Number(a.initialBalance) || 0), 0);
  const capClosing = capitalAccs.reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);
  const capAdditions = capClosing - capOpening;

  const retOpening = retainedAccs.reduce((s, a) => s + (Number(a.initialBalance) || 0), 0);
  const drawingsTotal = drawingsAccs.reduce((s, a) => s + Math.abs(Number(a.currentBalance) || 0), 0);
  const retClosing = retOpening + netIncome - drawingsTotal;

  const resOpening = reservesAccs.reduce((s, a) => s + (Number(a.initialBalance) || 0), 0);
  const resClosing = reservesAccs.reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);
  const resAdditions = resClosing - resOpening;

  const totalEquityBeginning = capOpening + retOpening + resOpening;
  const totalEquityEnding = capClosing + retClosing + resClosing;
  const netChange = totalEquityEnding - totalEquityBeginning;

  return {
    capital: { opening: capOpening, additions: capAdditions, closing: capClosing },
    retainedEarnings: { opening: retOpening, netIncome, distributions: drawingsTotal, closing: retClosing },
    reserves: { opening: resOpening, additions: resAdditions, closing: resClosing },
    drawings: { total: drawingsTotal },
    totalEquityBeginning,
    totalEquityEnding,
    netChange
  };
}
