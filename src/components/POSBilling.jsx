import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Sparkles,
  ArrowLeft,
  Printer,
  Utensils,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  X,
  Edit2,
  Check,
  Receipt
} from 'lucide-react';
import TableGrid, { getSectionTheme } from './TableGrid';
import { printKOTReceipt, printThermalReceipt } from '../utils/receiptUtils';
import { db, getDishPriceForSection } from '../db/db';

const formatTokenNumber = (token, table) => {
  if (token) return String(token).replace(/^#/, '');
  if (table?.currentTokenNo) return String(table.currentTokenNo).replace(/^#/, '');
  if (table?.id) return String(1000 + (parseInt(table.id) || 1));
  return '1000';
};

export default function POSBilling({
  currentZoom = 100,
  dishes,
  categories,
  subCategories,
  sections,
  tables,
  activeSection,
  setActiveSection,
  activeTable,
  settledBillsCount,
  settledBills,
  allDishes,
  billLogs,
  onUpdateSettledBill,
  onSelectTable,
  onSaveTableOrder,
  onOpenAddTableModal,
  onNavigateToSettled,
  onOpenOrderPopupForTable,
  onSplitTable,
  onDeleteTable,
  cartItems,
  onAddToCart,
  onReduceFromCart,
  onUpdateCartItem,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onSettleBill
}) {
  const sortedCategories = [...categories].sort((a, b) => (a.srNo || 0) - (b.srNo || 0));

  const [selectedMainCatId, setSelectedMainCatId] = useState(sortedCategories[0]?.id || 1);
  const [selectedSubCatId, setSelectedSubCatId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [noticeToast, setNoticeToast] = useState(null);
  const searchInputRef = useRef(null);
  const cartListRef = useRef(null);
  const [rememberedAreaFilter, setRememberedAreaFilter] = useState('all');

  // Auto-scroll cart list container to bottom whenever cart items update
  useEffect(() => {
    if (cartListRef.current) {
      cartListRef.current.scrollTop = cartListRef.current.scrollHeight;
    }
  }, [cartItems]);
  
  const [shortCodeInput, setShortCodeInput] = useState('');
  
  // Footer bar active dish for multi-price options (Requirement 1)
  // Footer bar active dish for multi-price options (Requirement 1)
  const [activeFooterDish, setActiveFooterDish] = useState(null);
  const [customKgInput, setCustomKgInput] = useState('');
  const [editingCartItemIndex, setEditingCartItemIndex] = useState(null); // in-place cart edit index
  const [isParcelMode, setIsParcelMode] = useState(false); // Toggle to add items as Parcel from top search bar

  // Cart inline editing state (Requirement 3)
  const [editingCartItemId, setEditingCartItemId] = useState(null); // id of item being edited
  const [editingField, setEditingField] = useState(null); // 'qty' | 'price' | null
  const [editValue, setEditValue] = useState('');

  // Table Metadata (Customer, Pax, Waiter, Note, Token)
  const [customerName, setCustomerName] = useState(activeTable?.customerName || '');
  const [paxCount, setPaxCount] = useState(activeTable?.pax || '1');
  const [orderNote, setOrderNote] = useState('');
  const [waiterName, setWaiterName] = useState(activeTable?.waiter || 'Raju');
  const [tokenNo, setTokenNo] = useState(activeTable?.currentTokenNo || '');

  // Input editing toggles
  const [editingMeta, setEditingMeta] = useState(null); // 'customer' | 'pax' | 'note' | 'waiter' | null
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const handleSaveOrderClick = () => {
    onSaveTableOrder();
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  // Cancel Active Order Handler (No browser confirm popup!)
  const handleCancelOrderClick = () => {
    if (!activeTable) return;
    setShowCancelOrderModal(true);
  };

  // Table Bill Release Handler (Prints thermal bill & turns table status to RED 'bill_released')
  const handleReleaseTableBillClick = async () => {
    if (!activeTable || cartItems.length === 0) return;

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 1), 0);
    const total = subtotal;

    const billObj = {
      tokenNo: activeTable.currentTokenNo || (1000 + (parseInt(activeTable.id) || 1)).toString(),
      tableNo: activeTable.name || 'Takeaway',
      sectionName: activeSection?.name || 'Dine In Area',
      items: cartItems,
      subtotal,
      total,
      paymentDetails: { mode: 'UNPAID (Table Bill Released)' },
      createdAt: new Date().toISOString()
    };

    try {
      printThermalReceipt(billObj);
    } catch (e) {
      console.warn('Bill print error or skipped:', e);
    }

    await db.diningTables.update(activeTable.id, {
      status: 'bill_released',
      currentCart: cartItems,
      currentTokenNo: billObj.tokenNo,
      createdAt: activeTable.createdAt || new Date().toISOString()
    });

    if (typeof onSelectTable === 'function') {
      onSelectTable(null);
    }
  };

  // Ensure default main category is always Breakfast & Snacks when table is selected
  useEffect(() => {
    if (sortedCategories && sortedCategories.length > 0) {
      setSelectedMainCatId(sortedCategories[0].id);
      setSelectedSubCatId('all');
    }
    setActiveFooterDish(null);
    setEditingCartItemId(null);
    setIsParcelMode(false);
  }, [activeTable?.id]);

  // Sync table metadata
  useEffect(() => {
    if (activeTable) {
      setCustomerName(activeTable.customerName || '');
      setPaxCount(activeTable.pax || '1');
      setWaiterName(activeTable.waiter || 'Raju');
      setTokenNo(activeTable.currentTokenNo || (1000 + (parseInt(activeTable.id) || 1)).toString());
    }
  }, [activeTable]);

  // KOT Print Handler
  const handlePrintKOT = async () => {
    if (cartItems.length === 0) return;

    const lastPrinted = activeTable?.lastPrintedCart || [];
    const newItemsToPrint = [];

    for (const item of cartItems) {
      const prev = lastPrinted.find(
        (p) => p.id === item.id && (p.unit || '') === (item.unit || '') && (p.customNote || '') === (item.customNote || '') && Boolean(p.isParcel) === Boolean(item.isParcel)
      );
      const prevQty = prev ? prev.qty : 0;
      const diffQty = item.qty - prevQty;

      if (diffQty > 0) {
        newItemsToPrint.push({
          ...item,
          qty: diffQty,
          qtyDisplay: item.unit || `${diffQty}`
        });
      }
    }

    const itemsToDispatch = newItemsToPrint.length > 0 ? newItemsToPrint : cartItems;
    const currentKotCount = (activeTable?.kotCount || 0) + (newItemsToPrint.length > 0 || !activeTable?.lastPrintedCart ? 1 : 0);

    printKOTReceipt({
      tableNo: activeTable ? activeTable.name : 'Takeaway',
      tokenNo: activeTable?.currentTokenNo || Math.floor(1000 + Math.random() * 9000).toString(),
      kotRunNo: currentKotCount || 1,
      items: itemsToDispatch,
      orderNote,
      waiter: waiterName
    });

    if (activeTable) {
      await db.diningTables.update(activeTable.id, {
        lastPrintedCart: cartItems,
        kotCount: currentKotCount,
        status: 'occupied'
      });
      activeTable.lastPrintedCart = cartItems;
      activeTable.kotCount = currentKotCount;
    }

    if (typeof onSelectTable === 'function') {
      onSelectTable(null);
    }
  };

  // Keyboard shortcut listener ('K' to save, 'J' to print KOT, 'R' to release bill, 'L' to settle, 'F2' for shortcode)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // 'J' to Save & Print KOT
      if ((e.key === 'j' || e.key === 'J') && cartItems.length > 0) {
        e.preventDefault();
        handlePrintKOT();
        return;
      }

      // 'K' to Save without KOT (Returns to table grid)
      if ((e.key === 'k' || e.key === 'K') && activeTable && cartItems.length > 0) {
        e.preventDefault();
        handleSaveOrderClick();
        return;
      }

      // 'R' to Release Table Bill
      if ((e.key === 'r' || e.key === 'R') && activeTable && cartItems.length > 0) {
        e.preventDefault();
        handleReleaseTableBillClick();
        return;
      }

      // 'L' to Settle Order
      if ((e.key === 'l' || e.key === 'L') && cartItems.length > 0) {
        e.preventDefault();
        if (typeof onOpenOrderPopupForTable === 'function') {
          onOpenOrderPopupForTable(activeTable);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTable, cartItems, onSaveTableOrder, handlePrintKOT, onOpenOrderPopupForTable]);

  // Helper to check if a dish belongs to Sweets division / per-Kg sweet options
  const isSweetsDish = (dish) => {
    if (!dish) return false;
    if (dish.categoryId === 2) return true;
    if (dish.counter && dish.counter.toLowerCase().includes('sweet')) return true;
    if (dish.hasMultiplePrices) return true;
    if (dish.categoryName && dish.categoryName.toLowerCase().includes('sweet')) return true;
    return false;
  };

  // Handle Dish Card Click (from Menu Grid)
  const handleDishCardClick = (dish) => {
    setEditingCartItemIndex(null);
    if (isSweetsDish(dish)) {
      setActiveFooterDish(dish);
    } else {
      setActiveFooterDish(null);
    }
    setCustomKgInput('');

    if (!dish.hasMultiplePrices || !dish.variants || dish.variants.length === 0) {
      const activePrice = getDishPriceForSection(dish, activeSection?.id);
      onAddToCart({
        ...dish,
        price: activePrice,
        isParcel: isParcelMode
      });
    }
  };

  // Handle Option Click from Footer Bar
  const handleSelectOptionFromFooter = (variant) => {
    if (!activeFooterDish) return;
    const weightKg = variant.weightKg || (variant.unit.includes('250') ? 0.25 : variant.unit.includes('500') ? 0.5 : 1);

    onAddToCart({
      ...activeFooterDish,
      price: variant.price,
      unit: variant.unit,
      weightKg: weightKg,
      qty: 1,
      isParcel: isParcelMode
    });
  };

  // Handle Custom Kg entry from Footer Bar
  const handleAddCustomKg = (e) => {
    if (e) e.preventDefault();
    if (!activeFooterDish) return;
    const kg = parseFloat(customKgInput);
    if (!kg || isNaN(kg) || kg <= 0) return;

    const ratePerKg = activeFooterDish.pricePerKg || activeFooterDish.price || (activeFooterDish.variants?.[0]?.price ? activeFooterDish.variants[0].price * 4 : 300);
    const calculatedPrice = Math.round(kg * ratePerKg);

    onAddToCart({
      ...activeFooterDish,
      price: calculatedPrice,
      unit: `${kg} Kg`,
      weightKg: kg,
      qty: 1,
      isParcel: isParcelMode
    });
    setCustomKgInput('');
  };

  // Handle Unified Search submit (Pressing Enter in Search box adds matching item or code!)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const foundDish = dishes.find(
      (d) => d.srNo?.toString() === query || d.name.toLowerCase() === query.toLowerCase()
    );

    const targetDish = foundDish || (filteredDishes.length === 1 ? filteredDishes[0] : null);

    if (targetDish) {
      setEditingCartItemIndex(null);
      if (isSweetsDish(targetDish)) {
        setActiveFooterDish(targetDish);
      } else {
        setActiveFooterDish(null);
      }
      setCustomKgInput('');
      if (!targetDish.hasMultiplePrices || !targetDish.variants || targetDish.variants.length === 0) {
        const activePrice = getDishPriceForSection(targetDish, activeSection?.id);
        onAddToCart({
          ...targetDish,
          price: activePrice,
          isParcel: isParcelMode
        });
      }
      setSearchQuery('');
    } else {
      setNoticeToast(`No dish found matching "${query}"`);
      setTimeout(() => setNoticeToast(null), 2500);
    }
  };

  // Handle clicking cart item (opens footer bar with -,+ controls ONLY for sweets)
  const handleCartItemClick = (item, itemIdx) => {
    const originalDish = dishes.find((d) => d.id === item.id || d.name === item.name) || item;
    if (isSweetsDish(originalDish)) {
      setActiveFooterDish(originalDish);
      setEditingCartItemIndex(itemIdx);
    } else {
      setActiveFooterDish(null);
      setEditingCartItemIndex(null);
    }
  };

  // Commit inline edit for Qty in Cart
  const handleCommitInlineEdit = (item, itemIdx) => {
    if (editingField === 'qty') {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val > 0) {
        const originalDish = dishes.find((d) => d.id === item.id || d.name === item.name);
        if (originalDish && originalDish.pricePerKg) {
          onUpdateCartItem(itemIdx, {
            qty: val,
            price: Math.round(val * originalDish.pricePerKg),
            unit: `${val} Kg`,
            weightKg: val,
            qtyDisplay: `${val} Kg`
          });
        } else {
          onUpdateCartQty(item.cartItemId || item.id, val, item.unit);
        }
      }
    }
    setEditingCartItemId(null);
    setEditingField(null);
    setEditValue('');
  };

  // Filter Sub Categories for selected Main Division
  const currentSubCats = subCategories.filter(
    (sc) => sc.parentCategoryId === selectedMainCatId
  );

  // Filter Dishes by Division, Sub-Category & Search Query
  const filteredDishes = dishes.filter((dish) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = dish.name.toLowerCase().includes(q);
      const matchMarathi = dish.marathiName?.toLowerCase().includes(q);
      const matchCode = dish.srNo?.toString().includes(q);
      return matchName || matchMarathi || matchCode;
    }
    if (dish.categoryId !== selectedMainCatId) return false;
    if (selectedSubCatId !== 'all' && dish.subCategoryId !== selectedSubCatId) return false;
    return true;
  });

  // Calculate Grand Total
  const grandTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0
  );

  // If no table is active, render TableGrid
  if (!activeTable) {
    return (
      <TableGrid
        currentZoom={currentZoom}
        tables={tables}
        sections={sections}
        settledBillsCount={settledBillsCount}
        settledBills={settledBills}
        allDishes={allDishes || dishes}
        billLogs={billLogs}
        onUpdateSettledBill={onUpdateSettledBill}
        initialAreaFilter={rememberedAreaFilter}
        onAreaFilterChange={setRememberedAreaFilter}
        onSelectTable={onSelectTable}
        onOpenAddTableModal={onOpenAddTableModal}
        onNavigateToSettled={onNavigateToSettled}
        onSplitTable={onSplitTable}
        onDeleteTable={onDeleteTable}
        onOpenOrderPopupForTable={(tbl) => {
          if (tbl) {
            onSelectTable(tbl);
          }
          if (typeof onOpenOrderPopupForTable === 'function') {
            onOpenOrderPopupForTable();
          }
        }}
      />
    );
  }

  const activeTheme = getSectionTheme(activeSection?.name);

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-100 select-none min-h-0">
      
      {/* COLUMN 1: LEFT DIVISIONS & SUB-CATEGORIES SIDEBAR */}
      <aside className="w-44 bg-white border-r border-stone-200 flex flex-col shrink-0">
        
        {/* Main Divisions (Breakfast & Sweets) */}
        <div className="p-2 border-b border-stone-200 space-y-1 bg-slate-50">
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-wider px-1 mb-0.5">
            Menu Divisions
          </div>
          {sortedCategories.map((cat, catIdx) => {
            const isSelected = selectedMainCatId === cat.id;
            return (
              <button
                key={`main-cat-${cat.id}-${catIdx}`}
                onClick={() => {
                  setSelectedMainCatId(cat.id);
                  setSelectedSubCatId('all');
                }}
                className={`w-full text-left py-2 px-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {cat.isFixed && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-700 text-slate-200 shrink-0 ml-1">
                    Fixed
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-Categories for Active Main Category */}
        <div className="p-2 flex-1 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 mb-0.5">
            Sub Categories
          </div>

          <button
            onClick={() => setSelectedSubCatId('all')}
            className={`w-full text-left py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer leading-tight ${
              selectedSubCatId === 'all'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-black'
                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
          >
            All Items
          </button>

          {currentSubCats.map((sc, scIdx) => {
            const isSelected = selectedSubCatId === sc.id;
            return (
              <button
                key={`sub-cat-${sc.id}-${scIdx}`}
                onClick={() => setSelectedSubCatId(sc.id)}
                className={`w-full text-left py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer leading-tight ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 border border-blue-200 font-black'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {sc.name}
              </button>
            );
          })}
        </div>

      </aside>

      {/* COLUMN 2: CENTER DISHES GRID AREA & STICKY FOOTER OPTIONS BAR */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative overflow-hidden">
        
        {/* Top Header Controls Bar */}
        <div className="bg-white p-3 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3 flex-1">
            {/* Colorful Bold Back Button */}
            <button
              onClick={() => onSelectTable(null)}
              className="bg-neutral-900 hover:bg-black text-white font-black text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5 stroke-[3]" />
              <span>Back</span>
            </button>

            {/* Single Unified Search Bar for Item Name or Code */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search items by name or code (e.g. 101, Sheera) + Enter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-300 text-neutral-900 text-sm font-bold rounded-xl pl-10 pr-20 py-2.5 outline-none focus:ring-2 focus:ring-neutral-900 shadow-2xs placeholder:text-stone-400 placeholder:font-normal"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-stone-900 hover:bg-black text-white text-xs font-black px-3 rounded-lg cursor-pointer flex items-center space-x-1"
              >
                <span>↵ ENTER</span>
              </button>
            </form>

            {/* Parcel Mode Toggle Button on Right Side of Search Bar */}
            <button
              type="button"
              onClick={() => setIsParcelMode((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center space-x-1.5 border shadow-2xs shrink-0 ${
                isParcelMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                  : 'bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-900 border-slate-300'
              }`}
              title={isParcelMode ? 'Parcel Mode ACTIVE: Next items added will be tagged as Parcel' : 'Click to turn ON Parcel Mode for adding items'}
            >
              <span className="text-sm">📦</span>
              <span>{isParcelMode ? 'Parcel Mode: ON' : '+ Add as Parcel'}</span>
            </button>
          </div>

        </div>

        {/* Dishes Grid (Larger Cards with Clear Images & Bold Text - Exactly 5 per row) */}
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 pb-24">
            {filteredDishes.map((dish, dishIdx) => {
              const dishActivePrice = getDishPriceForSection(dish, activeSection?.id);
              const matchingCartItems = cartItems.filter((ci) => ci.id === dish.id || ci.name === dish.name);
              const inCart = matchingCartItems.length > 0;
              let cartBadgeText = '';
              if (matchingCartItems.length === 1) {
                const item = matchingCartItems[0];
                if (item.unit) {
                  cartBadgeText = item.qty > 1 ? `${item.qty}x ${item.unit}` : item.unit;
                } else {
                  cartBadgeText = `${item.qty}`;
                }
              } else if (matchingCartItems.length > 1) {
                cartBadgeText = `${matchingCartItems.length} Items`;
              }

              const hasMulti = dish.hasMultiplePrices && dish.variants && dish.variants.length > 0;
              const isFooterActive = activeFooterDish?.id === dish.id;

              return (
                <button
                  type="button"
                  key={`dish-card-${dish.id}-${dishIdx}`}
                  onClick={() => handleDishCardClick(dish)}
                  className={`bg-white rounded-2xl p-4 text-left border transition-all duration-150 cursor-pointer flex flex-col justify-between h-48 sm:h-52 relative hover:shadow-xl ${
                    isFooterActive
                      ? 'border-amber-600 ring-2 ring-amber-400 bg-amber-50/20'
                      : inCart
                      ? 'border-neutral-900 ring-2 ring-neutral-200 shadow-md'
                      : 'border-stone-300/90 hover:border-neutral-900'
                  }`}
                >
                  {/* Top Item Code Badge */}
                  <span className="absolute top-3 left-3 bg-stone-100/90 text-stone-800 border border-stone-300 text-xs font-black px-2.5 py-0.5 rounded-lg shadow-2xs z-10">
                    #{dish.srNo || dish.id}
                  </span>

                  {/* Larger Image Box */}
                  <div className="w-full h-24 sm:h-28 bg-[#F9F6F0] rounded-xl flex items-center justify-center border border-stone-200/80 mb-2 relative shrink-0">
                    <ImageIcon className="w-10 h-10 text-stone-400" />
                  </div>

                  <div>
                    <div className="font-black text-base text-neutral-900 line-clamp-2 leading-tight">
                      {dish.name}
                    </div>
                    {dish.marathiName && (
                      <div className="text-xs font-bold text-stone-400 truncate mt-0.5">
                        {dish.marathiName}
                      </div>
                    )}
                  </div>

                  {/* Price Badge */}
                  <div className="flex items-center justify-between mt-auto pt-1 w-full">
                    {hasMulti ? (
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black px-2.5 py-1 rounded-lg truncate w-full text-center">
                        ₹{dish.pricePerKg ? `${dish.pricePerKg}/Kg` : `${dish.variants[0]?.price} (Opts)`}
                      </span>
                    ) : (
                      <span className="font-black text-base text-blue-600">
                        ₹{dishActivePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {inCart && (
                    <div className="absolute top-3 right-3 bg-neutral-900 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm z-10">
                      {cartBadgeText}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* STICKY BOTTOM FOOTER BAR FOR PRODUCT QUANTITY / PORTIONS (SWEETS ONLY) */}
        {activeFooterDish && isSweetsDish(activeFooterDish) && (
          <div className="absolute bottom-3 left-3 right-3 bg-white border-2 border-blue-600 rounded-2xl shadow-xl p-2.5 px-4 z-30 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto relative">
              {/* Dish Info (Icon Removed as requested) */}
              <div className="flex items-center space-x-2 shrink-0">
                <h4 className="font-black text-sm text-slate-900 leading-none flex items-center gap-2">
                  <span>{activeFooterDish.name}</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    #{activeFooterDish.srNo || activeFooterDish.id} • Rate: ₹{activeFooterDish.pricePerKg || activeFooterDish.price}{activeFooterDish.pricePerKg ? '/Kg' : ''}
                  </span>
                </h4>
              </div>

              {/* Quantity & Portion Option Controls with (-) on Left & (+) on Right */}
              <div className="flex items-center space-x-2 shrink-0">
                {activeFooterDish.hasMultiplePrices && activeFooterDish.variants && activeFooterDish.variants.length > 0 ? (
                  <>
                    {activeFooterDish.variants.map((v, vIdx) => (
                      <div
                        key={`opt-btn-${v.unit}-${vIdx}`}
                        className="bg-slate-50 border border-slate-300 hover:border-blue-600 rounded-xl p-1 shadow-2xs flex items-center space-x-1.5 transition-all"
                      >
                        {/* (-) Minus Button on Left */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onReduceFromCart === 'function') {
                              onReduceFromCart({ ...activeFooterDish, unit: v.unit });
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-900 border border-slate-300 font-black flex items-center justify-center cursor-pointer transition text-sm"
                          title="Reduce from cart"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        {/* Center Option Label */}
                        <button
                          type="button"
                          onClick={() => handleSelectOptionFromFooter(v)}
                          className="px-2 py-0.5 cursor-pointer flex items-center space-x-1.5 text-slate-900"
                        >
                          <span className="font-black text-xs sm:text-sm">{v.unit}</span>
                          <span className="text-blue-600 font-black text-xs sm:text-sm">₹{v.price}</span>
                        </button>

                        {/* (+) Plus Button on Right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOptionFromFooter(v);
                          }}
                          className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center cursor-pointer transition text-sm"
                          title="Add to cart"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ))}

                    {/* Custom Weight Entry (Strictly in Kg) with (-) and (+) */}
                    <form onSubmit={handleAddCustomKg} className="flex items-center space-x-1.5 bg-white border border-stone-300 rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onReduceFromCart === 'function') {
                            onReduceFromCart(activeFooterDish);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 font-black flex items-center justify-center cursor-pointer transition text-sm"
                        title="Reduce custom quantity"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        placeholder="Kg (e.g. 0.75)"
                        value={customKgInput}
                        onChange={(e) => setCustomKgInput(e.target.value)}
                        className="w-32 bg-transparent border-0 px-2 py-0.5 text-xs font-black text-neutral-900 outline-none"
                      />

                      <button
                        type="submit"
                        disabled={!customKgInput}
                        className="bg-neutral-900 hover:bg-black text-white font-black text-xs px-3 py-1 rounded-lg cursor-pointer disabled:opacity-40 shadow-2xs flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </form>
                  </>
                ) : (
                  /* Standard Single Price Dish: (-) Left & (+) Right */
                  <div className="bg-white border border-stone-300 rounded-xl p-1 shadow-2xs flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof onReduceFromCart === 'function') {
                          onReduceFromCart(activeFooterDish);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 font-black flex items-center justify-center cursor-pointer text-sm transition"
                      title="Reduce from cart"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="px-2 py-0.5 text-center">
                      <span className="font-black text-xs sm:text-sm text-neutral-900 block">{activeFooterDish.name}</span>
                      <span className="font-black text-xs text-amber-700">₹{(getDishPriceForSection(activeFooterDish, activeSection?.id) || activeFooterDish.price || 0).toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const activePrice = getDishPriceForSection(activeFooterDish, activeSection?.id);
                        onAddToCart({ ...activeFooterDish, price: activePrice });
                      }}
                      className="w-7 h-7 rounded-lg bg-neutral-900 hover:bg-black text-white font-black flex items-center justify-center cursor-pointer text-sm transition"
                      title="Add to cart"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* COLUMN 3: RIGHT SIDE ITEMS CART (Requirement 3: Interactive with Inline Edits) */}
      <aside className="w-80 md:w-96 bg-white border-l border-stone-200 flex flex-col shrink-0 shadow-lg select-none">
        
        {/* Top Dark Header Bar (TABLE, TOKEN, CUSTOMER) */}
        <div className="bg-[#111111] text-white p-3 flex items-center justify-between text-xs font-bold border-b border-stone-800">
          
          <div className="text-center">
            <span className="text-[10px] text-stone-400 block uppercase font-bold">TABLE</span>
            <span className="text-amber-400 font-extrabold text-sm">{activeTable.name}</span>
          </div>

          <div className="text-center cursor-pointer" onClick={() => setEditingMeta(editingMeta === 'token' ? null : 'token')}>
            <span className="text-[10px] text-stone-400 block uppercase font-bold">TOKEN</span>
            <span className="text-emerald-400 font-extrabold text-sm bg-stone-900 px-2.5 py-0.5 rounded border border-stone-700 hover:border-emerald-500 transition-colors shadow-xs">
              #{formatTokenNumber(tokenNo, activeTable)}
            </span>
          </div>

          <div className="text-center cursor-pointer" onClick={() => setEditingMeta(editingMeta === 'customer' ? null : 'customer')}>
            <span className="text-[10px] text-stone-400 block uppercase font-bold">CUSTOMER</span>
            <span className="text-white hover:underline truncate max-w-[100px] block">
              {customerName ? customerName : '+ Add'}
            </span>
          </div>

        </div>

        {/* Metadata Drawer */}
        {editingMeta && (
          <div className="bg-slate-50 p-3 border-b border-slate-300 flex items-center space-x-2 text-xs">
            {editingMeta === 'token' && (
              <input
                type="text"
                autoFocus
                placeholder="Token Number (e.g. 1000)"
                value={tokenNo}
                onChange={(e) => {
                  setTokenNo(e.target.value);
                  if (activeTable) {
                    activeTable.currentTokenNo = e.target.value;
                    db.diningTables.update(activeTable.id, { currentTokenNo: e.target.value });
                  }
                }}
                className="w-full bg-white border border-stone-300 rounded-lg p-1.5 font-bold text-neutral-900 outline-none"
              />
            )}
            {editingMeta === 'customer' && (
              <input
                type="text"
                autoFocus
                placeholder="Enter Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-1.5 font-bold text-neutral-900 outline-none"
              />
            )}
            {editingMeta === 'pax' && (
              <input
                type="number"
                autoFocus
                placeholder="Pax Count"
                value={paxCount}
                onChange={(e) => setPaxCount(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-1.5 font-bold text-neutral-900 outline-none"
              />
            )}
            {editingMeta === 'note' && (
              <input
                type="text"
                autoFocus
                placeholder="Order Note"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-1.5 font-bold text-neutral-900 outline-none"
              />
            )}
            <button
              onClick={() => setEditingMeta(null)}
              className="bg-neutral-900 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* Table Column Headers (Requirement 1: Removed PRICE column) */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 grid grid-cols-12 text-[10px] font-black text-slate-600 uppercase tracking-wider">
          <div className="col-span-6">ITEMS</div>
          <div className="col-span-3 text-center">QTY / UNIT</div>
          <div className="col-span-3 text-right">AMOUNT</div>
        </div>

        {/* Cart Items List */}
        <div ref={cartListRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Utensils className="w-12 h-12 text-stone-300 mb-3 stroke-[1.5]" />
              <p className="text-xs font-semibold max-w-[200px] leading-relaxed text-stone-500">
                Cart is empty. Click items or type short code + Enter.
              </p>
            </div>
          ) : (
            cartItems.map((item, itemIdx) => {
              const itemQty = parseFloat(item.qty) || 1;
              const isKgItem = item.weightKg !== undefined || (item.unit && (item.unit.includes('g') || item.unit.toLowerCase().includes('kg'))) || item.hasMultiplePrices;
              
              let qtyDisplay;
              if (isKgItem) {
                if (itemQty > 1 && item.unit && !item.unit.startsWith(`${itemQty} `) && !item.unit.startsWith(`${itemQty}×`)) {
                  qtyDisplay = `${itemQty} × ${item.unit}`;
                } else {
                  qtyDisplay = item.unit || `${itemQty} Kg`;
                }
              } else {
                qtyDisplay = `${itemQty}`;
              }

              const lineAmount = (item.price || 0) * itemQty;
              const targetKey = item.cartItemId || item.id;
              const isEditingQty = editingCartItemId === targetKey && editingField === 'qty';

              return (
                <div
                  key={`side-cart-item-${item.cartItemId || item.id}-${item.unit || ''}-${itemIdx}`}
                  onClick={() => handleCartItemClick(item, itemIdx)}
                  className={`grid grid-cols-12 items-center gap-1 py-2 border-b border-stone-100 text-xs text-neutral-800 rounded-lg px-2 cursor-pointer transition-colors ${
                    editingCartItemIndex === itemIdx ? 'bg-amber-100/80 border-amber-400 ring-1 ring-amber-400' : 'hover:bg-stone-50/80'
                  }`}
                >
                  {/* Clean Item Name + Parcel Tag */}
                  <div className="col-span-6 pr-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-extrabold text-neutral-900 text-xs truncate">
                        {item.name}
                      </span>
                      {item.isParcel && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded shadow-2xs">
                          📦 Parcel
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-stone-400 mt-0.5">
                      #{item.srNo || item.id}
                    </div>
                  </div>

                  {/* QTY / Unit Column (Requirement 2: No +/- buttons for Kg items; +/- only for regular items) */}
                  <div className="col-span-3 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    {isEditingQty ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="0.1"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitInlineEdit(item, itemIdx);
                            if (e.key === 'Escape') setEditingCartItemId(null);
                          }}
                          className="w-14 bg-amber-50 border border-amber-500 text-center text-xs font-black rounded p-0.5 outline-none"
                        />
                        <button
                          onClick={() => handleCommitInlineEdit(item, itemIdx)}
                          className="text-emerald-700 font-bold text-xs"
                        >
                          ✓
                        </button>
                      </div>
                    ) : isKgItem ? (
                      /* Kg Item: Clean badge only, no -, + stepper buttons */
                      <span
                        onClick={() => handleCartItemClick(item, itemIdx)}
                        className="font-black text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-center whitespace-nowrap hover:bg-blue-100 cursor-pointer shadow-2xs"
                        title="Click to change portion"
                      >
                        {qtyDisplay}
                      </span>
                    ) : (
                      /* Regular Item: Keep -, + stepper buttons */
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onUpdateCartQty(targetKey, itemQty - 1, item.unit)}
                          className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-black cursor-pointer text-[10px]"
                        >
                          -
                        </button>
                        <span
                          onClick={() => {
                            setEditingCartItemId(targetKey);
                            setEditingField('qty');
                            setEditValue(itemQty.toString());
                          }}
                          className="font-black text-xs px-1 text-center whitespace-nowrap hover:bg-amber-100 hover:text-amber-900 rounded cursor-text"
                          title="Click to type quantity"
                        >
                          {qtyDisplay}
                        </span>
                        <button
                          onClick={() => onUpdateCartQty(targetKey, itemQty + 1, item.unit)}
                          className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-black cursor-pointer text-[10px]"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Amount Column */}
                  <div className="col-span-3 text-right font-black text-neutral-900 text-xs flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                    <span>₹{lineAmount.toFixed(2)}</span>
                    <button
                      onClick={() => onRemoveCartItem(targetKey, item.unit)}
                      className="text-stone-300 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions & Total */}
        <div className="p-3 border-t border-stone-200 bg-slate-50 space-y-2.5 pb-4">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-xs">
              <span className="text-xs font-black text-stone-500 uppercase tracking-wider">Total :</span>
              <span className="text-2xl font-black text-blue-600">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons with Safe Spacing to Prevent Mistouch */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handlePrintKOT}
                  disabled={cartItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 px-2 rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  title="Save & Print KOT Ticket (Press J)"
                >
                  <Printer className="w-4 h-4" />
                  <span>KOT (J)</span>
                </button>

                <button
                  onClick={handleSaveOrderClick}
                  disabled={cartItems.length === 0}
                  className={`font-black text-xs py-3 px-2 rounded-xl cursor-pointer disabled:opacity-40 flex items-center justify-center space-x-1.5 transition-all border ${
                    isSavedFeedback
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 border-stone-300 text-neutral-800'
                  }`}
                  title="Save Order without KOT (Press K)"
                >
                  <span>{isSavedFeedback ? '✓ Saved!' : 'NO KOT (K)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleReleaseTableBillClick}
                  disabled={cartItems.length === 0}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs py-3 px-2 rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  title="Release/Print Table Bill (Turns table RED, Press R)"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Table Bill</span>
                </button>

                {/* RED Cancel Order Button */}
                <button
                  onClick={handleCancelOrderClick}
                  disabled={cartItems.length === 0}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-3 px-2 rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  title="Cancel Active Order"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Cancel Order</span>
                </button>
              </div>

              {/* Full Width Settle Button */}
              <button
                onClick={() => {
                  if (typeof onOpenOrderPopupForTable === 'function') {
                    onOpenOrderPopupForTable(activeTable);
                  }
                }}
                disabled={cartItems.length === 0}
                className="w-full bg-neutral-900 hover:bg-black text-white font-black text-sm py-3.5 px-2 rounded-xl shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center space-x-2"
                title="Settle Order & Bill (Press L)"
              >
                <span>Settle (L)</span>
              </button>
            </div>

          </div>

        </div>

      </aside>

      {/* Custom Cancel Order Confirmation Modal (No browser popups!) */}
      {showCancelOrderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-lg text-neutral-900">Cancel Active Order?</h3>
                <p className="text-xs font-bold text-stone-500">
                  Table {activeTable?.name} - This will clear all items and reset table to empty.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelOrderModal(false)}
                className="py-3 bg-stone-100 hover:bg-stone-200 text-neutral-800 font-black rounded-xl text-xs transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!activeTable) return;
                  if (activeTable.isSplit || (activeTable.name && activeTable.name.includes('-')) || activeTable.sectionId === 4 || (activeTable.name && String(activeTable.name).toUpperCase().startsWith('P')) || activeTable.isParcel) {
                    await db.diningTables.delete(activeTable.id);
                  } else {
                    await db.diningTables.update(activeTable.id, {
                      status: 'empty',
                      currentCart: [],
                      createdAt: null,
                      currentTokenNo: ''
                    });
                  }
                  if (typeof onClearCart === 'function') onClearCart();
                  if (typeof onSelectTable === 'function') onSelectTable(null);
                  setShowCancelOrderModal(false);
                }}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Toast Message */}
      {noticeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center space-x-2 border border-stone-700">
          <span>{noticeToast}</span>
        </div>
      )}

    </div>
  );
}
