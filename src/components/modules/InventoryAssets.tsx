import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Layers,
  FileText,
  Printer,
  Calendar,
  Building,
  User,
  Share2,
  DollarSign,
  Tag,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { InventoryItem, StockMovement, StockMovementType, CostCenter, CompanySettings, UserAccount } from '../../types';
import { saveInventory, saveStockMovements, getInventory, getStockMovements } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { AdvancedDateFilter } from '../common/AdvancedDateFilter';
import { isDateInRange } from '../../utils/dateFilter';
import { printReportAsPDF, exportToExcel } from '../../utils/export';
import { formatWhatsAppReport, sendWhatsAppMessage } from '../../utils/whatsappPrinter';
import { Language, t } from '../../utils/i18n';

interface InventoryAssetsProps {
  inventory: InventoryItem[];
  stockMovements?: StockMovement[];
  costCenters?: CostCenter[];
  companySettings?: CompanySettings;
  currentUser?: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  lang?: Language;
}

export const InventoryAssets: React.FC<InventoryAssetsProps> = ({
  inventory,
  stockMovements = [],
  costCenters = [],
  companySettings,
  currentUser,
  onRefresh,
  searchQuery,
  lang = 'ar'
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showPrintVoucherModal, setShowPrintVoucherModal] = useState<StockMovement | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Filter States for Movements
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | StockMovementType>('all');
  const [selectedCostCenterFilter, setSelectedCostCenterFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Form State for Item
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('مواد خام');
  const [unit, setUnit] = useState('قطعة');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number | ''>('');
  const [warehouseLocation, setWarehouseLocation] = useState('المستودع الرئيسي - الرياض');
  const [notes, setNotes] = useState('');

  // Form State for Stock Movement (إذن إضافة / صرف / تسوية)
  const [movType, setMovType] = useState<StockMovementType>('in');
  const [movNumber, setMovNumber] = useState('');
  const [movDate, setMovDate] = useState(new Date().toISOString().slice(0, 10));
  const [movItemId, setMovItemId] = useState('');
  const [movQuantity, setMovQuantity] = useState<number | ''>('');
  const [movUnitPrice, setMovUnitPrice] = useState<number | ''>('');
  const [movWarehouse, setMovWarehouse] = useState('');
  const [movCostCenterId, setMovCostCenterId] = useState('');
  const [movRecipientOrSupplier, setMovRecipientOrSupplier] = useState('');
  const [movRefDoc, setMovRefDoc] = useState('');
  const [movNotes, setMovNotes] = useState('');

  const currencySymbol = companySettings?.currency || 'ر.س';

  // تصفية الأصناف
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.warehouseLocation && item.warehouseLocation.toLowerCase().includes(q))
      );
    });
  }, [inventory, searchQuery]);

  // إحصائيات الأصناف
  const totalValuation = useMemo(() => filteredItems.reduce((sum, item) => sum + (item.currentStock * item.purchasePrice), 0), [filteredItems]);
  const totalSellingValuation = useMemo(() => filteredItems.reduce((sum, item) => sum + (item.currentStock * item.sellingPrice), 0), [filteredItems]);
  const lowStockCount = useMemo(() => filteredItems.filter(item => item.currentStock <= item.minStockAlert).length, [filteredItems]);

  // تصفية حركات المخزن
  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        m.movementNumber.toLowerCase().includes(q) ||
        m.itemName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.recipientOrSupplier && m.recipientOrSupplier.toLowerCase().includes(q)) ||
        (m.referenceDocument && m.referenceDocument.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q));

      const matchesType = movementTypeFilter === 'all' || m.type === movementTypeFilter;
      const matchesCostCenter = selectedCostCenterFilter === 'all' || m.costCenterId === selectedCostCenterFilter;
      const matchesDateRange = isDateInRange(m.date, startDate, endDate);

      return matchesSearch && matchesType && matchesCostCenter && matchesDateRange;
    });
  }, [stockMovements, searchQuery, movementTypeFilter, selectedCostCenterFilter, startDate, endDate]);

  // إحصائيات الحركات
  const movementStats = useMemo(() => {
    let totalInQty = 0;
    let totalInVal = 0;
    let totalOutQty = 0;
    let totalOutVal = 0;
    let totalAdjQty = 0;

    filteredMovements.forEach(m => {
      const q = Number(m.quantity) || 0;
      const val = Number(m.totalAmount) || 0;
      if (m.type === 'in') {
        totalInQty += q;
        totalInVal += val;
      } else if (m.type === 'out') {
        totalOutQty += q;
        totalOutVal += val;
      } else {
        totalAdjQty += q;
      }
    });

    return { totalInQty, totalInVal, totalOutQty, totalOutVal, totalAdjQty, count: filteredMovements.length };
  }, [filteredMovements]);

  // فتح نافذة صنف جديد
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('مواد خام');
    setUnit('قطعة');
    setPurchasePrice('');
    setSellingPrice('');
    setCurrentStock('');
    setMinStockAlert(10);
    setWarehouseLocation('المستودع الرئيسي - الرياض');
    setNotes('');
    setShowItemModal(true);
  };

  // فتح نافذة تعديل صنف
  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setSku(item.sku);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setPurchasePrice(item.purchasePrice);
    setSellingPrice(item.sellingPrice);
    setCurrentStock(item.currentStock);
    setMinStockAlert(item.minStockAlert);
    setWarehouseLocation(item.warehouseLocation || 'المستودع الرئيسي');
    setNotes(item.notes || '');
    setShowItemModal(true);
  };

  // فتح نافذة إذن إضافة أو صرف أو تسوية
  const handleOpenAddMovement = (type: StockMovementType, preselectedItemId?: string) => {
    setMovType(type);
    const prefix = type === 'in' ? 'IN' : type === 'out' ? 'OUT' : 'ADJ';
    const year = new Date().getFullYear();
    const count = stockMovements.filter(m => m.type === type).length + 1;
    setMovNumber(`${prefix}-${year}-${String(count).padStart(4, '0')}`);
    setMovDate(new Date().toISOString().slice(0, 10));

    const selectedItem = inventory.find(i => i.id === preselectedItemId) || (inventory.length > 0 ? inventory[0] : null);
    if (selectedItem) {
      setMovItemId(selectedItem.id);
      setMovUnitPrice(type === 'out' ? selectedItem.sellingPrice : selectedItem.purchasePrice);
      setMovWarehouse(selectedItem.warehouseLocation || 'المستودع الرئيسي');
    } else {
      setMovItemId('');
      setMovUnitPrice('');
      setMovWarehouse('');
    }

    setMovQuantity('');
    setMovCostCenterId('');
    setMovRecipientOrSupplier('');
    setMovRefDoc('');
    setMovNotes('');
    setShowMovementModal(true);
  };

  // تغيير الصنف المختار في نموذج الحركة
  const handleSelectMovementItem = (itemId: string) => {
    setMovItemId(itemId);
    const itm = inventory.find(i => i.id === itemId);
    if (itm) {
      setMovUnitPrice(movType === 'out' ? itm.sellingPrice : itm.purchasePrice);
      if (itm.warehouseLocation) setMovWarehouse(itm.warehouseLocation);
    }
  };

  // حفظ بيانات الصنف
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || purchasePrice === '' || currentStock === '') {
      customAlert('يرجى إدخال اسم الصنف وسعر الشراء والكمية الحالية', 'warning');
      return;
    }

    const pPrice = Number(purchasePrice);
    const sPrice = Number(sellingPrice || pPrice * 1.25);
    const cStock = Number(currentStock);
    const mAlert = Number(minStockAlert || 5);

    let updated: InventoryItem[];
    if (editingItem) {
      updated = inventory.map(item => item.id === editingItem.id ? {
        ...item,
        sku,
        name,
        category,
        unit,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        currentStock: cStock,
        minStockAlert: mAlert,
        warehouseLocation,
        totalValue: cStock * pPrice,
        notes
      } : item);
    } else {
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}`,
        sku,
        name,
        category,
        unit,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        currentStock: cStock,
        minStockAlert: mAlert,
        warehouseLocation,
        totalValue: cStock * pPrice,
        notes
      };
      updated = [newItem, ...inventory];
    }

    saveInventory(updated);
    onRefresh();
    setShowItemModal(false);
    customAlert(editingItem ? 'تم تحديث بيانات الصنف بنجاح' : 'تم إضافة الصنف للمخزون بنجاح', 'success');
  };

  // حفظ حركة المخزن (إذن إضافة أو صرف أو تسوية)
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movItemId || movQuantity === '' || Number(movQuantity) <= 0) {
      customAlert('يرجى اختيار الصنف وتحديد كمية صحيحة للحركة', 'warning');
      return;
    }

    const targetItem = inventory.find(i => i.id === movItemId);
    if (!targetItem) {
      customAlert('الصنف المحدد غير موجود', 'error');
      return;
    }

    const qty = Number(movQuantity);
    const uPrice = Number(movUnitPrice || targetItem.purchasePrice);
    const totAmount = qty * uPrice;

    // فحص الرصيد عند الصرف
    if (movType === 'out' && targetItem.currentStock < qty) {
      const confirmExceed = confirm(`تنبيه: الكمية المطلوبة للصرف (${qty}) أكبر من الرصيد المتوفر بالمستودع (${targetItem.currentStock} ${targetItem.unit}). هل ترغب في الاستمرار بالسحب؟`);
      if (!confirmExceed) return;
    }

    const cc = costCenters.find(c => c.id === movCostCenterId);

    const newMovement: StockMovement = {
      id: `sm_${Date.now()}`,
      movementNumber: movNumber,
      date: movDate,
      type: movType,
      itemId: targetItem.id,
      itemName: targetItem.name,
      sku: targetItem.sku,
      unit: targetItem.unit,
      quantity: qty,
      unitPrice: uPrice,
      totalAmount: totAmount,
      warehouseLocation: movWarehouse || targetItem.warehouseLocation || 'المستودع الرئيسي',
      costCenterId: movCostCenterId || undefined,
      costCenterName: cc ? cc.name : undefined,
      recipientOrSupplier: movRecipientOrSupplier || (movType === 'in' ? 'مورد معتمد' : 'مشروع / مهندس'),
      referenceDocument: movRefDoc || undefined,
      notes: movNotes || undefined,
      enteredBy: currentUser ? currentUser.fullName : 'أمين المستودع',
      createdAt: new Date().toISOString()
    };

    // تحديث رصيد الصنف في جدول المخزون
    let newStock = targetItem.currentStock;
    if (movType === 'in') {
      newStock += qty;
    } else if (movType === 'out') {
      newStock = Math.max(0, newStock - qty);
    } else if (movType === 'adjustment') {
      // التسوية الجردية تصبح الكمية المدخلة هي الرصيد الفعلي الجديد
      newStock = qty;
    }

    const updatedInventory = inventory.map(itm => {
      if (itm.id === targetItem.id) {
        return {
          ...itm,
          currentStock: newStock,
          totalValue: newStock * itm.purchasePrice
        };
      }
      return itm;
    });

    const updatedMovements = [newMovement, ...stockMovements];

    saveInventory(updatedInventory);
    saveStockMovements(updatedMovements);
    onRefresh();
    setShowMovementModal(false);

    const typeName = movType === 'in' ? 'إذن إضافة وتوريد مخزني' : movType === 'out' ? 'إذن صرف مخزني' : 'تسوية جردية للمخزون';
    customAlert(`تم تسجيل ${typeName} بنجاح برقم (${movNumber}) وتحديث رصيد الصنف إلى (${newStock} ${targetItem.unit})`, 'success');
  };

  // حذف صنف
  const handleDeleteItem = (id: string, itemName: string) => {
    customConfirm(`هل أنت متأكد من حذف الصنف "${itemName}" من المخزون؟`, () => {
      saveInventory(inventory.filter(i => i.id !== id));
      onRefresh();
      customAlert('تم حذف الصنف بنجاح', 'success');
    }, 'تأكيد حذف الصنف');
  };

  // حذف حركة مخزن
  const handleDeleteMovement = (id: string, movNum: string) => {
    customConfirm(`هل أنت متأكد من حذف حركة المخزن رقم "${movNum}"؟ ملاحظة: لن يتم عكس الرصيد تلقائياً.`, () => {
      saveStockMovements(stockMovements.filter(m => m.id !== id));
      onRefresh();
      customAlert('تم حذف حركة المخزن بنجاح', 'success');
    }, 'تأكيد حذف الحركة');
  };

  // تصدير الأصناف
  const exportItemsData = filteredItems.map(i => ({
    'كود الصنف (SKU)': i.sku,
    'اسم الصنف': i.name,
    'التصنيف': i.category,
    'الوحدة': i.unit,
    'الكمية الحالية': i.currentStock,
    'حد التنبيه': i.minStockAlert,
    'سعر الشراء': i.purchasePrice,
    'سعر البيع': i.sellingPrice,
    'القيمة الإجمالية (تكلفة)': i.totalValue,
    'المستودع': i.warehouseLocation || '-',
    'ملاحظات': i.notes || '-'
  }));

  // تصدير الحركات
  const exportMovementsData = filteredMovements.map(m => ({
    'رقم الإذن / الحركة': m.movementNumber,
    'التاريخ': m.date,
    'نوع الحركة': m.type === 'in' ? 'إذن إضافة (توريد)' : m.type === 'out' ? 'إذن صرف' : 'تسوية جردية',
    'كود SKU': m.sku,
    'اسم الصنف': m.itemName,
    'الكمية': m.quantity,
    'الوحدة': m.unit,
    'سعر الوحدة': m.unitPrice,
    'القيمة الإجمالية': m.totalAmount,
    'المستودع': m.warehouseLocation || '-',
    'المشروع / مركز التكلفة': m.costCenterName || '-',
    'المورد / المستلم': m.recipientOrSupplier || '-',
    'المستند المرجعي': m.referenceDocument || '-',
    'المسؤول': m.enteredBy || '-',
    'ملاحظات': m.notes || '-'
  }));

  // مشاركة تقرير الحركات عبر واتساب
  const handleShareMovementsWhatsApp = () => {
    const periodStr = startDate || endDate ? `${startDate || 'البداية'} إلى ${endDate || 'اليوم'}` : 'كافة الفترات';
    const topMovementsList = filteredMovements.slice(0, 10).map((m, i) => {
      const typeLabel = m.type === 'in' ? '📥 وارد' : m.type === 'out' ? '📤 منصرف' : '⚖️ تسوية';
      return `${i + 1}. [${m.movementNumber}] ${typeLabel} | ${m.itemName} (${m.quantity} ${m.unit}) | ${m.totalAmount.toLocaleString()} ${currencySymbol} | ${m.recipientOrSupplier || '-'}`;
    });

    const report = formatWhatsAppReport({
      title: '📦 *كشف حركة المخزن والأصناف (وارد ومنصرف)*',
      entityName: `${companySettings?.companyName || 'شركة الرؤية'} - إدارة المخازن والمستودعات`,
      entityCode: `MOV-TOTAL-${filteredMovements.length}`,
      date: new Date().toISOString().slice(0, 10),
      currency: currencySymbol,
      openingBalance: totalValuation,
      period: periodStr,
      totalDebit: movementStats.totalInVal,
      totalCredit: movementStats.totalOutVal,
      closingBalance: totalValuation + movementStats.totalInVal - movementStats.totalOutVal,
      items: topMovementsList,
      notes: `إجمالي الحركات: ${filteredMovements.length} حركة | الوارد: ${movementStats.totalInQty} | المنصرف: ${movementStats.totalOutQty}. معتمد للطباعة.`
    });

    const phone = prompt('أدخل رقم الواتساب لإرسال كشف حركات المخزن (مع مفتاح الدولة مثلاً 966501234567):', '');
    if (phone !== null) {
      sendWhatsAppMessage(phone.replace(/[^0-9]/g, ''), report);
    }
  };

  // مشاركة إذن حركة واحد عبر واتساب
  const handleShareSingleVoucherWhatsApp = (m: StockMovement) => {
    const typeLabel = m.type === 'in' ? 'إذن إضافة وتوريد مخزني' : m.type === 'out' ? 'إذن صرف مواد مخزنية' : 'محضر تسوية جردية';
    const report = formatWhatsAppReport({
      title: `📄 *${typeLabel} رقم (${m.movementNumber})*`,
      entityName: `${companySettings?.companyName || 'شركة الرؤية'} - إدارة المستودعات`,
      entityCode: m.movementNumber,
      date: m.date,
      currency: currencySymbol,
      openingBalance: 0,
      totalDebit: m.type === 'in' ? m.totalAmount : 0,
      totalCredit: m.type === 'out' ? m.totalAmount : 0,
      closingBalance: m.totalAmount,
      items: [
        `• كود الصنف: ${m.sku}`,
        `• اسم الصنف: ${m.itemName}`,
        `• الكمية: ${m.quantity} ${m.unit}`,
        `• سعر الوحدة: ${m.unitPrice.toLocaleString()} ${currencySymbol}`,
        `• إجمالي القيمة: ${m.totalAmount.toLocaleString()} ${currencySymbol}`,
        `• موقع التخزين: ${m.warehouseLocation || '-'}`,
        `• مركز التكلفة / المشروع: ${m.costCenterName || '-'}`,
        `• ${m.type === 'in' ? 'المورد المعتمد' : 'المستلم / المهندس'}: ${m.recipientOrSupplier || '-'}`,
        `• رقم المستند المرجعي: ${m.referenceDocument || '-'}`
      ],
      notes: `تم تحرير الإذن بواسطة: ${m.enteredBy || 'أمين المستودع'}. ${m.notes || ''}`
    });

    const phone = prompt('أدخل رقم الواتساب لإرسال الإذن المخزني:', '');
    if (phone !== null) {
      sendWhatsAppMessage(phone.replace(/[^0-9]/g, ''), report);
    }
  };

  // طباعة سند الإذن
  const handlePrintVoucher = (m: StockMovement) => {
    const typeTitle = m.type === 'in' ? 'إذن إضافة وتوريد مخزني (Stock In Voucher)' : m.type === 'out' ? 'إذن صرف مواد مخزنية (Stock Issue Voucher)' : 'محضر تسوية جردية (Stock Adjustment)';
    const colorTheme = m.type === 'in' ? '#059669' : m.type === 'out' ? '#d97706' : '#2563eb';

    const html = `
      <div style="direction: rtl; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${colorTheme}; padding-bottom: 12px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #0f172a; font-size: 20px;">${companySettings?.companyName || 'شركة الرؤية المتكاملة'}</h2>
            <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px;">إدارة المستودعات ومراقبة المخزون</p>
          </div>
          <div style="text-align: left;">
            <div style="display: inline-block; background: ${colorTheme}; color: #fff; padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 14px;">
              ${typeTitle}
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px; font-family: monospace;">رقم الإذن: <strong>${m.movementNumber}</strong></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 12px;">
          <div><strong>تاريخ الحركة:</strong> ${m.date}</div>
          <div><strong>المستودع / الموقع:</strong> ${m.warehouseLocation || 'المستودع الرئيسي'}</div>
          <div><strong>${m.type === 'in' ? 'المورد:' : 'المستلم / الجهة:'}</strong> ${m.recipientOrSupplier || '-'}</div>
          <div><strong>المشروع / مركز التكلفة:</strong> ${m.costCenterName || 'عام'}</div>
          <div><strong>رقم المستند المرجعي:</strong> ${m.referenceDocument || '-'}</div>
          <div><strong>المسؤول المحرر:</strong> ${m.enteredBy || 'أمين المستودع'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; text-align: right;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">كود الصنف (SKU)</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">بيان الصنف والمواصفات</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">الوحدة</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">الكمية</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">سعر الوحدة</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">القيمة الإجمالية</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${m.sku}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${m.itemName}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${m.unit}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">${m.quantity}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${m.unitPrice.toLocaleString()} ${currencySymbol}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${colorTheme};">${m.totalAmount.toLocaleString()} ${currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        ${m.notes ? `<div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 10px; border-radius: 6px; font-size: 11px; margin-bottom: 25px;"><strong>ملاحظات:</strong> ${m.notes}</div>` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; text-align: center;">
          <div style="width: 30%;">
            <p style="margin: 0 0 40px 0; font-weight: bold;">أمين المستودع</p>
            <p style="margin: 0; color: #64748b;">التوقيع: .....................</p>
          </div>
          <div style="width: 30%;">
            <p style="margin: 0 0 40px 0; font-weight: bold;">المستلم / المورد</p>
            <p style="margin: 0; color: #64748b;">التوقيع: .....................</p>
          </div>
          <div style="width: 30%;">
            <p style="margin: 0 0 40px 0; font-weight: bold;">اعتماد إدارة المشاريع / المالية</p>
            <p style="margin: 0; color: #64748b;">التوقيع: .....................</p>
          </div>
        </div>
      </div>
    `;

    printReportAsPDF(html, `${m.movementNumber}_${m.itemName}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* رأس الصفحة والإحصائيات */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
              <Package className="w-6 h-6" />
              <span>إدارة المخزون والأصناف والمستودعات</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              تتبع حركة الأصناف، إصدار أذون التوريد والصرف، التسويات الجردية، تقييم المخزون، وسجل الحركات المتكامل.
            </p>
          </div>

          {/* أزرار الإجراءات الرئيسية المباشرة */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'items' ? (
              <>
                <ExportButtons
                  title="تقرير المخزون والأصناف التفصيلي"
                  subtitle="جرد شامل للأصناف والكميات المتوفرة والقيمة الإجمالية"
                  data={exportItemsData}
                  filename="inventory_report"
                />
                <button
                  onClick={handleOpenAddItem}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف جديد</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleShareMovementsWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition"
                  title="إرسال تقرير الحركات عبر واتساب جاهز للطباعة"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>واتساب (كشف جاهز للطباعة)</span>
                </button>
                <ExportButtons
                  title="سجل حركات المخزن والأذون المخزنية"
                  subtitle="تقرير شامل لحركات التوريد والصرف والتسويات"
                  data={exportMovementsData}
                  filename="stock_movements_report"
                />
              </>
            )}

            {/* أزرار الإضافة والصرف السريع في الهيدر */}
            <button
              onClick={() => handleOpenAddMovement('in')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition"
              title="تسجيل إذن إضافة أو توريد مواد للمخزن"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>إذن إضافة / توريد (+)</span>
            </button>

            <button
              onClick={() => handleOpenAddMovement('out')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition"
              title="تسجيل إذن صرف مواد من المخزن لمشروع أو جهة"
            >
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>إذن صرف (-)</span>
            </button>

            <button
              onClick={() => handleOpenAddMovement('adjustment')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-xs rounded-xl transition"
              title="تسجيل تسوية جردية لرصيد صنف"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              <span>تسوية جردية (±)</span>
            </button>
          </div>
        </div>

        {/* بطاقات المؤشرات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي عدد الأصناف بالمستودع</div>
            <div className="text-2xl font-extrabold text-white mt-1">{filteredItems.length} <span className="text-xs font-normal text-slate-400">صنف مخزني</span></div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">تقييم المخزون (سعر الشراء)</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalValuation.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span></div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">القيمة البيعية المتوقعة</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">{totalSellingValuation.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currencySymbol}</span></div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">أصناف تحت حد التنبيه والطلب</div>
            <div className={`text-2xl font-extrabold mt-1 flex items-center gap-1.5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 animate-pulse" />}
              <span>{lowStockCount} <span className="text-xs font-normal text-slate-400">صنف منخفض</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* شريط التبويبات الرئيسي (الأصناف vs سجل حركات المخزن) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${activeTab === 'items' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Package className="w-4 h-4" />
            <span>قائمة الأصناف والأرصدة الحالية ({filteredItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${activeTab === 'movements' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل حركات المخزن والأذون ({stockMovements.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          {activeTab === 'items' ? 'إجمالي تقييم الأصناف: ' + totalValuation.toLocaleString() + ' ' + currencySymbol : `إجمالي الوارد: ${movementStats.totalInQty} | المنصرف: ${movementStats.totalOutQty}`}
        </div>
      </div>

      {/* ===================== تبويب 1: جدول الأصناف ===================== */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>قائمة الأصناف والمواد المخزنة ({filteredItems.length})</span>
            </h3>
            <div className="text-xs text-slate-500 font-medium">
              يتم تحديث القيمة الإجمالية تلقائياً بناءً على سعر الشراء والكمية الفعلية
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 font-bold">كود SKU</th>
                  <th className="py-3 px-3 font-bold">اسم الصنف والمواصفات</th>
                  <th className="py-3 px-3 font-bold">التصنيف</th>
                  <th className="py-3 px-3 font-bold text-center">الوحدة</th>
                  <th className="py-3 px-3 font-bold text-center">الرصيد الحالي</th>
                  <th className="py-3 px-3 font-bold text-center">سعر الشراء</th>
                  <th className="py-3 px-3 font-bold text-center">سعر البيع</th>
                  <th className="py-3 px-3 font-bold text-center">القيمة الإجمالية</th>
                  <th className="py-3 px-3 font-bold">المستودع</th>
                  <th className="py-3 px-3 font-bold text-center">الحالة</th>
                  <th className="py-3 px-3 font-bold text-center">إجراءات المخزن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredItems.map(item => {
                  const isLow = item.currentStock <= item.minStockAlert;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition ${isLow ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">{item.sku}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">{item.category}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">{item.unit}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                        <span className={isLow ? 'text-amber-600 font-extrabold' : 'text-slate-800'}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{item.purchasePrice.toLocaleString()} {currencySymbol}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold">{item.sellingPrice.toLocaleString()} {currencySymbol}</td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900 bg-slate-50/50">{item.totalValue.toLocaleString()} {currencySymbol}</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">{item.warehouseLocation || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>نقص رصيد</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>متوفر</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* أزرار سريعة للإضافة والصرف على هذا الصنف مباشرة */}
                          <button
                            onClick={() => handleOpenAddMovement('in', item.id)}
                            className="p-1 px-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-0.5"
                            title="إذن إضافة وتوريد لهذا الصنف (+)"
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddMovement('out', item.id)}
                            className="p-1 px-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-[10px] font-bold flex items-center gap-0.5"
                            title="إذن صرف من هذا الصنف (-)"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>صرف</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="تعديل بيانات الصنف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                      لا توجد أصناف تطابق معايير البحث الحالية. قم بإضافة صنف جديد للبدء.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== تبويب 2: سجل حركات المخزن ===================== */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          {/* فلتر حركات المخزن والتاريخ والمشاريع */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">نوع الحركة:</span>
              <button
                onClick={() => setMovementTypeFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition ${movementTypeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                الكل ({stockMovements.length})
              </button>
              <button
                onClick={() => setMovementTypeFilter('in')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${movementTypeFilter === 'in' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                <ArrowDownLeft className="w-3 h-3" />
                <span>إذن إضافة / توريد ({stockMovements.filter(m => m.type === 'in').length})</span>
              </button>
              <button
                onClick={() => setMovementTypeFilter('out')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${movementTypeFilter === 'out' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>إذن صرف ({stockMovements.filter(m => m.type === 'out').length})</span>
              </button>
              <button
                onClick={() => setMovementTypeFilter('adjustment')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${movementTypeFilter === 'adjustment' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>تسوية جردية ({stockMovements.filter(m => m.type === 'adjustment').length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">مركز التكلفة:</span>
              <select
                value={selectedCostCenterFilter}
                onChange={(e) => setSelectedCostCenterFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
              >
                <option value="all">كافة المشاريع والمراكز</option>
                {costCenters.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <AdvancedDateFilter
            startDate={startDate}
            endDate={endDate}
            onFilterChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            lang={lang}
          />

          {/* جدول سجل الحركات والأذون */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>سجل حركة الأذون المخزنية والتوريد والصرف ({filteredMovements.length})</span>
              </h3>
              <div className="text-xs text-slate-500 font-medium">
                جاهز للتصدير والطباعة والمشاركة الفورية عبر واتساب
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 font-bold">رقم الإذن</th>
                    <th className="py-3 px-3 font-bold">التاريخ</th>
                    <th className="py-3 px-3 font-bold text-center">نوع الحركة</th>
                    <th className="py-3 px-3 font-bold">كود SKU</th>
                    <th className="py-3 px-3 font-bold">اسم الصنف والمواصفات</th>
                    <th className="py-3 px-3 font-bold text-center">الكمية</th>
                    <th className="py-3 px-3 font-bold text-center">سعر الوحدة</th>
                    <th className="py-3 px-3 font-bold text-center">القيمة الإجمالية</th>
                    <th className="py-3 px-3 font-bold">المستودع</th>
                    <th className="py-3 px-3 font-bold">المورد / المستلم</th>
                    <th className="py-3 px-3 font-bold">المشروع / مركز التكلفة</th>
                    <th className="py-3 px-3 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredMovements.map(m => {
                    const isIncoming = m.type === 'in';
                    const isOutgoing = m.type === 'out';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.movementNumber}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono">{m.date}</td>
                        <td className="py-3 px-3 text-center">
                          {isIncoming ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>إذن إضافة (توريد)</span>
                            </span>
                          ) : isOutgoing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>إذن صرف</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>تسوية جردية</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 font-bold">{m.sku}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{m.itemName}</td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900">
                          {m.quantity} <span className="text-[10px] font-normal text-slate-500">{m.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{m.unitPrice.toLocaleString()} {currencySymbol}</td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-700 bg-slate-50/50">
                          {m.totalAmount.toLocaleString()} {currencySymbol}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">{m.warehouseLocation || '-'}</td>
                        <td className="py-3 px-3 text-slate-700 font-semibold">{m.recipientOrSupplier || '-'}</td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">{m.costCenterName || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePrintVoucher(m)}
                              className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                              title="طباعة إذن الحركة المخزنية (PDF)"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleShareSingleVoucherWhatsApp(m)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="إرسال تفاصيل الإذن عبر واتساب (صيغة طباعة)"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovement(m.id, m.movementNumber)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="حذف الحركة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400 text-sm">
                        لا توجد حركات مخزنية مسجلة تطابق الفلاتر الحالية. استخدم أزرار "إذن إضافة" أو "إذن صرف" أعلاه لتسجيل أول حركة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة / تعديل صنف */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>{editingItem ? 'تعديل بيانات الصنف المخزني' : 'إضافة صنف جديد للمخزون'}</span>
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم الصنف والمواصفات <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أسمنت بورتلاندي مقاوم 50 كجم"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف الرئيسي</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="مواد خام">مواد خام ومستلزمات</option>
                    <option value="منتجات جاهزة">منتجات وبضاعة جاهزة</option>
                    <option value="معدات وأدوات">معدات وأدوات تشغيل</option>
                    <option value="قطع غيار">قطع غيار وصيانة</option>
                    <option value="مواد تعبئة وتغليف">مواد تعبئة وتغليف</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وحدة القياس</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كيس">كيس</option>
                    <option value="طن">طن</option>
                    <option value="كجم">كجم</option>
                    <option value="متر">متر</option>
                    <option value="م2">م2</option>
                    <option value="م3">م3</option>
                    <option value="لتر">لتر</option>
                    <option value="كرتونة">كرتونة</option>
                    <option value="حزمة">حزمة</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">موقع التخزين (المستودع)</label>
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرصيد الفعلي الحالي <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حد التنبيه (النقص)</label>
                  <input
                    type="number"
                    min={0}
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-amber-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الشراء (التكلفة) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر البيع المقترح</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات ومواصفات فنية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تفاصيل أخرى أو مورد معتمد..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <span>{editingItem ? 'حفظ التعديلات' : 'إضافة الصنف للمخزون'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تسجيل إذن حركة مخزنية (إضافة / صرف / تسوية) */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className={`text-white px-6 py-4 flex items-center justify-between ${movType === 'in' ? 'bg-emerald-900' : movType === 'out' ? 'bg-amber-900' : 'bg-blue-900'}`}>
              <h3 className="font-bold text-base flex items-center gap-2">
                {movType === 'in' ? <ArrowDownLeft className="w-5 h-5 text-emerald-400" /> : movType === 'out' ? <ArrowUpRight className="w-5 h-5 text-amber-400" /> : <ArrowRightLeft className="w-5 h-5 text-blue-400" />}
                <span>
                  {movType === 'in' ? 'إذن إضافة وتوريد مواد للمخزن (+)' : movType === 'out' ? 'إذن صرف مواد من المخزن (-)' : 'تسوية جردية لرصيد المخزون (±)'}
                </span>
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الحركة</label>
                  <select
                    value={movType}
                    onChange={(e) => setMovType(e.target.value as StockMovementType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                  >
                    <option value="in">📥 إذن إضافة وتوريد (زيادة رصيد)</option>
                    <option value="out">📤 إذن صرف مواد (خصم رصيد)</option>
                    <option value="adjustment">⚖️ تسوية جردية (تعديل مباشر)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الإذن المخزني</label>
                  <input
                    type="text"
                    required
                    value={movNumber}
                    onChange={(e) => setMovNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الحركة</label>
                  <input
                    type="date"
                    required
                    value={movDate}
                    onChange={(e) => setMovDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              {/* اختيار الصنف */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الصنف المخزني <span className="text-red-500">*</span></label>
                <select
                  required
                  value={movItemId}
                  onChange={(e) => handleSelectMovementItem(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 text-xs"
                >
                  <option value="">-- اختر الصنف من قائمة المخزون --</option>
                  {inventory.map(itm => (
                    <option key={itm.id} value={itm.id}>
                      [{itm.sku}] {itm.name} (الرصيد الحالي: {itm.currentStock} {itm.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {movType === 'adjustment' ? 'الرصيد الفعلي الجديد (الجرد) *' : 'الكمية المطلوبة *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step="any"
                    value={movQuantity}
                    onChange={(e) => setMovQuantity(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 50"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-base text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الوحدة ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={movUnitPrice}
                    onChange={(e) => setMovUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">إجمالي القيمة التقديرية</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-extrabold text-emerald-700 text-sm">
                    {((Number(movQuantity) || 0) * (Number(movUnitPrice) || 0)).toLocaleString()} {currencySymbol}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {movType === 'in' ? 'المورد / جهة التوريد' : 'المستلم / المهندس / الجهة'}
                  </label>
                  <input
                    type="text"
                    value={movRecipientOrSupplier}
                    onChange={(e) => setMovRecipientOrSupplier(e.target.value)}
                    placeholder={movType === 'in' ? 'اسم المورد أو المصنع' : 'اسم المشرف أو المقاول'}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المشروع / مركز التكلفة</label>
                  <select
                    value={movCostCenterId}
                    onChange={(e) => setMovCostCenterId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="">-- بدون تحديد / مستودع عام --</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستند المرجعي (فاتورة / طلب)</label>
                  <input
                    type="text"
                    value={movRefDoc}
                    onChange={(e) => setMovRefDoc(e.target.value)}
                    placeholder="مثال: INV-994 أو REQ-02"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وشرح الحركة</label>
                <textarea
                  rows={2}
                  value={movNotes}
                  onChange={(e) => setMovNotes(e.target.value)}
                  placeholder="سبب الصرف أو التوريد أو تفاصيل التسوية..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 ${movType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : movType === 'out' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <span>تسجيل واعتماد الإذن المخزني 📦</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
