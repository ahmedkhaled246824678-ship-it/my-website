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
  ArrowRight
} from 'lucide-react';
import { Custody, EmployeeAdvance, Employee } from '../../types';
import { saveCustodies, saveAdvances } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { formatCurrency, getSystemCurrency } from '../../utils/currency';

interface CustodyAndAdvancesProps {
  custodies: Custody[];
  advances: EmployeeAdvance[];
  employees: Employee[];
  onRefresh: () => void;
  searchQuery: string;
}

export const CustodyAndAdvances: React.FC<CustodyAndAdvancesProps> = ({
  custodies,
  advances,
  employees,
  onRefresh,
  searchQuery
}) => {
  const [activeTab, setActiveTab] = useState<'custody' | 'advances'>('custody');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form State للعهد
  const [empId, setEmpId] = useState(employees?.[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState('');
  const [settledAmount, setSettledAmount] = useState<number>(0);
  const [status, setStatus] = useState<any>('active');

  // Form State للسلف
  const [monthlyDeduction, setMonthlyDeduction] = useState<number>(1000);
  const [repaidAmount, setRepaidAmount] = useState<number>(0);

  const filteredCustodies = custodies.filter(c => !searchQuery || c.employeeName.includes(searchQuery) || c.purpose.includes(searchQuery));
  const filteredAdvances = advances.filter(a => !searchQuery || a.employeeName.includes(searchQuery));

  const handleOpenAdd = () => {
    setEditingItem(null);
    setEmpId(employees?.[0]?.id || '');
    setAmount(0);
    setDate(new Date().toISOString().slice(0, 10));
    setPurpose('');
    setSettledAmount(0);
    setMonthlyDeduction(1000);
    setRepaidAmount(0);
    setStatus('active');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEmpId(item.employeeId);
    setAmount(item.amount);
    setDate(item.dateGiven || item.date);
    setPurpose(item.purpose || '');
    setSettledAmount(item.settledAmount || 0);
    setMonthlyDeduction(item.monthlyDeduction || 1000);
    setRepaidAmount(item.repaidAmount || 0);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === empId);
    const empName = emp ? emp.name : 'موظف';

    if (activeTab === 'custody') {
      const rem = Number(amount) - Number(settledAmount);
      let updated: Custody[];
      if (editingItem) {
        updated = custodies.map(c => c.id === editingItem.id ? {
          ...c, employeeId: empId, employeeName: empName, amount: Number(amount), dateGiven: date, purpose, settledAmount: Number(settledAmount), remainingAmount: rem, status
        } : c);
      } else {
        const newCus: Custody = {
          id: `cus_${Date.now()}`, employeeId: empId, employeeName: empName, amount: Number(amount), dateGiven: date, purpose, settledAmount: Number(settledAmount), remainingAmount: rem, status: rem <= 0 ? 'closed' : 'active'
        };
        updated = [newCus, ...custodies];
      }
      saveCustodies(updated);
    } else {
      const rem = Number(amount) - Number(repaidAmount);
      let updated: EmployeeAdvance[];
      if (editingItem) {
        updated = advances.map(a => a.id === editingItem.id ? {
          ...a, employeeId: empId, employeeName: empName, amount: Number(amount), date, monthlyDeduction: Number(monthlyDeduction), repaidAmount: Number(repaidAmount), remainingAmount: rem, status: rem <= 0 ? 'paid' : 'active'
        } : a);
      } else {
        const newAdv: EmployeeAdvance = {
          id: `adv_${Date.now()}`, employeeId: empId, employeeName: empName, amount: Number(amount), date, monthlyDeduction: Number(monthlyDeduction), repaidAmount: Number(repaidAmount), remainingAmount: rem, status: rem <= 0 ? 'paid' : 'active'
        };
        updated = [newAdv, ...advances];
      }
      saveAdvances(updated);
    }

    onRefresh();
    setShowModal(false);
    customAlert('تم حفظ البيانات بنجاح', 'success');
  };

  const handleDelete = (id: string, tab: string) => {
    customConfirm('هل أنت متأكد من الحذف؟', () => {
      if (tab === 'custody') {
        saveCustodies(custodies.filter(c => c.id !== id));
      } else {
        saveAdvances(advances.filter(a => a.id !== id));
      }
      onRefresh();
      customAlert('تم الحذف بنجاح', 'success');
    }, 'تأكيد الحذف');
  };

  const getExportData = () => {
    if (activeTab === 'custody') {
      return filteredCustodies.map(c => ({
        'الموظف': c.employeeName, 'تاريخ الصرف': c.dateGiven, 'مبلغ العهدة': c.amount, 'التم تسويته': c.settledAmount, 'الرصيد المتبقي': c.remainingAmount, 'الغرض': c.purpose, 'الحالة': c.status
      }));
    } else {
      return filteredAdvances.map(a => ({
        'الموظف': a.employeeName, 'تاريخ السلفة': a.date, 'مبلغ السلفة': a.amount, 'القسط الشهري': a.monthlyDeduction, 'التم سداده': a.repaidAmount, 'الرصيد المتبقي': a.remainingAmount, 'الحالة': a.status
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-purple-600" />
            <span>إدارة العهد المالية وسلف العاملين</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">متابعة العهد النقدية المؤقتة للمشاريع وأقساط سلف العاملين المخصومة شهرياً</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow transition">
            <Plus className="w-5 h-5" />
            <span>إضافة {activeTab === 'custody' ? 'عهدة جديدة' : 'سلفة موظف'}</span>
          </button>
          <ExportButtons title={activeTab === 'custody' ? 'سجل العهد المالية للموظفين' : 'سجل سلف العاملين والأقساط'} data={getExportData()} filename={`report_${activeTab}`} />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
        <button onClick={() => setActiveTab('custody')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition ${activeTab === 'custody' ? 'bg-purple-600 text-white shadow' : 'text-slate-700 hover:bg-white'}`}>
          العهد المالية للمشاريع والموظفين ({custodies.length})
        </button>
        <button onClick={() => setActiveTab('advances')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition ${activeTab === 'advances' ? 'bg-slate-900 text-white shadow' : 'text-slate-700 hover:bg-white'}`}>
          سلف العاملين والأقساط الشهرية ({advances.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="py-3.5 px-4">الموظف / المسؤول</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">المبلغ الأساسي</th>
                <th className="py-3.5 px-4">{activeTab === 'custody' ? 'تم تسويته' : 'القسط الشهري'}</th>
                <th className="py-3.5 px-4">{activeTab === 'custody' ? 'الرصيد المتبقي للعهدة' : 'الرصيد المتبقي للسلفة'}</th>
                <th className="py-3.5 px-4">التفاصيل والغرض</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'custody' ? filteredCustodies : filteredAdvances).map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.employeeName}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{activeTab === 'custody' ? (item as Custody).dateGiven : (item as EmployeeAdvance).date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-900">{formatCurrency(item.amount)}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{activeTab === 'custody' ? formatCurrency((item as Custody).settledAmount) : `${formatCurrency((item as EmployeeAdvance).monthlyDeduction)} / شهر`}</td>
                  <td className="py-3 px-4 font-mono font-extrabold text-red-600">{formatCurrency(item.remainingAmount)}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{activeTab === 'custody' ? (item as Custody).purpose : `تم سداد ${formatCurrency((item as EmployeeAdvance).repaidAmount)}`}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">{item.status === 'active' ? 'نشط / جاري' : 'مكتمل التسوية'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-slate-100 rounded-lg"><Edit2 className="w-4 h-4 text-slate-700" /></button>
                      <button onClick={() => handleDelete(item.id, activeTab)} className="p-1.5 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'تعديل البيانات' : `إضافة ${activeTab === 'custody' ? 'عهدة' : 'سلفة'}`}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">الموظف *</label>
                <select value={empId} onChange={e => setEmpId(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold">
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">المبلغ ({getSystemCurrency()}) *</label>
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full font-mono bg-slate-50 border rounded-lg p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">التاريخ *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold" />
                </div>
              </div>
              {activeTab === 'custody' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1">الغرض من العهدة *</label>
                    <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} required placeholder="مشتريات موقع..." className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">المبلغ المسوى بالفواتير ({getSystemCurrency()})</label>
                    <input type="number" value={settledAmount} onChange={e => setSettledAmount(Number(e.target.value))} className="w-full font-mono bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 font-bold" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1">قسط الخصم الشهري ({getSystemCurrency()})</label>
                    <input type="number" value={monthlyDeduction} onChange={e => setMonthlyDeduction(Number(e.target.value))} className="w-full font-mono bg-slate-50 border rounded-lg p-2.5 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">المسدد من السلفة ({getSystemCurrency()})</label>
                    <input type="number" value={repaidAmount} onChange={e => setRepaidAmount(Number(e.target.value))} className="w-full font-mono bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 font-bold" />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
