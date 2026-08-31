export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountSubType = 'current_asset' | 'fixed_asset' | 'bank' | 'cash' | 'customer' | 'supplier' | 'current_liability' | 'long_term_liability' | 'capital' | 'retained_earnings' | 'operating_revenue' | 'other_revenue' | 'operating_expense' | 'admin_expense' | 'marketing_expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  initialBalance: number; // رصيد افتتاحي (مدين موجب، دائن سالب أو حسب الطبيعة)
  currentBalance: number; // الرصيد الحالي بعد الترحيل
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number; // مدين
  credit: number; // دائن
  description: string;
  costCenterId?: string; // مركز التكلفة / المشروع
  checkNumber?: string; // رقم الشيك / الحوالة عند اختيار حساب بنك
  dueDate?: string; // تاريخ استحقاق الشيك (اختياري)
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // رقم القيد (يدوي أو تلقائي)
  date: string;
  fiscalYear: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean; // تم الترحيل للحسابات
  createdBy: string;
  referenceType?: 'manual' | 'invoice' | 'expense' | 'treasury' | 'bank' | 'payroll' | 'custody' | 'site_settlement' | 'adjustment';
  referenceId?: string;
  checkNumber?: string; // رقم الشيك العام إن وجد
}

export interface TreasuryTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: 'in' | 'out'; // وارد (مدين للخزينة) / صادر (دائن للخزينة)
  amount: number;
  category: 'expense' | 'revenue' | 'customer_payment' | 'supplier_payment' | 'custody' | 'advance' | 'transfer' | 'site_settlement' | 'other';
  relatedParty?: string; // اسم العميل/المورد/الموظف
  description: string;
  accountId?: string; // الحساب المقابل في دليل الحسابات
  costCenterId?: string;
  enteredBy: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  branch: string;
  notes?: string;
  minThreshold?: number; // الحد الأدنى المسموح به للرصيد البنكي للتنبيه
  warningThreshold?: number; // حد التحذير المبكر
  alertRecipientPhone?: string; // رقم هاتف مسؤول الحساب للتنبيهات
}

export interface SystemAlert {
  id: string;
  type: 'bank_low_balance' | 'payment_due' | 'receivable_overdue' | 'advance_due' | 'custody_due' | 'inventory_low' | 'settlement_due' | 'accrual_due';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  date: string;
  dueDate?: string;
  amount?: number;
  threshold?: number;
  currency?: string;
  relatedEntityName?: string;
  relatedEntityId?: string;
  relatedModule?: string;
  isRead?: boolean;
  isDismissed?: boolean;
  phoneForWhatsApp?: string;
}

export interface NotificationSettings {
  defaultBankThreshold: number; // e.g. 50000
  enableWhatsAppAlerts: boolean;
  enableDashboardPopups: boolean;
  managerPhone: string; // رقم هاتف المسؤول العام عن التنبيهات
  accountantPhone?: string; // رقم هاتف المحاسب للتنبيهات
  dueDaysNotice: number; // عدد أيام الإشعار المسبق
  alertOnInventoryLow: boolean;
  alertOnCustodyDelay: boolean;
  alertOnOverdueReceivables: boolean;
}

export type Language = 'ar' | 'en' | 'de';

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest';
  amount: number;
  referenceNumber: string; // رقم الشيك أو الإيصال
  checkNumber?: string; // رقم الشيك إن وجد
  beneficiary?: string; // الطرف المستفيد
  source?: string; // المصدر
  description: string;
  isReconciled: boolean; // تم عمل تسوية بنكية له
}

export interface BankReconciliation {
  id: string;
  bankAccountId: string;
  date: string;
  statementBalance: number; // رصيد كشف الحساب البنكي
  bookBalance: number; // الرصيد الدفتري في النظام
  difference: number;
  reconciledItemsCount: number;
  notes: string;
  status: 'balanced' | 'discrepancy';
}

export interface CustomerSupplier {
  id: string;
  type: 'customer' | 'supplier';
  code: string;
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  taxNumber?: string;
  address?: string;
  openingBalance: number; // موجب للمدين، سالب للدائن
  currentBalance: number;
  creditLimit?: number;
  notes?: string;
}

// =================== شيت وبنود العهد النقدية والتسوية ===================
export interface CustodyInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  taxAmount: number;
  total: number;
  supplierName?: string;
  notes?: string;
}

export interface Custody {
  id: string;
  custodyNumber?: string;
  employeeId: string;
  employeeName: string;
  employeePhone?: string;
  amount: number;
  dateGiven: string;
  purpose: string;
  type?: 'temporary' | 'permanent'; // عهدة مؤقتة / عهدة مستديمة
  costCenterId?: string;
  costCenterName?: string;
  status: 'active' | 'partially_settled' | 'closed';
  settledAmount: number;
  remainingAmount: number;
  notes?: string;
  invoices?: CustodyInvoiceItem[];
  settlementDate?: string;
  closedBy?: string;
}

// =================== شيت وأقساط سلف الموظفين ===================
export interface AdvanceRepaymentRecord {
  id: string;
  date: string;
  amount: number;
  deductionType: 'salary_deduction' | 'cash' | 'bank_transfer';
  notes?: string;
  receiptNumber?: string;
}

export interface EmployeeAdvance {
  id: string;
  advanceNumber?: string;
  employeeId: string;
  employeeName: string;
  employeePhone?: string;
  amount: number;
  date: string;
  monthlyDeduction: number;
  repaidAmount: number;
  remainingAmount: number;
  installmentsCount?: number;
  repayments?: AdvanceRepaymentRecord[];
  status: 'active' | 'paid';
  reason?: string;
}

// =================== شيت تسوية الموقع والمشاريع الميدانية ===================
export interface SiteExpenseItem {
  id: string;
  date: string;
  type: 'material' | 'labor' | 'equipment' | 'misc';
  description: string;
  amount: number;
  recipient: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface SiteSettlement {
  id: string;
  settlementNumber: string;
  siteName: string;
  costCenterId?: string;
  supervisorName: string;
  supervisorPhone?: string;
  date: string;
  periodFrom?: string;
  periodTo?: string;
  openingCash: number; // النقدية الافتتاحية للموقع
  transfersReceived: number; // الدفعات والتحويلات المستلمة
  totalReceived: number; // إجمالي المتاح
  materialExpenses: number; // مشتريات مواد
  laborExpenses: number; // يوميات عمال ومقاولين
  operationalExpenses: number; // تشغيل ونثريات
  otherExpenses?: number; // بند آخر / مصروفات متنوعة
  otherExpenseLabel?: string; // مسمى البند الآخر (مثال: نثريات وضيافة، رسوم وتصاريح)
  totalSpent: number; // إجمالي المصروف
  expectedClosingBalance: number; // الرصيد الدفتري المتبقي
  actualCashInHand: number; // النقدية الفعلية بالموقع (الجرد)
  discrepancy: number; // الفارق (فائض/عجز)
  status: 'draft' | 'under_review' | 'approved' | 'settled';
  notes?: string;
  items?: SiteExpenseItem[];
  approvedBy?: string;
  approvedDate?: string;
}

// =================== شيت التسويات الجردية الدورية ===================
export type AccrualAdjustmentType = 'accrued_expense' | 'prepaid_expense' | 'accrued_revenue' | 'unearned_revenue';

export interface AccrualAdjustment {
  id: string;
  code: string; // كود التسوية مثلا ADJ-2026-001
  type: AccrualAdjustmentType; // المصروفات المستحقة، المصروفات المدفوعة مقدما، الإيرادات المستحقة، الإيرادات المقبوضة مقدما
  title: string; // بيان البند مثلا: إيجار مستودع مدفوع مقدما
  totalAmount: number; // القيمة الإجمالية
  amortizedAmount: number; // المسوى / المستهلك حتى الآن
  remainingAmount: number; // المتبقي تسويته
  startDate: string; // تاريخ البداية
  dueDate: string; // تاريخ الاستحقاق / نهاية الفترة
  expenseOrRevenueAccountId: string; // حساب المصروف أو الإيراد المرتبط
  expenseOrRevenueAccountName?: string;
  adjustmentAccountId?: string; // حساب التسوية الجردية (المصروف المقدم/المستحق، الإيراد المقدم/المستحق)
  costCenterId?: string;
  costCenterName?: string;
  status: 'active' | 'partially_adjusted' | 'settled';
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

// =================== شيت المستندات والفواتير والأرشيف ===================
export type DocumentCategory = 'purchase_invoice' | 'sales_invoice' | 'payment_voucher' | 'receipt_voucher' | 'bank_notice' | 'contract' | 'settlement' | 'other';

export interface DocumentInvoiceRecord {
  id: string;
  entryNumber: string; // رقم القيد
  date: string; // التاريخ
  documentType: DocumentCategory; // نوع المستند
  title: string; // البيان والوصف
  entityName: string; // اسم العميل / المورد / الجهة
  amount: number; // المبلغ قبل الضريبة
  taxAmount: number; // مبلغ الضريبة
  totalAmount: number; // المبلغ الإجمالي
  currency: string;
  imageUrl?: string; // رابط أو بيانات صورة المستند
  attachmentName?: string;
  relatedAccountId?: string;
  costCenterId?: string;
  notes?: string;
  createdAt: string;
  uploadedBy?: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  manager?: string;
  budget?: number;
  status: 'active' | 'completed' | 'on_hold';
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  subCategory?: string;
  subcategory?: string;
  amount: number;
  taxRate?: number;
  taxAmount: number;
  totalWithTax: number;
  paymentMethod: 'cash' | 'bank' | 'credit' | 'custody';
  payee: string; // المستفيد
  description: string;
  costCenterId?: string;
  costCenterName?: string;
  receiptNumber?: string;
  isRecurring: boolean;
  enteredBy?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string; // قطعة، كجم، لتر، كرتونة
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation?: string;
  totalValue: number; // currentStock * purchasePrice
  notes?: string;
}

export type StockMovementType = 'in' | 'out' | 'adjustment';

export interface StockMovement {
  id: string;
  movementNumber: string; // رقم إذن الإضافة / الصرف / التسوية
  date: string;
  type: StockMovementType; // 'in': إذن إضافة / توريد, 'out': إذن صرف, 'adjustment': تسوية جردية
  itemId: string;
  itemName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  warehouseLocation?: string;
  costCenterId?: string;
  costCenterName?: string;
  recipientOrSupplier?: string; // المورد (في الوارد) / المستلم أو المهندس (في المنصرف)
  referenceDocument?: string; // رقم الفاتورة أو أمر الصرف أو التوريد
  notes?: string;
  enteredBy?: string;
  createdAt?: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: 'vehicles' | 'machines' | 'equipment' | 'buildings' | 'computers' | 'furniture';
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number; // قيمة الخردة في نهاية العمر
  usefulLifeYears: number;
  depreciationRate: number; // نسبة الإهلاك السنوي %
  accumulatedDepreciation: number; // مجمع الإهلاك
  netBookValue: number; // صافي القيمة الدفترية
  location?: string;
  status: 'active' | 'maintenance' | 'disposed';
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  department: string;
  position: string;
  joinDate: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  insuranceDeduction: number;
  advanceDeduction?: number; // خصم السلف الشهري (قسط السلفة المسترد)
  otherDeductions?: number; // خصومات أخرى (غياب، تأخير، جزاءات إدارية)
  status: 'active' | 'on_leave' | 'terminated';
  phone?: string;
  email?: string;
  bankAccount?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'accountant' | 'cashier' | 'auditor' | 'hr_manager' | 'site_engineer';
  email: string;
  phone?: string;
  isActive: boolean;
  directAccessKey?: string;
  allowedModules?: string[]; // وحدات النظام المصرح بدخولها
  permissions: {
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPost: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canExport?: boolean;
    canSettle?: boolean;
  };
}

export interface SheetColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date';
  width?: number;
}

export interface CustomSheet {
  id: string;
  title: string;
  description?: string;
  category: string;
  columns: SheetColumn[];
  rows: Array<Record<string, any>>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notes?: string;
}

export interface AdminSecuritySettings {
  adminPasswordHash?: string;
  adminPin?: string;
  isPasswordSet: boolean;
  lockTimeoutMinutes?: number;
}

export interface CompanySettings {
  companyName: string;
  companyNameEn?: string;
  taxNumber: string;
  commercialRegister: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  currency: string;
  fiscalYearStart: string; // e.g. "01-01"
  fiscalYearEnd: string;   // e.g. "12-31"
  defaultTaxRate: number;  // e.g. 15 for 15% VAT
  logoUrl?: string;
  language?: 'ar' | 'en';
  adminPassword?: string;
  notificationSettings?: NotificationSettings;
}

export interface GlobalFilterState {
  searchQuery: string;
  fiscalYear: string;
  startDate: string;
  endDate: string;
}
