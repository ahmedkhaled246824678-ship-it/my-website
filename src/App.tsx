import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Dashboard } from './components/modules/Dashboard';
import { ChartOfAccounts } from './components/modules/ChartOfAccounts';
import { JournalEntries } from './components/modules/JournalEntries';
import { TreasuryAndBanks } from './components/modules/TreasuryAndBanks';
import { CustodyModule } from './components/modules/CustodyModule';
import { AdvancesModule } from './components/modules/AdvancesModule';
import { SiteSettlementsModule } from './components/modules/SiteSettlementsModule';
import { CustomersAndSuppliers } from './components/modules/CustomersAndSuppliers';
import { ExpensesSheet } from './components/modules/ExpensesSheet';
import { CostCentersProjects } from './components/modules/CostCentersProjects';
import { InventoryAssets } from './components/modules/InventoryAssets';
import { FixedAssetsModule } from './components/modules/FixedAssetsModule';
import { HRModule } from './components/modules/HRModule';
import { FinancialReportsModule } from './components/modules/FinancialReportsModule';
import { FinancialAnalysisAIModule } from './components/modules/FinancialAnalysisAIModule';
import { UsersManagementModule } from './components/modules/UsersManagementModule';
import { CompanySettingsModule } from './components/modules/CompanySettingsModule';
import { CustomSheetsModule } from './components/modules/CustomSheetsModule';
import { CustomDialogs } from './components/common/CustomDialogs';
import { customAlert } from './utils/dialog';
import { Language, t } from './utils/i18n';
import { Lock, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { syncWithServer, findUserOnServer } from './utils/apiSync';

import {
  Account, JournalEntry, TreasuryTransaction, BankAccount, BankTransaction, BankReconciliation, CustomerSupplier,
  Custody, EmployeeAdvance, SiteSettlement, CostCenter, ExpenseItem, InventoryItem, StockMovement, FixedAsset,
  Employee, UserAccount, CompanySettings, GlobalFilterState, CustomSheet, AccrualAdjustment
} from './types';

import {
  getAccounts, saveAccounts,
  getJournalEntries, saveJournalEntries,
  getTreasuryTxs,
  getBanks, getBankTxs, getBankRecons,
  getCustomersSuppliers,
  getCustodies,
  getAdvances,
  getSiteSettlements,
  getCostCenters,
  getExpenses,
  getInventory,
  getStockMovements,
  getFixedAssets,
  getEmployees,
  getUsers, saveUsers,
  getCompanySettings, saveCompanySettings,
  getCustomSheets,
  getAccrualAdjustments, saveAccrualAdjustments,
  verifyAdminPassword,
  ALL_MODULE_IDS
} from './utils/storage';

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('roeya_erp_lang') as Language) || 'ar';
  });

  // Global Filter State
  const [filterState, setFilterState] = useState<GlobalFilterState>({
    searchQuery: '',
    fiscalYear: '2026',
    startDate: '',
    endDate: ''
  });

  // Application Data State
  const [accounts, setAccountsState] = useState<Account[]>([]);
  const [journalEntries, setJournalEntriesState] = useState<JournalEntry[]>([]);
  const [treasuryTxs, setTreasuryTxsState] = useState<TreasuryTransaction[]>([]);
  const [banks, setBanksState] = useState<BankAccount[]>([]);
  const [bankTxs, setBankTxsState] = useState<BankTransaction[]>([]);
  const [bankRecons, setBankReconsState] = useState<BankReconciliation[]>([]);
  const [customersSuppliers, setCustomersSuppliersState] = useState<CustomerSupplier[]>([]);
  const [custodies, setCustodiesState] = useState<Custody[]>([]);
  const [advances, setAdvancesState] = useState<EmployeeAdvance[]>([]);
  const [siteSettlements, setSiteSettlementsState] = useState<SiteSettlement[]>([]);
  const [costCenters, setCostCentersState] = useState<CostCenter[]>([]);
  const [expenses, setExpensesState] = useState<ExpenseItem[]>([]);
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovementsState] = useState<StockMovement[]>([]);
  const [fixedAssets, setFixedAssetsState] = useState<FixedAsset[]>([]);
  const [employees, setEmployeesState] = useState<Employee[]>([]);
  const [users, setUsersState] = useState<UserAccount[]>([]);
  const [customSheets, setCustomSheetsState] = useState<CustomSheet[]>([]);
  const [accrualAdjustments, setAccrualAdjustmentsState] = useState<AccrualAdjustment[]>([]);
  const [companySettings, setCompanySettingsState] = useState<CompanySettings>(() => getCompanySettings());

  // Active User & Impersonation Handling
  const [currentUserId, setCurrentUserId] = useState<string>('usr_1');
  const [originalAdminId, setOriginalAdminId] = useState<string | null>(null);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [pendingAdminTargetUserId, setPendingAdminTargetUserId] = useState<string | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Load all data from storage
  const refreshData = () => {
    setAccountsState(getAccounts() || []);
    setJournalEntriesState(getJournalEntries() || []);
    setTreasuryTxsState(getTreasuryTxs() || []);
    setBanksState(getBanks() || []);
    setBankTxsState(getBankTxs() || []);
    setBankReconsState(getBankRecons() || []);
    setCustomersSuppliersState(getCustomersSuppliers() || []);
    setCustodiesState(getCustodies() || []);
    setAdvancesState(getAdvances() || []);
    setSiteSettlementsState(getSiteSettlements() || []);
    setCostCentersState(getCostCenters() || []);
    setExpensesState(getExpenses() || []);
    setInventoryState(getInventory() || []);
    setStockMovementsState(getStockMovements() || []);
    setFixedAssetsState(getFixedAssets() || []);
    setEmployeesState(getEmployees() || []);
    setCustomSheetsState(getCustomSheets() || []);
    setAccrualAdjustmentsState(getAccrualAdjustments() || []);
    const loadedUsers = getUsers() || [];
    setUsersState(loadedUsers);

    // التحقق من وجود رابط دخول مستخدم مباشر في الـ URL أو الجلسة
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      if (userParam) {
        const found = loadedUsers.find(u => u.id === userParam || u.username === userParam || u.directAccessKey === userParam);
        if (found) {
          setCurrentUserId(found.id);
          try {
            sessionStorage.setItem('roeya_erp_session_user_id', found.id);
          } catch (e) {}
        }
      } else {
        const sessionUserId = sessionStorage.getItem('roeya_erp_session_user_id');
        if (sessionUserId && loadedUsers.some(u => u.id === sessionUserId)) {
          setCurrentUserId(sessionUserId);
        }
      }
    }

    setCompanySettingsState(getCompanySettings());
  };

  // إعداد المزامنة اللحظية الحية عبر الخادم والنوافذ (Server Sync & Real-Time Sync)
  useEffect(() => {
    refreshData();
    window.alert = (msg?: any) => {
      customAlert(String(msg || ''), 'success');
    };

    // مزامنة فورية مع الخادم عند بدء التطبيق
    syncWithServer(true).then((hasUpdates) => {
      if (hasUpdates) {
        refreshData();
      }
      // إذا كان هناك معامل user في الرابط ولم يكن موجوداً محلياً، نجلب من الخادم
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get('user');
        if (userParam) {
          findUserOnServer(userParam).then((user) => {
            if (user) {
              const currentList = getUsers();
              const exists = currentList.find(u => u.id === user.id);
              if (!exists) {
                saveUsers([user, ...currentList]);
              }
              setCurrentUserId(user.id);
              refreshData();
            }
          });
        }
      }
    });

    // دورية مزامنة سريعة كل 1500ms لجلب أي تعديل من الخادم لحظياً
    const syncInterval = setInterval(async () => {
      const hasUpdates = await syncWithServer();
      if (hasUpdates) {
        refreshData();
      }
    }, 1500);

    // 1. الاستماع لأحداث النافذة الحالية
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      refreshData();
      if (customEvent.detail?.type === 'USERS_UPDATED') {
        const updatedUsers: UserAccount[] = customEvent.detail.payload || getUsers();
        const updatedMe = updatedUsers.find(u => u.id === currentUserId);
        if (updatedMe) {
          if (!updatedMe.isActive) {
            customAlert('تنبيه: تم تعطيل صلاحية الوصول لهذا الحساب من قبل إدارة النظام.', 'error');
          } else if (updatedMe.role !== 'admin' && updatedMe.allowedModules && !updatedMe.allowedModules.includes(activeModule)) {
            setActiveModule('dashboard');
            customAlert('تم تحديث صلاحياتك وتطبيق التعديلات مباشرة من إدارة النظام.', 'info');
          }
        }
      }
    };

    // 2. الاستماع لتغييرات localStorage عبر التبويبات الأخرى
    const handleStorageEvent = (e: StorageEvent) => {
      refreshData();
    };

    // 3. الاستماع لقناة البث BroadcastChannel للتحديث اللحظي الفوري
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('roeya_erp_sync_channel');
        broadcastChannel.onmessage = (event) => {
          refreshData();
          if (event.data?.type === 'USERS_UPDATED') {
            const updatedUsers: UserAccount[] = event.data.payload || getUsers();
            const updatedMe = updatedUsers.find(u => u.id === currentUserId);
            if (updatedMe) {
              if (!updatedMe.isActive) {
                customAlert('تنبيه: تم تعطيل صلاحية الدخول لهذا الحساب من قبل إدارة النظام.', 'error');
              } else if (updatedMe.role !== 'admin' && updatedMe.allowedModules && !updatedMe.allowedModules.includes(activeModule)) {
                setActiveModule('dashboard');
                customAlert('تم تحديث صلاحيات حسابك من قبل مدير النظام وتطبيقها مباشرة.', 'info');
              }
            }
          }
        };
      } catch (err) {
        console.error('BroadcastChannel initialization error:', err);
      }
    }

    // 4. الاستماع لتغيرات الـ URL
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      if (userParam) {
        const loadedUsers = getUsers();
        const found = loadedUsers.find(u => u.id === userParam || u.username === userParam || u.directAccessKey === userParam);
        if (found) {
          setCurrentUserId(found.id);
        } else {
          findUserOnServer(userParam).then((user) => {
            if (user) {
              setCurrentUserId(user.id);
              refreshData();
            }
          });
        }
      }
    };

    window.addEventListener('roeya_erp_sync', handleSyncEvent);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('roeya_erp_sync', handleSyncEvent);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('popstate', handlePopState);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [currentUserId, activeModule]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('roeya_erp_lang', newLang);
  };

  const handleFilterChange = (newFilter: Partial<GlobalFilterState>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  };

  // تبديل المستخدم من قبل مدير النظام (Impersonate User)
  const executeUserSwitch = (targetUserId: string) => {
    const activeAdmin = users.find(u => u.id === currentUserId && u.role === 'admin');
    if (activeAdmin && !originalAdminId) {
      setOriginalAdminId(activeAdmin.id);
    }
    setCurrentUserId(targetUserId);
    try {
      sessionStorage.setItem('roeya_erp_session_user_id', targetUserId);
    } catch (e) {}
    const target = users.find(u => u.id === targetUserId);
    if (target) {
      const isAllowed = target.role === 'admin' || (target.allowedModules && target.allowedModules.includes(activeModule));
      if (!isAllowed) {
        setActiveModule('dashboard');
      }
      customAlert(`تم التبديل بنجاح وتسجيل الدخول بحساب (${target.fullName})`, 'success');
    }
  };

  const handleSwitchUser = (targetUserId: string) => {
    const target = users.find(u => u.id === targetUserId);
    const isCurrentAdmin = users.find(u => u.id === currentUserId)?.role === 'admin';

    // إذا كان الحساب المستهدف مدير نظام والمستخدم الحالي ليس مديراً، نطلب كلمة المرور
    if (target && target.role === 'admin' && !isCurrentAdmin) {
      setPendingAdminTargetUserId(targetUserId);
      setAdminPasswordInput('');
      setAdminAuthError(false);
      setShowAdminAuthModal(true);
      return;
    }

    executeUserSwitch(targetUserId);
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(adminPasswordInput)) {
      setShowAdminAuthModal(false);
      if (pendingAdminTargetUserId) {
        executeUserSwitch(pendingAdminTargetUserId);
        setPendingAdminTargetUserId(null);
      }
      setAdminPasswordInput('');
      setAdminAuthError(false);
    } else {
      setAdminAuthError(true);
    }
  };

  // العودة لحساب المدير الأصلي
  const handleRevertImpersonation = () => {
    if (originalAdminId) {
      setCurrentUserId(originalAdminId);
      setOriginalAdminId(null);
      customAlert('تم العودة لحساب مدير النظام الرئيسي بنجاح', 'success');
    }
  };

  const currentUser: UserAccount = users.find(u => u.id === currentUserId) || (users.length > 0 ? users[0] : {
    id: 'usr_1',
    username: 'ahmed_ali',
    fullName: 'أحمد بن علي المنصور',
    role: 'admin',
    email: 'ahmed@roeya-erp.com',
    isActive: true,
    allowedModules: [...ALL_MODULE_IDS],
    permissions: { canAdd: true, canEdit: true, canDelete: true, canPost: true, canViewReports: true, canManageUsers: true, canExport: true, canSettle: true }
  });

  const originalAdminUser: UserAccount | null = originalAdminId ? (users.find(u => u.id === originalAdminId) || null) : null;

  // فحص صلاحية الدخول للوحدة المحددة (Strict Module Access Enforcement)
  const isModuleAllowed = currentUser.role === 'admin' || (currentUser.allowedModules ? currentUser.allowedModules.includes(activeModule) : true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans dir-rtl" dir={lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* شريط الملاحة والأدوات العلوية */}
      <Navbar
        settings={companySettings}
        currentUser={currentUser}
        originalAdminUser={originalAdminUser}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onRefreshData={refreshData}
        activeModule={activeModule}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onRevertImpersonation={originalAdminId ? handleRevertImpersonation : undefined}
        onSettingsChange={(newSet) => {
          saveCompanySettings(newSet);
          refreshData();
        }}
        banks={banks}
        customersSuppliers={customersSuppliers}
        custodies={custodies}
        advances={advances}
        siteSettlements={siteSettlements}
        inventory={inventory}
        adjustments={accrualAdjustments}
        onNavigate={setActiveModule}
      />

      <div className="flex flex-1">
        {/* القائمة الجانبية المحدثة */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentUser={currentUser}
          lang={lang}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* منطقة عرض الوحدات المحاسبية */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[calc(100vw-16rem)] w-full">
          {!currentUser.isActive ? (
            <div className="bg-slate-900 border border-amber-800/50 rounded-2xl p-12 text-center max-w-xl mx-auto my-12 shadow-2xl">
              <div className="w-16 h-16 bg-amber-950/80 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-700">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تم تعطيل صلاحية الدخول لهذا الحساب</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                تم إيقاف صلاحية الدخول لحساب ({currentUser.fullName}) عبر هذا الرابط من قِبل إدارة النظام. يرجى التواصل مع المسؤول لإعادة تفعيل الحساب والصلاحيات.
              </p>
              {originalAdminId && (
                <button
                  onClick={handleRevertImpersonation}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition"
                >
                  العودة لحساب مدير النظام الرئيسي
                </button>
              )}
            </div>
          ) : !isModuleAllowed ? (
            <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-12 text-center max-w-xl mx-auto my-12 shadow-2xl">
              <div className="w-16 h-16 bg-red-950/80 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-800">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">عذراً، هذه الشاشة محجوبة عن حسابك</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                لم يتم منحك صلاحية الوصول إلى هذه الوحدة من قِبل مدير النظام ({currentUser.role === 'admin' ? 'الإدارة' : 'المسؤول'}).
              </p>
              <button
                onClick={() => setActiveModule('dashboard')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition"
              >
                العودة للوحة القيادة
              </button>
            </div>
          ) : (
            <>
              {activeModule === 'dashboard' && (
                <Dashboard
                  accounts={accounts}
                  onSaveAccounts={(updated) => {
                    saveAccounts(updated);
                    refreshData();
                  }}
                  entries={journalEntries}
                  onSaveJournalEntries={(updated) => {
                    saveJournalEntries(updated);
                    refreshData();
                  }}
                  costCenters={costCenters}
                  expenses={expenses}
                  banks={banks}
                  customersSuppliers={customersSuppliers}
                  custodies={custodies}
                  advances={advances}
                  siteSettlements={siteSettlements}
                  bankReconciliations={bankRecons}
                  inventory={inventory}
                  adjustments={accrualAdjustments}
                  onSaveAdjustments={(updated) => {
                    saveAccrualAdjustments(updated);
                    refreshData();
                  }}
                  settings={companySettings}
                  onSaveSettings={(newSet) => {
                    saveCompanySettings(newSet);
                    refreshData();
                  }}
                  onNavigate={setActiveModule}
                  lang={lang}
                  customSheets={customSheets}
                  employees={employees}
                  users={users}
                />
              )}

              {/* شيتات إكسيل التفاعلية والنماذج الحسابية */}
              {activeModule === 'custom_sheets' && (
                <CustomSheetsModule
                  sheets={customSheets}
                  onRefresh={refreshData}
                  accounts={accounts}
                  costCenters={costCenters}
                  customersSuppliers={customersSuppliers}
                  employees={employees}
                  banks={banks}
                  settings={companySettings}
                  users={users}
                  lang={lang}
                />
              )}

              {/* شيت تسوية المواقع والمشاريع الميدانية */}
              {activeModule === 'site_settlements' && (
                <SiteSettlementsModule
                  settlements={siteSettlements}
                  costCenters={costCenters}
                  employees={employees}
                  settings={companySettings}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {/* شيت وإدارة العهد المالية والتسوية */}
              {activeModule === 'custodies' && (
                <CustodyModule
                  custodies={custodies}
                  employees={employees}
                  costCenters={costCenters}
                  settings={companySettings}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {/* شيت وإدارة سلف الموظفين والأقساط */}
              {activeModule === 'advances' && (
                <AdvancesModule
                  advances={advances}
                  employees={employees}
                  settings={companySettings}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'chart_of_accounts' && (
                <ChartOfAccounts
                  accounts={accounts}
                  journalEntries={journalEntries}
                  costCenters={costCenters}
                  companySettings={companySettings}
                  currentUser={currentUser}
                  onAccountsChange={(updated) => {
                    saveAccounts(updated);
                    refreshData();
                  }}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'journal_entries' && (
                <JournalEntries
                  entries={journalEntries}
                  accounts={accounts}
                  costCenters={costCenters}
                  currentUser={currentUser}
                  onEntriesChange={(updated) => {
                    saveJournalEntries(updated);
                    refreshData();
                  }}
                  onRefreshBalances={refreshData}
                  searchQuery={filterState.searchQuery}
                  fiscalYear={filterState.fiscalYear}
                  lang={lang}
                />
              )}

              {activeModule === 'treasury_banks' && (
                <TreasuryAndBanks
                  treasuryTxs={treasuryTxs}
                  banks={banks}
                  bankTxs={bankTxs}
                  bankRecons={bankRecons}
                  journalEntries={journalEntries}
                  customersSuppliers={customersSuppliers}
                  settings={companySettings}
                  accounts={accounts}
                  costCenters={costCenters}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'customers_suppliers' && (
                <CustomersAndSuppliers
                  customersSuppliers={customersSuppliers}
                  journalEntries={journalEntries}
                  treasuryTxs={treasuryTxs}
                  settings={companySettings}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'expenses' && (
                <ExpensesSheet
                  expenses={expenses}
                  costCenters={costCenters}
                  settings={companySettings}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'cost_centers' && (
                <CostCentersProjects
                  costCenters={costCenters}
                  journalEntries={journalEntries}
                  expenses={expenses}
                  treasuryTxs={treasuryTxs}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'inventory' && (
                <InventoryAssets
                  inventory={inventory}
                  stockMovements={stockMovements}
                  costCenters={costCenters}
                  companySettings={companySettings}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'fixed_assets' && (
                <FixedAssetsModule
                  fixedAssets={fixedAssets}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'hr' && (
                <HRModule
                  employees={employees}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  lang={lang}
                />
              )}

              {activeModule === 'financial_reports' && (
                <FinancialReportsModule
                  accounts={accounts}
                  entries={journalEntries}
                  expenses={expenses}
                  fiscalYear={filterState.fiscalYear}
                  lang={lang}
                />
              )}

              {activeModule === 'financial_analysis' && (
                <FinancialAnalysisAIModule
                  accounts={accounts}
                  costCenters={costCenters}
                  expenses={expenses}
                  lang={lang}
                />
              )}

              {activeModule === 'users_management' && (
                <UsersManagementModule
                  users={users}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  searchQuery={filterState.searchQuery}
                  onSwitchUser={handleSwitchUser}
                  lang={lang}
                />
              )}

              {activeModule === 'company_settings' && (
                <CompanySettingsModule
                  settings={companySettings}
                  onSettingsChange={(newSet) => {
                    saveCompanySettings(newSet);
                    refreshData();
                  }}
                  onRefresh={refreshData}
                  lang={lang}
                />
              )}
            </>
          )}
        </main>
      </div>
      {/* نافذة التحقق من كلمة مرور مدير النظام */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>التحقق من هوية مدير النظام</span>
              </h3>
              <button
                onClick={() => {
                  setShowAdminAuthModal(false);
                  setPendingAdminTargetUserId(null);
                  setAdminAuthError(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4 mt-4">
              <p className="text-xs text-slate-300">
                يتطلب التبديل إلى حساب مدير النظام أو الوصول للصلاحيات الإدارية إدخال كلمة مرور الإدارة.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة مرور مدير النظام (الافتراضية: admin123)
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminAuthError) setAdminAuthError(false);
                  }}
                  placeholder="أدخل كلمة مرور الإدارة"
                  className={`w-full py-2 px-3 text-xs bg-slate-800 border ${adminAuthError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700'} text-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none`}
                />
                {adminAuthError && (
                  <p className="text-[11px] text-red-400 font-bold mt-1">
                    كلمة المرور غير صحيحة! يرجى المحاولة مرة أخرى.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminAuthModal(false);
                    setPendingAdminTargetUserId(null);
                    setAdminAuthError(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  تأكيد الدخول 🔒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomDialogs />
    </div>
  );
}
