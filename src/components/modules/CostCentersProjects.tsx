import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  FileText,
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react';
import { CostCenter, JournalEntry, ExpenseItem, TreasuryTransaction } from '../../types';
import { saveCostCenters } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { printReportAsPDF } from '../../utils/export';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange, formatFilterPeriodDescription } from '../../utils/dateFilter';
import { formatCurrency, getSystemCurrency } from '../../utils/currency';

interface CostCentersProjectsProps {
  costCenters: CostCenter[];
  journalEntries: JournalEntry[];
  expenses: ExpenseItem[];
  treasuryTxs: TreasuryTransaction[];
  onRefresh: () => void;
  searchQuery: string;
}

export const CostCentersProjects: React.FC<CostCentersProjectsProps> = ({
  costCenters = [],
  journalEntries = [],
  expenses = [],
  treasuryTxs = [],
  onRefresh,
  searchQuery
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
  const [selectedProject, setSelectedProject] = useState<CostCenter | null>(null);

  // تصفية التاريخ بالأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [budget, setBudget] = useState<number>(500000);
  const [status, setStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [description, setDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectEndDate, setProjectEndDate] = useState('2026-12-31');

  const filteredProjects = costCenters.filter(cc => !searchQuery || cc.name.includes(searchQuery) || cc.code.includes(searchQuery) || (cc.manager && cc.manager.includes(searchQuery)));

  const handleOpenAdd = () => {
    setEditingCC(null);
    setCode(`PRJ-${Math.floor(Math.random() * 899 + 100)}`);
    setName('');
    setManager('م. أحمد خالد');
    setBudget(500000);
    setStatus('active');
    setDescription('');
    setProjectStartDate(new Date().toISOString().slice(0, 10));
    setProjectEndDate('2026-12-31');
    setShowModal(true);
  };

  const handleOpenEdit = (cc: CostCenter) => {
    setEditingCC(cc);
    setCode(cc.code);
    setName(cc.name);
    setManager(cc.manager || '');
    setBudget(cc.budget || 500000);
    setStatus(cc.status);
    setDescription(cc.description || '');
    setProjectStartDate(cc.startDate || new Date().toISOString().slice(0, 10));
    setProjectEndDate(cc.endDate || '2026-12-31');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert('يرجى إدخال كود واسم المشروع بنجاح');
      return;
    }

    let updated: CostCenter[];
    if (editingCC) {
      updated = costCenters.map(c => c.id === editingCC.id ? {
        ...c, code, name, manager, budget: Number(budget), status, description, startDate: projectStartDate, endDate: projectEndDate
      } : c);
    } else {
      const newCC: CostCenter = {
        id: `cc_${Date.now()}`, code, name, manager, budget: Number(budget), status, description, startDate: projectStartDate, endDate: projectEndDate
      };
      updated = [...costCenters, newCC];
    }

    saveCostCenters(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingCC ? 'تم تعديل المشروع بنجاح' : 'تم إضافة مركز التكلفة / المشروع بنجاح', 'success');
  };

  const handleDelete = (id: string, nm: string) => {
    customConfirm(`هل أنت متأكد من حذف مركز التكلفة "${nm}"؟`, () => {
      saveCostCenters(costCenters.filter(c => c.id !== id));
      onRefresh();
      customAlert('تم الحذف بنجاح', 'success');
    }, 'تأكيد حذف مركز التكلفة');
  };

  // حساب تفاصيل وربحية المشروع حسب الطلب (Revenues, Expenses, Profitability) مع تطبيق فلترة الفترة
  const calculateProjectDetails = (cc: CostCenter) => {
    let totalRevenues = 0;
    let totalExpenses = 0;
    const details: { date: string; ref: string; description: string; type: 'revenue' | 'expense'; amount: number }[] = [];

    // من القيود المحاسبية
    (journalEntries || []).forEach(entry => {
      if (!entry || entry.isPosted === false) return;
      if (!isDateInRange(entry.date, startDate, endDate)) return;

      (entry.lines || []).forEach(line => {
        if (!line) return;
        if (line.costCenterId === cc.id) {
          if (line.credit > 0 && ((line.accountName && line.accountName.includes('إيراد')) || (line.accountId && line.accountId.includes('401')))) {
            totalRevenues += Number(line.credit) || 0;
            details.push({ date: entry.date, ref: entry.entryNumber, description: line.description || entry.description, type: 'revenue', amount: line.credit });
          } else if (line.debit > 0 && ((line.accountName && (line.accountName.includes('مصروف') || line.accountName.includes('تكاليف'))) || (line.accountId && line.accountId.includes('50')))) {
            totalExpenses += Number(line.debit) || 0;
            details.push({ date: entry.date, ref: entry.entryNumber, description: line.description || entry.description, type: 'expense', amount: line.debit });
          }
        }
      });
    });

    // من شيت المصروفات المباشرة
    (expenses || []).forEach(exp => {
      if (!exp) return;
      if (!isDateInRange(exp.date, startDate, endDate)) return;

      if (exp.costCenterId === cc.id) {
        const alreadyCounted = details.some(d => d.description === exp.description && d.amount === exp.totalWithTax);
        if (!alreadyCounted) {
          totalExpenses += Number(exp.totalWithTax) || 0;
          details.push({ date: exp.date, ref: exp.receiptNumber || 'EXP', description: `${exp.category}: ${exp.description}`, type: 'expense', amount: exp.totalWithTax });
        }
      }
    });

    const netProfit = totalRevenues - totalExpenses;
    const budgetUtilization = cc.budget ? (totalExpenses / cc.budget) * 100 : 0;

    return { totalRevenues, totalExpenses, netProfit, budgetUtilization, details: details.sort((a, b) => b.date.localeCompare(a.date)) };
  };

  // طباعة تفاصيل مشروع حسب الطلب (Print Project Details on Demand)
  const handlePrintProjectDemand = (cc: CostCenter) => {
    const stats = calculateProjectDetails(cc);
    let rowsHtml = '';
    stats.details.forEach((d, idx) => {
      rowsHtml += `
        <tr>
          <td class="text-center font-mono">${idx + 1}</td>
          <td class="text-center font-mono">${d.date}</td>
          <td class="text-center font-bold">${d.ref}</td>
          <td>${d.description}</td>
          <td class="text-center font-bold">${d.type === 'revenue' ? 'إيراد مشروع' : 'مصروف وتكلفة'}</td>
          <td class="text-center font-mono font-extrabold ${d.type === 'revenue' ? 'text-green' : 'text-red'}">${d.amount.toLocaleString()} ر.س</td>
        </tr>
      `;
    });

    const htmlContent = `
      <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 2px solid #1e3a8a;">
        <h3 style="margin-top:0; color:#1e3a8a; font-size: 20px;">مشروع / مركز تكلفة: ${cc.name}</h3>
        <table style="margin: 15px 0 0 0; border: none;">
          <tr style="background: transparent !important;">
            <td style="border: none;"><strong>كود المشروع:</strong> ${cc.code}</td>
            <td style="border: none;"><strong>المدير المسؤول:</strong> ${cc.manager || 'غير محدد'}</td>
            <td style="border: none;"><strong>الميزانية المعتمدة:</strong> ${formatCurrency(cc.budget || 0)}</td>
          </tr>
          <tr style="background: transparent !important;">
            <td style="border: none;"><strong>تاريخ البدء:</strong> ${cc.startDate || '-'}</td>
            <td style="border: none;"><strong>تاريخ الانتهاء:</strong> ${cc.endDate || '-'}</td>
            <td style="border: none;"><strong>الحالة:</strong> ${cc.status === 'active' ? 'قيد التنفيذ' : 'مكتمل'}</td>
          </tr>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 25px; gap: 15px;">
        <div style="flex: 1; background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #10b981;">
          <span style="font-size: 13px; color: #047857;">إجمالي إيرادات المشروع المحققة</span>
          <div style="font-size: 22px; font-weight: bold; color: #065f46; margin-top: 5px;">${formatCurrency(stats.totalRevenues)}</div>
        </div>
        <div style="flex: 1; background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #ef4444;">
          <span style="font-size: 13px; color: #b91c1c;">إجمالي مصروفات وتكاليف المشروع</span>
          <div style="font-size: 22px; font-weight: bold; color: #991b1b; margin-top: 5px;">${formatCurrency(stats.totalExpenses)}</div>
        </div>
        <div style="flex: 1; background: ${stats.netProfit >= 0 ? '#eff6ff' : '#fff1f2'}; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #1e3a8a;">
          <span style="font-size: 13px; color: #1e3a8a;">صافي ربح (خسارة) المشروع</span>
          <div style="font-size: 22px; font-weight: bold; color: ${stats.netProfit >= 0 ? '#1e3a8a' : '#b91c1c'}; margin-top: 5px;">${formatCurrency(stats.netProfit)}</div>
        </div>
      </div>

      <h4 style="margin-bottom: 10px; font-size: 16px; color: #1f2937;">بيان تفصيلي للحركات المالية الخاصة بالمشروع (حسب الطلب):</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">م</th>
            <th style="width: 90px;">التاريخ</th>
            <th style="width: 100px;">رقم المستند</th>
            <th>البيان والشرح</th>
            <th style="width: 110px;">نوع الحركة</th>
            <th style="width: 130px;">المبلغ (${getSystemCurrency()})</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" class="text-center">لا توجد حركات مسجلة لهذا المشروع بعد</td></tr>'}
        </tbody>
      </table>
    `;

    printReportAsPDF(`تقرير تفاصيل مشروع - ${cc.name}`, htmlContent, `نسبة استهلاك الميزانية: ${stats.budgetUtilization.toFixed(1)}%`);
  };

  const exportData = filteredProjects.map(c => {
    const st = calculateProjectDetails(c);
    return {
      'كود المشروع': c.code,
      'اسم المشروع': c.name,
      'المدير المسؤول': c.manager || '-',
      'الميزانية': c.budget,
      'إجمالي الإيرادات': st.totalRevenues,
      'إجمالي التكاليف': st.totalExpenses,
      'صافي الربح': st.netProfit,
      'نسبة استهلاك الميزانية %': `${st.budgetUtilization.toFixed(1)}%`,
      'الحالة': c.status === 'active' ? 'نشط' : 'مكتمل'
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-blue-600" />
            <span>مراكز التكلفة وإدارة المشاريع</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            إدارة المشاريع، ميزانياتها، وطباعة تفاصيل كل مشروع وربحيته ومصروفاته حسب الطلب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer">
            <Plus className="w-5 h-5" />
            <span>إضافة مشروع جديد</span>
          </button>

          <ExportButtons
            title="تقرير مشاريع ومراكز التكلفة للشركة"
            subtitle={formatFilterPeriodDescription(startDate, endDate, 'تقرير شامل لإيرادات وتكاليف المشاريع')}
            data={exportData}
            filename="cost_centers_projects"
          />
        </div>
      </div>

      {/* شريط البحث المتقدم بالأيام والشهور والسنة */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية حركات وتكاليف مراكز التكلفة والمشاريع بالأيام والشهور والسنة"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(cc => {
          const stats = calculateProjectDetails(cc);
          return (
            <div key={cc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">{cc.code}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                    {cc.status === 'active' ? 'قيد التنفيذ فعال' : 'مكتمل'}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 leading-snug">{cc.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cc.description || 'بدون وصف'}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">المدير المسؤول</span>
                    <span className="font-bold text-slate-800">{cc.manager || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الميزانية المعتمدة</span>
                    <span className="font-mono font-bold text-blue-900">{formatCurrency(cc.budget || 0)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">إجمالي الإيرادات:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(stats.totalRevenues)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">إجمالي التكاليف:</span>
                    <span className="font-bold text-red-700">{formatCurrency(stats.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span>صافي ربح المشروع:</span>
                    <span className={stats.netProfit >= 0 ? 'text-blue-900 font-extrabold' : 'text-red-600 font-extrabold'}>{formatCurrency(stats.netProfit)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedProject(cc)}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>تفاصيل المشروع حسب الطلب</span>
                </button>

                <button
                  onClick={() => handlePrintProjectDemand(cc)}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition"
                  title="طباعة تقرير المشروع PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button onClick={() => handleOpenEdit(cc)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(cc.id, cc.name)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة عرض وتفاصيل المشروع حسب الطلب */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-600" />
                  <span>تقرير تفاصيل مشروع حسب الطلب: {selectedProject.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">كود المشروع: {selectedProject.code} | المدير: {selectedProject.manager}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintProjectDemand(selectedProject)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة تقرير المشروع PDF</span>
                </button>
                <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">×</button>
              </div>
            </div>

            {(() => {
              const st = calculateProjectDetails(selectedProject);
              return (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                      <span className="text-xs text-emerald-800 font-bold">إجمالي الإيرادات المحققة</span>
                      <div className="text-xl font-extrabold text-emerald-900 mt-1 font-mono">{formatCurrency(st.totalRevenues)}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                      <span className="text-xs text-red-800 font-bold">إجمالي المصروفات والتكاليف</span>
                      <div className="text-xl font-extrabold text-red-900 mt-1 font-mono">{formatCurrency(st.totalExpenses)}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                      <span className="text-xs text-blue-800 font-bold">صافي ربح المشروع</span>
                      <div className="text-xl font-extrabold text-blue-900 mt-1 font-mono">{formatCurrency(st.netProfit)}</div>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 mb-3">سجل المعاملات والتكاليف والإيرادات الخاصة بالمشروع:</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="py-2.5 px-3">التاريخ</th>
                          <th className="py-2.5 px-3">المرجع</th>
                          <th className="py-2.5 px-3">البيان والشرح</th>
                          <th className="py-2.5 px-3">النوع</th>
                          <th className="py-2.5 px-3 text-center">المبلغ ({getSystemCurrency()})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {st.details.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-slate-400">لا توجد حركات مسجلة لهذا المشروع بعد</td></tr>
                        ) : (
                          st.details.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono">{row.date}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{row.ref}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-bold">{row.description}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.type === 'revenue' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                  {row.type === 'revenue' ? 'إيراد مشروع' : 'تكلفة ومصروف'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-center text-sm">{formatCurrency(row.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedProject(null)} className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإضافة والتعديل */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">{editingCC ? 'تعديل مشروع' : 'إضافة مشروع جديد'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">كود المشروع *</label><input type="text" value={code} onChange={e => setCode(e.target.value)} required className="w-full font-mono bg-slate-50 border rounded-lg p-2.5 text-sm font-bold" /></div>
                <div><label className="block text-xs font-bold mb-1">المدير المسؤول</label><input type="text" value={manager} onChange={e => setManager(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2.5 text-sm" /></div>
              </div>
              <div><label className="block text-xs font-bold mb-1">اسم المشروع / مركز التكلفة *</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">الميزانية المعتمدة (ر.س)</label><input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full font-mono bg-slate-50 border rounded-lg p-2.5 font-bold text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">الحالة</label><select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold"><option value="active">قيد التنفيذ فعال</option><option value="completed">مكتمل</option><option value="on_hold">متوقف مؤقتاً</option></select></div>
              </div>
              <div><label className="block text-xs font-bold mb-1">وصف المشروع</label><textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs"></textarea></div>
              <div className="flex justify-end gap-2 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm">إلغاء</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">حفظ</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
