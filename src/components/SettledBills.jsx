import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Edit3,
  Search,
  Hash,
  FileText,
  Plus,
  Minus,
  Save,
  X,
  History,
  Printer,
  Calendar,
  Layers,
  Receipt,
  Monitor,
  Filter
} from 'lucide-react';
import { printThermalReceipt } from '../utils/receiptUtils';
import { AVAILABLE_COUNTERS } from './Header';

export default function SettledBills({
  settledBills,
  allDishes,
  billLogs,
  onUpdateSettledBill
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('today'); // 'today' | 'all'
  const [counterFilter, setCounterFilter] = useState('all'); // 'all' | counterName
  const [selectedBill, setSelectedBill] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [editedItems, setEditedItems] = useState([]);
  const [addDishId, setAddDishId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Helper for accurate local YYYY-MM-DD date string
  const getLocalDateStr = (dateObjOrStr) => {
    if (!dateObjOrStr) return '';
    const d = new Date(dateObjOrStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());

  // Filter bills by Time Period ('today' vs 'all')
  const baseTimeBills = settledBills.filter((b) => {
    if (timeFilter === 'all') return true;
    if (!b.createdAt) return true;
    const billDateStr = getLocalDateStr(b.createdAt);
    return billDateStr === todayStr;
  });

  // Filter by Counter
  const baseCounterBills = baseTimeBills.filter((b) => {
    if (counterFilter === 'all') return true;
    const bCounter = (b.counter || '').toLowerCase();
    return bCounter.includes(counterFilter.toLowerCase());
  });

  // Filter by Search Query
  const displayedBills = baseCounterBills.filter(
    (b) =>
      b.tokenNo?.toString().includes(searchQuery) ||
      b.id?.toString().includes(searchQuery) ||
      (b.tableNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.sectionName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.counter || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.paymentDetails?.mode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPaymentModeBadge = (bill) => {
    const details = bill.paymentDetails;
    const modeStr = (typeof details === 'object' && details?.mode) 
      ? details.mode 
      : (typeof details === 'string' ? details : (bill.paymentMode || bill.paymentMethod || 'Cash'));
    const mode = String(modeStr).toLowerCase();

    if (mode === 'cash') {
      return (
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
          Cash
        </span>
      );
    }

    if (mode === 'online' || mode === 'upi' || mode.includes('upi')) {
      return (
        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
          Online UPI
        </span>
      );
    }

    if (mode === 'card') {
      return (
        <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md">
          Card
        </span>
      );
    }

    if (mode === 'split' || mode.includes('+')) {
      const cashAmt = details?.cash || 0;
      const onlineAmt = details?.online || 0;
      return (
        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center space-x-1">
          <span>Split: {cashAmt || onlineAmt ? `₹${cashAmt} / ₹${onlineAmt}` : modeStr}</span>
        </span>
      );
    }

    return (
      <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-2 py-0.5 rounded-md">
        {modeStr}
      </span>
    );
  };

  const getCounterBadge = (counterName) => {
    const name = counterName || 'Counter 1';
    let colorClass = 'bg-stone-100 text-stone-800 border-stone-200';
    if (name.includes('1')) colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
    else if (name.includes('2')) colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    else if (name.includes('3')) colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (name.includes('Master')) colorClass = 'bg-purple-50 text-purple-800 border-purple-200';

    return (
      <span className={`border text-[10px] font-black px-2 py-0.5 rounded-md inline-flex items-center space-x-1 ${colorClass}`}>
        <Monitor className="w-3 h-3 opacity-70" />
        <span className="truncate max-w-[130px]">{name}</span>
      </span>
    );
  };

  // Open Bill Modal to Add/Remove items & Resettle
  const handleOpenBillModal = (bill) => {
    setSelectedBill(bill);
    setEditedItems(JSON.parse(JSON.stringify(bill.items || [])));
    setIsEditing(true); // Open directly in edit mode for adding/removing items
    setAddDishId('');
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
  };

  const handleRemoveItem = (index) => {
    const updated = [...editedItems];
    updated.splice(index, 1);
    setEditedItems(updated);
  };

  const handleAddNewDishToBill = () => {
    if (!addDishId) return;
    const dish = allDishes.find((d) => d.id === parseInt(addDishId) || d.id === addDishId);
    if (!dish) return;

    const existingIdx = editedItems.findIndex((i) => i.id === dish.id || i.name === dish.name);
    if (existingIdx !== -1) {
      const updated = [...editedItems];
      updated[existingIdx].qty = (parseFloat(updated[existingIdx].qty) || 1) + 1;
      setEditedItems(updated);
    } else {
      setEditedItems([
        ...editedItems,
        {
          id: dish.id,
          srNo: dish.srNo,
          name: dish.name,
          price: dish.price || 0,
          qty: 1,
          unit: dish.unit || null
        }
      ]);
    }
    setAddDishId('');
  };

  const handleSaveBillModifications = () => {
    if (!selectedBill) return;

    const newSubtotal = editedItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0
    );
    const newTotal = newSubtotal;

    const updatedBill = {
      ...selectedBill,
      items: editedItems,
      subtotal: newSubtotal,
      total: newTotal
    };

    onUpdateSettledBill(updatedBill, `Resettled Bill #${selectedBill.tokenNo || selectedBill.id}`);
    
    setToastMessage(`Bill #${selectedBill.tokenNo || selectedBill.id} Resettled Successfully! Total: ₹${newTotal.toFixed(2)}`);
    setTimeout(() => setToastMessage(null), 3000);

    setSelectedBill(null);
  };

  const relatedLogs = billLogs.filter((log) => log.billId === selectedBill?.id);
  const liveTotal = editedItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-100 overflow-y-auto select-none min-h-0 h-full relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-xl animate-in slide-in-from-top duration-200 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Today's Settled Bills</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Click any settled bill to view, add/remove items, and resettle
          </p>
        </div>

        {/* Filter Controls: Today vs All Time + Counter Filter + Search */}
        <div className="flex flex-wrap items-center gap-3 pr-12">
          
          {/* Today vs All Time Toggle */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                timeFilter === 'today'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Today's Bills</span>
            </button>

            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                timeFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>All Time History</span>
            </button>
          </div>

          {/* Counter Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={counterFilter}
              onChange={(e) => setCounterFilter(e.target.value)}
              className="text-xs font-bold text-neutral-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Counters</option>
              {AVAILABLE_COUNTERS.map((c) => (
                <option key={`opt-c-${c.id}`} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token, table, counter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 text-neutral-900 text-xs font-semibold rounded-xl pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-neutral-900 shadow-2xs"
            />
          </div>

        </div>
      </div>

      {/* Full Bills Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Token / Bill #</th>
                <th className="py-3.5 px-4">Table / Area</th>
                <th className="py-3.5 px-4">Counter</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No settled bills found for today matching current filters.
                  </td>
                </tr>
              ) : (
                displayedBills.map((bill, bIdx) => {
                  const billDate = new Date(bill.createdAt || Date.now());
                  const formattedDate = billDate.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                  const formattedTime = billDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr
                      key={`settled-row-${bill.id || bIdx}`}
                      onClick={() => handleOpenBillModal(bill)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md font-mono text-xs">
                          #{bill.tokenNo || bill.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-neutral-900">{bill.tableNo || 'Takeaway'}</div>
                        <div className="text-[10px] text-stone-500 font-medium">{bill.sectionName || 'Dine In'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getCounterBadge(bill.counter)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="max-w-[220px] truncate text-stone-700 font-semibold" title={(bill.items || []).map(i => `${i.name} (${i.unit || i.qty})`).join(', ')}>
                          {(bill.items || []).map((i) => `${i.name} × ${i.unit || i.qty}`).join(', ') || 'No Items'}
                        </div>
                        <div className="text-[10px] text-stone-400 font-bold">
                          {bill.items?.length || 0} item lines
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getPaymentModeBadge(bill)}
                      </td>

                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-stone-400">{formattedTime}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-sm text-neutral-900">
                        ₹{(bill.total || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              printThermalReceipt(bill);
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                            title="Reprint Bill Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBillModal(bill);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit / Resettle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-500">
          <span>Showing {displayedBills.length} settled orders</span>
          <span>Total: ₹{displayedBills.reduce((s, b) => s + (b.total || 0), 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Bill View / Edit / Resettle Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-sm">
                  #{selectedBill.tokenNo || selectedBill.id}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Edit & Resettle Bill: {selectedBill.tableNo || 'Takeaway'}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                    <span>{selectedBill.sectionName || 'Dine In Area'}</span>
                    <span>•</span>
                    <span>{selectedBill.counter || 'Counter 1'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => printThermalReceipt({ ...selectedBill, items: editedItems, subtotal: liveTotal, total: liveTotal })}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reprint Receipt</span>
                </button>

                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              
              {/* Payment Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-bold block">Payment Mode</span>
                  <div className="mt-0.5">{getPaymentModeBadge(selectedBill)}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold block">Total Amount</span>
                  <span className="text-lg font-black text-blue-600">₹{liveTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Items List (Add / Remove Items & Adjust Quantities) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider">
                    Add / Remove Items in Bill
                  </span>
                  <span className="text-xs font-bold text-stone-400">
                    {editedItems.length} item lines
                  </span>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  {editedItems.length === 0 ? (
                    <div className="p-4 text-center text-stone-400 font-semibold text-xs">
                      No items in bill. Add a dish below to resettle.
                    </div>
                  ) : (
                    editedItems.map((item, idx) => {
                      const itemQty = item.qty !== undefined ? item.qty : 1;
                      const lineAmount = (item.price || 0) * itemQty;

                      return (
                        <div
                          key={`modal-item-${item.id || item.name}-${idx}`}
                          className="p-3 flex items-center justify-between text-xs bg-white"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <h4 className="font-extrabold text-neutral-900">{item.name}</h4>
                              {item.isParcel && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded">
                                  📦 Parcel
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-stone-500 font-medium">
                                ₹{item.price} {item.unit ? `(${item.unit})` : ''} • Line: ₹{lineAmount}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editedItems];
                                  updated[idx].isParcel = !updated[idx].isParcel;
                                  setEditedItems(updated);
                                }}
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer border ${
                                  item.isParcel
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-stone-100 text-stone-600 hover:bg-amber-50 border-stone-200'
                                }`}
                              >
                                {item.isParcel ? '📦 Parcel ✓' : '+ Parcel'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* (-) and (+) Qty Stepper */}
                            <div className="flex items-center space-x-1 bg-stone-100 border border-stone-300 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, -1)}
                                className="w-6 h-6 hover:bg-stone-200 text-stone-800 font-black rounded flex items-center justify-center cursor-pointer"
                                title="Reduce quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-black px-2 text-xs text-neutral-900">{itemQty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, 1)}
                                className="w-6 h-6 hover:bg-stone-200 text-stone-800 font-black rounded flex items-center justify-center cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Remove Item Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Remove item from bill"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Dish Selector Dropdown */}
                <div className="flex items-center space-x-2 pt-2">
                  <select
                    value={addDishId}
                    onChange={(e) => setAddDishId(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="">+ Select dish to add to this bill...</option>
                    {allDishes.map((d) => (
                      <option key={`add-dish-opt-${d.id}`} value={d.id}>
                        #{d.srNo || d.id} - {d.name} (₹{d.price})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddNewDishToBill}
                    disabled={!addDishId}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 shadow-2xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Audit History Logs */}
              {relatedLogs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                    <History className="w-3 h-3" />
                    <span>Resettle & Modification Logs</span>
                  </span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 max-h-32 overflow-y-auto text-xs">
                    {relatedLogs.map((log, lIdx) => (
                      <div key={`log-${lIdx}`} className="text-slate-700 font-medium">
                        <span className="text-slate-400 font-mono text-[10px]">[{log.timestamp}]</span>{' '}
                        {log.changeDescription}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500">
                Resettling will update bill total to <span className="font-black text-slate-900">₹{liveTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="bg-white border border-stone-300 text-stone-700 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBillModifications}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
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
