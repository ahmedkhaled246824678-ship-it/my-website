export type Language = 'ar' | 'en' | 'de';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

export interface Translations {
  [key: string]: {
    ar: string;
    en: string;
    de: string;
  };
}

export const translations: Translations = {
  // Navigation & Modules
  app_name: {
    ar: 'نظام الرؤية المتكامل للمحاسبة والمشاريع',
    en: 'Al-Roeya Integrated ERP & Accounting',
    de: 'Al-Roeya Integriertes ERP & Buchhaltungssystem'
  },
  dashboard: {
    ar: 'لوحة القيادة والتحليل',
    en: 'Dashboard & Analytics',
    de: 'Dashboard & Finanzanalyse'
  },
  custom_sheets: {
    ar: 'شيتات إكسيل تفاعلية ونماذج',
    en: 'Excel Spreadsheets & Sheets',
    de: 'Interaktive Excel-Tabellen & Vorlagen'
  },
  accrual_adjustments: {
    ar: 'التسويات الجردية الدورية',
    en: 'Period & Accrual Adjustments',
    de: 'Rechnungsabgrenzung & Rückstellungen'
  },
  documents_invoices: {
    ar: 'شيت المستندات والفواتير',
    en: 'Documents & Invoices Archive',
    de: 'Belegarchiv & Rechnungen'
  },
  chart_of_accounts: {
    ar: 'دليل الحسابات التفصيلي',
    en: 'Chart of Accounts',
    de: 'Kontenplan (SKR)'
  },
  journal_entries: {
    ar: 'القيود اليومية والترحيل',
    en: 'Journal Entries & Posting',
    de: 'Journalbuchungen & Buchungssätze'
  },
  treasury_banks: {
    ar: 'الخزينة والبنوك والتسوية',
    en: 'Treasury & Bank Accounts',
    de: 'Kasse, Bankkonten & Abstimmung'
  },
  custodies: {
    ar: 'شيت وإدارة العهد النقدية والتسوية',
    en: 'Petty Cash & Custody Sheets',
    de: 'Handkasse & Kassenabrechnung'
  },
  advances: {
    ar: 'شيت وإدارة سلف الموظفين والأقساط',
    en: 'Employee Advances & Installments',
    de: 'Mitarbeitervorschüsse & Raten'
  },
  site_settlements: {
    ar: 'شيت تسوية الموقع والمشاريع الميدانية',
    en: 'Site & Field Project Settlements',
    de: 'Baustellen- & Projektabrechnung'
  },
  customers_suppliers: {
    ar: 'العملاء والموردون وكشوف الحساب',
    en: 'Customers & Suppliers Statements',
    de: 'Debitoren & Kreditoren (Kunden/Lieferanten)'
  },
  expenses: {
    ar: 'شيت تفصيلي لكل المصروفات',
    en: 'Detailed Expenses Sheet',
    de: 'Detaillierte Betriebsausgaben'
  },
  cost_centers: {
    ar: 'مراكز التكلفة وإدارة المشاريع',
    en: 'Cost Centers & Projects',
    de: 'Kostenstellen & Projekte'
  },
  inventory: {
    ar: 'المخزون والأصناف والمستودعات',
    en: 'Inventory & Warehouses',
    de: 'Inventar & Lagerverwaltung'
  },
  fixed_assets: {
    ar: 'الأصول الثابتة وحساب الإهلاك',
    en: 'Fixed Assets & Depreciation',
    de: 'Anlagevermögen & Abschreibung'
  },
  hr: {
    ar: 'الموارد البشرية ومسيرات الرواتب',
    en: 'HR & Payroll Management',
    de: 'Personalwesen & Gehaltsabrechnung'
  },
  financial_reports: {
    ar: 'القوائم المالية والضرائب وميزان المراجعة',
    en: 'Financial Reports & Tax (BWA)',
    de: 'Finanzberichte, GuV, Bilanz & BWA'
  },
  financial_analysis: {
    ar: 'التحليل المالي الذكي (AI)',
    en: 'Smart Financial AI Analysis',
    de: 'Intelligente KI-Finanzanalyse'
  },
  users_management: {
    ar: 'إدارة المستخدمين والصلاحيات والروابط',
    en: 'User Management & Permissions',
    de: 'Benutzerverwaltung & Zugriffsrechte'
  },
  company_settings: {
    ar: 'إعدادات الشركة والعملة والسنة المالية',
    en: 'Company Settings & Currency',
    de: 'Unternehmenseinstellungen & Währung'
  },

  // General Groups & Actions
  search_placeholder: {
    ar: 'بحث شامل: رقم القيد، اسم الحساب، العميل، التاريخ، أو المبلغ...',
    en: 'Search: entry #, account, customer, date, amount...',
    de: 'Globale Suche: Belegnr., Konto, Kunde, Datum, Betrag...'
  },
  general_group: {
    ar: 'الرئيسية والمساعدات',
    en: 'General & Tools',
    de: 'Übersicht & Werkzeuge'
  },
  field_projects_group: {
    ar: 'المشاريع والميدان',
    en: 'Field & Projects',
    de: 'Baustellen & Projekte'
  },
  accounting_group: {
    ar: 'الأستاذ العام والمحاسبة',
    en: 'General Ledger & Accounting',
    de: 'Hauptbuch & Finanzbuchhaltung'
  },
  operations_group: {
    ar: 'التعاملات والمصروفات',
    en: 'Operations & Expenses',
    de: 'Geschäftsvorfälle & Aufwendungen'
  },
  assets_inventory_group: {
    ar: 'الأصول والمخزون',
    en: 'Assets & Inventory',
    de: 'Anlagevermögen & Lager'
  },
  hr_group: {
    ar: 'الموارد البشرية',
    en: 'Human Resources',
    de: 'Personalwesen (HR)'
  },
  reports_group: {
    ar: 'التقارير والتحليل',
    en: 'Reports & Analytics',
    de: 'Berichte & Auswertungen'
  },
  system_group: {
    ar: 'إدارة النظام',
    en: 'System Administration',
    de: 'Systemadministration'
  },
  add: { ar: 'إضافة جديد', en: 'Add New', de: 'Neu hinzufügen' },
  edit: { ar: 'تعديل', en: 'Edit', de: 'Bearbeiten' },
  delete: { ar: 'حذف', en: 'Delete', de: 'Löschen' },
  save: { ar: 'حفظ البيانات', en: 'Save', de: 'Speichern' },
  cancel: { ar: 'إلغاء', en: 'Cancel', de: 'Abbrechen' },
  search: { ar: 'بحث شامل...', en: 'Global Search...', de: 'Suchen...' },
  print: { ar: 'طباعة التقرير', en: 'Print Report', de: 'Bericht drucken' },
  export_excel: { ar: 'تصدير إكسيل', en: 'Export Excel', de: 'Excel-Export' },
  export_pdf: { ar: 'تصدير PDF', en: 'Export PDF', de: 'PDF-Export' },
  whatsapp_share: { ar: 'إرسال عبر واتساب', en: 'Share via WhatsApp', de: 'Per WhatsApp teilen' },
  settle: { ar: 'تسوية وإقفال', en: 'Settle & Close', de: 'Abstimmen & Abschließen' },
  status: { ar: 'الحالة', en: 'Status', de: 'Status' },
  actions: { ar: 'العمليات', en: 'Actions', de: 'Aktionen' },
  date: { ar: 'التاريخ', en: 'Date', de: 'Datum' },
  amount: { ar: 'المبلغ', en: 'Amount', de: 'Betrag' },
  currency: { ar: 'العملة', en: 'Currency', de: 'Währung' },
  notes: { ar: 'ملاحظات', en: 'Notes', de: 'Anmerkungen' },
  refresh: { ar: 'تحديث البيانات', en: 'Refresh Data', de: 'Daten aktualisieren' },
  access_denied: { ar: 'غير مصرح بالدخول', en: 'Access Denied', de: 'Zugriff verweigert' },
  access_denied_msg: {
    ar: 'ليس لديك الصلاحيات الكافية للوصول إلى هذه الوحدة. يرجى التواصل مع مدير النظام لتفعيل الصلاحية.',
    en: 'You do not have sufficient permissions to access this module. Please contact the system administrator.',
    de: 'Sie verfügen nicht über ausreichende Berechtigungen für dieses Modul. Bitte kontaktieren Sie den Administrator.'
  },

  // Accrual Adjustments (التسويات الجردية)
  accrual_adjustments_title: {
    ar: 'شيت التسويات الجردية الدورية والتسويات الختامية',
    en: 'Period & Year-End Accrual Adjustments Sheet',
    de: 'Rechnungsabgrenzungsposten & Periodenabschluss'
  },
  accrued_expenses: {
    ar: 'المصروفات المستحقة',
    en: 'Accrued Expenses',
    de: 'Noch nicht bezahlte Aufwendungen / Rückstellungen'
  },
  prepaid_expenses: {
    ar: 'المصروفات المدفوعة مقدماً',
    en: 'Prepaid Expenses',
    de: 'Aktive Rechnungsabgrenzung (ARA)'
  },
  accrued_revenues: {
    ar: 'الإيرادات المستحقة',
    en: 'Accrued Revenues',
    de: 'Noch nicht erhaltene Erträge / Forderungen'
  },
  unearned_revenues: {
    ar: 'الإيرادات المقبوضة مقدماً',
    en: 'Unearned / Deferred Revenues',
    de: 'Passive Rechnungsabgrenzung (PRA)'
  },
  generate_adjustment_entry: {
    ar: 'توليد قيد التسوية آلياً',
    en: 'Generate Journal Entry Auto',
    de: 'Abgrenzungsbuchung automatisch erzeugen'
  },
  amortized_amount: {
    ar: 'المسوى والمستهلك',
    en: 'Amortized Amount',
    de: 'Bereits abgegrenzt'
  },
  remaining_adjustment: {
    ar: 'المتبقي للتسوية',
    en: 'Remaining to Amortize',
    de: 'Verbleibender Abgrenzungsbetrag'
  },

  // Documents & Invoices Archive (المستندات والفواتير)
  documents_archive_title: {
    ar: 'شيت المستندات والفواتير والأرشيف الإلكتروني',
    en: 'Electronic Documents & Invoices Archive Sheet',
    de: 'Elektronisches Belegarchiv & Rechnungen'
  },
  print_document_voucher: {
    ar: 'طباعة المستند / الفاتورة',
    en: 'Print Document / Voucher',
    de: 'Beleg / Rechnung drucken'
  },
  document_image_preview: {
    ar: 'صورة المستند / المرفق',
    en: 'Document / Invoice Image',
    de: 'Belegbild / Anhang'
  },
  upload_attachment: {
    ar: 'رفع صورة المستند أو الفاتورة',
    en: 'Upload Document / Invoice Image',
    de: 'Belegbild hochladen'
  },
  voucher_number: {
    ar: 'رقم السند / القيد',
    en: 'Voucher / Entry #',
    de: 'Beleg- / Buchungsnummer'
  },

  // Site Settlements & Other Expenses
  other_expenses: {
    ar: 'بند آخر / مصروفات متنوعة',
    en: 'Other Expenses / Misc',
    de: 'Sonstige Aufwendungen / Diverses'
  },
  other_expense_name: {
    ar: 'مسمى البند الآخر',
    en: 'Other Expense Description',
    de: 'Bezeichnung sonstiger Aufwand'
  },
  site_settlements_title: {
    ar: 'شيت تسوية الموقع والمشاريع الميدانية',
    en: 'Site & Field Project Settlements',
    de: 'Baustellen- & Projektabrechnung'
  },
  new_site_settlement: {
    ar: 'تسوية موقع جديدة',
    en: 'New Site Settlement',
    de: 'Neue Baustellenabrechnung'
  },
  site_name: {
    ar: 'اسم الموقع / المشروع',
    en: 'Site / Project Name',
    de: 'Projekt- / Baustellenname'
  },
  site_supervisor: {
    ar: 'المشرف الميداني / المهندس',
    en: 'Site Supervisor / Engineer',
    de: 'Bauleiter / Verantwortlicher'
  },
  opening_cash: {
    ar: 'النقدية الافتتاحية للموقع',
    en: 'Site Opening Cash',
    de: 'Anfangsbestand Baustellenkasse'
  },
  transfers_received: {
    ar: 'الدفعات والتحويلات المستلمة',
    en: 'Transfers Received',
    de: 'Erhaltene Überweisungen / Einzahlungen'
  },
  total_site_funds: {
    ar: 'إجمالي المتاح بالموقع',
    en: 'Total Available Funds',
    de: 'Gesamte verfügbare Mittel'
  },
  site_expenses: {
    ar: 'مصروفات ومشتريات الموقع',
    en: 'Site Expenses & Purchases',
    de: 'Baustellenausgaben & Einkäufe'
  },
  material_expenses: {
    ar: 'مشتريات مواد طارئة',
    en: 'Emergency Materials',
    de: 'Materialeinkauf vor Ort'
  },
  labor_expenses: {
    ar: 'يوميات عمالة ومقاولين',
    en: 'Labor & Subcontractors',
    de: 'Lohnaufwand & Nachunternehmer'
  },
  operational_expenses: {
    ar: 'مصاريف تشغيلية ونثريات',
    en: 'Operational & Misc',
    de: 'Betriebskosten & Sonstiges'
  },
  total_spent: {
    ar: 'إجمالي المصروف بالموقع',
    en: 'Total Spent on Site',
    de: 'Gesamtausgaben Baustelle'
  },
  expected_balance: {
    ar: 'الرصيد الدفتري المتبقي',
    en: 'Expected Book Balance',
    de: 'Soll-Endbestand Kasse'
  },
  actual_cash: {
    ar: 'الرصيد الفعلي بالموقع (الجرد)',
    en: 'Actual Physical Cash',
    de: 'Tatsächlicher Ist-Bestand (Zählung)'
  },
  difference_surplus_deficit: {
    ar: 'الفارق (فائض / عجز)',
    en: 'Difference (Surplus / Deficit)',
    de: 'Differenz (Überschuss / Fehlbetrag)'
  },
  settlement_status: {
    ar: 'حالة التسوية',
    en: 'Settlement Status',
    de: 'Abrechnungsstatus'
  },
  approve_settlement: {
    ar: 'اعتماد وإقفال تسوية الموقع',
    en: 'Approve & Close Site Settlement',
    de: 'Baustellenabrechnung freigeben'
  },

  // Inventory Enhancements
  inventory_items_title: {
    ar: 'دليل وأرصدة الأصناف بالمستودعات',
    en: 'Warehouse Stock & Item Catalog',
    de: 'Warenbestand & Artikelkatalog'
  },
  stock_in_btn: {
    ar: 'إضافة وارد للمخزن',
    en: 'Stock In (Inward)',
    de: 'Wareneingang buchen'
  },
  stock_out_btn: {
    ar: 'صرف من المخزن',
    en: 'Stock Out (Disburse)',
    de: 'Warenausgang buchen'
  },
  stock_movements_log: {
    ar: 'سجل حركات المخزن',
    en: 'Stock Movements Log',
    de: 'Lagerbewegungsprotokoll'
  },
  new_item_btn: {
    ar: 'تعريف صنف جديد',
    en: 'New Item Definition',
    de: 'Neuen Artikel anlegen'
  },
  stock_in_modal_title: {
    ar: 'إذن إضافة بضاعة / توريد مخزني (Stock In)',
    en: 'Stock Inward Voucher (In)',
    de: 'Wareneingangsbeleg (Zugang)'
  },
  stock_out_modal_title: {
    ar: 'إذن صرف بضاعة / مواد لمشروع (Stock Out)',
    en: 'Stock Outward Voucher (Disburse)',
    de: 'Warenausgangsbeleg (Entnahme)'
  },
  stock_history_title: {
    ar: 'سجل وتاريخ حركات المستودعات الواردة والمنصرفة',
    en: 'Warehouse Inward & Outward Movements History',
    de: 'Verlauf der Lagerzu- und abgänge'
  },
  item_code: { ar: 'كود الصنف / SKU', en: 'Item SKU / Code', de: 'Artikelnummer / SKU' },
  item_name: { ar: 'اسم الصنف', en: 'Item Name', de: 'Artikelbezeichnung' },
  quantity: { ar: 'الكمية', en: 'Quantity', de: 'Menge' },
  unit_price: { ar: 'سعر الوحدة', en: 'Unit Price', de: 'Einzelpreis' },
  total_value: { ar: 'القيمة الإجمالية', en: 'Total Value', de: 'Gesamtwert' },
  warehouse_location: { ar: 'المستودع / الموقع', en: 'Warehouse / Location', de: 'Lagerort / Standort' },
  recipient_supplier: { ar: 'المستلم / المورد', en: 'Recipient / Supplier', de: 'Empfänger / Lieferant' },
  reference_doc: { ar: 'رقم المستند المرجعي', en: 'Reference Document #', de: 'Referenzbelegnummer' },

  // Journal Entries & Check Number
  journal_entries_title: {
    ar: 'دفتر القيود اليومية المحاسبية',
    en: 'General Journal Entries Book',
    de: 'Hauptbuch & Journalbuchungen'
  },
  new_journal_entry: {
    ar: 'تسجيل قيد محاسبي جديد',
    en: 'New Journal Entry',
    de: 'Neuen Buchungssatz anlegen'
  },
  entry_number: { ar: 'رقم القيد', en: 'Entry Number', de: 'Buchungsnummer' },
  debit: { ar: 'مدين', en: 'Debit', de: 'Soll' },
  credit: { ar: 'دائن', en: 'Credit', de: 'Haben' },
  check_number: { ar: 'رقم الشيك البنكي', en: 'Bank Check #', de: 'Schecknummer' },
  check_number_short: { ar: 'رقم الشيك', en: 'Check #', de: 'Scheck-Nr.' },
  bank_account: { ar: 'حساب البنك', en: 'Bank Account', de: 'Bankkonto' },
  is_balanced: { ar: 'القيد متزن', en: 'Entry Balanced', de: 'Buchung ausgeglichen' },
  is_unbalanced: { ar: 'القيد غير متزن', en: 'Entry Unbalanced', de: 'Buchung unausgeglichen' },

  // Excel & Sheets
  add_sheet: { ar: 'إضافة شيت', en: 'Add Sheet', de: 'Tabelle hinzufügen' },
  new_sheet_excel: { ar: 'إنشاء شيت إكسيل جديد', en: 'New Excel Sheet', de: 'Neue Excel-Tabelle erstellen' },
  import_excel: { ar: 'استيراد ملف Excel', en: 'Import Excel (.xlsx)', de: 'Excel-Datei importieren' },
  export_excel_btn: { ar: 'تصدير Excel (.xlsx)', en: 'Export Excel (.xlsx)', de: 'Excel exportieren' },
  saved_sheets: { ar: 'الشيتات المحفوظة', en: 'Saved Spreadsheets', de: 'Gespeicherte Tabellen' },
  sheet_name: { ar: 'اسم الشيت', en: 'Sheet Title', de: 'Tabellenname' },
  sheet_category: { ar: 'التصنيف', en: 'Category', de: 'Kategorie' },
  add_row: { ar: 'إضافة صف', en: 'Add Row', de: 'Zeile hinzufügen' },
  add_column: { ar: 'إضافة عمود', en: 'Add Column', de: 'Spalte hinzufügen' },

  // Admin Password & Security
  admin_password_title: {
    ar: 'كلمة مرور مدير النظام (Admin Password)',
    en: 'System Administrator Password',
    de: 'Administrator-Passwort'
  },
  set_admin_password: {
    ar: 'تعيين / تغيير باسورد المدير',
    en: 'Set / Change Admin Password',
    de: 'Admin-Passwort festlegen/ändern'
  },
  enter_admin_password: {
    ar: 'يرجى إدخال باسورد مدير النظام للمتابعة',
    en: 'Please enter Administrator Password to continue',
    de: 'Bitte Admin-Passwort eingeben'
  },
  admin_password_label: { ar: 'كلمة المرور الحالية', en: 'Current Password', de: 'Aktuelles Passwort' },
  admin_new_password: { ar: 'كلمة المرور الجديدة', en: 'New Password', de: 'Neues Passwort' },
  admin_confirm_password: { ar: 'تأكيد كلمة المرور', en: 'Confirm Password', de: 'Passwort bestätigen' },
  password_set_success: {
    ar: 'تم تحديث كلمة مرور مدير النظام بنجاح!',
    en: 'Admin password updated successfully!',
    de: 'Administrator-Passwort erfolgreich aktualisiert!'
  },
  incorrect_password: {
    ar: 'كلمة المرور غير صحيحة، يرجى المحاولة ثانية',
    en: 'Incorrect password, please try again',
    de: 'Falsches Passwort, bitte erneut versuchen'
  },
  admin_protected_action: {
    ar: 'هذا الإجراء محمي بكلمة مرور مدير النظام',
    en: 'This action is protected by admin password',
    de: 'Diese Aktion ist durch ein Admin-Passwort geschützt'
  },

  // User & RBAC
  logged_in_as: { ar: 'المستخدم الحالي', en: 'Current User', de: 'Angemeldet als' },
  admin: { ar: 'مدير النظام (Admin)', en: 'System Administrator', de: 'Systemadministrator' },
  accountant: { ar: 'محاسب مالي', en: 'Financial Accountant', de: 'Finanzbuchhalter' },
  cashier: { ar: 'أمين صندوق', en: 'Cashier', de: 'Kassierer' },
  auditor: { ar: 'مراجع مالي', en: 'Auditor', de: 'Wirtschaftsprüfer' },
  hr_manager: { ar: 'مدير موارد بشرية', en: 'HR Manager', de: 'Personalmanager' },
  site_engineer: { ar: 'مهندس موقع', en: 'Site Engineer', de: 'Bauingenieur' },
  switch_user: { ar: 'التبديل والدخول بحساب المستخدم', en: 'Switch / Impersonate User', de: 'Benutzer wechseln' },
  switch_back_admin: { ar: 'العودة لحساب مدير النظام', en: 'Switch Back to Admin', de: 'Zurück zum Admin-Konto' },
  user_direct_link: { ar: 'رابط الدخول المباشر للمستخدم', en: 'Direct User Access Link', de: 'Direktzugriffslink' },
  copy_link: { ar: 'نسخ الرابط', en: 'Copy Link', de: 'Link kopieren' },
  link_copied: { ar: 'تم نسخ رابط المستخدم بنجاح!', en: 'User access link copied successfully!', de: 'Link erfolgreich kopiert!' },
  impersonation_banner: {
    ar: 'تنبيه: أنت تتصفح النظام حالياً بصلاحيات المستخدم',
    en: 'Notice: You are currently impersonating user',
    de: 'Hinweis: Sie agieren derzeit als Benutzer'
  },

  // Custodies & Settlements
  custody_title: {
    ar: 'سجل وشيت تسوية العهد النقدية',
    en: 'Petty Cash Custody & Settlement Sheet',
    de: 'Kassenabrechnung & Handkassenverwaltung'
  },
  new_custody: { ar: 'صرف عهدة جديدة', en: 'Issue New Custody', de: 'Neue Handkasse anlegen' },
  custody_settlement_sheet: {
    ar: 'شيت تسوية العهدة التفصيلي',
    en: 'Detailed Custody Settlement Sheet',
    de: 'Detaillierte Kassenabrechnung'
  },
  custodian: { ar: 'أمين العهدة / الموظف', en: 'Custodian / Employee', de: 'Kassenwart / Mitarbeiter' },
  custody_amount: { ar: 'مبلغ العهدة الأصلي', en: 'Initial Custody Amount', de: 'Ursprünglicher Kassenbetrag' },
  settled_amount: { ar: 'إجمالي الفواتير المسواة', en: 'Settled Invoices Total', de: 'Abgerechnete Belege' },
  remaining_custody: { ar: 'الرصيد المتبقي من العهدة', en: 'Remaining Balance', de: 'Verbleibender Saldo' },
  add_custody_invoice: { ar: 'إضافة فاتورة / سند للعهدة', en: 'Add Invoice to Custody', de: 'Beleg zur Kasse hinzufügen' },
  refund_excess: { ar: 'رد المتبقي للخزينة', en: 'Refund Remaining to Treasury', de: 'Rückzahlung an Hauptkasse' },
  reimburse_deficit: { ar: 'صرف الفارق للأمين', en: 'Reimburse Custodian', de: 'Erstattung an Mitarbeiter' },

  // Advances
  advances_title: {
    ar: 'سجل وشيت سلف الموظفين والأقساط',
    en: 'Employee Advances & Installments',
    de: 'Mitarbeitervorschüsse & Ratenrückzahlung'
  },
  new_advance: { ar: 'منح سلفة جديدة', en: 'Issue New Advance', de: 'Neuen Vorschuss gewähren' },
  advance_amount: { ar: 'مبلغ السلفة', en: 'Advance Amount', de: 'Vorschussbetrag' },
  monthly_deduction: { ar: 'القسط الشهري المستقطع', en: 'Monthly Deduction', de: 'Monatliche Rate' },
  repaid_amount: { ar: 'المسدد من السلفة', en: 'Repaid Amount', de: 'Bereits getilgt' },
  remaining_advance: { ar: 'المتبقي من السلفة', en: 'Remaining Advance', de: 'Offener Restbetrag' },
  record_repayment: { ar: 'تسجيل سداد قسط', en: 'Record Repayment', de: 'Rate verbuchen' },

  // WhatsApp & Reports
  send_whatsapp_statement: {
    ar: 'إرسال كشف الحساب عبر واتساب',
    en: 'Send Statement via WhatsApp',
    de: 'Kontoauszug per WhatsApp senden'
  },
  send_whatsapp_settlement: {
    ar: 'إرسال تقرير التسوية عبر واتساب',
    en: 'Send Settlement via WhatsApp',
    de: 'Abrechnung per WhatsApp senden'
  },
  whatsapp_phone_placeholder: {
    ar: 'أدخل رقم الواتساب مع المفتاح الدولي (مثال: 966501234567)',
    en: 'Enter WhatsApp number with country code (e.g., 966501234567)',
    de: 'WhatsApp-Nummer mit Ländervorwahl eingeben (z. B. 491701234567)'
  },

  // Complete Accounting Terminology (IFRS / GAAP / HGB)
  account_type_asset: {
    ar: 'الأصول (المتداولة والثابتة)',
    en: 'Assets (Current & Non-Current)',
    de: 'Aktiva (Umlauf- & Anlagevermögen)'
  },
  account_type_liability: {
    ar: 'الخصوم والالتزامات',
    en: 'Liabilities (Current & Long-Term)',
    de: 'Passiva (Verbindlichkeiten)'
  },
  account_type_equity: {
    ar: 'حقوق الملكية ورأس المال',
    en: "Owner's Equity & Capital",
    de: 'Eigenkapital & Rücklagen'
  },
  account_type_revenue: {
    ar: 'الإيرادات والمبيعات',
    en: 'Revenues & Operating Income',
    de: 'Erträge & Umsatzerlöse'
  },
  account_type_expense: {
    ar: 'المصروفات والتكاليف',
    en: 'Expenses & Operating Costs',
    de: 'Aufwendungen & Betriebskosten'
  },

  // Account Sub-types
  subtype_current_asset: { ar: 'أصل متداول', en: 'Current Asset', de: 'Umlaufvermögen' },
  subtype_fixed_asset: { ar: 'أصل ثابت', en: 'Fixed Asset', de: 'Sachanlagevermögen' },
  subtype_bank: { ar: 'حساب بنكي', en: 'Bank Account', de: 'Bankguthaben' },
  subtype_cash: { ar: 'خزينة / نقدية', en: 'Cash on Hand', de: 'Kassenbestand' },
  subtype_customer: { ar: 'عميل تجاري (مدينون)', en: 'Trade Receivable / Customer', de: 'Forderungen aus LuL (Kunde)' },
  subtype_supplier: { ar: 'مورد تجاري (دائنون)', en: 'Trade Payable / Supplier', de: 'Verbindlichkeiten aus LuL (Lieferant)' },
  subtype_current_liability: { ar: 'التزام متداول قصير', en: 'Current Liability', de: 'Kurzfristige Verbindlichkeit' },
  subtype_long_term_liability: { ar: 'التزام طويل الأجل', en: 'Long-Term Liability', de: 'Langfristige Verbindlichkeit' },
  subtype_capital: { ar: 'رأس مال', en: 'Paid-in Capital', de: 'Gezeichnetes Kapital' },
  subtype_retained_earnings: { ar: 'أرباح محتجزة / مبقاة', en: 'Retained Earnings', de: 'Gewinnvortrag / Rücklagen' },
  subtype_operating_revenue: { ar: 'إيراد تشغيلي مباشر', en: 'Operating Revenue', de: 'Umsatzerlöse (Betrieb)' },
  subtype_other_revenue: { ar: 'إيراد آخر / متنوع', en: 'Other Income', de: 'Sonstige betriebliche Erträge' },
  subtype_operating_expense: { ar: 'مصروف تشغيلي مباشر', en: 'Operating Expense', de: 'Betrieblicher Aufwand' },
  subtype_admin_expense: { ar: 'مصروف إداري وعمومي', en: 'Administrative & General Expense', de: 'Verwaltungs- & Gemeinkosten' },
  subtype_marketing_expense: { ar: 'مصروف تسويق وبيعي', en: 'Selling & Marketing Expense', de: 'Vertriebs- & Werbekosten' },

  // Accounting Concepts & Reports
  trial_balance: { ar: 'ميزان المراجعة بالأرصدة والمجاميع', en: 'Trial Balance (Balances & Totals)', de: 'Summen- und Saldenliste (SuSa)' },
  balance_sheet: { ar: 'قائمة المركز المالي (الميزانية العمومية)', en: 'Statement of Financial Position (Balance Sheet)', de: 'Bilanz' },
  income_statement: { ar: 'قائمة الدخل والأرباح والخسائر', en: 'Income Statement (Profit & Loss)', de: 'Gewinn- und Verlustrechnung (GuV)' },
  general_ledger: { ar: 'دفتر الأستاذ العام', en: 'General Ledger', de: 'Hauptbuch' },
  account_statement: { ar: 'كشف حساب تفصيلي', en: 'Detailed Account Statement', de: 'Detaillierter Kontoauszug' },
  opening_balance: { ar: 'الرصيد الافتتاحي', en: 'Opening Balance', de: 'Anfangsbestand' },
  closing_balance: { ar: 'الرصيد الختامي', en: 'Closing Balance', de: 'Schlussbestand' },
  current_balance: { ar: 'الرصيد الحالي', en: 'Current Balance', de: 'Aktueller Saldo' },
  total_debit: { ar: 'إجمالي حركات المدين', en: 'Total Debit Movements', de: 'Summe Soll-Buchungen' },
  total_credit: { ar: 'إجمالي حركات الدائن', en: 'Total Credit Movements', de: 'Summe Haben-Buchungen' },
  net_movement: { ar: 'صافي الحركة خلال الفترة', en: 'Net Period Movement', de: 'Netto-Periodenveränderung' },
  account_code: { ar: 'كود / رمز الحساب', en: 'Account Code', de: 'Kontonummer' },
  account_name: { ar: 'اسم الحساب المحاسبي', en: 'Account Name', de: 'Kontobezeichnung' },
  nature_debit: { ar: 'طبيعة الحساب: مدين (Debit)', en: 'Normal Balance: Debit (Dr.)', de: 'Kontonatur: Soll' },
  nature_credit: { ar: 'طبيعة الحساب: دائن (Credit)', en: 'Normal Balance: Credit (Cr.)', de: 'Kontonatur: Haben' },
  posted: { ar: 'مرحل للأستاذ', en: 'Posted', de: 'Gebucht' },
  unposted: { ar: 'مسودة غير مرحلة', en: 'Draft (Unposted)', de: 'Entwurf' },
  post_all: { ar: 'ترحيل كافة القيود', en: 'Post All Entries', de: 'Alle Buchungen festschreiben' },
  print_statement: { ar: 'طباعة كشف الحساب', en: 'Print Account Statement', de: 'Kontoauszug drucken' },
  print_official_report: { ar: 'طباعة تقرير رسمي', en: 'Print Official Report', de: 'Offiziellen Bericht drucken' },
  company_seal_approval: { ar: 'ختم الشركة والاعتماد المالي', en: 'Company Seal & Financial Approval', de: 'Unternehmensstempel & Freigabe' },
  responsible_accountant: { ar: 'المحاسب المسؤول', en: 'Responsible Accountant', de: 'Verantwortlicher Buchhalter' },
  financial_director: { ar: 'المدير المالي', en: 'Chief Financial Officer (CFO)', de: 'Finanzleiter' },
  managing_director: { ar: 'المدير العام', en: 'Managing Director / CEO', de: 'Geschäftsführer' },
  bank_reconciliation: { ar: 'مذكرة التسوية والمطابقة البنكية', en: 'Bank Reconciliation Statement', de: 'Bankabstimmung' },
  book_balance: { ar: 'الرصيد الدفتري بالنظام', en: 'General Ledger Book Balance', de: 'Buchhalterischer Saldo' },
  statement_balance: { ar: 'رصيد كشف الحساب الفعلي', en: 'Actual Bank Statement Balance', de: 'Tatsächlicher Bankauszugssaldo' },
  discrepancy: { ar: 'الفارق / عدم التطابق', en: 'Discrepancy / Variance', de: 'Abweichung / Differenz' },
  all_periods: { ar: 'كافة الفترات المالية', en: 'All Fiscal Periods', de: 'Alle Geschäftsperioden' },
  filter_by_date: { ar: 'تصفية بالتاريخ', en: 'Filter by Date', de: 'Nach Datum filtern' },
  from_date: { ar: 'من تاريخ', en: 'From Date', de: 'Von Datum' },
  to_date: { ar: 'إلى تاريخ', en: 'To Date', de: 'Bis Datum' }
};

const LANG_KEY = 'roeya_erp_lang';

export function getSystemLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ar' || saved === 'de') return saved;
  } catch (e) {
    // fallback
  }
  return 'ar';
}

export function saveSystemLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  } catch (e) {
    console.error('Error saving language:', e);
  }
}

export function t(key: string, lang: Language | string = getSystemLanguage(), fallback?: string): string {
  const activeLang = (lang === 'de' ? 'de' : lang === 'en' ? 'en' : 'ar') as Language;
  if (translations[key] && translations[key][activeLang]) {
    return translations[key][activeLang];
  }
  if (fallback) return fallback;
  return key;
}

export function getAccountTypeLabel(type: string, lang: Language = getSystemLanguage()): string {
  const key = `account_type_${type}`;
  return t(key, lang, type);
}

export function getAccountSubTypeLabel(subType: string, lang: Language = getSystemLanguage()): string {
  const key = `subtype_${subType}`;
  return t(key, lang, subType);
}

export function formatAccountingNumber(val: number | string | undefined | null, currency?: string, lang: Language = getSystemLanguage()): string {
  const num = typeof val === 'number' ? val : Number(val) || 0;
  const locale = lang === 'ar' ? 'ar-EG' : lang === 'de' ? 'de-DE' : 'en-US';
  const formatted = num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency) {
    return lang === 'ar' ? `${formatted} ${currency}` : `${currency} ${formatted}`;
  }
  return formatted;
}
