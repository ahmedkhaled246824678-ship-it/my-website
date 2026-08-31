import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  Building,
  Calendar,
  DollarSign,
  Receipt,
  Globe,
  Phone,
  Mail,
  Shield,
  RefreshCw,
  Coins,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Upload,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  FileText,
  Check
} from 'lucide-react';
import { CompanySettings } from '../../types';
import { saveCompanySettings, resetSystemToDefault } from '../../utils/storage';
import {
  SUPPORTED_CURRENCIES,
  getExchangeRates,
  saveExchangeRates,
  getExchangeMeta,
  saveExchangeMeta,
  fetchLiveDailyExchangeRates,
  convertCurrency,
  ExchangeMeta
} from '../../utils/currency';
import { customConfirm, customAlert } from '../../utils/dialog';

interface CompanySettingsProps {
  settings: CompanySettings;
  onSettingsChange: (newSettings: CompanySettings) => void;
  onRefresh: () => void;
}

export const CompanySettingsModule: React.FC<CompanySettingsProps> = ({ settings, onSettingsChange, onRefresh }) => {
  const [form, setForm] = useState<CompanySettings>({ ...settings });
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => getExchangeRates());
  const [exchangeMeta, setExchangeMeta] = useState<ExchangeMeta>(() => getExchangeMeta());
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  // Quick Currency Converter State
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcFrom, setCalcFrom] = useState<string>('USD');
  const [calcTo, setCalcTo] = useState<string>(settings?.currency || 'ج.م');

  // File Upload Ref & Drag State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  // Preset Corporate Logos
  const PRESET_LOGOS = [
    {
      name: 'مقاولات وهندسة',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&auto=format&fit=crop&q=60',
      badge: '🏗️ مقاولات'
    },
    {
      name: 'تجارة وتوريدات',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=60',
      badge: '📦 تجارة'
    },
    {
      name: 'خدمات مالية واستثمار',
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=60',
      badge: '💼 مالية'
    },
    {
      name: 'تقنية واستشارات',
      url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=60',
      badge: '⚡ تقنية'
    }
  ];

  const handleLogoFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      customAlert('يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG, SVG, WebP)', 'warning');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      customAlert('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 4 ميجابايت.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (base64Data) {
        handleChange('logoUrl', base64Data);
        customAlert('تم تحميل وتعيين شعار الشركة بنجاح! سيظهر الشعار تلقائياً في جميع ملفات PDF وكشوف الحسابات والتقارير الرسمية.', 'success');
      }
    };
    reader.onerror = () => {
      customAlert('حدث خطأ أثناء قراءة ملف الصورة، يرجى المحاولة مرة أخرى.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFileUpload(e.dataTransfer.files[0]);
    }
  };

  // تحميل إعدادات وبيانات العملات المحفوظة عند فتح الصفحة (تحديث يدوي فقط دون أي تغيير تلقائي)
  useEffect(() => {
    const meta = getExchangeMeta();
    setExchangeMeta(meta);
    setExchangeRates(getExchangeRates());
  }, []);

  const handleFetchLiveRates = async (showAlert: boolean = true) => {
    setIsFetchingRates(true);
    try {
      const res = await fetchLiveDailyExchangeRates(form.currency === 'ر.س' ? 'SAR' : 'USD');
      if (res.success) {
        setExchangeRates(res.rates);
        setExchangeMeta(res.meta);
        if (showAlert) {
          customAlert(`تم تحديث أسعار كافة العملات مباشرة بنجاح وفقاً لمؤشرات أسواق الصرف العالمية اليومية!`, 'success');
        }
      } else {
        if (showAlert) {
          customAlert(res.error || 'تعذر تحديث الأسعار المباشرة، تم الإبقاء على الأسعار المحفوظة.', 'warning');
        }
      }
    } catch (err: any) {
      if (showAlert) {
        customAlert('حدث خطأ أثناء الاتصال بخادم أسعار الصرف العالمية.', 'error');
      }
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanySettings(form);
    saveExchangeRates(exchangeRates);
    saveExchangeMeta(exchangeMeta);
    onSettingsChange(form);
    onRefresh();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
    customAlert('تم حفظ وتحديث إعدادات الشركة وأسعار العملات والسنة المالية بنجاح!', 'success');
  };

  const handleResetAll = () => {
    customConfirm('تنبيه شديد الأهمية: هل أنت متأكد من رغبتك في إعادة ضبط كافة قيود وحسابات النظام إلى الوضع الافتراضي للشركة؟', () => {
      resetSystemToDefault();
      onRefresh();
      customAlert('تم إعادة ضبط النظام بالكامل إلى الوضع الافتراضي!', 'success');
    }, 'تأكيد إعادة ضبط النظام');
  };

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(c => {
    if (c.code === form.currency) return false;
    if (!currencySearch.trim()) return true;
    const q = currencySearch.toLowerCase();
    return (
      c.label.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q)
    );
  });

  const convertedResult = convertCurrency(calcAmount || 0, calcFrom, calcTo, exchangeRates);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Settings className="w-6 h-6 animate-spin-slow" />
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              إدارة الإعدادات والعملات
            </span>
          </div>
          <h2 className="text-xl font-black text-white">
            إعدادات الشركة، أسعار العملات المباشرة، والسنة المالية
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            التحكم في بيانات المنشأة، تحديث أسعار الصرف الحية يومياً، تواريخ السنة المالية، والعملة الأساسية للتقارير.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleFetchLiveRates(true)}
            disabled={isFetchingRates}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
            <span>{isFetchingRates ? 'جاري جلب الأسعار...' : 'تحديث أسعار العملات مباشر اليوم ⚡'}</span>
          </button>
          
          {savedMsg && (
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold animate-pulse">
              ✅ تم الحفظ بنجاح
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* قسم أسعار صرف العملات المباشرة واليومية (Live Daily FX Rates) */}
        <div className="bg-white rounded-3xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 border-b border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    أسعار صرف العملات المباشرة يومياً (Live Daily FX Rates)
                  </h3>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    مباشر ومطابق للأسواق
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  آخر تحديث مباشر: <span className="font-bold text-slate-700">{exchangeMeta.lastDateFormatted || 'اليوم'}</span> • المصدر: <span className="font-bold text-slate-700">{exchangeMeta.source}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="🔍 بحث عن عملة (USD, EUR, جنيه...)"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 w-48"
              />
              <button
                type="button"
                onClick={() => handleFetchLiveRates(true)}
                disabled={isFetchingRates}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs disabled:opacity-50"
                title="إعادة جلب الأسعار الحية الآن"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin' : ''}`} />
                <span>تحديث حي</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* بطاقات أسعار العملات المباشرة */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>أسعار الصرف مقابل العملة الأساسية ({form.currency}):</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  (قيمة 1 وحدة من العملة الأجنبية مقدرة بالـ {form.currency})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredCurrencies.map(c => {
                  const currentRate = exchangeRates[c.code] !== undefined ? exchangeRates[c.code] : c.defaultRateToSAR;
                  const isModified = Math.abs(currentRate - c.defaultRateToSAR) > 0.0001;

                  return (
                    <div
                      key={c.code}
                      className="bg-slate-50/70 hover:bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{c.flag}</span>
                          <span className="font-bold text-slate-800 text-xs">{c.label}</span>
                        </div>
                        <span className="text-[10px] bg-slate-200/70 group-hover:bg-amber-100 group-hover:text-amber-900 text-slate-600 font-mono font-bold px-1.5 py-0.5 rounded-md">
                          {c.iso}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                        <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                          <span>1 {c.iso} =</span>
                          <span className="text-emerald-700 font-bold">🟢 حي اليوم</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.0001"
                            min={0.0001}
                            value={currentRate}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const next = { ...exchangeRates, [c.code]: val };
                              setExchangeRates(next);
                              saveExchangeRates(next);
                            }}
                            className="w-full bg-white border border-slate-300 group-hover:border-amber-400 rounded-lg py-1 px-1.5 text-center font-mono font-black text-amber-950 text-xs focus:outline-none focus:border-amber-600 shadow-2xs"
                          />
                          <span className="text-[11px] font-bold text-slate-600 shrink-0">{form.currency}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* حاسبة تحويل العملات السريعة بأسعار اليوم الحية */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-3">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <span>حاسبة التحويل السريع بأسعار الصرف المباشرة المعتمدة:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">المبلغ المراد تحويله:</label>
                  <input
                    type="number"
                    min={1}
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">من عملة:</label>
                  <select
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.label} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">إلى عملة:</label>
                  <select
                    value={calcTo}
                    onChange={(e) => setCalcTo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.label} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white border border-blue-300 rounded-xl p-2 text-center flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 font-bold">الناتج المعادل:</div>
                  <div className="text-sm font-black text-blue-700 font-mono">
                    {convertedResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {calcTo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. شعار وهوية الشركة الرسمية (Company Official Logo) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-700 font-bold">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    شعار وهوية الشركة الرسمية (Company Logo)
                  </h3>
                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-300">
                    يظهر تلقائياً في ملفات PDF والتقارير والواتساب
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  قم بتحميل شعار المنشأة ليتم تضمينه في ترويسة كشوف الحسابات المطبوعة، فواتير الضريبة، ومستندات الـ PDF المرسلة عبر الواتساب.
                </p>
              </div>
            </div>

            {form.logoUrl && (
              <button
                type="button"
                onClick={() => {
                  handleChange('logoUrl', '');
                  customAlert('تم إزالة الشعار.', 'info');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الشعار الحالي</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* منطقة السحب والإفلات والتحميل */}
              <div className="lg:col-span-7">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleLogoFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    isDraggingLogo
                      ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">
                      انقر لاختيار ملف الشعار من جهازك أو اسحب الصورة هنا
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      يدعم صيغ الصور: PNG, JPG, JPEG, SVG, WebP (الحجم الموصى به: مربع أو مستطيل حتى 4 ميجابايت)
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    📂 استعراض ملفات الشعار
                  </button>
                </div>

                {/* خيار إدخال رابط الشعار عبر الإنترنت */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="أو ضع رابط URL مباشر للشعار هنا (https://...)"
                      value={form.logoUrl || ''}
                      onChange={(e) => handleChange('logoUrl', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* شعارات ونماذج جاهزة سريعة */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>نماذج شعارات سريعة للاختيار المباشر:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleChange('logoUrl', preset.url);
                          customAlert(`تم تطبيق شعار (${preset.name}) بنجاح!`, 'success');
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-right cursor-pointer group"
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="overflow-hidden">
                          <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 truncate">
                            {preset.badge}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">{preset.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* معاينة الشعار المباشرة وكيف يظهر في التقارير والـ PDF */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 p-4.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>معاينة حية لترويسة التقرير والـ PDF:</span>
                  </span>
                  {form.logoUrl ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      شعار معتمد
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">لا يوجد شعار محدد</span>
                  )}
                </div>

                {/* نموذج مصغر يحاكي ترويسة التقرير الرسمي */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-300 shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      {form.logoUrl ? (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          <img
                            src={form.logoUrl}
                            alt="Logo Preview"
                            className="max-w-full max-height-full object-contain"
                            onError={(e) => {
                              // Fallback on broken URL
                              (e.target as any).src = 'https://placehold.co/100x100?text=Logo';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold text-center">
                          مكان الشعار
                        </div>
                      )}
                      <div>
                        <div className="font-black text-blue-950 text-xs truncate max-w-[170px]">
                          {form.companyName || 'اسم الشركة الرسمية'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          ضريبي: {form.taxNumber || '300458921000003'}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          س.ت: {form.commercialRegister || '1010543210'}
                        </div>
                      </div>
                    </div>

                    <div className="text-left text-[9px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <div>التاريخ: اليوم</div>
                      <div>العملة: {form.currency}</div>
                    </div>
                  </div>

                  <div className="bg-blue-900 text-white rounded-lg p-2 text-center text-[10px] font-bold">
                    كشف حساب تفصيلي معتمد (PDF)
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    عند حفظ الإعدادات، يتم استخدام هذا الشعار فورياً كعلامة رسمية في جميع كشوف الحسابات المطبوعة والملفات المرسلة عبر الواتساب.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. بيانات الشركة الرسمية */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-blue-800 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>البيانات الرسمية للمنشأة والتسجيل التجاري والضريبي</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الشركة (بالعربية) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الشركة (بالإنجليزية - للتقارير)</label>
                <input
                  type="text"
                  value={form.companyNameEn || ''}
                  onChange={(e) => handleChange('companyNameEn', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي الموحد (VAT Number) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.taxNumber}
                  onChange={(e) => handleChange('taxNumber', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-blue-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم السجل التجاري</label>
                <input
                  type="text"
                  value={form.commercialRegister}
                  onChange={(e) => handleChange('commercialRegister', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 2. إعدادات السنة المالية والضرائب والعملة الأساسية */}
          <div className="p-6 space-y-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-emerald-800 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>السنة المالية والعملة الأساسية للنظام ومعدل ضريبة القيمة المضافة</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">بداية السنة المالية</label>
                <input
                  type="date"
                  required
                  value={form.fiscalYearStart}
                  onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نهاية السنة المالية</label>
                <input
                  type="date"
                  required
                  value={form.fiscalYearEnd}
                  onChange={(e) => handleChange('fiscalYearEnd', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">العملة الأساسية للنظام</label>
                <select
                  value={form.currency}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'CUSTOM_CURR') {
                      const custom = prompt('أدخل رمز أو اسم العملة المخصصة (مثال: ل.س، د.ع، CHF، ر.ي، د.ت):', form.currency);
                      if (custom && custom.trim()) {
                        handleChange('currency', custom.trim());
                      }
                    } else {
                      handleChange('currency', val);
                    }
                  }}
                  className="w-full bg-white border border-emerald-500 rounded-xl p-2.5 font-bold text-emerald-900 shadow-xs"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.label} ({c.code})</option>
                  ))}
                  <option value="CUSTOM_CURR">⚙️ عملة مخصصة أخرى...</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة الافتراضية (%)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={form.defaultTaxRate}
                  onChange={(e) => handleChange('defaultTaxRate', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-red-700"
                />
              </div>
            </div>
          </div>

          {/* 3. بيانات التواصل والعنوان */}
          <div className="p-6 space-y-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4 text-slate-600" />
              <span>عناوين المركز الرئيسي وبيانات الاتصال</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">العنوان الوطني / مقر الشركة</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف المركزي</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">الموقع الإلكتروني (إن وُجد)</label>
                <input
                  type="text"
                  value={form.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="p-6 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-xl transition text-xs border border-red-300 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة ضبط كافة البيانات للوضع الافتراضي</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition duration-150 text-sm cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>حفظ واعتماد إعدادات الشركة وأسعار الصرف</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
