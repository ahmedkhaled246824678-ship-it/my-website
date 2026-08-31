import React, { useState, useMemo } from 'react';
import { Scale, FileText, PieChart, Receipt, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import { Account, JournalEntry, ExpenseItem } from '../../types';
import { calculateTrialBalance, calculateIncomeStatement, calculateBalanceSheet, calculateTaxReport } from '../../utils/accounting';
import { ExportButtons } from '../common/ExportButtons';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { formatFilterPeriodDescription } from '../../utils/dateFilter';

interface FinancialReportsModuleProps {
  accounts: Account[];
  entries: JournalEntry[];
  expenses: ExpenseItem[];
  fiscalYear: string;
}

export const FinancialReportsModule: React.FC<FinancialReportsModuleProps> = ({
  accounts = [],
  entries = [],
  expenses = [],
  fiscalYear = '2026'
}) => {
  const [activeTab, setActiveTab] = useState<'trial_balance' | 'income_statement' | 'balance_sheet' | 'vat_report'>('trial_balance');

  // تصفية التاريخ والأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  // حساب القوائم والتقارير المالية بناءً على الفترة الزمنية المحددة
  const trialBalance = useMemo(() => {
    return calculateTrialBalance(accounts, entries, startDate || undefined, endDate || undefined);
  }, [accounts, entries, startDate, endDate]);

  const incomeStatement = useMemo(() => {
    return calculateIncomeStatement(accounts, entries, startDate || undefined, endDate || undefined);
  }, [accounts, entries, startDate, endDate]);

  const balanceSheet = useMemo(() => {
    return calculateBalanceSheet(accounts, incomeStatement.netProfit);
  }, [accounts, incomeStatement.netProfit]);

  const taxReport = useMemo(() => {
    return calculateTaxReport(entries, expenses, startDate || undefined, endDate || undefined);
  }, [entries, expenses, startDate, endDate]);

  const currentPeriodSubtitle = formatFilterPeriodDescription(startDate, endDate, `السنة المالية: ${fiscalYear === 'all' ? 'جميع السنوات' : fiscalYear}`);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* شريط العنوان واختيار القائمة */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
              <Scale className="w-6 h-6" />
              <span>القوائم المالية والحسابات الختامية والضرائب</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              التقارير المحاسبية الرسمية المعتمدة وفق معايير المحاسبة: ميزان المراجعة، قائمة الدخل، المركز المالي، وإقرار القيمة المضافة.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 px-2 font-bold">السنة المالية:</span>
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono">{fiscalYear === 'all' ? 'جميع السنوات' : fiscalYear}</span>
          </div>
        </div>

        {/* أزرار التبويب الرئيسية */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          <button
            onClick={() => setActiveTab('trial_balance')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'trial_balance'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ميزان المراجعة الشامل</span>
          </button>

          <button
            onClick={() => setActiveTab('income_statement')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'income_statement'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>قائمة الدخل (الأرباح والخسائر)</span>
          </button>

          <button
            onClick={() => setActiveTab('balance_sheet')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'balance_sheet'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>المركز المالي (الميزانية)</span>
          </button>

          <button
            onClick={() => setActiveTab('vat_report')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'vat_report'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>الضرائب المستحقة (VAT)</span>
          </button>
        </div>
      </div>

      {/* شريط البحث المتقدم بالايام والشهور والسنة ومن تاريخ إلى تاريخ */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية القوائم المالية والتقارير بالأيام والشهور والسنة"
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

      {/* محتوى ميزان المراجعة */}
      {activeTab === 'trial_balance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>ميزان المراجعة بالمجاميع والأرصدة (Trial Balance)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">يعرض الأرصدة الافتتاحية، حركات المدين والدائن خلال الفترة، والأرصدة الختامية</p>
            </div>
            <ExportButtons
              title="ميزان المراجعة بالمجاميع والأرصدة"
              subtitle={`${currentPeriodSubtitle} - تقرير شامل لكافة حسابات الأستاذ العام`}
              data={trialBalance.rows.map(r => ({
                'رقم الحساب': r.code,
                'اسم الحساب': r.name,
                'نوع الحساب': r.type === 'asset' ? 'أصل' : r.type === 'liability' ? 'التزام' : r.type === 'equity' ? 'ملكية' : r.type === 'revenue' ? 'إيراد' : 'مصروف',
                'افتتاحي مدين': r.initialDebit,
                'افتتاحي دائن': r.initialCredit,
                'حركة مدين': r.movementDebit,
                'حركة دائن': r.movementCredit,
                'ختامي مدين': r.endingDebit,
                'ختامي دائن': r.endingCredit
              }))}
              filename="trial_balance_report"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 font-bold" rowSpan={2}>كود الحساب</th>
                  <th className="py-3 px-3 font-bold" rowSpan={2}>اسم الحساب في دليل الأستاذ</th>
                  <th className="py-3 px-3 font-bold text-center border-r border-slate-200" colSpan={2}>الرصيد الافتتاحي</th>
                  <th className="py-3 px-3 font-bold text-center border-r border-slate-200 bg-blue-50/50" colSpan={2}>حركة الفترة (المجاميع)</th>
                  <th className="py-3 px-3 font-bold text-center border-r border-slate-200 bg-emerald-50/50" colSpan={2}>الرصيد الختامي (الأرصدة)</th>
                </tr>
                <tr className="border-t border-slate-200 text-[11px]">
                  <th className="py-2 px-2 text-center text-slate-600 border-r border-slate-200">مدين</th>
                  <th className="py-2 px-2 text-center text-slate-600">دائن</th>
                  <th className="py-2 px-2 text-center text-blue-800 border-r border-slate-200 bg-blue-50/50">مدين</th>
                  <th className="py-2 px-2 text-center text-blue-800 bg-blue-50/50">دائن</th>
                  <th className="py-2 px-2 text-center text-emerald-800 border-r border-slate-200 bg-emerald-50/50">مدين</th>
                  <th className="py-2 px-2 text-center text-emerald-800 bg-emerald-50/50">دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {trialBalance.rows.map(r => (
                  <tr key={r.accountId} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{r.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.name}</td>
                    <td className="py-2.5 px-2 text-center font-mono border-r border-slate-100">{r.initialDebit ? r.initialDebit.toLocaleString() : '-'}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{r.initialCredit ? r.initialCredit.toLocaleString() : '-'}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700 font-bold border-r border-slate-100 bg-blue-50/20">{r.movementDebit ? r.movementDebit.toLocaleString() : '-'}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700 font-bold bg-blue-50/20">{r.movementCredit ? r.movementCredit.toLocaleString() : '-'}</td>
                    <td className="py-2.5 px-2 text-center font-mono font-extrabold text-emerald-800 border-r border-slate-100 bg-emerald-50/30">{r.endingDebit ? r.endingDebit.toLocaleString() : '-'}</td>
                    <td className="py-2.5 px-2 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50/30">{r.endingCredit ? r.endingCredit.toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-extrabold text-xs">
                <tr>
                  <td className="py-3 px-3 text-center" colSpan={2}>الإجمالي العام لميزان المراجعة</td>
                  <td className="py-3 px-2 text-center font-mono border-r border-slate-700">{trialBalance.totalInitialDebit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center font-mono">{trialBalance.totalInitialCredit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center font-mono text-blue-300 border-r border-slate-700">{trialBalance.totalMovementDebit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center font-mono text-blue-300">{trialBalance.totalMovementCredit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center font-mono text-emerald-400 border-r border-slate-700">{trialBalance.totalEndingDebit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center font-mono text-emerald-400">{trialBalance.totalEndingCredit.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-3 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ميزان المراجعة متزن تماماً: إجمالي الأرصدة الختامية المدينة يساوي الدائنة ({trialBalance.totalEndingDebit.toLocaleString()} ر.س)</span>
            </div>
          </div>
        </div>
      )}

      {/* محتوى قائمة الدخل */}
      {activeTab === 'income_statement' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>قائمة الدخل - بيان الأرباح والخسائر (Income Statement)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">ملخص الإيرادات التشغيلية، تكاليف النشاط، مجمل الربح وصافي الربح النهائي</p>
            </div>
            <ExportButtons
              title="قائمة الدخل وبيان الأرباح والخسائر"
              subtitle={`${currentPeriodSubtitle} - ملخص الإيرادات والمصروفات وصافي الربح`}
              data={[
                ...incomeStatement.operatingRevenues.map(r => ({ البند: r.name, التصنيف: 'إيرادات تشغيلية', المبلغ: r.amount })),
                ...incomeStatement.otherRevenues.map(r => ({ البند: r.name, التصنيف: 'إيرادات أخرى', المبلغ: r.amount })),
                ...incomeStatement.operatingExpenses.map(r => ({ البند: r.name, التصنيف: 'مصروفات وتكاليف تشغيلية', المبلغ: r.amount })),
                ...incomeStatement.adminExpenses.map(r => ({ البند: r.name, التصنيف: 'مصروفات إدارية وعمومية', المبلغ: r.amount })),
                ...incomeStatement.marketingExpenses.map(r => ({ البند: r.name, التصنيف: 'مصروفات تسويق وبيعية', المبلغ: r.amount })),
                { البند: 'مجمل الربح (Gross Profit)', التصنيف: 'نتيجة مرحلية', المبلغ: incomeStatement.grossProfit },
                { البند: 'صافي الربح أو الخسارة النهائي (Net Profit)', التصنيف: 'النتيجة النهائية', المبلغ: incomeStatement.netProfit }
              ]}
              filename="income_statement_report"
            />
          </div>

          <div className="p-6 space-y-6 text-sm">
            {/* 1. الإيرادات */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-extrabold text-slate-800 flex justify-between border-b border-slate-200">
                <span>أولاً: الإيرادات التشغيلية والأخرى (Revenues)</span>
                <span className="text-emerald-700 font-mono">{incomeStatement.totalRevenues.toLocaleString()} ر.س</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 space-y-1">
                {incomeStatement.operatingRevenues.map((r, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-1.5 text-xs text-slate-700 font-medium">
                    <span>{r.name}</span>
                    <span className="font-mono font-bold text-emerald-600">{r.amount.toLocaleString()} ر.س</span>
                  </div>
                ))}
                {incomeStatement.otherRevenues.map((r, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-1.5 text-xs text-slate-700 font-medium">
                    <span>{r.name} <span className="text-[10px] text-slate-400">(إيراد متنوع)</span></span>
                    <span className="font-mono font-bold text-emerald-600">{r.amount.toLocaleString()} ر.س</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. المصروفات التشغيلية ومجمل الربح */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-extrabold text-slate-800 flex justify-between border-b border-slate-200">
                <span>ثانياً: المصروفات والتكاليف التشغيلية المباشرة (Operating Expenses)</span>
                <span className="text-red-700 font-mono">-{incomeStatement.totalOperatingExpenses.toLocaleString()} ر.س</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 space-y-1">
                {incomeStatement.operatingExpenses.map((r, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-1.5 text-xs text-slate-700 font-medium">
                    <span>{r.name}</span>
                    <span className="font-mono font-bold text-red-600">{r.amount.toLocaleString()} ر.س</span>
                  </div>
                ))}
              </div>
            </div>

            {/* شريط مجمل الربح */}
            <div className="bg-blue-900 text-white p-4 rounded-xl flex items-center justify-between font-extrabold shadow-md">
              <span className="text-base">مجمل الربح التشغيلي (Gross Profit):</span>
              <span className="text-xl font-mono text-emerald-300">{incomeStatement.grossProfit.toLocaleString()} ر.س</span>
            </div>

            {/* 3. المصروفات الإدارية والعمومية والتسويقية */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-extrabold text-slate-800 flex justify-between border-b border-slate-200">
                <span>ثالثاً: المصروفات الإدارية والعمومية والتسويق (Admin & Marketing)</span>
                <span className="text-red-700 font-mono">-{(incomeStatement.totalAdminExpenses + incomeStatement.totalMarketingExpenses).toLocaleString()} ر.س</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 space-y-1">
                {incomeStatement.adminExpenses.map((r, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-1.5 text-xs text-slate-700 font-medium">
                    <span>{r.name} <span className="text-[10px] text-slate-400">(عمومي وإداري)</span></span>
                    <span className="font-mono font-bold text-red-600">{r.amount.toLocaleString()} ر.س</span>
                  </div>
                ))}
                {incomeStatement.marketingExpenses.map((r, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-1.5 text-xs text-slate-700 font-medium">
                    <span>{r.name} <span className="text-[10px] text-slate-400">(تسويق ومبيعات)</span></span>
                    <span className="font-mono font-bold text-red-600">{r.amount.toLocaleString()} ر.س</span>
                  </div>
                ))}
              </div>
            </div>

            {/* النتيجة النهائية صافي الربح */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between font-extrabold shadow-xl border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🏆</div>
                <div>
                  <div className="text-sm text-emerald-200 font-bold">النتيجة النهائية لقائمة الدخل</div>
                  <div className="text-lg">صافي الربح (الخسارة) للفترة الحالية (Net Profit)</div>
                </div>
              </div>
              <div className="text-3xl font-mono font-black text-amber-300 mt-3 sm:mt-0">
                {incomeStatement.netProfit.toLocaleString()} <span className="text-sm font-normal text-white">ر.س</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* محتوى الميزانية العمومية */}
      {activeTab === 'balance_sheet' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-600" />
                <span>قائمة المركز المالي - الميزانية العمومية (Balance Sheet)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">المعادلة المحاسبية: إجمالي الأصول = إجمالي الالتزامات + حقوق الملكية</p>
            </div>
            <ExportButtons
              title="قائمة المركز المالي والميزانية العمومية"
              subtitle={`${currentPeriodSubtitle} - مقارنة الأصول والخصوم وحقوق الملكية`}
              data={[
                ...balanceSheet.currentAssets.map(r => ({ البند: r.name, التصنيف: 'أصول متداولة', المبلغ: r.amount })),
                ...balanceSheet.fixedAssets.map(r => ({ البند: r.name, التصنيف: 'أصول ثابتة', المبلغ: r.amount })),
                { البند: 'إجمالي الأصول (Total Assets)', التصنيف: 'مجاميع الأصول', المبلغ: balanceSheet.totalAssets },
                ...balanceSheet.currentLiabilities.map(r => ({ البند: r.name, التصنيف: 'التزامات متداولة', المبلغ: r.amount })),
                ...balanceSheet.longTermLiabilities.map(r => ({ البند: r.name, التصنيف: 'التزامات طويلة الأجل', المبلغ: r.amount })),
                ...balanceSheet.equityItems.map(r => ({ البند: r.name, التصنيف: 'حقوق الملكية', المبلغ: r.amount })),
                { البند: 'إجمالي الالتزامات وحقوق الملكية', التصنيف: 'مجاميع الخصوم والملكية', المبلغ: balanceSheet.totalLiabilitiesAndEquity }
              ]}
              filename="balance_sheet_report"
            />
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* الجانب الأيمن: الأصول */}
            <div className="space-y-4">
              <div className="bg-blue-900 text-white p-3 rounded-xl font-extrabold flex justify-between items-center shadow-md">
                <span>جانب الأصول والممتلكات (Assets)</span>
                <span className="font-mono text-blue-200 text-base">{balanceSheet.totalAssets.toLocaleString()} ر.س</span>
              </div>

              {/* الأصول المتداولة */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-xs text-blue-800 border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>الأصول المتداولة (النقدية، البنوك، العملاء، المخزون)</span>
                  <span className="font-mono">{balanceSheet.totalCurrentAssets.toLocaleString()}</span>
                </div>
                {balanceSheet.currentAssets.map((r, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700 px-1 py-1">
                    <span>{r.name}</span>
                    <span className="font-mono font-bold text-slate-900">{r.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* الأصول الثابتة */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-xs text-blue-800 border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>الأصول الثابتة الرأسمالية (بالصافي الدفتري)</span>
                  <span className="font-mono">{balanceSheet.totalFixedAssets.toLocaleString()}</span>
                </div>
                {balanceSheet.fixedAssets.map((r, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700 px-1 py-1">
                    <span>{r.name}</span>
                    <span className="font-mono font-bold text-slate-900">{r.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-300 p-4 rounded-xl flex justify-between items-center font-extrabold text-blue-950">
                <span>إجمالي الأصول العام:</span>
                <span className="font-mono text-lg text-blue-800">{balanceSheet.totalAssets.toLocaleString()} ر.س</span>
              </div>
            </div>

            {/* الجانب الأيسر: الالتزامات وحقوق الملكية */}
            <div className="space-y-4">
              <div className="bg-amber-950 text-white p-3 rounded-xl font-extrabold flex justify-between items-center shadow-md">
                <span>الالتزامات وحقوق الملكية (Liabilities & Equity)</span>
                <span className="font-mono text-amber-200 text-base">{balanceSheet.totalLiabilitiesAndEquity.toLocaleString()} ر.س</span>
              </div>

              {/* الالتزامات المتداولة */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-xs text-amber-900 border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>الالتزامات والخصوم المتداولة (الموردون، الضرائب، المستحقات)</span>
                  <span className="font-mono">{balanceSheet.totalCurrentLiabilities.toLocaleString()}</span>
                </div>
                {balanceSheet.currentLiabilities.map((r, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700 px-1 py-1">
                    <span>{r.name}</span>
                    <span className="font-mono font-bold text-red-600">{r.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* حقوق الملكية */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-xs text-emerald-900 border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>حقوق الملكية ورأس المال والأرباح المبقاة</span>
                  <span className="font-mono">{balanceSheet.totalEquity.toLocaleString()}</span>
                </div>
                {balanceSheet.equityItems.map((r, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700 px-1 py-1">
                    <span className={r.name.includes('الفترة الحالية') ? 'font-extrabold text-emerald-800' : ''}>{r.name}</span>
                    <span className="font-mono font-bold text-emerald-700">{r.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex justify-between items-center font-extrabold text-amber-950">
                <span>إجمالي الالتزامات وحقوق الملكية:</span>
                <span className="font-mono text-lg text-amber-800">{balanceSheet.totalLiabilitiesAndEquity.toLocaleString()} ر.س</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* محتوى الضرائب المستحقة */}
      {activeTab === 'vat_report' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-600" />
                <span>إقرار ضريبة القيمة المضافة والمستحق للدفع (VAT Report)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">ضريبة المبيعات المحصلة ناقص ضريبة المشتريات المدفوعة على المصروفات والقيود</p>
            </div>
            <ExportButtons
              title="إقرار ضريبة القيمة المضافة (VAT Report)"
              subtitle={`${currentPeriodSubtitle} - تفاصيل ضريبة المبيعات والمشتريات وصافي المستحق للزكاة`}
              data={taxReport.details.map(d => ({
                'التاريخ': d.date,
                'رقم الفاتورة / القيد': d.reference,
                'البيان والتفاصيل': d.description,
                'نوع الضريبة': d.type === 'output' ? 'ضريبة مبيعات محصلة (+)' : 'ضريبة مشتريات مستردة (-)',
                'قيمة الضريبة (ر.س)': d.amount
              }))}
              filename="vat_tax_report"
            />
          </div>

          <div className="p-6 space-y-6">
            {/* ملخص الضريبة الكبير */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
                <div className="text-xs text-blue-800 font-bold">إجمالي ضريبة المبيعات المحصلة (Output VAT)</div>
                <div className="text-2xl font-black text-blue-900 font-mono mt-1">{taxReport.outputVatRevenues.toLocaleString()} <span className="text-xs font-normal">ر.س</span></div>
                <div className="text-[10px] text-blue-600 mt-1">المستحق على إيرادات وفواتير مبيعات الشركة</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                <div className="text-xs text-amber-800 font-bold">إجمالي ضريبة المشتريات المستردة (Input VAT)</div>
                <div className="text-2xl font-black text-amber-900 font-mono mt-1">{taxReport.inputVatExpenses.toLocaleString()} <span className="text-xs font-normal">ر.س</span></div>
                <div className="text-[10px] text-amber-600 mt-1">المدفوع على المصروفات ومشتريات ومواد المشاريع</div>
              </div>
              <div className={`p-5 rounded-2xl border ${taxReport.netTaxPayable >= 0 ? 'bg-red-50 border-red-300 text-red-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
                <div className="text-xs font-bold">صافي الضريبة المستحقة للدفع لهيئة الزكاة والضريبة</div>
                <div className="text-3xl font-black font-mono mt-1">{taxReport.netTaxPayable.toLocaleString()} <span className="text-xs font-normal">ر.س</span></div>
                <div className="text-[10px] mt-1 font-semibold">
                  {taxReport.netTaxPayable >= 0 ? '⚠️ مبلغ مستحق الدفع للهيئة عند تقديم الإقرار الربع سنوي' : '✅ رصيد دائن مسترد من الهيئة لصالح الشركة'}
                </div>
              </div>
            </div>

            {/* جدول تفاصيل الحركات الضريبية */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 font-bold text-xs text-slate-800 border-b border-slate-200">
                سجل الحركات والفواتير المؤثرة في حساب ضريبة القيمة المضافة ({taxReport.details.length})
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">التاريخ</th>
                      <th className="py-2.5 px-3 font-bold">رقم الفاتورة / القيد</th>
                      <th className="py-2.5 px-3 font-bold">البيان</th>
                      <th className="py-2.5 px-3 font-bold text-center">نوع الحركة الضريبية</th>
                      <th className="py-2.5 px-3 font-bold text-center">قيمة الضريبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {taxReport.details.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono">{d.date}</td>
                        <td className="py-2 px-3 font-mono font-bold">{d.reference}</td>
                        <td className="py-2 px-3">{d.description}</td>
                        <td className="py-2 px-3 text-center">
                          {d.type === 'output' ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">ضريبة مبيعات (+ محصلة)</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">ضريبة مشتريات (- مستردة)</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-sm">
                          <span className={d.type === 'output' ? 'text-blue-800' : 'text-amber-800'}>{d.amount.toLocaleString()} ر.س</span>
                        </td>
                      </tr>
                    ))}
                    {taxReport.details.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">لا توجد حركات ضريبية مسجلة خلال هذه الفترة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
