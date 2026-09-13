import React, { useState, useEffect, useRef } from 'react';
import { 
  db, 
  ensureDatabaseDefaults, 
  subscribeToDatabase, 
  subscribeToConnectionStatus, 
  subscribeToOfflineQueue, 
  flushOfflineQueue, 
  refreshOfflineQueueCount,
  setTerminalIdentity,
  DEFAULT_INITIAL_DATA 
} from './db/db';
import Header from './components/Header';
import POSBilling from './components/POSBilling';
import OrderCartPopup from './components/OrderCartPopup';
import CreateNewTableModal from './components/CreateNewTableModal';
import SettledBills from './components/SettledBills';
import OwnerAdmin from './components/OwnerAdmin';
import StockManagement from './components/StockManagement';
import ServerMonitorPanel from './components/ServerMonitorPanel';
import { ShieldCheck, Lock, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'settle' | 'stock' | 'server' | 'admin'
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Owner PIN Modal Security
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Terminal / Counter State
  const [activeCounter, setActiveCounterState] = useState(() => {
    return localStorage.getItem('karuna_active_counter') || 'Counter 1 (Breakfast & Snacks)';
  });

  const handleSelectCounter = (counterName) => {
    setActiveCounterState(counterName);
    localStorage.setItem('karuna_active_counter', counterName);
    setTerminalIdentity(counterName);
  };

  // Real-Time Master Database State
  const [categories, setCategories] = useState(DEFAULT_INITIAL_DATA.categories);
  const [subCategories, setSubCategories] = useState(DEFAULT_INITIAL_DATA.subCategories);
  const [dishes, setDishes] = useState(DEFAULT_INITIAL_DATA.dishes);
  const [sections, setSections] = useState(DEFAULT_INITIAL_DATA.sections);
  const [tables, setTables] = useState(DEFAULT_INITIAL_DATA.diningTables);
  const [bills, setBills] = useState([]);
  const [billLogs, setBillLogs] = useState([]);
  const [rawMaterials, setRawMaterials] = useState(DEFAULT_INITIAL_DATA.rawMaterials);
  const [recipes, setRecipes] = useState(DEFAULT_INITIAL_DATA.recipes);

  // Cart State & Active Table State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(null);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);

  // Helper to deduplicate array items by ID or Name & auto-collapse empty split tables (D9-B, etc.)
  const deduplicateById = (arr, isTableCollection = false, isSectionCollection = false) => {
    if (!Array.isArray(arr)) return [];
    const map = new Map();
    arr.forEach((item) => {
      if (!item) return;
      let key;
      if (isTableCollection && item.name) {
        key = String(item.name).toUpperCase().trim();
      } else if (isSectionCollection && item.name) {
        let cleanName = String(item.name).trim();
        if (cleanName.toLowerCase().includes('parcel')) cleanName = 'Parcels';
        key = cleanName.toLowerCase();
      } else {
        key = item.id !== undefined ? String(item.id) : JSON.stringify(item);
      }

      const existing = map.get(key);
      if (!existing) {
        map.set(key, isSectionCollection && item.name && item.name.toLowerCase().includes('parcel') ? { ...item, name: 'Parcels' } : item);
      } else {
        if (isSectionCollection) {
          if (item.id < existing.id) {
            map.set(key, item.name && item.name.toLowerCase().includes('parcel') ? { ...item, name: 'Parcels' } : item);
          }
        } else {
          const itemHasCart = item.status === 'occupied' || item.status === 'bill_released' || (item.currentCart && item.currentCart.length > 0);
          const existingHasCart = existing.status === 'occupied' || existing.status === 'bill_released' || (existing.currentCart && existing.currentCart.length > 0);

          if (itemHasCart && !existingHasCart) {
            map.set(key, item);
          } else if (itemHasCart && existingHasCart) {
            map.set(key, { ...existing, ...item, currentCart: item.currentCart?.length ? item.currentCart : existing.currentCart });
          } else {
            if (typeof item.id === 'number' && item.id < 100000) {
              map.set(key, item);
            }
          }
        }
      }
    });

    let result = Array.from(map.values());

    if (isSectionCollection) {
      const hasParcels = result.some((s) => s.name && s.name.toLowerCase().includes('parcel'));
      if (!hasParcels) {
        result.push({ id: 4, name: 'Parcels', extraCharge: 0, color: 'amber' });
      }
      // Always position Parcels section AT THE VERY END (LAST)
      const nonParcels = result.filter((s) => !s.name || !s.name.toLowerCase().includes('parcel'));
      const parcels = result.filter((s) => s.name && s.name.toLowerCase().includes('parcel'));
      result = [...nonParcels, ...parcels];
    }

    if (isTableCollection) {
      // Filter out empty parcel tables (Parcels section tables that have no active orders)
      result = result.filter((t) => {
        if (!t) return false;
        const isParcelTable = t.sectionId === 4 || (t.name && String(t.name).toUpperCase().startsWith('P')) || t.isParcel;
        if (isParcelTable) {
          const hasActiveOrder = (t.status === 'occupied' || t.status === 'bill_released') && t.currentCart && t.currentCart.length > 0;
          return hasActiveOrder;
        }
        return true;
      });

      const baseNames = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'AC1', 'AC2', 'AC3', 'AC4', 'AC5'];

      baseNames.forEach((baseName) => {
        const splits = result.filter((t) => {
          if (!t || !t.name) return false;
          const u = String(t.name).toUpperCase().trim();
          const p = t.parentTable ? String(t.parentTable).toUpperCase().trim() : '';
          return u === baseName || u.startsWith(`${baseName}-`) || p === baseName;
        });

        if (splits.length > 0) {
          const activeSplits = splits.filter((t) => t.status === 'occupied' || t.status === 'bill_released' || (t.currentCart && t.currentCart.length > 0));

          if (activeSplits.length === 0) {
            // Remove all split variants and collapse back to single clean base table
            result = result.filter((t) => {
              if (!t || !t.name) return false;
              const u = String(t.name).toUpperCase().trim();
              const p = t.parentTable ? String(t.parentTable).toUpperCase().trim() : '';
              return !(u === baseName || u.startsWith(`${baseName}-`) || p === baseName);
            });
            const defObj = DEFAULT_INITIAL_DATA.diningTables.find((d) => String(d.name).toUpperCase().trim() === baseName);
            if (defObj) {
              result.push({ ...defObj, status: 'empty', currentCart: [], isSplit: false, parentTable: null });
            }
          } else {
            // Prune empty split child tables (e.g. empty D9-B)
            const emptyIds = new Set(
              splits
                .filter((t) => t.status !== 'occupied' && t.status !== 'bill_released' && (!t.currentCart || t.currentCart.length === 0))
                .map((t) => t.id)
            );
            if (emptyIds.size > 0) {
              result = result.filter((t) => !emptyIds.has(t.id));
            }

            // If only 1 portion remains (e.g. D9-A), rename D9-A back to D9
            const remainingSplits = result.filter((t) => {
              if (!t || !t.name) return false;
              const u = String(t.name).toUpperCase().trim();
              const p = t.parentTable ? String(t.parentTable).toUpperCase().trim() : '';
              return u.startsWith(`${baseName}-`) || p === baseName;
            });
            if (remainingSplits.length === 1 && remainingSplits[0].name.endsWith('-A')) {
              remainingSplits[0].name = baseName;
              remainingSplits[0].isSplit = false;
              remainingSplits[0].parentTable = null;
            }
          }
        }
      });
    }

    return result;
  };

  // Helper to sync all React state from database cache
  const syncStateFromCache = (cache) => {
    if (cache.categories) setCategories(deduplicateById(cache.categories));
    if (cache.subCategories) setSubCategories(deduplicateById(cache.subCategories));
    if (cache.dishes) setDishes(deduplicateById(cache.dishes));
    if (cache.sections) setSections(deduplicateById(cache.sections, false, true));
    if (cache.diningTables) setTables(deduplicateById(cache.diningTables, true));
    if (cache.bills) setBills(deduplicateById(cache.bills));
    if (cache.billLogs) setBillLogs(deduplicateById(cache.billLogs));
    if (cache.rawMaterials) setRawMaterials(deduplicateById(cache.rawMaterials));
    if (cache.recipes) setRecipes(deduplicateById(cache.recipes));
  };

  const activeTableRef = useRef(activeTable);
  activeTableRef.current = activeTable;

  // Initialize DB & WebSocket connection
  useEffect(() => {
    // 1. Connection status listener
    const unsubscribeConn = subscribeToConnectionStatus((status) => {
      setIsServerConnected(status);
    });

    // 2. Offline Queue listener
    const unsubscribeQueue = subscribeToOfflineQueue((count) => {
      setOfflineQueueCount(count);
    });

    // 3. Database changes listener
    const unsubscribeDb = subscribeToDatabase((eventType, payload, fullCache) => {
      syncStateFromCache(fullCache);

      const curTable = activeTableRef.current;
      if (curTable && fullCache?.diningTables) {
        if (eventType === 'BILL_SETTLED' && payload?.deletedTableId === curTable.id) {
          setActiveTable(null);
          setCartItems([]);
          setIsCartOpen(false);
        } else if (payload?.collection === 'diningTables' && String(payload?.id) === String(curTable.id)) {
          if (eventType === 'DELETE') {
            setActiveTable(null);
            setCartItems([]);
            setIsCartOpen(false);
          }
        } else {
          const matched = fullCache.diningTables.find((t) => String(t.id) === String(curTable.id));
          if (matched && matched.status === 'occupied' && matched.currentCart) {
            setCartItems([...matched.currentCart]);
          }
        }
      }
    });

    // 4. Load defaults and bootstrap
    ensureDatabaseDefaults().then((cache) => {
      if (cache) {
        syncStateFromCache(cache);
        try {
          const savedTableId = sessionStorage.getItem('karuna_active_table_id');
          if (savedTableId && cache.diningTables) {
            const matchedTable = cache.diningTables.find((t) => String(t.id) === String(savedTableId));
            if (matchedTable) {
              setActiveTable(matchedTable);
              setCartItems(matchedTable.currentCart || []);
              if (matchedTable.sectionId && cache.sections) {
                const matchSec = cache.sections.find((s) => s.id === matchedTable.sectionId);
                if (matchSec) setActiveSectionState(matchSec);
              }
            }
          }
        } catch (e) {}
      }
    });

    return () => {
      unsubscribeConn();
      unsubscribeQueue();
      unsubscribeDb();
    };
  }, []);

  // Force Sync Action
  const handleForceSync = async () => {
    await flushOfflineQueue();
    await refreshOfflineQueueCount();
  };

  // Owner PIN Protection
  const handleRequestAdminTab = () => {
    if (activeCounter.toLowerCase().includes('owner') || activeCounter.toLowerCase().includes('master')) {
      setActiveTab('admin');
    } else {
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '8446' || pinInput === '9999') {
      setIsPinModalOpen(false);
      setActiveTab('admin');
    } else {
      setPinError('Invalid Owner PIN! Default is 1234');
    }
  };

  // Active Dining Section State
  const [activeSectionState, setActiveSectionState] = useState(null);
  const activeSection = activeSectionState || sections[0] || { id: 1, name: 'Dine In Area', extraCharge: 0 };

  // Select Table Handling
  const handleSelectTable = (tableObj) => {
    if (!tableObj || tableObj.nativeEvent || tableObj.id === undefined) {
      if (!tableObj) {
        try {
          sessionStorage.removeItem('karuna_active_table_id');
        } catch (e) {}
        setActiveTable(null);
        setCartItems([]);
        setIsCartOpen(false);
      }
      return;
    }

    try {
      sessionStorage.setItem('karuna_active_table_id', String(tableObj.id));
    } catch (e) {}
    setActiveTable(tableObj);
    
    if (tableObj.sectionId) {
      const matchSec = sections.find((s) => s.id === tableObj.sectionId);
      if (matchSec) setActiveSectionState(matchSec);
    }

    setCartItems(tableObj.currentCart || []);
  };

  // Split Table Action
  const handleSplitTable = async (parentTable) => {
    if (!parentTable) return;

    const rootName = parentTable.parentTable || parentTable.name.split('-')[0];
    const existingSplits = tables.filter(
      (t) => t.parentTable === rootName || t.name.startsWith(`${rootName}-`) || t.name === rootName
    );

    let targetSplitTable = null;

    if (!parentTable.isSplit && !parentTable.name.includes('-')) {
      await db.diningTables.update(parentTable.id, {
        name: `${rootName}-A`,
        isSplit: true,
        parentTable: rootName,
        customerName: parentTable.customerName || 'Customer 1'
      });

      const splitBData = {
        name: `${rootName}-B`,
        sectionId: parentTable.sectionId,
        status: 'empty',
        currentCart: [],
        currentTokenNo: Math.floor(1000 + Math.random() * 9000).toString(),
        isSplit: true,
        parentTable: rootName,
        customerName: 'Customer 2',
        createdAt: null
      };
      const newId = await db.diningTables.add(splitBData);
      targetSplitTable = { ...splitBData, id: newId };
    } else {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      let nextLetter = 'C';
      for (const l of letters) {
        if (!existingSplits.some((t) => t.name === `${rootName}-${l}`)) {
          nextLetter = l;
          break;
        }
      }

      const nextCustomerNum = existingSplits.length + 1;
      const newSplitData = {
        name: `${rootName}-${nextLetter}`,
        sectionId: parentTable.sectionId,
        status: 'empty',
        currentCart: [],
        currentTokenNo: Math.floor(1000 + Math.random() * 9000).toString(),
        isSplit: true,
        parentTable: rootName,
        customerName: `Customer ${nextCustomerNum}`,
        createdAt: null
      };
      const newId = await db.diningTables.add(newSplitData);
      targetSplitTable = { ...newSplitData, id: newId };
    }

    if (targetSplitTable) {
      handleSelectTable(targetSplitTable);
    }
  };

  // Add Table / Card from Admin
  const handleAddTable = async (tableData) => {
    const newTable = {
      name: tableData.name.trim(),
      sectionId: tableData.sectionId,
      status: 'empty',
      currentCart: [],
      currentTokenNo: Math.floor(1000 + Math.random() * 9000).toString(),
      isSplit: false,
      createdAt: null
    };
    const newId = await db.diningTables.add(newTable);
    return newId;
  };

  // Delete / Remove Table
  const handleDeleteTable = async (tableId) => {
    if (activeTable && activeTable.id === tableId) {
      setActiveTable(null);
      setCartItems([]);
      setIsCartOpen(false);
    }
    await db.diningTables.delete(tableId);
  };

  // Create Table in Modal
  const handleCreateTableAndOpenMenu = async (tableData) => {
    const newId = await db.diningTables.add(tableData);
    const createdTable = { ...tableData, id: newId };
    
    if (tableData.sectionId) {
      const matchSec = sections.find((s) => s.id === tableData.sectionId);
      if (matchSec) setActiveSectionState(matchSec);
    }

    setActiveTable(createdTable);
    setCartItems([]);
    setIsCartOpen(false);
  };

  // Save Order by Pressing 'K' Key
  const handleSaveTableOrder = async () => {
    if (!activeTable || cartItems.length === 0) return;

    const assignedToken = (activeTable.currentTokenNo && parseInt(activeTable.currentTokenNo) >= 100)
      ? activeTable.currentTokenNo
      : String(1000 + (parseInt(activeTable.id) || 1));
    const orderStartTime = (activeTable.status === 'occupied' && activeTable.createdAt)
      ? activeTable.createdAt
      : new Date().toISOString();

    await db.diningTables.update(activeTable.id, {
      status: 'occupied',
      currentCart: cartItems,
      currentTokenNo: assignedToken,
      createdAt: orderStartTime
    });

    try {
      sessionStorage.removeItem('karuna_active_table_id');
    } catch (e) {}
    setActiveTable(null);
    setCartItems([]);
    setIsCartOpen(false);
  };

  // Cart Management - Single Line Item Per Dish (Increases quantity instead of duplicating rows)
  const handleAddToCart = async (dishItem) => {
    const noteKey = dishItem.customNote || '';
    const initialQty = dishItem.qty !== undefined ? dishItem.qty : 1;
    const unitKey = dishItem.unit || (dishItem.weightKg ? `${dishItem.weightKg} Kg` : null);
    const isParcel = Boolean(dishItem.isParcel);

    // Match existing cart item by Dish ID or Name AND matching variant unit, parcel status, and note
    const existingIndex = cartItems.findIndex((item) => {
      const matchIdentity = item.id === dishItem.id || (item.name && dishItem.name && item.name === dishItem.name);
      if (!matchIdentity) return false;
      const itemUnit = item.unit || (item.weightKg ? `${item.weightKg} Kg` : null);
      if ((itemUnit || '') !== (unitKey || '')) return false;
      if (Boolean(item.isParcel) !== isParcel) return false;
      if (noteKey !== (item.customNote || '')) return false;
      return true;
    });

    let updated;

    if (existingIndex !== -1) {
      updated = [...cartItems];
      const existing = updated[existingIndex];
      const newQty = (parseFloat(existing.qty) || 1) + initialQty;
      
      const newUnit = unitKey || existing.unit;
      const newPrice = dishItem.price !== undefined ? dishItem.price : existing.price;
      const newWeight = dishItem.weightKg !== undefined ? dishItem.weightKg : existing.weightKg;

      updated[existingIndex] = {
        ...existing,
        qty: newQty,
        unit: newUnit,
        price: newPrice,
        weightKg: newWeight,
        qtyDisplay: newUnit ? (newQty > 1 ? `${newQty} × ${newUnit}` : newUnit) : `${newQty}`
      };
    } else {
      const cartItemId = `${dishItem.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      updated = [...cartItems, {
        ...dishItem,
        cartItemId,
        qty: initialQty,
        unit: unitKey,
        isParcel,
        qtyDisplay: unitKey ? (initialQty > 1 ? `${initialQty} × ${unitKey}` : unitKey) : `${initialQty}`
      }];
    }

    setCartItems(updated);

    if (activeTable) {
      const orderStartTime = (activeTable.status === 'occupied' && activeTable.createdAt)
        ? activeTable.createdAt
        : new Date().toISOString();

      await db.diningTables.update(activeTable.id, {
        currentCart: updated,
        status: 'occupied',
        createdAt: orderStartTime
      });
    }
  };

  const handleReduceFromCart = async (dishItem) => {
    if (!dishItem) return;
    const targetUnit = dishItem.unit || (dishItem.weightKg ? `${dishItem.weightKg} Kg` : null);
    const existingIndex = cartItems.findIndex((item) => {
      const matchIdentity = item.id === dishItem.id || (item.name && dishItem.name && item.name === dishItem.name);
      if (!matchIdentity) return false;
      if (targetUnit && item.unit && item.unit !== targetUnit) return false;
      if (dishItem.isParcel !== undefined && Boolean(item.isParcel) !== Boolean(dishItem.isParcel)) return false;
      return true;
    });
    if (existingIndex === -1) return;

    const existing = cartItems[existingIndex];
    const curQty = parseFloat(existing.qty) || 1;

    let updated;
    if (curQty > 1) {
      updated = [...cartItems];
      const newQty = curQty - 1;
      updated[existingIndex] = {
        ...existing,
        qty: newQty,
        qtyDisplay: existing.unit ? (newQty > 1 ? `${newQty} × ${existing.unit}` : existing.unit) : `${newQty}`
      };
    } else {
      updated = cartItems.filter((_, idx) => idx !== existingIndex);
    }

    setCartItems(updated);

    if (activeTable) {
      await db.diningTables.update(activeTable.id, {
        currentCart: updated,
        status: updated.length > 0 ? 'occupied' : 'empty'
      });
    }
  };

  const handleUpdateCartItem = async (index, updatedFields) => {
    if (index < 0 || index >= cartItems.length) return;
    const updated = [...cartItems];
    updated[index] = { ...updated[index], ...updatedFields };
    setCartItems(updated);
    if (activeTable) {
      await db.diningTables.update(activeTable.id, { currentCart: updated });
    }
  };

  const handleUpdateCartQty = async (targetKey, newQty, unit) => {
    let updated;
    if (newQty <= 0) {
      updated = cartItems.filter((i) => (i.cartItemId ? i.cartItemId !== targetKey : (i.id !== targetKey || (unit && i.unit !== unit))));
    } else {
      updated = cartItems.map((i) => {
        const matches = i.cartItemId ? i.cartItemId === targetKey : (i.id === targetKey && (!unit || i.unit === unit));
        return matches ? { ...i, qty: newQty } : i;
      });
    }
    setCartItems(updated);

    if (activeTable) {
      await db.diningTables.update(activeTable.id, {
        currentCart: updated,
        status: updated.length > 0 ? 'occupied' : 'empty'
      });
    }
  };

  const handleRemoveCartItem = async (targetKey, unit) => {
    const updated = cartItems.filter((i) => (i.cartItemId ? i.cartItemId !== targetKey : (i.id !== targetKey || (unit && i.unit !== unit))));
    setCartItems(updated);

    if (activeTable) {
      await db.diningTables.update(activeTable.id, {
        currentCart: updated,
        status: updated.length > 0 ? 'occupied' : 'empty'
      });
    }
  };

  // Settle Bill Action
  const handleSettleBill = async (billData) => {
    const payload = {
      tableId: activeTable?.id,
      tokenNo: billData.tokenNo,
      tableNo: billData.tableNo || (activeTable ? activeTable.name : 'Takeaway'),
      items: billData.items,
      subtotal: billData.subtotal,
      sectionName: billData.sectionName,
      sectionExtraCharge: 0,
      total: billData.total,
      counter: activeCounter,
      paymentDetails: billData.paymentDetails,
      status: 'settled',
      createdAt: new Date().toISOString()
    };

    const result = await db.settleBill(payload);

    if (activeTable && (activeTable.sectionId === 4 || activeTable.name?.startsWith('P') || activeTable.isParcel || activeTable.isSplit || activeTable.name?.includes('-'))) {
      try {
        await db.diningTables.delete(activeTable.id);
      } catch (e) {}
    }

    setActiveTable(null);
    setCartItems([]);
    setIsCartOpen(false);
    setActiveTab('pos');
    return result;
  };

  // Update Settled Bill
  const handleUpdateSettledBill = async (updatedBill, changeDescription) => {
    await db.bills.update(updatedBill.id, {
      items: updatedBill.items,
      subtotal: updatedBill.subtotal,
      total: updatedBill.total,
      finalTotal: updatedBill.total || updatedBill.finalTotal,
      paymentMode: updatedBill.paymentMode,
      isResettled: true,
      resettledAt: updatedBill.resettledAt || new Date().toISOString()
    });

    await db.billLogs.add({
      billId: updatedBill.id,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' }),
      changeDescription
    });
  };

  // Owner Admin Handlers
  const handleAddDish = async (dishData) => {
    await db.dishes.add(dishData);
  };

  const handleUpdateDish = async (idOrDish, optionalDishData) => {
    const dishData = (typeof idOrDish === 'object' && idOrDish !== null) ? idOrDish : optionalDishData;
    if (dishData && dishData.id) {
      await db.dishes.put(dishData);
    }
  };

  const handleDeleteDish = async (id) => {
    await db.dishes.delete(id);
  };

  const handleAddSubCategory = async (subCatData) => {
    await db.subCategories.add(subCatData);
  };

  const handleDeleteSubCategory = async (id) => {
    await db.subCategories.delete(id);
  };

  const handleUpdateSection = async (id, updatedFields) => {
    await db.sections.update(id, updatedFields);
  };

  const handleAddSection = async (sectionData) => {
    await db.sections.add(sectionData);
  };

  const handleDeleteSection = async (id) => {
    await db.sections.delete(id);
    const orphanedTables = tables.filter((t) => t && t.sectionId === id);
    for (const t of orphanedTables) {
      await db.diningTables.delete(t.id);
    }
  };

  const handleBulkUpdatePrices = async (importedItems) => {
    await db.bulkUpdatePrices(importedItems);
  };

  // Stock Management Handlers
  const handleAddRawMaterial = async (rmData) => {
    await db.rawMaterials.add(rmData);
  };

  const handleUpdateRawMaterial = async (idOrData, updatedFields) => {
    if (typeof idOrData === 'object' && idOrData !== null) {
      await db.rawMaterials.put(idOrData);
    } else if (updatedFields) {
      await db.rawMaterials.update(idOrData, updatedFields);
    }
  };

  const handleDeleteRawMaterial = async (id) => {
    await db.rawMaterials.delete(id);
  };

  const handleSaveRecipeMapping = async (recipeData) => {
    const existing = recipes.find(
      (r) => String(r.dishId) === String(recipeData.dishId) && String(r.rawMaterialId) === String(recipeData.rawMaterialId)
    );
    if (existing) {
      const newQty = Math.round(((parseFloat(existing.qtyRequired) || 0) + (parseFloat(recipeData.qtyRequired) || 0)) * 100) / 100;
      await db.recipes.update(existing.id, { qtyRequired: newQty });
    } else {
      await db.recipes.add(recipeData);
    }
  };

  const ZOOM_STEPS = [100, 125, 150, 175, 200];
  const [zoomIndex, setZoomIndex] = useState(() => {
    const saved = localStorage.getItem('karuna_table_zoom_index');
    const parsed = parseInt(saved, 10);
    return !isNaN(parsed) && parsed >= 0 && parsed < ZOOM_STEPS.length ? parsed : 0;
  });
  const currentZoom = ZOOM_STEPS[zoomIndex] || 100;

  const handleZoomIn = () => {
    setZoomIndex((idx) => {
      const next = Math.min(ZOOM_STEPS.length - 1, idx + 1);
      localStorage.setItem('karuna_table_zoom_index', String(next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomIndex((idx) => {
      const next = Math.max(0, idx - 1);
      localStorage.setItem('karuna_table_zoom_index', String(next));
      return next;
    });
  };

  const [isHeaderHidden, setIsHeaderHidden] = useState(() => {
    return localStorage.getItem('karuna_header_hidden') === 'true';
  });

  const toggleHeaderHidden = () => {
    setIsHeaderHidden((prev) => {
      const next = !prev;
      localStorage.setItem('karuna_header_hidden', String(next));
      return next;
    });
  };

  const pendingCartCount = cartItems.reduce((acc, i) => acc + (parseFloat(i.qty) || 1), 0);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden select-none relative">
      
      {(!activeTable || activeTab !== 'pos') && !isHeaderHidden && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCartCount={pendingCartCount}
          activeCounter={activeCounter}
          onSelectCounter={handleSelectCounter}
          isServerConnected={isServerConnected}
          offlineQueueCount={offlineQueueCount}
          onForceSync={handleForceSync}
          onRequestAdminTab={handleRequestAdminTab}
          onToggleHeaderHidden={toggleHeaderHidden}
          currentZoom={currentZoom}
          canZoomIn={zoomIndex < ZOOM_STEPS.length - 1}
          canZoomOut={zoomIndex > 0}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      )}

      {/* Fixed Position Hide/Show Header Toggle Button (Always at fixed top-3 right-3) */}
      {(!activeTable || activeTab !== 'pos') && (
        <button
          type="button"
          onClick={toggleHeaderHidden}
          className={`fixed top-3 right-3 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
            isHeaderHidden
              ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl animate-in slide-in-from-top-2'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-sm'
          }`}
          title={isHeaderHidden ? 'Show Navigation Header' : 'Hide Navigation Header'}
        >
          {isHeaderHidden ? (
            <ChevronDown className="w-5 h-5 text-blue-400 stroke-[3]" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-700 stroke-[3]" />
          )}
        </button>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {activeTab === 'pos' && (
          <POSBilling
            currentZoom={currentZoom}
            dishes={dishes}
            categories={categories}
            subCategories={subCategories}
            sections={sections}
            tables={tables}
            activeSection={activeSection}
            setActiveSection={setActiveSectionState}
            activeTable={activeTable}
            settledBillsCount={bills.length}
            settledBills={bills}
            allDishes={dishes}
            billLogs={billLogs}
            onUpdateSettledBill={handleUpdateSettledBill}
            onSelectTable={handleSelectTable}
            onSaveTableOrder={handleSaveTableOrder}
            onOpenAddTableModal={() => setIsAddTableModalOpen(true)}
            onNavigateToSettled={() => setActiveTab('settle')}
            onOpenOrderPopupForTable={(tbl) => {
              if (tbl) {
                handleSelectTable(tbl);
              }
              setIsCartOpen(true);
            }}
            onSplitTable={handleSplitTable}
            onDeleteTable={handleDeleteTable}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onReduceFromCart={handleReduceFromCart}
            onUpdateCartItem={handleUpdateCartItem}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={() => setCartItems([])}
            onSettleBill={handleSettleBill}
          />
        )}

        {activeTab === 'settle' && (
          <SettledBills
            settledBills={bills}
            allDishes={dishes}
            billLogs={billLogs}
            onUpdateSettledBill={handleUpdateSettledBill}
          />
        )}

        {activeTab === 'stock' && (
          <StockManagement
            rawMaterials={rawMaterials}
            dishes={dishes}
            categories={categories}
            recipes={recipes}
            onAddRawMaterial={handleAddRawMaterial}
            onUpdateRawMaterial={handleUpdateRawMaterial}
            onDeleteRawMaterial={handleDeleteRawMaterial}
            onSaveRecipeMapping={handleSaveRecipeMapping}
          />
        )}

        {activeTab === 'server' && (
          <ServerMonitorPanel
            isServerConnected={isServerConnected}
            bills={bills}
            dishes={dishes}
            offlineQueueCount={offlineQueueCount}
            activeCounter={activeCounter}
          />
        )}

        {activeTab === 'admin' && (
          <OwnerAdmin
            dishes={dishes}
            categories={categories}
            subCategories={subCategories}
            sections={sections}
            tables={tables}
            bills={bills}
            billLogs={billLogs}
            onAddDish={handleAddDish}
            onUpdateDish={handleUpdateDish}
            onDeleteDish={handleDeleteDish}
            onAddSubCategory={handleAddSubCategory}
            onDeleteSubCategory={handleDeleteSubCategory}
            onUpdateSection={handleUpdateSection}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onAddTable={handleAddTable}
            onDeleteTable={handleDeleteTable}
            onBulkUpdatePrices={handleBulkUpdatePrices}
            onUpdateSettledBill={handleUpdateSettledBill}
          />
        )}

      </div>

      {/* Owner PIN Security Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Owner Verification</h3>
                  <p className="text-xs text-slate-400">Enter PIN to access Admin Controls</p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (Default: 1234)"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-center text-2xl tracking-widest text-white font-mono focus:outline-none focus:border-purple-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-1.5 text-center font-medium">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/30"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateNewTableModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        sections={sections}
        tables={tables}
        onCreateTableAndOpenMenu={handleCreateTableAndOpenMenu}
      />

      <OrderCartPopup
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        activeSection={activeSection}
        activeTable={activeTable}
        onSettleBill={handleSettleBill}
      />

    </div>
  );
}
