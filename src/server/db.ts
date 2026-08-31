import fs from 'fs';
import path from 'path';
import {
  INITIAL_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_TREASURY_TXS,
  INITIAL_BANKS,
  INITIAL_BANK_TXS,
  INITIAL_BANK_RECONS,
  INITIAL_CUSTOMERS_SUPPLIERS,
  INITIAL_CUSTODIES,
  INITIAL_ADVANCES,
  INITIAL_SITE_SETTLEMENTS,
  INITIAL_COST_CENTERS,
  INITIAL_EXPENSES,
  INITIAL_INVENTORY,
  INITIAL_FIXED_ASSETS,
  INITIAL_EMPLOYEES,
  INITIAL_USERS,
  INITIAL_COMPANY_SETTINGS
} from '../utils/storage';

export interface AppDatabase {
  lastUpdated: number;
  users: any[];
  accounts: any[];
  journalEntries: any[];
  treasuryTxs: any[];
  banks: any[];
  bankTxs: any[];
  bankRecons: any[];
  customersSuppliers: any[];
  custodies: any[];
  advances: any[];
  siteSettlements: any[];
  costCenters: any[];
  expenses: any[];
  inventory: any[];
  fixedAssets: any[];
  employees: any[];
  settings: any;
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'erp_store.json');

// Initialize in-memory database with default data
let inMemoryDb: AppDatabase = {
  lastUpdated: Date.now(),
  users: INITIAL_USERS,
  accounts: INITIAL_ACCOUNTS,
  journalEntries: INITIAL_JOURNAL_ENTRIES,
  treasuryTxs: INITIAL_TREASURY_TXS,
  banks: INITIAL_BANKS,
  bankTxs: INITIAL_BANK_TXS,
  bankRecons: INITIAL_BANK_RECONS,
  customersSuppliers: INITIAL_CUSTOMERS_SUPPLIERS,
  custodies: INITIAL_CUSTODIES,
  advances: INITIAL_ADVANCES,
  siteSettlements: INITIAL_SITE_SETTLEMENTS,
  costCenters: INITIAL_COST_CENTERS,
  expenses: INITIAL_EXPENSES,
  inventory: INITIAL_INVENTORY,
  fixedAssets: INITIAL_FIXED_ASSETS,
  employees: INITIAL_EMPLOYEES,
  settings: INITIAL_COMPANY_SETTINGS
};

// Try to load persisted data from disk if exists
export function initServerDatabase(): AppDatabase {
  try {
    const dataDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      const fileData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (parsed && typeof parsed === 'object') {
        inMemoryDb = {
          ...inMemoryDb,
          ...parsed,
          users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : inMemoryDb.users,
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    } else {
      // Save initial db file
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Server DB] Error loading database file:', err);
  }
  return inMemoryDb;
}

export function getServerDatabase(): AppDatabase {
  return inMemoryDb;
}

export function saveServerDatabase(updates: Partial<AppDatabase>): AppDatabase {
  try {
    inMemoryDb = {
      ...inMemoryDb,
      ...updates,
      lastUpdated: Date.now()
    };

    const dataDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server DB] Error saving database file:', err);
  }
  return inMemoryDb;
}

// User-specific helpers
export function getServerUsers(): any[] {
  return inMemoryDb.users || INITIAL_USERS;
}

export function saveServerUsers(users: any[]): any[] {
  inMemoryDb.users = users;
  inMemoryDb.lastUpdated = Date.now();
  try {
    const dataDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server DB] Error saving users:', err);
  }
  return inMemoryDb.users;
}

export function findServerUser(query: string): any | null {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  const users = getServerUsers();
  return (
    users.find(
      u =>
        String(u.id).toLowerCase() === q ||
        String(u.username).toLowerCase() === q ||
        String(u.directAccessKey || '').toLowerCase() === q
    ) || null
  );
}
