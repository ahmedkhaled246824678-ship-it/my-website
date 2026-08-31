import React, { useState } from 'react';
import { UserCheck, Plus, Edit2, Trash2, Search, DollarSign, Briefcase, CheckCircle2, AlertCircle, Phone, Mail, Building, FileSpreadsheet, Layers, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Employee } from '../../types';
import { saveEmployees, getAdvances } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { formatCurrency, getSystemCurrency } from '../../utils/currency';

interface HRModuleProps {
  employees: Employee[];
  onRefresh: () => void;
  searchQuery: string;
}

export const HRModule: React.FC<HRModuleProps> = ({ employees, onRefresh, searchQuery }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('الإدارة الهندسية والمشاريع');
  const [position, setPosition] = useState('مهندس موقع');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [basicSalary, setBasicSalary] = useState<number | ''>('');
  const [housingAllowance, setHousingAllowance] = useState<number | ''>(0);
  const [transportAllowance, setTransportAllowance] = useState<number | ''>(0);
  const [otherAllowances, setOtherAllowances] = useState<number | ''>(0);
  const [insuranceDeduction, setInsuranceDeduction] = useState<number | ''>(0);
  const [advanceDeduction, setAdvanceDeduction] = useState<number | ''>(0);
  const [otherDeductions, setOtherDeductions] = useState<number | ''>(0);
  const [status, setStatus] = useState<'active' | 'on_leave' | 'terminated'>('active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // جلب السلف النشطة لربطها تلقائياً بالمستحق
  const activeAdvances = getAdvances().filter(a => a.status === 'active');

  const getEmpAdvanceDeduction = (emp: Employee) => {
    if (typeof emp.advanceDeduction === 'number') return emp.advanceDeduction;
    const adv = activeAdvances.find(a => a.employeeId === emp.id || a.employeeName.includes(emp.name) || emp.name.includes(a.employeeName));
    return adv ? adv.monthlyDeduction : 0;
  };

  const getEmpOtherDeductions = (emp: Employee) => Number(emp.otherDeductions || 0);

  const getEmpTotalDeductions = (emp: Employee) => {
    return (emp.insuranceDeduction || 0) + getEmpAdvanceDeduction(emp) + getEmpOtherDeductions(emp);
  };

  const getEmpNetPayroll = (emp: Employee) => {
    const totalAllow = (emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.otherAllowances || 0);
    return emp.basicSalary + totalAllow - getEmpTotalDeductions(emp);
  };

  const filteredEmployees = employees.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.position.toLowerCase().includes(q)
    );
  });

  const totalBasicSalaries = filteredEmployees.reduce((sum, e) => sum + e.basicSalary, 0);
  const totalAllowances = filteredEmployees.reduce((sum, e) => sum + (e.housingAllowance + e.transportAllowance + e.otherAllowances), 0);
  const totalInsurance = filteredEmployees.reduce((sum, e) => sum + (e.insuranceDeduction || 0), 0);
  const totalAdvancesDed = filteredEmployees.reduce((sum, e) => sum + getEmpAdvanceDeduction(e), 0);
  const totalOtherDed = filteredEmployees.reduce((sum, e) => sum + getEmpOtherDeductions(e), 0);
  const totalAllDeductions = totalInsurance + totalAdvancesDed + totalOtherDed;
  const totalNetPayroll = totalBasicSalaries + totalAllowances - totalAllDeductions;

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setDepartment('الإدارة الهندسية والمشاريع');
    setPosition('مهندس موقع');
    setJoinDate(new Date().toISOString().slice(0, 10));
    setBasicSalary('');
    setHousingAllowance(1000);
    setTransportAllowance(500);
    setOtherAllowances(0);
    setInsuranceDeduction(300);
    setAdvanceDeduction(0);
    setOtherDeductions(0);
    setStatus('active');
    setPhone('');
    setEmail('');
    setBankAccount('');
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setCode(emp.code);
    setName(emp.name);
    setDepartment(emp.department);
    setPosition(emp.position);
    setJoinDate(emp.joinDate);
    setBasicSalary(emp.basicSalary);
    setHousingAllowance(emp.housingAllowance);
    setTransportAllowance(emp.transportAllowance);
    setOtherAllowances(emp.otherAllowances);
    setInsuranceDeduction(emp.insuranceDeduction);
    setAdvanceDeduction(getEmpAdvanceDeduction(emp));
    setOtherDeductions(getEmpOtherDeductions(emp));
    setStatus(emp.status);
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setBankAccount(emp.bankAccount || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || basicSalary === '') {
      alert('يرجى إدخال اسم الموظف والراتب الأساسي');
      return;
    }

    const basic = Number(basicSalary);
    const housing = Number(housingAllowance || 0);
    const transport = Number(transportAllowance || 0);
    const other = Number(otherAllowances || 0);
    const ins = Number(insuranceDeduction || 0);
    const advDed = Number(advanceDeduction || 0);
    const otherDed = Number(otherDeductions || 0);

    let updated: Employee[];
    if (editingEmp) {
      updated = employees.map(item => item.id === editingEmp.id ? {
        ...item,
        code,
        name,
        department,
        position,
        joinDate,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        insuranceDeduction: ins,
        advanceDeduction: advDed,
        otherDeductions: otherDed,
        status,
        phone,
        email,
        bankAccount
      } : item);
    } else {
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        code,
        name,
        department,
        position,
        joinDate,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        insuranceDeduction: ins,
        advanceDeduction: advDed,
        otherDeductions: otherDed,
        status,
        phone,
        email,
        bankAccount
      };
      updated = [newEmp, ...employees];
    }

    saveEmployees(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingEmp ? 'تم تحديث بيانات واستقطاعات الموظف بنجاح' : 'تم إضافة الموظف الجديد لكشف الرواتب بنجاح', 'success');
  };

  const handleDelete = (id: string, empName: string) => {
    customConfirm(`هل أنت متأكد من حذف الموظف "${empName}" من سجلات الشركة؟`, () => {
      saveEmployees(employees.filter(e => e.id !== id));
      onRefresh();
      customAlert('تم حذف الموظف بنجاح', 'success');
    }, 'تأكيد حذف الموظف');
  };

  const exportData = filteredEmployees.map(e => {
    const advDed = getEmpAdvanceDeduction(e);
    const otherDed = getEmpOtherDeductions(e);
    const totalDed = getEmpTotalDeductions(e);
    const net = getEmpNetPayroll(e);
    return {
      'كود الموظف': e.code,
      'اسم الموظف الكامل': e.name,
      'الإدارة / القسم': e.department,
      'المسمى الوظيفي': e.position,
      'تاريخ المباشرة': e.joinDate,
      'الراتب الأساسي': e.basicSalary,
      'بدل السكن': e.housingAllowance,
      'بدل الانتقال': e.transportAllowance,
      'بدلات أخرى': e.otherAllowances,
      'خصم التأمينات': e.insuranceDeduction,
      'خصم السلف (قسط شهري)': advDed,
      'خصومات أخرى (جزاءات/غياب)': otherDed,
      'إجمالي الخصومات والسلف': totalDed,
      'صافي الراتب المستحق': net,
      'رقم الحساب البنكي (IBAN)': e.bankAccount || '-',
      'الحالة': e.status === 'active' ? 'على رأس العمل' : e.status === 'on_leave' ? 'إجازة رسمية' : 'منتهي الخدمات'
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* رأس الصفحة والإحصائيات */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
              <UserCheck className="w-6 h-6" />
              <span>شؤون الموظفين وكشف الرواتب والاستحقاقات</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              إدارة بيانات العاملين، الرواتب الأساسية، البدلات (سكن ومواصلات)، استقطاعات التأمينات وحساب صافي الرواتب الشهرية.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons
              title="كشف مسيرات الرواتب وشؤون الموظفين"
              subtitle="تفاصيل الرواتب الأساسية والبدلات والاستقطاعات وصافي المستحق لكل موظف"
              data={exportData}
              filename="hr_payroll_report"
            />
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* مؤشرات الرواتب الشهري */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي عدد الموظفين</div>
            <div className="text-2xl font-extrabold text-white mt-1">{filteredEmployees.length} <span className="text-xs font-normal text-slate-400">موظف مسجل</span></div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي الاستحقاقات (رواتب وبدلات)</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">{formatCurrency(totalBasicSalaries + totalAllowances)} <span className="text-xs font-normal text-slate-400">/ شهر</span></div>
            <div className="text-[10px] text-slate-400 mt-1">أساسي: {formatCurrency(totalBasicSalaries)} | بدلات: {formatCurrency(totalAllowances)}</div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي الخصومات والسلف</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{formatCurrency(totalAllDeductions)} <span className="text-xs font-normal text-slate-400">/ شهر</span></div>
            <div className="text-[10px] text-slate-400 mt-1">تأمينات: {formatCurrency(totalInsurance)} | سلف: {formatCurrency(totalAdvancesDed)} | جزاءات: {formatCurrency(totalOtherDed)}</div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">صافي مسير الرواتب المستحق</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatCurrency(totalNetPayroll)} <span className="text-xs font-normal text-slate-400">/ شهر</span></div>
            <div className="text-[10px] text-emerald-300/80 mt-1">جاهز للتحويل البنكي عبر الحسابات المسجلة</div>
          </div>
        </div>
      </div>

      {/* جدول الموظفين والرواتب */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>قائمة العاملين ومسير الرواتب الشهري ({filteredEmployees.length})</span>
          </h3>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>الصافي = الراتب الأساسي + (بدل السكن + المواصلات + البدلات) - (التأمينات + قسط السلف + الجزاءات)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-bold">كود الموظف</th>
                <th className="py-3 px-3 font-bold">اسم الموظف والوظيفة</th>
                <th className="py-3 px-3 font-bold">الإدارة / القسم</th>
                <th className="py-3 px-3 font-bold text-center">الراتب الأساسي</th>
                <th className="py-3 px-3 font-bold text-center">إجمالي البدلات</th>
                <th className="py-3 px-3 font-bold text-center">خصم التأمينات</th>
                <th className="py-3 px-3 font-bold text-center text-red-700">خصم السلف (قسط)</th>
                <th className="py-3 px-3 font-bold text-center text-red-700">جزاءات / غياب</th>
                <th className="py-3 px-3 font-bold text-center bg-red-50 text-red-900 font-extrabold">إجمالي الخصم</th>
                <th className="py-3 px-3 font-bold text-center bg-emerald-50 text-emerald-900 font-extrabold">صافي الراتب المستحق</th>
                <th className="py-3 px-3 font-bold">الحساب البنكي (IBAN)</th>
                <th className="py-3 px-3 font-bold text-center">الحالة</th>
                <th className="py-3 px-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredEmployees.map(emp => {
                const totalAllow = (emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.otherAllowances || 0);
                const advDed = getEmpAdvanceDeduction(emp);
                const otherDed = getEmpOtherDeductions(emp);
                const totalDed = getEmpTotalDeductions(emp);
                const net = getEmpNetPayroll(emp);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">{emp.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{emp.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{emp.position}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">{emp.department}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{emp.basicSalary.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="font-bold text-amber-700">{totalAllow.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">سكن: {(emp.housingAllowance || 0).toLocaleString()} | نقل: {(emp.transportAllowance || 0).toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-red-600 font-semibold">-{(emp.insuranceDeduction || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <div className={`font-bold ${advDed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{advDed > 0 ? `-${advDed.toLocaleString()}` : '0'}</div>
                      {advDed > 0 && <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-sans inline-block mt-0.5">قسط سلفة</span>}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      <div className={otherDed > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>{otherDed > 0 ? `-${otherDed.toLocaleString()}` : '0'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-extrabold text-red-700 bg-red-50/50">
                      -{totalDed.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-700 bg-emerald-50/60 text-sm">{formatCurrency(net)}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{emp.bankAccount || 'غير مسجل'}</td>
                    <td className="py-3 px-3 text-center">
                      {emp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>على رأس العمل</span>
                        </span>
                      ) : emp.status === 'on_leave' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <span>إجازة رسمية</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          <span>منتهي الخدمات</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="تعديل الراتب والبدلات والبيانات"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 text-sm">
                    لا يوجد موظفون يطابقون البحث الحالي. قم بالضغط على "إضافة موظف جديد" لتسجيل المهندسين والإداريين والعمال.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة الإضافة والتعديل */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>{editingEmp ? 'تعديل بيانات الموظف والراتب' : 'تسجيل موظف جديد في شؤون الموظفين'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الموظف (ID)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم الموظف الكامل <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: م. فهد بن عبد العزيز العتيبي"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الإدارة / القسم</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="الإدارة الهندسية والمشاريع">الإدارة الهندسية والمشاريع</option>
                    <option value="الإدارة المالية والمحاسبة">الإدارة المالية والمحاسبة</option>
                    <option value="الإدارة العامة والتنفيذية">الإدارة العامة والتنفيذية</option>
                    <option value="الموارد البشرية والشؤون الإدارية">الموارد البشرية والشؤون الإدارية</option>
                    <option value="التسويق والمبيعات والعلاقات">التسويق والمبيعات والعلاقات</option>
                    <option value="المشتريات والخدمات اللوجستية">المشتريات والخدمات اللوجستية</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="مثال: مدير مشروع / محاسب أول"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ المباشرة</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* قسم الرواتب والبدلات (الاستحقاق) */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5 border-b border-emerald-200 pb-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>الراتب الأساسي والبدلات الشهرية (إجمالي الاستحقاقات)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الراتب الأساسي <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">بدل سكن</label>
                    <input
                      type="number"
                      min={0}
                      value={housingAllowance}
                      onChange={(e) => setHousingAllowance(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">بدل مواصلات</label>
                    <input
                      type="number"
                      min={0}
                      value={transportAllowance}
                      onChange={(e) => setTransportAllowance(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">بدلات أخرى</label>
                    <input
                      type="number"
                      min={0}
                      value={otherAllowances}
                      onChange={(e) => setOtherAllowances(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-semibold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200 font-bold text-xs text-emerald-800">
                  <span>إجمالي الاستحقاقات الشهرية:</span>
                  <span className="font-mono text-sm">{formatCurrency((Number(basicSalary) || 0) + (Number(housingAllowance) || 0) + (Number(transportAllowance) || 0) + (Number(otherAllowances) || 0))}</span>
                </div>
              </div>

              {/* قسم الاستقطاعات والخصومات (تأمينات، سلف، جزاءات) */}
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-3">
                <h4 className="font-bold text-sm text-red-900 flex items-center gap-1.5 border-b border-red-200 pb-2">
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                  <span>الاستقطاعات والخصومات الشهرية (تأمينات، سلف، جزاءات)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">خصم التأمينات الاجتماعية</label>
                    <input
                      type="number"
                      min={0}
                      value={insuranceDeduction}
                      onChange={(e) => setInsuranceDeduction(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-red-300 rounded-lg p-2 font-mono font-bold text-red-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      <span>قسط السلفة الشهري</span>
                      <span className="text-[10px] text-slate-400 font-normal mr-1">(سلف مستردة)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={advanceDeduction}
                      onChange={(e) => setAdvanceDeduction(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-red-300 rounded-lg p-2 font-mono font-bold text-red-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      <span>خصومات أخرى / جزاءات</span>
                      <span className="text-[10px] text-slate-400 font-normal mr-1">(غياب أو تأخير)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white border border-red-300 rounded-lg p-2 font-mono font-bold text-red-700"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-red-200 font-bold text-xs text-red-800">
                  <span>إجمالي الخصومات والاستقطاعات:</span>
                  <span className="font-mono text-sm">-{formatCurrency((Number(insuranceDeduction) || 0) + (Number(advanceDeduction) || 0) + (Number(otherDeductions) || 0))}</span>
                </div>
              </div>

              {/* صافي الراتب النهائي */}
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3.5 rounded-xl shadow-md font-bold text-sm">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-200" />
                  <span>صافي الراتب الشهري المستحق للدفع:</span>
                </span>
                <span className="font-mono text-lg font-extrabold bg-black/20 px-3 py-1 rounded-lg border border-white/10">
                  {formatCurrency((Number(basicSalary) || 0) + (Number(housingAllowance) || 0) + (Number(transportAllowance) || 0) + (Number(otherAllowances) || 0) - ((Number(insuranceDeduction) || 0) + (Number(advanceDeduction) || 0) + (Number(otherDeductions) || 0)))}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الحساب البنكي (IBAN)</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="SA1234567890123456789012"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / الجوال</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0500000000"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة العمل</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="active">على رأس العمل (نشط)</option>
                    <option value="on_leave">في إجازة رسمية / سنوية</option>
                    <option value="terminated">منتهي الخدمات / مستقيل</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <span>{editingEmp ? 'حفظ تعديلات الموظف' : 'إضافة الموظف لمسير الرواتب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
