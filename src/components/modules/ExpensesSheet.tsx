import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Building
} from 'lucide-react';
import { ExpenseItem, CostCenter, CompanySettings, UserAccount } from '../../types';
import { saveExpenses } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { Language, t } from '../../utils/i18n';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange, formatFilterPeriodDescription } from '../../utils/dateFilter';

interface ExpensesSheetProps {
  expenses: ExpenseItem[];
  costCenters: CostCenter[];
  settings?: CompanySettings;
  currentUser?: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const ExpensesSheet: React.FC<ExpensesSheetProps> = ({
  expenses,
  costCenters,
  settings,
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExp, setEditingExp] = useState<ExpenseItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // تصفية التاريخ بالأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  const canAdd = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canAdd !== false) : true;
  const canEdit = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canEdit !== false) : true;
  const canDelete = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canDelete !== false) : true;
  const canExport = currentUser ? (currentUser.role === 'admin' || currentUser.permissions?.canExport !== false) : true;

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('مصروفات تشغيلية ومشاريع');
  const [subcategory, setSubcategory] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(15);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'credit'>('bank');
  const [payee, setPayee] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [description, setDescription] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = !searchQuery || e.description.includes(searchQuery) || e.payee.includes(searchQuery) || (e.receiptNumber && e.receiptNumber.includes(searchQuery));
      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
      const matchesDate = isDateInRange(e.date, startDate, endDate);
      return matchesSearch && matchesCat && matchesDate;
    });
  }, [expenses, searchQuery, selectedCategory, startDate, endDate]);

  const totalAmount = useMemo(() => filteredExpenses.reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const totalTax = useMemo(() => filteredExpenses.reduce((s, e) => s + (e.taxAmount || 0), 0), [filteredExpenses]);
  const totalWithTax = useMemo(() => filteredExpenses.reduce((s, e) => s + e.totalWithTax, 0), [filteredExpenses]);

  const handleOpenAdd = () => {
    if (!canAdd) {
      customAlert('ليس لديك صلاحية لإضافة مصروفات جديدة.', 'error');
      return;
    }
    setEditingExp(null);
    setDate(new Date().toISOString().slice(0, 10));
    setCategory('مصروفات تشغيلية ومشاريع');
    setSubcategory('مواد خام ومستلزمات');
    setAmount(0);
    setTaxRate(15);
    setPaymentMethod('bank');
    setPayee('');
    setReceiptNumber(`INV-${Math.floor(Math.random() * 8999 + 1000)}`);
    setCostCenterId(costCenters?.[0]?.id || '');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    if (!canEdit) {
      customAlert('ليس لديك صلاحية لتعديل هذا المصروف.', 'error');
      return;
    }
    setEditingExp(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setSubcategory(exp.subcategory || '');
    setAmount(exp.amount);
    setTaxRate(exp.taxRate || 15);
    setPaymentMethod(exp.paymentMethod);
    setPayee(exp.payee);
    setReceiptNumber(exp.receiptNumber || '');
    setCostCenterId(exp.costCenterId || '');
    setDescription(exp.description);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description.trim()) {
      customAlert('يرجى إدخال المبلغ والبيان', 'error');
      return;
    }

    const txAmt = (Number(amount) * Number(taxRate)) / 100;
    const tot = Number(amount) + txAmt;

    let updated: ExpenseItem[];
    if (editingExp) {
      updated = expenses.map(item => item.id === editingExp.id ? {
        ...item, date, category, subcategory, amount: Number(amount), taxRate: Number(taxRate), taxAmount: txAmt, totalWithTax: tot, paymentMethod, payee, receiptNumber, costCenterId: costCenterId || undefined, description
      } : item);
    } else {
      const newExp: ExpenseItem = {
        id: `exp_${Date.now()}`, date, category, subcategory, amount: Number(amount), taxRate: Number(taxRate), taxAmount: txAmt, totalWithTax: tot, paymentMethod, payee, receiptNumber, costCenterId: costCenterId || undefined, description, isRecurring: false, enteredBy: currentUser?.fullName || 'المحاسب'
      };
      updated = [newExp, ...expenses];
    }

    saveExpenses(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingExp ? 'تم التعديل وتحديث الشيت بنجاح' : 'تم إضافة المصروف للشيت بنجاح', 'success');
  };

  const handleDelete = (id: string, desc: string) => {
    if (!canDelete) {
      customAlert('ليس لديك صلاحية لحذف المصروفات.', 'error');
      return;
    }
    customConfirm(`هل أنت متأكد من حذف مصروف "${desc}"؟`, () => {
      saveExpenses(expenses.filter(e => e.id !== id));
      onRefresh();
      customAlert('تم الحذف بنجاح', 'success');
    }, 'تأكيد حذف المصروف');
  };

  const currencySymbol = settings?.currency || 'ر.س';

  const exportData = filteredExpenses.map(e => ({
    'التاريخ': e.date,
    'رقم الفاتورة / السند': e.receiptNumber || '-',
    'التصنيف الرئيسي': e.category,
    'التصنيف الفرعي': e.subcategory || '-',
    'المبلغ قبل الضريبة': e.amount,
    'نسبة الضريبة': `${e.taxRate || 0}%`,
    'قيمة الضريبة': e.taxAmount || 0,
    'الإجمالي مع الضريبة': e.totalWithTax,
    'الجهة / المستفيد': e.payee,
    'طريقة الدفع': e.paymentMethod === 'bank' ? 'بنكي' : e.paymentMethod === 'cash' ? 'خزينة نقدي' : 'آجل',
    'البيان': e.description
  }));

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>شيت تفصيلي لكافة المصروفات والتكاليف</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل شامل لكافة المصروفات الإدارية، التشغيلية ومصروفات المشاريع مع حساب ضريبة القيمة المضافة ومطابقة الأرصدة
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canExport && (
            <ExportButtons
              title="شيت تفصيلي لكافة مصروفات الشركة"
              subtitle={formatFilterPeriodDescription(startDate, endDate, `إجمالي المصروفات: ${totalWithTax.toLocaleString()} ${currencySymbol}`)}
              data={exportData}
              fileName={`expenses_sheet_${new Date().toISOString().slice(0, 10)}`}
            />
          )}

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مصروف جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* شريط البحث المتقدم بالأيام والشهور والسنة */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية دليل وشيت المصروفات بالأيام والشهور والسنة"
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

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-bold">إجمالي المصروفات (قبل الضريبة)</span>
          <div className="text-2xl font-black mt-1 text-slate-100 font-mono">{totalAmount.toLocaleString()} {currencySymbol}</div>
        </div>
        <div className="bg-amber-950/40 p-5 rounded-2xl border border-amber-800/40 shadow-lg">
          <span className="text-xs text-amber-400 font-bold">إجمالي ضريبة المدخلات (VAT 15%)</span>
          <div className="text-2xl font-black mt-1 text-amber-300 font-mono">{totalTax.toLocaleString()} {currencySymbol}</div>
        </div>
        <div className="bg-red-950/40 p-5 rounded-2xl border border-red-800/50 shadow-lg">
          <span className="text-xs text-red-300 font-bold">الإجمالي الكلي للمصروفات شامل الضريبة</span>
          <div className="text-2xl font-black mt-1 text-red-400 font-mono">{totalWithTax.toLocaleString()} {currencySymbol}</div>
        </div>
      </div>

      {/* جدول المصروفات */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300">تصفية حسب التصنيف:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">كافة التصنيفات ({expenses.length})</option>
              <option value="مصروفات إدارية وعمومية">مصروفات إدارية وعمومية</option>
              <option value="مصروفات تشغيلية ومشاريع">مصروفات تشغيلية ومشاريع</option>
              <option value="رواتب وأجور عاملين">رواتب وأجور عاملين</option>
              <option value="تسويق وإعلان">تسويق وإعلان</option>
            </select>
          </div>
          <span className="text-xs font-bold text-slate-400">عدد البنود المعروضة: {filteredExpenses.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-3.5 font-bold">التاريخ</th>
                <th className="py-3.5 px-3.5 font-bold">رقم السند</th>
                <th className="py-3.5 px-3.5 font-bold">التصنيف</th>
                <th className="py-3.5 px-3.5 font-bold">المستفيد / الجهة</th>
                <th className="py-3.5 px-3.5 font-bold">البيان</th>
                <th className="py-3.5 px-3.5 font-bold">المشروع</th>
                <th className="py-3.5 px-3.5 font-bold text-center">المبلغ الأساسي</th>
                <th className="py-3.5 px-3.5 font-bold text-center">الضريبة</th>
                <th className="py-3.5 px-3.5 font-bold text-center bg-amber-950/60 text-amber-300">الإجمالي</th>
                <th className="py-3.5 px-3.5 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    لا توجد مصروفات مسجلة مطابقة لمعايير البحث والتصفية
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(item => {
                  const ccName = costCenters.find(c => c.id === item.costCenterId)?.name || '-';
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3.5 font-mono text-slate-400">{item.date}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-400">{item.receiptNumber || '-'}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-white">{item.category}</div>
                        {item.subcategory && <div className="text-[11px] text-slate-400">{item.subcategory}</div>}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-200">{item.payee}</td>
                      <td className="py-3 px-3.5 max-w-xs truncate text-slate-300">{item.description}</td>
                      <td className="py-3 px-3.5 text-slate-400">{ccName}</td>
                      <td className="py-3 px-3.5 font-mono text-center">{item.amount.toLocaleString()}</td>
                      <td className="py-3 px-3.5 font-mono text-center text-amber-400">{(item.taxAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3.5 font-mono font-extrabold text-amber-300 bg-amber-950/30 text-center">{item.totalWithTax.toLocaleString()} {currencySymbol}</td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="تعديل المصروف"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id, item.description)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition"
                              title="حذف المصروف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-[10px] text-slate-500">عرض فقط</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 animate-scaleUp">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-amber-400">
              <FileText className="w-5 h-5" />
              <span>{editingExp ? 'تعديل المصروف في الشيت' : 'تسجيل مصروف جديد في الشيت'}</span>
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">التصنيف الرئيسي *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="مصروفات تشغيلية ومشاريع">مصروفات تشغيلية ومشاريع</option>
                    <option value="مصروفات إدارية وعمومية">مصروفات إدارية وعمومية</option>
                    <option value="رواتب وأجور عاملين">رواتب وأجور عاملين</option>
                    <option value="تسويق وإعلان">تسويق وإعلان</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">المبلغ قبل الضريبة ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    required
                    className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-bold text-white text-base focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">نسبة ضريبة القيمة المضافة %</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">الجهة المستفيدة / المورد *</label>
                  <input
                    type="text"
                    value={payee}
                    onChange={e => setPayee(e.target.value)}
                    required
                    placeholder="اسم الشركة أو الشخص"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">رقم الفاتورة / السند</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                    className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">ربط بمشروع / مركز تكلفة (اختياري)</label>
                <select
                  value={costCenterId}
                  onChange={e => setCostCenterId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- مصروف عام بدون ارتباط بمشروع --</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">البيان والشرح التفصيلي *</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  placeholder="مثال: شراء مواد ومعدات تشغيلية..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition"
                >
                  {editingExp ? 'حفظ التعديلات' : 'حفظ في الشيت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
