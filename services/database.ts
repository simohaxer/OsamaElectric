import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

const DB_NAME = 'asset_inventory.db';
const STORAGE_KEYS = {
  USERS: '@users',
  DEPARTMENTS: '@departments',
  ASSETS: '@assets',
  INVENTORY_SESSIONS: '@inventory_sessions',
  INVENTORY_SCANS: '@inventory_scans',
};

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

export interface Asset {
  id: number;
  name: string;
  serial_number: string;
  quantity: number;
  location: string;
  photo_uri?: string;
  rfid_code: string;
  department_id: number;
  created_at: string;
  updated_at: string;
}

export interface InventorySession {
  id: number;
  name: string;
  date: string;
  department_id: number;
  created_at: string;
}

export interface InventoryScan {
  id: number;
  session_id: number;
  rfid_code: string;
  timestamp: string;
}

export interface InventoryResult {
  found: Asset[];
  missing: Asset[];
  scanned: InventoryScan[];
}

class DatabaseService {
  private db: any = null;
  private isWeb: boolean = Platform.OS === 'web';

  async initialize(): Promise<void> {
    try {
      if (this.isWeb) {
        // Web fallback - no initialization needed for AsyncStorage
        return;
      }
      
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (this.isWeb || !this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        location TEXT NOT NULL,
        photo_uri TEXT,
        rfid_code TEXT NOT NULL UNIQUE,
        department_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS inventory_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS inventory_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        rfid_code TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES inventory_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_assets_rfid ON assets(rfid_code);
      CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_scans_session ON inventory_scans(session_id);
    `);
  }

  async hashPassword(password: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  }

  // Web Storage Helpers
  private async getWebData<T>(key: string): Promise<T[]> {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private async setWebData<T>(key: string, data: T[]): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  private getNextId<T extends { id: number }>(items: T[]): number {
    return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  }

  // User operations
  async createUser(username: string, password: string): Promise<User> {
    const passwordHash = await this.hashPassword(password);
    
    if (this.isWeb) {
      const users = await this.getWebData<User>(STORAGE_KEYS.USERS);
      const newUser: User = {
        id: this.getNextId(users),
        username,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      await this.setWebData(STORAGE_KEYS.USERS, users);
      return newUser;
    }
    
    const result = await this.db.runAsync(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );
    
    return {
      id: result.lastInsertRowId,
      username,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
  }

  async getUser(): Promise<User | null> {
    if (this.isWeb) {
      const users = await this.getWebData<User>(STORAGE_KEYS.USERS);
      return users[0] || null;
    }
    
    const result = await this.db.getFirstAsync<User>(
      'SELECT * FROM users LIMIT 1'
    );
    
    return result || null;
  }

  async verifyPassword(username: string, password: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    
    if (this.isWeb) {
      const users = await this.getWebData<User>(STORAGE_KEYS.USERS);
      return users.some(u => u.username === username && u.password_hash === passwordHash);
    }
    
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE username = ? AND password_hash = ?',
      [username, passwordHash]
    );
    
    return (result?.count || 0) > 0;
  }

  // Department operations
  async createDepartment(name: string, userId: number): Promise<Department> {
    if (this.isWeb) {
      const departments = await this.getWebData<Department>(STORAGE_KEYS.DEPARTMENTS);
      const newDept: Department = {
        id: this.getNextId(departments),
        name,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
      departments.push(newDept);
      await this.setWebData(STORAGE_KEYS.DEPARTMENTS, departments);
      return newDept;
    }
    
    const result = await this.db.runAsync(
      'INSERT INTO departments (name, user_id) VALUES (?, ?)',
      [name, userId]
    );
    
    return {
      id: result.lastInsertRowId,
      name,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
  }

  async getDepartment(userId: number): Promise<Department | null> {
    if (this.isWeb) {
      const departments = await this.getWebData<Department>(STORAGE_KEYS.DEPARTMENTS);
      return departments.find(d => d.user_id === userId) || null;
    }
    
    const result = await this.db.getFirstAsync<Department>(
      'SELECT * FROM departments WHERE user_id = ? LIMIT 1',
      [userId]
    );
    
    return result || null;
  }

  // Asset operations
  async createAsset(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    const now = new Date().toISOString();
    
    if (this.isWeb) {
      const assets = await this.getWebData<Asset>(STORAGE_KEYS.ASSETS);
      const newAsset: Asset = {
        id: this.getNextId(assets),
        ...asset,
        created_at: now,
        updated_at: now,
      };
      assets.push(newAsset);
      await this.setWebData(STORAGE_KEYS.ASSETS, assets);
      return newAsset;
    }
    
    const result = await this.db.runAsync(
      `INSERT INTO assets (name, serial_number, quantity, location, photo_uri, rfid_code, department_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [asset.name, asset.serial_number, asset.quantity, asset.location, asset.photo_uri || null, asset.rfid_code, asset.department_id]
    );
    
    return {
      id: result.lastInsertRowId,
      ...asset,
      created_at: now,
      updated_at: now,
    };
  }

  async updateAsset(id: number, assetUpdate: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isWeb) {
      const assets = await this.getWebData<Asset>(STORAGE_KEYS.ASSETS);
      const index = assets.findIndex(a => a.id === id);
      if (index !== -1) {
        assets[index] = { ...assets[index], ...assetUpdate, updated_at: now };
        await this.setWebData(STORAGE_KEYS.ASSETS, assets);
      }
      return;
    }
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (assetUpdate.name !== undefined) { fields.push('name = ?'); values.push(assetUpdate.name); }
    if (assetUpdate.serial_number !== undefined) { fields.push('serial_number = ?'); values.push(assetUpdate.serial_number); }
    if (assetUpdate.quantity !== undefined) { fields.push('quantity = ?'); values.push(assetUpdate.quantity); }
    if (assetUpdate.location !== undefined) { fields.push('location = ?'); values.push(assetUpdate.location); }
    if (assetUpdate.photo_uri !== undefined) { fields.push('photo_uri = ?'); values.push(assetUpdate.photo_uri); }
    if (assetUpdate.rfid_code !== undefined) { fields.push('rfid_code = ?'); values.push(assetUpdate.rfid_code); }
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    await this.db.runAsync(
      `UPDATE assets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteAsset(id: number): Promise<void> {
    if (this.isWeb) {
      const assets = await this.getWebData<Asset>(STORAGE_KEYS.ASSETS);
      const filtered = assets.filter(a => a.id !== id);
      await this.setWebData(STORAGE_KEYS.ASSETS, filtered);
      return;
    }
    
    await this.db.runAsync('DELETE FROM assets WHERE id = ?', [id]);
  }

  async getAssets(departmentId: number): Promise<Asset[]> {
    if (this.isWeb) {
      const assets = await this.getWebData<Asset>(STORAGE_KEYS.ASSETS);
      return assets.filter(a => a.department_id === departmentId).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    const results = await this.db.getAllAsync<Asset>(
      'SELECT * FROM assets WHERE department_id = ? ORDER BY created_at DESC',
      [departmentId]
    );
    
    return results;
  }

  async searchAssets(departmentId: number, query: string): Promise<Asset[]> {
    if (this.isWeb) {
      const assets = await this.getWebData<Asset>(STORAGE_KEYS.ASSETS);
      const lowerQuery = query.toLowerCase();
      return assets.filter(a => 
        a.department_id === departmentId &&
        (a.name.toLowerCase().includes(lowerQuery) ||
         a.serial_number.toLowerCase().includes(lowerQuery) ||
         a.rfid_code.toLowerCase().includes(lowerQuery) ||
         a.location.toLowerCase().includes(lowerQuery))
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    const searchPattern = `%${query}%`;
    const results = await this.db.getAllAsync<Asset>(
      `SELECT * FROM assets 
       WHERE department_id = ? 
       AND (name LIKE ? OR serial_number LIKE ? OR rfid_code LIKE ? OR location LIKE ?)
       ORDER BY created_at DESC`,
      [departmentId, searchPattern, searchPattern, searchPattern, searchPattern]
    );
    
    return results;
  }

  async getAssetByRfid(rfidCode: string): Promise<Asset | null> {
    if (this.isWeb) {
      const assets = await this.getWebData<Asset>(STORAGE_KEYS.ASSETS);
      return assets.find(a => a.rfid_code === rfidCode) || null;
    }
    
    const result = await this.db.getFirstAsync<Asset>(
      'SELECT * FROM assets WHERE rfid_code = ?',
      [rfidCode]
    );
    
    return result || null;
  }

  // Inventory operations
  async createInventorySession(name: string, departmentId: number): Promise<InventorySession> {
    const date = new Date().toISOString();
    
    if (this.isWeb) {
      const sessions = await this.getWebData<InventorySession>(STORAGE_KEYS.INVENTORY_SESSIONS);
      const newSession: InventorySession = {
        id: this.getNextId(sessions),
        name,
        date,
        department_id: departmentId,
        created_at: date,
      };
      sessions.push(newSession);
      await this.setWebData(STORAGE_KEYS.INVENTORY_SESSIONS, sessions);
      return newSession;
    }
    
    const result = await this.db.runAsync(
      'INSERT INTO inventory_sessions (name, date, department_id) VALUES (?, ?, ?)',
      [name, date, departmentId]
    );
    
    return {
      id: result.lastInsertRowId,
      name,
      date,
      department_id: departmentId,
      created_at: date,
    };
  }

  async addInventoryScan(sessionId: number, rfidCode: string): Promise<InventoryScan> {
    const timestamp = new Date().toISOString();
    
    if (this.isWeb) {
      const scans = await this.getWebData<InventoryScan>(STORAGE_KEYS.INVENTORY_SCANS);
      const newScan: InventoryScan = {
        id: this.getNextId(scans),
        session_id: sessionId,
        rfid_code: rfidCode,
        timestamp,
      };
      scans.push(newScan);
      await this.setWebData(STORAGE_KEYS.INVENTORY_SCANS, scans);
      return newScan;
    }
    
    const result = await this.db.runAsync(
      'INSERT INTO inventory_scans (session_id, rfid_code, timestamp) VALUES (?, ?, ?)',
      [sessionId, rfidCode, timestamp]
    );
    
    return {
      id: result.lastInsertRowId,
      session_id: sessionId,
      rfid_code: rfidCode,
      timestamp,
    };
  }

  async getInventoryScans(sessionId: number): Promise<InventoryScan[]> {
    if (this.isWeb) {
      const scans = await this.getWebData<InventoryScan>(STORAGE_KEYS.INVENTORY_SCANS);
      return scans.filter(s => s.session_id === sessionId).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }
    
    const results = await this.db.getAllAsync<InventoryScan>(
      'SELECT * FROM inventory_scans WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );
    
    return results;
  }

  async getInventoryResult(sessionId: number, departmentId: number): Promise<InventoryResult> {
    const allAssets = await this.getAssets(departmentId);
    const scans = await this.getInventoryScans(sessionId);
    
    const scannedRfids = new Set(scans.map(scan => scan.rfid_code));
    
    const found = allAssets.filter(asset => scannedRfids.has(asset.rfid_code));
    const missing = allAssets.filter(asset => !scannedRfids.has(asset.rfid_code));
    
    return {
      found,
      missing,
      scanned: scans,
    };
  }

  async getInventorySessions(departmentId: number): Promise<InventorySession[]> {
    if (this.isWeb) {
      const sessions = await this.getWebData<InventorySession>(STORAGE_KEYS.INVENTORY_SESSIONS);
      return sessions.filter(s => s.department_id === departmentId).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    const results = await this.db.getAllAsync<InventorySession>(
      'SELECT * FROM inventory_sessions WHERE department_id = ? ORDER BY created_at DESC',
      [departmentId]
    );
    
    return results;
  }
}

export const databaseService = new DatabaseService();
