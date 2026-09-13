import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  MapPin,
  ListOrdered,
  Layers,
  AlertTriangle,
  Save,
  Check,
  CheckCircle2,
  Lock,
  Tag,
  FileSpreadsheet,
  Database,
  ArrowLeft,
  ChevronRight,
  Utensils,
  FolderPlus,
  FolderOpen,
  DollarSign,
  Search,
  Image as ImageIcon,
  Sparkles,
  Coffee,
  Candy,
  Monitor,
  TrendingUp,
  Banknote,
  Smartphone,
  CreditCard,
  History,
  Printer,
  Receipt,
  Filter,
  Calendar,
  X,
  Edit3,
  QrCode
} from 'lucide-react';
import { db, getDishPriceForSection } from '../db/db';
import { exportFoodItemsToCSV, parseCSVAndValidateRates } from '../utils/excelUtils';
import { printThermalReceipt } from '../utils/receiptUtils';
import { AVAILABLE_COUNTERS } from './Header';

export default function OwnerAdmin({
  dishes,
  categories,
  subCategories,
  sections,
  tables = [],
  bills = [],
  billLogs = [],
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  onAddSubCategory,
  onDeleteSubCategory,
  onUpdateSection,
  onAddSection,
  onDeleteSection,
  onAddTable,
  onDeleteTable,
  onBulkUpdatePrices,
  onUpdateSettledBill
}) {
  const sortSectionsWithParcelsLast = (secArray) => {
    if (!Array.isArray(secArray)) return [];
    const nonParcels = secArray.filter((s) => !s || !s.name || !s.name.toLowerCase().includes('parcel'));
    const parcels = secArray.filter((s) => s && s.name && s.name.toLowerCase().includes('parcel'));
    return [...nonParcels, ...parcels];
  };
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('dishes'); // 'dishes' | 'history' | 'sections' | 'upi' | 'backup'
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  // Menu Management Division & Sub-Division Filters (Matching Reference Image)
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('all'); // 'all' | divisionId
  const [selectedSubDivisionFilter, setSelectedSubDivisionFilter] = useState('all'); // 'all' | subCatId
  const [dishSearchQuery, setDishSearchQuery] = useState('');

  // Sub-Category Add / Edit Modal State
  const [showAddSubCatModal, setShowAddSubCatModal] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatParentId, setNewSubCatParentId] = useState(1);
  const [editingSubCat, setEditingSubCat] = useState(null);

  // Dish Add Modal State (With Base Per-Kg Rate & Multi-Price - Requirement 8)
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishMarathiName, setNewDishMarathiName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishPricePerKg, setNewDishPricePerKg] = useState('');
  const [newDishSrNo, setNewDishSrNo] = useState('');
  const [newDishCatId, setNewDishCatId] = useState(1);
  const [newDishSubCatId, setNewDishSubCatId] = useState(subCategories[0]?.id || 1);
  const [newDishCounter, setNewDishCounter] = useState('Breakfast');
  const [newDishStockQty, setNewDishStockQty] = useState('20');
  const [newDishHasMultiplePrices, setNewDishHasMultiplePrices] = useState(false);
  const [newDishVariants, setNewDishVariants] = useState([
    { unit: '250g', weightKg: 0.25, price: '' },
    { unit: '500g', weightKg: 0.5, price: '' },
    { unit: '1 Kg', weightKg: 1, price: '' }
  ]);

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState(null);

  // UPI Setting State
  const [upiId, setUpiId] = useState(localStorage.getItem('karuna_upi_id') || '8446091809@ybl');
  const [payeeName, setPayeeName] = useState(localStorage.getItem('karuna_payee_name') || 'Karuna Hotel');
  const [upiSavedToast, setUpiSavedToast] = useState(false);

  // Backup & Import Feedback State
  const [bulkRatesMessage, setBulkRatesMessage] = useState(null);
  const [jsonRestoreMessage, setJsonRestoreMessage] = useState(null);

  // Section Rates Matrix Local State
  const [dishSectionRates, setDishSectionRates] = useState({});
  const [ratesSavedFeedback, setRatesSavedFeedback] = useState(false);
  const [matrixFilterCat, setMatrixFilterCat] = useState('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');

  // Dining Area & Table Management State
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [addTableAreaId, setAddTableAreaId] = useState(null);
  const [newTableName, setNewTableName] = useState('');

  // History Tab Filters & Modal State (Requirement 11)
  const [historyTimeFilter, setHistoryTimeFilter] = useState('today'); // 'today' | 'all'
  const [historyCounterFilter, setHistoryCounterFilter] = useState('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySelectedBill, setHistorySelectedBill] = useState(null);

  // Auto-calculate portion prices when Base Per-Kg Rate changes (Requirement 8)
  const handleBasePricePerKgChange = (val, isEditingMode = false) => {
    const rate = parseFloat(val);
    if (isEditingMode && editingDish) {
      setEditingDish({
        ...editingDish,
        pricePerKg: val,
        variants: [
          { unit: '250g', weightKg: 0.25, price: !isNaN(rate) ? Math.round(rate * 0.25) : '' },
          { unit: '500g', weightKg: 0.5, price: !isNaN(rate) ? Math.round(rate * 0.5) : '' },
          { unit: '1 Kg', weightKg: 1, price: !isNaN(rate) ? rate : '' }
        ]
      });
    } else {
      setNewDishPricePerKg(val);
      setNewDishVariants([
        { unit: '250g', weightKg: 0.25, price: !isNaN(rate) ? Math.round(rate * 0.25) : '' },
        { unit: '500g', weightKg: 0.5, price: !isNaN(rate) ? Math.round(rate * 0.5) : '' },
        { unit: '1 Kg', weightKg: 1, price: !isNaN(rate) ? rate : '' }
      ]);
    }
  };

  // Sync section rates matrix from dishes
  useEffect(() => {
    if (dishes && dishes.length > 0) {
      const ratesMap = {};
      dishes.forEach((d) => {
        ratesMap[d.id] = { ...(d.sectionPrices || {}) };
      });
      setDishSectionRates(ratesMap);
    }
  }, [dishes]);

  // Handle Save New Dish
  const handleSaveNewDish = () => {
    if (!newDishName) return;

    let finalPrice = parseFloat(newDishPrice) || 0;
    let variants = [];

    if (newDishHasMultiplePrices) {
      variants = newDishVariants
        .filter((v) => v.unit && v.price)
        .map((v) => ({
          unit: v.unit,
          weightKg: parseFloat(v.weightKg) || (v.unit.includes('250') ? 0.25 : v.unit.includes('500') ? 0.5 : 1),
          price: parseFloat(v.price)
        }));
      if (variants.length > 0 && !finalPrice) {
        finalPrice = variants[0].price;
      }
    }

    onAddDish({
      srNo: newDishSrNo ? parseInt(newDishSrNo) : Math.floor(100 + Math.random() * 900),
      name: newDishName.trim(),
      marathiName: newDishMarathiName.trim(),
      categoryId: parseInt(newDishCatId) || 1,
      subCategoryId: parseInt(newDishSubCatId) || 1,
      price: finalPrice,
      pricePerKg: parseFloat(newDishPricePerKg) || (newDishHasMultiplePrices ? finalPrice * 4 : null),
      stockQty: parseFloat(newDishStockQty) || 20,
      counter: newDishCounter,
      status: 'In Stock',
      hasMultiplePrices: newDishHasMultiplePrices,
      variants,
      sectionPrices: {},
      subItems: []
    });

    // Reset Form
    setNewDishName('');
    setNewDishMarathiName('');
    setNewDishPrice('');
    setNewDishPricePerKg('');
    setNewDishSrNo('');
    setNewDishHasMultiplePrices(false);
    setShowAddDishModal(false);
  };

  // Handle Save Dish Edits
  const handleSaveDishEdits = () => {
    if (!editingDish) return;
    onUpdateDish(editingDish.id, {
      ...editingDish,
      price: parseFloat(editingDish.price) || 0,
      pricePerKg: parseFloat(editingDish.pricePerKg) || null,
      stockQty: parseFloat(editingDish.stockQty) || 0
    });
    setEditingDish(null);
  };

  // Handle Save Sub-Category
  const handleSaveSubCategory = () => {
    if (!newSubCatName) return;
    if (editingSubCat) {
      // Update
      const sub = subCategories.find((s) => s.id === editingSubCat.id);
      if (sub) {
        sub.name = newSubCatName.trim();
        db.subCategories.update(sub.id, { name: sub.name });
      }
      setEditingSubCat(null);
    } else {
      onAddSubCategory({
        name: newSubCatName.trim(),
        parentCategoryId: parseInt(newSubCatParentId) || 1
      });
    }
    setNewSubCatName('');
    setShowAddSubCatModal(false);
  };

  // Save UPI Settings to LocalStorage & Server SystemSettings
  const handleSaveUpiSettings = async () => {
    const cleanUpi = upiId.trim();
    const cleanPayee = payeeName.trim();
    localStorage.setItem('karuna_upi_id', cleanUpi);
    localStorage.setItem('karuna_payee_name', cleanPayee);
    try {
      await db.systemSettings.put({
        id: 1,
        hotelName: cleanPayee,
        upiId: cleanUpi,
        payeeName: cleanPayee,
        lastSyncTime: new Date().toISOString()
      });
    } catch (e) {}
    setUpiSavedToast(true);
    setTimeout(() => setUpiSavedToast(false), 4000);
  };

  // Bulk Import Excel / CSV Menu Rates
  const handleImportExcelFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        if (!text) {
          setBulkRatesMessage({ success: false, text: 'File content is empty.' });
          return;
        }
        const validation = parseCSVAndValidateRates(text);
        if (!validation.success) {
          setBulkRatesMessage({ success: false, text: validation.error || 'Failed to parse CSV file.' });
          return;
        }

        const updated = await onBulkUpdatePrices(validation.items);
        setBulkRatesMessage({
          success: true,
          text: `✓ Successfully updated prices for ${validation.items.length} dishes in menu!`
        });
      } catch (err) {
        setBulkRatesMessage({ success: false, text: `Error importing file: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import JSON Full Database Backup
  const handleImportJsonBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonStr = evt.target?.result;
        const parsed = JSON.parse(jsonStr);
        if (!parsed || typeof parsed !== 'object') {
          setJsonRestoreMessage({ success: false, text: 'Invalid JSON backup format.' });
          return;
        }

        setConfirmDialog({
          title: 'Restore Database Backup?',
          message: 'Are you sure you want to restore this JSON backup? This will update and overwrite the entire database.',
          confirmText: 'Yes, Restore Database',
          confirmColor: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30',
          onConfirm: async () => {
            await db.restoreBackup(parsed);
            setJsonRestoreMessage({
              success: true,
              text: '✓ Database restored successfully! All data updated.'
            });
          }
        });
      } catch (err) {
        setJsonRestoreMessage({ success: false, text: `Invalid JSON file: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter Dishes for Menu Management
  const filteredDishes = dishes.filter((dish) => {
    if (selectedDivisionFilter !== 'all' && dish.categoryId !== parseInt(selectedDivisionFilter)) return false;
    if (selectedSubDivisionFilter !== 'all' && dish.subCategoryId !== parseInt(selectedSubDivisionFilter)) return false;
    if (dishSearchQuery.trim()) {
      const q = dishSearchQuery.toLowerCase();
      const mName = dish.name.toLowerCase().includes(q);
      const mMarathi = dish.marathiName?.toLowerCase().includes(q);
      const mCode = dish.srNo?.toString().includes(q);
      return mName || mMarathi || mCode;
    }
    return true;
  });

  // Calculate Sub-Category Dish Counts
  const getSubCatDishCount = (subCatId) => {
    return dishes.filter((d) => d.subCategoryId === subCatId).length;
  };

  // Filter Bills for History Tab (Requirement 11)
  const todayStr = new Date().toISOString().slice(0, 10);
  const baseTimeBills = bills.filter((b) => {
    if (historyTimeFilter === 'all') return true;
    if (!b.createdAt) return true;
    return new Date(b.createdAt).toISOString().slice(0, 10) === todayStr;
  });

  const baseCounterBills = baseTimeBills.filter((b) => {
    if (historyCounterFilter === 'all') return true;
    return (b.counter || '').toLowerCase().includes(historyCounterFilter.toLowerCase());
  });

  const displayedHistoryBills = baseCounterBills.filter((b) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      b.tokenNo?.toString().includes(q) ||
      b.id?.toString().includes(q) ||
      (b.tableNo || '').toLowerCase().includes(q) ||
      (b.counter || '').toLowerCase().includes(q)
    );
  });

  // Metric Totals for History Tab
  const totalHistoryRevenue = baseCounterBills.reduce((sum, b) => sum + (b.total || 0), 0);
  let totalCash = 0;
  let totalOnline = 0;
  let totalCard = 0;

  baseCounterBills.forEach((b) => {
    if (b.paymentDetails) {
      if (b.paymentDetails.cash) totalCash += parseFloat(b.paymentDetails.cash) || 0;
      if (b.paymentDetails.online || b.paymentDetails.upi) totalOnline += parseFloat(b.paymentDetails.online || b.paymentDetails.upi) || 0;
      if (b.paymentDetails.card) totalCard += parseFloat(b.paymentDetails.card) || 0;

      if (!b.paymentDetails.cash && !b.paymentDetails.online && !b.paymentDetails.upi && !b.paymentDetails.card) {
        const mode = (b.paymentDetails.mode || '').toLowerCase();
        if (mode.includes('cash')) totalCash += b.total || 0;
        else if (mode.includes('online') || mode.includes('upi')) totalOnline += b.total || 0;
        else if (mode.includes('card')) totalCard += b.total || 0;
        else totalCash += b.total || 0;
      }
    } else {
      totalCash += b.total || 0;
    }
  });

  // Counter Breakdown for History Tab
  const counterBreakdown = {};
  AVAILABLE_COUNTERS.forEach((c) => {
    counterBreakdown[c.name] = { total: 0, count: 0, shortName: c.shortName };
  });
  baseTimeBills.forEach((b) => {
    const cName = b.counter || 'Counter 1 (Breakfast & Snacks)';
    if (!counterBreakdown[cName]) {
      counterBreakdown[cName] = { total: 0, count: 0, shortName: cName.split(' ')[0] };
    }
    counterBreakdown[cName].total += (b.total || 0);
    counterBreakdown[cName].count += 1;
  });

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-100 overflow-y-auto select-none min-h-0">
      
      {/* Top Header & Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Owner Administration & Master Settings
            </h2>
            <p className="text-xs text-stone-500 font-semibold">
              Manage menu divisions, per-kg rates, counter breakdowns, bills audit history & area rates
            </p>
          </div>
        </div>

        {/* 4 Main Owner Sub-Tabs */}
        <div className="flex items-center space-x-2 bg-white border border-stone-200 rounded-xl p-1.5 shadow-2xs mr-12">
          
          <button
            onClick={() => setActiveAdminSubTab('dishes')}
            className={`px-3.5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAdminSubTab === 'dishes'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Menu & Dishes</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('history')}
            className={`px-3.5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAdminSubTab === 'history'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Bills & Revenue Reports</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('sections')}
            className={`px-3.5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAdminSubTab === 'sections'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Area Rates Matrix</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('upi')}
            className={`px-3.5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAdminSubTab === 'upi'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>UPI Setting</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('backup')}
            className={`px-3.5 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeAdminSubTab === 'backup'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MENU DIVISIONS, CATEGORIES & DISHES (Matches Reference Design) */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'dishes' && (
        <div className="space-y-6">
          
          {/* Top Title Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Menu Divisions, Categories & Dishes
              </h3>
              <p className="text-xs text-stone-500 font-semibold mt-0.5">
                Main Divisions (Breakfast & Sweets) with custom sub-divisions, dishes, rates, stock, and photos
              </p>
            </div>
          </div>

          {/* Division Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-white border border-stone-200 rounded-2xl p-2.5 shadow-xs">
            <button
              onClick={() => {
                setSelectedDivisionFilter('all');
                setSelectedSubDivisionFilter('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedDivisionFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Divisions</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedDivisionFilter === cat.id;
              const Icon = cat.id === 1 ? Coffee : Candy;
              return (
                <button
                  key={`div-filter-${cat.id}`}
                  onClick={() => {
                    setSelectedDivisionFilter(cat.id);
                    setSelectedSubDivisionFilter('all');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Divisions Pills Group with Section Add Button (Requirement 7) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                Sub-Divisions & Categories
              </span>
              
              {/* + + Add Sub-Category Button inside section (Requirement 7) */}
              <button
                onClick={() => {
                  setEditingSubCat(null);
                  setNewSubCatName('');
                  setShowAddSubCatModal(true);
                }}
                className="bg-stone-100 hover:bg-stone-200 text-neutral-900 border border-stone-300 font-extrabold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ + Add Sub-Category</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedSubDivisionFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedSubDivisionFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                All Sub-divisions ({subCategories.length})
              </button>

              {subCategories
                .filter((sc) => (selectedDivisionFilter === 'all' ? true : sc.parentCategoryId === parseInt(selectedDivisionFilter)))
                .map((sc) => {
                  const isSel = selectedSubDivisionFilter === sc.id;
                  const dishCount = getSubCatDishCount(sc.id);

                  return (
                    <div
                      key={`sub-div-pill-${sc.id}`}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSel
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedSubDivisionFilter(sc.id)}
                        className="cursor-pointer font-black"
                      >
                        <span>{sc.name} ({dishCount})</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubCat(sc);
                          setNewSubCatName(sc.name);
                          setShowAddSubCatModal(true);
                        }}
                        className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer ml-1"
                        title="Edit Category Name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialog({
                            title: 'Delete Sub-Category?',
                            message: `Are you sure you want to delete sub-category "${sc.name}"?`,
                            confirmText: 'Yes, Delete',
                            confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30',
                            onConfirm: () => {
                              onDeleteSubCategory(sc.id);
                            }
                          });
                        }}
                        className="opacity-70 hover:opacity-100 hover:text-rose-500 p-0.5 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Search Bar with + + Add New Dish Button inside Section (Requirement 7) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-3 shadow-xs">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish by name or code..."
                value={dishSearchQuery}
                onChange={(e) => setDishSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-500">
                Showing {filteredDishes.length} Dishes
              </span>

              {/* + + Add New Dish Button inside section (Requirement 7) */}
              <button
                onClick={() => setShowAddDishModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ + Add New Dish</span>
              </button>
            </div>
          </div>

          {/* Dishes Table (Exact Columns Matching Image) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-3 text-center">Photo</th>
                    <th className="py-3 px-4">Dish Name (English)</th>
                    <th className="py-3 px-4">पदार्थाचे नाव (मराठी)</th>
                    <th className="py-3 px-4">Sub-Category</th>
                    <th className="py-3 px-4 text-right">Price (₹)</th>
                    <th className="py-3 px-4 text-center">Counter</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDishes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                        No dishes found matching the current division or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredDishes.map((dish, dIdx) => {
                      const subCat = subCategories.find((s) => s.id === dish.subCategoryId);
                      const isMulti = dish.hasMultiplePrices && dish.variants?.length > 0;

                      return (
                        <tr
                          key={`dish-row-${dish.id || dIdx}`}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          {/* Code */}
                          <td className="py-3 px-4 font-mono font-black text-slate-900">
                            <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md text-xs">
                              #{dish.srNo || dish.id}
                            </span>
                          </td>

                          {/* Photo */}
                          <td className="py-3 px-3 text-center">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          </td>

                          {/* Dish Name (English) */}
                          <td className="py-3 px-4 font-extrabold text-slate-900">
                            {dish.name}
                          </td>

                          {/* मराठी नाव */}
                          <td className="py-3 px-4 font-bold text-slate-600">
                            {dish.marathiName || '-'}
                          </td>

                          {/* Sub-Category */}
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {subCat?.name || 'General'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                            {isMulti ? (
                              <div>
                                <span>₹{dish.pricePerKg ? `${dish.pricePerKg}/Kg` : `${dish.variants[0]?.price} (Opts)`}</span>
                                <div className="text-[10px] font-bold text-blue-600">
                                  {dish.variants.length} options
                                </div>
                              </div>
                            ) : (
                              <span>₹{(dish.price || 0).toFixed(2)}</span>
                            )}
                          </td>

                          {/* Counter */}
                          <td className="py-3 px-4 text-center">
                            <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-stone-200">
                              {dish.counter || 'Breakfast'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              (dish.stockQty || 0) <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}>
                              {dish.status || 'In Stock'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setEditingDish(JSON.parse(JSON.stringify(dish)))}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                                title="Edit Dish"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    title: 'Delete Dish Item?',
                                    message: `Are you sure you want to delete dish "${dish.name}"?`,
                                    confirmText: 'Yes, Delete Dish',
                                    confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30',
                                    onConfirm: () => {
                                      onDeleteDish(dish.id);
                                    }
                                  });
                                }}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Delete Dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: BILLING HISTORY & REVENUE REPORTS (Requirement 11)             */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'history' && (
        <div className="space-y-6">
          
          {/* Top Filter Controls: Today vs All Time, Counter Dropdown, Search */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Master Sales & Billing History
              </h3>
              <p className="text-xs text-stone-500 font-semibold mt-0.5">
                Executive revenue overview, payment mode breakdown, and full audit logs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Today vs All Time */}
              <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                <button
                  onClick={() => setHistoryTimeFilter('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                    historyTimeFilter === 'today'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Today</span>
                </button>

                <button
                  onClick={() => setHistoryTimeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                    historyTimeFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>All Time</span>
                </button>
              </div>

              {/* Counter Filter */}
              <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={historyCounterFilter}
                  onChange={(e) => setHistoryCounterFilter(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  <option value="all">All Counters</option>
                  {AVAILABLE_COUNTERS.map((c) => (
                    <option key={`h-opt-c-${c.id}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search token, table..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* ALL SUMMARY METRIC BOXES (Requirement 11) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Sales</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-neutral-900">₹{totalHistoryRevenue.toFixed(2)}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-1">{baseCounterBills.length} Bills Total</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Cash Total</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-800">₹{totalCash.toFixed(2)}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-1">Direct Cash Drawer</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Online / UPI</span>
                <Smartphone className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-800">₹{totalOnline.toFixed(2)}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-1">QR Phone Payments</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Card Total</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-purple-800">₹{totalCard.toFixed(2)}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-1">POS Card Swipes</div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Settled Count</span>
                <Receipt className="w-4 h-4 text-neutral-800" />
              </div>
              <div className="text-xl font-black text-neutral-900">{displayedHistoryBills.length}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-1">Active Filter View</div>
            </div>
          </div>

          {/* COUNTER-WISE SALES BREAKDOWN CARDS */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>Counter-Wise Revenue Breakdown</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(counterBreakdown).map(([cName, data], cIdx) => (
                <div
                  key={`history-cbreak-${cIdx}`}
                  className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                      {data.shortName || cName}
                    </span>
                    <h4 className="font-extrabold text-xs text-neutral-800 line-clamp-1 mt-0.5">
                      {cName}
                    </h4>
                  </div>
                  <div className="mt-3 flex justify-between items-baseline pt-2 border-t border-stone-100">
                    <span className="text-lg font-black text-neutral-900">₹{data.total.toFixed(2)}</span>
                    <span className="text-[11px] font-bold text-stone-500">{data.count} bills</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FULL SETTLED BILLS TABLE (Requirement 11) */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Table / Area</th>
                    <th className="py-3 px-4">Counter</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {displayedHistoryBills.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400 font-semibold">
                        No billing history records found.
                      </td>
                    </tr>
                  ) : (
                    displayedHistoryBills.map((bill, bIdx) => {
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
                        <tr key={`h-bill-${bill.id || bIdx}`} className="hover:bg-amber-50/30">
                          <td className="py-3 px-4 font-mono font-black text-neutral-900">
                            #{bill.tokenNo || bill.id}
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900">
                            {bill.tableNo || 'Takeaway'}
                          </td>
                          <td className="py-3 px-4 font-bold text-stone-700">
                            {bill.counter || 'Counter 1'}
                          </td>
                          <td className="py-3 px-4 text-stone-700 max-w-[200px] truncate">
                            {(bill.items || []).map((i) => `${i.name} (${i.unit || i.qty})`).join(', ')}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            {bill.paymentDetails?.mode || 'Cash'}
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            <div>{formattedDate}</div>
                            <div className="text-[10px] text-stone-400">{formattedTime}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-neutral-900">
                            ₹{(bill.total || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => printThermalReceipt(bill)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                                title="Reprint Bill"
                              >
                                <Printer className="w-3.5 h-3.5" />
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
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DINING AREA RATES MATRIX                                       */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SUB-TAB 3: DINING AREAS, TABLES & PRICE MATRIX                            */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'sections' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          
          {/* SECTION 1: DINING AREAS & TABLES CRUD MANAGER */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-amber-700" />
                  <span>Dining Areas & Cards Setup</span>
                </h3>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">
                  Create, rename, or delete dining areas and manage cards/boxes per section.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewAreaName('');
                  setShowAddAreaModal(true);
                }}
                className="bg-neutral-900 hover:bg-black text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Add New Area</span>
              </button>
            </div>

            {/* List of Dining Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortSectionsWithParcelsLast(sections).map((sec) => {
                const secTables = tables.filter((t) => t && t.sectionId === sec.id);

                return (
                  <div key={`admin-sec-card-${sec.id}`} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    
                    {/* Area Title & Edit/Delete Actions */}
                    <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                      {editingSectionId === sec.id ? (
                        <div className="flex items-center space-x-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingSectionName}
                            onChange={(e) => setEditingSectionName(e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-black text-slate-900 outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (editingSectionName.trim()) {
                                if (typeof onUpdateSection === 'function') {
                                  await onUpdateSection(sec.id, { name: editingSectionName.trim() });
                                } else {
                                  await db.sections.update(sec.id, { name: editingSectionName.trim() });
                                }
                              }
                              setEditingSectionId(null);
                            }}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                            title="Save Name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(null)}
                            className="p-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Utensils className="w-4 h-4 text-amber-700" />
                          <span className="font-black text-sm text-neutral-900">{sec.name}</span>
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                            {secTables.length} Cards
                          </span>
                        </div>
                      )}

                      {editingSectionId !== sec.id && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSectionId(sec.id);
                              setEditingSectionName(sec.name);
                            }}
                            className="p-1.5 text-stone-600 hover:text-neutral-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                            title="Edit Area Name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                title: 'Delete Dining Area?',
                                message: `Are you sure you want to delete Dining Area "${sec.name}"?`,
                                confirmText: 'Yes, Delete Area',
                                confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30',
                                onConfirm: async () => {
                                  if (typeof onDeleteSection === 'function') {
                                    await onDeleteSection(sec.id);
                                  } else {
                                    await db.sections.delete(sec.id);
                                  }
                                }
                              });
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete Area"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tables Grid under this Area */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {secTables.map((tbl) => (
                          <div
                            key={`admin-tbl-${tbl.id}`}
                            className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-extrabold text-neutral-800 flex items-center space-x-1.5 shadow-2xs group"
                          >
                            <span>{tbl.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDialog({
                                  title: 'Remove Card?',
                                  message: `Are you sure you want to remove card "${tbl.name}" from ${sec.name}?`,
                                  confirmText: 'Yes, Remove Card',
                                  confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30',
                                  onConfirm: async () => {
                                    if (typeof onDeleteTable === 'function') {
                                      await onDeleteTable(tbl.id);
                                    } else {
                                      await db.diningTables.delete(tbl.id);
                                    }
                                  }
                                });
                              }}
                              className="text-stone-300 group-hover:text-rose-600 cursor-pointer p-0.5"
                              title="Delete Table"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Card to Area Input */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (addTableAreaId === sec.id && newTableName.trim()) {
                            const newCardPayload = {
                              name: newTableName.trim(),
                              sectionId: sec.id,
                              status: 'empty',
                              currentCart: [],
                              currentTokenNo: Math.floor(1000 + Math.random() * 9000).toString(),
                              createdAt: null
                            };
                            if (typeof onAddTable === 'function') {
                              await onAddTable(newCardPayload);
                            } else {
                              await db.diningTables.add(newCardPayload);
                            }
                            setNewTableName('');
                            setAddTableAreaId(null);
                          }
                        }}
                        className="flex items-center space-x-2 pt-1"
                      >
                        {addTableAreaId === sec.id ? (
                          <>
                            <input
                              type="text"
                              placeholder="Card name (e.g. F7)"
                              autoFocus
                              value={newTableName}
                              onChange={(e) => setNewTableName(e.target.value)}
                              className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-900 outline-none flex-1"
                            />
                            <button
                              type="submit"
                              className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddTableAreaId(null)}
                              className="bg-stone-200 text-stone-700 font-bold text-xs px-2.5 py-1.5 rounded-xl cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddTableAreaId(sec.id);
                              const existingNums = secTables.map((t) => {
                                const match = t.name.match(/\d+/);
                                return match ? parseInt(match[0], 10) : 0;
                              });
                              const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
                              const sName = (sec.name || '').toLowerCase();
                              const prefix = sName.includes('first') ? 'F' : sName.includes('ac') ? 'AC' : sName.includes('parcel') ? 'P' : 'C';
                              setNewTableName(`${prefix}${maxNum + 1}`);
                            }}
                            className="text-xs font-black text-amber-800 hover:text-amber-900 flex items-center space-x-1 py-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Card to {sec.name}</span>
                          </button>
                        )}
                      </form>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: DINING AREA PRICE MATRIX */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Dining Area Price Matrix
              </h3>
              <p className="text-xs text-stone-500 font-semibold mt-0.5">
                Set custom prices per dish for different sections (e.g. AC Hall higher rate)
              </p>
            </div>

            <button
              onClick={async () => {
                // Save section rates
                for (const d of dishes) {
                  const rates = dishSectionRates[d.id];
                  if (rates) {
                    await db.dishes.update(d.id, { sectionPrices: rates });
                  }
                }
                setRatesSavedFeedback(true);
                setTimeout(() => setRatesSavedFeedback(false), 2000);
              }}
              className="bg-neutral-900 hover:bg-black text-white font-black text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{ratesSavedFeedback ? '✓ Rates Saved!' : 'Save All Matrix Rates'}</span>
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Dish Name</th>
                    <th className="py-3 px-4">Standard Rate (₹)</th>
                    {sections.map((sec) => (
                      <th key={`sec-rate-th-${sec.id}`} className="py-3 px-4 text-center">
                        {sec.name} (₹)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dishes.map((dish) => (
                    <tr key={`matrix-d-${dish.id}`} className="hover:bg-blue-50/20">
                      <td className="py-3 px-4 font-mono font-bold">#{dish.srNo || dish.id}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{dish.name}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">₹{dish.price}</td>
                      {sections.map((sec) => (
                        <td key={`matrix-input-${dish.id}-${sec.id}`} className="py-3 px-4 text-center">
                          <input
                            type="number"
                            placeholder={dish.price.toString()}
                            value={dishSectionRates[dish.id]?.[sec.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDishSectionRates({
                                ...dishSectionRates,
                                [dish.id]: {
                                  ...(dishSectionRates[dish.id] || {}),
                                  [sec.id]: val
                                }
                              });
                            }}
                            className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-1 text-center font-bold outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Area Modal */}
          {showAddAreaModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-neutral-900 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-amber-700" />
                    <span>Add New Dining Area</span>
                  </h3>
                  <button
                    onClick={() => setShowAddAreaModal(false)}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-black text-neutral-900 block mb-1.5">
                    Area Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Roof Top / Garden"
                    autoFocus
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(false)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (newAreaName.trim()) {
                        const newSec = {
                          name: newAreaName.trim(),
                          extraCharge: 0,
                          color: 'blue'
                        };
                        if (typeof onAddSection === 'function') {
                          await onAddSection(newSec);
                        } else {
                          await db.sections.add(newSec);
                        }
                        setNewAreaName('');
                        setShowAddAreaModal(false);
                      }
                    }}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    Save Area
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: DYNAMIC UPI QR CODE SETTINGS (Matches Mockup)                  */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'upi' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl space-y-6">
            
            {/* Header */}
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2.5">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Dynamic UPI QR Code Settings</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                Enter your Google Pay / PhonePe / Paytm / Bank VPA UPI ID below. The software automatically computes exact bill total dynamically and renders a scannable UPI QR code on every customer bill.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-900 block mb-1.5">
                  Dynamic UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8446091809@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-900 block mb-1.5">
                  Account / Payee Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karuna Hotel"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Live QR Preview Box (₹100 Demo) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="bg-white p-2 border border-stone-300 rounded-xl shadow-xs shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${upiId || '8446091809@ybl'}&pn=${payeeName || 'Karuna Hotel'}&am=100&cu=INR`)}&margin=1`}
                  alt="UPI QR Preview"
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-black text-sm text-neutral-900">
                  Live QR Preview (₹100 Demo)
                </h4>
                <p className="text-xs text-stone-500 font-semibold">
                  Scan with PhonePe / GPay / Paytm to test UPI ID format and instant verification
                </p>
                <div className="text-[11px] font-mono font-bold text-amber-800 pt-1">
                  UPI VPA: {upiId || '8446091809@ybl'}
                </div>
              </div>
            </div>

            {/* Success Feedback Banner */}
            {upiSavedToast && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ UPI Settings saved successfully! All newly printed bills will use this UPI QR Code.</span>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveUpiSettings}
                disabled={!upiId.trim()}
                className="bg-neutral-900 hover:bg-black text-white font-black text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-2 disabled:opacity-40"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save UPI Settings</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: BACKUP & RESTORE DATABASE & BULK RATES IMPORT / EXPORT         */}
      {/* ========================================================================= */}
      {activeAdminSubTab === 'backup' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Menu Rates Bulk Excel / CSV (Export & Import) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-black text-sm text-neutral-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Menu Dishes Bulk Rates (Excel / CSV)</span>
              </h4>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                Export all food dish rates to a CSV / Excel spreadsheet, edit prices in bulk offline, and import back into the system with 1 click.
              </p>

              {bulkRatesMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  bulkRatesMessage.success
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border border-rose-300 text-rose-900'
                }`}>
                  {bulkRatesMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{bulkRatesMessage.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={() => exportFoodItemsToCSV(dishes, categories, subCategories)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>1. Export Dishes CSV</span>
                </button>

                {/* Import Button */}
                <label className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-xs transition-colors">
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>2. Import Excel / CSV File</span>
                  <input
                    type="file"
                    accept=".csv, .txt, .xlsx"
                    onChange={handleImportExcelFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* JSON Full Database Backup & Restore */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-black text-sm text-neutral-900 flex items-center space-x-2">
                <Database className="w-4 h-4 text-amber-700" />
                <span>Full System Database (JSON)</span>
              </h4>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                Complete database backup including all categories, dishes, raw materials, stock, recipes, and settled bills.
              </p>

              {jsonRestoreMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  jsonRestoreMessage.success
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border border-rose-300 text-rose-900'
                }`}>
                  {jsonRestoreMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{jsonRestoreMessage.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Export JSON */}
                <button
                  type="button"
                  onClick={async () => {
                    const backup = await db.exportBackup();
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `karuna_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON Backup</span>
                </button>

                {/* Import JSON */}
                <label className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-xs transition-colors">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import JSON Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJsonBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW DISH (With Base Per-Kg Rate & Multi-Price - Requirement 8) */}
      {/* ========================================================================= */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-black text-neutral-900 text-base">
                + + Add New Dish to Menu
              </h3>
              <button
                onClick={() => setShowAddDishModal(false)}
                className="text-stone-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">
                    Dish Name (English) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kaju Katli"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    पदार्थाचे नाव (मराठी)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. काजू कतली"
                    value={newDishMarathiName}
                    onChange={(e) => setNewDishMarathiName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Code #
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 201"
                    value={newDishSrNo}
                    onChange={(e) => setNewDishSrNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Division
                  </label>
                  <select
                    value={newDishCatId}
                    onChange={(e) => setNewDishCatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    {categories.map((c) => (
                      <option key={`opt-cat-${c.id}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Sub-Category
                  </label>
                  <select
                    value={newDishSubCatId}
                    onChange={(e) => setNewDishSubCatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    {subCategories.map((s) => (
                      <option key={`opt-sub-${s.id}`} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Counter Assignment
                  </label>
                  <select
                    value={newDishCounter}
                    onChange={(e) => setNewDishCounter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="Breakfast">Breakfast & Snacks</option>
                    <option value="Sweets">Sweets & Farsan</option>
                    <option value="Parcel">Parcel & Takeaway</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Initial Stock (Kg)
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    value={newDishStockQty}
                    onChange={(e) => setNewDishStockQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Multi-Price Checkbox (Requirement 8) */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDishHasMultiplePrices}
                    onChange={(e) => setNewDishHasMultiplePrices(e.target.checked)}
                    className="w-4 h-4 text-neutral-900 rounded"
                  />
                  <span className="font-black text-neutral-900">
                    Multiple Prices of One Item (By Weight / Portions in Kg)
                  </span>
                </label>

                {newDishHasMultiplePrices ? (
                  <div className="space-y-3 pt-1">
                    {/* Base Per-Kg Rate Input (Requirement 8) */}
                    <div>
                      <label className="text-[10px] font-black text-amber-900 uppercase block mb-1">
                        Base Rate Per Kilo (₹/Kg) *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 900"
                        value={newDishPricePerKg}
                        onChange={(e) => handleBasePricePerKgChange(e.target.value, false)}
                        className="w-full bg-white border border-amber-400 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-stone-500 uppercase block">
                          Portion Rates & Weight Options
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewDishVariants([...newDishVariants, { unit: '100g', price: 0 }]);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] px-2 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Portion</span>
                        </button>
                      </div>
                      {newDishVariants.map((v, vIdx) => (
                        <div key={`new-v-${vIdx}`} className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Unit (e.g. 250g)"
                            value={v.unit || ''}
                            onChange={(e) => {
                              const updated = [...newDishVariants];
                              updated[vIdx].unit = e.target.value;
                              setNewDishVariants(updated);
                            }}
                            className="w-24 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-neutral-900 outline-none focus:ring-2 focus:ring-amber-600"
                          />
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...newDishVariants];
                              updated[vIdx].price = e.target.value;
                              setNewDishVariants(updated);
                            }}
                            className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newDishVariants.filter((_, idx) => idx !== vIdx);
                              setNewDishVariants(updated);
                            }}
                            className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete portion rate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">
                      Standard Item Price (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newDishPrice}
                      onChange={(e) => setNewDishPrice(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowAddDishModal(false)}
                className="flex-1 bg-stone-100 text-stone-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewDish}
                disabled={!newDishName}
                className="flex-1 bg-neutral-900 hover:bg-black text-white font-black text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40"
              >
                Save Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DISH                                                          */}
      {/* ========================================================================= */}
      {editingDish && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-black text-neutral-900 text-base">
                Edit Dish: {editingDish.name}
              </h3>
              <button onClick={() => setEditingDish(null)} className="text-stone-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">
                    Dish Name (English)
                  </label>
                  <input
                    type="text"
                    value={editingDish.name || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    पदार्थाचे नाव (मराठी)
                  </label>
                  <input
                    type="text"
                    value={editingDish.marathiName || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, marathiName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Standard Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editingDish.price || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Base Rate Per Kilo (₹/Kg)
                  </label>
                  <input
                    type="number"
                    value={editingDish.pricePerKg || ''}
                    onChange={(e) => handleBasePricePerKgChange(e.target.value, true)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                    Stock (Kg)
                  </label>
                  <input
                    type="number"
                    value={editingDish.stockQty !== undefined ? editingDish.stockQty : ''}
                    onChange={(e) => setEditingDish({ ...editingDish, stockQty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Edit Variants / Portion Rates */}
              {editingDish.hasMultiplePrices && (
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-stone-500 uppercase block">
                      Portion Rates & Weight Options
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVars = editingDish.variants || [];
                        setEditingDish({
                          ...editingDish,
                          hasMultiplePrices: true,
                          variants: [...currentVars, { unit: '100g', price: 0 }]
                        });
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Portion</span>
                    </button>
                  </div>

                  {editingDish.variants?.map((v, vIdx) => (
                    <div key={`edit-v-${vIdx}`} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Unit (e.g. 250g)"
                        value={v.unit || ''}
                        onChange={(e) => {
                          const updated = [...editingDish.variants];
                          updated[vIdx].unit = e.target.value;
                          setEditingDish({ ...editingDish, variants: updated });
                        }}
                        className="w-24 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-neutral-900 outline-none focus:ring-2 focus:ring-amber-600"
                      />
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={v.price !== undefined ? v.price : ''}
                        onChange={(e) => {
                          const updated = [...editingDish.variants];
                          updated[vIdx].price = parseFloat(e.target.value) || 0;
                          setEditingDish({ ...editingDish, variants: updated });
                        }}
                        className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingDish.variants.filter((_, idx) => idx !== vIdx);
                          setEditingDish({ ...editingDish, variants: updated });
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Delete portion rate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setEditingDish(null)}
                className="flex-1 bg-stone-100 text-stone-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDishEdits}
                className="flex-1 bg-neutral-900 hover:bg-black text-white font-black text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SUB-CATEGORY                                            */}
      {/* ========================================================================= */}
      {showAddSubCatModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-black text-neutral-900 text-sm">
                {editingSubCat ? 'Edit Sub-Category' : '+ + Add Sub-Category'}
              </h3>
              <button onClick={() => setShowAddSubCatModal(false)} className="text-stone-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. South Indian Specials"
                  value={newSubCatName}
                  onChange={(e) => setNewSubCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              {!editingSubCat && (
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase block mb-1">
                    Parent Division
                  </label>
                  <select
                    value={newSubCatParentId}
                    onChange={(e) => setNewSubCatParentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    {categories.map((c) => (
                      <option key={`opt-pcat-${c.id}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowAddSubCatModal(false)}
                className="flex-1 bg-stone-100 text-stone-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubCategory}
                disabled={!newSubCatName}
                className="flex-1 bg-neutral-900 hover:bg-black text-white font-black text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (No browser popups!) */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-lg text-neutral-900">{confirmDialog.title}</h3>
                <p className="text-xs font-bold text-stone-500">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="py-3 bg-stone-100 hover:bg-stone-200 text-neutral-800 font-black rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmDialog.onConfirm) {
                    await confirmDialog.onConfirm();
                  }
                  setConfirmDialog(null);
                }}
                className={`py-3 ${confirmDialog.confirmColor || 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'} text-white font-black rounded-xl text-xs transition shadow-lg cursor-pointer`}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
