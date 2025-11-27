import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { databaseService, User, Department, Asset, InventorySession } from '@/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextType {
  // Auth state
  user: User | null;
  department: Department | null;
  isAuthenticated: boolean;
  isSetupComplete: boolean;
  loading: boolean;
  
  // Auth methods
  createUserAndDepartment: (username: string, password: string, departmentName: string) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Asset methods
  assets: Asset[];
  loadAssets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'department_id'>) => Promise<void>;
  updateAsset: (id: number, asset: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
  searchAssets: (query: string) => Promise<Asset[]>;
  
  // Inventory methods
  currentSession: InventorySession | null;
  createInventorySession: (name: string) => Promise<InventorySession>;
  addScan: (rfidCode: string) => Promise<void>;
  endInventorySession: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const AUTH_KEY = 'auth_user_id';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentSession, setCurrentSession] = useState<InventorySession | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await databaseService.initialize();
      
      const existingUser = await databaseService.getUser();
      if (existingUser) {
        setIsSetupComplete(true);
        
        const savedUserId = await AsyncStorage.getItem(AUTH_KEY);
        if (savedUserId) {
          setUser(existingUser);
          const dept = await databaseService.getDepartment(existingUser.id);
          setDepartment(dept);
          setIsAuthenticated(true);
          
          if (dept) {
            await loadAssetsInternal(dept.id);
          }
        }
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserAndDepartment = async (username: string, password: string, departmentName: string) => {
    try {
      const newUser = await databaseService.createUser(username, password);
      const newDept = await databaseService.createDepartment(departmentName, newUser.id);
      
      setUser(newUser);
      setDepartment(newDept);
      setIsSetupComplete(true);
      setIsAuthenticated(true);
      
      await AsyncStorage.setItem(AUTH_KEY, newUser.id.toString());
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const isValid = await databaseService.verifyPassword(username, password);
      
      if (isValid) {
        const userData = await databaseService.getUser();
        if (userData) {
          setUser(userData);
          const dept = await databaseService.getDepartment(userData.id);
          setDepartment(dept);
          setIsAuthenticated(true);
          
          await AsyncStorage.setItem(AUTH_KEY, userData.id.toString());
          
          if (dept) {
            await loadAssetsInternal(dept.id);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setDepartment(null);
    setIsAuthenticated(false);
    setAssets([]);
    setCurrentSession(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  };

  const loadAssetsInternal = async (deptId: number) => {
    const assetList = await databaseService.getAssets(deptId);
    setAssets(assetList);
  };

  const loadAssets = async () => {
    if (department) {
      await loadAssetsInternal(department.id);
    }
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'department_id'>) => {
    if (!department) throw new Error('No department');
    
    await databaseService.createAsset({
      ...asset,
      department_id: department.id,
    });
    
    await loadAssets();
  };

  const updateAsset = async (id: number, asset: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>) => {
    await databaseService.updateAsset(id, asset);
    await loadAssets();
  };

  const deleteAsset = async (id: number) => {
    await databaseService.deleteAsset(id);
    await loadAssets();
  };

  const searchAssets = async (query: string): Promise<Asset[]> => {
    if (!department) return [];
    
    if (!query.trim()) {
      return assets;
    }
    
    return await databaseService.searchAssets(department.id, query);
  };

  const createInventorySession = async (name: string): Promise<InventorySession> => {
    if (!department) throw new Error('No department');
    
    const session = await databaseService.createInventorySession(name, department.id);
    setCurrentSession(session);
    return session;
  };

  const addScan = async (rfidCode: string) => {
    if (!currentSession) throw new Error('No active inventory session');
    
    await databaseService.addInventoryScan(currentSession.id, rfidCode);
  };

  const endInventorySession = () => {
    setCurrentSession(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        department,
        isAuthenticated,
        isSetupComplete,
        loading,
        createUserAndDepartment,
        login,
        logout,
        assets,
        loadAssets,
        addAsset,
        updateAsset,
        deleteAsset,
        searchAssets,
        currentSession,
        createInventorySession,
        addScan,
        endInventorySession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
