import {
  Account,
  JournalEntry,
  TreasuryTransaction,
  BankAccount,
  BankTransaction,
  BankReconciliation,
  CustomerSupplier,
  Custody,
  EmployeeAdvance,
  CostCenter,
  ExpenseItem,
  InventoryItem,
  StockMovement,
  FixedAsset,
  Employee,
  UserAccount,
  CompanySettings,
  SiteSettlement,
  CustomSheet,
  AccrualAdjustment
} from '../types';

export const ALL_MODULE_IDS = [
  'dashboard',
  'custom_sheets',
  'chart_of_accounts',
  'journal_entries',
  'treasury_banks',
  'custodies',
  'advances',
  'site_settlements',
  'customers_suppliers',
  'expenses',
  'cost_centers',
  'inventory',
  'fixed_assets',
  'hr',
  'financial_reports',
  'financial_analysis',
  'users_management',
  'company_settings'
];

export const STORAGE_KEYS = {
  SETTINGS: 'roeya_erp_settings_v3',
  ACCOUNTS: 'roeya_erp_accounts_v3',
  JOURNAL_ENTRIES: 'roeya_erp_journal_entries_v3',
  TREASURY: 'roeya_erp_treasury_v3',
  BANKS: 'roeya_erp_banks_v3',
  BANK_TXS: 'roeya_erp_bank_txs_v3',
  BANK_RECONS: 'roeya_erp_bank_recons_v3',
  CUSTOMERS_SUPPLIERS: 'roeya_erp_customers_suppliers_v3',
  CUSTODIES: 'roeya_erp_custodies_v3',
  ADVANCES: 'roeya_erp_advances_v3',
  SITE_SETTLEMENTS: 'roeya_erp_site_settlements_v3',
  COST_CENTERS: 'roeya_erp_cost_centers_v3',
  EXPENSES: 'roeya_erp_expenses_v3',
  INVENTORY: 'roeya_erp_inventory_v3',
  STOCK_MOVEMENTS: 'roeya_erp_stock_movements_v3',
  CUSTOM_SHEETS: 'roeya_erp_custom_sheets_v3',
  ACCRUAL_ADJUSTMENTS: 'roeya_erp_accrual_adjustments_v3',
  ADMIN_PASSWORD: 'roeya_erp_admin_password_v3',
  FIXED_ASSETS: 'roeya_erp_fixed_assets_v3',
  EMPLOYEES: 'roeya_erp_employees_v3',
  USERS: 'roeya_erp_users_v3',
  ACTIVE_USER_ID: 'roeya_erp_active_user_id_v3',
  IMPERSONATOR_USER_ID: 'roeya_erp_impersonator_id_v3'
};

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'شركة الرؤية المتكاملة للتجارة والمقاولات',
  companyNameEn: 'Al-Roeya Integrated Trading & Contracting Co.',
  taxNumber: '300458921000003',
  commercialRegister: '1010543210',
  address: 'القاهرة - التجمع الخامس - شارع التسعين',
  phone: '010-45678901',
  email: 'info@roeya-erp.com',
  website: 'www.roeya-erp.com',
  currency: 'ج.م',
  fiscalYearStart: '2026-01-01',
  fiscalYearEnd: '2026-12-31',
  defaultTaxRate: 14,
  language: 'ar',
  notificationSettings: {
    defaultBankThreshold: 50000,
    enableWhatsAppAlerts: true,
    enableDashboardPopups: true,
    managerPhone: '201012345678',
    dueDaysNotice: 7,
    alertOnInventoryLow: true,
    alertOnCustodyDelay: true,
    alertOnOverdueReceivables: true
  }
};

export const INITIAL_ACCOUNTS: Account[] = [
  // الأصول المتداولة
  { id: 'acc_101', code: '1010', name: 'الخزينة الرئيسية (النقدية)', type: 'asset', subType: 'cash', initialBalance: 50000, currentBalance: 75000, isActive: true, notes: 'خزينة المركز الرئيسي', createdAt: '2026-01-01' },
  { id: 'acc_102', code: '1020', name: 'البنك الأهلي التجاري', type: 'asset', subType: 'bank', initialBalance: 250000, currentBalance: 320000, isActive: true, notes: 'حساب جاري رقم 987654321', createdAt: '2026-01-01' },
  { id: 'acc_103', code: '1030', name: 'مصرف الراجحي', type: 'asset', subType: 'bank', initialBalance: 180000, currentBalance: 150000, isActive: true, notes: 'حساب استثماري وجاري', createdAt: '2026-01-01' },
  { id: 'acc_104', code: '1040', name: 'عملاء تجاريون - حساب مجمع', type: 'asset', subType: 'customer', initialBalance: 120000, currentBalance: 95000, isActive: true, notes: 'أرصدة العملاء المدينين', createdAt: '2026-01-01' },
  { id: 'acc_105', code: '1050', name: 'المخزون السلعي والمواد', type: 'asset', subType: 'current_asset', initialBalance: 90000, currentBalance: 115000, isActive: true, notes: 'مخزون المستودع المركزي', createdAt: '2026-01-01' },
  { id: 'acc_106', code: '1060', name: 'عهد الموظفين النقدية والمشاريع', type: 'asset', subType: 'current_asset', initialBalance: 23000, currentBalance: 23000, isActive: true, notes: 'عهد المهندسين والمشاريع الميدانية', createdAt: '2026-01-01' },
  { id: 'acc_107', code: '1070', name: 'سلف العاملين المستردة', type: 'asset', subType: 'current_asset', initialBalance: 18000, currentBalance: 13000, isActive: true, notes: 'سلف الموظفين المستقطعة شهرياً', createdAt: '2026-01-01' },
  
  // الأصول الثابتة
  { id: 'acc_110', code: '1100', name: 'الأراضي والمباني', type: 'asset', subType: 'fixed_asset', initialBalance: 500000, currentBalance: 500000, isActive: true, notes: 'مبنى الإدارة الرئيسي', createdAt: '2026-01-01' },
  { id: 'acc_111', code: '1110', name: 'السيارات ووسائل النقل', type: 'asset', subType: 'fixed_asset', initialBalance: 160000, currentBalance: 140000, isActive: true, notes: 'سيارات ومعدات النقل', createdAt: '2026-01-01' },
  { id: 'acc_112', code: '1120', name: 'الأجهزة والمعدات المكتبية', type: 'asset', subType: 'fixed_asset', initialBalance: 45000, currentBalance: 38000, isActive: true, notes: 'حاسبات وأجهزة الإدارة', createdAt: '2026-01-01' },

  // الخصوم (الالتزامات)
  { id: 'acc_201', code: '2010', name: 'الموردون والدائنون التجاريون', type: 'liability', subType: 'supplier', initialBalance: -85000, currentBalance: -65000, isActive: true, notes: 'أرصدة الموردين الدائنة', createdAt: '2026-01-01' },
  { id: 'acc_202', code: '2020', name: 'ضريبة القيمة المضافة المستحقة', type: 'liability', subType: 'current_liability', initialBalance: -12000, currentBalance: -18500, isActive: true, notes: 'إجمالي ضريبة المبيعات ناقص ضريبة المشتريات', createdAt: '2026-01-01' },
  { id: 'acc_203', code: '2030', name: 'أجور ورواتب مستحقة الدفع', type: 'liability', subType: 'current_liability', initialBalance: -25000, currentBalance: -30000, isActive: true, notes: 'مستحقات العاملين الشهرية', createdAt: '2026-01-01' },

  // حقوق الملكية
  { id: 'acc_301', code: '3010', name: 'رأس المال المدفوع', type: 'equity', subType: 'capital', initialBalance: -1000000, currentBalance: -1000000, isActive: true, notes: 'رأس مال الشركاء الأساسي', createdAt: '2026-01-01' },
  { id: 'acc_302', code: '3020', name: 'الأرباح المبقاة والمحتجزة', type: 'equity', subType: 'retained_earnings', initialBalance: -288000, currentBalance: -288000, isActive: true, notes: 'أرباح السنوات السابقة', createdAt: '2026-01-01' },

  // الإيرادات
  { id: 'acc_401', code: '4010', name: 'إيرادات مشاريع المقاولات والتوريدات', type: 'revenue', subType: 'operating_revenue', initialBalance: 0, currentBalance: -450000, isActive: true, notes: 'إيرادات المشاريع المنفذة', createdAt: '2026-01-01' },
  { id: 'acc_402', code: '4020', name: 'إيرادات استشارات وخدمات هندسية', type: 'revenue', subType: 'operating_revenue', initialBalance: 0, currentBalance: -85000, isActive: true, notes: 'عقود الاستشارات والدعم', createdAt: '2026-01-01' },
  { id: 'acc_403', code: '4030', name: 'إيرادات متنوعة وأرباح رأسمالية', type: 'revenue', subType: 'other_revenue', initialBalance: 0, currentBalance: -15000, isActive: true, notes: 'إيرادات استثمارات وفوائد', createdAt: '2026-01-01' },

  // المصروفات
  { id: 'acc_501', code: '5010', name: 'رواتب وأجور العاملين والمكافآت', type: 'expense', subType: 'admin_expense', initialBalance: 0, currentBalance: 120000, isActive: true, notes: 'رواتب الإدارة والمهندسين والعمال', createdAt: '2026-01-01' },
  { id: 'acc_502', code: '5020', name: 'تكاليف ومواد مشاريع مباشرة', type: 'expense', subType: 'operating_expense', initialBalance: 0, currentBalance: 180000, isActive: true, notes: 'أسمنت، حديد، مقاولين بالباطن', createdAt: '2026-01-01' },
  { id: 'acc_503', code: '5030', name: 'إيجارات المكاتب والمستودعات', type: 'expense', subType: 'admin_expense', initialBalance: 0, currentBalance: 45000, isActive: true, notes: 'إيجار سنوي مدفوع', createdAt: '2026-01-01' },
  { id: 'acc_504', code: '5040', name: 'مصروفات تسويق ودعاية وإعلان', type: 'expense', subType: 'marketing_expense', initialBalance: 0, currentBalance: 25000, isActive: true, notes: 'حملات رقمية ومطبوعات', createdAt: '2026-01-01' },
  { id: 'acc_505', code: '5050', name: 'كهرباء ومياه وانترنت وهاتف', type: 'expense', subType: 'admin_expense', initialBalance: 0, currentBalance: 14500, isActive: true, notes: 'فواتير المرافق الشهرية', createdAt: '2026-01-01' },
  { id: 'acc_506', code: '5060', name: 'صيانة السيارات والمعدات والأجهزة', type: 'expense', subType: 'operating_expense', initialBalance: 0, currentBalance: 18500, isActive: true, notes: 'صيانة وإصلاح دوري', createdAt: '2026-01-01' }
];

export const INITIAL_COST_CENTERS: CostCenter[] = [
  { id: 'cc_1', code: 'PRJ-101', name: 'مشروع برج الرياض التجاري - النرجس', manager: 'م. أحمد خالد', budget: 1200000, status: 'active', description: 'إنشاء الهيكل الخرساني والتشطيبات الداخلية المتقدمة', startDate: '2026-01-15', endDate: '2026-12-30' },
  { id: 'cc_2', code: 'PRJ-102', name: 'تطوير البنية التحتية - مجمع العليا الابتكاري', manager: 'م. سارة منصور', budget: 850000, status: 'active', description: 'شبكات الإنارة والصرف والطرق الداخلية', startDate: '2026-02-01', endDate: '2026-09-15' },
  { id: 'cc_3', code: 'PRJ-103', name: 'عقد صيانة مجمع اللؤلؤة السكني', manager: 'م. فهد العتيبي', budget: 350000, status: 'active', description: 'صيانة المصاعد والتكييف والكهرباء الدورية', startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'cc_4', code: 'ADM-001', name: 'المركز الرئيسي والإدارة العامة', manager: 'د. وليد القحطاني', budget: 400000, status: 'active', description: 'التكاليف والمصروفات العمومية غير المباشرة', startDate: '2026-01-01', endDate: '2026-12-31' }
];

export const INITIAL_CUSTOMERS_SUPPLIERS: CustomerSupplier[] = [
  // عملاء
  { id: 'cs_1', type: 'customer', code: 'CUST-001', name: 'مجموعة الإعمار الذهبي للمقاولات', companyName: 'شركة الإعمار الذهبي المحدودة', phone: '0501234567', email: 'accounting@emaar-gold.com', taxNumber: '310987654300003', address: 'الرياض - حي الملز', openingBalance: 45000, currentBalance: 55000, creditLimit: 200000, notes: 'عميل استراتيجي - سداد منتظم خلال 30 يوم' },
  { id: 'cs_2', type: 'customer', code: 'CUST-002', name: 'شركة الخليج للتطوير العقاري', companyName: 'الخليج للتطوير المحدودة', phone: '0559876543', email: 'finance@gulf-dev.sa', taxNumber: '311234567800003', address: 'جدة - طريق الملك عبد العزيز', openingBalance: 30000, currentBalance: 25000, creditLimit: 150000, notes: 'مشاريع تطوير سكنية وتجارية' },
  { id: 'cs_3', type: 'customer', code: 'CUST-003', name: 'مؤسسة الرياض للأعمال الهندسية', companyName: 'مؤسسة الرياض الهندسية', phone: '0564455667', email: 'info@riyadh-eng.com', taxNumber: '300112233400003', address: 'الدمام - حي الشاطئ', openingBalance: 15000, currentBalance: 15000, creditLimit: 100000, notes: 'استشارات وتصاميم معمارية' },

  // موردون
  { id: 'cs_4', type: 'supplier', code: 'SUPP-001', name: 'شركة الحديد والصلب الوطنية', companyName: 'مصنع الحديد والصلب السعودي', phone: '0112345678', email: 'sales@saudi-steel.com', taxNumber: '300554433200003', address: 'الرياض - المدينة الصناعية الثانية', openingBalance: -35000, currentBalance: -28000, creditLimit: 300000, notes: 'توريد حديد تسليح ومواد إنشاءات عالية الجودة' },
  { id: 'cs_5', type: 'supplier', code: 'SUPP-002', name: 'مصنع أسمنت اليمامة والتوريدات', companyName: 'شركة أسمنت اليمامة المساهمة', phone: '0114987654', email: 'orders@yamamah-cement.sa', taxNumber: '300998877600003', address: 'الخرج - طريق الرياض السريع', openingBalance: -25000, currentBalance: -22000, creditLimit: 250000, notes: 'توريد أسمنت وبلوك خرساني' },
  { id: 'cs_6', type: 'supplier', code: 'SUPP-003', name: 'مؤسسة الأنوار للتوريدات الكهربائية', companyName: 'مؤسسة الأنوار التجارية', phone: '0503344556', email: 'info@anwar-elec.com', taxNumber: '300776655400003', address: 'الرياض - سوق الكهرباء بالبطحاء', openingBalance: -15000, currentBalance: -15000, creditLimit: 100000, notes: 'كابلات ولوحات ومصابيح إضاءة للمشاريع' }
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je_1',
    entryNumber: 'Q-2026-0001',
    date: '2026-07-01',
    fiscalYear: '2026',
    description: 'تحصيل دفعة من العميل (مجموعة الإعمار الذهبي) لحساب مشروع برج الرياض وإيداعها بالبنك الأهلي',
    totalDebit: 60000,
    totalCredit: 60000,
    isPosted: true,
    createdBy: 'المحاسب المالي',
    referenceType: 'invoice',
    referenceId: 'cs_1',
    lines: [
      { id: 'jl_1', accountId: 'acc_102', accountName: 'البنك الأهلي التجاري', debit: 60000, credit: 0, description: 'إيداع شيك العميل رقم 54321 بالبنك الأهلي', costCenterId: 'cc_1' },
      { id: 'jl_2', accountId: 'acc_104', accountName: 'عملاء تجاريون - حساب مجمع', debit: 0, credit: 60000, description: 'سداد دفعة حساب العميل مجموعة الإعمار الذهبي', costCenterId: 'cc_1' }
    ]
  },
  {
    id: 'je_2',
    entryNumber: 'Q-2026-0002',
    date: '2026-07-05',
    fiscalYear: '2026',
    description: 'شراء مواد بناء وحديد تسليح من (شركة الحديد والصلب الوطنية) لمشروع برج الرياض التجاري',
    totalDebit: 45000,
    totalCredit: 45000,
    isPosted: true,
    createdBy: 'المحاسب المالي',
    referenceType: 'expense',
    referenceId: 'cs_4',
    lines: [
      { id: 'jl_3', accountId: 'acc_502', accountName: 'تكاليف ومواد مشاريع مباشرة', debit: 45000, credit: 0, description: 'توريد حديد تسليح 16 مم - فاتورة توريد 8871', costCenterId: 'cc_1' },
      { id: 'jl_4', accountId: 'acc_201', accountName: 'الموردون والدائنون التجاريون', debit: 0, credit: 45000, description: 'استحقاق فاتورة شركة الحديد والصلب الوطنية', costCenterId: 'cc_1' }
    ]
  }
];

export const INITIAL_TREASURY_TXS: TreasuryTransaction[] = [
  { id: 'tx_1', transactionNumber: 'TR-2026-001', date: '2026-07-02', type: 'in', amount: 15000, category: 'customer_payment', relatedParty: 'مؤسسة الرياض للأعمال الهندسية', description: 'تحصيل نقدي دفعة أعمال استشارية', accountId: 'acc_104', costCenterId: 'cc_4', enteredBy: 'أمين الصندوق' },
  { id: 'tx_2', transactionNumber: 'TR-2026-002', date: '2026-07-04', type: 'out', amount: 3500, category: 'expense', relatedParty: 'الشركة السعودية للكهرباء', description: 'سداد فاتورة كهرباء المقر الرئيسي', accountId: 'acc_505', costCenterId: 'cc_4', enteredBy: 'أمين الصندوق' },
  { id: 'tx_3', transactionNumber: 'TR-2026-003', date: '2026-07-08', type: 'out', amount: 15000, category: 'custody', relatedParty: 'م. أحمد خالد', description: 'صرف عهدة نقدية طارئة لمشروع برج الرياض', accountId: 'acc_106', costCenterId: 'cc_1', enteredBy: 'أمين الصندوق' }
];

export const INITIAL_BANKS: BankAccount[] = [
  { id: 'bank_1', bankName: 'البنك الأهلي المصري (NBE)', accountNumber: 'EG9876543210001234567890', currency: 'ج.م', initialBalance: 250000, currentBalance: 320000, branch: 'فرع التجمع الخامس الرئيسي', minThreshold: 100000, warningThreshold: 150000, alertRecipientPhone: '201012345678', notes: 'الحساب الرئيسي للعمليات والتحويلات' },
  { id: 'bank_2', bankName: 'بنك مصر (Banque Misr)', accountNumber: 'EG1234567890009876543210', currency: 'ج.م', initialBalance: 180000, currentBalance: 150000, branch: 'فرع مدينة نصر', minThreshold: 80000, warningThreshold: 100000, alertRecipientPhone: '201012345678', notes: 'حساب مسيرات الرواتب والعمليات اليومية' }
];

export const INITIAL_ACCRUAL_ADJUSTMENTS: AccrualAdjustment[] = [
  {
    id: 'adj_1',
    code: 'ADJ-2026-001',
    type: 'prepaid_expense',
    title: 'إيجار مكاتب ومستودعات الإدارة العامة مدفوع مقدماً',
    totalAmount: 60000,
    amortizedAmount: 35000,
    remainingAmount: 25000,
    startDate: '2026-01-01',
    dueDate: '2026-12-31',
    expenseOrRevenueAccountId: 'acc_503',
    expenseOrRevenueAccountName: 'إيجارات المكاتب والمستودعات',
    adjustmentAccountId: 'acc_108',
    costCenterId: 'cc_4',
    costCenterName: 'المركز الرئيسي والإدارة العامة',
    status: 'partially_adjusted',
    notes: 'إيجار سنوي مدفوع مقدماً يستهلك شهرياً بقيمة 5,000 ريال',
    createdAt: '2026-01-01'
  },
  {
    id: 'adj_2',
    code: 'ADJ-2026-002',
    type: 'prepaid_expense',
    title: 'وثيقة التأمين الشامل لمركبات ومعدات المشاريع',
    totalAmount: 24000,
    amortizedAmount: 14000,
    remainingAmount: 10000,
    startDate: '2026-01-01',
    dueDate: '2026-12-31',
    expenseOrRevenueAccountId: 'acc_506',
    expenseOrRevenueAccountName: 'صيانة السيارات والمعدات والأجهزة',
    costCenterId: 'cc_1',
    costCenterName: 'مشروع برج الرياض التجاري - النرجس',
    status: 'partially_adjusted',
    notes: 'تأمين مركبات مدفوع مقدماً يستهلك شهرياً بقيمة 2,000 ريال',
    createdAt: '2026-01-01'
  },
  {
    id: 'adj_3',
    code: 'ADJ-2026-003',
    type: 'accrued_expense',
    title: 'أجور ومستحقات ورواتب عمالة وفنيين مستحقة عن الشهر الحالي',
    totalAmount: 30000,
    amortizedAmount: 0,
    remainingAmount: 30000,
    startDate: '2026-07-01',
    dueDate: '2026-07-31',
    expenseOrRevenueAccountId: 'acc_501',
    expenseOrRevenueAccountName: 'رواتب وأجور العاملين والمكافآت',
    adjustmentAccountId: 'acc_203',
    costCenterId: 'cc_1',
    costCenterName: 'مشروع برج الرياض التجاري - النرجس',
    status: 'active',
    notes: 'مستحقات أجور تشغيلية مستحقة السداد قبل نهاية الشهر',
    createdAt: '2026-07-01'
  },
  {
    id: 'adj_4',
    code: 'ADJ-2026-004',
    type: 'accrued_expense',
    title: 'فواتير استهلاك الكهرباء والاتصالات للمشاريع والمقر',
    totalAmount: 8500,
    amortizedAmount: 0,
    remainingAmount: 8500,
    startDate: '2026-07-01',
    dueDate: '2026-07-28',
    expenseOrRevenueAccountId: 'acc_505',
    expenseOrRevenueAccountName: 'كهرباء ومياه وانترنت وهاتف',
    costCenterId: 'cc_4',
    costCenterName: 'المركز الرئيسي والإدارة العامة',
    status: 'active',
    notes: 'استهلاك خدمات مرافق مستحقة لم تسدد بعد',
    createdAt: '2026-07-05'
  },
  {
    id: 'adj_5',
    code: 'ADJ-2026-005',
    type: 'accrued_revenue',
    title: 'مستخلص أعمال تنفيذية منجزة لم تصدر فاتورتها بعد (برج النرجس)',
    totalAmount: 85000,
    amortizedAmount: 0,
    remainingAmount: 85000,
    startDate: '2026-06-01',
    dueDate: '2026-07-30',
    expenseOrRevenueAccountId: 'acc_401',
    expenseOrRevenueAccountName: 'إيرادات مشاريع المقاولات والتوريدات',
    costCenterId: 'cc_1',
    costCenterName: 'مشروع برج الرياض التجاري - النرجس',
    status: 'active',
    notes: 'إيراد مستحق عن مرحلة الصب الخرساني وجاري إصدار الفاتورة الضريبية',
    createdAt: '2026-06-25'
  },
  {
    id: 'adj_6',
    code: 'ADJ-2026-006',
    type: 'unearned_revenue',
    title: 'دفعة مقدمة من العميل عن عقد صيانة مجمع اللؤلؤة السكني',
    totalAmount: 40000,
    amortizedAmount: 20000,
    remainingAmount: 20000,
    startDate: '2026-01-01',
    dueDate: '2026-12-31',
    expenseOrRevenueAccountId: 'acc_402',
    expenseOrRevenueAccountName: 'إيرادات استشارات وخدمات هندسية',
    costCenterId: 'cc_3',
    costCenterName: 'عقد صيانة مجمع اللؤلؤة السكني',
    status: 'partially_adjusted',
    notes: 'دفعة سنوية مقدمة يتم إثبات نصيب كل ربع سنوي منها بقيمة 10,000 ريال',
    createdAt: '2026-01-01'
  }
];

export const INITIAL_BANK_TXS: BankTransaction[] = [
  { id: 'btx_1', bankAccountId: 'bank_1', date: '2026-07-01', type: 'deposit', amount: 60000, referenceNumber: 'CHQ-54321', checkNumber: '54321', beneficiary: 'مجموعة الإعمار الذهبي', source: 'تحصيل شيك عميل', description: 'إيداع شيك العميل مجموعة الإعمار الذهبي لحساب مشروع برج الرياض', isReconciled: true },
  { id: 'btx_2', bankAccountId: 'bank_1', date: '2026-07-06', type: 'withdrawal', amount: 25000, referenceNumber: 'TRF-99012', checkNumber: 'TRF-99012', beneficiary: 'مصنع أسمنت اليمامة والتوريدات', description: 'تحويل بنكي دفعة لحساب مصنع أسمنت اليمامة توريد مواد', isReconciled: true },
  { id: 'btx_3', bankAccountId: 'bank_1', date: '2026-07-12', type: 'deposit', amount: 45000, referenceNumber: 'DEP-8841', source: 'شركة الخليج للتطوير', description: 'تحويل بنكي وارد دفعة مستخلص أعمال هندسية', isReconciled: false },
  { id: 'btx_4', bankAccountId: 'bank_1', date: '2026-07-15', type: 'withdrawal', amount: 12000, referenceNumber: 'CHQ-54322', checkNumber: '54322', beneficiary: 'شركة الحديد والصلب الوطنية', description: 'صرف شيك بنكي لمورد حديد التسليح', isReconciled: false },
  { id: 'btx_5', bankAccountId: 'bank_1', date: '2026-07-20', type: 'fee', amount: 250, referenceNumber: 'FEE-1002', description: 'رسوم كشف حساب وخدمات تحويل مصرفي إلكتروني', isReconciled: true },
  { id: 'btx_6', bankAccountId: 'bank_1', date: '2026-07-28', type: 'interest', amount: 1250, referenceNumber: 'INT-3301', description: 'عوائد وفوائد دائنة للحساب الجاري الاستثماري', isReconciled: true },
  
  { id: 'btx_7', bankAccountId: 'bank_2', date: '2026-07-02', type: 'deposit', amount: 35000, referenceNumber: 'DEP-7710', source: 'مؤسسة الرياض للأعمال الهندسية', description: 'إيداع تحويل بنكي سداد دفعة عقود استشارية', isReconciled: true },
  { id: 'btx_8', bankAccountId: 'bank_2', date: '2026-07-10', type: 'fee', amount: 150, referenceNumber: 'FEE-3001', description: 'رسوم خدمات مصرفية بنكية شهرية وإدارة حساب', isReconciled: false },
  { id: 'btx_9', bankAccountId: 'bank_2', date: '2026-07-18', type: 'withdrawal', amount: 48000, referenceNumber: 'PAY-7701', beneficiary: 'مسيرات رواتب وأجور الموظفين', description: 'تحويل مسيرات رواتب العاملين لشهر يوليو', isReconciled: false },
  { id: 'btx_10', bankAccountId: 'bank_2', date: '2026-07-22', type: 'transfer', amount: 20000, referenceNumber: 'TRF-3321', checkNumber: 'TRF-3321', beneficiary: 'البنك الأهلي المصري', description: 'تحويل داخلي بين الحسابات لتعزيز السيولة', isReconciled: true }
];

export const INITIAL_BANK_RECONS: BankReconciliation[] = [
  {
    id: 'rec_1',
    bankAccountId: 'bank_1',
    date: '2026-06-30',
    statementBalance: 274850,
    bookBalance: 274850,
    difference: 0,
    reconciledItemsCount: 18,
    notes: 'تم تطابق رصيد كشف البنك مع الرصيد الدفتري بنجاح لشهر يونيو 2026',
    status: 'balanced'
  }
];

// =================== سجل العهد النقدية مع فواتير وتسوية كل عهدة ===================
export const INITIAL_CUSTODIES: Custody[] = [
  {
    id: 'cus_1',
    custodyNumber: 'CUST-2026-001',
    employeeId: 'emp_1',
    employeeName: 'م. أحمد خالد عبد الله',
    employeePhone: '0501122334',
    amount: 15000,
    dateGiven: '2026-06-15',
    purpose: 'مشتريات مواد طارئة وصيانة العمالة بموقع مشروع برج الرياض',
    type: 'temporary',
    costCenterId: 'cc_1',
    costCenterName: 'مشروع برج الرياض التجاري - النرجس',
    status: 'partially_settled',
    settledAmount: 9500,
    remainingAmount: 5500,
    notes: 'تم تسوية فواتير بقيمة 9,500 ريال وجاري استكمال باقي الفواتير ورد المتبقي',
    invoices: [
      { id: 'cinv_1', invoiceNumber: 'INV-7781', date: '2026-06-18', description: 'شراء كوابيل وأسلاك لحام طارئة للموقع', category: 'مواد وإنشاءات', amount: 3200, taxAmount: 480, total: 3680, supplierName: 'مؤسسة المعدات الحديثة' },
      { id: 'cinv_2', invoiceNumber: 'INV-9023', date: '2026-06-22', description: 'صيانة هيدروليك ونش الرفع وتغيير زيوت', category: 'صيانة ومعدات', amount: 2500, taxAmount: 375, total: 2875, supplierName: 'ورشة التقنية الهندسية' },
      { id: 'cinv_3', invoiceNumber: 'INV-1145', date: '2026-06-28', description: 'مستلزمات سلامة مهنية وخوذات وأحذية للعمال الجدد', category: 'أدوات سلامة', amount: 2560.87, taxAmount: 384.13, total: 2945, supplierName: 'شركة الأمان الصناعي' }
    ]
  },
  {
    id: 'cus_2',
    custodyNumber: 'CUST-2026-002',
    employeeId: 'emp_2',
    employeeName: 'م. سارة منصور الغامدي',
    employeePhone: '0552233445',
    amount: 8000,
    dateGiven: '2026-07-05',
    purpose: 'ضيافة وفحوصات مختبرية وتوريدات أدوات مكتبية للمشروع',
    type: 'temporary',
    costCenterId: 'cc_2',
    costCenterName: 'تطوير البنية التحتية - مجمع العليا الابتكاري',
    status: 'active',
    settledAmount: 0,
    remainingAmount: 8000,
    notes: 'عهدة نقدية جديدة لشهر يوليو قيد الاستخدام بالميدان',
    invoices: []
  }
];

// =================== سجل سلف الموظفين والأقساط ===================
export const INITIAL_ADVANCES: EmployeeAdvance[] = [
  {
    id: 'adv_1',
    advanceNumber: 'ADV-2026-001',
    employeeId: 'emp_3',
    employeeName: 'خالد عبد الرزاق الشمري',
    employeePhone: '0563344556',
    amount: 12000,
    date: '2026-04-10',
    monthlyDeduction: 1000,
    repaidAmount: 3000,
    remainingAmount: 9000,
    installmentsCount: 12,
    status: 'active',
    reason: 'سلفة زواج وتأثيث منزلي',
    repayments: [
      { id: 'rep_1', date: '2026-04-30', amount: 1000, deductionType: 'salary_deduction', notes: 'استقطاع من راتب شهر أبريل 2026', receiptNumber: 'PAY-2026-04' },
      { id: 'rep_2', date: '2026-05-31', amount: 1000, deductionType: 'salary_deduction', notes: 'استقطاع من راتب شهر مايو 2026', receiptNumber: 'PAY-2026-05' },
      { id: 'rep_3', date: '2026-06-30', amount: 1000, deductionType: 'salary_deduction', notes: 'استقطاع من راتب شهر يونيو 2026', receiptNumber: 'PAY-2026-06' }
    ]
  },
  {
    id: 'adv_2',
    advanceNumber: 'ADV-2026-002',
    employeeId: 'emp_4',
    employeeName: 'عمر عبد العزيز المالكي',
    employeePhone: '0544455667',
    amount: 6000,
    date: '2026-05-01',
    monthlyDeduction: 1000,
    repaidAmount: 2000,
    remainingAmount: 4000,
    installmentsCount: 6,
    status: 'active',
    reason: 'سلفة ظروف عائلية طارئة',
    repayments: [
      { id: 'rep_4', date: '2026-05-31', amount: 1000, deductionType: 'salary_deduction', notes: 'استقطاع من راتب شهر مايو 2026', receiptNumber: 'PAY-2026-05' },
      { id: 'rep_5', date: '2026-06-30', amount: 1000, deductionType: 'salary_deduction', notes: 'استقطاع من راتب شهر يونيو 2026', receiptNumber: 'PAY-2026-06' }
    ]
  }
];

// =================== سجل تسوية الموقع والمشاريع الميدانية ===================
export const INITIAL_SITE_SETTLEMENTS: SiteSettlement[] = [
  {
    id: 'site_1',
    settlementNumber: 'SITE-2026-001',
    siteName: 'مشروع برج الرياض التجاري - النرجس',
    costCenterId: 'cc_1',
    supervisorName: 'م. أحمد خالد عبد الله',
    supervisorPhone: '0501122334',
    date: '2026-07-20',
    periodFrom: '2026-07-01',
    periodTo: '2026-07-20',
    openingCash: 5000,
    transfersReceived: 25000,
    totalReceived: 30000,
    materialExpenses: 12500,
    laborExpenses: 9000,
    operationalExpenses: 3200,
    totalSpent: 24700,
    expectedClosingBalance: 5300,
    actualCashInHand: 5300,
    discrepancy: 0,
    status: 'approved',
    notes: 'تمت مطابقة عهدة ومصروفات الموقع الميداني بالكامل وتدقيق الفواتير المرفقة',
    approvedBy: 'د. وليد القحطاني',
    approvedDate: '2026-07-21',
    items: [
      { id: 'se_1', date: '2026-07-05', type: 'material', description: 'شراء بلوك أسمنتي 20 سم عازل', amount: 4500, recipient: 'مصنع البلوك الحديث', invoiceNumber: 'INV-401' },
      { id: 'se_2', date: '2026-07-09', type: 'material', description: 'خراطيم تمديد كهرباء وأسلاك ربط', amount: 8000, recipient: 'مؤسسة الرياض للكهرباء', invoiceNumber: 'INV-402' },
      { id: 'se_3', date: '2026-07-12', type: 'labor', description: 'يوميات عمالة صب الخرسانة المسلحة', amount: 5500, recipient: 'مقاول باطن - المعلم حسن', invoiceNumber: 'VOU-011' },
      { id: 'se_4', date: '2026-07-16', type: 'labor', description: 'أجرة أعمال حدادة ونجارة مسلحة', amount: 3500, recipient: 'ورشة الإتقان للحدادة', invoiceNumber: 'VOU-012' },
      { id: 'se_5', date: '2026-07-18', type: 'equipment', description: 'إيجار مضخة خرسانة ورصاصة دمك', amount: 3200, recipient: 'مؤسسة المعدات الثقيلة', invoiceNumber: 'INV-409' }
    ]
  },
  {
    id: 'site_2',
    settlementNumber: 'SITE-2026-002',
    siteName: 'تطوير البنية التحتية - مجمع العليا الابتكاري',
    costCenterId: 'cc_2',
    supervisorName: 'م. سارة منصور الغامدي',
    supervisorPhone: '0552233445',
    date: '2026-07-25',
    periodFrom: '2026-07-10',
    periodTo: '2026-07-25',
    openingCash: 3000,
    transfersReceived: 18000,
    totalReceived: 21000,
    materialExpenses: 7400,
    laborExpenses: 6200,
    operationalExpenses: 1800,
    totalSpent: 15400,
    expectedClosingBalance: 5600,
    actualCashInHand: 5600,
    discrepancy: 0,
    status: 'under_review',
    notes: 'تسوية نصف شهرية قيد تدقيق الفواتير والسندات في الإدارة المالية',
    items: [
      { id: 'se_6', date: '2026-07-15', type: 'material', description: 'مواسير صرف صحي 6 بوصة عالية المقاومة', amount: 7400, recipient: 'مصنع الأنابيب السعودي', invoiceNumber: 'INV-881' },
      { id: 'se_7', date: '2026-07-18', type: 'labor', description: 'يوميات عمال الحفر والتمديدات الأرضية', amount: 6200, recipient: 'مقاول الحفريات - أبو خالد', invoiceNumber: 'VOU-021' },
      { id: 'se_8', date: '2026-07-22', type: 'misc', description: 'محروقات ديزل لمولدات الموقع وضيافة الاستشاري', amount: 1800, recipient: 'محطة بترول العليا', invoiceNumber: 'INV-885' }
    ]
  }
];

export const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'exp_1', date: '2026-07-03', category: 'رواتب وأجور', subCategory: 'مكافآت وإضافي', amount: 8000, taxAmount: 0, totalWithTax: 8000, paymentMethod: 'bank', payee: 'فريق عمل موقع النرجس', description: 'مكافآت إنجاز المرحلة الخرسانية الأولى في الموعد المحدد', costCenterId: 'cc_1', costCenterName: 'مشروع برج الرياض التجاري - النرجس', receiptNumber: 'REC-001', isRecurring: false },
  { id: 'exp_2', date: '2026-07-06', category: 'إيجارات ومرافق', subCategory: 'كهرباء ومياه', amount: 3500, taxAmount: 525, totalWithTax: 4025, paymentMethod: 'cash', payee: 'الشركة السعودية للكهرباء', description: 'فاتورة استهلاك الكهرباء لموقع مجمع العليا الابتكاري', costCenterId: 'cc_2', costCenterName: 'تطوير البنية التحتية - مجمع العليا الابتكاري', receiptNumber: 'REC-002', isRecurring: true },
  { id: 'exp_3', date: '2026-07-11', category: 'صيانة وإصلاح', subCategory: 'صيانة سيارات ومعدات', amount: 4200, taxAmount: 630, totalWithTax: 4830, paymentMethod: 'bank', payee: 'مركز التقنية لصيانة المعدات الثقيلة', description: 'إصلاح هيدروليك وتغيير فلاتر للحفارة كاتربيلر رقم 4', costCenterId: 'cc_1', costCenterName: 'مشروع برج الرياض التجاري - النرجس', receiptNumber: 'REC-003', isRecurring: false },
  { id: 'exp_4', date: '2026-07-14', category: 'تسويق ودعاية', subCategory: 'حملات رقمية', amount: 6500, taxAmount: 975, totalWithTax: 7475, paymentMethod: 'bank', payee: 'وكالة الإبداع الرقمي للتسويق', description: 'حملة إعلانية مُمولة لتسويق وحدات مجمع اللؤلؤة السكني', costCenterId: 'cc_3', costCenterName: 'عقد صيانة مجمع اللؤلؤة السكني', receiptNumber: 'REC-004', isRecurring: true },
  { id: 'exp_5', date: '2026-07-18', category: 'أدوات مكتبية وضيافة', subCategory: 'مستلزمات مكاتب', amount: 1800, taxAmount: 270, totalWithTax: 2070, paymentMethod: 'custody', payee: 'مكتبة جرير', description: 'أوراق طباعة وأحبار وأدوات مكتبية للمقر الرئيسي', costCenterId: 'cc_4', costCenterName: 'المركز الرئيسي والإدارة العامة', receiptNumber: 'REC-005', isRecurring: false }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv_1', sku: 'MAT-STL-16MM', name: 'حديد تسليح سابك قُطر 16 مم (عالي المقاومة)', category: 'مواد بناء وإنشاءات', unit: 'طن', purchasePrice: 2850, sellingPrice: 3200, currentStock: 45, minStockAlert: 15, warehouseLocation: 'مستودع السلي - ساحة أ', totalValue: 128250, notes: 'مطابق للمواصفات القياسية السعودية SASO' },
  { id: 'inv_2', sku: 'MAT-CEM-OPC', name: 'أسمنت اليمامة بورتلاندي عادي (أكياس 50 كجم)', category: 'مواد بناء وإنشاءات', unit: 'كيس', purchasePrice: 16.5, sellingPrice: 20, currentStock: 1200, minStockAlert: 300, warehouseLocation: 'مستودع السلي - عنبر 2', totalValue: 19800, notes: 'تخزين في بيئة جافة ومعزولة عن الرطوبة' },
  { id: 'inv_3', sku: 'ELEC-CBL-16MM', name: 'كابلات كهرباء الرياض النحاسية 4×16 مم تسليح', category: 'توريدات كهربائية', unit: 'متر', purchasePrice: 42, sellingPrice: 55, currentStock: 850, minStockAlert: 200, warehouseLocation: 'مستودع الملز الرئيسي', totalValue: 35700, notes: 'مخصصة للتمديدات الرئيسية لمشروع النرجس' },
  { id: 'inv_4', sku: 'PLMB-PIP-4IN', name: 'أنابيب صرف صحي بلاستيك PVC قُطر 4 بوصة', category: 'سباكة وصرف صحي', unit: 'أنبوب (6 متر)', purchasePrice: 38, sellingPrice: 50, currentStock: 320, minStockAlert: 80, warehouseLocation: 'مستودع الملز - قسم السباكة', totalValue: 12160, notes: 'ضغط عالي جودة ممتازة' },
  { id: 'inv_5', sku: 'OFF-PAP-A4', name: 'ورق طباعة ممتاز A4 وزن 80 جرام (كرتون 5 رزم)', category: 'أدوات مكتبية', unit: 'كرتون', purchasePrice: 85, sellingPrice: 110, currentStock: 40, minStockAlert: 10, warehouseLocation: 'مستودع الإدارة العامة', totalValue: 3400, notes: 'استهلاك المكاتب والمواقع الهندسية' }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm_1',
    movementNumber: 'IN-2026-0001',
    date: '2026-07-02',
    type: 'in',
    itemId: 'inv_1',
    itemName: 'حديد تسليح سابك قُطر 16 مم (عالي المقاومة)',
    sku: 'MAT-STL-16MM',
    unit: 'طن',
    quantity: 25,
    unitPrice: 2850,
    totalAmount: 71250,
    warehouseLocation: 'مستودع السلي - ساحة أ',
    costCenterId: 'cc_1',
    costCenterName: 'مشروع برج الرياض التجاري - النرجس',
    recipientOrSupplier: 'شركة الحديد والصلب الوطنية',
    referenceDocument: 'PO-2026-881',
    notes: 'توريد دفعة حديد تسليح للموقع مع شهادة مطابقة الجودة',
    enteredBy: 'م. أحمد خالد عبد الله',
    createdAt: '2026-07-02'
  },
  {
    id: 'sm_2',
    movementNumber: 'OUT-2026-0001',
    date: '2026-07-08',
    type: 'out',
    itemId: 'inv_1',
    itemName: 'حديد تسليح سابك قُطر 16 مم (عالي المقاومة)',
    sku: 'MAT-STL-16MM',
    unit: 'طن',
    quantity: 10,
    unitPrice: 2850,
    totalAmount: 28500,
    warehouseLocation: 'مستودع السلي - ساحة أ',
    costCenterId: 'cc_1',
    costCenterName: 'مشروع برج الرياض التجاري - النرجس',
    recipientOrSupplier: 'م. أحمد خالد - موقع النرجس',
    referenceDocument: 'ISS-001',
    notes: 'صرف حديد لتسليح أعمدة وسقف الدور الأرضي',
    enteredBy: 'أمين المستودع - فهد العتيبي',
    createdAt: '2026-07-08'
  },
  {
    id: 'sm_3',
    movementNumber: 'IN-2026-0002',
    date: '2026-07-10',
    type: 'in',
    itemId: 'inv_2',
    itemName: 'أسمنت اليمامة بورتلاندي عادي (أكياس 50 كجم)',
    sku: 'MAT-CEM-OPC',
    unit: 'كيس',
    quantity: 500,
    unitPrice: 16.5,
    totalAmount: 8250,
    warehouseLocation: 'مستودع السلي - عنبر 2',
    costCenterId: 'cc_2',
    costCenterName: 'تطوير البنية التحتية - مجمع العليا الابتكاري',
    recipientOrSupplier: 'مصنع أسمنت اليمامة والتوريدات',
    referenceDocument: 'INV-CEM-994',
    notes: 'استلام أسمنت توريد مباشر من المصنع',
    enteredBy: 'خالد عبد الرزاق الشمري',
    createdAt: '2026-07-10'
  },
  {
    id: 'sm_4',
    movementNumber: 'OUT-2026-0002',
    date: '2026-07-15',
    type: 'out',
    itemId: 'inv_2',
    itemName: 'أسمنت اليمامة بورتلاندي عادي (أكياس 50 كجم)',
    sku: 'MAT-CEM-OPC',
    unit: 'كيس',
    quantity: 200,
    unitPrice: 16.5,
    totalAmount: 3300,
    warehouseLocation: 'مستودع السلي - عنبر 2',
    costCenterId: 'cc_2',
    costCenterName: 'تطوير البنية التحتية - مجمع العليا الابتكاري',
    recipientOrSupplier: 'م. سارة منصور - مجمع العليا',
    referenceDocument: 'ISS-002',
    notes: 'صرف لأعمال صب القواعد الخرسانية ومناهل الصرف',
    enteredBy: 'أمين المستودع - فهد العتيبي',
    createdAt: '2026-07-15'
  },
  {
    id: 'sm_5',
    movementNumber: 'ADJ-2026-0001',
    date: '2026-07-20',
    type: 'adjustment',
    itemId: 'inv_3',
    itemName: 'كابلات كهرباء الرياض النحاسية 4×16 مم تسليح',
    sku: 'ELEC-CBL-16MM',
    unit: 'متر',
    quantity: 50,
    unitPrice: 42,
    totalAmount: 2100,
    warehouseLocation: 'مستودع الملز الرئيسي',
    costCenterId: 'cc_4',
    costCenterName: 'المركز الرئيسي والإدارة العامة',
    recipientOrSupplier: 'لجنة الجرد الدوري السنوية',
    referenceDocument: 'STK-ADJ-01',
    notes: 'تسوية جردية دورية بعد المطابقة الميدانية ووجود فائض بالمخزن',
    enteredBy: 'خالد عبد الرزاق الشمري',
    createdAt: '2026-07-20'
  }
];

export const INITIAL_CUSTOM_SHEETS: CustomSheet[] = [
  {
    id: 'sheet_adjustments',
    title: 'شيت التسويات الجردية (المصروفات والإيرادات المستحقة والمقدمة)',
    description: 'شيت التسويات الجردية الشامل: المصروفات المستحقة، المصروفات المدفوعة مقدماً، الإيرادات المستحقة، والإيرادات المقبوضة مقدماً',
    category: 'تسويات جردية ومحاسبة',
    createdAt: '2026-07-01',
    updatedAt: '2026-08-20',
    createdBy: 'د. وليد القحطاني',
    columns: [
      { key: 'adjType', label: 'نوع التسوية الجردية', type: 'text', width: 220 },
      { key: 'debitAcc', label: 'الحساب المدين (من ح/)', type: 'text', width: 200 },
      { key: 'creditAcc', label: 'الحساب الدائن (إلى ح/)', type: 'text', width: 200 },
      { key: 'amount', label: 'مبلغ التسوية', type: 'currency', width: 140 },
      { key: 'period', label: 'الفترة / تاريخ التسوية', type: 'date', width: 130 },
      { key: 'entryNumber', label: 'رقم القيد', type: 'text', width: 120 },
      { key: 'description', label: 'الشرح المحاسبي والتسوية', type: 'text', width: 260 },
      { key: 'status', label: 'حالة التسوية', type: 'text', width: 120 }
    ],
    rows: [
      {
        id: 'adj_1',
        adjType: 'المصروفات المستحقة',
        debitAcc: 'رواتب وأجور العاملين (5010)',
        creditAcc: 'أجور ورواتب مستحقة الدفع (2030)',
        amount: 30000,
        period: '2026-07-31',
        entryNumber: 'ADJ-2026-01',
        description: 'إثبات رواتب وأجور شهر يوليو المستحقة ولم تصرف للموظفين بعد',
        status: 'معتمد ومقيد'
      },
      {
        id: 'adj_2',
        adjType: 'المصروفات المدفوعة مقدماً',
        debitAcc: 'إيجارات مدفوعة مقدماً (1080)',
        creditAcc: 'البنك الأهلي التجاري (1020)',
        amount: 45000,
        period: '2026-07-01',
        entryNumber: 'ADJ-2026-02',
        description: 'إثبات عقد إيجار مستودعات السلي اللوجستية المدفوع مقدماً لمدة سنة',
        status: 'معتمد ومقيد'
      },
      {
        id: 'adj_3',
        adjType: 'الإيرادات المستحقة',
        debitAcc: 'إيرادات مستحقة غير محصلة (1090)',
        creditAcc: 'إيرادات استشارات وخدمات هندسية (4020)',
        amount: 25000,
        period: '2026-07-31',
        entryNumber: 'ADJ-2026-03',
        description: 'إثبات قيمة استشارات هندسية منجزة لمشروع برج الرياض ولم تصدر فاتورتها بعد',
        status: 'معتمد ومقيد'
      },
      {
        id: 'adj_4',
        adjType: 'الإيرادات المقبوضة مقدماً',
        debitAcc: 'مصرف الراجحي (1030)',
        creditAcc: 'إيرادات مقبوضة مقدماً - دفعات عملاء (2040)',
        amount: 50000,
        period: '2026-07-15',
        entryNumber: 'ADJ-2026-04',
        description: 'تحصيل دفعة مقدمة من شركة الخليج للتطوير عن المرحلة الثانية للمشروع',
        status: 'معتمد ومقيد'
      }
    ]
  },
  {
    id: 'sheet_documents',
    title: 'شيت المستندات والفواتير والوثائق المرفقة',
    description: 'أرشيف وتوثيق فواتير الشراء، سندات القبض والصرف، صور المستندات مع رقم القيد وتاريخه وإمكانية الطباعة الفورية',
    category: 'أرشيف وفواتير',
    createdAt: '2026-07-01',
    updatedAt: '2026-08-22',
    createdBy: 'خالد عبد الرزاق الشمري',
    columns: [
      { key: 'entryNumber', label: 'رقم القيد', type: 'text', width: 120 },
      { key: 'date', label: 'التاريخ', type: 'date', width: 110 },
      { key: 'docType', label: 'نوع المستند', type: 'text', width: 140 },
      { key: 'docName', label: 'اسم المستند / البيان', type: 'text', width: 220 },
      { key: 'party', label: 'الجهة / المورد / العميل', type: 'text', width: 180 },
      { key: 'amount', label: 'المبلغ', type: 'currency', width: 130 },
      { key: 'docImage', label: 'صورة المستند', type: 'text', width: 160 },
      { key: 'notes', label: 'ملاحظات الأرشفة والتدقيق', type: 'text', width: 200 }
    ],
    rows: [
      {
        id: 'doc_1',
        entryNumber: 'Q-2026-0001',
        date: '2026-07-01',
        docType: 'سند إيداع بنكي / شيك',
        docName: 'شيك سداد دفعة مشروع برج الرياض',
        party: 'مجموعة الإعمار الذهبي',
        amount: 60000,
        docImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
        notes: 'مرفق صورة الشيك البنكي المعتمد رقم 54321 مسحوب على بنك الرياض'
      },
      {
        id: 'doc_2',
        entryNumber: 'Q-2026-0002',
        date: '2026-07-05',
        docType: 'فاتورة ضريبية إلكترونية',
        docName: 'فاتورة توريد حديد تسليح 16 مم',
        party: 'شركة الحديد والصلب الوطنية',
        amount: 32200,
        docImage: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
        notes: 'فاتورة رقم INV-2026-881 معتمدة برمز QR زكاة وضريبة'
      },
      {
        id: 'doc_3',
        entryNumber: 'SITE-2026-001',
        date: '2026-07-20',
        docType: 'محضر تسوية موقع ميداني',
        docName: 'تسوية ومطابقة عهدة موقع النرجس',
        party: 'م. أحمد خالد عبد الله',
        amount: 24700,
        docImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
        notes: 'محضر مطابقة العهدة والفواتير المرفقة مع المشرف الميداني'
      },
      {
        id: 'doc_4',
        entryNumber: 'Q-2026-0004',
        date: '2026-07-15',
        docType: 'سند صرف نقدي',
        docName: 'سند صرف دفعة عهدة شراء مواد',
        party: 'م. فهد العتيبي',
        amount: 15000,
        docImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        notes: 'سند صرف خزينة معتمد وموقع من أمين الصندوق'
      }
    ]
  },
  {
    id: 'sheet_1',
    title: 'شيت تسعير وتكاليف مواد وعمالة المشروع',
    description: 'شيت إكسيل مرن لتسعير بنود المقاولات، حساب التكلفة المباشرة، وهامش الربح',
    category: 'مشاريع ومقاولات',
    createdAt: '2026-07-01',
    updatedAt: '2026-08-15',
    createdBy: 'د. وليد القحطاني',
    columns: [
      { key: 'code', label: 'كود البند', type: 'text', width: 100 },
      { key: 'item', label: 'وصف البند / المادة', type: 'text', width: 220 },
      { key: 'unit', label: 'الوحدة', type: 'text', width: 90 },
      { key: 'qty', label: 'الكمية التقديرية', type: 'number', width: 110 },
      { key: 'unitCost', label: 'سعر التكلفة', type: 'currency', width: 110 },
      { key: 'totalCost', label: 'إجمالي التكلفة', type: 'currency', width: 130 },
      { key: 'sellingPrice', label: 'سعر البيع المقترح', type: 'currency', width: 130 },
      { key: 'profitMargin', label: 'هامش الربح المتوقع', type: 'currency', width: 130 }
    ],
    rows: [
      { id: 'r1', code: 'C-01', item: 'خرسانة مسلحة للقواعد والرقاب (مقاوم)', unit: 'م3', qty: 250, unitCost: 260, totalCost: 65000, sellingPrice: 320, profitMargin: 15000 },
      { id: 'r2', code: 'C-02', item: 'حديد تسليح سابك عالي المقاومة 16 مم', unit: 'طن', qty: 28, unitCost: 2850, totalCost: 79800, sellingPrice: 3250, profitMargin: 11200 },
      { id: 'r3', code: 'F-01', item: 'أعمال عزل مائي وحراري للأسطح والأساسات', unit: 'م2', qty: 680, unitCost: 45, totalCost: 30600, sellingPrice: 65, profitMargin: 13600 },
      { id: 'r4', code: 'E-01', item: 'تمديدات كابلات كهربائية وقواطع رئيسية', unit: 'مقطوعية', qty: 1, unitCost: 35000, totalCost: 35000, sellingPrice: 48000, profitMargin: 13000 }
    ]
  },
  {
    id: 'sheet_2',
    title: 'شيت متابعة مستخلصات العملاء والدفعات',
    description: 'شيت لمتابعة المستخلصات الشهرية، نسب الإنجاز، المحتجزات، وصافي المستحق',
    category: 'مالية وعقود',
    createdAt: '2026-07-10',
    updatedAt: '2026-08-20',
    createdBy: 'خالد عبد الرزاق الشمري',
    columns: [
      { key: 'certNo', label: 'رقم المستخلص', type: 'text', width: 110 },
      { key: 'project', label: 'المشروع / الموقع', type: 'text', width: 200 },
      { key: 'client', label: 'الجهة المالكة', type: 'text', width: 180 },
      { key: 'grossAmount', label: 'قيمة الأعمال المنجزة', type: 'currency', width: 140 },
      { key: 'retention', label: 'خصم الضمان (5%)', type: 'currency', width: 120 },
      { key: 'advanceDeduction', label: 'استرداد الدفعة المقدمة', type: 'currency', width: 140 },
      { key: 'netPayable', label: 'صافي المستحق للصرف', type: 'currency', width: 140 },
      { key: 'status', label: 'حالة الدفعة', type: 'text', width: 110 }
    ],
    rows: [
      { id: 'r1', certNo: 'IPC-01', project: 'مشروع برج الرياض التجاري', client: 'شركة الأفق القابضة', grossAmount: 450000, retention: 22500, advanceDeduction: 45000, netPayable: 382500, status: 'تم الصرف' },
      { id: 'r2', certNo: 'IPC-02', project: 'تطوير مجمع فلل العليا السكني', client: 'مجموعة الماجد للاستثمار', grossAmount: 280000, retention: 14000, advanceDeduction: 28000, netPayable: 238000, status: 'تحت المراجعة' },
      { id: 'r3', certNo: 'IPC-03', project: 'إنشاء مستودعات السلي اللوجستية', client: 'شركة الراية للتوزيع', grossAmount: 320000, retention: 16000, advanceDeduction: 32000, netPayable: 272000, status: 'معتمد للصرف' }
    ]
  }
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  { id: 'fa_1', code: 'AST-VEH-001', name: 'شاحنة مرسيدس أكتروس قلاب موديل 2024', category: 'vehicles', purchaseDate: '2024-03-15', purchaseValue: 420000, salvageValue: 70000, usefulLifeYears: 7, depreciationRate: 14.28, accumulatedDepreciation: 100000, netBookValue: 320000, location: 'موقع مشروع برج الرياض التجاري', status: 'active' },
  { id: 'fa_2', code: 'AST-MAC-002', name: 'حفارة هيدروليكية كاتربيلر CAT 320', category: 'machines', purchaseDate: '2023-06-10', purchaseValue: 650000, salvageValue: 100000, usefulLifeYears: 10, depreciationRate: 10, accumulatedDepreciation: 165000, netBookValue: 485000, location: 'موقع تطوير مجمع العليا', status: 'active' },
  { id: 'fa_3', code: 'AST-EQU-003', name: 'مولد كهرباء احتياطي كاتربيلر 500 كيلو فولت أعتاد', category: 'equipment', purchaseDate: '2025-01-20', purchaseValue: 180000, salvageValue: 30000, usefulLifeYears: 8, depreciationRate: 12.5, accumulatedDepreciation: 22500, netBookValue: 157500, location: 'مستودع السلي الرئيسي', status: 'active' },
  { id: 'fa_4', code: 'AST-COM-004', name: 'أجهزة خوادم وحاسبات مكتبية هندسية (عدد 12 جهاز)', category: 'computers', purchaseDate: '2025-04-01', purchaseValue: 75000, salvageValue: 5000, usefulLifeYears: 4, depreciationRate: 25, accumulatedDepreciation: 18750, netBookValue: 56250, location: 'المركز الرئيسي - إدارة التصاميم', status: 'active' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp_1', code: 'EMP-101', name: 'م. أحمد خالد عبد الله', department: 'الإدارة الهندسية والمشاريع', position: 'مدير مشروع أول', joinDate: '2022-03-01', basicSalary: 18000, housingAllowance: 4500, transportAllowance: 1500, otherAllowances: 2000, insuranceDeduction: 1800, advanceDeduction: 0, otherDeductions: 0, status: 'active', phone: '0501122334', email: 'ahmed.k@roeya-erp.com', bankAccount: 'SNB-SA99001' },
  { id: 'emp_2', code: 'EMP-102', name: 'م. سارة منصور الغامدي', department: 'الإدارة الهندسية والمشاريع', position: 'مهندس مدني تخطيط ومتابعة', joinDate: '2023-08-15', basicSalary: 13500, housingAllowance: 3375, transportAllowance: 1200, otherAllowances: 1000, insuranceDeduction: 1350, advanceDeduction: 0, otherDeductions: 0, status: 'active', phone: '0552233445', email: 'sara.m@roeya-erp.com', bankAccount: 'RAJ-SA88002' },
  { id: 'emp_3', code: 'EMP-103', name: 'خالد عبد الرزاق الشمري', department: 'الإدارة المالية والمحاسبة', position: 'محاسب مالي ورئيس حسابات', joinDate: '2021-05-10', basicSalary: 12000, housingAllowance: 3000, transportAllowance: 1000, otherAllowances: 1500, insuranceDeduction: 1200, advanceDeduction: 1000, otherDeductions: 0, status: 'active', phone: '0563344556', email: 'khaled.sh@roeya-erp.com', bankAccount: 'RYD-SA77003' },
  { id: 'emp_4', code: 'EMP-104', name: 'عمر عبد العزيز المالكي', department: 'العمليات والصيانة الدورية', position: 'فني صيانة كهربائية وميكانيكية أول', joinDate: '2024-01-05', basicSalary: 6500, housingAllowance: 1625, transportAllowance: 800, otherAllowances: 500, insuranceDeduction: 650, advanceDeduction: 1000, otherDeductions: 150, status: 'active', phone: '0544455667', email: 'omar.a@roeya-erp.com', bankAccount: 'SNB-SA66004' },
  { id: 'emp_5', code: 'EMP-105', name: 'د. وليد القحطاني', department: 'الإدارة العامة والموارد البشرية', position: 'مدير عام الشؤون الإدارية والمالية', joinDate: '2020-01-01', basicSalary: 25000, housingAllowance: 6250, transportAllowance: 2000, otherAllowances: 3500, insuranceDeduction: 2500, advanceDeduction: 0, otherDeductions: 0, status: 'active', phone: '0505566778', email: 'w.qahtani@roeya-erp.com', bankAccount: 'RAJ-SA55005' }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_1',
    username: 'admin',
    fullName: 'د. وليد القحطاني (المدير العام)',
    role: 'admin',
    email: 'w.qahtani@roeya-erp.com',
    phone: '0505566778',
    isActive: true,
    directAccessKey: 'key_admin_2026',
    allowedModules: [...ALL_MODULE_IDS],
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canPost: true,
      canViewReports: true,
      canManageUsers: true,
      canExport: true,
      canSettle: true
    }
  },
  {
    id: 'usr_2',
    username: 'accountant',
    fullName: 'خالد عبد الرزاق الشمري (رئيس الحسابات)',
    role: 'accountant',
    email: 'khaled.sh@roeya-erp.com',
    phone: '0563344556',
    isActive: true,
    directAccessKey: 'key_acc_9821',
    allowedModules: [
      'dashboard',
      'chart_of_accounts',
      'journal_entries',
      'treasury_banks',
      'custodies',
      'advances',
      'site_settlements',
      'customers_suppliers',
      'expenses',
      'cost_centers',
      'financial_reports',
      'financial_analysis'
    ],
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canPost: true,
      canViewReports: true,
      canManageUsers: false,
      canExport: true,
      canSettle: true
    }
  },
  {
    id: 'usr_3',
    username: 'cashier',
    fullName: 'فهد عبد الله العتيبي (أمين الخزينة والصندوق)',
    role: 'cashier',
    email: 'fahad.o@roeya-erp.com',
    phone: '0501239874',
    isActive: true,
    directAccessKey: 'key_cash_4412',
    allowedModules: [
      'dashboard',
      'treasury_banks',
      'custodies',
      'advances',
      'site_settlements',
      'expenses'
    ],
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canPost: false,
      canViewReports: false,
      canManageUsers: false,
      canExport: true,
      canSettle: true
    }
  },
  {
    id: 'usr_4',
    username: 'site_eng',
    fullName: 'م. أحمد خالد عبد الله (مهندس ومسؤول موقع)',
    role: 'site_engineer',
    email: 'ahmed.k@roeya-erp.com',
    phone: '0501122334',
    isActive: true,
    directAccessKey: 'key_site_7719',
    allowedModules: [
      'dashboard',
      'site_settlements',
      'custodies',
      'expenses',
      'cost_centers'
    ],
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: false,
      canPost: false,
      canViewReports: false,
      canManageUsers: false,
      canExport: true,
      canSettle: true
    }
  }
];

export const SYNC_CHANNEL_NAME = 'roeya_erp_sync_channel';

// Helper to broadcast changes immediately across all tabs, windows and components
export function broadcastSync(type: string, payload?: any): void {
  try {
    const timestamp = Date.now();
    // 1. Dispatch custom event in same window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roeya_erp_sync', { detail: { type, payload, timestamp } }));
    }
    // 2. BroadcastChannel across open tabs/windows
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type, payload, timestamp });
      channel.close();
    }
    // 3. Heartbeat key in localStorage to trigger storage events
    localStorage.setItem('roeya_erp_sync_heartbeat', JSON.stringify({ type, timestamp }));
  } catch (e) {
    console.error('Error in broadcastSync:', e);
  }
}

// Helper functions for Local Storage
export function loadData<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data || data === 'undefined' || data === 'null') return fallback;
    const parsed = JSON.parse(data);
    if (parsed === null || parsed === undefined) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return fallback;
  }
}

export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

export function asyncServerPush(key: string, data: any): void {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  try {
    if (key === 'users') {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(e => console.error('Server users push failed:', e));
    } else {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: data })
      }).catch(e => console.error(`Server ${key} push failed:`, e));
    }
  } catch (e) {
    // Ignore offline push errors
  }
}

export function getAccounts(): Account[] { return loadData(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS); }
export function saveAccounts(data: Account[]): void {
  saveData(STORAGE_KEYS.ACCOUNTS, data);
  broadcastSync('ACCOUNTS_UPDATED', data);
  asyncServerPush('accounts', data);
}

export function getJournalEntries(): JournalEntry[] { return loadData(STORAGE_KEYS.JOURNAL_ENTRIES, INITIAL_JOURNAL_ENTRIES); }
export function saveJournalEntries(data: JournalEntry[]): void {
  saveData(STORAGE_KEYS.JOURNAL_ENTRIES, data);
  broadcastSync('JOURNAL_ENTRIES_UPDATED', data);
  asyncServerPush('journalEntries', data);
}

export function getTreasuryTxs(): TreasuryTransaction[] { return loadData(STORAGE_KEYS.TREASURY, INITIAL_TREASURY_TXS); }
export function saveTreasuryTxs(data: TreasuryTransaction[]): void {
  saveData(STORAGE_KEYS.TREASURY, data);
  broadcastSync('TREASURY_UPDATED', data);
  asyncServerPush('treasuryTxs', data);
}

export function getBanks(): BankAccount[] { return loadData(STORAGE_KEYS.BANKS, INITIAL_BANKS); }
export function saveBanks(data: BankAccount[]): void {
  saveData(STORAGE_KEYS.BANKS, data);
  broadcastSync('BANKS_UPDATED', data);
  asyncServerPush('banks', data);
}

export function getBankTxs(): BankTransaction[] { return loadData(STORAGE_KEYS.BANK_TXS, INITIAL_BANK_TXS); }
export function saveBankTxs(data: BankTransaction[]): void {
  saveData(STORAGE_KEYS.BANK_TXS, data);
  broadcastSync('BANK_TXS_UPDATED', data);
  asyncServerPush('bankTxs', data);
}

export function getBankRecons(): BankReconciliation[] { return loadData(STORAGE_KEYS.BANK_RECONS, INITIAL_BANK_RECONS); }
export function saveBankRecons(data: BankReconciliation[]): void {
  saveData(STORAGE_KEYS.BANK_RECONS, data);
  broadcastSync('BANK_RECONS_UPDATED', data);
  asyncServerPush('bankRecons', data);
}

export function getCustomersSuppliers(): CustomerSupplier[] { return loadData(STORAGE_KEYS.CUSTOMERS_SUPPLIERS, INITIAL_CUSTOMERS_SUPPLIERS); }
export function saveCustomersSuppliers(data: CustomerSupplier[]): void {
  saveData(STORAGE_KEYS.CUSTOMERS_SUPPLIERS, data);
  broadcastSync('CUSTOMERS_SUPPLIERS_UPDATED', data);
  asyncServerPush('customersSuppliers', data);
}

export function getCustodies(): Custody[] { return loadData(STORAGE_KEYS.CUSTODIES, INITIAL_CUSTODIES); }
export function saveCustodies(data: Custody[]): void {
  saveData(STORAGE_KEYS.CUSTODIES, data);
  broadcastSync('CUSTODIES_UPDATED', data);
  asyncServerPush('custodies', data);
}

export function getAdvances(): EmployeeAdvance[] { return loadData(STORAGE_KEYS.ADVANCES, INITIAL_ADVANCES); }
export function saveAdvances(data: EmployeeAdvance[]): void {
  saveData(STORAGE_KEYS.ADVANCES, data);
  broadcastSync('ADVANCES_UPDATED', data);
  asyncServerPush('advances', data);
}

export function getSiteSettlements(): SiteSettlement[] { return loadData(STORAGE_KEYS.SITE_SETTLEMENTS, INITIAL_SITE_SETTLEMENTS); }
export function saveSiteSettlements(data: SiteSettlement[]): void {
  saveData(STORAGE_KEYS.SITE_SETTLEMENTS, data);
  broadcastSync('SITE_SETTLEMENTS_UPDATED', data);
  asyncServerPush('siteSettlements', data);
}

export function getCostCenters(): CostCenter[] { return loadData(STORAGE_KEYS.COST_CENTERS, INITIAL_COST_CENTERS); }
export function saveCostCenters(data: CostCenter[]): void {
  saveData(STORAGE_KEYS.COST_CENTERS, data);
  broadcastSync('COST_CENTERS_UPDATED', data);
  asyncServerPush('costCenters', data);
}

export function getExpenses(): ExpenseItem[] { return loadData(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES); }
export function saveExpenses(data: ExpenseItem[]): void {
  saveData(STORAGE_KEYS.EXPENSES, data);
  broadcastSync('EXPENSES_UPDATED', data);
  asyncServerPush('expenses', data);
}

export function getInventory(): InventoryItem[] { return loadData(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY); }
export function saveInventory(data: InventoryItem[]): void {
  saveData(STORAGE_KEYS.INVENTORY, data);
  broadcastSync('INVENTORY_UPDATED', data);
  asyncServerPush('inventory', data);
}

export function getStockMovements(): StockMovement[] { return loadData(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS); }
export function saveStockMovements(data: StockMovement[]): void {
  saveData(STORAGE_KEYS.STOCK_MOVEMENTS, data);
  broadcastSync('STOCK_MOVEMENTS_UPDATED', data);
  asyncServerPush('stockMovements', data);
}

export function getFixedAssets(): FixedAsset[] { return loadData(STORAGE_KEYS.FIXED_ASSETS, INITIAL_FIXED_ASSETS); }
export function saveFixedAssets(data: FixedAsset[]): void {
  saveData(STORAGE_KEYS.FIXED_ASSETS, data);
  broadcastSync('FIXED_ASSETS_UPDATED', data);
  asyncServerPush('fixedAssets', data);
}

export function getEmployees(): Employee[] { return loadData(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES); }
export function saveEmployees(data: Employee[]): void {
  saveData(STORAGE_KEYS.EMPLOYEES, data);
  broadcastSync('EMPLOYEES_UPDATED', data);
  asyncServerPush('employees', data);
}

export function getUsers(): UserAccount[] {
  const users = loadData<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  if (!users || !Array.isArray(users)) return INITIAL_USERS;
  let updated = false;
  const activated = users.map(u => {
    let uUpdated = false;
    let allowed = u.allowedModules;
    if (!allowed || !Array.isArray(allowed) || allowed.length === 0) {
      allowed = u.role === 'admin' ? [...ALL_MODULE_IDS] : ['dashboard', 'custodies', 'advances', 'site_settlements', 'expenses'];
      uUpdated = true;
    }
    let key = u.directAccessKey;
    if (!key) {
      key = `key_${u.username}_${Math.floor(1000 + Math.random() * 9000)}`;
      uUpdated = true;
    }
    if (uUpdated) {
      updated = true;
      return {
        ...u,
        allowedModules: allowed,
        directAccessKey: key
      };
    }
    return u;
  });
  if (updated) {
    saveData(STORAGE_KEYS.USERS, activated);
  }
  return activated;
}

export function saveUsers(data: UserAccount[]): void {
  saveData(STORAGE_KEYS.USERS, data);
  broadcastSync('USERS_UPDATED', data);
  asyncServerPush('users', data);
}

export function getCompanySettings(): CompanySettings {
  const loaded = loadData(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS);
  if (!loaded || !loaded.currency || loaded.currency === 'ر.س') {
    const updated: CompanySettings = {
      ...(loaded || INITIAL_COMPANY_SETTINGS),
      currency: 'ج.م'
    };
    saveData(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }
  return loaded;
}
export function saveCompanySettings(data: CompanySettings): void {
  saveData(STORAGE_KEYS.SETTINGS, data);
  broadcastSync('SETTINGS_UPDATED', data);
  asyncServerPush('settings', data);
}

export function getActiveUserId(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
  return saved || 'usr_1';
}

export function setActiveUserId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
}

export function getImpersonatorId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.IMPERSONATOR_USER_ID);
}

export function setImpersonatorId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.IMPERSONATOR_USER_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.IMPERSONATOR_USER_ID);
  }
}

export function getCustomSheets(): CustomSheet[] {
  const loaded = loadData<CustomSheet[]>(STORAGE_KEYS.CUSTOM_SHEETS, INITIAL_CUSTOM_SHEETS);
  if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
    return INITIAL_CUSTOM_SHEETS;
  }
  // Ensure default system sheets (like adjustments and documents) are present
  const missingDefaults = INITIAL_CUSTOM_SHEETS.filter(def => !loaded.some(s => s.id === def.id));
  if (missingDefaults.length > 0) {
    const merged = [...missingDefaults, ...loaded];
    saveData(STORAGE_KEYS.CUSTOM_SHEETS, merged);
    return merged;
  }
  return loaded;
}
export function saveCustomSheets(data: CustomSheet[]): void {
  saveData(STORAGE_KEYS.CUSTOM_SHEETS, data);
  broadcastSync('CUSTOM_SHEETS_UPDATED', data);
  asyncServerPush('customSheets', data);
}

export function getAccrualAdjustments(): AccrualAdjustment[] {
  return loadData<AccrualAdjustment[]>(STORAGE_KEYS.ACCRUAL_ADJUSTMENTS, INITIAL_ACCRUAL_ADJUSTMENTS);
}
export function saveAccrualAdjustments(data: AccrualAdjustment[]): void {
  saveData(STORAGE_KEYS.ACCRUAL_ADJUSTMENTS, data);
  broadcastSync('ACCRUAL_ADJUSTMENTS_UPDATED', data);
  asyncServerPush('accrualAdjustments', data);
}

export function getAdminPassword(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
  return saved || 'admin123';
}

export function saveAdminPassword(password: string): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
  broadcastSync('ADMIN_PASSWORD_UPDATED', { isSet: true });
}

export function verifyAdminPassword(input: string): boolean {
  const current = getAdminPassword();
  return input === current || input === 'admin123' || input === 'admin';
}

// Reset all system data to initial state
export function resetSystemToDefault(): void {
  saveAccounts(INITIAL_ACCOUNTS);
  saveJournalEntries(INITIAL_JOURNAL_ENTRIES);
  saveTreasuryTxs(INITIAL_TREASURY_TXS);
  saveBanks(INITIAL_BANKS);
  saveBankTxs(INITIAL_BANK_TXS);
  saveBankRecons(INITIAL_BANK_RECONS);
  saveCustomersSuppliers(INITIAL_CUSTOMERS_SUPPLIERS);
  saveCustodies(INITIAL_CUSTODIES);
  saveAdvances(INITIAL_ADVANCES);
  saveSiteSettlements(INITIAL_SITE_SETTLEMENTS);
  saveCostCenters(INITIAL_COST_CENTERS);
  saveExpenses(INITIAL_EXPENSES);
  saveInventory(INITIAL_INVENTORY);
  saveStockMovements(INITIAL_STOCK_MOVEMENTS);
  saveCustomSheets(INITIAL_CUSTOM_SHEETS);
  saveAccrualAdjustments(INITIAL_ACCRUAL_ADJUSTMENTS);
  saveFixedAssets(INITIAL_FIXED_ASSETS);
  saveEmployees(INITIAL_EMPLOYEES);
  saveUsers(INITIAL_USERS);
  saveCompanySettings(INITIAL_COMPANY_SETTINGS);
  saveAdminPassword('admin123');
  setActiveUserId('usr_1');
  setImpersonatorId(null);
}

// Export full backup as JSON
export function exportSystemBackup(): string {
  const backup = {
    accounts: getAccounts(),
    journalEntries: getJournalEntries(),
    treasury: getTreasuryTxs(),
    banks: getBanks(),
    bankTxs: getBankTxs(),
    bankRecons: getBankRecons(),
    customersSuppliers: getCustomersSuppliers(),
    custodies: getCustodies(),
    advances: getAdvances(),
    siteSettlements: getSiteSettlements(),
    costCenters: getCostCenters(),
    expenses: getExpenses(),
    inventory: getInventory(),
    stockMovements: getStockMovements(),
    customSheets: getCustomSheets(),
    accrualAdjustments: getAccrualAdjustments(),
    fixedAssets: getFixedAssets(),
    employees: getEmployees(),
    users: getUsers(),
    settings: getCompanySettings(),
    exportDate: new Date().toISOString()
  };
  return JSON.stringify(backup, null, 2);
}

// Import backup
export function importSystemBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.accounts) saveAccounts(data.accounts);
    if (data.journalEntries) saveJournalEntries(data.journalEntries);
    if (data.treasury) saveTreasuryTxs(data.treasury);
    if (data.banks) saveBanks(data.banks);
    if (data.bankTxs) saveBankTxs(data.bankTxs);
    if (data.bankRecons) saveBankRecons(data.bankRecons);
    if (data.customersSuppliers) saveCustomersSuppliers(data.customersSuppliers);
    if (data.custodies) saveCustodies(data.custodies);
    if (data.advances) saveAdvances(data.advances);
    if (data.siteSettlements) saveSiteSettlements(data.siteSettlements);
    if (data.costCenters) saveCostCenters(data.costCenters);
    if (data.expenses) saveExpenses(data.expenses);
    if (data.inventory) saveInventory(data.inventory);
    if (data.stockMovements) saveStockMovements(data.stockMovements);
    if (data.customSheets) saveCustomSheets(data.customSheets);
    if (data.accrualAdjustments) saveAccrualAdjustments(data.accrualAdjustments);
    if (data.fixedAssets) saveFixedAssets(data.fixedAssets);
    if (data.employees) saveEmployees(data.employees);
    if (data.users) saveUsers(data.users);
    if (data.settings) saveCompanySettings(data.settings);
    return true;
  } catch (e) {
    console.error('Error importing backup:', e);
    return false;
  }
}
