import React from 'react';
import { Layers, Candy, Coffee, UtensilsCrossed, Wine, Flame } from 'lucide-react';

export default function Sidebar({ categories, selectedCategory, setSelectedCategory }) {
  // Category Icons map
  const getCategoryIcon = (name) => {
    const lname = (name || '').toLowerCase();
    if (lname.includes('sweet')) return Candy;
    if (lname.includes('breakfast')) return Coffee;
    if (lname.includes('south')) return UtensilsCrossed;
    if (lname.includes('beverage') || lname.includes('drink')) return Wine;
    return Flame;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0">
      <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-2">
        <Layers className="w-4 h-4" />
        <span>Menu Categories</span>
      </div>

      <div className="space-y-1 overflow-y-auto">
        {/* All Items Button */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Layers className="w-4 h-4" />
            <span>All Categories</span>
          </div>
        </button>

        {/* Category List (including Sweets and Breakfast) */}
        {categories.map((cat, catIdx) => {
          const Icon = getCategoryIcon(cat.name);
          const isSelected = selectedCategory === cat.id;

          // Color accents based on category type
          let activeBg = 'bg-indigo-600 text-white shadow-xs';
          if ((cat.name || '').toLowerCase().includes('sweet')) {
            activeBg = 'bg-pink-600 text-white shadow-xs shadow-pink-200';
          } else if ((cat.name || '').toLowerCase().includes('breakfast')) {
            activeBg = 'bg-amber-600 text-white shadow-xs shadow-amber-200';
          }

          return (
            <button
              key={`side-cat-${cat.id || cat.name}-${catIdx}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                isSelected ? activeBg : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </div>
              {(cat.name || '').toLowerCase().includes('sweet') && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-700 ml-1">
                  By Kg
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
