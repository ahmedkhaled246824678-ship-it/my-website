import React, { useState, useMemo } from 'react';
import {
  Scale,
  FileText,
  PieChart,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Share2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Building,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { Account, JournalEntry, ExpenseItem, CompanySettings, CustomerSupplier, Employee, BankAccount, UserAccount } from '../../types';
import {
  calculateTrialBalance,
  calculateIncomeStatement,
  calculateBalanceSheet,
  calculateTaxReport,
  calculateCashFlowStatement,
  calculateChangesInEquity
} from '../../utils/accounting';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { formatWhatsAppReport } from '../../utils/whatsappPrinter';
import { ShareReportModal } from '../common/ShareReportModal';
import { Language } from '../../utils/i18n';

interface FinancialStatementsDashboardSectionProps {
  accounts: Account[];
  entries: JournalEntry[];
  expenses?: ExpenseItem[];
  settings?: CompanySettings;
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  users?: UserAccount[];
  onNavigate?: (module: string) => void;
  lang?: Language;
}

export const FinancialStatementsDashboardSection: React.FC<FinancialStatementsDashboardSectionProps> = ({
  accounts,
  entries,
  expenses = [],
  settings,
  customersSuppliers,
  employees,
  banks,
  users,
  onNavigate,
  lang = 'ar'
}) => {
  const [activeTab, setActiveTab] = useState<'balance_sheet' | 'income_statement' | 'cash_flow' | 'equity_changes' | 'trial_balance' | 'vat_report'>('balance_sheet');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Share Modal State
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    text: string;
  }>({
    isOpen: false,
    title: '',
    text: ''
  });

  const curr = settings?.currency || 'ر.س';

  // Calculate All Statements with Memoization
  const trialBalance = useMemo(() => {
    return calculateTrialBalance(accounts, entries, startDate || undefined, endDate || undefined);
  }, [accounts, entries, startDate, endDate]);

  const incomeStatement = useMemo(() => {
    return calculateIncomeStatement(accounts, entries, startDate || undefined, endDate || undefined);
  }, [accounts, entries, startDate, endDate]);

  const balanceSheet = useMemo(() => {
    return calculateBalanceSheet(accounts, incomeStatement.netProfit);
  }, [accounts, incomeStatement.netProfit]);

  const cashFlow = useMemo(() => {
    return calculateCashFlowStatement(accounts, entries, startDate || undefined, endDate || undefined);
  }, [accounts, entries, startDate, endDate]);

  const equityChanges = useMemo(() => {
    return calculateChangesInEquity(accounts, entries, startDate || undefined, endDate || undefined);
  }, [accounts, entries, startDate, endDate]);

  const taxReport = useMemo(() => {
    return calculateTaxReport(entries, expenses, startDate || undefined, endDate || undefined);
  }, [entries, expenses, startDate, endDate]);

  // Export to Excel according to active tab
  const handleExportExcel = () => {
    if (activeTab === 'balance_sheet') {
      const data = [
        ...balanceSheet.currentAssets.map(a => ({ 'البيان': a.name, 'النوع': 'أصول متداولة', 'القيمة': a.amount })),
        { 'البيان': 'إجمالي الأصول المتداولة', 'النوع': 'أصول متداولة', 'القيمة': balanceSheet.totalCurrentAssets },
        ...balanceSheet.fixedAssets.map(a => ({ 'البيان': a.name, 'النوع': 'أصول ثابتة', 'القيمة': a.amount })),
        { 'البيان': 'إجمالي الأصول الثابتة', 'النوع': 'أصول ثابتة', 'القيمة': balanceSheet.totalFixedAssets },
        { 'البيان': 'إجمالي الأصول', 'النوع': 'الأصول', 'القيمة': balanceSheet.totalAssets },
        ...balanceSheet.currentLiabilities.map(l => ({ 'البيان': l.name, 'النوع': 'خصوم متداولة', 'القيمة': l.amount })),
        ...balanceSheet.longTermLiabilities.map(l => ({ 'البيان': l.name, 'النوع': 'خصوم طويلة الأجل', 'القيمة': l.amount })),
        { 'البيان': 'إجمالي الالتزامات', 'النوع': 'الخصوم', 'القيمة': balanceSheet.totalLiabilities },
        ...balanceSheet.equityItems.map(e => ({ 'البيان': e.name, 'النوع': 'حقوق الملكية', 'القيمة': e.amount })),
        { 'البيان': 'إجمالي حقوق الملكية', 'النوع': 'حقوق الملكية', 'القيمة': balanceSheet.totalEquity },
        { 'البيان': 'إجمالي الخصوم وحقوق الملكية', 'النوع': 'المجموع', 'القيمة': balanceSheet.totalLiabilitiesAndEquity }
      ];
      exportToExcel(data, `قائمة_المركز_المالي_${new Date().toISOString().slice(0, 10)}`);
    } else if (activeTab === 'income_statement') {
      const data = [
        ...incomeStatement.operatingRevenues.map(r => ({ 'البند': r.name, 'النوع': 'إيرادات تشغيلية', 'المبلغ': r.amount })),
        { 'البند': 'إجمالي الإيرادات التشغيلية', 'النوع': 'إيرادات', 'المبلغ': incomeStatement.totalOperatingRevenues },
        ...incomeStatement.operatingExpenses.map(e => ({ 'البند': e.name, 'النوع': 'تكاليف تشغيلية', 'المبلغ': e.amount })),
        { 'البند': 'مجمل الربح (الخسارة)', 'النوع': 'مجمل الربح', 'المبلغ': incomeStatement.grossProfit },
        ...incomeStatement.adminExpenses.map(e => ({ 'البند': e.name, 'النوع': 'مصروفات إدارية وعمومية', 'المبلغ': e.amount })),
        ...incomeStatement.marketingExpenses.map(e => ({ 'البند': e.name, 'النوع': 'مصروفات تسويق', 'المبلغ': e.amount })),
        { 'البند': 'إجمالي المصروفات', 'النوع': 'مصروفات', 'المبلغ': incomeStatement.totalExpenses },
        { 'البند': 'صافي الربح (الخسارة) النهائي', 'النوع': 'صافي الربح', 'المبلغ': incomeStatement.netProfit }
      ];
      exportToExcel(data, `قائمة_الدخل_والأرباح_والخسائر_${new Date().toISOString().slice(0, 10)}`);
    } else if (activeTab === 'cash_flow') {
      const data = [
        { 'النشاط': 'أنشطة تشغيلية', 'البند': 'صافي الربح المحاسبي للفترة', 'المبلغ': cashFlow.operatingActivities.netIncome },
        { 'النشاط': 'أنشطة تشغيلية', 'البند': '+ إهلاك واستهلاك الأصول', 'المبلغ': cashFlow.operatingActivities.depreciation },
        { 'النشاط': 'أنشطة تشغيلية', 'البند': 'صافي التدفق النقدي التشغيلي', 'المبلغ': cashFlow.operatingActivities.netOperatingCash },
        { 'النشاط': 'أنشطة استثمارية', 'البند': 'شراء وإضافات أصول ثابتة', 'المبلغ': -cashFlow.investingActivities.purchaseOfFixedAssets },
        { 'النشاط': 'أنشطة استثمارية', 'البند': 'صافي التدفق النقدي الاستثماري', 'المبلغ': cashFlow.investingActivities.netInvestingCash },
        { 'النشاط': 'أنشطة تمويلية', 'البند': 'الزيادة في رأس المال والتمويل', 'المبلغ': cashFlow.financingActivities.capitalContributions + cashFlow.financingActivities.loansAndFinancing },
        { 'النشاط': 'أنشطة تمويلية', 'البند': 'مسحوبات وتوزيعات الأرباح', 'المبلغ': -cashFlow.financingActivities.dividendsAndDrawings },
        { 'النشاط': 'أنشطة تمويلية', 'البند': 'صافي التدفق النقدي التمويلي', 'المبلغ': cashFlow.financingActivities.netFinancingCash },
        { 'النشاط': 'الخلاصة', 'البند': 'رصيد النقدية في بداية الفترة', 'المبلغ': cashFlow.summary.beginningCash },
        { 'النشاط': 'الخلاصة', 'البند': 'صافي التغير في النقدية', 'المبلغ': cashFlow.summary.netChangeInCash },
        { 'النشاط': 'الخلاصة', 'البند': 'رصيد النقدية في نهاية الفترة', 'المبلغ': cashFlow.summary.endingCash }
      ];
      exportToExcel(data, `قائمة_التدفقات_النقدية_${new Date().toISOString().slice(0, 10)}`);
    } else if (activeTab === 'equity_changes') {
      const data = [
        { 'البند': 'رأس المال في بداية الفترة', 'المبلغ': equityChanges.capital.opening },
        { 'البند': '+ إضافات وزيادات رأس المال', 'المبلغ': equityChanges.capital.additions },
        { 'البند': 'رأس المال في نهاية الفترة', 'المبلغ': equityChanges.capital.closing },
        { 'البند': 'الأرباح المبقاة في بداية الفترة', 'المبلغ': equityChanges.retainedEarnings.opening },
        { 'البند': '+ صافي أرباح (خسائر) الفترة', 'المبلغ': equityChanges.retainedEarnings.netIncome },
        { 'البند': '- مسحوبات وتوزيعات الشركاء', 'المبلغ': equityChanges.drawings.total },
        { 'البند': 'الأرباح المبقاة في نهاية الفترة', 'المبلغ': equityChanges.retainedEarnings.closing },
        { 'البند': 'الاحتياطيات في نهاية الفترة', 'المبلغ': equityChanges.reserves.closing },
        { 'البند': 'إجمالي حقوق الملكية في بداية الفترة', 'المبلغ': equityChanges.totalEquityBeginning },
        { 'البند': 'إجمالي حقوق الملكية في نهاية الفترة', 'المبلغ': equityChanges.totalEquityEnding }
      ];
      exportToExcel(data, `قائمة_التغير_في_حقوق_الملكية_${new Date().toISOString().slice(0, 10)}`);
    } else if (activeTab === 'trial_balance') {
      const data = trialBalance.rows.map((r, i) => ({
        'م': i + 1,
        'رمز الحساب': r.code,
        'اسم الحساب': r.name,
        'نوع الحساب': r.type,
        'مجموع المدين': r.totalDebit,
        'مجموع الدائن': r.totalCredit,
        'رصيد مدين': r.balanceDebit,
        'رصيد دائن': r.balanceCredit
      }));
      exportToExcel(data, `ميزان_المراجعة_${new Date().toISOString().slice(0, 10)}`);
    } else {
      exportToExcel(taxReport.details, `إقرار_الضريبة_المضافة_${new Date().toISOString().slice(0, 10)}`);
    }
  };

  // Print PDF Handler
  const handlePrintPDF = () => {
    if (activeTab === 'balance_sheet') {
      printReportAsPDF({
        title: 'قائمة المركز المالي (الميزانية العمومية)',
        subtitle: `كما في تاريخ ${endDate || new Date().toISOString().slice(0, 10)}`,
        headers: ['البند المحاسبي', 'البيان والتصنيف', 'القيمة'],
        rows: [
          ...balanceSheet.currentAssets.map(a => [a.name, 'أصول متداولة', `${a.amount.toLocaleString()} ${curr}`]),
          ...balanceSheet.fixedAssets.map(a => [a.name, 'أصول ثابتة', `${a.amount.toLocaleString()} ${curr}`]),
          ...balanceSheet.currentLiabilities.map(l => [l.name, 'خصوم متداولة', `${l.amount.toLocaleString()} ${curr}`]),
          ...balanceSheet.longTermLiabilities.map(l => [l.name, 'خصوم طويلة الأجل', `${l.amount.toLocaleString()} ${curr}`]),
          ...balanceSheet.equityItems.map(e => [e.name, 'حقوق الملكية والأرباح', `${e.amount.toLocaleString()} ${curr}`])
        ],
        totals: [
          { label: 'إجمالي الأصول', value: `${balanceSheet.totalAssets.toLocaleString()} ${curr}` },
          { label: 'إجمالي الخصوم', value: `${balanceSheet.totalLiabilities.toLocaleString()} ${curr}` },
          { label: 'إجمالي حقوق الملكية', value: `${balanceSheet.totalEquity.toLocaleString()} ${curr}` },
          { label: 'إجمالي الخصوم وحقوق الملكية', value: `${balanceSheet.totalLiabilitiesAndEquity.toLocaleString()} ${curr}` }
        ],
        companyName: settings?.companyName,
        taxNumber: settings?.taxNumber
      });
    } else if (activeTab === 'income_statement') {
      printReportAsPDF({
        title: 'قائمة الدخل الشامل (الأرباح والخسائر)',
        subtitle: `عن الفترة من ${startDate || 'البداية'} إلى ${endDate || 'اليوم'}`,
        headers: ['البند', 'التصنيف', 'المبلغ'],
        rows: [
          ...incomeStatement.operatingRevenues.map(r => [r.name, 'إيرادات تشغيلية', `${r.amount.toLocaleString()} ${curr}`]),
          ...incomeStatement.operatingExpenses.map(e => [e.name, 'تكاليف النشاط', `${e.amount.toLocaleString()} ${curr}`]),
          ...incomeStatement.adminExpenses.map(e => [e.name, 'مصاريف إدارية وعمومية', `${e.amount.toLocaleString()} ${curr}`]),
          ...incomeStatement.marketingExpenses.map(e => [e.name, 'مصاريف تسويقية', `${e.amount.toLocaleString()} ${curr}`])
        ],
        totals: [
          { label: 'إجمالي الإيرادات', value: `${incomeStatement.totalRevenues.toLocaleString()} ${curr}` },
          { label: 'مجمل الربح', value: `${incomeStatement.grossProfit.toLocaleString()} ${curr}` },
          { label: 'إجمالي المصروفات', value: `${incomeStatement.totalExpenses.toLocaleString()} ${curr}` },
          { label: 'صافي الربح / الخسارة', value: `${incomeStatement.netProfit.toLocaleString()} ${curr}` }
        ],
        companyName: settings?.companyName,
        taxNumber: settings?.taxNumber
      });
    } else if (activeTab === 'cash_flow') {
      printReportAsPDF({
        title: 'قائمة التدفقات النقدية (Cash Flow Statement)',
        subtitle: `عن الفترة من ${startDate || 'البداية'} إلى ${endDate || 'اليوم'}`,
        headers: ['الأنشطة والبنود', 'التفاصيل', 'المبلغ'],
        rows: [
          ['صافي الربح المحاسبي', 'أنشطة تشغيلية', `${cashFlow.operatingActivities.netIncome.toLocaleString()} ${curr}`],
          ['+ مجمع واستهلاك الأصول', 'أنشطة تشغيلية', `${cashFlow.operatingActivities.depreciation.toLocaleString()} ${curr}`],
          ['صافي التدفق التشغيلي', 'أنشطة تشغيلية', `${cashFlow.operatingActivities.netOperatingCash.toLocaleString()} ${curr}`],
          ['شراء أصول ثابتة (CapEx)', 'أنشطة استثمارية', `${(-cashFlow.investingActivities.purchaseOfFixedAssets).toLocaleString()} ${curr}`],
          ['صافي التدفق الاستثماري', 'أنشطة استثمارية', `${cashFlow.investingActivities.netInvestingCash.toLocaleString()} ${curr}`],
          ['زيادات رأس المال والتمويل', 'أنشطة تمويلية', `${(cashFlow.financingActivities.capitalContributions + cashFlow.financingActivities.loansAndFinancing).toLocaleString()} ${curr}`],
          ['مسحوبات وتوزيعات الشركاء', 'أنشطة تمويلية', `${(-cashFlow.financingActivities.dividendsAndDrawings).toLocaleString()} ${curr}`],
          ['صافي التدفق التمويلي', 'أنشطة تمويلية', `${cashFlow.financingActivities.netFinancingCash.toLocaleString()} ${curr}`]
        ],
        totals: [
          { label: 'رصيد النقدية في بداية الفترة', value: `${cashFlow.summary.beginningCash.toLocaleString()} ${curr}` },
          { label: 'صافي التغير في النقدية', value: `${cashFlow.summary.netChangeInCash.toLocaleString()} ${curr}` },
          { label: 'رصيد النقدية في نهاية الفترة', value: `${cashFlow.summary.endingCash.toLocaleString()} ${curr}` }
        ],
        companyName: settings?.companyName,
        taxNumber: settings?.taxNumber
      });
    } else if (activeTab === 'equity_changes') {
      printReportAsPDF({
        title: 'قائمة التغير في حقوق الملكية',
        subtitle: `عن الفترة من ${startDate || 'البداية'} إلى ${endDate || 'اليوم'}`,
        headers: ['البند المحاسبي لحقوق الملكية', 'المبلغ'],
        rows: [
          ['رأس المال في بداية الفترة', `${equityChanges.capital.opening.toLocaleString()} ${curr}`],
          ['+ إضافات وزيادات رأس المال', `${equityChanges.capital.additions.toLocaleString()} ${curr}`],
          ['رأس المال في نهاية الفترة', `${equityChanges.capital.closing.toLocaleString()} ${curr}`],
          ['الأرباح المبقاة في بداية الفترة', `${equityChanges.retainedEarnings.opening.toLocaleString()} ${curr}`],
          ['+ صافي أرباح (خسائر) الفترة الحالية', `${equityChanges.retainedEarnings.netIncome.toLocaleString()} ${curr}`],
          ['- مسحوبات الشركاء والتوزيعات', `${equityChanges.drawings.total.toLocaleString()} ${curr}`],
          ['الأرباح المبقاة في نهاية الفترة', `${equityChanges.retainedEarnings.closing.toLocaleString()} ${curr}`],
          ['الاحتياطيات في نهاية الفترة', `${equityChanges.reserves.closing.toLocaleString()} ${curr}`]
        ],
        totals: [
          { label: 'إجمالي حقوق الملكية في بداية الفترة', value: `${equityChanges.totalEquityBeginning.toLocaleString()} ${curr}` },
          { label: 'صافي التغير في حقوق الملكية', value: `${equityChanges.netChange.toLocaleString()} ${curr}` },
          { label: 'إجمالي حقوق الملكية في نهاية الفترة', value: `${equityChanges.totalEquityEnding.toLocaleString()} ${curr}` }
        ],
        companyName: settings?.companyName,
        taxNumber: settings?.taxNumber
      });
    } else {
      printReportAsPDF({
        title: 'ميزان المراجعة الشامل بالمجاميع والأرصدة',
        subtitle: `الفترة من ${startDate || 'البداية'} إلى ${endDate || 'اليوم'}`,
        headers: ['الرمز', 'اسم الحساب', 'مجموع مدين', 'مجموع دائن', 'رصيد مدين', 'رصيد دائن'],
        rows: trialBalance.rows.map(r => [
          r.code,
          r.name,
          r.totalDebit.toLocaleString(),
          r.totalCredit.toLocaleString(),
          r.balanceDebit.toLocaleString(),
          r.balanceCredit.toLocaleString()
        ]),
        totals: [
          { label: 'إجمالي المجاميع المدينة', value: `${trialBalance.totalDebitSum.toLocaleString()} ${curr}` },
          { label: 'إجمالي المجاميع الدائنة', value: `${trialBalance.totalCreditSum.toLocaleString()} ${curr}` },
          { label: 'إجمالي الأرصدة المدينة', value: `${trialBalance.balanceDebitSum.toLocaleString()} ${curr}` },
          { label: 'إجمالي الأرصدة الدائنة', value: `${trialBalance.balanceCreditSum.toLocaleString()} ${curr}` }
        ],
        companyName: settings?.companyName,
        taxNumber: settings?.taxNumber
      });
    }
  };

  // WhatsApp Share Handler
  const handleOpenShareWhatsApp = () => {
    let title = '';
    let totals: { label: string; value: string | number }[] = [];
    let items: string[] = [];

    if (activeTab === 'balance_sheet') {
      title = 'قائمة المركز المالي (الميزانية العمومية)';
      totals = [
        { label: 'إجمالي الأصول', value: balanceSheet.totalAssets },
        { label: 'إجمالي الخصوم', value: balanceSheet.totalLiabilities },
        { label: 'إجمالي حقوق الملكية', value: balanceSheet.totalEquity },
        { label: 'الخصوم وحقوق الملكية', value: balanceSheet.totalLiabilitiesAndEquity }
      ];
      items = [
        `الأصول المتداولة: ${balanceSheet.totalCurrentAssets.toLocaleString()} ${curr}`,
        `الأصول الثابتة: ${balanceSheet.totalFixedAssets.toLocaleString()} ${curr}`,
        `الخصوم المتداولة: ${balanceSheet.totalCurrentLiabilities.toLocaleString()} ${curr}`,
        `حقوق الملكية: ${balanceSheet.totalEquity.toLocaleString()} ${curr}`
      ];
    } else if (activeTab === 'income_statement') {
      title = 'قائمة الدخل الشامل (الأرباح والخسائر)';
      totals = [
        { label: 'إجمالي الإيرادات', value: incomeStatement.totalRevenues },
        { label: 'إجمالي المصروفات', value: incomeStatement.totalExpenses },
        { label: 'صافي الربح / الخسارة', value: incomeStatement.netProfit }
      ];
      items = [
        `إيرادات النشاط التشغيلي: ${incomeStatement.totalOperatingRevenues.toLocaleString()} ${curr}`,
        `تكاليف النشاط المباشرة: ${incomeStatement.totalOperatingExpenses.toLocaleString()} ${curr}`,
        `مجمل الربح التشغيلي: ${incomeStatement.grossProfit.toLocaleString()} ${curr}`,
        `مصروفات إدارية وتسويقية: ${(incomeStatement.totalAdminExpenses + incomeStatement.totalMarketingExpenses).toLocaleString()} ${curr}`
      ];
    } else if (activeTab === 'cash_flow') {
      title = 'قائمة التدفقات النقدية (Cash Flow)';
      totals = [
        { label: 'رصيد أول المدة', value: cashFlow.summary.beginningCash },
        { label: 'صافي التغير النقدي', value: cashFlow.summary.netChangeInCash },
        { label: 'رصيد آخر المدة', value: cashFlow.summary.endingCash }
      ];
      items = [
        `تدفقات الأنشطة التشغيلية: ${cashFlow.operatingActivities.netOperatingCash.toLocaleString()} ${curr}`,
        `تدفقات الأنشطة الاستثمارية: ${cashFlow.investingActivities.netInvestingCash.toLocaleString()} ${curr}`,
        `تدفقات الأنشطة التمويلية: ${cashFlow.financingActivities.netFinancingCash.toLocaleString()} ${curr}`
      ];
    } else if (activeTab === 'equity_changes') {
      title = 'قائمة التغير في حقوق الملكية';
      totals = [
        { label: 'حقوق الملكية أول المدة', value: equityChanges.totalEquityBeginning },
        { label: 'صافي التغير في الفترة', value: equityChanges.netChange },
        { label: 'حقوق الملكية نهاية المدة', value: equityChanges.totalEquityEnding }
      ];
      items = [
        `رأس المال: ${equityChanges.capital.closing.toLocaleString()} ${curr}`,
        `الأرباح المبقاة والمرحلة: ${equityChanges.retainedEarnings.closing.toLocaleString()} ${curr}`,
        `صافي ربح الفترة: ${equityChanges.retainedEarnings.netIncome.toLocaleString()} ${curr}`,
        `مسحوبات الشركاء: ${equityChanges.drawings.total.toLocaleString()} ${curr}`
      ];
    } else {
      title = 'ميزان المراجعة الشامل';
      totals = [
        { label: 'مجموع المدين', value: trialBalance.totalDebitSum },
        { label: 'مجموع الدائن', value: trialBalance.totalCreditSum },
        { label: 'حالة الاتزان', value: trialBalance.isBalanced ? 'متزن 100%' : 'يوجد فارق' }
      ];
      items = [
        `إجمالي الأرصدة المدينة: ${trialBalance.balanceDebitSum.toLocaleString()} ${curr}`,
        `إجمالي الأرصدة الدائنة: ${trialBalance.balanceCreditSum.toLocaleString()} ${curr}`
      ];
    }

    const text = formatWhatsAppReport({
      title,
      period: startDate && endDate ? `من ${startDate} إلى ${endDate}` : 'كامل الفترة المالية',
      currency: curr,
      items,
      totals,
      notes: `تم توليد القائمة المالية واعتمادها آلياً عبر نظام الرؤية المحاسبي الشامل.`
    });

    setShareModalData({
      isOpen: true,
      title: `مشاركة ${title}`,
      text
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>القوائم المالية الختامية الشاملة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-800">
                  جميع القوائم الـ 6
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                المركز المالي (الميزانية)، قائمة الدخل، التدفقات النقدية، التغير في حقوق الملكية، ميزان المراجعة، والضريبة.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('financial_reports')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>شاشة التقارير الكاملة</span>
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
            onClick={handleOpenShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة بالواتساب</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar for All 6 Financial Statements */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: 'balance_sheet', label: 'المركز المالي (الميزانية)', icon: PieChart, color: 'emerald' },
          { id: 'income_statement', label: 'قائمة الدخل والأرباح', icon: FileText, color: 'blue' },
          { id: 'cash_flow', label: 'التدفقات النقدية (IAS 7)', icon: Activity, color: 'cyan' },
          { id: 'equity_changes', label: 'التغير في حقوق الملكية', icon: TrendingUp, color: 'purple' },
          { id: 'trial_balance', label: 'ميزان المراجعة الشامل', icon: Layers, color: 'amber' },
          { id: 'vat_report', label: 'إقرار الضريبة (VAT)', icon: Receipt, color: 'rose' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-lg'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>تصفية فترة القائمة المالية:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="من تاريخ"
          />
          <span className="text-xs text-slate-400">إلى</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="إلى تاريخ"
          />

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800/40"
            >
              مسح التصفية
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: BALANCE SHEET (المركز المالي) ================= */}
      {activeTab === 'balance_sheet' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Balance Check Indicator */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndEquity) < 1
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs font-black">
                  معادلة الميزانية: الأصول ({balanceSheet.totalAssets.toLocaleString()} {curr}) = الخصوم وحقوق الملكية ({balanceSheet.totalLiabilitiesAndEquity.toLocaleString()} {curr})
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  القائمة متزنة ومطابقة لمعايير المحاسبة العامة
                </div>
              </div>
            </div>
            <div className="text-xs font-black font-mono px-3 py-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border">
              فارق الميزانية: {Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndEquity).toFixed(2)} {curr}
            </div>
          </div>

          {/* 2 Main Columns: Assets vs Liabilities & Equity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Right: Assets */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4" />
                  <span>الأصول (الموجودات)</span>
                </h3>
                <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-300">
                  {balanceSheet.totalAssets.toLocaleString()} {curr}
                </span>
              </div>

              {/* Current Assets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-emerald-100/60 dark:bg-emerald-950/60 p-2 rounded-xl">
                  <span>الأصول المتداولة (النقدية، البنوك، العملاء، المخزون)</span>
                  <span className="font-mono">{balanceSheet.totalCurrentAssets.toLocaleString()} {curr}</span>
                </div>
                <div className="space-y-1 pr-2">
                  {balanceSheet.currentAssets.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold">{item.amount.toLocaleString()} {curr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-teal-100/60 dark:bg-teal-950/60 p-2 rounded-xl">
                  <span>الأصول غير المتداولة / الثابتة</span>
                  <span className="font-mono">{balanceSheet.totalFixedAssets.toLocaleString()} {curr}</span>
                </div>
                <div className="space-y-1 pr-2">
                  {balanceSheet.fixedAssets.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold">{item.amount.toLocaleString()} {curr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Left: Liabilities & Equity */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="text-sm font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4" />
                  <span>الالتزامات وحقوق الملكية</span>
                </h3>
                <span className="text-xs font-black font-mono text-rose-800 dark:text-rose-300">
                  {balanceSheet.totalLiabilitiesAndEquity.toLocaleString()} {curr}
                </span>
              </div>

              {/* Current Liabilities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-rose-100/60 dark:bg-rose-950/60 p-2 rounded-xl">
                  <span>الالتزامات والخصوم المتداولة (الموردين، المستحقات، الضريبة)</span>
                  <span className="font-mono">{balanceSheet.totalCurrentLiabilities.toLocaleString()} {curr}</span>
                </div>
                <div className="space-y-1 pr-2">
                  {balanceSheet.currentLiabilities.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold">{item.amount.toLocaleString()} {curr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-purple-100/60 dark:bg-purple-950/60 p-2 rounded-xl">
                  <span>حقوق الملكية وصافي أرباح الفترة</span>
                  <span className="font-mono">{balanceSheet.totalEquity.toLocaleString()} {curr}</span>
                </div>
                <div className="space-y-1 pr-2">
                  {balanceSheet.equityItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>{item.name}</span>
                      <span className={`font-mono font-bold ${item.amount < 0 ? 'text-rose-600' : 'text-purple-600 dark:text-purple-400'}`}>
                        {item.amount.toLocaleString()} {curr}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: INCOME STATEMENT (قائمة الدخل) ================= */}
      {activeTab === 'income_statement' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">إجمالي الإيرادات</div>
              <div className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-1" dir="ltr">
                {incomeStatement.totalRevenues.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400">مجمل الربح التشغيلي</div>
              <div className="text-base sm:text-lg font-black text-blue-800 dark:text-blue-300 font-mono mt-1" dir="ltr">
                {incomeStatement.grossProfit.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">إجمالي المصروفات</div>
              <div className="text-base sm:text-lg font-black text-rose-800 dark:text-rose-300 font-mono mt-1" dir="ltr">
                {incomeStatement.totalExpenses.toLocaleString()} {curr}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              incomeStatement.netProfit >= 0
                ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800'
            }`}>
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">صافي الربح / الخسارة</div>
              <div className={`text-base sm:text-lg font-black font-mono mt-1 ${
                incomeStatement.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`} dir="ltr">
                {incomeStatement.netProfit.toLocaleString()} {curr}
              </div>
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenues */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                1. بنود الإيرادات
              </h4>
              {incomeStatement.operatingRevenues.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">لا توجد إيرادات مسجلة للفترة</div>
              ) : (
                incomeStatement.operatingRevenues.map((r, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                    <span>{r.name}</span>
                    <span className="font-mono font-bold text-emerald-600">{r.amount.toLocaleString()} {curr}</span>
                  </div>
                ))
              )}
            </div>

            {/* Expenses */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                2. المصروفات والتكاليف
              </h4>
              {[...incomeStatement.operatingExpenses, ...incomeStatement.adminExpenses, ...incomeStatement.marketingExpenses].map((e, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>{e.name}</span>
                  <span className="font-mono font-bold text-rose-600">{e.amount.toLocaleString()} {curr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CASH FLOW STATEMENT (قائمة التدفقات النقدية) ================= */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-500">رصيد النقدية في بداية الفترة</div>
              <div className="text-base sm:text-lg font-black font-mono mt-1 text-slate-800 dark:text-slate-100" dir="ltr">
                {cashFlow.summary.beginningCash.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400">صافي التغير في النقدية</div>
              <div className="text-base sm:text-lg font-black font-mono mt-1 text-blue-800 dark:text-blue-300" dir="ltr">
                {cashFlow.summary.netChangeInCash.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">رصيد النقدية في نهاية الفترة</div>
              <div className="text-base sm:text-lg font-black font-mono mt-1 text-emerald-800 dark:text-emerald-300" dir="ltr">
                {cashFlow.summary.endingCash.toLocaleString()} {curr}
              </div>
            </div>
          </div>

          {/* 3 Activities Breakdown */}
          <div className="space-y-3">
            {/* Operating */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span>1. التدفقات النقدية من الأنشطة التشغيلية (Operating Cash Flows)</span>
                <span className="font-mono">{cashFlow.operatingActivities.netOperatingCash.toLocaleString()} {curr}</span>
              </div>
              <div className="space-y-1.5 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>صافي الربح للفترة</span>
                  <span className="font-mono font-bold">{cashFlow.operatingActivities.netIncome.toLocaleString()} {curr}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ تسوية إهلاك واستهلاك الأصول</span>
                  <span className="font-mono font-bold text-emerald-600">{cashFlow.operatingActivities.depreciation.toLocaleString()} {curr}</span>
                </div>
                <div className="flex justify-between">
                  <span>التغير في رأس المال العامل والذمم</span>
                  <span className="font-mono font-bold">{cashFlow.operatingActivities.changeInPayables - cashFlow.operatingActivities.changeInReceivables} {curr}</span>
                </div>
              </div>
            </div>

            {/* Investing */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span>2. التدفقات النقدية من الأنشطة الاستثمارية (Investing Cash Flows)</span>
                <span className="font-mono">{cashFlow.investingActivities.netInvestingCash.toLocaleString()} {curr}</span>
              </div>
              <div className="space-y-1.5 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>شراء وتحديث الأصول الثابتة والمعدات</span>
                  <span className="font-mono font-bold text-rose-600">{(-cashFlow.investingActivities.purchaseOfFixedAssets).toLocaleString()} {curr}</span>
                </div>
                <div className="flex justify-between">
                  <span>مبيعات الأصول الثابتة</span>
                  <span className="font-mono font-bold text-emerald-600">{cashFlow.investingActivities.saleOfFixedAssets.toLocaleString()} {curr}</span>
                </div>
              </div>
            </div>

            {/* Financing */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-purple-700 dark:text-purple-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span>3. التدفقات النقدية من الأنشطة التمويلية (Financing Cash Flows)</span>
                <span className="font-mono">{cashFlow.financingActivities.netFinancingCash.toLocaleString()} {curr}</span>
              </div>
              <div className="space-y-1.5 pt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>زيادات رأس المال والتمويلات الخارجية</span>
                  <span className="font-mono font-bold text-emerald-600">{cashFlow.financingActivities.capitalContributions.toLocaleString()} {curr}</span>
                </div>
                <div className="flex justify-between">
                  <span>مسحوبات الشركاء والتوزيعات</span>
                  <span className="font-mono font-bold text-rose-600">{(-cashFlow.financingActivities.dividendsAndDrawings).toLocaleString()} {curr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CHANGES IN EQUITY (التغير في حقوق الملكية) ================= */}
      {activeTab === 'equity_changes' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">بند حقوق الملكية</th>
                  <th className="p-3 text-left">رصيد أول المدة</th>
                  <th className="p-3 text-left">التغيرات والإضافات</th>
                  <th className="p-3 text-left">المسحوبات / التوزيعات</th>
                  <th className="p-3 text-left font-black">رصيد آخر المدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="p-3 font-bold">1. رأس المال المدفوع</td>
                  <td className="p-3 text-left font-mono">{equityChanges.capital.opening.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono text-emerald-600">+{equityChanges.capital.additions.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono">-</td>
                  <td className="p-3 text-left font-mono font-bold">{equityChanges.capital.closing.toLocaleString()} {curr}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">2. الأرباح المبقاة والمرحلة</td>
                  <td className="p-3 text-left font-mono">{equityChanges.retainedEarnings.opening.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono text-emerald-600">+{equityChanges.retainedEarnings.netIncome.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono text-rose-600">-{equityChanges.drawings.total.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono font-bold">{equityChanges.retainedEarnings.closing.toLocaleString()} {curr}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">3. الاحتياطيات النظامية</td>
                  <td className="p-3 text-left font-mono">{equityChanges.reserves.opening.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono text-emerald-600">+{equityChanges.reserves.additions.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono">-</td>
                  <td className="p-3 text-left font-mono font-bold">{equityChanges.reserves.closing.toLocaleString()} {curr}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td className="p-3">إجمالي حقوق الملكية:</td>
                  <td className="p-3 text-left font-mono">{equityChanges.totalEquityBeginning.toLocaleString()} {curr}</td>
                  <td colSpan={2} className="p-3 text-center font-mono text-emerald-600">صافي التغير: {equityChanges.netChange.toLocaleString()} {curr}</td>
                  <td className="p-3 text-left font-mono text-sm text-emerald-600 dark:text-emerald-400">{equityChanges.totalEquityEnding.toLocaleString()} {curr}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: TRIAL BALANCE (ميزان المراجعة) ================= */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">رمز الحساب</th>
                  <th className="p-3">اسم الحساب</th>
                  <th className="p-3 text-left text-emerald-700 dark:text-emerald-400">مجموع المدين</th>
                  <th className="p-3 text-left text-rose-700 dark:text-rose-400">مجموع الدائن</th>
                  <th className="p-3 text-left text-blue-700 dark:text-blue-400">رصيد مدين</th>
                  <th className="p-3 text-left text-purple-700 dark:text-purple-400">رصيد دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {trialBalance.rows.slice(0, 12).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold">{r.code}</td>
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3 text-left font-mono">{r.totalDebit.toLocaleString()}</td>
                    <td className="p-3 text-left font-mono">{r.totalCredit.toLocaleString()}</td>
                    <td className="p-3 text-left font-mono font-bold text-blue-600">{r.balanceDebit > 0 ? r.balanceDebit.toLocaleString() : '-'}</td>
                    <td className="p-3 text-left font-mono font-bold text-purple-600">{r.balanceCredit > 0 ? r.balanceCredit.toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="p-3">المجموع الكلي:</td>
                  <td className="p-3 text-left font-mono">{trialBalance.totalDebitSum.toLocaleString()}</td>
                  <td className="p-3 text-left font-mono">{trialBalance.totalCreditSum.toLocaleString()}</td>
                  <td className="p-3 text-left font-mono text-blue-700">{trialBalance.balanceDebitSum.toLocaleString()}</td>
                  <td className="p-3 text-left font-mono text-purple-700">{trialBalance.balanceCreditSum.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: VAT REPORT (إقرار الضريبة) ================= */}
      {activeTab === 'vat_report' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">ضريبة المبيعات والمستخلصات (المحصلة)</div>
              <div className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-1" dir="ltr">
                {taxReport.outputVatRevenues.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">ضريبة المشتريات والمصروفات (المدفوعة)</div>
              <div className="text-base sm:text-lg font-black text-rose-800 dark:text-rose-300 font-mono mt-1" dir="ltr">
                {taxReport.inputVatExpenses.toLocaleString()} {curr}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400">صافي الضريبة المستحقة لهيئة الزكاة</div>
              <div className="text-base sm:text-lg font-black text-blue-800 dark:text-blue-300 font-mono mt-1" dir="ltr">
                {taxReport.netTaxPayable.toLocaleString()} {curr}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Report Modal */}
      {shareModalData.isOpen && (
        <ShareReportModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData({ ...shareModalData, isOpen: false })}
          title={shareModalData.title}
          subtitle={shareModalData.subtitle}
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
