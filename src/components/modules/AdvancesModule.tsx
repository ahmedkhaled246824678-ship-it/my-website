import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  DollarSign,
  Receipt,
  FileText,
  Phone,
  MessageSquare,
  History,
  TrendingDown,
  ArrowDownRight
} from 'lucide-react';
import { EmployeeAdvance, AdvanceRepaymentRecord, Employee, CompanySettings, UserAccount } from '../../types';
import { saveAdvances } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { openWhatsApp, generateStatementWhatsAppMessage } from '../../utils/whatsapp';
import { Language, t } from '../../utils/i18n';

interface AdvancesModuleProps {
  advances: EmployeeAdvance[];
  employees: Employee[];
  settings: CompanySettings;
  currentUser: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const AdvancesModule: React.FC<AdvancesModuleProps> = ({
  advances,
  employees,
  settings,
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showRepaymentsModal, setShowRepaymentsModal] = useState<EmployeeAdvance | null>(null);
  const [editingAdvance, setEditingAdvance] = useState<EmployeeAdvance | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<EmployeeAdvance | null>(null);
  const [customPhone, setCustomPhone] = useState('');

  // Form State للسلفة
  const [empId, setEmpId] = useState(employees?.[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [monthlyDeduction, setMonthlyDeduction] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  // Form State لسداد قسط
  const [showAddRepaymentModal, setShowAddRepaymentModal] = useState(false);
  const [repAmount, setRepAmount] = useState<number>(0);
  const [repDate, setRepDate] = useState(new Date().toISOString().slice(0, 10));
  const [repType, setRepType] = useState<'salary_deduction' | 'cash' | 'bank_transfer'>('salary_deduction');
  const [repNotes, setRepNotes] = useState('');

  const canAdd = currentUser.permissions.canAdd;
  const canEdit = currentUser.permissions.canEdit;
  const canDelete = currentUser.permissions.canDelete;

  const filteredAdvances = advances.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.employeeName.toLowerCase().includes(q) ||
      (a.advanceNumber && a.advanceNumber.toLowerCase().includes(q)) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    );
  });

  // الإحصائيات
  const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalRepaid = advances.reduce((sum, a) => sum + Number(a.repaidAmount || 0), 0);
  const totalRemaining = advances.reduce((sum, a) => sum + Number(a.remainingAmount || 0), 0);
  const activeAdvances = advances.filter(a => a.status === 'active').length;

  const handleOpenAdd = () => {
    setEditingAdvance(null);
    setEmpId(employees?.[0]?.id || '');
    setAmount(0);
    setMonthlyDeduction(0);
    setDate(new Date().toISOString().slice(0, 10));
    setReason('');
    setShowModal(true);
  };

  const handleOpenEdit = (a: EmployeeAdvance) => {
    setEditingAdvance(a);
    setEmpId(a.employeeId);
    setAmount(a.amount);
    setMonthlyDeduction(a.monthlyDeduction);
    setDate(a.date);
    setReason(a.reason || '');
    setShowModal(true);
  };

  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || Number(amount) <= 0 || Number(monthlyDeduction) <= 0) {
      customAlert('يرجى اختيار الموظف وإدخال مبلغ سلفة وقسط شهري صحيحين', 'error');
      return;
    }

    const emp = employees.find(e => e.id === empId);
    const empName = emp ? emp.name : 'موظف';
    const empPhone = emp ? emp.phone : '';
    const installments = Math.ceil(Number(amount) / Number(monthlyDeduction));

    let updated: EmployeeAdvance[];
    if (editingAdvance) {
      const repaid = editingAdvance.repaidAmount || 0;
      const rem = Number(amount) - repaid;
      updated = advances.map(a => a.id === editingAdvance.id ? {
        ...a,
        employeeId: empId,
        employeeName: empName,
        employeePhone: empPhone || a.employeePhone,
        amount: Number(amount),
        monthlyDeduction: Number(monthlyDeduction),
        date,
        installmentsCount: installments,
        remainingAmount: rem,
        status: rem <= 0 ? 'paid' : 'active',
        reason
      } : a);
    } else {
      const newAdv: EmployeeAdvance = {
        id: `adv_${Date.now()}`,
        advanceNumber: `ADV-2026-${String(advances.length + 1).padStart(3, '0')}`,
        employeeId: empId,
        employeeName: empName,
        employeePhone: empPhone,
        amount: Number(amount),
        monthlyDeduction: Number(monthlyDeduction),
        date,
        installmentsCount: installments,
        repaidAmount: 0,
        remainingAmount: Number(amount),
        status: 'active',
        reason,
        repayments: []
      };
      updated = [newAdv, ...advances];
    }

    saveAdvances(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingAdvance ? 'تم تعديل السلفة بنجاح' : 'تم منح وتسجيل السلفة بنجاح', 'success');
  };

  const handleDeleteAdvance = (id: string) => {
    customConfirm('هل أنت متأكد من حذف هذه السلفة من السجلات؟', () => {
      const updated = advances.filter(a => a.id !== id);
      saveAdvances(updated);
      onRefresh();
      if (showRepaymentsModal && showRepaymentsModal.id === id) {
        setShowRepaymentsModal(null);
      }
      customAlert('تم حذف السلفة بنجاح', 'success');
    }, 'تأكيد حذف السلفة');
  };

  // تسجيل سداد قسط
  const handleAddRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRepaymentsModal) return;
    if (Number(repAmount) <= 0) {
      customAlert('يرجى إدخال مبلغ القسط المسدد', 'error');
      return;
    }

    const newRep: AdvanceRepaymentRecord = {
      id: `rep_${Date.now()}`,
      date: repDate,
      amount: Number(repAmount),
      deductionType: repType,
      notes: repNotes || (repType === 'salary_deduction' ? 'استقطاع راتب شهري' : 'سداد نقدي/تحويل'),
      receiptNumber: `PAY-${Date.now().toString().slice(-4)}`
    };

    const currentReps = showRepaymentsModal.repayments || [];
    const updatedReps = [...currentReps, newRep];
    const newRepaidAmount = updatedReps.reduce((sum, item) => sum + item.amount, 0);
    const newRemaining = showRepaymentsModal.amount - newRepaidAmount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'active';

    const updatedAdv: EmployeeAdvance = {
      ...showRepaymentsModal,
      repayments: updatedReps,
      repaidAmount: newRepaidAmount,
      remainingAmount: Math.max(0, newRemaining),
      status: newStatus
    };

    const updatedList = advances.map(a => a.id === showRepaymentsModal.id ? updatedAdv : a);
    saveAdvances(updatedList);
    onRefresh();
    setShowRepaymentsModal(updatedAdv);
    setShowAddRepaymentModal(false);
    setRepAmount(0);
    setRepNotes('');
    customAlert('تم تسجيل سداد القسط وتحديث رصيد السلفة بنجاح', 'success');
  };

  const handleDeleteRepayment = (repId: string) => {
    if (!showRepaymentsModal) return;
    customConfirm('هل أنت متأكد من حذف هذا القسط المسدد؟', () => {
      const currentReps = showRepaymentsModal.repayments || [];
      const updatedReps = currentReps.filter(r => r.id !== repId);
      const newRepaidAmount = updatedReps.reduce((sum, item) => sum + item.amount, 0);
      const newRemaining = showRepaymentsModal.amount - newRepaidAmount;
      const newStatus = newRemaining <= 0 ? 'paid' : 'active';

      const updatedAdv: EmployeeAdvance = {
        ...showRepaymentsModal,
        repayments: updatedReps,
        repaidAmount: newRepaidAmount,
        remainingAmount: Math.max(0, newRemaining),
        status: newStatus
      };

      const updatedList = advances.map(a => a.id === showRepaymentsModal.id ? updatedAdv : a);
      saveAdvances(updatedList);
      onRefresh();
      setShowRepaymentsModal(updatedAdv);
      customAlert('تم حذف القسط وتحديث رصيد السلفة', 'success');
    }, 'حذف قسط');
  };

  const handleSendWhatsApp = (advance: EmployeeAdvance) => {
    const reps = advance.repayments || [];
    const details = reps.map(r => 
      `قسط مسدد: ${r.amount.toLocaleString()} ${settings.currency} بتاريخ ${r.date} (${r.notes || r.deductionType})`
    );
    details.push(`💳 القسط الشهري المعتمد: ${advance.monthlyDeduction.toLocaleString()} ${settings.currency}`);
    details.push(`⏳ المتبقي الإجمالي للسلفة: ${advance.remainingAmount.toLocaleString()} ${settings.currency}`);

    const message = generateStatementWhatsAppMessage({
      companyName: settings.companyName,
      accountName: advance.employeeName,
      accountCode: advance.advanceNumber,
      phone: customPhone || advance.employeePhone,
      currency: settings.currency,
      currentBalance: advance.remainingAmount,
      type: 'employee',
      date: advance.date,
      details
    });

    openWhatsApp(customPhone || advance.employeePhone || '', message);
    setShowWhatsAppModal(null);
  };

  const exportData = filteredAdvances.map(a => ({
    'رقم السلفة': a.advanceNumber || a.id,
    'الموظف': a.employeeName,
    'تاريخ المنح': a.date,
    'مبلغ السلفة': a.amount,
    'القسط الشهري': a.monthlyDeduction,
    'المسدد': a.repaidAmount,
    'المتبقي': a.remainingAmount,
    'عدد الأقساط المقدر': a.installmentsCount || Math.ceil(a.amount / a.monthlyDeduction),
    'السبب': a.reason || '—',
    'الحالة': a.status === 'paid' ? 'مسدد بالكامل' : 'قيد السداد'
  }));

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>{t('advances', lang)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة سلف العاملين وجدول الأقساط الشهرية المستقطعة ومتابعة السداد مع إرسال إشعارات عبر واتساب
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButtons
            data={exportData}
            fileName={`سجل_سلف_الموظفين_${new Date().toISOString().slice(0, 10)}`}
            title="سجل سلف الموظفين والأقساط"
          />

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_advance', lang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">إجمالي السلف الممنوحة</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{totalAdvances.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">عدد السلف: {advances.length}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">إجمالي الأقساط المسددة</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{totalRepaid.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">نسبة التحصيل: {totalAdvances ? Math.round((totalRepaid / totalAdvances) * 100) : 0}%</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">صافي رصيد السلف القائم</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{totalRemaining.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">مستحق الاستقطاع من الرواتب</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">السلف النشطة الجارية</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{activeAdvances} سلفة</div>
          <div className="text-[11px] text-slate-400 mt-0.5">مسددة بالكامل: {advances.length - activeAdvances}</div>
        </div>
      </div>

      {/* جدول السلف والأقساط */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">سجل سلف الموظفين واستقطاعات الرواتب</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">سجلات: {filteredAdvances.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3.5">رقم السلفة</th>
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">تاريخ المنح</th>
                <th className="p-3.5">مبلغ السلفة</th>
                <th className="p-3.5">القسط الشهري</th>
                <th className="p-3.5">المسدد</th>
                <th className="p-3.5">المتبقي</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">جدول الأقساط والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا توجد سلف موظفين مسجلة حالياً تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => {
                  const repCount = adv.repayments?.length || 0;
                  return (
                    <tr key={adv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-emerald-300 font-mono">
                        {adv.advanceNumber || adv.id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{adv.employeeName}</div>
                        {adv.reason && <div className="text-[10px] text-slate-400 mt-0.5">{adv.reason}</div>}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {adv.date}
                      </td>
                      <td className="p-3.5 font-bold text-slate-100 font-mono">
                        {adv.amount.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 font-bold text-blue-400 font-mono">
                        {adv.monthlyDeduction.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 font-mono">
                        {adv.repaidAmount.toLocaleString()} {settings.currency}
                        <span className="text-[10px] text-slate-400 block font-normal">({repCount} أقساط)</span>
                      </td>
                      <td className="p-3.5 font-bold font-mono">
                        <span className={adv.remainingAmount > 0 ? 'text-amber-400' : 'text-slate-400'}>
                          {adv.remainingAmount.toLocaleString()} {settings.currency}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {adv.status === 'paid' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md text-[11px] font-bold">
                            مسددة بالكامل ✅
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md text-[11px] font-bold">
                            جارية السداد ⏳
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر جدول سداد الأقساط */}
                          <button
                            onClick={() => {
                              setShowRepaymentsModal(adv);
                              setRepAmount(adv.monthlyDeduction);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-bold transition"
                            title="عرض وتوثيق أقساط السداد"
                          >
                            <History className="w-3.5 h-3.5 text-emerald-400" />
                            <span>سجل الأقساط</span>
                          </button>

                          {/* زر واتساب */}
                          <button
                            onClick={() => {
                              setShowWhatsAppModal(adv);
                              setCustomPhone(adv.employeePhone || '');
                            }}
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg transition"
                            title="إرسال كشف السلفة والأقساط عبر واتساب"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(adv)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="تعديل بيانات السلفة"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteAdvance(adv.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition"
                              title="حذف السلفة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* ===================== مودال سجل وأقساط السداد ===================== */}
      {showRepaymentsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>سجل أقساط سلفة: {showRepaymentsModal.advanceNumber || showRepaymentsModal.id}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
                      {showRepaymentsModal.employeeName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    القسط الشهري: {showRepaymentsModal.monthlyDeduction.toLocaleString()} {settings.currency} • تاريخ المنح: {showRepaymentsModal.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(showRepaymentsModal);
                    setCustomPhone(showRepaymentsModal.employeePhone || '');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إرسال كشف بالواتساب</span>
                </button>

                <button
                  onClick={() => setShowRepaymentsModal(null)}
                  className="text-slate-400 hover:text-white text-2xl font-bold p-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* بطاقة ملخص الأقساط */}
            <div className="p-5 bg-slate-800/40 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400">إجمالي مبلغ السلفة</div>
                <div className="text-lg font-bold text-white mt-1">
                  {showRepaymentsModal.amount.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-900/50">
                <div className="text-xs text-emerald-400">إجمالي الأقساط المسددة</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {showRepaymentsModal.repaidAmount.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-xs text-amber-400">الرصيد المتبقي للسلفة</div>
                <div className="text-lg font-bold text-amber-400 mt-1">
                  {showRepaymentsModal.remainingAmount.toLocaleString()} {settings.currency}
                </div>
              </div>
            </div>

            {/* جدول الأقساط */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>دفعات وأقساط السداد المسجلة</span>
                </h4>

                {showRepaymentsModal.status !== 'paid' && (
                  <button
                    onClick={() => {
                      setRepAmount(showRepaymentsModal.monthlyDeduction);
                      setShowAddRepaymentModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تسجيل سداد قسط جديد</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">رقم السند/الإيصال</th>
                      <th className="p-2.5">تاريخ السداد</th>
                      <th className="p-2.5">المبلغ المسدد</th>
                      <th className="p-2.5">طريقة السداد</th>
                      <th className="p-2.5">ملاحظات وبيان القسط</th>
                      {showRepaymentsModal.status !== 'paid' && <th className="p-2.5 text-center">حذف</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {!showRepaymentsModal.repayments || showRepaymentsModal.repayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          لم يتم تسجيل أقساط مسددة لهذه السلفة حتى الآن. اضغط "تسجيل سداد قسط" لإضافة استقطاع.
                        </td>
                      </tr>
                    ) : (
                      showRepaymentsModal.repayments.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold font-mono text-emerald-400">{rep.receiptNumber || rep.id}</td>
                          <td className="p-2.5 font-mono text-slate-300">{rep.date}</td>
                          <td className="p-2.5 font-mono font-bold text-white">{rep.amount.toLocaleString()} {settings.currency}</td>
                          <td className="p-2.5">
                            {rep.deductionType === 'salary_deduction' ? (
                              <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded text-[10px]">استقطاع راتب</span>
                            ) : rep.deductionType === 'bank_transfer' ? (
                              <span className="px-2 py-0.5 bg-purple-950 text-purple-300 rounded text-[10px]">تحويل بنكي</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px]">نقداً للخزينة</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-300">{rep.notes || '—'}</td>
                          {showRepaymentsModal.status !== 'paid' && (
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeleteRepayment(rep.id)}
                                className="p-1 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded transition"
                                title="حذف القسط"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {showRepaymentsModal.status === 'paid' ? (
                  <span className="text-emerald-400 font-bold">تم سداد كامل السلفة وإغلاق ملفها بنجاح ✅</span>
                ) : (
                  <span>المتبقي: {showRepaymentsModal.remainingAmount.toLocaleString()} {settings.currency}</span>
                )}
              </div>

              <button
                onClick={() => setShowRepaymentsModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== مودال سداد قسط جديد ===================== */}
      {showAddRepaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <span>تسجيل سداد قسط سلفة</span>
              </h3>
              <button onClick={() => setShowAddRepaymentModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleAddRepayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">المبلغ المسدد ({settings.currency}) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  value={repAmount || ''}
                  onChange={(e) => setRepAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">تاريخ السداد *</label>
                <input
                  type="date"
                  required
                  value={repDate}
                  onChange={(e) => setRepDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">طريقة الاستقطاع / السداد</label>
                <select
                  value={repType}
                  onChange={(e: any) => setRepType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="salary_deduction">استقطاع من الراتب الشهري (مسير الرواتب)</option>
                  <option value="cash">سداد نقدي في الخزينة</option>
                  <option value="bank_transfer">إيداع / تحويل بنكي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">ملاحظات وبيان السداد</label>
                <input
                  type="text"
                  placeholder="مثال: قسط شهر يوليو 2026..."
                  value={repNotes}
                  onChange={(e) => setRepNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRepaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition"
                >
                  حفظ وتحديث الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== مودال منح سلفة جديدة / تعديل ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>{editingAdvance ? 'تعديل بيانات السلفة' : 'منح سلفة موظف جديدة'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">الموظف المستفيد *</label>
                <select
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department} - راتب أساسي: {emp.basicSalary.toLocaleString()} {settings.currency})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">مبلغ السلفة ({settings.currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">القسط الشهري المستقطع *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="0.00"
                    value={monthlyDeduction || ''}
                    onChange={(e) => setMonthlyDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">تاريخ منح السلفة *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-400">عدد أشهر السداد المتوقع:</div>
                  <div className="font-bold text-white text-sm">
                    {amount && monthlyDeduction ? Math.ceil(amount / monthlyDeduction) : 0} شهر
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">سبب السلفة / البيان</label>
                <input
                  type="text"
                  placeholder="مثال: سلفة زواج، ظروف طارئة..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg shadow transition"
                >
                  {editingAdvance ? 'حفظ التعديلات' : 'منح وتسجيل السلفة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== مودال تأكيد إرسال واتساب ===================== */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>إرسال كشف السلفة عبر واتساب</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(null)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white text-sm">{showWhatsAppModal.employeeName}</div>
                <div className="text-slate-400 mt-1">السلفة: {showWhatsAppModal.advanceNumber || showWhatsAppModal.id}</div>
                <div className="text-emerald-400 font-bold mt-1">المتبقي: {showWhatsAppModal.remainingAmount.toLocaleString()} {settings.currency}</div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  رقم الواتساب للموظف:
                </label>
                <input
                  type="text"
                  placeholder="مثال: 966501234567 أو 0501234567"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(showWhatsAppModal)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>فتح تطبيق واتساب الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
