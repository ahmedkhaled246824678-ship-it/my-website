import React, { useState, useMemo } from 'react';
import {
  User,
  Users,
  Search,
  Plus,
  Phone,
  Building,
  Briefcase,
  Trash2,
  Check,
  ChevronDown,
  Sparkles,
  BookUser,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import {
  WhatsAppContact,
  getAllUnifiedWhatsAppContacts,
  saveCustomWhatsAppContact,
  deleteCustomWhatsAppContact,
  sanitizePhoneNumber
} from '../../utils/whatsappContacts';
import { CustomerSupplier, Employee, BankAccount, CompanySettings, UserAccount } from '../../types';
import { customAlert } from '../../utils/dialog';

export const COUNTRY_CODES = [
  { code: '966', name: 'السعودية (+966)', flag: '🇸🇦' },
  { code: '20', name: 'مصر (+20)', flag: '🇪🇬' },
  { code: '971', name: 'الإمارات (+971)', flag: '🇦🇪' },
  { code: '965', name: 'الكويت (+965)', flag: '🇰🇼' },
  { code: '968', name: 'عُمان (+968)', flag: '🇴🇲' },
  { code: '974', name: 'قطر (+974)', flag: '🇶🇦' },
  { code: '973', name: 'البحرين (+973)', flag: '🇧🇭' },
  { code: '962', name: 'الأردن (+962)', flag: '🇯🇴' },
  { code: '964', name: 'العراق (+964)', flag: '🇮🇶' },
  { code: '963', name: 'سوريا (+963)', flag: '🇸🇾' },
  { code: '967', name: 'اليمن (+967)', flag: '🇾🇪' },
  { code: '249', name: 'السودان (+249)', flag: '🇸🇩' },
  { code: '1', name: 'أمريكا / كندا (+1)', flag: '🇺🇸' },
  { code: '44', name: 'بريطانيا (+44)', flag: '🇬🇧' }
];

interface WhatsAppRecipientSelectorProps {
  selectedPhone: string;
  onPhoneChange: (phone: string, contact?: WhatsAppContact) => void;
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  settings?: CompanySettings;
  users?: UserAccount[];
  onRecipientSelect?: (contact: WhatsAppContact) => void;
}

export const WhatsAppRecipientSelector: React.FC<WhatsAppRecipientSelectorProps> = ({
  selectedPhone,
  onPhoneChange,
  customersSuppliers,
  employees,
  banks,
  settings,
  users,
  onRecipientSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'customer' | 'supplier' | 'employee' | 'management' | 'custom'>('all');
  const [selectedCountryCode, setSelectedCountryCode] = useState('966');
  const [showAddContact, setShowAddContact] = useState(false);

  // New Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('');

  // Contacts list
  const [refreshKey, setRefreshKey] = useState(0);
  const allContacts = useMemo(() => {
    return getAllUnifiedWhatsAppContacts({
      customersSuppliers,
      employees,
      banks,
      settings,
      users
    });
  }, [customersSuppliers, employees, banks, settings, users, refreshKey]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return allContacts.filter(c => {
      const matchCat = activeCategory === 'all' || c.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.companyOrRole && c.companyOrRole.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [allContacts, activeCategory, searchQuery]);

  // Find currently selected contact object if any
  const matchedContact = allContacts.find(
    c => c.phone.replace(/[^0-9]/g, '') === selectedPhone.replace(/[^0-9]/g, '') ||
         sanitizePhoneNumber(c.phone) === sanitizePhoneNumber(selectedPhone)
  );

  const handleSelect = (contact: WhatsAppContact) => {
    onPhoneChange(contact.phone, contact);
    if (onRecipientSelect) onRecipientSelect(contact);
    setIsOpen(false);
  };

  const handleSaveNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) {
      customAlert('يرجى كتابة اسم ورقم هاتف جهة الاتصال', 'error');
      return;
    }

    const saved = saveCustomWhatsAppContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      companyOrRole: newContactRole.trim() || 'جهة اتصال'
    });

    setRefreshKey(k => k + 1);
    onPhoneChange(saved.phone, saved);
    if (onRecipientSelect) onRecipientSelect(saved);
    setShowAddContact(false);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRole('');
    customAlert(`تم حفظ جهة الاتصال (${saved.name}) بنجاح!`, 'success');
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomWhatsAppContact(id);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>اختيار المستلم أو رقم الواتساب:</span>
        </label>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
        >
          <BookUser className="w-3.5 h-3.5" />
          <span>{isOpen ? 'إخفاء دليل المستلمين' : 'فتح دليل جهات الاتصال'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Input Row */}
      <div className="flex gap-2">
        {/* Country Code Select */}
        <select
          value={selectedCountryCode}
          onChange={(e) => setSelectedCountryCode(e.target.value)}
          className="w-28 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2.5 font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {COUNTRY_CODES.map(c => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.code}
            </option>
          ))}
        </select>

        {/* Phone Input with matched contact badge */}
        <div className="relative flex-1">
          <input
            type="text"
            value={selectedPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="مثال: 0501234567 (أو اترك فارغاً لاختيار المرسل إليه من واتساب)"
            className="w-full text-xs font-mono text-left bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            dir="ltr"
          />
          {matchedContact ? (
            <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 px-2 rounded-lg text-[11px] font-bold pointer-events-none">
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate max-w-[140px]">{matchedContact.name}</span>
            </div>
          ) : !selectedPhone ? (
            <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 pointer-events-none">
              <Sparkles className="w-3 h-3" />
              <span>واتساب العام (اختيار المحادثة)</span>
            </div>
          ) : null}
        </div>

        {/* Toggle Picker Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
          title="اختيار من دليل العملاء والموردين والموظفين"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">دليل الأسماء</span>
        </button>
      </div>

      {/* Recipient Picker Drawer / Dropdown */}
      {isOpen && (
        <div className="p-3 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl space-y-3 animate-fadeIn">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الشركة أو رقم الهاتف..."
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl pr-8 pl-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddContact(!showAddContact)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddContact ? 'إلغاء الإضافة' : 'إضافة رقم جديد'}</span>
            </button>
          </div>

          {/* Quick Category Filter Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
            {[
              { id: 'all', label: `الكل (${allContacts.length})`, icon: Users },
              { id: 'customer', label: 'العملاء', icon: User },
              { id: 'supplier', label: 'الموردين', icon: Building },
              { id: 'employee', label: 'الموظفين والعهد', icon: Briefcase },
              { id: 'management', label: 'الإدارة والبنوك', icon: ShieldCheck },
              { id: 'custom', label: 'أرقام مخصصة', icon: BookUser }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Add New Custom Contact Form */}
          {showAddContact && (
            <form onSubmit={handleSaveNewContact} className="p-3 bg-slate-800/90 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إضافة جهة اتصال جديدة إلى دليل الواتساب</span>
                </span>
                <button type="button" onClick={() => setShowAddContact(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="اسم الشخص أو المسؤول *"
                  required
                  className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="رقم الواتساب (0501234567) *"
                  required
                  dir="ltr"
                  className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 text-left font-mono"
                />
                <input
                  type="text"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  placeholder="الصفة / اسم الشركة (اختياري)"
                  className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                >
                  حفظ واختيار المستلم
                </button>
              </div>
            </form>
          )}

          {/* Contacts List Grid */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                لا توجد جهات اتصال مطابقة لخيارات البحث
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = matchedContact?.id === contact.id || matchedContact?.phone === contact.phone;
                return (
                  <div
                    key={contact.id}
                    onClick={() => handleSelect(contact)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${
                        contact.category === 'customer' ? 'bg-blue-500/20 text-blue-400' :
                        contact.category === 'supplier' ? 'bg-amber-500/20 text-amber-400' :
                        contact.category === 'employee' ? 'bg-purple-500/20 text-purple-400' :
                        contact.category === 'management' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        <User className="w-3.5 h-3.5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black">{contact.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-700/60 text-slate-300 rounded">
                            {contact.categoryLabel}
                          </span>
                        </div>
                        {contact.companyOrRole && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {contact.companyOrRole}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 font-bold" dir="ltr">
                        {contact.phone}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {contact.category === 'custom' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(e, contact.id)}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                          title="حذف من الدليل"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
