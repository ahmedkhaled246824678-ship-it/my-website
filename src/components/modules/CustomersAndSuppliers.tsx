import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  FileText,
  Phone,
  Mail,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  FileSpreadsheet,
  MessageSquare,
  Send,
  Globe
} from 'lucide-react';
import { CustomerSupplier, JournalEntry, TreasuryTransaction, CompanySettings, UserAccount } from '../../types';
import { saveCustomersSuppliers } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { printReportAsPDF } from '../../utils/export';
import { openWhatsApp, generateStatementWhatsAppMessage } from '../../utils/whatsapp';
import { AccountPdfOptions, shareAccountPdfViaWhatsApp, generateAccountPdfBlob } from '../../utils/pdfGenerator';
import { Language, t } from '../../utils/i18n';

interface CustomersAndSuppliersProps {
  customersSuppliers: CustomerSupplier[];
  journalEntries: JournalEntry[];
  treasuryTxs: TreasuryTransaction[];
  settings?: CompanySettings;
  currentUser?: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const CustomersAndSuppliers: React.FC<CustomersAndSuppliersProps> = ({
  customersSuppliers = [],
  journalEntries = [],
  treasuryTxs = [],
  settings,
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const [activeType, setActiveType] = useState<'customer' | 'supplier'>('customer');
  const [showModal, setShowModal] = useState(false);
  const [editingCS, setEditingCS] = useState<CustomerSupplier | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<CustomerSupplier | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<CustomerSupplier | null>(null);
  const [customPhone, setCustomPhone] = useState('');

  const currency = settings?.currency || 'ر.س';
  const companyNameSetting = settings?.companyName || 'شركة الرؤية المتكاملة';

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(100000);
  const [notes, setNotes] = useState('');

  const canAdd = currentUser?.permissions?.canAdd ?? true;
  const canEdit = currentUser?.permissions?.canEdit ?? true;
  const canDelete = currentUser?.permissions?.canDelete ?? true;

  // الفلترة
  const filteredList = customersSuppliers.filter(cs => {
    const matchesType = cs.type === activeType;
    const matchesSearch = !searchQuery ||
      cs.name.includes(searchQuery) ||
      cs.code.includes(searchQuery) ||
      (cs.companyName && cs.companyName.includes(searchQuery));
    return matchesType && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingCS(null);
    setCode(activeType === 'customer' ? `CUST-${Math.floor(Math.random() * 899 + 100)}` : `SUPP-${Math.floor(Math.random() * 899 + 100)}`);
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setTaxNumber('');
    setAddress('');
    setOpeningBalance(0);
    setCreditLimit(150000);
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (cs: CustomerSupplier) => {
    setEditingCS(cs);
    setCode(cs.code);
    setName(cs.name);
    setCompanyName(cs.companyName || '');
    setPhone(cs.phone);
    setEmail(cs.email);
    setTaxNumber(cs.taxNumber || '');
    setAddress(cs.address || '');
    setOpeningBalance(cs.openingBalance);
    setCreditLimit(cs.creditLimit || 100000);
    setNotes(cs.notes || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      customAlert('يرجى إدخال الكود والاسم بشكل صحيح', 'error');
      return;
    }

    let updated: CustomerSupplier[];
    if (editingCS) {
      updated = customersSuppliers.map(item => {
        if (item.id === editingCS.id) {
          return {
            ...item,
            code,
            name,
            companyName,
            phone,
            email,
            taxNumber,
            address,
            openingBalance: Number(openingBalance),
            creditLimit: Number(creditLimit),
            notes
          };
        }
        return item;
      });
    } else {
      const newItem: CustomerSupplier = {
        id: `cs_${Date.now()}`,
        type: activeType,
        code,
        name,
        companyName,
        phone,
        email,
        taxNumber,
        address,
        openingBalance: Number(openingBalance),
        currentBalance: Number(openingBalance),
        creditLimit: Number(creditLimit),
        notes
      };
      updated = [...customersSuppliers, newItem];
    }

    saveCustomersSuppliers(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingCS ? 'تم تعديل البيانات بنجاح' : 'تم الإضافة إلى القائمة بنجاح', 'success');
  };

  const handleDelete = (id: string, nm: string) => {
    customConfirm(`تنبيه: هل أنت متأكد من حذف الحساب "${nm}"؟`, () => {
      const updated = customersSuppliers.filter(c => c.id !== id);
      saveCustomersSuppliers(updated);
      onRefresh();
      customAlert('تم الحذف بنجاح', 'success');
    }, 'تأكيد حذف العميل/المورد');
  };

  // استخراج كشف حساب تفصيلي للعميل أو المورد (Account Statement)
  const getAccountStatement = (cs: CustomerSupplier) => {
    const lines: { date: string; ref: string; description: string; debit: number; credit: number; balance: number }[] = [];
    
    // الرصيد الافتتاحي
    let runBal = cs.openingBalance;
    lines.push({
      date: 'افتتاحي',
      ref: 'OPENING',
      description: 'الرصيد الافتتاحي أول المدة',
      debit: runBal > 0 ? runBal : 0,
      credit: runBal < 0 ? Math.abs(runBal) : 0,
      balance: runBal
    });

    // جمع القيود الخاصة به
    journalEntries.forEach(entry => {
      if (!entry.isPosted) return;
      if (entry.referenceId === cs.id || entry.description.includes(cs.name) || (cs.companyName && entry.description.includes(cs.companyName))) {
        let deb = 0;
        let cred = 0;
        if (cs.type === 'customer') {
          if (entry.description.includes('تحصيل') || entry.description.includes('سداد')) {
            cred = entry.totalCredit;
            runBal -= cred;
          } else {
            deb = entry.totalDebit;
            runBal += deb;
          }
        } else {
          if (entry.description.includes('سداد') || entry.description.includes('صرف')) {
            deb = entry.totalDebit;
            runBal += deb;
          } else {
            cred = entry.totalCredit;
            runBal -= cred;
          }
        }

        lines.push({
          date: entry.date,
          ref: entry.entryNumber,
          description: entry.description,
          debit: deb,
          credit: cred,
          balance: runBal
        });
      }
    });

    return lines;
  };

  // طباعة كشف الحساب
  const handlePrintStatement = (cs: CustomerSupplier) => {
    const lines = getAccountStatement(cs);
    let rowsHtml = '';
    lines.forEach(l => {
      rowsHtml += `
        <tr>
          <td class="text-center font-mono">${l.date}</td>
          <td class="text-center font-mono font-bold">${l.ref}</td>
          <td>${l.description}</td>
          <td class="text-center font-mono font-bold text-green">${l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
          <td class="text-center font-mono font-bold text-red">${l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
          <td class="text-center font-mono font-extrabold" style="background: #eff6ff;">${l.balance.toLocaleString()} ${currency}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #cbd5e1;">
        <table style="margin: 0; border: none;">
          <tr style="background: transparent !important;">
            <td style="border: none;"><strong>اسم ${cs.type === 'customer' ? 'العميل' : 'المورد'}:</strong> ${cs.name} (${cs.companyName || ''})</td>
            <td style="border: none;"><strong>كود الحساب:</strong> ${cs.code}</td>
            <td style="border: none;"><strong>الرقم الضريبي:</strong> ${cs.taxNumber || 'غير مسجل'}</td>
          </tr>
          <tr style="background: transparent !important;">
            <td style="border: none;"><strong>الهاتف:</strong> ${cs.phone}</td>
            <td style="border: none;"><strong>البريد:</strong> ${cs.email}</td>
            <td style="border: none;"><strong>الرصيد المستحق الحالي:</strong> <span style="font-size: 16px; font-weight: 800; color: #1e3a8a;">${cs.currentBalance.toLocaleString()} ${currency}</span></td>
          </tr>
        </table>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 100px;">التاريخ</th>
            <th style="width: 110px;">رقم المستند / القيد</th>
            <th>البيان وشرح المعاملة</th>
            <th style="width: 120px;">مدين (${currency})</th>
            <th style="width: 120px;">دائن (${currency})</th>
            <th style="width: 140px;">الرصيد التراكمي</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    printReportAsPDF(`كشف حساب تفصيلي - ${cs.name}`, htmlContent, `الرصيد النهائي المستحق: ${cs.currentBalance.toLocaleString()} ${currency}`);
  };

  // إرسال كشف الحساب بالواتساب (نص)
  const handleSendWhatsAppStatement = (cs: CustomerSupplier) => {
    const lines = getAccountStatement(cs);
    const recentLines = lines.slice(-5); // آخر 5 حركات
    const details = recentLines.map(l => 
      `${l.date} | ${l.description} | ${l.debit > 0 ? `+${l.debit.toLocaleString()}` : `-${l.credit.toLocaleString()}`} ${currency} (رصيد: ${l.balance.toLocaleString()} ${currency})`
    );

    const message = generateStatementWhatsAppMessage({
      companyName: companyNameSetting,
      accountName: cs.name,
      accountCode: cs.code,
      phone: customPhone || cs.phone,
      currency,
      currentBalance: cs.currentBalance,
      type: cs.type,
      details
    });

    openWhatsApp(customPhone || cs.phone, message);
    setShowWhatsAppModal(null);
  };

  // إرسال كشف الحساب بصيغة PDF عبر الواتساب
  const handleSendPdfWhatsAppStatement = async (cs: CustomerSupplier) => {
    const lines = getAccountStatement(cs);
    const recentLines = lines.slice(-5);
    const details = recentLines.map(l => 
      `${l.date} | ${l.description} | ${l.debit > 0 ? `+${l.debit.toLocaleString()}` : `-${l.credit.toLocaleString()}`} ${currency} (رصيد: ${l.balance.toLocaleString()} ${currency})`
    );

    const message = generateStatementWhatsAppMessage({
      companyName: companyNameSetting,
      accountName: cs.name,
      accountCode: cs.code,
      phone: customPhone || cs.phone,
      currency,
      currentBalance: cs.currentBalance,
      type: cs.type,
      details
    });

    const pdfRows = lines.map((l, i) => [
      `${i + 1}`,
      l.date,
      l.ref,
      l.description,
      l.debit > 0 ? l.debit.toLocaleString() : '-',
      l.credit > 0 ? l.credit.toLocaleString() : '-',
      `${l.balance.toLocaleString()} ${currency}`
    ]);

    const totalDeb = lines.reduce((s, l) => s + l.debit, 0);
    const totalCred = lines.reduce((s, l) => s + l.credit, 0);

    const pdfOptions: AccountPdfOptions = {
      title: `كشف حساب تفصيلي - ${cs.type === 'customer' ? 'عميل' : 'مورد'}`,
      subtitle: `${cs.name} (${cs.companyName || ''})`,
      accountName: cs.name,
      accountCode: cs.code,
      accountType: cs.type === 'customer' ? 'عميل' : 'مورد',
      date: new Date().toISOString().slice(0, 10),
      currency,
      openingBalance: cs.openingBalance,
      totalDebit: totalDeb,
      totalCredit: totalCred,
      closingBalance: cs.currentBalance,
      headers: ['م', 'التاريخ', 'رقم المستند / القيد', 'البيان وشرح المعاملة', `مدين (${currency})`, `دائن (${currency})`, 'الرصيد التراكمي'],
      rows: pdfRows,
      totals: [
        { label: 'إجمالي المدين (+)', value: `${totalDeb.toLocaleString()} ${currency}`, isDebit: true },
        { label: 'إجمالي الدائن (-)', value: `${totalCred.toLocaleString()} ${currency}`, isCredit: true },
        { label: 'الرصيد المستحق النهائي', value: `${cs.currentBalance.toLocaleString()} ${currency}` }
      ],
      notes: `رقم الهاتف: ${cs.phone} | الرقم الضريبي: ${cs.taxNumber || 'غير مسجل'}`
    };

    await shareAccountPdfViaWhatsApp(customPhone || cs.phone, message, pdfOptions);
    setShowWhatsAppModal(null);
  };

  // تحضير بيانات التصدير
  const exportData = filteredList.map(c => ({
    'الكود': c.code,
    'الاسم': c.name,
    'الشركة / المنشأة': c.companyName || '-',
    'الهاتف': c.phone,
    'البريد': c.email,
    'الرقم الضريبي': c.taxNumber || '-',
    'الرصيد الافتتاحي': c.openingBalance,
    'الرصيد المستحق الحالي': c.currentBalance,
    'حد الائتمان': c.creditLimit || '-'
  }));

  return (
    <div className="space-y-6">
      {/* رأس الصفحة والتنقل بين التبويبات */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-blue-400">
            <Users className="w-6 h-6" />
            <span>{t('customers_suppliers', lang)}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            إدارة حسابات العملاء والموردين، طباعة كشوف الحسابات التفصيلية، وإرسال إشعارات الأرصدة عبر واتساب
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة {activeType === 'customer' ? 'عميل جديد' : 'مورد جديد'}</span>
            </button>
          )}

          <ExportButtons
            title={`قائمة ${activeType === 'customer' ? 'العملاء المدينين' : 'الموردين الدائنين'}`}
            subtitle={`إجمالي العدد: ${filteredList.length}`}
            data={exportData}
            fileName={`list_${activeType}s`}
          />
        </div>
      </div>

      {/* شريط أزرار التبويبات */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveType('customer')}
          className={`px-6 py-2.5 rounded-lg font-bold text-xs transition flex items-center gap-2 ${
            activeType === 'customer' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>العملاء (المدينون والتحصيلات)</span>
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
            {customersSuppliers.filter(c => c.type === 'customer').length}
          </span>
        </button>

        <button
          onClick={() => setActiveType('supplier')}
          className={`px-6 py-2.5 rounded-lg font-bold text-xs transition flex items-center gap-2 ${
            activeType === 'supplier' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-yellow-400" />
          <span>الموردون (الدائنون والمشتريات)</span>
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
            {customersSuppliers.filter(c => c.type === 'supplier').length}
          </span>
        </button>
      </div>

      {/* جدول العملاء أو الموردين */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">الكود</th>
                <th className="py-3.5 px-4 font-bold">الاسم والمنشأة</th>
                <th className="py-3.5 px-4 font-bold">بيانات الاتصال</th>
                <th className="py-3.5 px-4 font-bold">الرصيد الافتتاحي</th>
                <th className="py-3.5 px-4 font-bold">الرصيد الحالي المستحق</th>
                <th className="py-3.5 px-4 font-bold text-center">كشف الحساب والواتساب</th>
                <th className="py-3.5 px-4 font-bold text-center">تعديل / حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredList.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{item.code}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    {item.companyName && <div className="text-xs text-slate-400 mt-0.5">{item.companyName}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{item.phone}</span>
                    </div>
                    {item.taxNumber && <div className="text-slate-400 text-[10px] mt-0.5">ضريبي: {item.taxNumber}</div>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {item.openingBalance.toLocaleString()} {currency}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-sm">
                    <span className={item.currentBalance < 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {item.currentBalance.toLocaleString()} {currency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedStatement(item)}
                        className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs rounded-lg transition flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>كشف الحساب</span>
                      </button>

                      {/* زر إرسال واتساب المباشر */}
                      <button
                        onClick={() => {
                          setShowWhatsAppModal(item);
                          setCustomPhone(item.phone || '');
                        }}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition"
                        title="إرسال كشف الحساب والرصيد عبر واتساب"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handlePrintStatement(item)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="طباعة كشف حساب تفصيلي PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit && (
                        <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة عرض كشف الحساب التفصيلي */}
      {selectedStatement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">كشف حساب تفصيلي: {selectedStatement.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  الرصيد النهائي المستحق حتى اليوم: <strong className="text-emerald-400 font-mono text-base">{selectedStatement.currentBalance.toLocaleString()} {currency}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(selectedStatement);
                    setCustomPhone(selectedStatement.phone || '');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>إرسال بالواتساب</span>
                </button>
                <button
                  onClick={() => handlePrintStatement(selectedStatement)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة PDF</span>
                </button>
                <button onClick={() => setSelectedStatement(null)} className="text-slate-400 hover:text-white text-2xl font-bold">×</button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">رقم المستند / القيد</th>
                    <th className="py-3 px-3">البيان والشرح</th>
                    <th className="py-3 px-3 text-center">مدين ({currency})</th>
                    <th className="py-3 px-3 text-center">دائن ({currency})</th>
                    <th className="py-3 px-3 text-center text-blue-300 font-bold">الرصيد التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {getAccountStatement(selectedStatement).map((row, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-slate-800/60 font-bold' : 'hover:bg-slate-800/30'}>
                      <td className="py-2.5 px-3 font-mono">{row.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{row.ref}</td>
                      <td className="py-2.5 px-3 text-slate-100">{row.description}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-center">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-400 text-center">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-blue-300 text-center">{row.balance.toLocaleString()} {currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedStatement(null)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد إرسال واتساب */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>إرسال كشف الحساب عبر واتساب</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(null)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white text-sm">{showWhatsAppModal.name}</div>
                <div className="text-slate-400 mt-1">كود الحساب: {showWhatsAppModal.code} ({showWhatsAppModal.type === 'customer' ? 'عميل' : 'مورد'})</div>
                <div className="text-emerald-400 font-bold mt-1">الرصيد المستحق: {showWhatsAppModal.currentBalance.toLocaleString()} {currency}</div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  رقم الواتساب للمستلم (اختياري - أو اتركه فارغاً لفتح واتساب العام):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثال: 0501234567 (أو اترك فارغاً لاختيار المستلم من محادثات واتساب)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  {customPhone && (
                    <button
                      type="button"
                      onClick={() => setCustomPhone('')}
                      className="px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold"
                      title="مسح الرقم لفتح واتساب العام واختيار المستلم من المحادثات"
                    >
                      مسح
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 عند ترك الحقل فارغاً أو الضغط على "واتساب العام"، يفتح تطبيق واتساب العام لتختار أي شخص أو مجموعة من محادثاتك مباشرة.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const temp = customPhone;
                    setCustomPhone('');
                    handleSendWhatsAppStatement(showWhatsAppModal);
                    setCustomPhone(temp);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
                  title="فتح تطبيق واتساب العام لتحديد المستلم من المحادثات"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>فتح واتساب العام (نص) 🌐</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPdfWhatsAppStatement(showWhatsAppModal)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg shadow-md transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{customPhone ? `إرسال PDF للرقم (${customPhone}) ⚡` : 'إرسال PDF عبر واتساب العام ⚡'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإضافة والتعديل */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-4">
              {editingCS ? `تعديل بيانات ${activeType === 'customer' ? 'العميل' : 'المورد'}` : `إضافة ${activeType === 'customer' ? 'عميل جديد' : 'مورد جديد'}`}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">الكود *</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">الرقم الضريبي</label>
                  <input type="text" value={taxNumber} onChange={e => setTaxNumber(e.target.value)} className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">الاسم الأساسي *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="اسم الشخص المسؤول أو المجموعة" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">اسم الشركة / المنشأة</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="الشركة..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">رقم الهاتف / واتساب *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">البريد الإلكتروني</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">الرصيد الافتتاحي ({currency})</label>
                  <input type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">حد الائتمان ({currency})</label>
                  <input type="number" step="0.01" value={creditLimit} onChange={e => setCreditLimit(Number(e.target.value))} className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">العنوان والملاحظات</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
