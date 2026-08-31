import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, Calculator, CheckCircle2, AlertTriangle, Layers, TrendingDown } from 'lucide-react';
import { FixedAsset } from '../../types';
import { saveFixedAssets } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';

interface FixedAssetsModuleProps {
  fixedAssets: FixedAsset[];
  onRefresh: () => void;
  searchQuery: string;
}

export const FixedAssetsModule: React.FC<FixedAssetsModuleProps> = ({ fixedAssets, onRefresh, searchQuery }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'vehicles' | 'machines' | 'equipment' | 'buildings' | 'computers' | 'furniture'>('machines');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchaseValue, setPurchaseValue] = useState<number | ''>('');
  const [salvageValue, setSalvageValue] = useState<number | ''>(0);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number | ''>(5);
  const [location, setLocation] = useState('المقر الرئيسي');
  const [status, setStatus] = useState<'active' | 'maintenance' | 'disposed'>('active');

  const filteredAssets = fixedAssets.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q))
    );
  });

  const totalPurchaseValue = filteredAssets.reduce((sum, a) => sum + a.purchaseValue, 0);
  const totalAccumulatedDep = filteredAssets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalNetBookValue = filteredAssets.reduce((sum, a) => sum + a.netBookValue, 0);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'buildings': return 'أراضي ومباني';
      case 'vehicles': return 'سيارات ومركبات';
      case 'machines': return 'آلات ومعدات تشغيل';
      case 'equipment': return 'تجهيزات ومعدات';
      case 'computers': return 'أجهزة حاسب وتقنية';
      case 'furniture': return 'أثاث ومفروشات مكتبية';
      default: return cat;
    }
  };

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setCode(`FA-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setCategory('machines');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setPurchaseValue('');
    setSalvageValue(0);
    setUsefulLifeYears(5);
    setLocation('المقر الرئيسي');
    setStatus('active');
    setShowModal(true);
  };

  const handleOpenEdit = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setCode(asset.code);
    setName(asset.name);
    setCategory(asset.category);
    setPurchaseDate(asset.purchaseDate);
    setPurchaseValue(asset.purchaseValue);
    setSalvageValue(asset.salvageValue);
    setUsefulLifeYears(asset.usefulLifeYears);
    setLocation(asset.location || 'المقر الرئيسي');
    setStatus(asset.status);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || purchaseValue === '' || usefulLifeYears === '') {
      alert('يرجى إدخال اسم الأصل وقيمة الشراء وسنوات العمر الإنتاجي');
      return;
    }

    const pVal = Number(purchaseValue);
    const sVal = Number(salvageValue || 0);
    const life = Number(usefulLifeYears || 5);
    const depRate = life > 0 ? Number((100 / life).toFixed(2)) : 20;

    // حساب الإهلاك السنوي ومجمع الإهلاك التقديري حتى الآن
    const yearsElapsed = Math.max(0, new Date().getFullYear() - new Date(purchaseDate).getFullYear());
    const annualDep = (pVal - sVal) / life;
    const accDep = Math.min(pVal - sVal, Math.round(annualDep * yearsElapsed));
    const netVal = pVal - accDep;

    let updated: FixedAsset[];
    if (editingAsset) {
      updated = fixedAssets.map(item => item.id === editingAsset.id ? {
        ...item,
        code,
        name,
        category,
        purchaseDate,
        purchaseValue: pVal,
        salvageValue: sVal,
        usefulLifeYears: life,
        depreciationRate: depRate,
        accumulatedDepreciation: accDep,
        netBookValue: netVal,
        location,
        status
      } : item);
    } else {
      const newAsset: FixedAsset = {
        id: `fa_${Date.now()}`,
        code,
        name,
        category,
        purchaseDate,
        purchaseValue: pVal,
        salvageValue: sVal,
        usefulLifeYears: life,
        depreciationRate: depRate,
        accumulatedDepreciation: accDep,
        netBookValue: netVal,
        location,
        status
      };
      updated = [newAsset, ...fixedAssets];
    }

    saveFixedAssets(updated);
    onRefresh();
    setShowModal(false);
    customAlert(editingAsset ? 'تم تعديل بيانات الأصل بنجاح' : 'تم تسجيل الأصل الثابت وبدء حساب الإهلاك بنجاح', 'success');
  };

  const handleDelete = (id: string, assetName: string) => {
    customConfirm(`هل أنت متأكد من حذف الأصل "${assetName}" من سجل الأصول الثابتة؟`, () => {
      saveFixedAssets(fixedAssets.filter(a => a.id !== id));
      onRefresh();
      customAlert('تم الحذف بنجاح', 'success');
    }, 'تأكيد حذف الأصل الثابت');
  };

  const exportData = filteredAssets.map(a => ({
    'كود الأصل': a.code,
    'اسم الأصل الثابت': a.name,
    'التصنيف': getCategoryLabel(a.category),
    'تاريخ الشراء': a.purchaseDate,
    'تكلفة الشراء الأساسية': a.purchaseValue,
    'قيمة الخردة المقدرة': a.salvageValue,
    'العمر الإنتاجي (سنوات)': a.usefulLifeYears,
    'نسبة الإهلاك السنوي': `${a.depreciationRate}%`,
    'مجمع الإهلاك التراكمي': a.accumulatedDepreciation,
    'صافي القيمة الدفترية': a.netBookValue,
    'الموقع': a.location || '-',
    'الحالة': a.status === 'active' ? 'في الخدمة' : a.status === 'maintenance' ? 'صيانة دورية' : 'مستبعد'
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* رأس الصفحة والإحصائيات */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
              <Building2 className="w-6 h-6" />
              <span>سجل الأصول الثابتة وحساب الإهلاك السنوي</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              إدارة الأصول الرأسمالية للشركة، حساب الإهلاك التراكمي القسط الثابت، ومتابعة صافي القيمة الدفترية الفورية.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons
              title="سجل الأصول الثابتة ومجمع الإهلاك"
              subtitle="كشف تفصيلي بتكلفة الأصول، مجمع الإهلاك وصافي القيمة الدفترية"
              data={exportData}
              filename="fixed_assets_report"
            />
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg transition duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل أصل ثابت جديد</span>
            </button>
          </div>
        </div>

        {/* المؤشرات المالية للأصول */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي التكلفة التاريخية (الشراء)</div>
            <div className="text-2xl font-extrabold text-white mt-1">{totalPurchaseValue.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span></div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي مجمع الإهلاك التراكمي</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{totalAccumulatedDep.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span></div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">صافي القيمة الدفترية الحالية (Net Book Value)</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalNetBookValue.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span></div>
          </div>
        </div>
      </div>

      {/* جدول الأصول الثابتة */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>قائمة الأصول الثابتة الرأسمالية ({filteredAssets.length})</span>
          </h3>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-blue-500" />
            <span>يتم حساب الإهلاك السنوي وفق طريقة القسط الثابت المعتمدة محاسبياً</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-bold">كود الأصل</th>
                <th className="py-3 px-3 font-bold">اسم الأصل والوصف</th>
                <th className="py-3 px-3 font-bold">التصنيف</th>
                <th className="py-3 px-3 font-bold text-center">تاريخ الشراء</th>
                <th className="py-3 px-3 font-bold text-center">تكلفة الشراء</th>
                <th className="py-3 px-3 font-bold text-center">العمر (سنوات)</th>
                <th className="py-3 px-3 font-bold text-center">نسبة الإهلاك</th>
                <th className="py-3 px-3 font-bold text-center">مجمع الإهلاك</th>
                <th className="py-3 px-3 font-bold text-center bg-blue-50/50 text-blue-900">صافي القيمة الدفترية</th>
                <th className="py-3 px-3 font-bold text-center">الحالة</th>
                <th className="py-3 px-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-600">{asset.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    <div>{asset.name}</div>
                    {asset.location && <div className="text-[11px] text-slate-400">{asset.location}</div>}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">{getCategoryLabel(asset.category)}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{asset.purchaseDate}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold">{asset.purchaseValue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">{asset.usefulLifeYears} سنوات</td>
                  <td className="py-3 px-3 text-center font-mono text-blue-700">{asset.depreciationRate}%</td>
                  <td className="py-3 px-3 text-center font-mono text-amber-700 font-semibold">{asset.accumulatedDepreciation.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-700 bg-blue-50/30">{asset.netBookValue.toLocaleString()} ر.س</td>
                  <td className="py-3 px-3 text-center">
                    {asset.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>في الخدمة</span>
                      </span>
                    ) : asset.status === 'maintenance' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        <span>صيانة دورية</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        <span>مستبعد / مباع</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(asset)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="تعديل بيانات الأصل أو إعادة احتساب الإهلاك"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id, asset.name)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="حذف الأصل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                    لا توجد أصول ثابتة مسجلة بعد. قم بالضغط على "تسجيل أصل ثابت جديد" لإضافة الأراضي، المباني، السيارات، أو المعدات.
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
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>{editingAsset ? 'تعديل بيانات الأصل الثابت' : 'تسجيل أصل ثابت جديد في السجل الرأسمالي'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الأصل (Code)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم الأصل والمواصفات <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سيارة نقل ميتسوبيشي كانتر موديل 2026"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف الأصل الرأسمالي</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="buildings">أراضي ومباني وإنشاءات</option>
                    <option value="vehicles">سيارات ومركبات وسائل نقل</option>
                    <option value="machines">آلات ومعدات تشغيل ثقيلة</option>
                    <option value="equipment">تجهيزات ومعدات فنية</option>
                    <option value="computers">أجهزة حاسب وسيرفرات وتقنية</option>
                    <option value="furniture">أثاث ومكتبات وديكورات</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الشراء / الحيازة</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة الأصل</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="active">في الخدمة ويعمل</option>
                    <option value="maintenance">تحت الصيانة الدورية</option>
                    <option value="disposed">مستبعد / مباع / خردة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تكلفة الشراء التاريخية <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={purchaseValue}
                    onChange={(e) => setPurchaseValue(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العمر الإنتاجي المقدر (سنوات) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={usefulLifeYears}
                    onChange={(e) => setUsefulLifeYears(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">الإهلاك السنوي: {usefulLifeYears ? (100 / Number(usefulLifeYears)).toFixed(1) : 0}%</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">قيمة الخردة المقدرة (Salvage)</label>
                  <input
                    type="number"
                    min={0}
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">موقع الأصل والعهدة</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: المقر الرئيسي - الدور الثاني - مكتب الإدارة"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2"
                />
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <span>{editingAsset ? 'حفظ التعديلات' : 'تسجيل الأصل وحساب الإهلاك'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
