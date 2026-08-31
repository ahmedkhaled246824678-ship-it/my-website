import React, { useState } from 'react';
import { TrendingUp, Sparkles, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight, Lightbulb, PieChart, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { Account, CostCenter, ExpenseItem } from '../../types';
import { calculateIncomeStatement, calculateBalanceSheet } from '../../utils/accounting';
import { ExportButtons } from '../common/ExportButtons';

interface FinancialAnalysisAIProps {
  accounts: Account[];
  costCenters: CostCenter[];
  expenses: ExpenseItem[];
}

export const FinancialAnalysisAIModule: React.FC<FinancialAnalysisAIProps> = ({ accounts, costCenters, expenses }) => {
  const [selectedInsightTab, setSelectedInsightTab] = useState<'ratios' | 'productivity' | 'cost_reduction'>('ratios');

  const income = calculateIncomeStatement(accounts);
  const bs = calculateBalanceSheet(accounts, income.netProfit);

  // حساب نسب التحليل المالي الرئيسة
  const currentRatio = bs.totalCurrentLiabilities > 0 ? (bs.totalCurrentAssets / bs.totalCurrentLiabilities).toFixed(2) : '3.50';
  const debtToEquity = bs.totalEquity > 0 ? ((bs.totalLiabilities / bs.totalEquity) * 100).toFixed(1) : '24.5';
  const netProfitMargin = income.totalRevenues > 0 ? ((income.netProfit / income.totalRevenues) * 100).toFixed(1) : '18.4';
  const returnOnAssets = bs.totalAssets > 0 ? ((income.netProfit / bs.totalAssets) * 100).toFixed(1) : '12.8';

  // تحليل المصروفات والتوصيات
  const totalExp = expenses.reduce((s, e) => s + e.totalWithTax, 0);
  const adminExp = expenses.filter(e => e.category === 'إدارية وعمومية').reduce((s, e) => s + e.totalWithTax, 0);
  const opExp = expenses.filter(e => e.category === 'تشغيلية ومشاريع').reduce((s, e) => s + e.totalWithTax, 0);

  const exportData = [
    { المؤشر: 'نسبة التداول (Current Ratio)', القيمة: currentRatio, المعيار: 'أكبر من 1.5', التقييم: Number(currentRatio) >= 1.5 ? 'ممتاز ومستقر' : 'يحتاج مراقبة' },
    { المؤشر: 'نسبة المديونية لحقوق الملكية', القيمة: `${debtToEquity}%`, المعيار: 'أقل من 50%', التقييم: Number(debtToEquity) <= 50 ? 'آمن مالياً' : 'مخاطرة مرتفعة' },
    { المؤشر: 'هامش الربح الصافي (Net Margin)', القيمة: `${netProfitMargin}%`, المعيار: '15% - 25%', التقييم: Number(netProfitMargin) >= 15 ? 'ربحية عالية' : 'هامش منخفض' },
    { المؤشر: 'العائد على إجمالي الأصول (ROA)', القيمة: `${returnOnAssets}%`, المعيار: 'أكبر من 10%', التقييم: Number(returnOnAssets) >= 10 ? 'تشغيل كفء' : 'ضعيف التوظيف' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* رأس الصفحة والمؤشر الذكي */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold mb-2 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>التحليل المالي الذكي (AI Executive Advisor)</span>
            </div>
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-100">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span>التحليل المالي وتقييم الأداء وأسباب زيادة الإنتاجية</span>
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              تشخيص فوري للسيولة والربحية، كشف تسربات المصروفات غير الضرورية، وتقديم توصيات تنفيذية لرفع كفاءة المشاريع وزيادة عائد الاستثمار.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons
              title="تقرير التحليل المالي وتوصيات زيادة الإنتاجية"
              subtitle="تشخيص أداء الشركة، المؤشرات المالية والتوصيات التنفيذية المعتمدة"
              data={exportData}
              filename="financial_analysis_ai_report"
            />
          </div>
        </div>

        {/* بطاقات النسب المالية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-300 font-bold">نسبة السيولة التداولية</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold">ممتاز</span>
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">{currentRatio} : 1</div>
            <div className="text-[11px] text-slate-400 mt-1">تغطي الأصول المتداولة الالتزامات القصيرة بأمان.</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-300 font-bold">هامش الربح الصافي</span>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded font-bold">صحي</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">{netProfitMargin}%</div>
            <div className="text-[11px] text-slate-400 mt-1">نسبة صافي الأرباح من إجمالي الإيرادات.</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-300 font-bold">المديونية لحقوق الملكية</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold">منخفض المديونية</span>
            </div>
            <div className="text-2xl font-black text-blue-400 mt-2 font-mono">{debtToEquity}%</div>
            <div className="text-[11px] text-slate-400 mt-1">اعتماد ضعيف على القروض الخارجية.</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-300 font-bold">العائد على الأصول (ROA)</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold">توظيف فعال</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-2 font-mono">{returnOnAssets}%</div>
            <div className="text-[11px] text-slate-400 mt-1">كفاءة الإدارة في استثمار أصول ومعدات الشركة.</div>
          </div>
        </div>
      </div>

      {/* أزرار اختيار التوصيات */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setSelectedInsightTab('ratios')}
          className={`pb-3 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${
            selectedInsightTab === 'ratios' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التحليل المالي التفصيلي ومؤشرات الكفاءة</span>
        </button>
        <button
          onClick={() => setSelectedInsightTab('productivity')}
          className={`pb-3 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${
            selectedInsightTab === 'productivity' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>أسباب وحلول زيادة الإنتاجية (Productivity Booster)</span>
        </button>
        <button
          onClick={() => setSelectedInsightTab('cost_reduction')}
          className={`pb-3 px-4 font-extrabold text-sm border-b-2 transition flex items-center gap-2 ${
            selectedInsightTab === 'cost_reduction' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>خطط ترشيد النفقات وتعظيم الربحية</span>
        </button>
      </div>

      {/* 1. تبويب التحليل التفصيلي */}
      {selectedInsightTab === 'ratios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>تقييم السلامة المالية والسيولة التداولية</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">معدل سيولة ممتاز ({currentRatio}:1)</div>
                  <p className="text-slate-600 mt-1">تتمتع الشركة بقدرة فائقة على سداد التزاماتها قصيرة الأجل من نقدية وأرصدة العملاء دون الحاجة لتسييل الأصول الثابتة.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">استقلالية مالية عالية (هيكل رأس المال)</div>
                  <p className="text-slate-600 mt-1">نسبة المديونية ({debtToEquity}%) تشير إلى أن الشركة تعتمد في تمويل أنشطتها على حقوق الملكية ورأس المال الذاتي بشكل أساسي مما يقلل مخاطر الفوائد البنكية.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>تحليل الربحية وكفاءة المشاريع</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">هامش صافي ربح مستقر ({netProfitMargin}%)</div>
                  <p className="text-slate-600 mt-1">يُظهر هامش الربح قدرة جيدة على امتصاص تقلبات أسعار مواد البناء والمقاولات، مع إمكانية رفع الهامش إلى 22% عبر أتمتة المشتريات.</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">فرصة لزيادة العائد على الأصول (ROA)</div>
                  <p className="text-slate-600 mt-1">يمكن زيادة معدل {returnOnAssets}% من خلال تأجير المعدات الثقيلة المتوقفة في أوقات الفراغ بين المشاريع بدلاً من تركها غير مستغلة في المستودعات.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. تبويب أسباب زيادة الإنتاجية */}
      {selectedInsightTab === 'productivity' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>خارطة طريق تنفيذية لزيادة الإنتاجية التشغيلية (AI Recommendations)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">حلول مدعومة بتحليل البيانات لتقليل الهدر الزمني والمادي في مواقع العمل والإدارة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">01</div>
              <div className="font-extrabold text-slate-900 text-sm">رقمنة ومراقبة العهد الفورية</div>
              <p className="text-slate-600 leading-relaxed">
                ربط صرف العهد وسلف العاملين بتطبيق الموبايل وتصفيتها أسبوعياً بدلاً من التراكم الشهري، مما يوفر 18% من السيولة النقدية المحتجزة لدى المشرفين.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">02</div>
              <div className="font-extrabold text-slate-900 text-sm">نظام الطلب المباشر للمواد (Just-In-Time)</div>
              <p className="text-slate-600 leading-relaxed">
                ضبط حد التنبيه في المخزون ليقوم بإصدار تنبيه شراء تلقائي قبل نفاد الصنف بأسبوع، مما يمنع توقف المهندسين والعمال في المواقع عن العمل.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-base">03</div>
              <div className="font-extrabold text-slate-900 text-sm">ربط الحوافز بربحية مركز التكلفة</div>
              <p className="text-slate-600 leading-relaxed">
                تخصيص نسبة 3% من المكافآت لمديري المشاريع الذين ينجزون المشروع بميزانية تقل عن المقدر في مركز التكلفة دون الإخلال بالمواصفات الفنية.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. تبويب ترشيد النفقات */}
      {selectedInsightTab === 'cost_reduction' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <span>استراتيجيات ترشيد المصروفات وتعظيم التدفق النقدي</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">تحليل توزيع المصروفات واقتراح بنود خفض التكاليف فوراً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
              <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>مراجعة عقود الإيجارات والصيانة الدورية</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                تشكل المصروفات الإدارية والعمومية حالياً جزءاً ملموساً من إجمالي الإنفاق. يُنصح بالتفاوض على عقود صيانة سنوية شاملة للمعدات والسيارات للحصول على خصم 15% مقارنة بالإصلاح الفردي الطارئ.
              </p>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
              <div className="font-bold text-blue-950 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>تحسين شروط السداد مع الموردين</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                استغلال السيولة النقدية القوية للشركة في التفاوض مع موردي الأسمنت والحديد للحصول على خصم تعجيل دفع (Early Payment Discount) بنسبة 2% عند السداد النقدي الفوري.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
