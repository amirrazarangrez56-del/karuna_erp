import React, { useState, useEffect } from 'react';
import { Candy, Plus, Scale, Sparkles } from 'lucide-react';

export default function SweetsWeightPanel({
  sweetDishes,
  selectedSweetDish,
  onSelectSweetDish,
  onAddToCart
}) {
  const [activeSweet, setActiveSweet] = useState(selectedSweetDish || sweetDishes[0] || null);
  const [customWeight, setCustomWeight] = useState('');

  // Sync active sweet when parent passes a newly selected sweet dish
  useEffect(() => {
    if (selectedSweetDish) {
      setActiveSweet(selectedSweetDish);
    } else if (!activeSweet && sweetDishes && sweetDishes.length > 0) {
      setActiveSweet(sweetDishes[0]);
    }
  }, [selectedSweetDish, sweetDishes]);

  if (!sweetDishes || sweetDishes.length === 0) return null;

  const currentSweet = activeSweet || selectedSweetDish || sweetDishes[0];
  const cleanName = (currentSweet.name || '').replace(/\s*\(by Kg\)/gi, '');
  const ratePerKg = currentSweet.sweetPricePerKg || currentSweet.price || 0;

  const quickPortions = [
    { label: '0.25 Kg (250g)', val: 0.25 },
    { label: '0.5 Kg (500g)', val: 0.5 },
    { label: '1 Kg', val: 1 },
    { label: '2 Kg', val: 2 }
  ];

  const handleQuickAdd = (weightVal) => {
    if (!currentSweet || weightVal <= 0) return;
    onAddToCart({
      id: currentSweet.id,
      srNo: currentSweet.srNo,
      name: cleanName,
      price: ratePerKg,
      weightKg: weightVal,
      unit: `${weightVal} Kg`,
      qty: weightVal,
      qtyDisplay: `${weightVal} Kg`,
      isSweet: true,
      isSweetWeight: true,
      categoryId: currentSweet.categoryId,
      subCategoryId: currentSweet.subCategoryId
    });
  };

  const handleCustomAdd = () => {
    const parsed = parseFloat(customWeight);
    if (!parsed || parsed <= 0) return;
    handleQuickAdd(parsed);
    setCustomWeight('');
  };

  return (
    <div className="bg-white border-t-2 border-blue-600 p-3 shadow-xl select-none sticky bottom-0 z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Active Sweet Dish Indicator / Dropdown */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Candy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-black text-blue-700 uppercase tracking-wider">
              Selected Sweet (Rate: ₹{ratePerKg}/Kg)
            </div>
            <select
              value={currentSweet.id}
              onChange={(e) => {
                const found = sweetDishes.find(s => s.id === parseInt(e.target.value));
                if (found) {
                  setActiveSweet(found);
                  if (onSelectSweetDish) onSelectSweetDish(found);
                }
              }}
              className="bg-slate-50 border border-slate-300 font-black text-slate-900 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs mt-0.5"
            >
              {sweetDishes.map((s, sIdx) => (
                <option key={`sweet-select-opt-${s.id || s.name}-${sIdx}`} value={s.id}>
                  {s.name.replace(/\s*\(by Kg\)/gi, '')} (₹{s.sweetPricePerKg || s.price}/Kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Direct Clickable Weight Buttons (Instantly adds to cart) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black text-stone-600 uppercase tracking-wider">
            Click Weight to Add:
          </span>

          <div className="flex items-center space-x-1.5">
            {quickPortions.map((portion, pIdx) => {
              const portionCost = Math.round(portion.val * ratePerKg);
              return (
                <button
                  key={`quick-portion-btn-${portion.val}-${pIdx}`}
                  onClick={() => handleQuickAdd(portion.val)}
                  className="bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white border border-stone-300 hover:border-neutral-900 font-black text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center space-x-1 hover:scale-105 active:scale-95"
                  title={`Add ${portion.label} of ${cleanName} for ₹${portionCost}`}
                >
                  <span>{portion.label}</span>
                  <span className="text-[10px] font-bold opacity-75">(₹{portionCost})</span>
                </button>
              );
            })}
          </div>

          {/* Custom Weight Input */}
          <div className="flex items-center space-x-1 bg-white border border-stone-300 rounded-xl px-2.5 py-1 shadow-2xs">
            <Scale className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 0.75"
              value={customWeight}
              onChange={(e) => setCustomWeight(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomAdd();
              }}
              className="w-16 text-xs font-black text-neutral-900 outline-none py-1"
            />
            <span className="text-xs text-stone-600 font-black">Kg</span>
            <button
              onClick={handleCustomAdd}
              disabled={!customWeight || parseFloat(customWeight) <= 0}
              className="bg-neutral-900 hover:bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer disabled:opacity-40"
            >
              + Add
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
