import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  Upload,
  Printer,
  Share2,
  Table,
  PlusCircle,
  Save,
  Search,
  Check,
  Edit2,
  FolderPlus,
  RefreshCw,
  Calculator,
  Layers,
  ArrowUpDown,
  Sparkles,
  Copy,
  Image as ImageIcon,
  Eye,
  FileCheck2,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CustomSheet, SheetColumn } from '../../types';
import { getCustomSheets, saveCustomSheets } from '../../utils/storage';
import { customAlert, customConfirm } from '../../utils/dialog';
import { getSystemCurrency } from '../../utils/currency';
import { Language, t } from '../../utils/i18n';
import { formatWhatsAppReport, sendWhatsAppMessage } from '../../utils/whatsappPrinter';
import { WhatsAppRecipientSelector } from '../common/WhatsAppRecipientSelector';
import { WhatsAppContact } from '../../utils/whatsappContacts';
import { CustomerSupplier, Employee, BankAccount, CompanySettings, UserAccount, Account, CostCenter } from '../../types';

interface CustomSheetsModuleProps {
  sheets?: CustomSheet[];
  onRefresh?: () => void;
  lang?: Language;
  initialSelectedSheetId?: string | null;
  accounts?: Account[];
  costCenters?: CostCenter[];
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  settings?: CompanySettings;
  users?: UserAccount[];
}

export const CustomSheetsModule: React.FC<CustomSheetsModuleProps> = ({
  sheets: propsSheets,
  onRefresh: propsOnRefresh,
  lang = 'ar',
  initialSelectedSheetId,
  accounts,
  costCenters,
  customersSuppliers,
  employees,
  banks,
  settings,
  users
}) => {
  const sysCurr = getSystemCurrency();
  const [internalSheets, setInternalSheets] = useState<CustomSheet[]>(() => getCustomSheets() || []);
  const sheets = propsSheets || internalSheets || [];
  const onRefresh = () => {
    setInternalSheets(getCustomSheets());
    if (propsOnRefresh) propsOnRefresh();
  };

  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => {
    if (initialSelectedSheetId && sheets.some(s => s.id === initialSelectedSheetId)) {
      return initialSelectedSheetId;
    }
    return sheets.length > 0 ? sheets[0].id : '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [previewDocumentRow, setPreviewDocumentRow] = useState<Record<string, any> | null>(null);

  // Form State for new sheet
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetDesc, setNewSheetDesc] = useState('');
  const [newSheetCategory, setNewSheetCategory] = useState('تسويات جردية ومحاسبة');
  const [newSheetTemplate, setNewSheetTemplate] = useState<'blank' | 'boq' | 'expenses' | 'adjustments' | 'documents'>('blank');

  // Form State for new column
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<'text' | 'number' | 'currency' | 'date'>('text');

  const currentSheet = sheets.find(s => s.id === selectedSheetId) || sheets[0];

  // Helper to calculate total for a numeric/currency column
  const calculateColumnTotal = (colKey: string, colType: string) => {
    if (!currentSheet || (colType !== 'number' && colType !== 'currency')) return null;
    return currentSheet.rows.reduce((sum, row) => {
      const val = parseFloat(row[colKey]) || 0;
      return sum + val;
    }, 0);
  };

  // Cell Edit Handler
  const handleCellChange = (rowIndex: number, colKey: string, value: any) => {
    if (!currentSheet) return;
    const updatedRows = [...currentSheet.rows];
    const currentRow = { ...updatedRows[rowIndex], [colKey]: value };

    // Auto calculate if row has qty & unitCost and totalCost exists
    if ((colKey === 'qty' || colKey === 'unitCost') && 'totalCost' in currentRow) {
      const q = parseFloat(currentRow.qty) || 0;
      const u = parseFloat(currentRow.unitCost) || 0;
      currentRow.totalCost = q * u;
      if ('sellingPrice' in currentRow && 'profitMargin' in currentRow) {
        const s = parseFloat(currentRow.sellingPrice) || 0;
        currentRow.profitMargin = (s * q) - (u * q);
      }
    }

    updatedRows[rowIndex] = currentRow;
    const updatedSheet: CustomSheet = {
      ...currentSheet,
      rows: updatedRows,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const newSheets = sheets.map(s => s.id === currentSheet.id ? updatedSheet : s);
    saveCustomSheets(newSheets);
    onRefresh();
  };

  // Handle Image Upload for document/photo cell
  const handleImageUpload = (rowIndex: number, colKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const result = uploadEvt.target?.result as string;
      handleCellChange(rowIndex, colKey, result);
      customAlert('تم رفع وحفظ صورة المستند بنجاح!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Add new row to current sheet
  const handleAddRow = () => {
    if (!currentSheet) return;
    const newRow: Record<string, any> = { id: `row_${Date.now()}` };
    currentSheet.columns.forEach(col => {
      newRow[col.key] = col.type === 'number' || col.type === 'currency' ? 0 : '';
    });

    const updatedSheet: CustomSheet = {
      ...currentSheet,
      rows: [...currentSheet.rows, newRow],
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const newSheets = sheets.map(s => s.id === currentSheet.id ? updatedSheet : s);
    saveCustomSheets(newSheets);
    onRefresh();
  };

  // Delete row from current sheet
  const handleDeleteRow = (rowIndex: number) => {
    if (!currentSheet) return;
    const updatedRows = currentSheet.rows.filter((_, idx) => idx !== rowIndex);
    const updatedSheet: CustomSheet = {
      ...currentSheet,
      rows: updatedRows,
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    const newSheets = sheets.map(s => s.id === currentSheet.id ? updatedSheet : s);
    saveCustomSheets(newSheets);
    onRefresh();
  };

  // Add new column to current sheet
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSheet || !newColLabel.trim()) return;

    const colKey = `col_${Date.now()}`;
    const newCol: SheetColumn = {
      key: colKey,
      label: newColLabel.trim(),
      type: newColType,
      width: 140
    };

    const updatedRows = currentSheet.rows.map(row => ({
      ...row,
      [colKey]: newColType === 'number' || newColType === 'currency' ? 0 : ''
    }));

    const updatedSheet: CustomSheet = {
      ...currentSheet,
      columns: [...currentSheet.columns, newCol],
      rows: updatedRows,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    const newSheets = sheets.map(s => s.id === currentSheet.id ? updatedSheet : s);
    saveCustomSheets(newSheets);
    onRefresh();
    setShowAddColModal(false);
    setNewColLabel('');
    customAlert('تمت إضافة العمود الجديد بنجاح', 'success');
  };

  // Delete column
  const handleDeleteColumn = (colKey: string, colLabel: string) => {
    if (!currentSheet) return;
    if (currentSheet.columns.length <= 1) {
      customAlert('لا يمكن حذف العمود الأخير في الشيت', 'warning');
      return;
    }

    customConfirm(`هل أنت متأكد من حذف العمود "${colLabel}" وجميع بياناته؟`, () => {
      const updatedCols = currentSheet.columns.filter(c => c.key !== colKey);
      const updatedRows = currentSheet.rows.map(row => {
        const copy = { ...row };
        delete copy[colKey];
        return copy;
      });

      const updatedSheet: CustomSheet = {
        ...currentSheet,
        columns: updatedCols,
        rows: updatedRows,
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      const newSheets = sheets.map(s => s.id === currentSheet.id ? updatedSheet : s);
      saveCustomSheets(newSheets);
      onRefresh();
      customAlert('تم حذف العمود بنجاح', 'success');
    });
  };

  // Create new custom sheet
  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) {
      customAlert('يرجى إدخال اسم الشيت', 'warning');
      return;
    }

    let defaultCols: SheetColumn[] = [];
    let defaultRows: Array<Record<string, any>> = [];

    if (newSheetTemplate === 'adjustments') {
      defaultCols = [
        { key: 'adjType', label: 'نوع التسوية الجردية', type: 'text', width: 220 },
        { key: 'debitAcc', label: 'الحساب المدين (من ح/)', type: 'text', width: 200 },
        { key: 'creditAcc', label: 'الحساب الدائن (إلى ح/)', type: 'text', width: 200 },
        { key: 'amount', label: 'مبلغ التسوية', type: 'currency', width: 140 },
        { key: 'period', label: 'الفترة / تاريخ التسوية', type: 'date', width: 130 },
        { key: 'entryNumber', label: 'رقم القيد', type: 'text', width: 120 },
        { key: 'description', label: 'الشرح المحاسبي والتسوية', type: 'text', width: 260 },
        { key: 'status', label: 'حالة التسوية', type: 'text', width: 120 }
      ];
      defaultRows = [
        { id: '1', adjType: 'المصروفات المستحقة', debitAcc: 'رواتب وأجور العاملين (5010)', creditAcc: 'أجور ورواتب مستحقة الدفع (2030)', amount: 30000, period: new Date().toISOString().slice(0, 10), entryNumber: 'ADJ-001', description: 'إثبات رواتب مستحقة لم تصرف بعد', status: 'معتمد ومقيد' },
        { id: '2', adjType: 'المصروفات المدفوعة مقدماً', debitAcc: 'إيجارات مدفوعة مقدماً (1080)', creditAcc: 'البنك الأهلي التجاري (1020)', amount: 45000, period: new Date().toISOString().slice(0, 10), entryNumber: 'ADJ-002', description: 'إثبات عقد إيجار مدفوع مقدماً', status: 'معتمد ومقيد' },
        { id: '3', adjType: 'الإيرادات المستحقة', debitAcc: 'إيرادات مستحقة غير محصلة (1090)', creditAcc: 'إيرادات استشارات هندسية (4020)', amount: 25000, period: new Date().toISOString().slice(0, 10), entryNumber: 'ADJ-003', description: 'إثبات إيرادات مستحقة لم تصدر فاتورتها', status: 'معتمد ومقيد' },
        { id: '4', adjType: 'الإيرادات المقبوضة مقدماً', debitAcc: 'مصرف الراجحي (1030)', creditAcc: 'إيرادات مقبوضة مقدماً (2040)', amount: 50000, period: new Date().toISOString().slice(0, 10), entryNumber: 'ADJ-004', description: 'تحصيل دفعة مقدمة من عميل', status: 'معتمد ومقيد' }
      ];
    } else if (newSheetTemplate === 'documents') {
      defaultCols = [
        { key: 'entryNumber', label: 'رقم القيد', type: 'text', width: 120 },
        { key: 'date', label: 'التاريخ', type: 'date', width: 110 },
        { key: 'docType', label: 'نوع المستند', type: 'text', width: 140 },
        { key: 'docName', label: 'اسم المستند / البيان', type: 'text', width: 220 },
        { key: 'party', label: 'الجهة / المورد / العميل', type: 'text', width: 180 },
        { key: 'amount', label: 'المبلغ', type: 'currency', width: 130 },
        { key: 'docImage', label: 'صورة المستند', type: 'text', width: 160 },
        { key: 'notes', label: 'ملاحظات الأرشفة والتدقيق', type: 'text', width: 200 }
      ];
      defaultRows = [
        { id: '1', entryNumber: 'Q-2026-0001', date: new Date().toISOString().slice(0, 10), docType: 'سند إيداع / شيك', docName: 'شيك سداد دفعة مشروع', party: 'مجموعة الإعمار الذهبي', amount: 60000, docImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80', notes: 'مرفق صورة الشيك البنكي المعتمد' },
        { id: '2', entryNumber: 'Q-2026-0002', date: new Date().toISOString().slice(0, 10), docType: 'فاتورة ضريبية', docName: 'فاتورة توريد مواد بناء', party: 'شركة الحديد والصلب الوطنية', amount: 32200, docImage: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80', notes: 'فاتورة رسمية برمز QR زكاة وضريبة' }
      ];
    } else if (newSheetTemplate === 'boq') {
      defaultCols = [
        { key: 'itemNo', label: 'رقم البند', type: 'text', width: 90 },
        { key: 'description', label: 'بيان الأعمال والمواصفات', type: 'text', width: 250 },
        { key: 'unit', label: 'الوحدة', type: 'text', width: 90 },
        { key: 'qty', label: 'الكمية', type: 'number', width: 100 },
        { key: 'unitRate', label: 'الفئة (سعر الوحدة)', type: 'currency', width: 120 },
        { key: 'total', label: 'إجمالي البند', type: 'currency', width: 140 }
      ];
      defaultRows = [
        { id: '1', itemNo: '1.1', description: 'حفر في جميع أنواع التربة للأساسات', unit: 'م3', qty: 300, unitRate: 25, total: 7500 },
        { id: '2', itemNo: '1.2', description: 'توريد وصب خرسانة عادية للنظافة سمك 10 سم', unit: 'م3', qty: 45, unitRate: 220, total: 9900 }
      ];
    } else if (newSheetTemplate === 'expenses') {
      defaultCols = [
        { key: 'date', label: 'التاريخ', type: 'date', width: 110 },
        { key: 'desc', label: 'بيان المصروف / الفاتورة', type: 'text', width: 220 },
        { key: 'payee', label: 'المستفيد / المورد', type: 'text', width: 160 },
        { key: 'costCenter', label: 'مركز التكلفة / المشروع', type: 'text', width: 150 },
        { key: 'amount', label: 'المبلغ الأساسي', type: 'currency', width: 120 },
        { key: 'tax', label: 'الضريبة (15%)', type: 'currency', width: 110 },
        { key: 'total', label: 'الإجمالي شاملاً الضريبة', type: 'currency', width: 130 }
      ];
      defaultRows = [
        { id: '1', date: new Date().toISOString().slice(0, 10), desc: 'شراء أدوات سلامة ومهمات موقع', payee: 'شركة السلامة الحديثة', costCenter: 'برج الرياض', amount: 3500, tax: 525, total: 4025 }
      ];
    } else {
      // Blank template
      defaultCols = [
        { key: 'col_1', label: 'البيان / الصنف', type: 'text', width: 200 },
        { key: 'col_2', label: 'الكمية / العدد', type: 'number', width: 120 },
        { key: 'col_3', label: 'سعر الوحدة', type: 'currency', width: 120 },
        { key: 'col_4', label: 'القيمة الإجمالية', type: 'currency', width: 140 },
        { key: 'col_5', label: 'ملاحظات', type: 'text', width: 180 }
      ];
      defaultRows = [
        { id: '1', col_1: 'عنصر تجريبي أول', col_2: 10, col_3: 150, col_4: 1500, col_5: 'جاهز للاستخدام' }
      ];
    }

    const newSheet: CustomSheet = {
      id: `sheet_${Date.now()}`,
      title: newSheetTitle.trim(),
      description: newSheetDesc.trim(),
      category: newSheetCategory,
      columns: defaultCols,
      rows: defaultRows,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      createdBy: 'مدير النظام'
    };

    const newSheets = [newSheet, ...sheets];
    saveCustomSheets(newSheets);
    setSelectedSheetId(newSheet.id);
    onRefresh();
    setShowNewSheetModal(false);
    setNewSheetTitle('');
    setNewSheetDesc('');
    customAlert('تم إنشاء شيت الإكسيل الجديد بنجاح!', 'success');
  };

  // Delete sheet
  const handleDeleteSheet = (sheetId: string, sheetTitle: string) => {
    if (sheets.length <= 1) {
      customAlert('لا يمكن حذف الشيت الوحيد المتبقي', 'warning');
      return;
    }
    customConfirm(`هل أنت متأكد من حذف الشيت "${sheetTitle}" نهائياً؟`, () => {
      const updated = sheets.filter(s => s.id !== sheetId);
      saveCustomSheets(updated);
      setSelectedSheetId(updated[0]?.id || '');
      onRefresh();
      customAlert('تم حذف الشيت بنجاح', 'success');
    });
  };

  // Export to Real Excel .XLSX using sheetjs
  const handleExportXLSX = () => {
    if (!currentSheet) return;
    try {
      const headers = currentSheet.columns.map(c => c.label);
      const rowsData = currentSheet.rows.map(row => {
        const rowObj: Record<string, any> = {};
        currentSheet.columns.forEach(col => {
          rowObj[col.label] = row[col.key] !== undefined ? row[col.key] : '';
        });
        return rowObj;
      });

      const ws = XLSX.utils.json_to_sheet(rowsData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, currentSheet.title.slice(0, 30));

      const fileName = `${currentSheet.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      customAlert('تم تصدير ملف الإكسيل بنجاح!', 'success');
    } catch (err) {
      console.error(err);
      customAlert('حدث خطأ أثناء تصدير ملف الإكسيل', 'error');
    }
  };

  // Import Excel File (.xlsx / .csv)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          customAlert('الملف المستورد فارغ', 'warning');
          return;
        }

        const headerRow: string[] = rawJson[0] || [];
        const dataRows = rawJson.slice(1);

        const newCols: SheetColumn[] = headerRow.map((label, idx) => {
          const colKey = `col_${idx}_${Date.now()}`;
          return {
            key: colKey,
            label: String(label || `عمود ${idx + 1}`),
            type: 'text',
            width: 140
          };
        });

        const newRows = dataRows.map((row, rIdx) => {
          const r: Record<string, any> = { id: `row_${rIdx}_${Date.now()}` };
          newCols.forEach((col, cIdx) => {
            r[col.key] = row[cIdx] !== undefined ? row[cIdx] : '';
          });
          return r;
        });

        const newSheet: CustomSheet = {
          id: `sheet_${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: `تم استيراده من ملف إكسيل (${file.name})`,
          category: 'مستورد من ملف',
          columns: newCols,
          rows: newRows,
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
          createdBy: 'استيراد إكسيل'
        };

        const updated = [newSheet, ...sheets];
        saveCustomSheets(updated);
        setSelectedSheetId(newSheet.id);
        onRefresh();
        customAlert(`تم استيراد الشيت (${newSheet.title}) بنجاح بواقع ${newRows.length} صف!`, 'success');
      } catch (err) {
        console.error(err);
        customAlert('حدث خطأ أثناء قراءة ملف الإكسيل، تأكد من الصيغة', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // WhatsApp formatted report
  const handleSendWhatsApp = () => {
    if (!currentSheet) return;
    const phone = whatsappPhone.replace(/[^0-9]/g, '');

    const rowsFormatted = currentSheet.rows.map((row, i) => {
      const summary = currentSheet.columns.map(c => `${c.label}: ${row[c.key] || '-'}`).join(' | ');
      return `${i + 1}) ${summary}`;
    });

    let greeting = '';
    if (selectedContact) {
      greeting = `👤 *عناية الأستاذ/ة:* ${selectedContact.name} (${selectedContact.categoryName || ''})\n`;
    }

    const reportMessage = `${greeting}${formatWhatsAppReport({
      title: `📊 *شيت إكسيل رسمي: ${currentSheet.title}*`,
      entityName: currentSheet.category,
      entityCode: `SHEET-${currentSheet.id.slice(-4)}`,
      date: currentSheet.updatedAt,
      currency: sysCurr,
      items: rowsFormatted,
      notes: currentSheet.description || 'شيت إكسيل معتمد من النظام المحاسبي'
    })}`;

    sendWhatsAppMessage(phone, reportMessage);
    setShowWhatsAppModal(false);
    customAlert('تم فتح تطبيق الواتساب لإرسال الشيت للمستلم بنجاح', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* ترويسة وحدة الشيتات والإكسيل */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-white">
                <span>شيتات إكسيل تفاعلية ونماذج حسابية</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  Excel & Sheets Pro
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                إضافة وإدارة شيتات إكسيل مخصصة، جداول كميات، تسعير ومستخلصات مع استيراد وتصدير XLSX والطباعة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* زر استيراد ملف إكسيل */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer shadow">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>استيراد ملف Excel</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFile} className="hidden" />
          </label>

          {/* زر تصدير الشيت الحالي إكسيل */}
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-emerald-600 transition shadow"
            title="تصدير الشيت الحالي كملف إكسيل .xlsx حقيقي"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          {/* زر الطباعة */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition shadow"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة الشيت</span>
          </button>

          {/* زر الواتساب */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Share2 className="w-4 h-4" />
            <span>إرسال بالواتساب</span>
          </button>

          {/* زر إضافة شيت جديد */}
          <button
            onClick={() => setShowNewSheetModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شيت جديد ✨</span>
          </button>
        </div>
      </div>

      {/* قائمة الشيتات المتاحة والشيت النشط */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* العمود الجانبي: قائمة الشيتات المحفوظة */}
        <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>الشيتات المحفوظة ({sheets.length})</span>
            </h3>
            <button
              onClick={() => setShowNewSheetModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>جديد</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sheets.map(sheet => {
              const isSelected = sheet.id === currentSheet?.id;
              return (
                <div
                  key={sheet.id}
                  onClick={() => setSelectedSheetId(sheet.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="truncate flex-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <FileSpreadsheet className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{sheet.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="bg-slate-200/60 px-1.5 py-0.2 rounded text-slate-600">{sheet.category}</span>
                      <span>{sheet.rows.length} صفوف</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheet(sheet.id, sheet.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition"
                    title="حذف الشيت"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* المساحة الرئيسية: محرر الشيت التفاعلي */}
        <div className="lg:col-span-3 space-y-4">
          {currentSheet ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* شريط أدوات الشيت الحالي */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{currentSheet.title}</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold border border-blue-200">
                      {currentSheet.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{currentSheet.description || 'شيت إكسيل حر وتفاعلي'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صف (Row)</span>
                  </button>

                  <button
                    onClick={() => setShowAddColModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة عمود (Column)</span>
                  </button>
                </div>
              </div>

              {/* جدول الإكسيل التفاعلي */}
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-300 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-200 text-center w-12 text-slate-500">
                        #
                      </th>
                      {currentSheet.columns.map((col) => (
                        <th key={col.key} className="py-2.5 px-3 font-bold border-r border-slate-200 relative group min-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{col.label}</span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleDeleteColumn(col.key, col.label)}
                                className="p-0.5 text-red-500 hover:bg-red-100 rounded"
                                title="حذف هذا العمود"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 font-bold text-center w-24 text-slate-700">
                        معاينة / طباعة
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center w-14 text-slate-500">
                        حذف
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentSheet.rows.map((row, rIdx) => (
                      <tr key={row.id || rIdx} className="hover:bg-blue-50/40 transition">
                        <td className="py-2 px-3 font-mono font-bold text-slate-400 bg-slate-50/80 border-r border-slate-200 text-center">
                          {rIdx + 1}
                        </td>
                        {currentSheet.columns.map((col) => {
                          const isImageCol = col.key === 'docImage' || col.key.toLowerCase().includes('image') || col.key.toLowerCase().includes('صورة');
                          const cellValue = row[col.key];

                          if (isImageCol) {
                            return (
                              <td key={col.key} className="py-1.5 px-2 border-r border-slate-200">
                                <div className="flex items-center gap-1.5">
                                  {cellValue ? (
                                    <div
                                      onClick={() => setPreviewDocumentRow(row)}
                                      className="relative group/img cursor-pointer w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-100"
                                      title="انقر للمعاينة والطباعة الفورية"
                                    >
                                      <img
                                        src={cellValue}
                                        alt="مستند"
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover group-hover/img:scale-110 transition"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-[10px]">
                                        <Eye className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                  <div className="flex-1 flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={cellValue || ''}
                                      onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                                      className="w-full py-1 px-1.5 text-[11px] bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded transition outline-none font-mono text-slate-700"
                                      placeholder="رابط أو رفع صورة..."
                                    />
                                    <label className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer shrink-0" title="رفع صورة من الجهاز">
                                      <Upload className="w-3 h-3" />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(rIdx, col.key, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} className="py-1.5 px-2 border-r border-slate-200">
                              <input
                                type={col.type === 'number' || col.type === 'currency' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                value={row[col.key] !== undefined ? row[col.key] : ''}
                                onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                                className="w-full py-1 px-2 text-xs bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded transition outline-none font-medium text-slate-800"
                                placeholder={col.label}
                              />
                            </td>
                          );
                        })}

                        {/* Document Print & Inspection Button */}
                        <td className="py-2 px-2 text-center border-r border-slate-200">
                          <button
                            onClick={() => setPreviewDocumentRow(row)}
                            className="flex items-center justify-center gap-1 mx-auto px-2 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-slate-200 rounded-lg text-[11px] font-bold transition shadow-xs"
                            title="معاينة وطباعة المستند الرسمي"
                          >
                            <Printer className="w-3 h-3" />
                            <span>طباعة</span>
                          </button>
                        </td>

                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="حذف هذا الصف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentSheet.rows.length === 0 && (
                      <tr>
                        <td colSpan={currentSheet.columns.length + 3} className="py-8 text-center text-slate-400">
                          لا توجد صفوف في هذا الشيت. اضغط على زر "إضافة صف" لإدخال البيانات.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* شريط الإجماليات التلقائي للأعمدة الرقمية والمالية */}
                  <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 text-center bg-slate-200/70 border-r border-slate-300">
                        الإجمالي
                      </td>
                      {currentSheet.columns.map((col) => {
                        const total = calculateColumnTotal(col.key, col.type);
                        return (
                          <td key={col.key} className="py-2.5 px-3 font-mono border-r border-slate-300">
                            {total !== null ? (
                              <span className={col.type === 'currency' ? 'text-emerald-700 font-black' : 'text-slate-800'}>
                                {total.toLocaleString()} {col.type === 'currency' ? sysCurr : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-2 bg-slate-200/70" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              اختر شيت من القائمة أو أضف شيت جديد للبدء
            </div>
          )}
        </div>
      </div>

      {/* نافذة معاينة وطباعة المستند / الفاتورة المحددة */}
      {previewDocumentRow && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-right max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  معاينة وطباعة المستند / الفاتورة الرسمية
                </h3>
              </div>
              <button
                onClick={() => setPreviewDocumentRow(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* ترويسة السند والبيانات */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">رقم القيد / المستند:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {previewDocumentRow.entryNumber || previewDocumentRow.id || 'DOC-2026'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">التاريخ:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {previewDocumentRow.date || previewDocumentRow.period || new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">نوع المستند:</span>
                  <span className="font-bold text-blue-700">
                    {previewDocumentRow.docType || previewDocumentRow.adjType || 'وثيقة رسمية'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الجهة / المستفيد:</span>
                  <span className="font-bold text-slate-900">
                    {previewDocumentRow.party || previewDocumentRow.payee || previewDocumentRow.debitAcc || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المبلغ:</span>
                  <span className="font-mono font-black text-emerald-700">
                    {previewDocumentRow.amount ? `${Number(previewDocumentRow.amount).toLocaleString()} ${sysCurr}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الحالة:</span>
                  <span className="font-bold text-emerald-600">
                    {previewDocumentRow.status || 'معتمد وموثق'}
                  </span>
                </div>
              </div>

              {/* صورة المستند المرفقة */}
              {previewDocumentRow.docImage ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 p-2 text-center">
                  <p className="text-xs text-slate-500 font-bold mb-2">الصورة الأصلية المرفقة للمستند:</p>
                  <img
                    src={previewDocumentRow.docImage}
                    alt="صورة المستند المرفق"
                    referrerPolicy="no-referrer"
                    className="max-h-[320px] mx-auto rounded-lg object-contain shadow-md border border-slate-200"
                  />
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">لا توجد صورة مرفقة لهذا المستند حالياً</p>
                </div>
              )}

              {/* ملاحظات التدقيق */}
              {previewDocumentRow.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1">ملاحظات التدقيق والأرشفة:</span>
                  <p>{previewDocumentRow.notes}</p>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setPreviewDocumentRow(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المستند الآن 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة شيت جديد */}
      {showNewSheetModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>{t('add_sheet_btn', lang)}</span>
              </h3>
              <button onClick={() => setShowNewSheetModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSheet} className="space-y-4 mt-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشيت / العنوان *</label>
                <input
                  type="text"
                  required
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="مثال: شيت تسعير مشروع برج النرجس"
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                <select
                  value={newSheetCategory}
                  onChange={(e) => setNewSheetCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="تسويات جردية ومحاسبة">تسويات جردية ومحاسبة</option>
                  <option value="أرشيف ومستندات">أرشيف ومستندات</option>
                  <option value="مشاريع ومقاولات">مشاريع ومقاولات</option>
                  <option value="مالية وعقود">مالية وعقود</option>
                  <option value="مخزون ومشتريات">مخزون ومشتريات</option>
                  <option value="رواتب ومكافآت">رواتب ومكافآت</option>
                  <option value="أخرى عامة">أخرى عامة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختيار قالب جاهز</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewSheetTemplate('adjustments');
                      if (!newSheetTitle) setNewSheetTitle('شيت التسويات الجردية');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-right ${newSheetTemplate === 'adjustments' ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400' : 'bg-slate-50 border-slate-200'}`}
                  >
                    ⭐ التسويات الجردية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSheetTemplate('documents');
                      if (!newSheetTitle) setNewSheetTitle('شيت المستندات والفواتير');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-right ${newSheetTemplate === 'documents' ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}
                  >
                    📑 المستندات والفواتير
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSheetTemplate('blank')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-right ${newSheetTemplate === 'blank' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200'}`}
                  >
                    شيت فارغ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSheetTemplate('boq')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-right ${newSheetTemplate === 'boq' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200'}`}
                  >
                    جدول كميات (BOQ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSheetTemplate('expenses')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-right ${newSheetTemplate === 'expenses' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200'}`}
                  >
                    شيت مصروفات
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف / ملاحظات</label>
                <textarea
                  rows={2}
                  value={newSheetDesc}
                  onChange={(e) => setNewSheetDesc(e.target.value)}
                  placeholder="وصف مختصر لمحتوى الشيت والغرض منه..."
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSheetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md"
                >
                  إنشاء الشيت الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة عمود جديد */}
      {showAddColModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">إضافة عمود جديد للشيت</h3>
              <button onClick={() => setShowAddColModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-4 mt-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العمود *</label>
                <input
                  type="text"
                  required
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="مثال: نسبة الإنجاز %، رقم العقد"
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع البيانات</label>
                <select
                  value={newColType}
                  onChange={(e: any) => setNewColType(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="text">نص (Text)</option>
                  <option value="number">رقم كمية / نسبة (Number)</option>
                  <option value="currency">مبلغ مالي وعملة (Currency)</option>
                  <option value="date">تاريخ (Date)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  إضافة العمود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إرسال الشيت بالواتساب */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <span>إرسال الشيت عبر واتساب مع اختيار المستلم</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-xs text-slate-500">
                اختر المستلم من دليل الاتصال الموحد (عملاء، موردين، موظفين، إدارة) أو أدخل رقماً مخصصاً.
              </p>

              <WhatsAppRecipientSelector
                selectedPhone={whatsappPhone}
                onPhoneChange={(phone, contact) => {
                  setWhatsappPhone(phone);
                  if (contact) setSelectedContact(contact);
                }}
                customersSuppliers={customersSuppliers}
                employees={employees}
                banks={banks}
                settings={settings}
                users={users}
                onRecipientSelect={(contact) => {
                  setSelectedContact(contact);
                  setWhatsappPhone(contact.phone);
                }}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <span>إرسال الآن بالواتساب</span>
                  <span>📱</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
