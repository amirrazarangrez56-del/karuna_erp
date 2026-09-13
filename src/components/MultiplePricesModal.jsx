import React from 'react';
import { X, Layers, Check } from 'lucide-react';

export default function MultiplePricesModal({
  isOpen,
  dish,
  onClose,
  onSelectVariant
}) {
  if (!isOpen || !dish) return null;

  const variants = dish.variants || [];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-100">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {dish.name}
              </h3>
              <p className="text-[11px] font-bold text-slate-500">
                Select Option / Unit & Price
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants Grid */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variants.map((v, vIdx) => (
              <button
                key={`variant-opt-${v.unit}-${v.price}-${vIdx}`}
                onClick={() => {
                  onSelectVariant(dish, v);
                  onClose();
                }}
                className="bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-900 border-2 border-slate-200 hover:border-blue-600 p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between h-24 text-left shadow-xs hover:shadow-md group active:scale-95"
              >
                <div className="font-black text-sm group-hover:text-white">
                  {v.unit}
                </div>
                <div className="flex items-baseline justify-between w-full pt-2 border-t border-slate-200 group-hover:border-blue-400">
                  <span className="text-lg font-black text-blue-600 group-hover:text-white">
                    ₹{v.price}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-blue-100">
                    + Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
