import {
  STORAGE_KEYS,
  broadcastSync,
  getUsers,
  saveData
} from './storage';
import { UserAccount } from '../types';

let lastServerSyncTimestamp = 0;
let isSyncing = false;

/**
 * Fetch updates from the server and hydrate local storage
 */
export async function syncWithServer(force = false): Promise<{ hasUpdates: boolean; users?: UserAccount[]; data?: any }> {
  if (isSyncing && !force) return { hasUpdates: false };
  isSyncing = true;

  try {
    const url = `/api/sync${lastServerSyncTimestamp > 0 && !force ? `?since=${lastServerSyncTimestamp}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      isSyncing = false;
      return { hasUpdates: false };
    }

    const result = await res.json();
    if (result.success) {
      const serverTimestamp = result.lastUpdated || Date.now();
      const hasUpdates = result.hasUpdates;

      if (hasUpdates && result.data) {
        lastServerSyncTimestamp = serverTimestamp;
        const d = result.data;

        if (d.users && Array.isArray(d.users)) {
          saveData(STORAGE_KEYS.USERS, d.users);
        }
        if (d.accounts && Array.isArray(d.accounts)) {
          saveData(STORAGE_KEYS.ACCOUNTS, d.accounts);
        }
        if (d.journalEntries && Array.isArray(d.journalEntries)) {
          saveData(STORAGE_KEYS.JOURNAL_ENTRIES, d.journalEntries);
        }
        if (d.treasuryTxs && Array.isArray(d.treasuryTxs)) {
          saveData(STORAGE_KEYS.TREASURY, d.treasuryTxs);
        }
        if (d.banks && Array.isArray(d.banks)) {
          saveData(STORAGE_KEYS.BANKS, d.banks);
        }
        if (d.bankTxs && Array.isArray(d.bankTxs)) {
          saveData(STORAGE_KEYS.BANK_TXS, d.bankTxs);
        }
        if (d.bankRecons && Array.isArray(d.bankRecons)) {
          saveData(STORAGE_KEYS.BANK_RECONS, d.bankRecons);
        }
        if (d.customersSuppliers && Array.isArray(d.customersSuppliers)) {
          saveData(STORAGE_KEYS.CUSTOMERS_SUPPLIERS, d.customersSuppliers);
        }
        if (d.custodies && Array.isArray(d.custodies)) {
          saveData(STORAGE_KEYS.CUSTODIES, d.custodies);
        }
        if (d.advances && Array.isArray(d.advances)) {
          saveData(STORAGE_KEYS.ADVANCES, d.advances);
        }
        if (d.siteSettlements && Array.isArray(d.siteSettlements)) {
          saveData(STORAGE_KEYS.SITE_SETTLEMENTS, d.siteSettlements);
        }
        if (d.costCenters && Array.isArray(d.costCenters)) {
          saveData(STORAGE_KEYS.COST_CENTERS, d.costCenters);
        }
        if (d.expenses && Array.isArray(d.expenses)) {
          saveData(STORAGE_KEYS.EXPENSES, d.expenses);
        }
        if (d.inventory && Array.isArray(d.inventory)) {
          saveData(STORAGE_KEYS.INVENTORY, d.inventory);
        }
        if (d.fixedAssets && Array.isArray(d.fixedAssets)) {
          saveData(STORAGE_KEYS.FIXED_ASSETS, d.fixedAssets);
        }
        if (d.employees && Array.isArray(d.employees)) {
          saveData(STORAGE_KEYS.EMPLOYEES, d.employees);
        }
        if (d.settings) {
          saveData(STORAGE_KEYS.SETTINGS, d.settings);
        }

        // Notify app
        broadcastSync('SERVER_SYNC_COMPLETE', { users: d.users, timestamp: serverTimestamp });
        isSyncing = false;
        return { hasUpdates: true, users: d.users, data: d };
      } else if (result.users && Array.isArray(result.users)) {
        saveData(STORAGE_KEYS.USERS, result.users);
        lastServerSyncTimestamp = serverTimestamp;
        isSyncing = false;
        return { hasUpdates: true, users: result.users };
      }
    }
  } catch (err) {
    // Silently continue offline / local fallback
  } finally {
    isSyncing = false;
  }

  return { hasUpdates: false };
}

/**
 * Send full or partial users update to server
 */
export async function pushUsersToServer(users: UserAccount[]): Promise<boolean> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.lastUpdated) {
        lastServerSyncTimestamp = data.lastUpdated;
      }
      return true;
    }
  } catch (e) {
    console.error('Error pushing users to server:', e);
  }
  return false;
}

/**
 * Toggle user active status on server
 */
export async function toggleUserActiveOnServer(userId: string, isActive?: boolean): Promise<UserAccount | null> {
  try {
    const res = await fetch('/api/users/toggle-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        if (data.lastUpdated) lastServerSyncTimestamp = data.lastUpdated;
        if (data.users) saveData(STORAGE_KEYS.USERS, data.users);
        broadcastSync('USERS_UPDATED', data.users);
        return data.user;
      }
    }
  } catch (e) {
    console.error('Error toggling user active on server:', e);
  }
  return null;
}

/**
 * Update user permissions on server
 */
export async function updateUserPermissionsOnServer(payload: {
  userId: string;
  permissions?: any;
  allowedModules?: string[];
  role?: string;
  fullName?: string;
}): Promise<UserAccount | null> {
  try {
    const res = await fetch('/api/users/update-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        if (data.lastUpdated) lastServerSyncTimestamp = data.lastUpdated;
        if (data.users) saveData(STORAGE_KEYS.USERS, data.users);
        broadcastSync('USERS_UPDATED', data.users);
        return data.user;
      }
    }
  } catch (e) {
    console.error('Error updating user permissions on server:', e);
  }
  return null;
}

/**
 * Find user by ID, username or direct access key on server
 */
export async function findUserOnServer(query: string): Promise<UserAccount | null> {
  try {
    const res = await fetch(`/api/users/find?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        return data.user;
      }
    }
  } catch (e) {
    console.error('Error finding user on server:', e);
  }
  // Local fallback
  const localUsers = getUsers();
  const q = String(query).trim().toLowerCase();
  return localUsers.find(
    u =>
      String(u.id).toLowerCase() === q ||
      String(u.username).toLowerCase() === q ||
      String(u.directAccessKey || '').toLowerCase() === q
  ) || null;
}

/**
 * Push generic data updates to server
 */
export async function pushDataToServer(partialData: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.lastUpdated) {
        lastServerSyncTimestamp = data.lastUpdated;
      }
      return true;
    }
  } catch (e) {
    console.error('Error pushing data to server:', e);
  }
  return false;
}
