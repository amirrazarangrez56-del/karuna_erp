import React, { useState } from 'react';
import {
  Package,
  Utensils,
  Plus,
  AlertTriangle,
  FileText,
  Trash2,
  CheckCircle,
  Sparkles,
  Layers,
  Search,
  Scale,
  ArrowUpRight,
  RefreshCw,
  Link,
  X,
  ChefHat
} from 'lucide-react';
import { generateLowStockPDFReport } from '../utils/pdfUtils';
import { db } from '../db/db';

export default function StockManagement({
  rawMaterials,
  dishes,
  categories,
  recipes,
  onAddRawMaterial,
  onUpdateRawMaterial,
  onDeleteRawMaterial,
  onSaveRecipeMapping
}) {
  // 2 Clean Sub-Tabs: 'raw' (Raw Materials Stock) | 'dishes' (Finished Dishes Stock)
  const [activeStockSubTab, setActiveStockSubTab] = useState('raw');
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  // New Raw Material Form State (Requirement 10: Strictly Kg)
  const [newRmName, setNewRmName] = useState('');
  const [newRmQty, setNewRmQty] = useState('');
  const [newRmThreshold, setNewRmThreshold] = useState('5');

  // Increase Qty Modal on existing Raw Material (Requirement 6)
  const [increasingRm, setIncreasingRm] = useState(null);
  const [increaseAmount, setIncreaseAmount] = useState('');

  // Dish Stock Production State (Requirement 9)
  const [producingDish, setProducingDish] = useState(null);
  const [producedKgAmount, setProducedKgAmount] = useState('');

  // Integrate Raw Material with Dish Modal State (Requirement 3)
  const [integratingRm, setIntegratingRm] = useState(null);
  const [integrateDishId, setIntegrateDishId] = useState(dishes[0]?.id || '');
  const [integrateRequiredKg, setIntegrateRequiredKg] = useState('');
  const [dishSearchFilter, setDishSearchFilter] = useState('');

  // Low Stock Items Detection
  const lowStockItems = rawMaterials.filter(
    (rm) => rm.quantity <= (rm.minThreshold || 5)
  );

  // Handle Add New Raw Material (Strictly Kg)
  const handleCreateRawMaterial = () => {
    if (!newRmName || !newRmQty) return;
    
    // Check if raw material already exists
    const existing = rawMaterials.find(
      (r) => r.name.toLowerCase().trim() === newRmName.toLowerCase().trim()
    );

    if (existing) {
      // If already added, increase its quantity (Requirement 6)
      const additional = parseFloat(newRmQty) || 0;
      onUpdateRawMaterial(existing.id, {
        quantity: Math.round(((existing.quantity || 0) + additional) * 100) / 100,
        minThreshold: parseFloat(newRmThreshold) || existing.minThreshold || 5,
        unit: 'Kg'
      });
    } else {
      onAddRawMaterial({
        name: newRmName.trim(),
        quantity: parseFloat(newRmQty),
        minThreshold: parseFloat(newRmThreshold) || 5,
        unit: 'Kg'
      });
    }

    setNewRmName('');
    setNewRmQty('');
  };

  // Handle Increase Stock on Existing Item (Requirement 6)
  const handleConfirmIncreaseStock = () => {
    if (!increasingRm || !increaseAmount) return;
    const addKg = parseFloat(increaseAmount);
    if (isNaN(addKg) || addKg <= 0) return;

    const newTotal = Math.round(((increasingRm.quantity || 0) + addKg) * 100) / 100;
    onUpdateRawMaterial(increasingRm.id, {
      quantity: newTotal,
      unit: 'Kg'
    });

    setIncreasingRm(null);
    setIncreaseAmount('');
  };

  // Handle Save Integration of Raw Material with Dish (Requirement 2 & 3)
  const handleSaveIntegration = async () => {
    if (!integratingRm || !integrateDishId || !integrateRequiredKg) return;
    const reqKg = parseFloat(integrateRequiredKg);
    if (isNaN(reqKg) || reqKg <= 0) return;

    const targetDish = dishes.find((d) => d.id === parseInt(integrateDishId));
    if (!targetDish) return;

    // Check if this dish had any previous integrations
    const priorRecipesForDish = recipes.filter((r) => r.dishId === targetDish.id);
    const hadPriorIntegration = priorRecipesForDish.length > 0;

    // 1. Save / Update Recipe Mapping
    await onSaveRecipeMapping({
      dishId: targetDish.id,
      rawMaterialId: integratingRm.id,
      qtyRequired: reqKg
    });

    // 2. Subtract the entered raw material kg from raw material stock
    const currentRmQty = parseFloat(integratingRm.quantity) || 0;
    const updatedRmQty = Math.max(0, Math.round((currentRmQty - reqKg) * 100) / 100);
    await onUpdateRawMaterial(integratingRm.id, {
      quantity: updatedRmQty
    });

    // 3. Update the integrated dish's finished stock quantity:
    // If it is newly integrated for the first time, initialize its stock with reqKg.
    // If it was already integrated, add reqKg to its existing stock.
    const currentDishStock = (targetDish.stockQty !== undefined && hadPriorIntegration)
      ? (parseFloat(targetDish.stockQty) || 0)
      : 0;
    const newDishStock = Math.round((currentDishStock + reqKg) * 100) / 100;

    await db.dishes.update(targetDish.id, {
      stockQty: newDishStock,
      status: newDishStock > 0 ? 'In Stock' : 'Out of Stock'
    });
    targetDish.stockQty = newDishStock;

    setIntegratingRm(null);
    setIntegrateRequiredKg('');
  };

  // Handle Delete Recipe Ingredient Link
  const handleDeleteRecipeIngredient = async (recipeId, dishId) => {
    await db.recipes.delete(recipeId);
    const remainingRecipes = recipes.filter((r) => r.dishId === dishId && r.id !== recipeId);
    if (remainingRecipes.length === 0) {
      await db.dishes.update(dishId, { stockQty: 0 });
    }
  };

  // Handle Dish Produced Stock Addition (Requirement 9)
  const handleConfirmProduceDish = async () => {
    if (!producingDish || !producedKgAmount) return;
    const addKg = parseFloat(producedKgAmount);
    if (isNaN(addKg) || addKg <= 0) return;

    // 1. Update dish stock
    const currentStock = (producingDish.stockQty !== undefined && producingDish.stockQty !== 20) ? parseFloat(producingDish.stockQty) : 0;
    const newStock = Math.round((currentStock + addKg) * 100) / 100;
    await db.dishes.update(producingDish.id, {
      stockQty: newStock,
      status: 'In Stock'
    });
    producingDish.stockQty = newStock;

    // 2. Automatically deduct required raw materials for this production
    const dishRecipes = recipes.filter((r) => r.dishId === producingDish.id);
    for (const rec of dishRecipes) {
      const rm = rawMaterials.find((item) => item.id === rec.rawMaterialId);
      if (rm) {
        const rawUsed = rec.qtyRequired * addKg;
        const newRmQty = Math.max(0, Math.round(((parseFloat(rm.quantity) || 0) - rawUsed) * 100) / 100);
        await onUpdateRawMaterial(rm.id, { quantity: newRmQty });
      }
    }

    setProducingDish(null);
    setProducedKgAmount('');
  };

  const handlePrintLowStockPDF = () => {
    generateLowStockPDFReport(lowStockItems);
  };

  // Filter Dishes that HAVE BEEN INTEGRATED with Raw Materials (Requirement 3)
  const integratedDishes = dishes.filter((dish) =>
    recipes.some((r) => r.dishId === dish.id)
  );

  const filteredDishesForIntegration = dishes.filter((d) =>
    (d.name || '').toLowerCase().includes(dishSearchFilter.toLowerCase()) ||
    (d.marathiName || '').toLowerCase().includes(dishSearchFilter.toLowerCase()) ||
    d.srNo?.toString().includes(dishSearchFilter)
  );

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-100 overflow-y-auto select-none min-h-0">
      
      {/* Header & 2 Sub-Tabs Switcher (Requirement 3: Removed Separate Recipe Tab) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-slate-900" />
            <span>Stock & Raw Materials ERP</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Single standard unit (Kg) • Live inventory deduction on POS sales • Quick raw material dish integration
          </p>
        </div>

        {/* 2 Sub-Tabs Switcher */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs mr-12">
          <button
            onClick={() => setActiveStockSubTab('raw')}
            className={`px-4 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStockSubTab === 'raw'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Raw Materials Stock ({rawMaterials.length})</span>
          </button>

          <button
            onClick={() => setActiveStockSubTab('dishes')}
            className={`px-4 py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStockSubTab === 'dishes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Finished Dishes Stock ({integratedDishes.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: RAW MATERIALS STOCK (With Integrate with Dish Button - Req 3)   */}
      {/* ========================================================================= */}
      {activeStockSubTab === 'raw' && (
        <div className="space-y-6">
          
          {/* Add / Increase Raw Material Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add Raw Material Stock (Single Unit: Kg)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Raw Material Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sugar, Milk, Mawa, Kaju, Besan"
                  value={newRmName}
                  onChange={(e) => setNewRmName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Quantity (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 50"
                  value={newRmQty}
                  onChange={(e) => setNewRmQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Low Stock Alert (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={newRmThreshold}
                  onChange={(e) => setNewRmThreshold(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateRawMaterial}
                  disabled={!newRmName || !newRmQty}
                  className="w-full bg-neutral-900 hover:bg-black text-white font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-40"
                >
                  + Add / Increase Stock
                </button>
              </div>
            </div>
          </div>

          {/* Raw Materials Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rawMaterials.map((rm, rmIdx) => {
              const isLow = rm.quantity <= (rm.minThreshold || 5);
              
              // Get all dishes linked to this raw material (grouped by dish)
              const matchedRecipes = recipes.filter((r) => r.rawMaterialId === rm.id);
              const dishMap = {};
              matchedRecipes.forEach((r) => {
                const d = dishes.find((dish) => dish.id === r.dishId);
                if (d) {
                  dishMap[d.id] = {
                    name: d.name,
                    qty: Math.round(((dishMap[d.id]?.qty || 0) + (parseFloat(r.qtyRequired) || 0)) * 100) / 100
                  };
                }
              });
              const linkedDishNames = Object.values(dishMap).map((d) => `${d.name} (${d.qty} Kg)`);

              return (
                <div
                  key={`rm-card-${rm.id || rm.name}-${rmIdx}`}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-150 shadow-xs flex flex-col justify-between ${
                    isLow ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-black text-sm text-neutral-900">{rm.name}</h4>
                      {isLow ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          In Stock
                        </span>
                      )}
                    </div>

                    {/* Stock Metrics (Requirement 6) */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 my-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Remaining in Stock:</span>
                        <span className="font-black text-sm text-slate-900">{rm.quantity} Kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Alert Threshold:</span>
                        <span className="font-semibold text-slate-600">≤ {rm.minThreshold || 5} Kg</span>
                      </div>
                    </div>

                    {/* Integrated Dishes List */}
                    <div className="my-2 text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        Integrated Dishes ({linkedDishNames.length}):
                      </span>
                      {linkedDishNames.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">Not linked to any dish yet</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {linkedDishNames.map((name, nIdx) => (
                            <span
                              key={`rm-link-${rm.id}-${nIdx}`}
                              className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: + Add Stock & 🔗 Integrate with Dish (Requirement 3) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setIncreasingRm(rm);
                          setIncreaseAmount('');
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs py-1.5 rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                        <span>+ Add Stock</span>
                      </button>

                      {/* 🔗 Integrate with Dish Button on Card (Requirement 3) */}
                      <button
                        onClick={() => {
                          setIntegratingRm(rm);
                          setIntegrateDishId(dishes[0]?.id || '');
                          setIntegrateRequiredKg('');
                          setDishSearchFilter('');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-1.5 rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-1 shadow-xs"
                        title="Integrate this raw material with a menu dish"
                      >
                        <Link className="w-3.5 h-3.5 text-white" />
                        <span>🔗 Integrate</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            title: 'Delete Raw Material?',
                            message: `Are you sure you want to delete raw material "${rm.name}"?`,
                            confirmText: 'Yes, Delete Material',
                            onConfirm: async () => {
                              if (typeof onDeleteRawMaterial === 'function') {
                                await onDeleteRawMaterial(rm.id);
                              } else {
                                await db.rawMaterials.delete(rm.id);
                              }
                            }
                          });
                        }}
                        className="text-[10px] font-bold text-stone-400 hover:text-rose-600 cursor-pointer"
                      >
                        Delete Item
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: FINISHED DISHES STOCK (ONLY INTEGRATED DISHES - Requirement 3) */}
      {/* ========================================================================= */}
      {activeStockSubTab === 'dishes' && (
        <div className="space-y-4">
          {integratedDishes.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3">
              <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="text-sm font-black text-neutral-800">
                No Dishes Integrated Yet
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Go to the <strong>Raw Materials Stock</strong> tab and click <strong>"🔗 Integrate"</strong> on any raw material card to link it with a menu dish.
              </p>
              <button
                onClick={() => setActiveStockSubTab('raw')}
                className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer mt-2"
              >
                Go to Raw Materials Tab
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {integratedDishes.map((dish, dIdx) => {
                const currentStockKg = dish.stockQty !== undefined ? dish.stockQty : 0;
                const isOut = currentStockKg <= 0;
                const isLow = currentStockKg <= 5 && !isOut;

                // Linked ingredients for this dish (grouped by raw material)
                const dishRecipes = recipes.filter((r) => r.dishId === dish.id);
                const dishIngredients = [];
                dishRecipes.forEach((r) => {
                  const rm = rawMaterials.find((item) => item.id === r.rawMaterialId);
                  const existing = dishIngredients.find((ing) => ing.rawMaterialId === r.rawMaterialId);
                  if (existing) {
                    existing.qtyRequired = Math.round(((parseFloat(existing.qtyRequired) || 0) + (parseFloat(r.qtyRequired) || 0)) * 100) / 100;
                  } else {
                    dishIngredients.push({
                      recipeId: r.id,
                      rawMaterialId: r.rawMaterialId,
                      name: rm?.name || 'Unknown',
                      qtyRequired: parseFloat(r.qtyRequired) || 0
                    });
                  }
                });

                return (
                  <div
                    key={`dish-stock-${dish.id || dish.name}-${dIdx}`}
                    className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-stone-400">#{dish.srNo || dish.id}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isOut ? 'bg-rose-100 text-rose-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      <h4 className="font-black text-sm text-neutral-900">{dish.name}</h4>
                      {dish.marathiName && (
                        <p className="text-xs text-stone-500 font-semibold">{dish.marathiName}</p>
                      )}

                      {/* Stock Details */}
                      <div className="bg-slate-50 rounded-xl p-2.5 mt-2.5 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Available Stock:</span>
                          <span className="text-base font-black text-slate-900">{currentStockKg} Kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Rate:</span>
                          <span className="font-extrabold text-blue-700">
                            ₹{dish.pricePerKg ? `${dish.pricePerKg}/Kg` : `${dish.price} / item`}
                          </span>
                        </div>
                      </div>

                      {/* Integrated Ingredients List with Unlink Button */}
                      <div className="mt-3 text-xs space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Integrated Recipe Ingredients:
                        </span>
                        <div className="space-y-1">
                          {dishIngredients.map((ing, iIdx) => (
                            <div
                              key={`ing-row-${dish.id}-${iIdx}`}
                              className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs"
                            >
                              <span className="font-bold text-slate-800">
                                {ing.name}: <span className="text-blue-700 font-black">{ing.qtyRequired} Kg</span>
                              </span>
                              <button
                                onClick={() => handleDeleteRecipeIngredient(ing.recipeId, dish.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Unlink ingredient"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* + Add Produced Stock Button */}
                    <button
                      onClick={() => {
                        setProducingDish(dish);
                        setProducedKgAmount('');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                      <span>+ Add Produced Stock (Kg)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTEGRATE RAW MATERIAL WITH DISH (Requirement 3)                   */}
      {/* ========================================================================= */}
      {integratingRm && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                <Link className="w-4 h-4 text-blue-600" />
                <span>Integrate: {integratingRm.name} with Menu Dish</span>
              </h3>
              <button
                onClick={() => setIntegratingRm(null)}
                className="text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3">
                <span className="text-[10px] font-black text-slate-500 uppercase block mb-0.5">
                  Raw Material Selected:
                </span>
                <span className="text-sm font-black text-slate-900">
                  {integratingRm.name} (In Stock: {integratingRm.quantity} Kg)
                </span>
              </div>

              {/* Select Dish */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Select Menu Dish to Integrate *
                </label>
                <input
                  type="text"
                  placeholder="Search dish name..."
                  value={dishSearchFilter}
                  onChange={(e) => setDishSearchFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold mb-1.5 outline-none"
                />
                <select
                  value={integrateDishId}
                  onChange={(e) => setIntegrateDishId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  {filteredDishesForIntegration.map((d) => (
                    <option key={`integ-dish-opt-${d.id}`} value={d.id}>
                      #{d.srNo || d.id} - {d.name} {d.marathiName ? `(${d.marathiName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Quantity in Kg */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Required Ingredient Quantity per Dish (Kg) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 0.25 (for 250g)"
                  value={integrateRequiredKg}
                  onChange={(e) => setIntegrateRequiredKg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  When this dish is sold at POS, this weight in Kg will be automatically deducted from {integratingRm.name} stock.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setIntegratingRm(null)}
                className="flex-1 bg-stone-100 text-stone-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIntegration}
                disabled={!integrateDishId || !integrateRequiredKg}
                className="flex-1 bg-neutral-900 hover:bg-black text-white font-black text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40"
              >
                Save Integration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INCREASE RAW MATERIAL QUANTITY                                     */}
      {/* ========================================================================= */}
      {increasingRm && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-black text-neutral-900 text-sm">
                + Add Stock: {increasingRm.name}
              </h3>
              <button onClick={() => setIncreasingRm(null)} className="text-stone-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Current Stock:</span>
                <span className="font-black text-slate-900 ml-2">{increasingRm.quantity} Kg</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Additional Quantity to Add (Kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  autoFocus
                  placeholder="e.g. 10"
                  value={increaseAmount}
                  onChange={(e) => setIncreaseAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIncreasingRm(null)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIncreaseStock}
                disabled={!increaseAmount}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PRODUCED DISH STOCK (Kg)                                       */}
      {/* ========================================================================= */}
      {producingDish && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-sm">
                + Add Kitchen Produced Stock: {producingDish.name}
              </h3>
              <button onClick={() => setProducingDish(null)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Current Dish Stock:</span>
                <span className="font-black text-slate-900 ml-2">{producingDish.stockQty || 0} Kg</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Fresh Quantity Cooked / Produced (Kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  autoFocus
                  placeholder="e.g. 15"
                  value={producedKgAmount}
                  onChange={(e) => setProducedKgAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setProducingDish(null)}
                className="flex-1 bg-stone-100 text-stone-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProduceDish}
                disabled={!producedKgAmount}
                className="flex-1 bg-neutral-900 hover:bg-black text-white font-black text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40"
              >
                Confirm Produce
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
