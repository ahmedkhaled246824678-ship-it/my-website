import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Users,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Printer,
  Sparkles,
  HardHat,
  Briefcase,
  CreditCard,
  Receipt,
  Scale,
  PlusCircle,
  Package,
  ArrowRightLeft,
  History,
  FileText,
  Share2,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileCheck2,
  Landmark,
  Bell,
  AlertOctagon,
  Settings,
  ExternalLink,
  Phone,
  BookOpen,
  PieChart as PieChartIcon,
  SlidersHorizontal,
  TableProperties,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Account,
  JournalEntry,
  CostCenter,
  ExpenseItem,
  CustomSheet,
  BankAccount,
  CustomerSupplier,
  Custody,
  EmployeeAdvance,
  SiteSettlement,
  BankReconciliation,
  InventoryItem,
  AccrualAdjustment,
  CompanySettings,
  SystemAlert,
  Employee,
  UserAccount
} from '../../types';
import { calculateIncomeStatement } from '../../utils/accounting';
import { getSystemCurrency } from '../../utils/currency';
import { ExportButtons } from '../common/ExportButtons';
import { Language, t } from '../../utils/i18n';
import { formatWhatsAppReport, sendWhatsAppMessage } from '../../utils/whatsappPrinter';
import { generateSystemAlerts, sendAlertViaWhatsApp } from '../../utils/alertSystem';
import { PeriodicAdjustmentsSection } from './PeriodicAdjustmentsSection';
import { GeneralLedgerDashboardSection } from './GeneralLedgerDashboardSection';
import { FinancialStatementsDashboardSection } from './FinancialStatementsDashboardSection';
import { AccountLedgerModal } from './AccountLedgerModal';
import { NotificationCenterModal } from '../common/NotificationCenterModal';
import { WhatsAppRecipientSelector } from '../common/WhatsAppRecipientSelector';
import { WhatsAppContact } from '../../utils/whatsappContacts';
import { customAlert } from '../../utils/dialog';

interface DashboardProps {
  accounts: Account[];
  onSaveAccounts?: (accounts: Account[]) => void;
  entries: JournalEntry[];
  onSaveJournalEntries?: (entries: JournalEntry[]) => void;
  costCenters: CostCenter[];
  expenses: ExpenseItem[];
  banks?: BankAccount[];
  customersSuppliers?: CustomerSupplier[];
  custodies?: Custody[];
  advances?: EmployeeAdvance[];
  siteSettlements?: SiteSettlement[];
  bankReconciliations?: BankReconciliation[];
  inventory?: InventoryItem[];
  adjustments?: AccrualAdjustment[];
  onSaveAdjustments?: (adjustments: AccrualAdjustment[]) => void;
  settings?: CompanySettings;
  onSaveSettings?: (settings: CompanySettings) => void;
  onNavigate: (module: string) => void;
  lang?: Language;
  customSheets?: CustomSheet[];
  employees?: Employee[];
  users?: UserAccount[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'شركة الرؤية المتكاملة للتجارة والمقاولات',
  taxNumber: '300458921000003',
  commercialRegister: '1010543210',
  address: 'الرياض - حي العليا',
  phone: '011-4567890',
  email: 'info@roeya-erp.com',
  currency: 'ر.س',
  fiscalYearStart: '2026-01-01',
  fiscalYearEnd: '2026-12-31',
  defaultTaxRate: 15
};

export const Dashboard: React.FC<DashboardProps> = ({
  accounts = [],
  onSaveAccounts = () => {},
  entries = [],
  onSaveJournalEntries = () => {},
  costCenters = [],
  expenses = [],
  banks = [],
  customersSuppliers = [],
  custodies = [],
  advances = [],
  siteSettlements = [],
  bankReconciliations = [],
  inventory = [],
  adjustments = [],
  onSaveAdjustments = () => {},
  settings = DEFAULT_COMPANY_SETTINGS,
  onSaveSettings = () => {},
  onNavigate,
  lang = 'ar',
  customSheets = [],
  employees = [],
  users = []
}) => {
  const sysCurr = getSystemCurrency();
  const incomeStmt = calculateIncomeStatement(accounts || []);
  const [dashboardTab, setDashboardTab] = useState<'all' | 'kpis' | 'ledger' | 'financial_statements' | 'adjustments' | 'sheets'>('all');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(settings?.phone || '966501234567');
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // حساب الحساب المحدد لفتح كشف الحساب المنبثق
  const [modalAccount, setModalAccount] = useState<Account | null>(null);

  // حساب التنبيهات اللحظية للنظام
  const systemAlerts = generateSystemAlerts({
    banks: banks || [],
    customersSuppliers: customersSuppliers || [],
    custodies: custodies || [],
    advances: advances || [],
    siteSettlements: siteSettlements || [],
    inventory: inventory || [],
    accrualAdjustments: adjustments || [],
    settings: settings || DEFAULT_COMPANY_SETTINGS
  }) || [];

  const criticalAlerts = (systemAlerts || []).filter(a => a && a.severity === 'critical');

  // إجمالي السيولة النقدية والبنكية
  const cashAccounts = (accounts || []).filter(a => a && (a.subType === 'cash' || a.subType === 'bank'));
  const totalLiquidity = cashAccounts.reduce((sum, a) => sum + Math.abs(Number(a.currentBalance) || 0), 0);

  // إجمالي أرصدة العملاء والموردين
  const customerAccounts = (accounts || []).filter(a => a && a.subType === 'customer');
  const totalReceivables = customerAccounts.reduce((sum, a) => sum + Math.abs(Number(a.currentBalance) || 0), 0);

  const supplierAccounts = (accounts || []).filter(a => a && a.subType === 'supplier');
  const totalPayables = supplierAccounts.reduce((sum, a) => sum + Math.abs(Number(a.currentBalance) || 0), 0);

  // بيانات الرسم البياني للمصروفات حسب التصنيف
  const expenseByCategory: Record<string, number> = {};
  (expenses || []).forEach(e => {
    if (!e) return;
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (Number(e.totalWithTax) || 0);
  });
  const expensePieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  // بيانات مقارنة الإيرادات والمصروفات الشهرية
  const monthlyData: Record<string, { month: string; revenue: number; expense: number }> = {
    '01': { month: lang === 'en' ? 'Jan' : 'يناير', revenue: 120000, expense: 80000 },
    '02': { month: lang === 'en' ? 'Feb' : 'فبراير', revenue: 150000, expense: 95000 },
    '03': { month: lang === 'en' ? 'Mar' : 'مارس', revenue: 180000, expense: 110000 },
    '04': { month: lang === 'en' ? 'Apr' : 'أبريل', revenue: 140000, expense: 105000 },
    '05': { month: lang === 'en' ? 'May' : 'مايو', revenue: 210000, expense: 130000 },
    '06': { month: lang === 'en' ? 'Jun' : 'يونيو', revenue: 250000, expense: 160000 },
    '07': { month: lang === 'en' ? 'Jul' : 'يوليو', revenue: 160000, expense: 90000 }
  };
  const barChartData = Object.values(monthlyData);

  // إعداد بيانات التصدير
  const exportData = [
    { البند: 'إجمالي السيولة (خزينة + بنوك)', المبلغ: totalLiquidity, العملة: sysCurr },
    { البند: 'إجمالي الإيرادات المحققة', المبلغ: incomeStmt.totalRevenues, العملة: sysCurr },
    { البند: 'إجمالي المصروفات العمومية والتشغيلية', المبلغ: incomeStmt.totalExpenses, العملة: sysCurr },
    { البند: 'صافي الربح (الخسارة) العام', المبلغ: incomeStmt.netProfit, العملة: sysCurr },
    { البند: 'أرصدة العملاء (مدينون)', المبلغ: totalReceivables, العملة: sysCurr },
    { البند: 'أرصدة الموردين (دائنون)', المبلغ: totalPayables, العملة: sysCurr }
  ];

  const handleSendWhatsAppKPIs = () => {
    const phone = whatsappPhone.replace(/[^0-9]/g, '');
    const items = [
      `1) إجمالي السيولة المتاحة: ${totalLiquidity.toLocaleString()} ${sysCurr}`,
      `2) إجمالي الإيرادات: ${incomeStmt.totalRevenues.toLocaleString()} ${sysCurr}`,
      `3) إجمالي المصروفات: ${incomeStmt.totalExpenses.toLocaleString()} ${sysCurr}`,
      `4) صافي الأرباح: ${incomeStmt.netProfit.toLocaleString()} ${sysCurr}`,
      `5) أرصدة العملاء (الذمم المدينة): ${totalReceivables.toLocaleString()} ${sysCurr}`,
      `6) أرصدة الموردين (الذمم الدائنة): ${totalPayables.toLocaleString()} ${sysCurr}`
    ];

    let greeting = '';
    if (selectedContact) {
      greeting = `👤 *عناية الأستاذ/ة:* ${selectedContact.name} (${selectedContact.categoryName || ''})\n`;
    }

    const report = `${greeting}${formatWhatsAppReport({
      title: '📊 *كشف المؤشرات المالية والتشغيلية اليومية*',
      entityName: 'المركز المالي العام',
      entityCode: 'KPI-FIN-01',
      date: new Date().toISOString().slice(0, 10),
      currency: sysCurr,
      items,
      notes: 'تم توليد هذا التقرير تلقائياً من نظام الرؤية المحاسبي وهو جاهز للطباعة والاعتماد.'
    })}`;

    sendWhatsAppMessage(phone, report);
    setShowWhatsAppModal(false);
    customAlert(`تم تجهيز وإرسال كشف المؤشرات للمستلم بنجاح!`, 'success');
  };

  const handleQuickSendWhatsAppAlert = (alert: SystemAlert) => {
    sendAlertViaWhatsApp(alert, settings, settings.notificationSettings?.managerPhone || settings.phone);
    customAlert('تم فتح تطبيق الواتساب لإرسال رسالة التنبيه العاجلة بنجاح!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* لافتة وشريط التنبيهات الآلية الذكية (Bank Balances & Payment Alerts Banner) */}
      {/* ========================================================================= */}
      {systemAlerts.length > 0 && (
        <div
          className={`p-4 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition animate-fadeIn ${
            criticalAlerts.length > 0
              ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/60 border-red-500/50'
              : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border-amber-500/40'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl border ${
                criticalAlerts.length > 0
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}
            >
              <Bell className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <span>
                    {criticalAlerts.length > 0
                      ? '⚠️ تنبيه مالي عاجل: هبوط في أرصدة الحسابات أو استحقاقات ملزمة'
                      : '🔔 تنبيهات الاستحقاق والمتابعة الدورية'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
                    {systemAlerts.length} تنبيه
                  </span>
                </h3>
              </div>

              <p className="text-xs text-slate-300 mt-1">
                {criticalAlerts.length > 0
                  ? criticalAlerts[0].title + ': ' + criticalAlerts[0].message
                  : systemAlerts[0].title + ': ' + systemAlerts[0].message}
              </p>

              {/* شرائط سريعة لأهم 2 تنبيهات */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {systemAlerts.slice(0, 2).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px]"
                  >
                    <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`}></span>
                    <span className="font-semibold text-slate-200">{alert.title}</span>
                    <button
                      onClick={() => handleQuickSendWhatsAppAlert(alert)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold mr-1"
                      title="إرسال التنبيه فوراً للمدير بالواتساب"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>واتساب</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>عرض جميع التنبيهات ({systemAlerts.length})</span>
            </button>

            <button
              onClick={() => onNavigate('treasury_banks')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="الانتقال إلى وحدة الخزينة والبنوك"
            >
              <span>البنوك</span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>
        </div>
      )}

      {/* رأس الصفحة مع أزرار الإجراءات والشيتات */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <span className="text-white">{t('dashboard', lang)}</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2 py-0.5 rounded-full">
              ERP v3.5 Pro
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'en'
              ? 'General Ledger, 6 Financial Statements, Independent Periodic Adjustments, Interactive Excel Sheets'
              : 'دفتر الأستاذ العام المباشر، القوائم المالية الست، التسويات الجردية لكل بند، وشيتات الإكسيل التفاعلية'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* زر فتح مركز الإشعارات والحدود */}
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition shadow"
            title="إعدادات حدود التنبيه والواتساب"
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>التنبيهات والحدود</span>
            {systemAlerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
            )}
          </button>

          {/* زر إضافة شيت في الرئيسية */}
          <button
            onClick={() => onNavigate('custom_sheets')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/40 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('add_sheet', lang)} ✨</span>
          </button>

          {/* زر إرسال الملخص بالواتساب */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition shadow"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('whatsapp_share', lang)}</span>
          </button>

          <ExportButtons
            title="تقرير المؤشرات المالية التنفيذية العام"
            subtitle="ملخص الأداء المالي والسيولة وموقف المشاريع"
            data={exportData}
            fileName="dashboard_kpis"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* شريط تبويبات التنقل المباشر بين أقسام الرئيسية المدمجة */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setDashboardTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            dashboardTab === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>عرض الكل متتابعاً (All In One)</span>
        </button>

        <button
          onClick={() => setDashboardTab('kpis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            dashboardTab === 'kpis'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          <span>المؤشرات والرسوم البيانية</span>
        </button>

        <button
          onClick={() => setDashboardTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            dashboardTab === 'ledger'
              ? 'bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-900/40'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📖 دفتر الأستاذ العام في الرئيسية</span>
        </button>

        <button
          onClick={() => setDashboardTab('financial_statements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            dashboardTab === 'financial_statements'
              ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-900/40'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>⚖️ جميع القوائم المالية الـ 6</span>
        </button>

        <button
          onClick={() => setDashboardTab('adjustments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            dashboardTab === 'adjustments'
              ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-900/40'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>📑 التسويات الجردية لكل بند</span>
        </button>

        <button
          onClick={() => setDashboardTab('sheets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            dashboardTab === 'sheets'
              ? 'bg-teal-600 text-white font-black shadow-lg shadow-teal-900/40'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📈 شيتات الإكسيل والنماذج</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. قسم دفتر الأستاذ العام في الرئيسية */}
      {/* ========================================================================= */}
      {(dashboardTab === 'all' || dashboardTab === 'ledger') && (
        <div id="general-ledger-section" className="animate-fadeIn">
          <GeneralLedgerDashboardSection
            accounts={accounts}
            journalEntries={entries}
            costCenters={costCenters}
            settings={settings}
            currentUser={users[0]}
            customersSuppliers={customersSuppliers}
            employees={employees}
            banks={banks}
            users={users}
            onOpenFullLedgerModal={(acc) => setModalAccount(acc)}
            lang={lang}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. قسم جميع القوائم المالية الستة في الرئيسية */}
      {/* ========================================================================= */}
      {(dashboardTab === 'all' || dashboardTab === 'financial_statements') && (
        <div id="financial-statements-section" className="animate-fadeIn">
          <FinancialStatementsDashboardSection
            accounts={accounts}
            journalEntries={entries}
            costCenters={costCenters}
            settings={settings}
            customersSuppliers={customersSuppliers}
            employees={employees}
            banks={banks}
            users={users}
            onSelectAccount={(acc) => setModalAccount(acc)}
            lang={lang}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. قسم التسويات الجردية في الرئيسية: كل بند لوحده مع العمليات والإقفال المحاسبي */}
      {/* ========================================================================= */}
      {(dashboardTab === 'all' || dashboardTab === 'adjustments') && (
        <div id="adjustments-section" className="animate-fadeIn">
          <PeriodicAdjustmentsSection
            adjustments={adjustments}
            onSaveAdjustments={onSaveAdjustments}
            accounts={accounts}
            onSaveAccounts={onSaveAccounts}
            journalEntries={entries}
            onSaveJournalEntries={onSaveJournalEntries}
            costCenters={costCenters}
            siteSettlements={siteSettlements}
            bankReconciliations={bankReconciliations}
            inventory={inventory}
            settings={settings}
            onNavigateToModule={onNavigate}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. بطاقات المؤشرات المالية والرسوم البيانية */}
      {/* ========================================================================= */}
      {(dashboardTab === 'all' || dashboardTab === 'kpis') && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* السيولة */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">إجمالي السيولة (خزينة + بنوك)</p>
                  <h3 className="text-2xl font-black mt-2 text-white">
                    {totalLiquidity.toLocaleString()} <span className="text-xs font-normal text-slate-400">{sysCurr}</span>
                  </h3>
                </div>
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>موقف السيولة النقدية متاح بالكامل</span>
              </div>
            </div>

            {/* الإيرادات */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">إجمالي الإيرادات المحققة</p>
                  <h3 className="text-2xl font-black mt-2 text-white">
                    {incomeStmt.totalRevenues.toLocaleString()} <span className="text-xs font-normal text-slate-400">{sysCurr}</span>
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                <span>عقود مشاريع ومبيعات منجزة</span>
              </div>
            </div>

            {/* المصروفات */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">إجمالي المصروفات العامة</p>
                  <h3 className="text-2xl font-black mt-2 text-white">
                    {incomeStmt.totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-400">{sysCurr}</span>
                  </h3>
                </div>
                <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                <span>مشتريات، رواتب، ونفقات تشغيل</span>
              </div>
            </div>

            {/* صافي الربح */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">صافي الأرباح (النشاط)</p>
                  <h3 className={`text-2xl font-black mt-2 ${incomeStmt.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {incomeStmt.netProfit.toLocaleString()} <span className="text-xs font-normal text-slate-400">{sysCurr}</span>
                  </h3>
                </div>
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                <span>هامش الربح التشغيلي: {incomeStmt.totalRevenues > 0 ? ((incomeStmt.netProfit / incomeStmt.totalRevenues) * 100).toFixed(1) : '0'}%</span>
              </div>
            </div>
          </div>

          {/* الرسوم البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* مقارنة الإيرادات والمصروفات */}
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>مقارنة الإيرادات والمصروفات الشهرية ({sysCurr})</span>
                </h3>
                <span className="text-xs text-slate-400">سنة مالية 2026</span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val: any) => `${Number(val).toLocaleString()} ${sysCurr}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="الإيرادات المحققة" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="المصروفات العامة" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* هيكل توزيع المصروفات */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-white mb-2">هيكل توزيع المصروفات التشغيلية</h3>
                <p className="text-xs text-slate-400 mb-4">توزيع النفقات الميدانية والإدارية</p>

                <div className="h-48">
                  {expensePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#8884d8"
                          label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {expensePieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      لا توجد مصروفات مسجلة حالياً
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 mt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400">إجمالي مصروفات الشركة:</span>
                <span className="font-bold text-red-400 font-mono">{incomeStmt.totalExpenses.toLocaleString()} {sysCurr}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. شيتات الإكسيل والنماذج المحاسبية التفاعلية السريعة */}
      {/* ========================================================================= */}
      {(dashboardTab === 'all' || dashboardTab === 'sheets') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">مركز شيتات الإكسيل والنماذج الحسابية المعتمدة</h3>
                  <p className="text-xs text-slate-400">نماذج جداول الكميات، مسيرات الرواتب، التسويات الميدانية، والشيتات الحرة</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('custom_sheets')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>فتح محرر الشيتات الكامل</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {customSheets.length > 0 ? (
              customSheets.map(sheet => (
                <div
                  key={sheet.id}
                  onClick={() => onNavigate('custom_sheets')}
                  className="p-4 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {sheet.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{sheet.rows.length} صفوف</span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-2 group-hover:text-emerald-300 transition line-clamp-1">
                      {sheet.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sheet.description || 'شيت إكسيل نشط ومعتمد'}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span>فتح الشيت والتعديل</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-6 text-center text-xs text-slate-400">
                لا توجد شيتات حالياً، اضغط على زر "فتح محرر الشيتات الكامل" لإنشاء نماذج إكسيل تفاعلية مخصصة.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* نافذة تفاصيل كشف الحساب المنبثقة (AccountLedgerModal) عند النقر من أي مكان */}
      {/* ========================================================================= */}
      {modalAccount && (
        <AccountLedgerModal
          account={modalAccount}
          accounts={accounts}
          journalEntries={entries}
          costCenters={costCenters}
          settings={settings}
          currentUser={users[0]}
          customersSuppliers={customersSuppliers}
          employees={employees}
          banks={banks}
          users={users}
          onClose={() => setModalAccount(null)}
          onSelectAccount={(acc) => setModalAccount(acc)}
          lang={lang}
        />
      )}

      {/* نافذة مركز الإشعارات والتنبيهات المكتملة */}
      {isNotifModalOpen && (
        <NotificationCenterModal
          isOpen={isNotifModalOpen}
          onClose={() => setIsNotifModalOpen(false)}
          alerts={systemAlerts}
          settings={settings}
          banks={banks}
          onSaveSettings={onSaveSettings}
          onNavigate={onNavigate}
          lang={lang}
        />
      )}

      {/* نافذة إرسال ملخص الـ KPIs بالواتساب مع اختيار المستلم */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <span>إرسال كشف المؤشرات المالية بالواتساب</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-xs text-slate-500">
                اختر المستلم من الدليل الموحد للعملاء، الموردين، الموظفين، أو إدارة الشركة:
              </p>

              <WhatsAppRecipientSelector
                selectedPhone={whatsappPhone}
                onPhoneChange={(phone, contact) => {
                  setWhatsappPhone(phone);
                  if (contact) setSelectedContact(contact);
                }}
                customersSuppliers={customersSuppliers}
                employees={employees}
                banks={banks}
                settings={settings}
                users={users}
                onRecipientSelect={(contact) => {
                  setSelectedContact(contact);
                  setWhatsappPhone(contact.phone);
                }}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendWhatsAppKPIs}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <span>إرسال الآن 📱</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
