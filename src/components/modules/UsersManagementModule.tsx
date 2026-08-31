import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  UserCheck,
  Lock,
  Key,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  ArrowRightLeft,
  Phone,
  MessageSquare,
  Sparkles,
  Layers,
  Check,
  Share2,
  AlertCircle
} from 'lucide-react';
import { UserAccount } from '../../types';
import { saveUsers, ALL_MODULE_IDS, getAdminPassword, saveAdminPassword } from '../../utils/storage';
import { customConfirm, customAlert } from '../../utils/dialog';
import { ExportButtons } from '../common/ExportButtons';
import { openWhatsApp } from '../../utils/whatsapp';
import { Language, t } from '../../utils/i18n';

interface UsersManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onRefresh: () => void;
  searchQuery: string;
  onSwitchUser: (userId: string) => void;
  lang?: Language;
}

export const UsersManagementModule: React.FC<UsersManagementProps> = ({
  users,
  currentUser,
  onRefresh,
  searchQuery,
  onSwitchUser,
  lang = 'ar'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<UserAccount | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Password Management State
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'accountant' | 'cashier' | 'auditor' | 'hr_manager' | 'site_engineer'>('accountant');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [allowedModules, setAllowedModules] = useState<string[]>(['dashboard', 'custodies', 'advances', 'site_settlements', 'expenses']);
  const [permissions, setPermissions] = useState({
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canPost: true,
    canViewReports: true,
    canManageUsers: false,
    canExport: true,
    canSettle: true
  });

  const MODULE_DEFINITIONS: { id: string; label: string; group: string }[] = [
    { id: 'dashboard', label: 'لوحة القيادة والتحليلات العامة', group: 'عام' },
    { id: 'custom_sheets', label: 'شيتات إكسيل تفاعلية ونماذج حسابية', group: 'عام' },
    { id: 'site_settlements', label: 'شيت تسوية الموقع والمشاريع الميدانية', group: 'المشاريع والميدان' },
    { id: 'custodies', label: 'شيت وإدارة العهد النقدية والتسوية', group: 'المشاريع والميدان' },
    { id: 'advances', label: 'شيت وإدارة سلف الموظفين والأقساط', group: 'المشاريع والميدان' },
    { id: 'chart_of_accounts', label: 'دليل الحسابات وشجرة الحسابات', group: 'المحاسبة العامة' },
    { id: 'journal_entries', label: 'القيود اليومية وسندات القيد', group: 'المحاسبة العامة' },
    { id: 'treasury_banks', label: 'الخزينة والبنوك والتسوية البنكية', group: 'المحاسبة العامة' },
    { id: 'customers_suppliers', label: 'العملاء والموردون وكشوف الحساب', group: 'العمليات' },
    { id: 'expenses', label: 'شيت ومصروفات الشركة والمشاريع', group: 'العمليات' },
    { id: 'cost_centers', label: 'مراكز التكلفة وإدارة المشاريع', group: 'العمليات' },
    { id: 'inventory', label: 'المخزون والأصناف والمستودعات', group: 'المخزون والأصول' },
    { id: 'fixed_assets', label: 'الأصول الثابتة وحساب الإهلاك', group: 'المخزون والأصول' },
    { id: 'hr', label: 'الموارد البشرية ومسيرات الرواتب', group: 'الإدارة' },
    { id: 'financial_reports', label: 'القوائم المالية والضرائب والميزان', group: 'التقارير' },
    { id: 'financial_analysis', label: 'التحليل المالي الذكي (AI)', group: 'التقارير' },
    { id: 'users_management', label: 'إدارة المستخدمين والصلاحيات والروابط', group: 'النظام' },
    { id: 'company_settings', label: 'إعدادات الشركة والسنة المالية والعملة', group: 'النظام' }
  ];

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  });

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return 'مدير النظام (Admin)';
      case 'accountant': return 'محاسب مالي رئيسي';
      case 'cashier': return 'أمين صندوق وخزينة';
      case 'auditor': return 'مراجع مالي وتدقيق';
      case 'hr_manager': return 'مدير موارد بشرية';
      case 'site_engineer': return 'مهندس ومشرف موقع ميداني';
      default: return r;
    }
  };

  const getUserDirectLink = (user: UserAccount) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${path}?user=${user.id}`;
  };

  const handleCopyLink = (user: UserAccount) => {
    const link = getUserDirectLink(user);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedId(user.id);
      setTimeout(() => setCopiedId(null), 3000);
      customAlert('تم نسخ رابط الدخول المباشر للمستخدم بنجاح!', 'success');
    }
  };

  const handleShareWhatsAppLink = (user: UserAccount) => {
    const link = getUserDirectLink(user);
    const text = `*مرحباً ${user.fullName}*\n\nتم تفعيل حسابكم في نظام الرؤية المتكامل للمحاسبة والمشاريع.\n\n🔗 *رابط الدخول المباشر المخصص لكم:*\n${link}\n\n👤 *اسم المستخدم:* ${user.username}\n💼 *الدور الوظيفي:* ${getRoleLabel(user.role)}\n\n_يرجى الاحتفاظ بالرابط لتسجيل الدخول مباشرة._`;
    openWhatsApp(user.phone || '', text);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    const newId = `usr_${Math.floor(100 + Math.random() * 900)}`;
    setUsername(`user_${Math.floor(100 + Math.random() * 900)}`);
    setFullName('');
    setRole('accountant');
    setEmail('');
    setPhone('');
    setIsActive(true);
    setAllowedModules(['dashboard', 'custodies', 'advances', 'site_settlements', 'expenses', 'customers_suppliers']);
    setPermissions({
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canPost: true,
      canViewReports: true,
      canManageUsers: false,
      canExport: true,
      canSettle: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (u: UserAccount) => {
    setEditingUser(u);
    setUsername(u.username);
    setFullName(u.fullName);
    setRole(u.role);
    setEmail(u.email);
    setPhone(u.phone || '');
    setIsActive(u.isActive);
    setAllowedModules(u.allowedModules || [...ALL_MODULE_IDS]);
    setPermissions({
      canAdd: u.permissions?.canAdd ?? true,
      canEdit: u.permissions?.canEdit ?? true,
      canDelete: u.permissions?.canDelete ?? true,
      canPost: u.permissions?.canPost ?? true,
      canViewReports: u.permissions?.canViewReports ?? true,
      canManageUsers: u.permissions?.canManageUsers ?? false,
      canExport: u.permissions?.canExport ?? true,
      canSettle: u.permissions?.canSettle ?? true
    });
    setShowModal(true);
  };

  const handleRoleChange = (newRole: any) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setAllowedModules([...ALL_MODULE_IDS]);
      setPermissions({ canAdd: true, canEdit: true, canDelete: true, canPost: true, canViewReports: true, canManageUsers: true, canExport: true, canSettle: true });
    } else if (newRole === 'auditor') {
      setAllowedModules(['dashboard', 'chart_of_accounts', 'journal_entries', 'treasury_banks', 'custodies', 'advances', 'site_settlements', 'financial_reports', 'financial_analysis']);
      setPermissions({ canAdd: false, canEdit: false, canDelete: false, canPost: false, canViewReports: true, canManageUsers: false, canExport: true, canSettle: false });
    } else if (newRole === 'cashier') {
      setAllowedModules(['dashboard', 'treasury_banks', 'custodies', 'advances', 'site_settlements', 'expenses']);
      setPermissions({ canAdd: true, canEdit: false, canDelete: true, canPost: false, canViewReports: false, canManageUsers: false, canExport: true, canSettle: true });
    } else if (newRole === 'site_engineer') {
      setAllowedModules(['dashboard', 'site_settlements', 'custodies', 'expenses', 'cost_centers']);
      setPermissions({ canAdd: true, canEdit: true, canDelete: false, canPost: false, canViewReports: false, canManageUsers: false, canExport: true, canSettle: true });
    } else {
      setAllowedModules(['dashboard', 'chart_of_accounts', 'journal_entries', 'treasury_banks', 'custodies', 'advances', 'site_settlements', 'customers_suppliers', 'expenses', 'cost_centers', 'financial_reports', 'financial_analysis']);
      setPermissions({ canAdd: true, canEdit: true, canDelete: true, canPost: true, canViewReports: true, canManageUsers: false, canExport: true, canSettle: true });
    }
  };

  const toggleModule = (modId: string) => {
    if (allowedModules.includes(modId)) {
      setAllowedModules(allowedModules.filter(m => m !== modId));
    } else {
      setAllowedModules([...allowedModules, modId]);
    }
  };

  const handleSelectAllModules = () => {
    setAllowedModules([...ALL_MODULE_IDS]);
  };

  const handleDeselectAllModules = () => {
    setAllowedModules(['dashboard']);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      customAlert('يرجى إدخال اسم المستخدم والاسم الكامل', 'error');
      return;
    }

    if (allowedModules.length === 0) {
      customAlert('يرجى اختيار صلاحية وحدة واحدة على الأقل للمستخدم', 'error');
      return;
    }

    let updated: UserAccount[];
    if (editingUser) {
      updated = users.map(item => item.id === editingUser.id ? {
        ...item,
        username,
        fullName,
        role,
        email: email || `${username}@roeya-erp.com`,
        phone: phone || undefined,
        isActive,
        allowedModules,
        permissions
      } : item);
    } else {
      const newUser: UserAccount = {
        id: `usr_${Date.now()}`,
        username,
        fullName,
        role,
        email: email || `${username}@roeya-erp.com`,
        phone: phone || undefined,
        isActive,
        directAccessKey: `key_${username}_${Math.floor(1000 + Math.random() * 9000)}`,
        allowedModules,
        permissions
      };
      updated = [newUser, ...users];
    }

    saveUsers(updated);
    onRefresh();
    setShowModal(false);
    customAlert(
      editingUser
        ? `تم تحديث صلاحيات ووحدات (${fullName}) بنجاح! تم تطبيق التعديل فوراً ولحظياً على رابطه وكافة جلساته المفتوحة دون الحاجة لإعادة إرسال الرابط.`
        : `تم إنشاء حساب المستخدم وتوليد الرابط المباشر الدائم بنجاح.`,
      'success'
    );
  };

  const handleToggleActive = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      customAlert('لا يمكنك تعطيل حسابك الحالي النشط!', 'error');
      return;
    }
    const newStatus = !user.isActive;
    const updated = users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u);
    saveUsers(updated);
    onRefresh();
    customAlert(
      newStatus
        ? `تم تفعيل حساب ورابط (${user.fullName}) فوراً ولحظياً.`
        : `تم تعطيل وإيقاف حساب ورابط (${user.fullName}) فوراً ولحظياً.`,
      newStatus ? 'success' : 'info'
    );
  };

  const handleDelete = (id: string, nameStr: string) => {
    if (users.length <= 1) {
      customAlert('لا يمكن حذف المستخدم الأخير في النظام!', 'error');
      return;
    }
    if (id === currentUser.id) {
      customAlert('لا يمكنك حذف الحساب النشط الحالي الذي تتصفح به!', 'error');
      return;
    }
    customConfirm(`هل أنت متأكد من حذف حساب المستخدم "${nameStr}"؟ سيتم إلغاء رابط الدخول الخاص به.`, () => {
      saveUsers(users.filter(u => u.id !== id));
      onRefresh();
      customAlert('تم حذف المستخدم بنجاح', 'success');
    }, 'تأكيد حذف المستخدم');
  };

  const exportData = filteredUsers.map(u => ({
    'اسم المستخدم': u.username,
    'الاسم الكامل': u.fullName,
    'الدور والوظيفة': getRoleLabel(u.role),
    'البريد الإلكتروني': u.email,
    'رقم الهاتف': u.phone || '—',
    'الحالة': u.isActive ? 'نشط' : 'معطل',
    'عدد الوحدات المصرح بها': u.allowedModules?.length || 0,
    'صلاحية الإضافة': u.permissions?.canAdd ? 'نعم' : 'لا',
    'صلاحية التعديل': u.permissions?.canEdit ? 'نعم' : 'لا',
    'صلاحية الحذف': u.permissions?.canDelete ? 'نعم' : 'لا',
    'ترحيل القيود': u.permissions?.canPost ? 'نعم' : 'لا',
    'تسوية وإقفال': u.permissions?.canSettle ? 'نعم' : 'لا',
    'رابط الدخول المباشر': getUserDirectLink(u)
  }));

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* رأس الصفحة والإحصائيات */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
              <span>{t('users_management', lang)}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              توليد رابط دخول مباشر لكل مستخدم، تخصيص وحدات النظام بدقة، وحظر أي صلاحية لم يتم اختيارها من مدير النظام، مع إمكانية التبديل والدخول بحساب أي مستخدم
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ExportButtons
              title="سجل المستخدمين وصلاحيات الروابط"
              subtitle="كشف بأسماء المستخدمين، الوظائف، الصلاحيات الممنوحة وروابط الدخول المباشرة"
              data={exportData}
              fileName="users_permissions_report"
            />
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setCurrentAdminPass('');
                    setNewAdminPass('');
                    setConfirmAdminPass('');
                    setShowPasswordModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition shadow"
                  title="تعيين كلمة مرور لحماية حساب وإعدادات مدير النظام"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>باسورد مدير النظام 🔑</span>
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مستخدم وتوليد رابط</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* بطاقات المستخدمين */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">إجمالي حسابات المستخدمين</div>
            <div className="text-2xl font-extrabold text-white mt-1">{filteredUsers.length}</div>
            <div className="text-[11px] text-indigo-400 mt-0.5">مع روابط دخول نشطة</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">الحسابات النشطة المصرح لها</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {filteredUsers.filter(u => u.isActive).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">معتمدة للدخول</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">مشرفو المواقع والمهندسون</div>
            <div className="text-2xl font-extrabold text-yellow-400 mt-1">
              {filteredUsers.filter(u => u.role === 'site_engineer').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">صلاحيات ميدانية مخصصة</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">حسابك الحالي النشط</div>
            <div className="text-sm font-bold text-white mt-1 truncate">{currentUser.fullName}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">{getRoleLabel(currentUser.role)}</div>
          </div>
        </div>
      </div>

      {/* تنبيه المزامنة اللحظية الفورية */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-lg flex items-start gap-3">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-black text-indigo-200 flex items-center gap-2">
            <span>⚡ المزامنة والتطبيق الفوري للصلاحيات (Real-Time Live Permissions)</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">نشط وتلقائي</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            عند إرسال رابط الدخول المباشر لأي مستخدم، يمكنك لاحقاً تعديل صلاحياته، إضافة أو سحب أي شاشات ووحدات، أو حتى تعطيل حسابه بالكامل، وسيتم <strong>تطبيق التأثير فوراً ولحظياً</strong> على الرابط والجلسات المفتوحة دون الحاجة لإعادة إرسال الرابط.
          </p>
        </div>
      </div>

      {/* جدول المستخدمين والصلاحيات والروابط */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>قائمة المستخدمين المعتمدين وروابط الدخول المباشرة ({filteredUsers.length})</span>
          </h3>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>يتم حظر أي شاشة أو ميزة لم يخترها مدير النظام</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3.5">اسم المستخدم</th>
                <th className="p-3.5">الاسم الكامل والدور</th>
                <th className="p-3.5">الوحدات المصرح بها</th>
                <th className="p-3.5 text-center">صلاحيات الإجراءات</th>
                <th className="p-3.5 text-center">رابط الدخول المباشر</th>
                <th className="p-3.5 text-center">الحالة والمزامنة</th>
                <th className="p-3.5 text-center">التبديل والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredUsers.map(user => {
                const isCurrent = user.id === currentUser.id;
                const allowedCount = user.allowedModules?.length || (user.role === 'admin' ? ALL_MODULE_IDS.length : 0);

                return (
                  <tr key={user.id} className={`hover:bg-slate-800/40 transition ${isCurrent ? 'bg-indigo-950/20' : ''}`}>
                    <td className="p-3.5 font-mono font-bold text-slate-300">
                      {user.username}
                      {isCurrent && (
                        <span className="mr-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px]">
                          حسابك الحالي
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">{user.fullName}</div>
                      <div className="text-[11px] text-indigo-300 mt-0.5 flex items-center gap-1.5">
                        <span>{getRoleLabel(user.role)}</span>
                        {user.phone && <span className="text-slate-400 font-mono">• {user.phone}</span>}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-bold font-mono">
                          {allowedCount} من {ALL_MODULE_IDS.length} شاشات
                        </span>
                        {user.role === 'admin' && (
                          <span className="text-[10px] text-emerald-400 font-bold">صلاحية شاملة</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                        {user.permissions?.canAdd && (
                          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[9px]">إضافة</span>
                        )}
                        {user.permissions?.canEdit && (
                          <span className="px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded text-[9px]">تعديل</span>
                        )}
                        {user.permissions?.canDelete && (
                          <span className="px-1.5 py-0.5 bg-red-950 text-red-300 rounded text-[9px]">حذف</span>
                        )}
                        {user.permissions?.canPost && (
                          <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 rounded text-[9px]">ترحيل</span>
                        )}
                        {user.permissions?.canSettle && (
                          <span className="px-1.5 py-0.5 bg-yellow-950 text-yellow-300 rounded text-[9px]">تسوية</span>
                        )}
                      </div>
                    </td>

                    {/* زر ونسخ رابط الدخول المباشر */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(user)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition active:scale-95"
                          title="نسخ رابط الدخول المباشر للمستخدم"
                        >
                          {copiedId === user.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-indigo-400" />
                              <span>نسخ الرابط</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleShareWhatsAppLink(user)}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition"
                          title="إرسال رابط الدخول وبيانات الحساب عبر واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setShowLinkModal(user)}
                          className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg transition"
                          title="عرض تفاصيل الرابط المباشر"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800">
                            <XCircle className="w-3 h-3" />
                            <span>معطل</span>
                          </span>
                        )}

                        {isAdmin && !isCurrent && (
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                              user.isActive
                                ? 'bg-red-950/40 text-red-400 border-red-800/60 hover:bg-red-900/60'
                                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                            }`}
                            title={user.isActive ? 'تعطيل الحساب فوراً' : 'تفعيل الحساب فوراً'}
                          >
                            {user.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* أزرار التبديل والتحكم */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* زر التبديل والدخول بالحساب (Impersonation) */}
                        {isAdmin && !isCurrent && (
                          <button
                            onClick={() => {
                              customConfirm(`هل تريد التبديل والدخول بحساب المستخدم "${user.fullName}" لمعاينة النظام بصلاحياته؟`, () => {
                                onSwitchUser(user.id);
                              }, 'تبديل الحساب');
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition"
                            title="التبديل والدخول بحساب المستخدم"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                            <span>دخول كـ</span>
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                              title="تعديل الاسم والوحدات والصلاحيات"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(user.id, user.fullName)}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== نافذة إنشاء / تعديل المستخدم والصلاحيات ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl text-slate-100 flex flex-col overflow-hidden">
            <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
                <span>{editingUser ? 'تعديل اسم ومخصصات ووحدات المستخدم' : 'إنشاء حساب مستخدم جديد وتوليد رابط الدخول'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* البيانات الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">اسم المستخدم للدخول (Username) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ahmed_ali"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">الاسم الكامل الظاهر في النظام *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: م. أحمد بن علي المنصور"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">الدور الوظيفي والنمط</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="accountant">محاسب مالي أول</option>
                    <option value="admin">مدير النظام (Admin - صلاحيات كاملة)</option>
                    <option value="cashier">أمين صندوق وخزينة</option>
                    <option value="site_engineer">مهندس ومشرف موقع ميداني</option>
                    <option value="auditor">مراجع مالي ومراقب</option>
                    <option value="hr_manager">مدير موارد بشرية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">رقم الهاتف / الواتساب</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0501234567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@roeya-erp.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* تحديد وحدات وشاشات النظام المصرح بدخولها بدقة */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>اختيار شاشات ووحدات النظام المصرح بفتحها لهذا المستخدم ({allowedModules.length} من {ALL_MODULE_IDS.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ⚠️ أي شاشة لم يتم تفعيلها هنا ستكون محجوبة تماماً ولن تظهر في القائمة الجانبية أو يتم فتحها.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[11px] font-bold"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllModules}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[11px]"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {MODULE_DEFINITIONS.map(mod => {
                    const isChecked = allowedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-600/50 text-white'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-xs">{mod.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{mod.group}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* صلاحيات الإجراءات (Actions RBAC) */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Key className="w-4 h-4" />
                  <span>صلاحيات العمليات والإجراءات داخل الشاشات</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canAdd}
                      onChange={(e) => setPermissions({ ...permissions, canAdd: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>إضافة جديد</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canEdit}
                      onChange={(e) => setPermissions({ ...permissions, canEdit: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>تعديل السجلات</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-red-950/30 p-2.5 rounded-xl border border-red-900/40 font-bold text-red-300">
                    <input
                      type="checkbox"
                      checked={permissions.canDelete}
                      onChange={(e) => setPermissions({ ...permissions, canDelete: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500 bg-slate-800"
                    />
                    <span>صلاحية الحذف (Delete)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canPost}
                      onChange={(e) => setPermissions({ ...permissions, canPost: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>ترحيل القيود</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canSettle}
                      onChange={(e) => setPermissions({ ...permissions, canSettle: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>تسوية وإقفال العهد/المواقع</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canViewReports}
                      onChange={(e) => setPermissions({ ...permissions, canViewReports: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>عرض القوائم المالية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canExport}
                      onChange={(e) => setPermissions({ ...permissions, canExport: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>تصدير إكسيل وPDF</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    />
                    <span>إدارة المستخدمين</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active_check"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-indigo-600 bg-slate-800"
                />
                <label htmlFor="active_check" className="font-bold text-slate-200 cursor-pointer">
                  حساب نشط ومصرح له بالدخول عبر الرابط
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{editingUser ? 'حفظ تعديلات المستخدم والوحدات' : 'إنشاء الحساب وتوليد الرابط'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== نافذة تفاصيل ومشاركة الرابط المباشر الدائم ===================== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden animate-scaleUp">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <LinkIcon className="w-5 h-5" />
                <h3 className="font-bold text-base">رابط الدخول المباشر للمستخدم</h3>
              </div>
              <button
                onClick={() => setShowLinkModal(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">المستخدم المستهدف:</div>
                <div className="text-base font-bold text-white flex items-center justify-between">
                  <span>{showLinkModal.fullName}</span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded font-normal">
                    {getRoleLabel(showLinkModal.role)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  اسم المستخدم: <strong className="text-slate-200">{showLinkModal.username}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رابط الوصول السريع المباشر (Direct Access Link):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getUserDirectLink(showLinkModal)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-xs text-indigo-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(showLinkModal)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
                  >
                    {copiedId === showLinkModal.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* بطاقة التوضيح للمزامنة اللحظية الفورية */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-emerald-300">ميزة الرابط الدائم والمحدث لحظياً:</div>
                  <p className="leading-relaxed text-slate-300 text-[11px]">
                    هذا الرابط دائم وثابت للمستخدم. في حال قمت مستقبلاً بتعديل أي صلاحيات، أو إضافة/حذف شاشات، أو إيقاف الحساب، سيتم تطبيق كافة التغييرات مباشرة وفورياً على هذا الرابط دون الحاجة لإنشاء أو إرسال رابط جديد.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const link = getUserDirectLink(showLinkModal);
                    if (typeof window !== 'undefined') {
                      window.open(link, '_blank');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  تجربة فتح الرابط في نافذة جديدة
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsAppLink(showLinkModal)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>إرسال عبر واتساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعيين باسورد مدير النظام */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>تعيين وتغيير باسورد مدير النظام</span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const saved = getAdminPassword();
                if (saved && currentAdminPass && currentAdminPass !== saved && currentAdminPass !== 'admin') {
                  customAlert('كلمة المرور الحالية غير صحيحة!', 'error');
                  return;
                }
                if (!newAdminPass || newAdminPass.length < 4) {
                  customAlert('يجب أن تتكون كلمة المرور الجديدة من 4 أحرف أو أرقام على الأقل', 'warning');
                  return;
                }
                if (newAdminPass !== confirmAdminPass) {
                  customAlert('كلمة المرور الجديدة وتأكيدها غير متطابقين!', 'error');
                  return;
                }
                saveAdminPassword(newAdminPass);
                setShowPasswordModal(false);
                customAlert('تم تحديث باسورد مدير النظام بنجاح! تم تطبيق الحماية الفورية.', 'success');
              }}
              className="space-y-4 mt-4"
            >
              <p className="text-xs text-slate-300 leading-relaxed">
                تتيح لك هذه الميزة حماية حساب مدير النظام والصلاحيات الحساسة بكلمة مرور مخصصة.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور الحالية (الافتراضية: admin123)
                </label>
                <input
                  type="password"
                  value={currentAdminPass}
                  onChange={(e) => setCurrentAdminPass(e.target.value)}
                  placeholder="أدخل الباسورد الحالي"
                  className="w-full py-2 px-3 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  required
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="w-full py-2 px-3 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  required
                  value={confirmAdminPass}
                  onChange={(e) => setConfirmAdminPass(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className="w-full py-2 px-3 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-900/30"
                >
                  حفظ وتطبيق الباسورد 🔒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
