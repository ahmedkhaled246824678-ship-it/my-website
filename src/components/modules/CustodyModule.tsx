import React, { useState } from 'react';
import {
  Briefcase,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FileSpreadsheet,
  Share2,
  Receipt,
  FileText,
  AlertCircle,
  TrendingDown,
  Building,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Custody, CustodyInvoiceItem, Employee, CostCenter, CompanySettings, UserAccount } from '../../types';
import { saveCustodies } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { openWhatsApp, generateStatementWhatsAppMessage } from '../../utils/whatsapp';
import { Language, t } from '../../utils/i18n';

interface CustodyModuleProps {
  custodies: Custody[];
  employees: Employee[];
  costCenters: CostCenter[];
  settings: CompanySettings;
  currentUser: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const CustodyModule: React.FC<CustodyModuleProps> = ({
  custodies,
  employees,
  costCenters,
  settings,
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showSettlementSheet, setShowSettlementSheet] = useState<Custody | null>(null);
  const [editingCustody, setEditingCustody] = useState<Custody | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<Custody | null>(null);
  const [customPhone, setCustomPhone] = useState('');

  // Form State للعهدة
  const [empId, setEmpId] = useState(employees?.[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState('');
  const [custodyType, setCustodyType] = useState<'temporary' | 'permanent'>('temporary');
  const [costCenterId, setCostCenterId] = useState(costCenters?.[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Form State لإضافة فاتورة لتسوية العهدة
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invNumber, setInvNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [invDesc, setInvDesc] = useState('');
  const [invCategory, setInvCategory] = useState('مواد وإنشاءات');
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invTaxRate, setInvTaxRate] = useState<number>(15);
  const [invSupplier, setInvSupplier] = useState('');

  const canAdd = currentUser.permissions.canAdd;
  const canEdit = currentUser.permissions.canEdit;
  const canDelete = currentUser.permissions.canDelete;
  const canSettle = currentUser.permissions.canSettle ?? true;

  const filteredCustodies = custodies.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.employeeName.toLowerCase().includes(q) ||
      c.purpose.toLowerCase().includes(q) ||
      (c.custodyNumber && c.custodyNumber.toLowerCase().includes(q)) ||
      (c.costCenterName && c.costCenterName.toLowerCase().includes(q))
    );
  });

  // الإحصائيات
  const totalAmount = custodies.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalSettled = custodies.reduce((sum, c) => sum + Number(c.settledAmount || 0), 0);
  const totalRemaining = custodies.reduce((sum, c) => sum + Number(c.remainingAmount || 0), 0);
  const activeCount = custodies.filter(c => c.status !== 'closed').length;

  const handleOpenAdd = () => {
    setEditingCustody(null);
    setEmpId(employees?.[0]?.id || '');
    setAmount(0);
    setDate(new Date().toISOString().slice(0, 10));
    setPurpose('');
    setCustodyType('temporary');
    setCostCenterId(costCenters?.[0]?.id || '');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Custody) => {
    setEditingCustody(c);
    setEmpId(c.employeeId);
    setAmount(c.amount);
    setDate(c.dateGiven);
    setPurpose(c.purpose);
    setCustodyType(c.type || 'temporary');
    setCostCenterId(c.costCenterId || '');
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSaveCustody = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || Number(amount) <= 0) {
      customAlert('يرجى اختيار الموظف وإدخال مبلغ عهدة صحيح أكبر من صفر', 'error');
      return;
    }

    const emp = employees.find(e => e.id === empId);
    const cc = costCenters.find(c => c.id === costCenterId);
    const empName = emp ? emp.name : 'موظف';
    const empPhone = emp ? emp.phone : '';

    let updated: Custody[];
    if (editingCustody) {
      const settled = editingCustody.settledAmount || 0;
      const rem = Number(amount) - settled;
      updated = custodies.map(c => c.id === editingCustody.id ? {
        ...c,
        employeeId: empId,
        employeeName: empName,
        employeePhone: empPhone || c.employeePhone,
        amount: Number(amount),
        dateGiven: date,
        purpose,
        type: custodyType,
        costCenterId: cc ? cc.id : undefined,
        costCenterName: cc ? cc.name : undefined,
        remainingAmount: rem,
        status: rem <= 0 ? 'closed' : settled > 0 ? 'partially_settled' : 'active',
        notes
      } : c);
    } else {
      const newCustody: Custody = {
        id: `cus_${Date.now()}`,
        custodyNumber: `CUST-2026-${String(custodies.length + 1).padStart(3, '0')}`,
        employeeId: empId,
        employeeName: empName,
        employeePhone: empPhone,
        amount: Number(amount),
        dateGiven: date,
        purpose,
        type: custodyType,
        costCenterId: cc ? cc.id : undefined,
        costCenterName: cc ? cc.name : undefined,
        status: 'active',
        settledAmount: 0,
        remainingAmount: Number(amount),
        notes,
        invoices: []
      };
      updated = [newCustody, ...custodies];
    }

    saveCustodies(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingCustody ? 'تم تعديل بيانات العهدة بنجاح' : 'تم صرف وتسجيل العهدة النقدية بنجاح', 'success');
  };

  const handleDeleteCustody = (id: string) => {
    customConfirm('هل أنت متأكد من حذف هذه العهدة النقدية؟', () => {
      const updated = custodies.filter(c => c.id !== id);
      saveCustodies(updated);
      onRefresh();
      if (showSettlementSheet && showSettlementSheet.id === id) {
        setShowSettlementSheet(null);
      }
      customAlert('تم حذف العهدة بنجاح', 'success');
    }, 'تأكيد حذف العهدة');
  };

  // إضافة فاتورة لتسوية العهدة
  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSettlementSheet) return;
    if (!invDesc.trim() || Number(invAmount) <= 0) {
      customAlert('يرجى كتابة بيان الفاتورة وإدخال المبلغ', 'error');
      return;
    }

    const taxVal = (Number(invAmount) * Number(invTaxRate)) / 100;
    const totalVal = Number(invAmount) + taxVal;

    const newInv: CustodyInvoiceItem = {
      id: `cinv_${Date.now()}`,
      invoiceNumber: invNumber || `INV-${Date.now().toString().slice(-4)}`,
      date: invDate,
      description: invDesc,
      category: invCategory,
      amount: Number(invAmount),
      taxAmount: taxVal,
      total: totalVal,
      supplierName: invSupplier || undefined
    };

    const currentInvoices = showSettlementSheet.invoices || [];
    const updatedInvoices = [...currentInvoices, newInv];
    const newSettledAmount = updatedInvoices.reduce((sum, item) => sum + item.total, 0);
    const newRemaining = showSettlementSheet.amount - newSettledAmount;
    const newStatus = newRemaining <= 0 ? 'closed' : 'partially_settled';

    const updatedCustody: Custody = {
      ...showSettlementSheet,
      invoices: updatedInvoices,
      settledAmount: newSettledAmount,
      remainingAmount: newRemaining,
      status: newStatus
    };

    const updatedList = custodies.map(c => c.id === showSettlementSheet.id ? updatedCustody : c);
    saveCustodies(updatedList);
    onRefresh();
    setShowSettlementSheet(updatedCustody);
    setShowAddInvoiceModal(false);
    // Reset Form
    setInvDesc('');
    setInvAmount(0);
    setInvSupplier('');
    setInvNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    customAlert('تمت إضافة الفاتورة لشيت تسوية العهدة بنجاح', 'success');
  };

  const handleDeleteInvoice = (invId: string) => {
    if (!showSettlementSheet) return;
    customConfirm('هل أنت متأكد من حذف هذه الفاتورة من شيت التسوية؟', () => {
      const currentInvoices = showSettlementSheet.invoices || [];
      const updatedInvoices = currentInvoices.filter(i => i.id !== invId);
      const newSettledAmount = updatedInvoices.reduce((sum, item) => sum + item.total, 0);
      const newRemaining = showSettlementSheet.amount - newSettledAmount;
      const newStatus = newRemaining <= 0 ? 'closed' : newSettledAmount > 0 ? 'partially_settled' : 'active';

      const updatedCustody: Custody = {
        ...showSettlementSheet,
        invoices: updatedInvoices,
        settledAmount: newSettledAmount,
        remainingAmount: newRemaining,
        status: newStatus
      };

      const updatedList = custodies.map(c => c.id === showSettlementSheet.id ? updatedCustody : c);
      saveCustodies(updatedList);
      onRefresh();
      setShowSettlementSheet(updatedCustody);
      customAlert('تم حذف الفاتورة وتحديث رصيد العهدة', 'success');
    }, 'حذف فاتورة من التسوية');
  };

  const handleCloseCustody = (custody: Custody) => {
    customConfirm(`هل أنت متأكد من إقفال وتسوية العهدة رقم (${custody.custodyNumber || custody.id}) وإرجاع الرصيد المتبقي (${custody.remainingAmount.toLocaleString()} ${settings.currency}) للخزينة؟`, () => {
      const updatedCustody: Custody = {
        ...custody,
        status: 'closed',
        settlementDate: new Date().toISOString().slice(0, 10),
        closedBy: currentUser.fullName
      };
      const updatedList = custodies.map(c => c.id === custody.id ? updatedCustody : c);
      saveCustodies(updatedList);
      onRefresh();
      setShowSettlementSheet(updatedCustody);
      customAlert('تم إقفال وتسوية العهدة النقدية بنجاح!', 'success');
    }, 'إقفال وتسوية العهدة');
  };

  const handleSendWhatsApp = (custody: Custody) => {
    const details = (custody.invoices || []).map(inv => 
      `${inv.description} - المبلغ: ${inv.total.toLocaleString()} ${settings.currency} (فاتورة: ${inv.invoiceNumber})`
    );
    if (custody.status === 'closed') {
      details.push(`✅ تم إقفال وتسوية العهدة بالكامل بتاريخ: ${custody.settlementDate || new Date().toISOString().slice(0, 10)}`);
    } else {
      details.push(`💵 الرصيد المتبقي المطلوب تسويته أو رده: ${custody.remainingAmount.toLocaleString()} ${settings.currency}`);
    }

    const message = generateStatementWhatsAppMessage({
      companyName: settings.companyName,
      accountName: custody.employeeName,
      accountCode: custody.custodyNumber,
      phone: customPhone || custody.employeePhone,
      currency: settings.currency,
      currentBalance: custody.remainingAmount,
      type: 'custody',
      date: custody.dateGiven,
      details
    });

    openWhatsApp(customPhone || custody.employeePhone || '', message);
    setShowWhatsAppModal(null);
  };

  const exportData = filteredCustodies.map(c => ({
    'رقم العهدة': c.custodyNumber || c.id,
    'أمين العهدة / الموظف': c.employeeName,
    'تاريخ الصرف': c.dateGiven,
    'المشروع / المركز': c.costCenterName || 'عام',
    'نوع العهدة': c.type === 'permanent' ? 'مستديمة' : 'مؤقتة',
    'مبلغ العهدة': c.amount,
    'إجمالي الفواتير المسواة': c.settledAmount,
    'الرصيد المتبقي': c.remainingAmount,
    'الغرض': c.purpose,
    'الحالة': c.status === 'closed' ? 'مقفل ومسوى' : c.status === 'partially_settled' ? 'تسوية جزئية' : 'نشطة'
  }));

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-amber-400" />
            <span>{t('custodies', lang)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة ومتابعة العهد النقدية المؤقتة والمستديمة، وشيت تسوية تفصيلي لكل عهدة مع تدقيق الفواتير
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButtons
            data={exportData}
            fileName={`سجل_العهد_النقدية_${new Date().toISOString().slice(0, 10)}`}
            title="سجل العهد النقدية والتسويات"
          />

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_custody', lang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">إجمالي مبالغ العهد المنصرفة</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{totalAmount.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-amber-400 mt-0.5">عدد العهد: {custodies.length}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">إجمالي الفواتير والمصروفات المسواة</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{totalSettled.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">نسبة الإنجاز: {totalAmount ? Math.round((totalSettled / totalAmount) * 100) : 0}%</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">صافي المتبقي طرف الأمناء</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{totalRemaining.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">قيد التسوية ورد الفائض</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">العهد النشطة وغير المقفلة</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{activeCount} عهدة</div>
          <div className="text-[11px] text-slate-400 mt-0.5">مقفلة: {custodies.length - activeCount}</div>
        </div>
      </div>

      {/* جدول العهد النقدية الرئيسية */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white text-sm">جدول العهد النقدية والمشاريع الميدانية</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">سجلات: {filteredCustodies.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3.5">رقم العهدة</th>
                <th className="p-3.5">أمين العهدة (الموظف)</th>
                <th className="p-3.5">المشروع / المركز</th>
                <th className="p-3.5">تاريخ الصرف</th>
                <th className="p-3.5">مبلغ العهدة</th>
                <th className="p-3.5">المسوى (فواتير)</th>
                <th className="p-3.5">المتبقي</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">شيت التسوية والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {filteredCustodies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا توجد عهد نقدية مسجلة حالياً تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredCustodies.map((c) => {
                  const invoiceCount = c.invoices?.length || 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-amber-300 font-mono">
                        {c.custodyNumber || c.id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{c.employeeName}</div>
                        {c.employeePhone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{c.employeePhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {c.costCenterName || 'الإدارة العامة'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {c.dateGiven}
                      </td>
                      <td className="p-3.5 font-bold text-slate-100 font-mono">
                        {c.amount.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 font-mono">
                        {c.settledAmount.toLocaleString()} {settings.currency}
                        <span className="text-[10px] text-slate-400 block font-normal">({invoiceCount} فواتير)</span>
                      </td>
                      <td className="p-3.5 font-bold font-mono">
                        <span className={c.remainingAmount > 0 ? 'text-amber-400' : 'text-slate-400'}>
                          {c.remainingAmount.toLocaleString()} {settings.currency}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {c.status === 'closed' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md text-[11px] font-bold">
                            مقفل ومسوى ✅
                          </span>
                        ) : c.status === 'partially_settled' ? (
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-md text-[11px] font-bold">
                            تسوية جزئية ⏳
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md text-[11px] font-bold">
                            نشطة طرف الأمين ⚡
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر فتح شيت تسوية العهدة التفصيلي */}
                          <button
                            onClick={() => setShowSettlementSheet(c)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-lg text-xs font-bold transition"
                            title="فتح شيت تسوية العهدة التفصيلي وإدخال الفواتير"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                            <span>شيت التسوية</span>
                          </button>

                          {/* زر واتساب */}
                          <button
                            onClick={() => {
                              setShowWhatsAppModal(c);
                              setCustomPhone(c.employeePhone || '');
                            }}
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg transition"
                            title="إرسال كشف العهدة والتسوية عبر واتساب"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="تعديل العهدة"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteCustody(c.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition"
                              title="حذف العهدة"
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

      {/* ===================== مودال شيت تسوية العهدة التفصيلي ===================== */}
      {showSettlementSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>شيت تسوية العهدة: {showSettlementSheet.custodyNumber || showSettlementSheet.id}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
                      {showSettlementSheet.employeeName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    الغرض: {showSettlementSheet.purpose} • تاريخ الصرف: {showSettlementSheet.dateGiven}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(showSettlementSheet);
                    setCustomPhone(showSettlementSheet.employeePhone || '');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إرسال بالواتساب</span>
                </button>

                <button
                  onClick={() => setShowSettlementSheet(null)}
                  className="text-slate-400 hover:text-white text-2xl font-bold p-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* بطاقة ملخص المبالغ والفروقات */}
            <div className="p-5 bg-slate-800/40 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-400">مبلغ العهدة الأصلي</div>
                <div className="text-lg font-bold text-white mt-1">
                  {showSettlementSheet.amount.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-900/50">
                <div className="text-xs text-emerald-400">إجمالي الفواتير المقدمة</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {showSettlementSheet.settledAmount.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-xs text-amber-400">الرصيد المتبقي من العهدة</div>
                <div className="text-lg font-bold text-amber-400 mt-1">
                  {showSettlementSheet.remainingAmount.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 flex flex-col justify-center">
                <div className="text-xs text-slate-400">حالة العهدة</div>
                <div className="mt-1 font-bold text-xs">
                  {showSettlementSheet.status === 'closed' ? (
                    <span className="text-emerald-400">مقفل ومسوى بالكامل ✅</span>
                  ) : (
                    <span className="text-amber-400">قيد استكمال الفواتير والرد ⏳</span>
                  )}
                </div>
              </div>
            </div>

            {/* جدول الفواتير داخل الشيت */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>فواتير ومستندات الصرف المرفقة بالعهدة</span>
                </h4>

                {canSettle && showSettlementSheet.status !== 'closed' && (
                  <button
                    onClick={() => setShowAddInvoiceModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة فاتورة / سند صرف</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">رقم الفاتورة</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">البيان والتفاصيل</th>
                      <th className="p-2.5">التصنيف</th>
                      <th className="p-2.5">المورد / المستفيد</th>
                      <th className="p-2.5">المبلغ قبل الضريبة</th>
                      <th className="p-2.5">الضريبة (15%)</th>
                      <th className="p-2.5">الإجمالي</th>
                      {canSettle && showSettlementSheet.status !== 'closed' && <th className="p-2.5 text-center">حذف</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {!showSettlementSheet.invoices || showSettlementSheet.invoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500">
                          لم يتم إدراج فواتير في شيت هذه العهدة حتى الآن. اضغط "إضافة فاتورة" لبدء التسوية.
                        </td>
                      </tr>
                    ) : (
                      showSettlementSheet.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold font-mono text-blue-300">{inv.invoiceNumber}</td>
                          <td className="p-2.5 font-mono text-slate-300">{inv.date}</td>
                          <td className="p-2.5 text-slate-100 font-medium">{inv.description}</td>
                          <td className="p-2.5 text-slate-300">{inv.category}</td>
                          <td className="p-2.5 text-slate-300">{inv.supplierName || '—'}</td>
                          <td className="p-2.5 font-mono text-slate-200">{inv.amount.toLocaleString()}</td>
                          <td className="p-2.5 font-mono text-amber-400">{inv.taxAmount.toLocaleString()}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-400">{inv.total.toLocaleString()} {settings.currency}</td>
                          {canSettle && showSettlementSheet.status !== 'closed' && (
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded transition"
                                title="حذف الفاتورة"
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

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {showSettlementSheet.status === 'closed' && (
                  <span className="text-emerald-400 font-bold">
                    تم إقفال العهدة بنجاح بواسطة: {showSettlementSheet.closedBy || 'الإدارة المالية'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {canSettle && showSettlementSheet.status !== 'closed' && (
                  <button
                    onClick={() => handleCloseCustody(showSettlementSheet)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد إقفال وتسوية العهدة ورد المتبقي</span>
                  </button>
                )}

                <button
                  onClick={() => setShowSettlementSheet(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
                >
                  إغلاق الشيت
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== مودال إضافة فاتورة لشيت التسوية ===================== */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <span>إضافة فاتورة / سند صرف لشيت العهدة</span>
              </h3>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">رقم الفاتورة / السند *</label>
                  <input
                    type="text"
                    required
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">تاريخ الفاتورة *</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">بيان ووصف المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء كوابيل وأسلاك لحام للموقع..."
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">تصنيف البند</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="مواد وإنشاءات">مواد وإنشاءات</option>
                    <option value="صيانة ومعدات">صيانة ومعدات</option>
                    <option value="يوميات عمالة">يوميات عمالة</option>
                    <option value="ضيافة وتنقلات">ضيافة وتنقلات</option>
                    <option value="أدوات مكتبية">أدوات مكتبية</option>
                    <option value="نثريات ومصروفات عامة">نثريات ومصروفات عامة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">المورد / المستفيد</label>
                  <input
                    type="text"
                    placeholder="اسم المورد أو المحل"
                    value={invSupplier}
                    onChange={(e) => setInvSupplier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">المبلغ الأساسي (قبل الضريبة) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={invAmount || ''}
                    onChange={(e) => setInvAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">نسبة ضريبة القيمة المضافة %</label>
                  <select
                    value={invTaxRate}
                    onChange={(e) => setInvTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="15">15% (ضريبة قياسية)</option>
                    <option value="0">0% (معفى من الضريبة)</option>
                    <option value="5">5%</option>
                  </select>
                </div>
              </div>

              {/* ملخص إجمالي الفاتورة */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">الإجمالي الشامل للضريبة:</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  {(Number(invAmount) + (Number(invAmount) * Number(invTaxRate)) / 100).toLocaleString()} {settings.currency}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition"
                >
                  حفظ الفاتورة وإدراجها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== مودال صرف عهدة جديدة / تعديل ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                <span>{editingCustody ? 'تعديل بيانات العهدة' : 'صرف عهدة نقدية جديدة'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSaveCustody} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">الموظف / أمين العهدة *</label>
                <select
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department} - {emp.position})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">مبلغ العهدة ({settings.currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">المشروع / مركز التكلفة</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">عام - المركز الرئيسي</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">نوع العهدة</label>
                  <select
                    value={custodyType}
                    onChange={(e: any) => setCustodyType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="temporary">عهدة مؤقتة (لمهمة أو شهر)</option>
                    <option value="permanent">عهدة مستديمة (مستمرة وتُستعاض)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">الغرض من العهدة *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="مثال: مشتريات مواد طارئة وصيانة العمالة بالموقع..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">ملاحظات إضافية</label>
                <input
                  type="text"
                  placeholder="ملاحظات أو شروط التسوية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow transition"
                >
                  {editingCustody ? 'حفظ التعديلات' : 'صرف وتسجيل العهدة'}
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
                <span>إرسال كشف العهدة عبر واتساب</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(null)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white text-sm">{showWhatsAppModal.employeeName}</div>
                <div className="text-slate-400 mt-1">العهدة: {showWhatsAppModal.custodyNumber || showWhatsAppModal.id}</div>
                <div className="text-emerald-400 font-bold mt-1">المتبقي: {showWhatsAppModal.remainingAmount.toLocaleString()} {settings.currency}</div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  رقم الواتساب للمستلم (مع كود الدولة):
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
