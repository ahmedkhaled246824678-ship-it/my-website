import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Shield,
  Database,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  DollarSign,
  Coins,
  Globe,
  ArrowRightLeft,
  ArrowLeft,
  Bell
} from 'lucide-react';
import {
  GlobalFilterState,
  CompanySettings,
  UserAccount,
  BankAccount,
  CustomerSupplier,
  Custody,
  EmployeeAdvance,
  SiteSettlement,
  InventoryItem,
  AccrualAdjustment
} from '../../types';
import { resetSystemToDefault, exportSystemBackup, importSystemBackup, saveCompanySettings } from '../../utils/storage';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { customConfirm, customAlert } from '../../utils/dialog';
import { Language, SUPPORTED_LANGUAGES, t } from '../../utils/i18n';
import { generateSystemAlerts } from '../../utils/alertSystem';
import { NotificationCenterModal } from './NotificationCenterModal';

interface NavbarProps {
  settings: CompanySettings;
  currentUser: UserAccount;
  originalAdminUser?: UserAccount | null;
  filterState: GlobalFilterState;
  onFilterChange: (newFilter: Partial<GlobalFilterState>) => void;
  onRefreshData: () => void;
  activeModule: string;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onRevertImpersonation?: () => void;
  onSettingsChange?: (newSettings: CompanySettings) => void;
  banks?: BankAccount[];
  customersSuppliers?: CustomerSupplier[];
  custodies?: Custody[];
  advances?: EmployeeAdvance[];
  siteSettlements?: SiteSettlement[];
  inventory?: InventoryItem[];
  adjustments?: AccrualAdjustment[];
  onNavigate?: (module: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentUser,
  originalAdminUser,
  filterState,
  onFilterChange,
  onRefreshData,
  activeModule,
  lang,
  onLanguageChange,
  onRevertImpersonation,
  onSettingsChange,
  banks = [],
  customersSuppliers = [],
  custodies = [],
  advances = [],
  siteSettlements = [],
  inventory = [],
  adjustments = [],
  onNavigate = () => {}
}) => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // توليد التنبيهات اللحظية
  const systemAlerts = generateSystemAlerts({
    banks: banks || [],
    customersSuppliers: customersSuppliers || [],
    custodies: custodies || [],
    advances: advances || [],
    siteSettlements: siteSettlements || [],
    inventory: inventory || [],
    accrualAdjustments: adjustments || [],
    settings: settings
  }) || [];

  const criticalCount = (systemAlerts || []).filter(a => a && a.severity === 'critical').length;

  const handleCurrencySwitch = (newCurr: string) => {
    if (newCurr === 'CUSTOM_CURR') {
      const custom = prompt('أدخل رمز أو اسم العملة المخصصة (مثال: ل.س، د.ع، CHF، ر.ي، د.ت):', settings.currency);
      if (custom && custom.trim()) {
        const newSet = { ...settings, currency: custom.trim() };
        if (onSettingsChange) onSettingsChange(newSet);
        else { saveCompanySettings(newSet); onRefreshData(); }
        customAlert(`تم تحويل العملة الأساسية للنظام إلى (${custom.trim()}) بنجاح!`, 'success');
      }
    } else {
      const newSet = { ...settings, currency: newCurr };
      if (onSettingsChange) onSettingsChange(newSet);
      else { saveCompanySettings(newSet); onRefreshData(); }
      customAlert(`تم تحويل العملة الأساسية للنظام إلى (${newCurr}) بنجاح!`, 'success');
    }
  };

  const handleReset = () => {
    customConfirm('تنبيه هام: هل أنت متأكد من إعادة ضبط كافة الحسابات والبيانات إلى الوضع الافتراضي للشركة؟', () => {
      resetSystemToDefault();
      onRefreshData();
      customAlert('تم إعادة ضبط النظام إلى الوضع الافتراضي بنجاح!', 'success');
    }, 'تأكيد إعادة ضبط النظام');
  };

  const handleExportBackup = () => {
    const jsonStr = exportSystemBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roeya_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = () => {
    if (!importJson.trim()) {
      setStatusMsg({ text: 'يرجى لصق كود النسخة الاحتياطية أو اختيار الملف أولاً', type: 'error' });
      return;
    }
    const success = importSystemBackup(importJson);
    if (success) {
      onRefreshData();
      setStatusMsg({ text: 'تم استرجاع النسخة الاحتياطية وتحديث النظام بنجاح!', type: 'success' });
      setTimeout(() => {
        setShowBackupModal(false);
        setImportJson('');
        setStatusMsg(null);
      }, 1500);
    } else {
      setStatusMsg({ text: 'حدث خطأ في قراءة ملف النسخة الاحتياطية، تأكد من صحة التنسيق', type: 'error' });
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      {/* شريط تنبيه التبديل بين الحسابات للمدير */}
      {originalAdminUser && (
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-4 py-1.5 text-slate-950 text-xs font-bold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              أنت تتصفح النظام حالياً بصلاحيات المستخدم: <strong className="underline">{currentUser.fullName} ({currentUser.username})</strong>
            </span>
          </div>
          {onRevertImpersonation && (
            <button
              onClick={onRevertImpersonation}
              className="flex items-center gap-1 px-3 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-xs font-bold transition shadow"
            >
              <span>العودة لحساب الإدارة الرئيسي ({originalAdminUser.username})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* الشعار واسم الشركة */}
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName}
                  className="max-w-full max-height-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-blue-400/30">
                ERP
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-100">{settings.companyName}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>رقم ضريبي: {settings.taxNumber}</span>
                <span>•</span>
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300 font-medium cursor-pointer hover:bg-emerald-500/20 transition">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>العملة:</span>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleCurrencySwitch(e.target.value)}
                    className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer pr-1"
                    title="التحكم الفوري في العملة الأساسية للنظام"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">{c.label} ({c.code})</option>
                    ))}
                    <option value="CUSTOM_CURR" className="bg-slate-900 text-amber-400">⚙️ عملة مخصصة...</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* شريط البحث الذكي والتاريخ */}
          <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 focus-within:border-blue-500 transition">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              <input
                type="text"
                placeholder={t('search_placeholder', lang)}
                value={filterState.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="w-full bg-transparent pr-9 pl-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none"
              />
              {filterState.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded"
                >
                  مسح
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-slate-700 my-auto"></div>

            {/* فلتر السنة المالية */}
            <div className="flex items-center gap-1.5 pl-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <select
                value={filterState.fiscalYear}
                onChange={(e) => onFilterChange({ fiscalYear: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-xs font-semibold text-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="2026">سنة 2026</option>
                <option value="2025">سنة 2025</option>
                <option value="all">كل السنوات</option>
              </select>
            </div>

            {/* محول اللغات (i18n Language Switcher) */}
            <div className="flex items-center gap-1.5 pl-2 border-r border-slate-700 pr-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <select
                value={lang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-slate-900 border border-indigo-500/40 text-xs font-bold text-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-400 cursor-pointer transition"
                title="تغيير لغة واجهة النظام"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* أدوات النظام والمستخدم */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* زر جرس التنبيهات مع الشارة الرقمية */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className={`relative p-2 rounded-xl border transition ${
                criticalCount > 0
                  ? 'bg-red-950/80 hover:bg-red-900 border-red-500/50 text-red-400 animate-pulse shadow-lg shadow-red-950/50'
                  : systemAlerts.length > 0
                  ? 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="مركز الإشعارات والتنبيهات المالية وهبوط الأرصدة"
            >
              <Bell className="w-4 h-4" />
              {systemAlerts.length > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full text-white shadow ${
                    criticalCount > 0 ? 'bg-red-600' : 'bg-amber-500'
                  }`}
                >
                  {systemAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              title="إدارة النسخ الاحتياطية واستعادة البيانات"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">النسخ الاحتياطي</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition"
              title="إعادة ضبط النظام إلى الوضع الافتراضي"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="h-7 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200 leading-none">{currentUser.username}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{currentUser.fullName}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* شريط البحث الموبايل */}
      <div className="md:hidden px-4 pb-3 flex items-center gap-2">
        <div className="relative flex-1 flex items-center bg-slate-800 p-1.5 rounded-lg border border-slate-700">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          <input
            type="text"
            placeholder={t('search_placeholder', lang)}
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full bg-transparent pr-9 pl-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={lang}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-300 rounded-lg px-2 py-2"
        >
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.code.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* نافذة إدارة النسخ الاحتياطي */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                <Database className="w-5 h-5" />
                <span>إدارة قاعدة البيانات والنسخ الاحتياطي</span>
              </h3>
              <button onClick={() => setShowBackupModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-sm mb-2 text-emerald-400 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية (Export Backup)</span>
                </h4>
                <p className="text-xs text-slate-300 mb-3">
                  قم بتحميل ملف يحتوي على كافة الحسابات، شيتات العهد، سلف الموظفين، تسويات المواقع، القيود المحاسبية، العملاء، والمستخدمين وروابطهم.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف النسخة الاحتياطية (.JSON)</span>
                </button>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-sm mb-2 text-amber-400 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>استعادة نسخة احتياطية (Restore Backup)</span>
                </h4>
                <p className="text-xs text-slate-300 mb-2">
                  لصق محتوى ملف JSON هنا لاسترجاع كافة البيانات المخزنة سابقاً:
                </p>
                <textarea
                  rows={4}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="ألصق كود الـ JSON هنا..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono mb-3"
                ></textarea>
                <button
                  onClick={handleImportBackup}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition shadow flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>استرجاع وتحديث بيانات النظام الآن</span>
                </button>
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                  {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}
            </div>

            <div className="mt-6 text-left">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-lg transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* نافذة مركز الإشعارات والتنبيهات المكتملة */}
      {showNotificationModal && (
        <NotificationCenterModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          alerts={systemAlerts}
          settings={settings}
          banks={banks}
          onSaveSettings={(newSet) => {
            if (onSettingsChange) onSettingsChange(newSet);
            else { saveCompanySettings(newSet); onRefreshData(); }
          }}
          onNavigate={onNavigate}
          lang={lang}
        />
      )}
    </header>
  );
};
