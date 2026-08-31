import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  RotateCcw,
  Check,
  ChevronDown,
  Filter,
  X,
  Sparkles
} from 'lucide-react';

export type DateFilterPreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom_month'
  | 'this_year'
  | 'last_year'
  | 'custom_year'
  | 'custom_range';

export interface AdvancedDateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string, presetLabel?: string) => void;
  onReset?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}

export const AdvancedDateFilter: React.FC<AdvancedDateFilterProps> = ({
  startDate,
  endDate,
  onChange,
  onReset,
  title = 'تصفية وبحث حسب الفترة والتاريخ',
  className = '',
  compact = false
}) => {
  const [activePreset, setActivePreset] = useState<DateFilterPreset>('all');
  const [customStart, setCustomStart] = useState<string>(startDate || '');
  const [customEnd, setCustomEnd] = useState<string>(endDate || '');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  // تحديث القيم الداخلية عند تغير الخصائص الخارجية
  useEffect(() => {
    setCustomStart(startDate || '');
    setCustomEnd(endDate || '');
    if (!startDate && !endDate) {
      setActivePreset('all');
    }
  }, [startDate, endDate]);

  const monthsList = [
    { value: 1, label: '01 - يناير' },
    { value: 2, label: '02 - فبراير' },
    { value: 3, label: '03 - مارس' },
    { value: 4, label: '04 - أبريل' },
    { value: 5, label: '05 - مايو' },
    { value: 6, label: '06 - يونيو' },
    { value: 7, label: '07 - يوليو' },
    { value: 8, label: '08 - أغسطس' },
    { value: 9, label: '09 - سبتمبر' },
    { value: 10, label: '10 - أكتوبر' },
    { value: 11, label: '11 - نوفمبر' },
    { value: 12, label: '12 - ديسمبر' },
  ];

  const currentYearNum = new Date().getFullYear();
  const yearsList = [
    currentYearNum + 1,
    currentYearNum,
    currentYearNum - 1,
    currentYearNum - 2,
    currentYearNum - 3,
    currentYearNum - 4,
  ];

  // دوال حساب التواريخ بدقة بتنسيق YYYY-MM-DD
  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApplyPreset = (preset: DateFilterPreset, customParams?: { month?: number; year?: number }) => {
    setActivePreset(preset);
    const now = new Date();

    switch (preset) {
      case 'all': {
        setCustomStart('');
        setCustomEnd('');
        onChange('', '', 'كافة الفترات');
        if (onReset) onReset();
        break;
      }
      case 'today': {
        const todayStr = formatDate(now);
        setCustomStart(todayStr);
        setCustomEnd(todayStr);
        onChange(todayStr, todayStr, 'اليوم');
        break;
      }
      case 'yesterday': {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yStr = formatDate(y);
        setCustomStart(yStr);
        setCustomEnd(yStr);
        onChange(yStr, yStr, 'أمس');
        break;
      }
      case 'last_7_days': {
        const start = new Date();
        start.setDate(start.getDate() - 6);
        const startStr = formatDate(start);
        const endStr = formatDate(now);
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, 'آخر 7 أيام');
        break;
      }
      case 'last_30_days': {
        const start = new Date();
        start.setDate(start.getDate() - 29);
        const startStr = formatDate(start);
        const endStr = formatDate(now);
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, 'آخر 30 يوم');
        break;
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startStr = formatDate(start);
        const endStr = formatDate(end);
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, `هذا الشهر (${monthsList[now.getMonth()].label})`);
        break;
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        const startStr = formatDate(start);
        const endStr = formatDate(end);
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, `الشهر السابق (${monthsList[start.getMonth()].label})`);
        break;
      }
      case 'custom_month': {
        const m = customParams?.month || selectedMonth;
        const y = customParams?.year || selectedYear;
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0);
        const startStr = formatDate(start);
        const endStr = formatDate(end);
        setCustomStart(startStr);
        setCustomEnd(endStr);
        const monthObj = monthsList.find(item => item.value === m);
        onChange(startStr, endStr, `شهر ${monthObj?.label || m} (${y})`);
        break;
      }
      case 'this_year': {
        const y = now.getFullYear();
        const startStr = `${y}-01-01`;
        const endStr = `${y}-12-31`;
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, `سنة ${y}`);
        break;
      }
      case 'last_year': {
        const y = now.getFullYear() - 1;
        const startStr = `${y}-01-01`;
        const endStr = `${y}-12-31`;
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, `سنة ${y}`);
        break;
      }
      case 'custom_year': {
        const y = customParams?.year || selectedYear;
        const startStr = `${y}-01-01`;
        const endStr = `${y}-12-31`;
        setCustomStart(startStr);
        setCustomEnd(endStr);
        onChange(startStr, endStr, `سنة ${y}`);
        break;
      }
      case 'custom_range': {
        if (customStart && customEnd) {
          onChange(customStart, customEnd, `من ${customStart} إلى ${customEnd}`);
        } else if (customStart) {
          onChange(customStart, '', `من ${customStart}`);
        } else if (customEnd) {
          onChange('', customEnd, `حتى ${customEnd}`);
        }
        break;
      }
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset('custom_range');
    if (!customStart && !customEnd) {
      handleApplyPreset('all');
      return;
    }
    onChange(customStart, customEnd, `من ${customStart || 'البداية'} إلى ${customEnd || 'الآن'}`);
  };

  const handleClear = () => {
    setActivePreset('all');
    setCustomStart('');
    setCustomEnd('');
    onChange('', '', 'كافة الفترات');
    if (onReset) onReset();
  };

  const hasActiveFilter = Boolean(startDate || endDate);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${className}`}>
      {/* الشريط العلوي مع زر الطي والشارة */}
      <div className="p-3.5 bg-gradient-to-r from-slate-50 to-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800">{title}</span>
              {hasActiveFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>فلتر نشط: {startDate ? `من ${startDate}` : ''} {endDate ? `إلى ${endDate}` : ''}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              تصفية سريعة بالأيام، الشهور، السنوات، أو تحديد نطاق زمني مخصص (من تاريخ - إلى تاريخ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilter && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition cursor-pointer"
              title="إلغاء تصفية التاريخ وعرض كافة الفترات"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء الفلتر</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>{isExpanded ? 'إخفاء خيارات الفترة' : 'خيارات الفترة والتواريخ'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* المحتوى التفصيلي لأزرار الأيام والشهور والسنة والنطاق المخصص */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-slate-50/40">
          {/* 1. قسم الأيام (Days) والشهور والسنة السريعة */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* أزرار الأيام والشهور */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>الأيام:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'all' && !startDate && !endDate
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  الكل (كافة الفترات)
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'today'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  اليوم
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('yesterday')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'yesterday'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  أمس
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('last_7_days')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'last_7_days'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  آخر 7 أيام
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('last_30_days')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'last_30_days'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  آخر 30 يوم
                </button>
              </div>

              {/* أزرار الشهور والسنوات */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span>الشهور والسنة:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('this_month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'this_month'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  هذا الشهر
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('last_month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'last_month'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  الشهر السابق
                </button>

                {/* اختيار شهر مخصص */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
                  <span className="text-[11px] text-slate-400 font-bold">شهر:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setSelectedMonth(m);
                      handleApplyPreset('custom_month', { month: m, year: selectedYear });
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 border-none outline-none py-1 cursor-pointer"
                  >
                    {monthsList.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('this_year')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'this_year'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-50'
                  }`}
                >
                  هذه السنة ({currentYearNum})
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('last_year')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePreset === 'last_year'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-50'
                  }`}
                >
                  السنة السابقة ({currentYearNum - 1})
                </button>

                {/* اختيار سنة مخصصة */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
                  <span className="text-[11px] text-slate-400 font-bold">سنة:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      setSelectedYear(y);
                      handleApplyPreset('custom_year', { year: y });
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 border-none outline-none py-1 cursor-pointer font-mono"
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. قسم من تاريخ - إلى تاريخ (Custom From/To Range) */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <form onSubmit={handleApplyCustomRange} className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">من:</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">إلى:</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تطبيق</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
