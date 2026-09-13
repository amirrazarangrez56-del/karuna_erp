import React, { useState } from 'react';
import {
  Utensils,
  Building,
  Snowflake,
  ShoppingBag,
  Plus,
  RotateCw,
  Clock,
  CheckCircle2,
  Layers,
  Split,
  Trash2,
  Receipt,
  CreditCard,
  PlusCircle,
  X,
  ChevronDown,
  Printer,
  Edit3,
  History,
  Minus
} from 'lucide-react';
import { db } from '../db/db';
import { printThermalReceipt } from '../utils/receiptUtils';

const ZOOM_STEPS = [100, 125, 150, 175, 200];

const getGridColsClass = (zoomPercent) => {
  switch (zoomPercent) {
    case 100:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5';
    case 125:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3';
    case 150:
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5';
    case 175:
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    case 200:
      return 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';
    default:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5';
  }
};

const getCardHeightClass = (zoomPercent) => {
  switch (zoomPercent) {
    case 100:
      return 'min-h-[135px] p-2.5 text-xs';
    case 125:
      return 'min-h-[155px] p-3.5 text-sm';
    case 150:
      return 'min-h-[185px] p-4 text-base';
    case 175:
      return 'min-h-[210px] p-5 text-lg';
    case 200:
      return 'min-h-[245px] p-6 text-xl';
    default:
      return 'min-h-[135px] p-2.5 text-xs';
  }
};

// Natural alphanumeric comparator: D1, D1-A, D1-B, D2, D2-A, D3 ... D10
const sortTablesNaturally = (tableA, tableB) => {
  const nameA = (tableA?.name || '').trim();
  const nameB = (tableB?.name || '').trim();
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

export const getSectionTheme = (secName) => {
  const lname = (secName || '').toLowerCase();
  if (lname.includes('first') || lname.includes('floor')) {
    return {
      headerBadge: 'bg-blue-50 border-blue-200 text-blue-800',
      runningCard: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md',
      runningBadge: 'bg-blue-800 text-blue-100',
      runningSplitBtn: 'bg-blue-800/80 text-blue-100 hover:bg-blue-900 border-blue-600',
      runningBorder: 'border-blue-500',
      runningPrice: 'text-amber-300',
      runningMins: 'text-blue-100',
      filterActive: 'bg-blue-600 text-white shadow-sm'
    };
  }
  if (lname.includes('ac')) {
    return {
      headerBadge: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      runningCard: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md',
      runningBadge: 'bg-blue-800 text-blue-100',
      runningSplitBtn: 'bg-blue-800/80 text-blue-100 hover:bg-blue-900 border-blue-600',
      runningBorder: 'border-blue-500',
      runningPrice: 'text-amber-300',
      runningMins: 'text-indigo-100',
      filterActive: 'bg-indigo-600 text-white shadow-sm'
    };
  }
  if (lname.includes('parcel') || lname.includes('takeaway')) {
    return {
      headerBadge: 'bg-blue-50 border-blue-200 text-blue-800',
      runningCard: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md',
      runningBadge: 'bg-blue-800 text-blue-100',
      runningSplitBtn: 'bg-blue-800/80 text-blue-100 hover:bg-blue-900 border-blue-600',
      runningBorder: 'border-blue-500',
      runningPrice: 'text-amber-300',
      runningMins: 'text-blue-100',
      filterActive: 'bg-blue-600 text-white shadow-sm'
    };
  }
  // Default: Dine In Area
  return {
    headerBadge: 'bg-blue-50 border-blue-200 text-blue-800',
    runningCard: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md',
    runningBadge: 'bg-blue-800 text-blue-100',
    runningSplitBtn: 'bg-blue-800/80 text-blue-100 hover:bg-blue-900 border-blue-600',
    runningBorder: 'border-blue-500',
    runningPrice: 'text-amber-300',
    runningMins: 'text-blue-100',
    filterActive: 'bg-blue-600 text-white shadow-sm'
  };
};

const getLocalDateStr = (dateObjOrStr) => {
  if (!dateObjOrStr) return '';
  const d = new Date(dateObjOrStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TableGrid({
  currentZoom: propZoom = 100,
  tables,
  sections,
  settledBillsCount,
  settledBills = [],
  allDishes = [],
  billLogs = [],
  onUpdateSettledBill,
  initialAreaFilter = 'all',
  onAreaFilterChange,
  onSelectTable,
  onOpenAddTableModal,
  onNavigateToSettled,
  onSplitTable,
  onDeleteTable,
  onOpenOrderPopupForTable
}) {
  const [activeAreaFilter, setActiveAreaFilter] = useState(initialAreaFilter || 'all');
  const [selectedRedTable, setSelectedRedTable] = useState(null);
  const [openStatusDropdownTableId, setOpenStatusDropdownTableId] = useState(null);
  const currentZoom = propZoom || 100;

  // Resettle & Edit Bill Modal States
  const [selectedBill, setSelectedBill] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [addDishId, setAddDishId] = useState('');

  // Interactive Payment Breakdown States
  const [primaryPayMode, setPrimaryPayMode] = useState('CASH');
  const [primaryAmount, setPrimaryAmount] = useState('');
  const [secondaryPayMode, setSecondaryPayMode] = useState('NONE');
  const [secondaryAmount, setSecondaryAmount] = useState('');
  const [isCustomAmountEdited, setIsCustomAmountEdited] = useState(false);

  const handleOpenSettledBillModal = (bill) => {
    setSelectedBill(bill);
    const items = JSON.parse(JSON.stringify(bill.items || []));
    setEditedItems(items);
    setAddDishId('');

    const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const mode = (bill.paymentMode || 'CASH').toUpperCase();

    if (mode.includes('+') || mode.includes('SPLIT')) {
      const match = mode.match(/([A-Z\s\/]+)\s*\(₹?([\d\.]+)\)\s*\+\s*([A-Z\s\/]+)\s*\(₹?([\d\.]+)\)/i);
      if (match) {
        const norm = (m) => m.includes('ONLINE') || m.includes('UPI') ? 'ONLINE / UPI' : m.includes('CARD') ? 'CARD' : 'CASH';
        setPrimaryPayMode(norm(match[1]));
        setPrimaryAmount(match[2]);
        setSecondaryPayMode(norm(match[3]));
        setSecondaryAmount(match[4]);
        setIsCustomAmountEdited(true);
      } else {
        setPrimaryPayMode('CASH');
        setSecondaryPayMode('ONLINE / UPI');
        setPrimaryAmount((total / 2).toFixed(2));
        setSecondaryAmount((total / 2).toFixed(2));
        setIsCustomAmountEdited(true);
      }
    } else {
      const cleanMode = mode.includes('ONLINE') || mode.includes('UPI') ? 'ONLINE / UPI' : mode.includes('CARD') ? 'CARD' : 'CASH';
      setPrimaryPayMode(cleanMode);
      setSecondaryPayMode('NONE');
      setPrimaryAmount(total.toString());
      setSecondaryAmount('0');
      setIsCustomAmountEdited(false);
    }
  };

  const getEffectivePayModeStr = () => {
    const pAmt = parseFloat(primaryAmount) || 0;
    const sAmt = parseFloat(secondaryAmount) || 0;

    if (secondaryPayMode !== 'NONE') {
      const pLabel = primaryPayMode === 'ONLINE / UPI' ? 'UPI' : primaryPayMode;
      const sLabel = secondaryPayMode === 'ONLINE / UPI' ? 'UPI' : secondaryPayMode;
      if (pAmt > 0 && sAmt > 0) {
        return `${pLabel} (₹${pAmt.toFixed(2)}) + ${sLabel} (₹${sAmt.toFixed(2)})`;
      } else if (sAmt > 0 && pAmt <= 0) {
        return sLabel;
      } else if (pAmt > 0 && sAmt <= 0) {
        return pLabel;
      }
    }
    return primaryPayMode === 'ONLINE / UPI' ? 'UPI' : primaryPayMode;
  };

  const computeBillChangeDescription = (oldBill, newItems, effectivePayModeStr, newTotal) => {
    const oldItems = oldBill?.items || [];
    const changes = [];

    const oldItemMap = new Map();
    oldItems.forEach((it) => {
      const key = it.name || it.id;
      oldItemMap.set(key, parseFloat(it.qty) || 1);
    });

    const newItemMap = new Map();
    newItems.forEach((it) => {
      const key = it.name || it.id;
      newItemMap.set(key, parseFloat(it.qty) || 1);
    });

    newItemMap.forEach((qty, name) => {
      const oldQty = oldItemMap.get(name) || 0;
      if (oldQty === 0) {
        changes.push(`Added ${qty}x ${name}`);
      } else if (qty > oldQty) {
        changes.push(`Increased ${name} (+${qty - oldQty})`);
      } else if (qty < oldQty) {
        changes.push(`Reduced ${name} (-${oldQty - qty})`);
      }
    });

    oldItemMap.forEach((oldQty, name) => {
      if (!newItemMap.has(name) || newItemMap.get(name) <= 0) {
        changes.push(`Removed ${oldQty}x ${name}`);
      }
    });

    const oldPayMode = (oldBill?.paymentMode || 'CASH').toUpperCase();
    if (oldPayMode !== effectivePayModeStr.toUpperCase()) {
      changes.push(`Paid: ${effectivePayModeStr}`);
    }

    const tokenStr = oldBill?.tokenNo || oldBill?.billNo || oldBill?.id || '';
    if (changes.length > 0) {
      return `${changes.join(', ')} • Resettled Total: ₹${newTotal.toFixed(2)}`;
    } else {
      return `Resettled Bill #${tokenStr} - Total: ₹${newTotal.toFixed(2)} (${effectivePayModeStr})`;
    }
  };

  const handleReprintWithLog = async (billToPrint) => {
    const effectivePayMode = getEffectivePayModeStr();
    const billObj = { ...billToPrint, paymentMode: effectivePayMode };
    try {
      printThermalReceipt(billObj);
    } catch (e) {
      console.warn('Thermal print error:', e);
    }

    const tokenStr = billObj.tokenNo || billObj.billNo || billObj.id || '';
    const totalVal = parseFloat(billObj.total || billObj.finalTotal || billObj.grandTotal || 0) || 0;
    const changeDesc = `Reprinted Thermal Receipt for Bill #${tokenStr} - Total: ₹${totalVal.toFixed(2)} (${effectivePayMode})`;

    if (typeof onUpdateSettledBill === 'function') {
      await onUpdateSettledBill(billObj, changeDesc);
    } else {
      await db.billLogs.add({
        billId: billObj.id,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' }),
        changeDescription: changeDesc
      }).catch(() => {});
    }

    setShiftToast(`✓ Thermal Receipt #${tokenStr} Reprinted!`);
    setTimeout(() => setShiftToast(null), 3000);
  };

  const updateAmountsForNewItems = (updatedItems) => {
    const newTot = updatedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    if (secondaryPayMode === 'NONE') {
      setPrimaryAmount(newTot.toString());
      setSecondaryAmount('0');
    } else {
      const pAmt = parseFloat(primaryAmount) || 0;
      const rem = Math.max(0, newTot - pAmt);
      setSecondaryAmount(rem.toFixed(2));
    }
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...editedItems];
    const newQty = (parseFloat(updated[index].qty) || 1) + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].qty = newQty;
    }
    setEditedItems(updated);
    updateAmountsForNewItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...editedItems];
    updated.splice(index, 1);
    setEditedItems(updated);
    updateAmountsForNewItems(updated);
  };

  const handleAddNewDishToBill = () => {
    if (!addDishId) return;
    const dish = (allDishes || []).find((d) => d.id === parseInt(addDishId) || d.id === addDishId);
    if (!dish) return;

    let updated = [...editedItems];
    const existingIdx = updated.findIndex((i) => i.id === dish.id || i.name === dish.name);
    if (existingIdx !== -1) {
      updated[existingIdx].qty = (parseFloat(updated[existingIdx].qty) || 1) + 1;
    } else {
      updated.push({
        id: dish.id,
        srNo: dish.srNo,
        name: dish.name,
        price: dish.price || 0,
        qty: 1,
        unit: dish.unit || null
      });
    }
    setEditedItems(updated);
    setAddDishId('');
    updateAmountsForNewItems(updated);
  };

  const handleSaveResettle = async () => {
    if (!selectedBill) return;

    const newSubtotal = editedItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0
    );
    const newTotal = newSubtotal;
    const effectivePayMode = getEffectivePayModeStr();

    const updatedBill = {
      ...selectedBill,
      items: editedItems,
      subtotal: newSubtotal,
      total: newTotal,
      finalTotal: newTotal,
      paymentMode: effectivePayMode,
      isResettled: true,
      resettledAt: new Date().toISOString()
    };

    const changeDesc = computeBillChangeDescription(selectedBill, editedItems, effectivePayMode, newTotal);

    if (typeof onUpdateSettledBill === 'function') {
      await onUpdateSettledBill(updatedBill, changeDesc);
    } else {
      await db.bills.put(updatedBill).catch(() => {});
      await db.billLogs.add({
        billId: selectedBill.id,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' }),
        changeDescription: changeDesc
      }).catch(() => {});
    }

    setShiftToast(`✓ Bill #${selectedBill.tokenNo || selectedBill.billNo || selectedBill.id} Resettled! Total: ₹${newTotal.toFixed(2)}`);
    setTimeout(() => setShiftToast(null), 3500);

    setSelectedBill(null);
  };

  const handleSetAreaFilter = (filterVal) => {
    setActiveAreaFilter(filterVal);
    if (typeof onAreaFilterChange === 'function') {
      onAreaFilterChange(filterVal);
    }
  };

  const todayStr = getLocalDateStr(new Date());
  const todaySettledBills = (settledBills || [])
    .filter((b) => {
      if (!b) return false;
      if (!b.createdAt) return true;
      return getLocalDateStr(b.createdAt) === todayStr;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  
  // Shift Table State & Handlers
  const [isShiftMode, setIsShiftMode] = useState(false);
  const [draggedTable, setDraggedTable] = useState(null);
  const [dragOverTableId, setDragOverTableId] = useState(null);
  const [shiftToast, setShiftToast] = useState(null);

  const handleShiftTable = async (srcTable, targetTable) => {
    if (!srcTable || !targetTable) return;
    if (String(srcTable.id) === String(targetTable.id)) return;

    const srcHasCart = (srcTable.status === 'occupied' || srcTable.status === 'bill_released') || (srcTable.currentCart && srcTable.currentCart.length > 0);
    const targetHasCart = (targetTable.status === 'occupied' || targetTable.status === 'bill_released') || (targetTable.currentCart && targetTable.currentCart.length > 0);

    if (!srcHasCart) {
      setShiftToast(`Table ${srcTable.name} has no active order to shift.`);
      setTimeout(() => setShiftToast(null), 3000);
      return;
    }

    if (targetHasCart) {
      setShiftToast(`Target table ${targetTable.name} is already occupied! Drop on an empty table.`);
      setTimeout(() => setShiftToast(null), 3000);
      return;
    }

    // 1. Move order over to target table
    await db.diningTables.update(targetTable.id, {
      status: srcTable.status || 'occupied',
      currentCart: srcTable.currentCart || [],
      currentTokenNo: srcTable.currentTokenNo || (1000 + (parseInt(targetTable.id) || 1)).toString(),
      createdAt: srcTable.createdAt || new Date().toISOString(),
      customerName: srcTable.customerName || '',
      pax: srcTable.pax || '1',
      waiter: srcTable.waiter || 'Raju',
      lastPrintedCart: srcTable.lastPrintedCart || [],
      kotCount: srcTable.kotCount || 0,
      parcelStatus: srcTable.parcelStatus || null
    });

    // 2. Clear or delete source table
    const isTempTable = srcTable.isParcel || srcTable.isSplit || (srcTable.name && (srcTable.name.startsWith('P') || srcTable.name.includes('-')));
    if (isTempTable) {
      try {
        await db.diningTables.delete(srcTable.id);
      } catch (e) {}
    } else {
      await db.diningTables.update(srcTable.id, {
        status: 'empty',
        currentCart: [],
        currentTokenNo: (1000 + (parseInt(srcTable.id) || 1)).toString(),
        createdAt: null,
        customerName: '',
        pax: '1',
        waiter: 'Raju',
        lastPrintedCart: [],
        kotCount: 0,
        parcelStatus: null
      });
    }

    setShiftToast(`✓ Shifted order from ${srcTable.name} ➔ ${targetTable.name} successfully!`);
    setTimeout(() => setShiftToast(null), 3500);
  };

  const getDragHandlers = (tbl, hasActiveOrder) => {
    const isDragOver = dragOverTableId === tbl.id;

    if (hasActiveOrder) {
      return {
        draggable: true,
        onDragStart: (e) => {
          e.dataTransfer.setData('text/plain', String(tbl.id));
          setDraggedTable(tbl);
        },
        onDragEnd: () => {
          setDraggedTable(null);
          setDragOverTableId(null);
        },
        dragClasses: 'cursor-grab active:cursor-grabbing hover:scale-102 transition-transform'
      };
    } else {
      return {
        draggable: false,
        onDragOver: (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        },
        onDragEnter: (e) => {
          e.preventDefault();
          if (draggedTable && String(draggedTable.id) !== String(tbl.id)) {
            setDragOverTableId(tbl.id);
          }
        },
        onDragLeave: (e) => {
          e.preventDefault();
          if (dragOverTableId === tbl.id) {
            setDragOverTableId(null);
          }
        },
        onDrop: (e) => {
          e.preventDefault();
          const srcId = e.dataTransfer.getData('text/plain');
          const srcTbl = draggedTable || tables.find((t) => String(t.id) === String(srcId));
          if (srcTbl) {
            handleShiftTable(srcTbl, tbl);
          }
          setDraggedTable(null);
          setDragOverTableId(null);
        },
        dragClasses: isDragOver
          ? 'ring-4 ring-emerald-500 bg-emerald-100/90 border-emerald-600 scale-105 shadow-2xl transition-all'
          : isShiftMode
          ? 'border-2 border-dashed border-slate-300 hover:border-emerald-400'
          : ''
      };
    }
  };

  const totalBoxes = tables.length;
  const runningBoxes = tables.filter((t) => t.status === 'occupied' || t.status === 'bill_released').length;

  // Compute global arrival queue index for active tables (sorted by createdAt ascending)
  const activeTablesSorted = tables
    .filter((t) => t && (t.status === 'occupied' || t.status === 'bill_released') && t.currentCart && t.currentCart.length > 0)
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

  const getArrivalOrderIndex = (tableObj) => {
    if (!tableObj || (tableObj.status !== 'occupied' && tableObj.status !== 'bill_released')) return null;
    const idx = activeTablesSorted.findIndex(
      (t) => String(t.id) === String(tableObj.id) || String(t.name) === String(tableObj.name)
    );
    return idx !== -1 ? idx + 1 : null;
  };

  const getSectionIcon = (secName) => {
    const lname = (secName || '').toLowerCase();
    if (lname.includes('dine')) return Utensils;
    if (lname.includes('first') || lname.includes('floor')) return Building;
    if (lname.includes('ac')) return Snowflake;
    if (lname.includes('parcel')) return ShoppingBag;
    return Layers;
  };

  const sortSectionsWithParcelsLast = (secArray) => {
    if (!Array.isArray(secArray)) return [];
    const nonParcels = secArray.filter((s) => !s || !s.name || !s.name.toLowerCase().includes('parcel'));
    const parcels = secArray.filter((s) => s && s.name && s.name.toLowerCase().includes('parcel'));
    return [...nonParcels, ...parcels];
  };

  const sortedSections = sortSectionsWithParcelsLast(sections);
  const displayedSections = activeAreaFilter === 'all'
    ? sortedSections
    : sortedSections.filter((s) => s.id === activeAreaFilter);

  const handleCardClick = (tbl) => {
    if (tbl && tbl.sectionId && typeof onAreaFilterChange === 'function') {
      onAreaFilterChange(activeAreaFilter !== 'all' ? activeAreaFilter : tbl.sectionId);
    }
    if (tbl.status === 'bill_released') {
      setSelectedRedTable(tbl);
    } else {
      onSelectTable(tbl);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-full p-6 select-none overflow-y-auto relative">
      
      {/* Toast Notification */}
      {shiftToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white font-black px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-200 flex items-center space-x-2.5 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{shiftToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2">
        
        {/* Left Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSetAreaFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeAreaFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs'
            }`}
          >
            All Areas ({totalBoxes})
          </button>

          {sortedSections.map((sec, secIdx) => {
            const isSelected = activeAreaFilter === sec.id;
            const count = tables.filter((t) => t.sectionId === sec.id).length;
            const theme = getSectionTheme(sec.name);

            return (
              <button
                key={`filter-sec-${sec.id || sec.name}-${secIdx}`}
                onClick={() => handleSetAreaFilter(sec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? theme.filterActive
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs'
                }`}
              >
                <span>{sec.name} ({count})</span>
              </button>
            );
          })}

          <button
            onClick={() => handleSetAreaFilter('settled')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAreaFilter === 'settled'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeAreaFilter === 'settled' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>Settled Bills ({todaySettledBills.length || settledBillsCount || 0})</span>
          </button>
        </div>

        {/* Right Controls: Shift Table, Stats & Refresh */}
        <div className="flex flex-wrap items-center space-x-3 pr-12">

          {/* Shift Table Checkbox (Moved to Right Side) */}
          <label className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 border shadow-2xs ${
            isShiftMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
              : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
          }`}>
            <input
              type="checkbox"
              checked={isShiftMode}
              onChange={(e) => setIsShiftMode(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span>Shift Table</span>
          </label>

          <div className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3.5 py-2 rounded-xl shadow-2xs">
            {totalBoxes} Cards • {runningBoxes} Running
          </div>

          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 cursor-pointer transition-colors shadow-2xs"
            title="Refresh tables"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Shift Mode Banner */}
      {isShiftMode && (
        <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 flex items-center justify-between text-xs font-black text-amber-950 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <span className="text-base">⚡</span>
            <span>SHIFT TABLE MODE ACTIVE: Click & drag any occupied table (Blue/Red) and drop it onto an empty (White) table to shift order!</span>
          </div>
          <button
            onClick={() => setIsShiftMode(false)}
            className="text-amber-900 hover:text-black font-bold px-2 py-0.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 cursor-pointer"
          >
            ✕ Close Shift Mode
          </button>
        </div>
      )}

      {/* Sections & Table Cards Groups OR Today's Settled Bills */}
      <div className="space-y-6">
        {activeAreaFilter === 'settled' ? (
          <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-150">
            {/* Header Summary */}
            <div className="flex flex-wrap items-center justify-between bg-white p-3.5 px-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 leading-none flex items-center gap-2">
                    <span>Today's Settled Bills</span>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                      {todaySettledBills.length} Orders
                    </span>
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Settled on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Today's Revenue</span>
                <span className="font-black text-lg text-emerald-700">
                  ₹{todaySettledBills.reduce((sum, b) => sum + (parseFloat(b.finalTotal || b.grandTotal || b.totalAmount || 0) || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Settled Cards Grid */}
            {todaySettledBills.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
                <div className="p-4 rounded-full bg-slate-100 text-slate-400">
                  <Receipt className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-700 text-base">No settled bills for today yet</h4>
                <p className="text-xs font-bold text-slate-400 max-w-sm">
                  Orders settled today will automatically appear here.
                </p>
              </div>
            ) : (
              <div className={`grid ${getGridColsClass(currentZoom)}`}>
                {todaySettledBills.map((bill, bIdx) => {
                  const billTotal = parseFloat(bill.finalTotal || bill.grandTotal || bill.totalAmount || bill.total || 0) || 0;
                  const billTime = bill.createdAt ? new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
                  const itemsCount = bill.items ? bill.items.reduce((acc, it) => acc + (it.qty || 1), 0) : 0;
                  const payMode = (bill.paymentMode || 'CASH').toUpperCase();
                  const tokenDisplay = bill.tokenNo || bill.billNo || bill.invoiceNo || bill.id;

                  const isResettled = bill.isResettled || (billLogs || []).some(
                    (l) => String(l.billId) === String(bill.id) &&
                    (l.changeDescription?.includes('Resettled') ||
                     l.changeDescription?.includes('Added') ||
                     l.changeDescription?.includes('Removed') ||
                     l.changeDescription?.includes('Increased') ||
                     l.changeDescription?.includes('Reduced') ||
                     l.changeDescription?.includes('Pay Mode'))
                  );

                  let payBadgeStyle = 'bg-teal-700 text-white border-teal-800';
                  if (payMode.includes('UPI') || payMode.includes('ONLINE')) {
                    payBadgeStyle = 'bg-purple-700 text-white border-purple-800';
                  } else if (payMode.includes('CARD')) {
                    payBadgeStyle = 'bg-blue-700 text-white border-blue-800';
                  } else if (payMode.includes('DUE') || payMode.includes('CREDIT')) {
                    payBadgeStyle = 'bg-amber-700 text-white border-amber-800';
                  }

                  let cardStyle = isResettled
                    ? 'bg-gradient-to-br from-amber-100/90 via-orange-50/90 to-yellow-100/90 border-2 border-amber-500 hover:border-amber-700 hover:from-amber-200/90 hover:to-orange-100/90 shadow-sm hover:shadow-md'
                    : 'bg-gradient-to-br from-emerald-50/95 via-teal-50/90 to-cyan-50/95 border-2 border-emerald-400/90 hover:border-emerald-600 hover:from-emerald-100 hover:to-teal-100 shadow-xs hover:shadow-md';

                  let tokenBadgeStyle = isResettled
                    ? 'bg-amber-900 text-amber-50 border border-amber-950'
                    : 'bg-emerald-800 text-emerald-50';

                  let borderDividerStyle = isResettled ? 'border-amber-300/80' : 'border-teal-200/80';
                  let textColorStyle = isResettled ? 'text-amber-950' : 'text-emerald-950';
                  let subTextColorStyle = isResettled ? 'text-amber-900/80' : 'text-emerald-800/80';
                  let clockColorStyle = isResettled ? 'text-amber-700' : 'text-emerald-600';
                  let reprintBtnStyle = isResettled
                    ? 'bg-amber-800 hover:bg-amber-900 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white';

                  return (
                    <div
                      key={`settled-bill-card-${bill.id || bill.invoiceNo || bIdx}`}
                      onClick={() => handleOpenSettledBillModal(bill)}
                      className={`cursor-pointer transition-all rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between select-none overflow-hidden ${getCardHeightClass(currentZoom)} ${cardStyle}`}
                    >
                      {/* Top Row: Token Badge & Payment Mode */}
                      <div className={`flex items-center justify-between w-full pb-1 border-b gap-1 min-h-[24px] overflow-hidden ${borderDividerStyle}`}>
                        <span className={`font-mono font-black text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded shadow-2xs shrink-0 ${tokenBadgeStyle}`}>
                          #{tokenDisplay}
                        </span>

                        <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs shrink-0 ml-auto whitespace-nowrap ${payBadgeStyle}`}>
                          {payMode}
                        </span>
                      </div>

                      {/* Middle Section: Big Table Number, Paid Amount, Time of Printed */}
                      <div className="my-auto py-1.5 text-center flex flex-col items-center justify-center space-y-0.5">
                        <span className={`font-black text-2xl sm:text-3xl tracking-tight leading-none ${textColorStyle}`}>
                          {bill.tableName || bill.tableNo || 'Takeaway'}
                        </span>

                        <div className="pt-1 flex flex-col items-center">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${subTextColorStyle}`}>
                            Paid Amount
                          </span>
                          <span className={`font-black text-xl sm:text-2xl tracking-tight leading-none ${textColorStyle}`}>
                            ₹{billTotal.toFixed(2)}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold flex items-center justify-center space-x-1 mt-1 ${subTextColorStyle}`}>
                          <Clock className={`w-3 h-3 shrink-0 ${clockColorStyle}`} />
                          <span>{billTime} • {itemsCount} items</span>
                        </span>
                      </div>

                      {/* Bottom Section: Big Reprint Button in Middle */}
                      <div className={`pt-2 border-t ${borderDividerStyle}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReprintWithLog(bill);
                          }}
                          className={`w-full font-black text-xs py-1.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer ${reprintBtnStyle}`}
                          title="Re-print Thermal Receipt"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Reprint</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeAreaFilter === 'all' ? (
          <>
            {/* 1. Unified Cards Grid for All Regular Floors (No floor dividers, S1 next to F6, 9 per row) */}
            {(() => {
              const parcelSec = sortedSections.find((s) => s && s.name && s.name.toLowerCase().includes('parcel')) || { id: 4, name: 'Parcels' };
              const regularSecs = sortedSections.filter((s) => !s || !s.name || !s.name.toLowerCase().includes('parcel'));
              const regularSecIds = new Set(regularSecs.map((s) => s.id));
              const isParcelTable = (t) => t && (t.sectionId === parcelSec.id || (t.name && String(t.name).toUpperCase().startsWith('P')) || t.isParcel);
              const rawRegTables = tables.filter((t) => t && regularSecIds.has(t.sectionId) && !isParcelTable(t));
              
              const tableMap = new Map();
              rawRegTables.forEach((t) => {
                if (!t || !t.name) return;
                const k = String(t.name).toUpperCase().trim();
                const existing = tableMap.get(k);
                if (!existing) {
                  tableMap.set(k, t);
                } else {
                  const tHasCart = (t.status === 'occupied' || t.status === 'bill_released') || (t.currentCart && t.currentCart.length > 0);
                  const eHasCart = (existing.status === 'occupied' || existing.status === 'bill_released') || (existing.currentCart && existing.currentCart.length > 0);
                  if (tHasCart && !eHasCart) tableMap.set(k, t);
                }
              });
              const regTables = Array.from(tableMap.values()).sort(sortTablesNaturally);

              if (regTables.length === 0) return null;

              return (
                <div className={`grid ${getGridColsClass(currentZoom)}`}>
                  {regTables.map((tbl, tblIdx) => {
                    const isBillReleased = tbl.status === 'bill_released';
                    const isOccupied = tbl.status === 'occupied' && tbl.currentCart && tbl.currentCart.length > 0;
                    const hasActiveOrder = isOccupied || isBillReleased;
                    const cartTotal = tbl.currentCart ? tbl.currentCart.reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0) : 0;

                    let elapsedMins = '00';
                    if (hasActiveOrder && tbl.createdAt) {
                      const diffMs = Math.max(0, Date.now() - new Date(tbl.createdAt).getTime());
                      const mins = Math.floor(diffMs / 60000);
                      elapsedMins = mins < 10 ? `0${mins}` : `${mins}`;
                    }

                    const isSplitTable = tbl.isSplit || (tbl.name && tbl.name.includes('-'));
                    const arrivalSeq = getArrivalOrderIndex(tbl);
                    const tokenStr = tbl.currentTokenNo ? String(tbl.currentTokenNo).replace(/^#/, '') : String(1000 + (parseInt(tbl.id) || (tblIdx + 1)));

                    let cardBgStyle = 'bg-white text-neutral-900 border border-stone-200 hover:border-neutral-900 hover:shadow-md';
                    let splitBtnStyle = 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200';
                    let borderDividerStyle = 'border-t border-stone-100';
                    let priceStyle = 'text-neutral-900 font-black text-xs sm:text-sm';

                    if (isBillReleased) {
                      cardBgStyle = 'bg-rose-600 text-white border border-rose-700 hover:bg-rose-700 shadow-md ring-2 ring-rose-500/50';
                      splitBtnStyle = 'bg-rose-800/80 text-rose-100 hover:bg-rose-900 border border-rose-500';
                      borderDividerStyle = 'border-t border-rose-500/60';
                      priceStyle = 'text-amber-200 font-black text-xs sm:text-sm';
                    } else if (isOccupied) {
                      cardBgStyle = 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 shadow-md';
                      splitBtnStyle = 'bg-blue-800/80 text-blue-100 hover:bg-blue-900 border border-blue-500';
                      borderDividerStyle = 'border-t border-blue-500/60';
                      priceStyle = 'text-amber-300 font-black text-xs sm:text-sm';
                    }

                    const dragProps = getDragHandlers(tbl, hasActiveOrder);

                    return (
                      <div
                        key={`tbl-card-reg-${tbl.id || tbl.name}-${tblIdx}`}
                        onClick={() => handleCardClick(tbl)}
                        draggable={dragProps.draggable}
                        onDragStart={dragProps.onDragStart}
                        onDragEnd={dragProps.onDragEnd}
                        onDragOver={dragProps.onDragOver}
                        onDragEnter={dragProps.onDragEnter}
                        onDragLeave={dragProps.onDragLeave}
                        onDrop={dragProps.onDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick(tbl);
                          }
                        }}
                        className={`rounded-2xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-auto shadow-xs relative select-none ${getCardHeightClass(currentZoom)} ${cardBgStyle} ${dragProps.dragClasses}`}
                      >
                        <div className="flex items-center justify-between w-full min-h-[22px]">
                          {arrivalSeq ? (
                            <span
                              className="bg-amber-400 text-neutral-950 font-black text-[11px] px-1.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap leading-none"
                              title={`Arrival sequence #${arrivalSeq}`}
                            >
                              ({arrivalSeq})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-stone-400">
                              {isSplitTable ? 'Split' : ''}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSplitTable(tbl);
                            }}
                            className={`p-1 rounded-lg flex items-center justify-center transition-all cursor-pointer ${splitBtnStyle}`}
                            title={`Split table ${tbl.name}`}
                          >
                            <Split className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="my-auto py-1 text-center flex flex-col items-center justify-center space-y-1">
                          <span className="font-black text-2xl sm:text-3xl tracking-tight leading-none block">
                            {tbl.name}
                          </span>

                          {hasActiveOrder && (
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded-md shadow-2xs ${
                                isBillReleased ? 'bg-rose-900 text-rose-100' : 'bg-blue-800 text-blue-100'
                              }`}>
                                #{tokenStr}
                              </span>
                              <span className="text-xs font-black text-amber-300 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/10">
                                <Clock className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
                                <span className="leading-none">{elapsedMins}m</span>
                              </span>
                            </div>
                          )}
                        </div>

                        <div className={`pt-2 flex items-center justify-between text-xs font-bold gap-1 ${borderDividerStyle}`}>
                          <span className={`${priceStyle} truncate shrink-0`}>
                            ₹{hasActiveOrder ? cartTotal.toFixed(2) : '0.00'}
                          </span>

                          {!hasActiveOrder && (
                            <span className="flex items-center space-x-1 text-xs font-extrabold text-stone-500 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-stone-400 stroke-[2.5]" />
                              <span>00 mins</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* 2. Separate Parcels Section at the Bottom */}
            {(() => {
              const parcelSec = sortedSections.find((s) => s && s.name && s.name.toLowerCase().includes('parcel')) || { id: 4, name: 'Parcels' };
              const rawSecTables = tables.filter((t) => t && (t.sectionId === parcelSec.id || (t.name && String(t.name).toUpperCase().startsWith('P')) || t.isParcel));
              
              const tableMap = new Map();
              rawSecTables.forEach((t) => {
                if (!t || !t.name) return;
                const k = String(t.name).toUpperCase().trim();
                const existing = tableMap.get(k);
                if (!existing) {
                  tableMap.set(k, t);
                } else {
                  const tHasCart = (t.status === 'occupied' || t.status === 'bill_released') || (t.currentCart && t.currentCart.length > 0);
                  const eHasCart = (existing.status === 'occupied' || existing.status === 'bill_released') || (existing.currentCart && existing.currentCart.length > 0);
                  if (tHasCart && !eHasCart) tableMap.set(k, t);
                }
              });
              const parcelTables = Array.from(tableMap.values()).sort(sortTablesNaturally);
              const parcelRunning = parcelTables.filter((t) => t.status === 'occupied' || t.status === 'bill_released').length;
              const SectionIcon = getSectionIcon(parcelSec.name);
              const theme = getSectionTheme(parcelSec.name);

              return (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-neutral-900 font-extrabold text-sm">
                      <SectionIcon className="w-4 h-4 text-neutral-800" />
                      <span>{parcelSec.name}</span>
                    </div>

                    <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-md ${theme.headerBadge}`}>
                      {parcelTables.length} Cards • {parcelRunning} Running
                    </span>

                    <div className="flex-1 h-[1.5px] bg-stone-300/80"></div>
                  </div>

                  <div className={`grid ${getGridColsClass(currentZoom)}`}>
                    {parcelTables.map((tbl, tblIdx) => {
                      const isBillReleased = tbl.status === 'bill_released';
                      const isOccupied = tbl.status === 'occupied' && tbl.currentCart && tbl.currentCart.length > 0;
                      const hasActiveOrder = isOccupied || isBillReleased;
                      const cartTotal = tbl.currentCart ? tbl.currentCart.reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0) : 0;

                      let elapsedMins = '00';
                      if (hasActiveOrder && tbl.createdAt) {
                        const diffMs = Math.max(0, Date.now() - new Date(tbl.createdAt).getTime());
                        const mins = Math.floor(diffMs / 60000);
                        elapsedMins = mins < 10 ? `0${mins}` : `${mins}`;
                      }

                      const arrivalSeq = getArrivalOrderIndex(tbl);
                      const tokenStr = tbl.currentTokenNo ? String(tbl.currentTokenNo).replace(/^#/, '') : String(1000 + (parseInt(tbl.id) || (tblIdx + 1)));

                      let cardBgStyle = 'bg-white text-neutral-900 border border-stone-200 hover:border-neutral-900 hover:shadow-md';
                      let borderDividerStyle = 'border-t border-stone-100';
                      let priceStyle = 'text-neutral-900 font-black text-xs sm:text-sm';

                      if (isBillReleased) {
                        cardBgStyle = 'bg-rose-600 text-white border border-rose-700 hover:bg-rose-700 shadow-md ring-2 ring-rose-500/50';
                        borderDividerStyle = 'border-t border-rose-500/60';
                        priceStyle = 'text-amber-200 font-black text-xs sm:text-sm';
                      } else if (isOccupied) {
                        cardBgStyle = 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 shadow-md';
                        borderDividerStyle = 'border-t border-blue-500/60';
                        priceStyle = 'text-amber-300 font-black text-xs sm:text-sm';
                      }

                    const dragProps = getDragHandlers(tbl, hasActiveOrder);

                    return (
                      <div
                        key={`tbl-card-pcl-${tbl.id || tbl.name}-${tblIdx}`}
                        onClick={() => handleCardClick(tbl)}
                        draggable={dragProps.draggable}
                        onDragStart={dragProps.onDragStart}
                        onDragEnd={dragProps.onDragEnd}
                        onDragOver={dragProps.onDragOver}
                        onDragEnter={dragProps.onDragEnter}
                        onDragLeave={dragProps.onDragLeave}
                        onDrop={dragProps.onDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick(tbl);
                          }
                        }}
                        className={`rounded-2xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-auto shadow-xs relative select-none ${getCardHeightClass(currentZoom)} ${cardBgStyle} ${dragProps.dragClasses}`}
                      >
                          <div className="flex items-center justify-between w-full min-h-[22px]">
                            {arrivalSeq ? (
                              <span
                                className="bg-amber-400 text-neutral-950 font-black text-[11px] px-1.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap leading-none"
                                title={`Arrival sequence #${arrivalSeq}`}
                              >
                                ({arrivalSeq})
                              </span>
                            ) : null}
                          </div>

                          <div className="my-auto py-1 text-center flex flex-col items-center justify-center space-y-1">
                            <span className="font-black text-2xl sm:text-3xl tracking-tight leading-none block">
                              {tbl.name}
                            </span>

                            {hasActiveOrder && (
                              <div className="flex items-center justify-center space-x-1.5">
                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md shadow-2xs ${
                                  isBillReleased ? 'bg-rose-900 text-rose-100' : 'bg-blue-800 text-blue-100'
                                }`}>
                                  #{tokenStr}
                                </span>
                                <span className="text-xs font-black text-amber-300 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/10">
                                  <Clock className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
                                  <span className="leading-none">{elapsedMins}m</span>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className={`pt-2 flex items-center justify-between text-xs font-bold gap-1 ${borderDividerStyle}`}>
                            <span className={`${priceStyle} truncate shrink-0`}>
                              ₹{hasActiveOrder ? cartTotal.toFixed(2) : '0.00'}
                            </span>

                            {hasActiveOrder ? (
                              <div className="relative inline-block shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusDropdownTableId(openStatusDropdownTableId === tbl.id ? null : tbl.id);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-white font-extrabold text-[10px] flex items-center space-x-1 cursor-pointer shadow-xs transition-all ${
                                    tbl.parcelStatus === 'ready'
                                      ? 'bg-emerald-600 hover:bg-emerald-700'
                                      : 'bg-blue-800 hover:bg-blue-900 border border-blue-500'
                                  }`}
                                  title="Change Parcel Status"
                                >
                                  {tbl.parcelStatus === 'ready' ? (
                                    <CheckCircle2 className="w-3 h-3 text-white shrink-0" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                                  )}
                                  <span className="whitespace-nowrap">{tbl.parcelStatus === 'ready' ? 'Ready' : 'In Process'}</span>
                                  <ChevronDown className="w-3 h-3 text-white/80 shrink-0" />
                                </button>

                                {openStatusDropdownTableId === tbl.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 bottom-full mb-1.5 bg-white border border-stone-200 rounded-xl shadow-2xl p-1.5 z-40 min-w-[130px] animate-in zoom-in-95 duration-100 select-none text-left"
                                  >
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setOpenStatusDropdownTableId(null);
                                        await db.diningTables.update(tbl.id, { parcelStatus: 'process' });
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 cursor-pointer ${
                                        tbl.parcelStatus !== 'ready' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-neutral-700 hover:bg-stone-100'
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                      <span>In Process</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setOpenStatusDropdownTableId(null);
                                        await db.diningTables.update(tbl.id, { parcelStatus: 'ready' });
                                        if (typeof onOpenOrderPopupForTable === 'function') {
                                          onOpenOrderPopupForTable(tbl);
                                        } else {
                                          setSelectedRedTable(tbl);
                                        }
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 cursor-pointer ${
                                        tbl.parcelStatus === 'ready' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-neutral-700 hover:bg-stone-100'
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                      <span>Ready</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="flex items-center space-x-1 text-xs font-extrabold text-stone-500 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-stone-400 stroke-[2.5]" />
                                <span>00 mins</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Dashed "+ Add Parcel" Tile */}
                    <div
                      onClick={async () => {
                        const existingPNums = tables
                          .filter((t) => t && t.name && (t.name.toUpperCase().startsWith('P') || (parcelSec && t.sectionId === parcelSec.id)))
                          .map((t) => {
                            const match = t.name.match(/\d+/);
                            return match ? parseInt(match[0], 10) : 0;
                          });
                        const maxNum = existingPNums.length > 0 ? Math.max(...existingPNums) : 0;
                        const nextNum = maxNum + 1;
                        const newParcelName = `P${nextNum}`;
                        const newParcelTable = {
                          name: newParcelName,
                          sectionId: parcelSec ? parcelSec.id : 4,
                          status: 'occupied',
                          parcelStatus: 'process',
                          currentCart: [],
                          currentTokenNo: Math.floor(1000 + Math.random() * 9000).toString(),
                          isSplit: false,
                          isParcel: true,
                          createdAt: new Date().toISOString()
                        };
                        const newId = await db.diningTables.add(newParcelTable);
                        onSelectTable({ ...newParcelTable, id: newId });
                      }}
                      role="button"
                      tabIndex={0}
                      className="rounded-2xl p-2.5 border-2 border-dashed border-blue-400 bg-blue-50/70 hover:bg-blue-100 text-blue-950 transition-all duration-150 cursor-pointer flex flex-col items-center justify-center min-h-[135px] text-center shadow-2xs group select-none"
                      title="Accept new parcel order"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-2xs">
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </div>
                      <span className="font-black text-xs text-slate-900 block">+ Add Parcel</span>
                      <span className="text-[10px] font-bold text-blue-800">Accept Order</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          /* Render single selected area filter */
          displayedSections.map((sec, secIdx) => {
            const SectionIcon = getSectionIcon(sec.name);
            const theme = getSectionTheme(sec.name);
            const isParcel = sec.name && sec.name.toLowerCase().includes('parcel');
            const rawSecTables = tables.filter((t) => t && (t.sectionId === sec.id || (isParcel && (t.name?.toUpperCase().startsWith('P') || t.isParcel))));
            
            const tableMap = new Map();
            rawSecTables.forEach((t) => {
              if (!t || !t.name) return;
              const k = String(t.name).toUpperCase().trim();
              const existing = tableMap.get(k);
              if (!existing) {
                tableMap.set(k, t);
              } else {
                const tHasCart = (t.status === 'occupied' || t.status === 'bill_released') || (t.currentCart && t.currentCart.length > 0);
                const eHasCart = (existing.status === 'occupied' || existing.status === 'bill_released') || (existing.currentCart && existing.currentCart.length > 0);
                if (tHasCart && !eHasCart) tableMap.set(k, t);
              }
            });
            const secTables = Array.from(tableMap.values()).sort(sortTablesNaturally);
            const secRunning = secTables.filter((t) => t.status === 'occupied' || t.status === 'bill_released').length;

            return (
              <div key={`section-group-flt-${sec.id || sec.name}-${secIdx}`} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-neutral-900 font-extrabold text-sm">
                    <SectionIcon className="w-4 h-4 text-neutral-800" />
                    <span>{sec.name}</span>
                  </div>

                  <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-md ${theme.headerBadge}`}>
                    {secTables.length} Cards • {secRunning} Running
                  </span>

                  <div className="flex-1 h-[1.5px] bg-stone-300/80"></div>
                </div>

                <div className={`grid ${getGridColsClass(currentZoom)}`}>
                  {secTables.map((tbl, tblIdx) => {
                    const isBillReleased = tbl.status === 'bill_released';
                    const isOccupied = tbl.status === 'occupied' && tbl.currentCart && tbl.currentCart.length > 0;
                    const hasActiveOrder = isOccupied || isBillReleased;
                    const cartTotal = tbl.currentCart ? tbl.currentCart.reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0) : 0;

                    let elapsedMins = '00';
                    if (hasActiveOrder && tbl.createdAt) {
                      const diffMs = Math.max(0, Date.now() - new Date(tbl.createdAt).getTime());
                      const mins = Math.floor(diffMs / 60000);
                      elapsedMins = mins < 10 ? `0${mins}` : `${mins}`;
                    }

                    const isSplitTable = tbl.isSplit || (tbl.name && tbl.name.includes('-'));
                    const arrivalSeq = getArrivalOrderIndex(tbl);
                    const tokenStr = tbl.currentTokenNo ? String(tbl.currentTokenNo).replace(/^#/, '') : String(1000 + (parseInt(tbl.id) || (tblIdx + 1)));

                    let cardBgStyle = 'bg-white text-neutral-900 border border-stone-200 hover:border-neutral-900 hover:shadow-md';
                    let splitBtnStyle = 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200';
                    let borderDividerStyle = 'border-t border-stone-100';
                    let priceStyle = 'text-neutral-900 font-black text-xs sm:text-sm';

                    if (isBillReleased) {
                      cardBgStyle = 'bg-rose-600 text-white border border-rose-700 hover:bg-rose-700 shadow-md ring-2 ring-rose-500/50';
                      splitBtnStyle = 'bg-rose-800/80 text-rose-100 hover:bg-rose-900 border border-rose-500';
                      borderDividerStyle = 'border-t border-rose-500/60';
                      priceStyle = 'text-amber-200 font-black text-xs sm:text-sm';
                    } else if (isOccupied) {
                      cardBgStyle = 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 shadow-md';
                      splitBtnStyle = 'bg-blue-800/80 text-blue-100 hover:bg-blue-900 border border-blue-500';
                      borderDividerStyle = 'border-t border-blue-500/60';
                      priceStyle = 'text-amber-300 font-black text-xs sm:text-sm';
                    }

                    const isParcelCard = isParcel || (tbl.name && String(tbl.name).toUpperCase().startsWith('P'));

                    const dragProps = getDragHandlers(tbl, hasActiveOrder);

                    return (
                      <div
                        key={`tbl-card-single-${tbl.id || tbl.name}-${tblIdx}`}
                        onClick={() => handleCardClick(tbl)}
                        draggable={dragProps.draggable}
                        onDragStart={dragProps.onDragStart}
                        onDragEnd={dragProps.onDragEnd}
                        onDragOver={dragProps.onDragOver}
                        onDragEnter={dragProps.onDragEnter}
                        onDragLeave={dragProps.onDragLeave}
                        onDrop={dragProps.onDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick(tbl);
                          }
                        }}
                        className={`rounded-2xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-auto shadow-xs relative select-none ${getCardHeightClass(currentZoom)} ${cardBgStyle} ${dragProps.dragClasses}`}
                      >
                        <div className="flex items-center justify-between w-full min-h-[22px]">
                          {arrivalSeq ? (
                            <span
                              className="bg-amber-400 text-neutral-950 font-black text-[11px] px-1.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap leading-none"
                              title={`Arrival sequence #${arrivalSeq}`}
                            >
                              ({arrivalSeq})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-stone-400">
                              {isSplitTable ? 'Split' : ''}
                            </span>
                          )}

                          {!isParcelCard && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSplitTable(tbl);
                              }}
                              className={`p-1 rounded-lg flex items-center justify-center transition-all cursor-pointer ${splitBtnStyle}`}
                              title={`Split table ${tbl.name}`}
                            >
                              <Split className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="my-auto py-1 text-center flex flex-col items-center justify-center space-y-1">
                          <span className="font-black text-2xl sm:text-3xl tracking-tight leading-none block">
                            {tbl.name}
                          </span>

                          {hasActiveOrder && (
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded-md shadow-2xs ${
                                isBillReleased ? 'bg-rose-900 text-rose-100' : 'bg-blue-800 text-blue-100'
                              }`}>
                                #{tokenStr}
                              </span>
                              <span className="text-xs font-black text-amber-300 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/10">
                                <Clock className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
                                <span className="leading-none">{elapsedMins}m</span>
                              </span>
                            </div>
                          )}
                        </div>

                        <div className={`pt-2 flex items-center justify-between text-xs font-bold gap-1 ${borderDividerStyle}`}>
                          <span className={`${priceStyle} truncate shrink-0`}>
                            ₹{hasActiveOrder ? cartTotal.toFixed(2) : '0.00'}
                          </span>

                          {hasActiveOrder && isParcelCard ? (
                            <div className="relative inline-block shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusDropdownTableId(openStatusDropdownTableId === tbl.id ? null : tbl.id);
                                }}
                                className={`px-2 py-1 rounded-lg text-white font-extrabold text-[10px] flex items-center space-x-1 cursor-pointer shadow-xs transition-all ${
                                  tbl.parcelStatus === 'ready'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-blue-800 hover:bg-blue-900 border border-blue-500'
                                }`}
                                title="Change Parcel Status"
                              >
                                {tbl.parcelStatus === 'ready' ? (
                                  <CheckCircle2 className="w-3 h-3 text-white shrink-0" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                                )}
                                <span className="whitespace-nowrap">{tbl.parcelStatus === 'ready' ? 'Ready' : 'In Process'}</span>
                                <ChevronDown className="w-3 h-3 text-white/80 shrink-0" />
                              </button>

                              {openStatusDropdownTableId === tbl.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 bottom-full mb-1.5 bg-white border border-stone-200 rounded-xl shadow-2xl p-1.5 z-40 min-w-[130px] animate-in zoom-in-95 duration-100 select-none text-left"
                                >
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setOpenStatusDropdownTableId(null);
                                      await db.diningTables.update(tbl.id, { parcelStatus: 'process' });
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 cursor-pointer ${
                                      tbl.parcelStatus !== 'ready' ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-neutral-700 hover:bg-stone-100'
                                    }`}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    <span>In Process</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setOpenStatusDropdownTableId(null);
                                      await db.diningTables.update(tbl.id, { parcelStatus: 'ready' });
                                      if (typeof onOpenOrderPopupForTable === 'function') {
                                        onOpenOrderPopupForTable(tbl);
                                      } else {
                                        setSelectedRedTable(tbl);
                                      }
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 cursor-pointer ${
                                      tbl.parcelStatus === 'ready' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-neutral-700 hover:bg-stone-100'
                                    }`}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                    <span>Ready</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            !hasActiveOrder && (
                              <span className="flex items-center space-x-1 text-xs font-extrabold text-stone-500 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-stone-400 stroke-[2.5]" />
                                <span>00 mins</span>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isParcel && (
                    <div
                      onClick={async () => {
                        const existingPNums = tables
                          .filter((t) => t && t.name && (t.name.toUpperCase().startsWith('P') || t.sectionId === sec.id))
                          .map((t) => {
                            const match = t.name.match(/\d+/);
                            return match ? parseInt(match[0], 10) : 0;
                          });
                        const maxNum = existingPNums.length > 0 ? Math.max(...existingPNums) : 0;
                        const nextNum = maxNum + 1;
                        const newParcelName = `P${nextNum}`;
                        const newParcelTable = {
                          name: newParcelName,
                          sectionId: sec.id,
                          status: 'occupied',
                          parcelStatus: 'process',
                          currentCart: [],
                          currentTokenNo: Math.floor(1000 + Math.random() * 9000).toString(),
                          isSplit: false,
                          isParcel: true,
                          createdAt: new Date().toISOString()
                        };
                        const newId = await db.diningTables.add(newParcelTable);
                        onSelectTable({ ...newParcelTable, id: newId });
                      }}
                      role="button"
                      tabIndex={0}
                      className="rounded-2xl p-2.5 border-2 border-dashed border-blue-400 bg-blue-50/70 hover:bg-blue-100 text-blue-950 transition-all duration-150 cursor-pointer flex flex-col items-center justify-center min-h-[135px] text-center shadow-2xs group select-none"
                      title="Accept new parcel order"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-2xs">
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </div>
                      <span className="font-black text-xs text-slate-900 block">+ Add Parcel</span>
                      <span className="text-[10px] font-bold text-blue-700">Accept Order</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Red Table Action Modal (Clicking Red Table gives choice to Add Items or Pay Bill) */}
      {selectedRedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 space-y-5 relative">
            
            <button
              onClick={() => setSelectedRedTable(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  Table {selectedRedTable.name} (Bill Released)
                </h3>
                <p className="text-xs font-bold text-rose-600">
                  Token #{selectedRedTable.currentTokenNo || '1000'} • Bill Amount: ₹
                  {((selectedRedTable.currentCart || []).reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0)).toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              The bill for this table was released. Would you like to add more items to this table order or proceed directly to settle the bill?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const tbl = selectedRedTable;
                  setSelectedRedTable(null);
                  onSelectTable(tbl);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs py-3 px-4 rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Add Items</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tbl = selectedRedTable;
                  setSelectedRedTable(null);
                  if (typeof onOpenOrderPopupForTable === 'function') {
                    onOpenOrderPopupForTable(tbl);
                  } else if (typeof onSelectTable === 'function') {
                    onSelectTable(tbl);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
              >
                <CreditCard className="w-4 h-4" />
                <span>Settle</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit & Resettle Bill Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-emerald-50 p-4 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono font-black text-sm shadow-md">
                  #{selectedBill.tokenNo || selectedBill.billNo || selectedBill.id}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <span>Edit & Resettle Bill</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                      Table {selectedBill.tableName || selectedBill.tableNo || 'Takeaway'}
                    </span>
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 mt-0.5">
                    <span>{selectedBill.sectionName || 'Dine In'}</span>
                    <span>•</span>
                    <span>{new Date(selectedBill.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleReprintWithLog({ ...selectedBill, items: editedItems, total: editedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0), paymentMode: getEffectivePayModeStr() })}
                  className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all border border-slate-300 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              
              {/* Simple, Natural Payment Mode Selection & Automated Input */}
              {(() => {
                const currentModalBillTotal = editedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
                const PAY_MODES = [
                  { id: 'CASH', label: 'CASH' },
                  { id: 'ONLINE / UPI', label: 'UPI' },
                  { id: 'CARD', label: 'CARD' }
                ];
                const isDualActive = secondaryPayMode !== 'NONE';

                const handleModeClick = (modeId) => {
                  // 1. If clicking primary mode:
                  if (primaryPayMode === modeId) {
                    if (isDualActive) {
                      // Deselect primary -> secondary becomes the only selected mode
                      setPrimaryPayMode(secondaryPayMode);
                      setSecondaryPayMode('NONE');
                      setSecondaryAmount('0');
                      setPrimaryAmount(currentModalBillTotal.toString());
                      setIsCustomAmountEdited(false);
                    }
                    // If already single mode, keep it selected
                    return;
                  }

                  // 2. If clicking secondary mode:
                  if (secondaryPayMode === modeId) {
                    // Deselect secondary -> primary becomes the only selected mode
                    setSecondaryPayMode('NONE');
                    setSecondaryAmount('0');
                    setPrimaryAmount(currentModalBillTotal.toString());
                    setIsCustomAmountEdited(false);
                    return;
                  }

                  // 3. Mode is not currently selected:
                  if (!isDualActive) {
                    // Currently only 1 mode is active -> activate dual mode with BOTH selected!
                    setSecondaryPayMode(modeId);
                    const pNum = parseFloat(primaryAmount) || 0;
                    if (pNum > 0 && pNum < currentModalBillTotal) {
                      setSecondaryAmount(Math.max(0, currentModalBillTotal - pNum).toFixed(2));
                    } else {
                      // Start secondary at 0 so user can enter amount in either
                      setSecondaryAmount('0');
                    }
                    setIsCustomAmountEdited(true);
                  } else {
                    // 2 modes already active -> 3rd mode replaces secondary mode
                    setSecondaryPayMode(modeId);
                    setIsCustomAmountEdited(true);
                  }
                };

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                    {/* Bill Total Display */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Bill Total</span>
                      <span className="text-2xl font-black text-emerald-700">₹{currentModalBillTotal.toFixed(2)}</span>
                    </div>

                    {/* 3 Payment Mode Buttons (CASH, UPI, CARD) */}
                    <div className="grid grid-cols-3 gap-2">
                      {PAY_MODES.map((mode) => {
                        const isPrimary = primaryPayMode === mode.id;
                        const isSecondary = secondaryPayMode === mode.id && isDualActive;
                        const isSelected = isPrimary || isSecondary;

                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => handleModeClick(mode.id)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 flex items-center justify-center space-x-1.5 select-none ${
                              isPrimary
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.01]'
                                : isSecondary
                                ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.01]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                            title={
                              isSelected
                                ? (isDualActive ? `Click to deselect ${mode.label}` : `${mode.label} selected`)
                                : `Click to select ${mode.label}`
                            }
                          >
                            <span>{mode.label}</span>
                            {/* Visual indicator / amount preview on button */}
                            {isDualActive && isPrimary && (
                              <span className="text-[10px] bg-emerald-800/70 text-emerald-100 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                ₹{parseFloat(primaryAmount || 0).toFixed(0)}
                                <span className="text-emerald-300 ml-0.5 font-bold">✕</span>
                              </span>
                            )}
                            {isDualActive && isSecondary && (
                              <span className="text-[10px] bg-amber-700/70 text-amber-100 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                ₹{parseFloat(secondaryAmount || 0).toFixed(0)}
                                <span className="text-amber-300 ml-0.5 font-bold">✕</span>
                              </span>
                            )}
                            {!isDualActive && isPrimary && (
                              <span className="text-[10px] bg-emerald-700/80 text-emerald-100 px-1.5 py-0.5 rounded font-bold">
                                ✓ Full
                              </span>
                            )}
                            {!isSelected && (
                              <span className="text-[10px] text-slate-400 font-extrabold">
                                +
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Payment Input Fields: 1 Mode vs 2 Modes */}
                    {!isDualActive ? (
                      /* Single Mode Input */
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                            {primaryPayMode === 'ONLINE / UPI' ? 'UPI' : primaryPayMode} Amount
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Select any 2 buttons above to split payment
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                          <input
                            type="number"
                            step="any"
                            value={primaryAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPrimaryAmount(val);
                              setIsCustomAmountEdited(true);
                              const pNum = parseFloat(val) || 0;
                              if (pNum < currentModalBillTotal && pNum > 0) {
                                const rem = Math.max(0, currentModalBillTotal - pNum);
                                const defaultNextMode = primaryPayMode === 'CASH' ? 'ONLINE / UPI' : 'CASH';
                                setSecondaryPayMode(defaultNextMode);
                                setSecondaryAmount(rem.toFixed(2));
                              }
                            }}
                            className="w-full bg-emerald-50/70 border border-emerald-300 text-emerald-950 font-black text-base pl-7 pr-3 py-2 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Dual Inputs - Any 2 Selected, Able to enter amount in both */
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-black text-slate-700 uppercase">Dual Payment</span>
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              2 Selected
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const half = (currentModalBillTotal / 2).toFixed(2);
                                setPrimaryAmount(half);
                                setSecondaryAmount((currentModalBillTotal - parseFloat(half)).toFixed(2));
                                setIsCustomAmountEdited(true);
                              }}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                              title="Split equally 50/50"
                            >
                              50/50 Split
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSecondaryPayMode('NONE');
                                setSecondaryAmount('0');
                                setPrimaryAmount(currentModalBillTotal.toString());
                                setIsCustomAmountEdited(false);
                              }}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Reset to single payment mode"
                            >
                              ✕ Single Mode
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Primary Mode Input */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-emerald-800 uppercase flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                <span>{primaryPayMode === 'ONLINE / UPI' ? 'UPI' : primaryPayMode}</span>
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">Auto-balances</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                step="any"
                                value={primaryAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrimaryAmount(val);
                                  setIsCustomAmountEdited(true);
                                  if (val === '') {
                                    setSecondaryAmount(currentModalBillTotal.toFixed(2));
                                    return;
                                  }
                                  const pNum = parseFloat(val);
                                  if (!isNaN(pNum)) {
                                    const rem = Math.max(0, currentModalBillTotal - pNum);
                                    setSecondaryAmount(rem.toFixed(2));
                                  }
                                }}
                                className="w-full bg-emerald-50/80 border-2 border-emerald-300 text-emerald-950 font-black text-sm pl-6 pr-2 py-1.5 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-300"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Secondary Mode Input */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-amber-800 uppercase flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                <span>{secondaryPayMode === 'ONLINE / UPI' ? 'UPI' : secondaryPayMode}</span>
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">Auto-balances</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                step="any"
                                value={secondaryAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSecondaryAmount(val);
                                  setIsCustomAmountEdited(true);
                                  if (val === '') {
                                    setPrimaryAmount(currentModalBillTotal.toFixed(2));
                                    return;
                                  }
                                  const sNum = parseFloat(val);
                                  if (!isNaN(sNum)) {
                                    const rem = Math.max(0, currentModalBillTotal - sNum);
                                    setPrimaryAmount(rem.toFixed(2));
                                  }
                                }}
                                className="w-full bg-amber-50/80 border-2 border-amber-300 text-amber-950 font-black text-sm pl-6 pr-2 py-1.5 rounded-xl outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-300"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Real-time Balance Status Bar */}
                        {(() => {
                          const pVal = parseFloat(primaryAmount) || 0;
                          const sVal = parseFloat(secondaryAmount) || 0;
                          const sum = pVal + sVal;
                          const diff = currentModalBillTotal - sum;
                          const isBalanced = Math.abs(diff) < 0.01;

                          return (
                            <div className={`text-[11px] font-bold rounded-lg p-1.5 px-2.5 flex items-center justify-between ${
                              isBalanced
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <span>{isBalanced ? '✓ Total Balanced:' : '⚠️ Difference:'}</span>
                                <span className="font-extrabold">
                                  {isBalanced ? `₹${sum.toFixed(2)}` : `₹${Math.abs(diff).toFixed(2)}`}
                                </span>
                              </div>
                              {!isBalanced && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rem = Math.max(0, currentModalBillTotal - pVal);
                                    setSecondaryAmount(rem.toFixed(2));
                                  }}
                                  className="text-[10px] underline font-black hover:text-rose-950 cursor-pointer"
                                >
                                  Auto-balance now
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Items List (Add, Reduce, Remove) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Add / Reduce / Remove Items in Bill
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {editedItems.length} item lines
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {editedItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 font-semibold text-xs">
                      No items in bill. Select a dish below to add items.
                    </div>
                  ) : (
                    editedItems.map((item, idx) => {
                      const itemQty = item.qty !== undefined ? item.qty : 1;
                      const lineAmount = (item.price || 0) * itemQty;

                      return (
                        <div
                          key={`modal-item-${item.id || item.name}-${idx}`}
                          className="p-2.5 px-3 flex items-center justify-between text-xs bg-white"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <h4 className="font-extrabold text-slate-900">{item.name}</h4>
                              {item.isParcel && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded">
                                  📦 Parcel
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              ₹{item.price} {item.unit ? `(${item.unit})` : ''} • Line: ₹{lineAmount.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* (-) and (+) Qty Stepper */}
                            <div className="flex items-center space-x-1 bg-slate-100 border border-slate-300 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, -1)}
                                className="w-6 h-6 hover:bg-slate-200 text-slate-800 font-black rounded flex items-center justify-center cursor-pointer"
                                title="Reduce quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-black px-2 text-xs text-slate-900">{itemQty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, 1)}
                                className="w-6 h-6 hover:bg-slate-200 text-slate-800 font-black rounded flex items-center justify-center cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Remove Item Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Dish Dropdown Selector */}
                <div className="flex items-center space-x-2 pt-1">
                  <select
                    value={addDishId}
                    onChange={(e) => setAddDishId(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="">+ Select dish to add to this bill...</option>
                    {(allDishes || []).map((d) => (
                      <option key={`add-dish-opt-${d.id}`} value={d.id}>
                        #{d.srNo || d.id} - {d.name} (₹{d.price})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddNewDishToBill}
                    disabled={!addDishId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 shadow-2xs flex items-center space-x-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Bottom Change & Reprint Audit Logs (Always Visible) */}
              {(() => {
                const matchingLogs = (billLogs || []).filter((l) => String(l.billId) === String(selectedBill.id));
                return (
                  <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-xl p-3 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-black text-emerald-950 pb-1 border-b border-emerald-200/80">
                      <div className="flex items-center space-x-2">
                        <History className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Resettle & Change Logs ({matchingLogs.length})</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        Audit History
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs pt-1">
                      {matchingLogs.length === 0 ? (
                        <p className="text-xs font-bold text-emerald-700/70 italic p-1">
                          No previous change logs for this bill yet.
                        </p>
                      ) : (
                        matchingLogs.map((log, lIdx) => (
                          <div key={`log-${lIdx}`} className="text-emerald-950 font-medium text-[11px] border-b border-emerald-100/80 pb-1.5 last:border-0 flex items-start space-x-1.5">
                            <span className="text-emerald-700 font-bold shrink-0">[{log.timestamp}]</span>
                            <span>{log.changeDescription}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500">
                Resettled Total: <span className="font-black text-emerald-700 text-sm">₹{editedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleReprintWithLog({ ...selectedBill, items: editedItems, total: editedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0), paymentMode: getEffectivePayModeStr() })}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 transition-all shadow-2xs"
                  title="Print Thermal Receipt"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Reprint</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="bg-white border border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveResettle}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resettle Bill</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
