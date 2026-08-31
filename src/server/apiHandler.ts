import { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import {
  initServerDatabase,
  getServerDatabase,
  saveServerDatabase,
  getServerUsers,
  saveServerUsers,
  findServerUser
} from './db';

// Ensure DB is initialized on startup
initServerDatabase();

function sendJson(res: ServerResponse, data: any, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const parsedUrl = parseUrl(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const method = (req.method || 'GET').toUpperCase();

  // If not an /api route, return false so Vite or Express serves static assets
  if (!pathname.startsWith('/api')) {
    return false;
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return true;
  }

  try {
    // 1. /api/sync - Real-Time sync endpoint for all devices and clients
    if (pathname === '/api/sync') {
      const db = getServerDatabase();
      const sinceParam = parsedUrl.query.since ? Number(parsedUrl.query.since) : 0;

      if (method === 'GET') {
        const hasUpdates = !sinceParam || db.lastUpdated > sinceParam;
        return sendJson(res, {
          success: true,
          hasUpdates,
          lastUpdated: db.lastUpdated,
          users: db.users,
          data: hasUpdates ? db : undefined
        }), true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const updatedDb = saveServerDatabase(body);
        return sendJson(res, {
          success: true,
          lastUpdated: updatedDb.lastUpdated,
          message: 'Data synchronized successfully on server'
        }), true;
      }
    }

    // 2. /api/users - Manage user accounts & permissions
    if (pathname === '/api/users') {
      if (method === 'GET') {
        const users = getServerUsers();
        return sendJson(res, {
          success: true,
          users,
          lastUpdated: getServerDatabase().lastUpdated
        }), true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const users = Array.isArray(body) ? body : (body.users || []);
        if (Array.isArray(users) && users.length > 0) {
          const savedUsers = saveServerUsers(users);
          return sendJson(res, {
            success: true,
            users: savedUsers,
            lastUpdated: getServerDatabase().lastUpdated,
            message: 'Users saved successfully on server'
          }), true;
        } else {
          return sendJson(res, { success: false, error: 'Invalid users array' }, 400), true;
        }
      }
    }

    // 3. /api/users/find - Fast lookup for user direct access key or ID
    if (pathname === '/api/users/find') {
      const query = (parsedUrl.query.q || parsedUrl.query.user || parsedUrl.query.key || '') as string;
      const user = findServerUser(query);
      if (user) {
        return sendJson(res, {
          success: true,
          user
        }), true;
      } else {
        return sendJson(res, {
          success: false,
          error: 'User not found on server'
        }, 404), true;
      }
    }

    // 4. /api/users/toggle-active - Toggle user status directly on server
    if (pathname === '/api/users/toggle-active' && method === 'POST') {
      const body = await parseBody(req);
      const { userId, isActive } = body;
      const users = getServerUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex >= 0) {
        users[userIndex].isActive = typeof isActive === 'boolean' ? isActive : !users[userIndex].isActive;
        saveServerUsers(users);
        return sendJson(res, {
          success: true,
          user: users[userIndex],
          users,
          lastUpdated: getServerDatabase().lastUpdated
        }), true;
      } else {
        return sendJson(res, { success: false, error: 'User not found' }, 404), true;
      }
    }

    // 5. /api/users/update-permissions - Update user permissions directly on server
    if (pathname === '/api/users/update-permissions' && method === 'POST') {
      const body = await parseBody(req);
      const { userId, permissions, allowedModules, role, fullName } = body;
      const users = getServerUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex >= 0) {
        if (permissions) users[userIndex].permissions = permissions;
        if (allowedModules) users[userIndex].allowedModules = allowedModules;
        if (role) users[userIndex].role = role;
        if (fullName) users[userIndex].fullName = fullName;
        saveServerUsers(users);
        return sendJson(res, {
          success: true,
          user: users[userIndex],
          users,
          lastUpdated: getServerDatabase().lastUpdated
        }), true;
      } else {
        return sendJson(res, { success: false, error: 'User not found' }, 404), true;
      }
    }

    // 6. /api/data - Full database fetch & update
    if (pathname === '/api/data') {
      if (method === 'GET') {
        const db = getServerDatabase();
        return sendJson(res, {
          success: true,
          data: db,
          lastUpdated: db.lastUpdated
        }), true;
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const updated = saveServerDatabase(body);
        return sendJson(res, {
          success: true,
          lastUpdated: updated.lastUpdated,
          message: 'Database saved successfully on server'
        }), true;
      }
    }

    // 404 for unknown api endpoint
    sendJson(res, { success: false, error: `API endpoint not found: ${pathname}` }, 404);
    return true;
  } catch (err: any) {
    console.error(`[API Error] ${method} ${pathname}:`, err);
    sendJson(res, { success: false, error: err.message || 'Internal Server Error' }, 500);
    return true;
  }
}
