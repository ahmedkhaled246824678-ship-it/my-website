import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  FileText,
  Phone,
  MessageSquare,
  AlertTriangle,
  HardHat,
  TrendingDown,
  TrendingUp,
  Layers,
  Wrench
} from 'lucide-react';
import { SiteSettlement, SiteExpenseItem, CostCenter, Employee, CompanySettings, UserAccount } from '../../types';
import { saveSiteSettlements } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { openWhatsApp, generateSiteSettlementWhatsAppMessage } from '../../utils/whatsapp';
import { Language, t } from '../../utils/i18n';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange, formatFilterPeriodDescription } from '../../utils/dateFilter';

interface SiteSettlementsModuleProps {
  settlements: SiteSettlement[];
  costCenters: CostCenter[];
  employees: Employee[];
  settings: CompanySettings;
  currentUser: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const SiteSettlementsModule: React.FC<SiteSettlementsModuleProps> = ({
  settlements,
  costCenters,
  employees,
  settings,
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState<SiteSettlement | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<SiteSettlement | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<SiteSettlement | null>(null);
  const [customPhone, setCustomPhone] = useState('');

  // تصفية التاريخ بالأيام والشهور والسنة
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodLabel, setPeriodLabel] = useState<string>('كافة الفترات');

  // Form State لتسوية الموقع
  const [siteName, setSiteName] = useState(costCenters?.[0]?.name || '');
  const [costCenterId, setCostCenterId] = useState(costCenters?.[0]?.id || '');
  const [supervisorName, setSupervisorName] = useState(employees?.[0]?.name || '');
  const [supervisorPhone, setSupervisorPhone] = useState(employees?.[0]?.phone || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodFrom, setPeriodFrom] = useState(new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10));
  const [periodTo, setPeriodTo] = useState(new Date().toISOString().slice(0, 10));
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [transfersReceived, setTransfersReceived] = useState<number>(0);
  const [materialExpenses, setMaterialExpenses] = useState<number>(0);
  const [laborExpenses, setLaborExpenses] = useState<number>(0);
  const [operationalExpenses, setOperationalExpenses] = useState<number>(0);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [otherExpenseLabel, setOtherExpenseLabel] = useState<string>('');
  const [actualCashInHand, setActualCashInHand] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Form State لإضافة بند مصروف تفصيلي داخل شيت الموقع
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemDate, setItemDate] = useState(new Date().toISOString().slice(0, 10));
  const [itemType, setItemType] = useState<'material' | 'labor' | 'equipment' | 'misc'>('material');
  const [itemDesc, setItemDesc] = useState('');
  const [itemAmount, setItemAmount] = useState<number>(0);
  const [itemRecipient, setItemRecipient] = useState('');
  const [itemInvNo, setItemInvNo] = useState('');

  const canAdd = currentUser.permissions.canAdd;
  const canEdit = currentUser.permissions.canEdit;
  const canDelete = currentUser.permissions.canDelete;
  const canSettle = currentUser.permissions.canSettle ?? true;

  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      const matchesDate = isDateInRange(s.date, startDate, endDate);
      if (!matchesDate) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.siteName.toLowerCase().includes(q) ||
        s.supervisorName.toLowerCase().includes(q) ||
        s.settlementNumber.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    });
  }, [settlements, searchQuery, startDate, endDate]);

  // الإحصائيات للفترة المحددة
  const totalFunds = useMemo(() => filteredSettlements.reduce((sum, s) => sum + Number(s.totalReceived || 0), 0), [filteredSettlements]);
  const totalSpent = useMemo(() => filteredSettlements.reduce((sum, s) => sum + Number(s.totalSpent || 0), 0), [filteredSettlements]);
  const totalActualCash = useMemo(() => filteredSettlements.reduce((sum, s) => sum + Number(s.actualCashInHand || 0), 0), [filteredSettlements]);
  const discrepanciesCount = useMemo(() => filteredSettlements.filter(s => s.discrepancy !== 0).length, [filteredSettlements]);

  const handleOpenAdd = () => {
    setEditingSettlement(null);
    const firstCC = costCenters?.[0];
    const firstEmp = employees?.[0];
    setSiteName(firstCC ? firstCC.name : 'مشروع الموقع الرئيسي');
    setCostCenterId(firstCC ? firstCC.id : '');
    setSupervisorName(firstEmp ? firstEmp.name : 'المهندس المشرف');
    setSupervisorPhone(firstEmp ? firstEmp.phone || '' : '');
    setDate(new Date().toISOString().slice(0, 10));
    setPeriodFrom(new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10));
    setPeriodTo(new Date().toISOString().slice(0, 10));
    setOpeningCash(0);
    setTransfersReceived(0);
    setMaterialExpenses(0);
    setLaborExpenses(0);
    setOperationalExpenses(0);
    setOtherExpenses(0);
    setOtherExpenseLabel('');
    setActualCashInHand(0);
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: SiteSettlement) => {
    setEditingSettlement(s);
    setSiteName(s.siteName);
    setCostCenterId(s.costCenterId || '');
    setSupervisorName(s.supervisorName);
    setSupervisorPhone(s.supervisorPhone || '');
    setDate(s.date);
    setPeriodFrom(s.periodFrom || s.date);
    setPeriodTo(s.periodTo || s.date);
    setOpeningCash(s.openingCash);
    setTransfersReceived(s.transfersReceived);
    setMaterialExpenses(s.materialExpenses);
    setLaborExpenses(s.laborExpenses);
    setOperationalExpenses(s.operationalExpenses);
    setOtherExpenses(s.otherExpenses || 0);
    setOtherExpenseLabel(s.otherExpenseLabel || '');
    setActualCashInHand(s.actualCashInHand);
    setNotes(s.notes || '');
    setShowModal(true);
  };

  const handleSaveSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !supervisorName.trim()) {
      customAlert('يرجى تحديد اسم الموقع واسم المشرف الميداني', 'error');
      return;
    }

    const totalRec = Number(openingCash) + Number(transfersReceived);
    const totalSp = Number(materialExpenses) + Number(laborExpenses) + Number(operationalExpenses) + Number(otherExpenses);
    const expectedClosing = totalRec - totalSp;
    const diff = Number(actualCashInHand) - expectedClosing;

    let updated: SiteSettlement[];
    if (editingSettlement) {
      updated = settlements.map(s => s.id === editingSettlement.id ? {
        ...s,
        siteName,
        costCenterId: costCenterId || undefined,
        supervisorName,
        supervisorPhone,
        date,
        periodFrom,
        periodTo,
        openingCash: Number(openingCash),
        transfersReceived: Number(transfersReceived),
        totalReceived: totalRec,
        materialExpenses: Number(materialExpenses),
        laborExpenses: Number(laborExpenses),
        operationalExpenses: Number(operationalExpenses),
        otherExpenses: Number(otherExpenses),
        otherExpenseLabel: otherExpenseLabel.trim() || undefined,
        totalSpent: totalSp,
        expectedClosingBalance: expectedClosing,
        actualCashInHand: Number(actualCashInHand),
        discrepancy: diff,
        notes
      } : s);
    } else {
      const newSettlement: SiteSettlement = {
        id: `site_${Date.now()}`,
        settlementNumber: `SITE-2026-${String(settlements.length + 1).padStart(3, '0')}`,
        siteName,
        costCenterId: costCenterId || undefined,
        supervisorName,
        supervisorPhone,
        date,
        periodFrom,
        periodTo,
        openingCash: Number(openingCash),
        transfersReceived: Number(transfersReceived),
        totalReceived: totalRec,
        materialExpenses: Number(materialExpenses),
        laborExpenses: Number(laborExpenses),
        operationalExpenses: Number(operationalExpenses),
        otherExpenses: Number(otherExpenses),
        otherExpenseLabel: otherExpenseLabel.trim() || undefined,
        totalSpent: totalSp,
        expectedClosingBalance: expectedClosing,
        actualCashInHand: Number(actualCashInHand),
        discrepancy: diff,
        status: 'draft',
        notes,
        items: []
      };
      updated = [newSettlement, ...settlements];
    }

    saveSiteSettlements(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingSettlement ? 'تم تعديل تسوية الموقع بنجاح' : 'تم إنشاء شيت تسوية الموقع بنجاح', 'success');
  };

  const handleDeleteSettlement = (id: string) => {
    customConfirm('هل أنت متأكد من حذف شيت تسوية هذا الموقع؟', () => {
      const updated = settlements.filter(s => s.id !== id);
      saveSiteSettlements(updated);
      onRefresh();
      if (showDetailSheet && showDetailSheet.id === id) {
        setShowDetailSheet(null);
      }
      customAlert('تم حذف تسوية الموقع بنجاح', 'success');
    }, 'تأكيد حذف تسوية الموقع');
  };

  // إضافة بند تفصيلي داخل شيت الموقع
  const handleAddItemToSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDetailSheet) return;
    if (!itemDesc.trim() || Number(itemAmount) <= 0) {
      customAlert('يرجى كتابة بيان المصروف وإدخال المبلغ', 'error');
      return;
    }

    const newItem: SiteExpenseItem = {
      id: `se_${Date.now()}`,
      date: itemDate,
      type: itemType,
      description: itemDesc,
      amount: Number(itemAmount),
      recipient: itemRecipient || 'مورد/عامل موقع',
      invoiceNumber: itemInvNo || undefined
    };

    const currentItems = showDetailSheet.items || [];
    const updatedItems = [...currentItems, newItem];

    // إعادة احتساب المجاميع
    const matTotal = updatedItems.filter(i => i.type === 'material').reduce((s, i) => s + i.amount, 0);
    const labTotal = updatedItems.filter(i => i.type === 'labor').reduce((s, i) => s + i.amount, 0);
    const opTotal = updatedItems.filter(i => i.type === 'equipment' || i.type === 'misc').reduce((s, i) => s + i.amount, 0);
    const newTotalSpent = matTotal + labTotal + opTotal;
    const newExpected = showDetailSheet.totalReceived - newTotalSpent;
    const newDiscrepancy = showDetailSheet.actualCashInHand - newExpected;

    const updatedSettlement: SiteSettlement = {
      ...showDetailSheet,
      items: updatedItems,
      materialExpenses: matTotal,
      laborExpenses: labTotal,
      operationalExpenses: opTotal,
      totalSpent: newTotalSpent,
      expectedClosingBalance: newExpected,
      discrepancy: newDiscrepancy
    };

    const updatedList = settlements.map(s => s.id === showDetailSheet.id ? updatedSettlement : s);
    saveSiteSettlements(updatedList);
    onRefresh();
    setShowDetailSheet(updatedSettlement);
    setShowAddItemModal(false);
    setItemDesc('');
    setItemAmount(0);
    setItemRecipient('');
    setItemInvNo('');
    customAlert('تمت إضافة البند إلى شيت الموقع وتحديث الإجماليات بنجاح', 'success');
  };

  const handleDeleteItem = (itemId: string) => {
    if (!showDetailSheet) return;
    customConfirm('هل أنت متأكد من حذف هذا البند من شيت الموقع؟', () => {
      const currentItems = showDetailSheet.items || [];
      const updatedItems = currentItems.filter(i => i.id !== itemId);
      const matTotal = updatedItems.filter(i => i.type === 'material').reduce((s, i) => s + i.amount, 0);
      const labTotal = updatedItems.filter(i => i.type === 'labor').reduce((s, i) => s + i.amount, 0);
      const opTotal = updatedItems.filter(i => i.type === 'equipment' || i.type === 'misc').reduce((s, i) => s + i.amount, 0);
      const newTotalSpent = matTotal + labTotal + opTotal;
      const newExpected = showDetailSheet.totalReceived - newTotalSpent;
      const newDiscrepancy = showDetailSheet.actualCashInHand - newExpected;

      const updatedSettlement: SiteSettlement = {
        ...showDetailSheet,
        items: updatedItems,
        materialExpenses: matTotal,
        laborExpenses: labTotal,
        operationalExpenses: opTotal,
        totalSpent: newTotalSpent,
        expectedClosingBalance: newExpected,
        discrepancy: newDiscrepancy
      };

      const updatedList = settlements.map(s => s.id === showDetailSheet.id ? updatedSettlement : s);
      saveSiteSettlements(updatedList);
      onRefresh();
      setShowDetailSheet(updatedSettlement);
      customAlert('تم حذف البند وتحديث شيت الموقع', 'success');
    }, 'حذف بند من الشيت');
  };

  const handleApproveSettlement = (settlement: SiteSettlement) => {
    customConfirm(`هل أنت متأكد من اعتماد وإقفال تسوية الموقع رقم (${settlement.settlementNumber}) وترحيل الفروقات؟`, () => {
      const updated: SiteSettlement = {
        ...settlement,
        status: 'approved',
        approvedBy: currentUser.fullName,
        approvedDate: new Date().toISOString().slice(0, 10)
      };
      const updatedList = settlements.map(s => s.id === settlement.id ? updated : s);
      saveSiteSettlements(updatedList);
      onRefresh();
      setShowDetailSheet(updated);
      customAlert('تم اعتماد وإقفال تسوية الموقع بنجاح!', 'success');
    }, 'اعتماد تسوية الموقع');
  };

  const handleSendWhatsApp = (settlement: SiteSettlement) => {
    const message = generateSiteSettlementWhatsAppMessage({
      companyName: settings.companyName,
      siteName: settlement.siteName,
      settlementNumber: settlement.settlementNumber,
      supervisorName: settlement.supervisorName,
      date: settlement.date,
      currency: settings.currency,
      openingCash: settlement.openingCash,
      transfersReceived: settlement.transfersReceived,
      totalSpent: settlement.totalSpent,
      expectedClosingBalance: settlement.expectedClosingBalance,
      actualCashInHand: settlement.actualCashInHand,
      discrepancy: settlement.discrepancy,
      status: settlement.status,
      notes: settlement.notes
    });

    openWhatsApp(customPhone || settlement.supervisorPhone || '', message);
    setShowWhatsAppModal(null);
  };

  const exportData = filteredSettlements.map(s => ({
    'رقم التسوية': s.settlementNumber,
    'الموقع / المشروع': s.siteName,
    'المشرف الميداني': s.supervisorName,
    'تاريخ التسوية': s.date,
    'الفترة': `${s.periodFrom || s.date} إلى ${s.periodTo || s.date}`,
    'النقدية الافتتاحية': s.openingCash,
    'الدفعات المستلمة': s.transfersReceived,
    'إجمالي المتاح': s.totalReceived,
    'مشتريات مواد': s.materialExpenses,
    'يوميات عمال ومقاولين': s.laborExpenses,
    'مصاريف تشغيلية ونثريات': s.operationalExpenses,
    'بند آخر / مصروفات متنوعة': s.otherExpenses || 0,
    'مسمى البند الآخر': s.otherExpenseLabel || '-',
    'إجمالي المصروف': s.totalSpent,
    'الرصيد الدفتري المتبقي': s.expectedClosingBalance,
    'النقدية الفعلية (الجرد)': s.actualCashInHand,
    'الفارق (عجز/فائض)': s.discrepancy,
    'الحالة': s.status === 'approved' ? 'معتمدة ومقفلة' : s.status === 'under_review' ? 'قيد المراجعة' : 'مسودة'
  }));

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-yellow-400" />
            <span>{t('site_settlements', lang)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            شيت تسوية وجرد مشاريع ومواقع العمل الميدانية، مطابقة العهد والدفعات مع مشتريات المواد ويوميات العمالة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButtons
            data={exportData}
            fileName={`شيت_تسوية_المواقع_${new Date().toISOString().slice(0, 10)}`}
            title="شيت تسوية المواقع والمشاريع الميدانية"
            subtitle={formatFilterPeriodDescription(startDate, endDate, 'تقرير تسويات ومطابقات المواقع الميدانية')}
          />

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_site_settlement', lang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* شريط البحث المتقدم بالأيام والشهور والسنة */}
      <AdvancedDateFilter
        startDate={startDate}
        endDate={endDate}
        title="تصفية تسويات المواقع والعهد الميدانية بالأيام والشهور والسنة"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">إجمالي المتاح بالمواقع (عهدة + دفعات)</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{totalFunds.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-yellow-400 mt-0.5">عدد التسويات: {settlements.length}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">إجمالي المصروفات الميدانية (مواد + عمالة)</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{totalSpent.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">نسبة الصرف: {totalFunds ? Math.round((totalSpent / totalFunds) * 100) : 0}%</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">النقدية الفعلية بالمواقع (الجرد)</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{totalActualCash.toLocaleString()} {settings.currency}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">رصيد الصناديق الميدانية</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">تسويات مع وجود فروقات (عجز/فائض)</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{discrepanciesCount} تسوية</div>
          <div className="text-[11px] text-slate-400 mt-0.5">مطابقة تامة: {settlements.length - discrepanciesCount}</div>
        </div>
      </div>

      {/* جدول شيت تسوية المواقع */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-white text-sm">سجل شيتات تسوية المواقع والمشاريع الميدانية</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">سجلات: {filteredSettlements.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3.5">رقم التسوية</th>
                <th className="p-3.5">الموقع / المشروع</th>
                <th className="p-3.5">المشرف الميداني</th>
                <th className="p-3.5">تاريخ التسوية</th>
                <th className="p-3.5">إجمالي المتاح</th>
                <th className="p-3.5">إجمالي المصروف</th>
                <th className="p-3.5">الرصيد الفعلي (الجرد)</th>
                <th className="p-3.5">الفارق (عجز/فائض)</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">شيت الموقع والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    لا توجد تسويات مواقع مسجلة حالياً تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const itemCount = s.items?.length || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-yellow-400 font-mono">
                        {s.settlementNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{s.siteName}</div>
                        {s.periodFrom && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            الفترة: {s.periodFrom} إلى {s.periodTo || s.date}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200 font-medium">{s.supervisorName}</div>
                        {s.supervisorPhone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{s.supervisorPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {s.date}
                      </td>
                      <td className="p-3.5 font-bold text-slate-100 font-mono">
                        {s.totalReceived.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400 font-mono">
                        {s.totalSpent.toLocaleString()} {settings.currency}
                        <span className="text-[10px] text-slate-400 block font-normal">({itemCount} بنود)</span>
                      </td>
                      <td className="p-3.5 font-bold text-blue-400 font-mono">
                        {s.actualCashInHand.toLocaleString()} {settings.currency}
                      </td>
                      <td className="p-3.5 font-bold font-mono">
                        {s.discrepancy === 0 ? (
                          <span className="text-emerald-400">متطابق (0)</span>
                        ) : s.discrepancy > 0 ? (
                          <span className="text-blue-400">+{s.discrepancy.toLocaleString()} (فائض)</span>
                        ) : (
                          <span className="text-red-400">{s.discrepancy.toLocaleString()} (عجز)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {s.status === 'approved' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md text-[11px] font-bold">
                            معتمدة ومقفلة ✅
                          </span>
                        ) : s.status === 'under_review' ? (
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-md text-[11px] font-bold">
                            قيد المراجعة ⏳
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[11px]">
                            مسودة 📝
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر فتح شيت تسوية الموقع التفصيلي */}
                          <button
                            onClick={() => setShowDetailSheet(s)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 rounded-lg text-xs font-bold transition"
                            title="فتح شيت تسوية الموقع والمطابقة"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-400" />
                            <span>شيت الموقع</span>
                          </button>

                          {/* زر واتساب */}
                          <button
                            onClick={() => {
                              setShowWhatsAppModal(s);
                              setCustomPhone(s.supervisorPhone || '');
                            }}
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg transition"
                            title="إرسال تقرير تسوية الموقع عبر واتساب"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="تعديل التسوية"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteSettlement(s.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition"
                              title="حذف التسوية"
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

      {/* ===================== مودال شيت تسوية وجرد الموقع التفصيلي ===================== */}
      {showDetailSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 flex items-center justify-center font-bold">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>شيت تسوية وجرد الموقع: {showDetailSheet.settlementNumber}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
                      {showDetailSheet.siteName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    المشرف الميداني: {showDetailSheet.supervisorName} • التاريخ: {showDetailSheet.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(showDetailSheet);
                    setCustomPhone(showDetailSheet.supervisorPhone || '');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>إرسال بالواتساب</span>
                </button>

                <button
                  onClick={() => setShowDetailSheet(null)}
                  className="text-slate-400 hover:text-white text-2xl font-bold p-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* بطاقات موازنة الموقع والمطابقة */}
            <div className="p-5 bg-slate-800/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[11px] text-slate-400">النقدية الافتتاحية</div>
                <div className="text-base font-bold text-white mt-1">
                  {showDetailSheet.openingCash.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[11px] text-slate-400">التحويلات والدفعات المستلمة</div>
                <div className="text-base font-bold text-blue-400 mt-1">
                  {showDetailSheet.transfersReceived.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[11px] text-emerald-400 font-bold">إجمالي المصروف بالموقع</div>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  {showDetailSheet.totalSpent.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[11px] text-slate-400">الرصيد الفعلي (الجرد)</div>
                <div className="text-base font-bold text-yellow-400 mt-1">
                  {showDetailSheet.actualCashInHand.toLocaleString()} {settings.currency}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[11px] text-slate-400">الفارق (فائض/عجز)</div>
                <div className={`text-base font-bold mt-1 ${showDetailSheet.discrepancy === 0 ? 'text-emerald-400' : showDetailSheet.discrepancy > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {showDetailSheet.discrepancy === 0 ? '0 (مطابق ✅)' : showDetailSheet.discrepancy > 0 ? `+${showDetailSheet.discrepancy.toLocaleString()}` : showDetailSheet.discrepancy.toLocaleString()}
                </div>
              </div>
            </div>

            {/* تفصيل بنود المصروفات الميدانية */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-yellow-400" />
                  <span>جدول البنود والمصروفات الميدانية (مواد، عمالة، معدات، نثريات)</span>
                </h4>

                {canSettle && showDetailSheet.status !== 'approved' && (
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-lg text-xs font-bold transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة بند صرف للموقع</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">نوع البند</th>
                      <th className="p-2.5">البيان والتفاصيل</th>
                      <th className="p-2.5">المستفيد / المورد</th>
                      <th className="p-2.5">رقم السند/الفاتورة</th>
                      <th className="p-2.5">المبلغ</th>
                      {canSettle && showDetailSheet.status !== 'approved' && <th className="p-2.5 text-center">حذف</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {!showDetailSheet.items || showDetailSheet.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          لم يتم إدراج بنود تفصيلية في شيت هذا الموقع بعد. اضغط "إضافة بند صرف" لبدء التسجيل.
                        </td>
                      </tr>
                    ) : (
                      showDetailSheet.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-slate-300">{item.date}</td>
                          <td className="p-2.5">
                            {item.type === 'material' ? (
                              <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded text-[10px] font-bold">مواد موقع</span>
                            ) : item.type === 'labor' ? (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded text-[10px] font-bold">يوميات عمالة</span>
                            ) : item.type === 'equipment' ? (
                              <span className="px-2 py-0.5 bg-purple-950 text-purple-300 rounded text-[10px] font-bold">معدات وصيانة</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">نثريات وتشغيل</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-100 font-medium">{item.description}</td>
                          <td className="p-2.5 text-slate-300">{item.recipient}</td>
                          <td className="p-2.5 font-mono text-yellow-400">{item.invoiceNumber || '—'}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-400">{item.amount.toLocaleString()} {settings.currency}</td>
                          {canSettle && showDetailSheet.status !== 'approved' && (
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded transition"
                                title="حذف البند"
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
                {showDetailSheet.status === 'approved' && (
                  <span className="text-emerald-400 font-bold">
                    معتمدة بواسطة: {showDetailSheet.approvedBy || 'الإدارة العامة'} بتاريخ: {showDetailSheet.approvedDate}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {canSettle && showDetailSheet.status !== 'approved' && (
                  <button
                    onClick={() => handleApproveSettlement(showDetailSheet)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد وإقفال تسوية الموقع</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDetailSheet(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
                >
                  إغلاق الشيت
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== مودال إضافة بند صرف تفصيلي للشيت ===================== */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>إضافة بند صرف لشيت الموقع الميداني</span>
              </h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleAddItemToSheet} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">نوع البند *</label>
                  <select
                    value={itemType}
                    onChange={(e: any) => setItemType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="material">مشتريات مواد طارئة (أسمنت، حديد، بلوك)</option>
                    <option value="labor">يوميات عمال ومقاولين باطن</option>
                    <option value="equipment">إيجار معدات وصيانة هيدروليك</option>
                    <option value="misc">نثريات ومحروقات وضيافة الموقع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={itemDate}
                    onChange={(e) => setItemDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">البيان ووصف البند *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء مواسير صرف صحي 6 بوصة..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">المبلغ ({settings.currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={itemAmount || ''}
                    onChange={(e) => setItemAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">رقم الفاتورة / السند المرفق</label>
                  <input
                    type="text"
                    placeholder="مثال: INV-881 أو إيصال 12"
                    value={itemInvNo}
                    onChange={(e) => setItemInvNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">المستفيد / المستلم</label>
                <input
                  type="text"
                  placeholder="اسم المورد أو رئيس العمالة"
                  value={itemRecipient}
                  onChange={(e) => setItemRecipient(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold rounded-lg shadow transition"
                >
                  حفظ البند وإدراجه في الشيت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== مودال إنشاء تسوية موقع جديدة / تعديل ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2">
                <HardHat className="w-5 h-5" />
                <span>{editingSettlement ? 'تعديل تسوية الموقع' : 'تسوية وجرد موقع ميداني جديد'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSaveSettlement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">اسم الموقع / المشروع *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مشروع برج الرياض التجاري"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">مركز التكلفة المرتبط</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">بدون مركز تكلفة</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">المشرف الميداني / المهندس *</label>
                  <input
                    type="text"
                    required
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">رقم هاتف / واتساب المشرف</label>
                  <input
                    type="text"
                    placeholder="0501234567"
                    value={supervisorPhone}
                    onChange={(e) => setSupervisorPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">تاريخ التسوية *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">الفترة من</label>
                  <input
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">الفترة إلى</label>
                  <input
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700 space-y-3">
                <div className="font-bold text-yellow-400">واردات وصناديق الموقع (المتاح):</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">النقدية الافتتاحية للموقع ({settings.currency})</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={openingCash || ''}
                      onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">التحويلات والدفعات المستلمة للموقع</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={transfersReceived || ''}
                      onChange={(e) => setTransfersReceived(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700 space-y-3">
                <div className="font-bold text-emerald-400">مصروفات ومشتريات الموقع:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">مشتريات مواد طارئة</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={materialExpenses || ''}
                      onChange={(e) => setMaterialExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">يوميات عمال ومقاولين</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={laborExpenses || ''}
                      onChange={(e) => setLaborExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">تشغيل ومعدات ونثريات</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={operationalExpenses || ''}
                      onChange={(e) => setOperationalExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">بند آخر / مصروفات أخرى</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={otherExpenses || ''}
                      onChange={(e) => setOtherExpenses(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">مسمى البند الآخر (اختياري - تفصيل بند الصرف الإضافي)</label>
                  <input
                    type="text"
                    placeholder="مثال: رسوم تراخيص، ضيافة الموقع، وقود احتياطي..."
                    value={otherExpenseLabel}
                    onChange={(e) => setOtherExpenseLabel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700">
                <label className="block text-yellow-300 font-bold mb-1">
                  النقدية الفعلية بالموقع (الجرد الفعلي للصندوق الميداني) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={actualCashInHand || ''}
                  onChange={(e) => setActualCashInHand(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">ملاحظات تسوية الموقع</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول الجرد أو الصرف بالموقع..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-yellow-500"
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
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold rounded-lg shadow transition"
                >
                  {editingSettlement ? 'حفظ التعديلات' : 'حفظ شيت تسوية الموقع'}
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
                <span>إرسال تقرير تسوية الموقع عبر واتساب</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(null)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white text-sm">{showWhatsAppModal.siteName}</div>
                <div className="text-slate-400 mt-1">التسوية: {showWhatsAppModal.settlementNumber} (المشرف: {showWhatsAppModal.supervisorName})</div>
                <div className="text-yellow-400 font-bold mt-1">المصروف: {showWhatsAppModal.totalSpent.toLocaleString()} {settings.currency}</div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  رقم الواتساب للمستلم:
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
