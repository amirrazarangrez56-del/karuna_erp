import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function CreateNewTableModal({
  isOpen,
  onClose,
  sections,
  tables,
  onCreateTableAndOpenMenu
}) {
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [boxSerialNumber, setBoxSerialNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper to calculate prefix for a section
  const getPrefixForSection = (secId) => {
    const secObj = sections.find(
      s => s.id === secId || s.id === parseInt(secId) || s.id?.toString() === secId?.toString()
    );
    const secName = (secObj?.name || '').toLowerCase();
    if (secName.includes('dine') || secName.includes('dining')) return 'D';
    if (secName.includes('first') || secName.includes('floor')) return 'F';
    if (secName.includes('ac')) return 'AC';
    if (secName.includes('parcel') || secName.includes('takeaway')) return 'P';
    return 'D'; // Default strictly to D
  };

  // When opened, auto-suggest next box serial number
  useEffect(() => {
    if (isOpen && sections && sections.length > 0) {
      const activeSecId = sections[0].id;
      setSelectedSectionId(activeSecId);

      const prefix = getPrefixForSection(activeSecId);
      const tablesInSection = tables.filter(
        t => (t.sectionId === activeSecId || t.sectionId?.toString() === activeSecId?.toString()) && !t.isSplit
      );
      
      let nextNum = tablesInSection.length + 1;
      let candidate = `${prefix}${nextNum}`;
      while (tables.some(t => (t.name || '').toLowerCase().trim() === candidate.toLowerCase().trim())) {
        nextNum += 1;
        candidate = `${prefix}${nextNum}`;
      }

      setBoxSerialNumber(candidate);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSectionSelect = (secId) => {
    setSelectedSectionId(secId);
    
    const prefix = getPrefixForSection(secId);
    const tablesInSection = tables.filter(
      t => (t.sectionId === secId || t.sectionId?.toString() === secId?.toString()) && !t.isSplit
    );
    
    let nextNum = tablesInSection.length + 1;
    let candidate = `${prefix}${nextNum}`;
    while (tables.some(t => (t.name || '').toLowerCase().trim() === candidate.toLowerCase().trim())) {
      nextNum += 1;
      candidate = `${prefix}${nextNum}`;
    }

    setBoxSerialNumber(candidate);
    setErrorMessage('');
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = boxSerialNumber.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a Box Serial Number');
      return;
    }

    if (tables.some(t => (t.name || '').toLowerCase().trim() === trimmed.toLowerCase().trim())) {
      setErrorMessage(`A table named "${trimmed}" already exists. Please choose a different number.`);
      return;
    }

    onCreateTableAndOpenMenu({
      name: trimmed,
      sectionId: selectedSectionId || sections[0]?.id || 1,
      status: 'empty',
      currentCart: [],
      currentTokenNo: '',
      createdAt: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-neutral-900 tracking-tight">
            Create New Table / Box
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          
          {/* 1. Select Section */}
          <div>
            <label className="block text-xs font-black text-neutral-900 uppercase tracking-wider mb-3">
              1. Select Section
            </label>
            <div className="grid grid-cols-2 gap-3">
              {sections.map((sec, secIdx) => {
                const isSelected = selectedSectionId === sec.id || selectedSectionId?.toString() === sec.id?.toString();
                return (
                  <button
                    key={`modal-sec-${sec.id || sec.name}-${secIdx}`}
                    type="button"
                    onClick={() => handleSectionSelect(sec.id)}
                    className={`py-3.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {sec.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Box Serial Number */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              2. Box Serial Number
            </label>
            <input
              type="text"
              autoFocus
              value={boxSerialNumber}
              onChange={(e) => {
                setBoxSerialNumber(e.target.value);
                setErrorMessage('');
              }}
              placeholder="e.g. D8, F4, AC3, P2"
              className="w-full text-center text-xl font-black tracking-wider text-slate-900 bg-white border border-slate-300 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
            />
            {errorMessage && (
              <p className="text-xs font-bold text-rose-600 mt-2 text-center">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-300 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-black text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>✓ Create & Open Menu</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
