import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  Share2,
  Settings,
  Landmark,
  CreditCard,
  Package,
  Briefcase,
  HardHat,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  Phone
} from 'lucide-react';
import { SystemAlert, CompanySettings, BankAccount, NotificationSettings } from '../../types';
import { sendAlertViaWhatsApp, formatWhatsAppAlertMessage } from '../../utils/alertSystem';
import { customAlert } from '../../utils/dialog';
import { Language, t } from '../../utils/i18n';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SystemAlert[];
  settings: CompanySettings;
  banks: BankAccount[];
  onSaveSettings: (newSettings: CompanySettings) => void;
  onNavigate: (module: string) => void;
  onDismissAlert?: (alertId: string) => void;
  lang?: Language;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  alerts = [],
  settings,
  banks = [],
  onSaveSettings,
  onNavigate,
  onDismissAlert,
  lang = 'ar'
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [filterType, setFilterType] = useState<string>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [customPhone, setCustomPhone] = useState<string>(
    settings.notificationSettings?.managerPhone || settings.phone || '966501234567'
  );
  const [selectedAlertForWhatsApp, setSelectedAlertForWhatsApp] = useState<SystemAlert | null>(null);

  // Settings form state
  const [notifConfig, setNotifConfig] = useState<NotificationSettings>(() => {
    return (
      settings.notificationSettings || {
        defaultBankThreshold: 50000,
        enableWhatsAppAlerts: true,
        enableDashboardPopups: true,
        managerPhone: settings.phone || '966501234567',
        dueDaysNotice: 7,
        alertOnInventoryLow: true,
        alertOnCustodyDelay: true,
        alertOnOverdueReceivables: true
      }
    );
  });

  const [bankThresholds, setBankThresholds] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    banks.forEach(b => {
      map[b.id] = b.minThreshold ?? 50000;
    });
    return map;
  });

  if (!isOpen) return null;

  const visibleAlerts = alerts.filter(a => !dismissedIds.includes(a.id)).filter(a => {
    if (filterType === 'all') return true;
    if (filterType === 'bank') return a.type === 'bank_low_balance';
    if (filterType === 'payment') return a.type === 'payment_due' || a.type === 'accrual_due';
    if (filterType === 'custody') return a.type === 'custody_due' || a.type === 'settlement_due';
    if (filterType === 'inventory') return a.type === 'inventory_low';
    return true;
  });

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
    if (onDismissAlert) onDismissAlert(id);
  };

  const handleSendWhatsApp = (alert: SystemAlert) => {
    sendAlertViaWhatsApp(alert, settings, customPhone);
    customAlert(`تم فتح تطبيق الواتساب لإرسال التنبيه إلى الرقم (${customPhone}) بنجاح!`, 'success');
  };

  const handleSaveConfig = () => {
    const updatedSettings: CompanySettings = {
      ...settings,
      notificationSettings: notifConfig
    };
    onSaveSettings(updatedSettings);
    customAlert('تم حفظ إعدادات حدود التنبيهات ونظام الواتساب الآلي بنجاح!', 'success');
    setActiveTab('alerts');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'bank_low_balance':
        return <Landmark className="w-5 h-5 text-red-400" />;
      case 'payment_due':
      case 'accrual_due':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      case 'inventory_low':
        return <Package className="w-5 h-5 text-purple-400" />;
      case 'custody_due':
        return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'settlement_due':
        return <HardHat className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 relative">
              <Bell className="w-6 h-6 animate-pulse" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>مركز الإشعارات والتنبيهات المالية الذكية</span>
                <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 font-bold px-2 py-0.5 rounded-full">
                  {visibleAlerts.length} تنبيه نشط
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مراقبة لحظية لأرصدة البنوك، مواعيد الاستحقاقات، تسويات العهد، وفوارق المواقع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'alerts' ? 'settings' : 'alerts')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="إعدادات حدود التنبيه والواتساب"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">إعداد الحدود والواتساب</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* التبويبات والمحتوى */}
        {activeTab === 'alerts' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* ملخص إحصائي سريع */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-right">
                <div className="text-[11px] text-red-300 font-bold flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  <span>تنبيهات حرجة وعاجلة</span>
                </div>
                <div className="text-xl font-black text-red-400 mt-1">{criticalCount}</div>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-right">
                <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>تحذيرات استحقاق</span>
                </div>
                <div className="text-xl font-black text-amber-400 mt-1">{warningCount}</div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-right">
                <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تنبيهات الواتساب الآلية</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>مفعلة وجاهزة</span>
                </div>
              </div>
            </div>

            {/* فلتر التنبيهات */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1 pl-1">
                <Filter className="w-3.5 h-3.5" />
                تصفية:
              </span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'bank', label: '🏦 السيولة والبنوك' },
                { id: 'payment', label: '💳 المدفوعات والتسويات' },
                { id: 'custody', label: '💼 العهد والمواقع' },
                { id: 'inventory', label: '📦 المخزون' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* قائمة التنبيهات النشطة */}
            <div className="space-y-3">
              {visibleAlerts.length === 0 ? (
                <div className="py-12 text-center bg-slate-800/40 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <h4 className="font-bold text-sm text-white">الوضع المالي مستقر تماماً</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    لا توجد حسابات بنكية هبطت دون الحد الأدنى، ولا توجد مدفوعات متأخرة حالياً.
                  </p>
                </div>
              ) : (
                visibleAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      alert.severity === 'critical'
                        ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                        : 'bg-slate-800/80 border-slate-700 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2.5 rounded-xl mt-0.5 ${
                          alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'
                        }`}
                      >
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{alert.title}</h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              alert.severity === 'critical'
                                ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                                : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {alert.severity === 'critical' ? '🔴 تنبيه حرج' : '🟡 تحذير استحقاق'}
                          </span>
                          {alert.dueDate && (
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              {alert.dueDate}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>

                    {/* أزرار الإجراءات الفورية والتنبيه بالواتساب */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleSendWhatsApp(alert)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                        title="إرسال تنبيه فوري عبر الواتساب للمسؤول"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>واتساب 📱</span>
                      </button>

                      {alert.relatedModule && (
                        <button
                          onClick={() => {
                            onNavigate(alert.relatedModule!);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded-xl text-xs font-bold transition"
                        >
                          <span>عرض البند</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
                        title="تجاهل مؤقت"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* تبويب إعدادات حدود التنبيه والواتساب */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                <span>الحد الأدنى العام لأرصدة البنوك والسيولة</span>
              </h3>
              <p className="text-xs text-slate-300">
                عندما يهبط رصيد أي حساب بنكي دون هذا المبلغ، يقوم النظام فوراً بتوليد إشعار حرج وتجهيز تنبيه واتساب مباشر.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الحد الأدنى الافتراضي للرصيد البنكي ({settings.currency})
                </label>
                <input
                  type="number"
                  value={notifConfig.defaultBankThreshold}
                  onChange={e =>
                    setNotifConfig(prev => ({
                      ...prev,
                      defaultBankThreshold: Number(e.target.value) || 0
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رقم هاتف مسؤول المالية / المدير لتلقي تنبيهات الواتساب</span>
                </label>
                <input
                  type="text"
                  value={notifConfig.managerPhone}
                  onChange={e =>
                    setNotifConfig(prev => ({
                      ...prev,
                      managerPhone: e.target.value
                    }))
                  }
                  placeholder="966501234567"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none text-left"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  أدخل الرقم مع المفتاح الدولي بدون مسافات (مثال: 966501234567 أو 201012345678)
                </span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>قنوات وطرق استلام التنبيهات</span>
              </h3>

              <div className="space-y-2.5">
                <label className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifConfig.enableDashboardPopups}
                    onChange={e =>
                      setNotifConfig(prev => ({
                        ...prev,
                        enableDashboardPopups: e.target.checked
                      }))
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">إظهار لافتة وشريط تنبيهات عاجل بالرئيسية</div>
                    <div className="text-[10px] text-slate-400">
                      عرض لافتة حمراء/صفراء عند وجود هبوط في السيولة أو دفعات مستحقة اليوم
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifConfig.enableWhatsAppAlerts}
                    onChange={e =>
                      setNotifConfig(prev => ({
                        ...prev,
                        enableWhatsAppAlerts: e.target.checked
                      }))
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">تفعيل إرسال التنبيهات المباشرة عبر واتساب</div>
                    <div className="text-[10px] text-slate-400">
                      توليد رسائل واتساب مهيكلة بضغطة زر للمدير والمسؤولين والموردين
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveTab('alerts')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition"
              >
                حفظ الإعدادات والتحديث
              </button>
            </div>
          </div>
        )}

        {/* شريط الإغلاق السفلي */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>نظام المراقبة والتحذير المالي نشط ويعمل على مدار الساعة</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
