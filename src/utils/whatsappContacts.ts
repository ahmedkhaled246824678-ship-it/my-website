import { CustomerSupplier, Employee, BankAccount, CompanySettings, UserAccount } from '../types';
import { getCustomersSuppliers, getEmployees, getBanks, getCompanySettings, getUsers } from './storage';

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  category: 'customer' | 'supplier' | 'employee' | 'bank' | 'management' | 'custom';
  categoryLabel: string;
  companyOrRole?: string;
  email?: string;
}

const CUSTOM_CONTACTS_KEY = 'roeya_custom_whatsapp_contacts_v1';

export function getCustomWhatsAppContacts(): WhatsAppContact[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CONTACTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveCustomWhatsAppContact(contact: Omit<WhatsAppContact, 'id' | 'category' | 'categoryLabel'> & { id?: string }): WhatsAppContact {
  const contacts = getCustomWhatsAppContacts();
  const newContact: WhatsAppContact = {
    id: contact.id || `contact_${Date.now()}`,
    name: contact.name,
    phone: contact.phone,
    category: 'custom',
    categoryLabel: 'جهات اتصال مخصصة',
    companyOrRole: contact.companyOrRole || 'جهة اتصال خارجية',
    email: contact.email
  };

  const existingIdx = contacts.findIndex(c => c.id === newContact.id || c.phone === newContact.phone);
  if (existingIdx >= 0) {
    contacts[existingIdx] = newContact;
  } else {
    contacts.unshift(newContact);
  }

  localStorage.setItem(CUSTOM_CONTACTS_KEY, JSON.stringify(contacts));
  return newContact;
}

export function deleteCustomWhatsAppContact(id: string): void {
  const contacts = getCustomWhatsAppContacts();
  const updated = contacts.filter(c => c.id !== id);
  localStorage.setItem(CUSTOM_CONTACTS_KEY, JSON.stringify(updated));
}

/**
 * جمع وتوحيد جميع جهات الاتصال المسجلة في النظام (عملاء، موردين، موظفين، مدراء بنوك، إدارة، وجهات مخصصة)
 */
export function getAllUnifiedWhatsAppContacts(props?: {
  customersSuppliers?: CustomerSupplier[];
  employees?: Employee[];
  banks?: BankAccount[];
  settings?: CompanySettings;
  users?: UserAccount[];
}): WhatsAppContact[] {
  const contacts: WhatsAppContact[] = [];

  const custSuppList = props?.customersSuppliers || getCustomersSuppliers() || [];
  const empList = props?.employees || getEmployees() || [];
  const bankList = props?.banks || getBanks() || [];
  const settings = props?.settings || getCompanySettings() || {
    companyName: 'شركة الرؤية المتكاملة للتجارة والمقاولات',
    taxNumber: '300458921000003',
    commercialRegister: '1010543210',
    address: 'الرياض - حي العليا',
    phone: '011-4567890',
    email: 'info@roeya-erp.com',
    currency: 'ر.س',
    fiscalYearStart: '2026-01-01',
    fiscalYearEnd: '2026-12-31',
    defaultTaxRate: 15
  };
  const userList = props?.users || getUsers() || [];
  const customList = getCustomWhatsAppContacts() || [];

  // 1. الإدارة والمسؤولين
  if (settings?.phone) {
    contacts.push({
      id: 'mgmt_general',
      name: 'هاتف الإدارة العامة للشركة',
      phone: settings.phone,
      category: 'management',
      categoryLabel: 'الإدارة والمسؤولين',
      companyOrRole: settings.companyName
    });
  }

  if (settings?.notificationSettings?.managerPhone) {
    contacts.push({
      id: 'mgmt_manager',
      name: 'المدير المالي والتنفيذي',
      phone: settings.notificationSettings.managerPhone,
      category: 'management',
      categoryLabel: 'الإدارة والمسؤولين',
      companyOrRole: 'المدير المالي'
    });
  }

  if (settings?.notificationSettings?.accountantPhone) {
    contacts.push({
      id: 'mgmt_accountant',
      name: 'رئيس الحسابات والتدقيق',
      phone: settings.notificationSettings.accountantPhone,
      category: 'management',
      categoryLabel: 'الإدارة والمسؤولين',
      companyOrRole: 'قسم المحاسبة'
    });
  }

  (userList || []).forEach(u => {
    if (!u) return;
    if (u.phone && !contacts.some(c => c.phone === u.phone)) {
      contacts.push({
        id: `user_${u.id}`,
        name: u.fullName || u.username,
        phone: u.phone,
        category: 'management',
        categoryLabel: 'الإدارة والمستخدمين',
        companyOrRole: u.role === 'admin' ? 'مدير النظام' : 'محاسب ومستخدم'
      });
    }
  });

  // 2. العملاء
  (custSuppList || [])
    .filter(cs => cs && cs.type === 'customer' && cs.phone)
    .forEach(c => {
      contacts.push({
        id: `cust_${c.id}`,
        name: c.name,
        phone: c.phone,
        category: 'customer',
        categoryLabel: 'العملاء',
        companyOrRole: c.companyName || 'عميل',
        email: c.email
      });
    });

  // 3. الموردين
  (custSuppList || [])
    .filter(cs => cs && cs.type === 'supplier' && cs.phone)
    .forEach(s => {
      contacts.push({
        id: `supp_${s.id}`,
        name: s.name,
        phone: s.phone,
        category: 'supplier',
        categoryLabel: 'الموردين',
        companyOrRole: s.companyName || 'مورد مواد / مقاول باطن',
        email: s.email
      });
    });

  // 4. الموظفين وأصحاب العهد
  (empList || [])
    .filter(e => e && e.phone)
    .forEach(e => {
      contacts.push({
        id: `emp_${e.id}`,
        name: e.name,
        phone: e.phone!,
        category: 'employee',
        categoryLabel: 'الموظفين وأصحاب العهد',
        companyOrRole: `${e.position} - ${e.department}`,
        email: e.email
      });
    });

  // 5. مسؤولي البنوك
  (bankList || []).forEach(b => {
    if (!b) return;
    // إذا كان هناك هاتف لمسؤول البنك
    const bankPhone = (b as any).contactPhone || (b as any).managerPhone;
    if (bankPhone) {
      contacts.push({
        id: `bank_${b.id}`,
        name: `مسؤول حساب: ${b.bankName}`,
        phone: bankPhone,
        category: 'bank',
        categoryLabel: 'البنوك والمصارف',
        companyOrRole: b.bankName
      });
    }
  });

  // 6. جهات الاتصال المخصصة
  (customList || []).forEach(c => {
    if (!c) return;
    if (!contacts.some(existing => existing.phone === c.phone)) {
      contacts.push(c);
    }
  });

  return contacts;
}

export function sanitizePhoneNumber(phone: string, countryCode = '966'): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.substring(1);
  } else if (!cleaned.startsWith(countryCode) && cleaned.length <= 10) {
    cleaned = countryCode + cleaned;
  }
  return cleaned;
}
