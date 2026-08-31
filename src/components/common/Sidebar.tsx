import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Wallet,
  Users,
  Briefcase,
  Layers,
  Receipt,
  Package,
  Building2,
  UserCheck,
  BarChart3,
  TrendingUp,
  Settings,
  HelpCircle,
  FolderTree,
  Scale,
  ShieldCheck,
  HardHat,
  CreditCard,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { UserAccount } from '../../types';
import { ALL_MODULE_IDS } from '../../utils/storage';
import { Language, t } from '../../utils/i18n';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (module: string) => void;
  currentUser: UserAccount;
  lang?: Language;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  icon: React.ReactNode;
  badge?: string;
  groupKey: string;
  fallbackGroup: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  currentUser,
  lang = 'ar'
}) => {
  const isUserAdmin = currentUser.role === 'admin';
  const allowedList = currentUser.allowedModules || (isUserAdmin ? ALL_MODULE_IDS : ['dashboard']);

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      fallbackLabel: 'لوحة القيادة والتحليل',
      icon: <LayoutDashboard className="w-5 h-5" />,
      groupKey: 'general_group',
      fallbackGroup: 'الرئيسية'
    },
    {
      id: 'custom_sheets',
      labelKey: 'custom_sheets',
      fallbackLabel: 'شيتات إكسيل تفاعلية ونماذج',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
      badge: 'Excel',
      groupKey: 'general_group',
      fallbackGroup: 'الرئيسية'
    },
    
    // شيتات المشاريع والميدان (تسوية الموقع، العهد، السلف)
    {
      id: 'site_settlements',
      labelKey: 'site_settlements',
      fallbackLabel: 'تسوية الموقع والمشاريع',
      icon: <HardHat className="w-5 h-5 text-yellow-400" />,
      badge: 'جديد',
      groupKey: 'field_projects_group',
      fallbackGroup: 'المشاريع والميدان'
    },
    {
      id: 'custodies',
      labelKey: 'custodies',
      fallbackLabel: 'شيت العهد والتسوية',
      icon: <Briefcase className="w-5 h-5 text-blue-400" />,
      badge: 'مستقل',
      groupKey: 'field_projects_group',
      fallbackGroup: 'المشاريع والميدان'
    },
    {
      id: 'advances',
      labelKey: 'advances',
      fallbackLabel: 'سلف الموظفين والأقساط',
      icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
      badge: 'أقساط',
      groupKey: 'field_projects_group',
      fallbackGroup: 'المشاريع والميدان'
    },

    // الأستاذ العام والقيود
    {
      id: 'chart_of_accounts',
      labelKey: 'chart_of_accounts',
      fallbackLabel: 'دليل الحسابات وشجرة الحسابات',
      icon: <FolderTree className="w-5 h-5" />,
      groupKey: 'accounting_group',
      fallbackGroup: 'الأستاذ العام والمحاسبة'
    },
    {
      id: 'journal_entries',
      labelKey: 'journal_entries',
      fallbackLabel: 'القيود اليومية والترحيل',
      icon: <FileText className="w-5 h-5" />,
      badge: 'فوري',
      groupKey: 'accounting_group',
      fallbackGroup: 'الأستاذ العام والمحاسبة'
    },
    {
      id: 'treasury_banks',
      labelKey: 'treasury_banks',
      fallbackLabel: 'الخزينة والبنوك والتسوية',
      icon: <Wallet className="w-5 h-5" />,
      groupKey: 'accounting_group',
      fallbackGroup: 'الأستاذ العام والمحاسبة'
    },
    
    // التعاملات والمصروفات
    {
      id: 'customers_suppliers',
      labelKey: 'customers_suppliers',
      fallbackLabel: 'العملاء والموردون وكشوف الحساب',
      icon: <Users className="w-5 h-5" />,
      groupKey: 'operations_group',
      fallbackGroup: 'التعاملات والمصروفات'
    },
    {
      id: 'expenses',
      labelKey: 'expenses',
      fallbackLabel: 'شيت تفصيلي لكل المصروفات',
      icon: <Receipt className="w-5 h-5" />,
      groupKey: 'operations_group',
      fallbackGroup: 'التعاملات والمصروفات'
    },
    {
      id: 'cost_centers',
      labelKey: 'cost_centers',
      fallbackLabel: 'مراكز التكلفة وإدارة المشاريع',
      icon: <Layers className="w-5 h-5" />,
      groupKey: 'operations_group',
      fallbackGroup: 'التعاملات والمصروفات'
    },
    
    // الأصول والمخزون
    {
      id: 'inventory',
      labelKey: 'inventory',
      fallbackLabel: 'المخزون والأصناف وتفاصيلها',
      icon: <Package className="w-5 h-5" />,
      groupKey: 'assets_inventory_group',
      fallbackGroup: 'الأصول والمخزون'
    },
    {
      id: 'fixed_assets',
      labelKey: 'fixed_assets',
      fallbackLabel: 'الأصول الثابتة وحساب الإهلاك',
      icon: <Building2 className="w-5 h-5" />,
      groupKey: 'assets_inventory_group',
      fallbackGroup: 'الأصول والمخزون'
    },
    
    // الموارد البشرية
    {
      id: 'hr',
      labelKey: 'hr',
      fallbackLabel: 'الموارد البشرية والرواتب',
      icon: <UserCheck className="w-5 h-5" />,
      groupKey: 'hr_group',
      fallbackGroup: 'الموارد البشرية'
    },
    
    // التقارير والتحليل
    {
      id: 'financial_reports',
      labelKey: 'financial_reports',
      fallbackLabel: 'القوائم المالية والضرائب والميزان',
      icon: <Scale className="w-5 h-5" />,
      badge: 'شامل',
      groupKey: 'reports_group',
      fallbackGroup: 'التقارير والتحليل'
    },
    {
      id: 'financial_analysis',
      labelKey: 'financial_analysis',
      fallbackLabel: 'التحليل المالي الذكي (AI)',
      icon: <TrendingUp className="w-5 h-5" />,
      badge: 'ذكي',
      groupKey: 'reports_group',
      fallbackGroup: 'التقارير والتحليل'
    },
    
    // إدارة النظام
    {
      id: 'users_management',
      labelKey: 'users_management',
      fallbackLabel: 'إدارة المستخدمين والصلاحيات والروابط',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      groupKey: 'system_group',
      fallbackGroup: 'إدارة النظام'
    },
    {
      id: 'company_settings',
      labelKey: 'company_settings',
      fallbackLabel: 'إعدادات الشركة والعملة والسنة',
      icon: <Settings className="w-5 h-5" />,
      groupKey: 'system_group',
      fallbackGroup: 'إدارة النظام'
    },
  ];

  // تصفية الوحدات حسب مصفوفة allowedModules الخاصة بالمستخدم الحالي
  const visibleNavItems = allNavItems.filter(item => {
    if (isUserAdmin) return true;
    return allowedList.includes(item.id);
  });

  const groups = Array.from(new Set(visibleNavItems.map(item => item.fallbackGroup)));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-l border-slate-800 shadow-xl min-h-[calc(100vh-4rem)] select-none">
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {groups.map(group => (
          <div key={group} className="space-y-1">
            <h3 className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase px-3 mb-2">
              {group}
            </h3>
            <div className="space-y-1">
              {visibleNavItems
                .filter(item => item.fallbackGroup === group)
                .map(item => {
                  const isActive = activeModule === item.id;
                  const itemLabel = t(item.labelKey as any, lang) || item.fallbackLabel;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectModule(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className={`transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{itemLabel}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-blue-800 text-blue-100'
                              : item.badge === 'جديد'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : item.badge === 'ذكي'
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            🛡️
          </div>
          <div className="text-xs truncate">
            <div className="font-bold text-slate-200 truncate">{currentUser.fullName}</div>
            <div className="text-[10px] text-emerald-400 font-mono">
              {isUserAdmin ? 'مدير عام كامل الصلاحيات' : `${visibleNavItems.length} شاشات مصرح بها`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
