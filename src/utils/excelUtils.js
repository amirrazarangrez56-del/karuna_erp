// Excel & CSV export and import helpers with price column validation for Karuna Hotel ERP

export function exportFoodItemsToCSV(dishes = [], categories = [], subCategories = []) {
  const categoryMap = {};
  (categories || []).forEach(c => { categoryMap[c.id] = c.name; });
  const subCategoryMap = {};
  (subCategories || []).forEach(s => { subCategoryMap[s.id] = s.name; });

  const headers = ['Sr. No.', 'Dish Name', 'Marathi Name', 'Category', 'Sub Category', 'Price (₹)', 'Base Rate Per Kg (₹)', 'Counter'];
  const rows = (dishes || []).map(dish => [
    dish.srNo || dish.id || '',
    `"${(dish.name || '').replace(/"/g, '""')}"`,
    `"${(dish.marathiName || '').replace(/"/g, '""')}"`,
    `"${(categoryMap[dish.categoryId] || '').replace(/"/g, '""')}"`,
    `"${(subCategoryMap[dish.subCategoryId] || '').replace(/"/g, '""')}"`,
    dish.price || 0,
    dish.pricePerKg || dish.sweetPricePerKg || '',
    `"${(dish.counter || 'Breakfast').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Karuna_POS_Menu_Rates_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSVAndValidateRates(fileContent) {
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return { success: false, error: 'File is empty!' };
  }

  // Parse header line
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  
  const priceColIndex = headers.findIndex(h => h === 'price (₹)' || h.includes('price') || h.includes('rate'));
  if (priceColIndex === -1) {
    return {
      success: false,
      missingPriceAlert: true,
      error: 'CRITICAL ALERT: Missing "Price" column in the imported CSV file! Price update aborted to prevent corruption.'
    };
  }

  const nameColIndex = headers.findIndex(h => h.includes('dish name') || h.includes('name'));
  const marathiColIndex = headers.findIndex(h => h.includes('marathi'));
  const srNoColIndex = headers.findIndex(h => h.includes('sr') || h.includes('code') || h.includes('no'));
  const pricePerKgColIndex = headers.findIndex(h => h.includes('per kg') || h.includes('kilo') || h.includes('sweet'));

  const parsedItems = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const cols = [];
    let inQuote = false;
    let curr = '';
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      if (char === '"' && row[c + 1] === '"') {
        curr += '"';
        c++;
      } else if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        cols.push(curr.trim());
        curr = '';
      } else {
        curr += char;
      }
    }
    cols.push(curr.trim());

    if (cols.length < 2) continue;

    const name = nameColIndex !== -1 ? cols[nameColIndex]?.replace(/^"|"$/g, '').trim() : '';
    const marathiName = marathiColIndex !== -1 ? cols[marathiColIndex]?.replace(/^"|"$/g, '').trim() : '';
    const priceStr = cols[priceColIndex]?.replace(/^"|"$/g, '').trim();
    const price = parseFloat(priceStr);

    if (isNaN(price)) {
      return {
        success: false,
        missingPriceAlert: true,
        error: `Row ${i + 1} ("${name || 'Unnamed'}") has an invalid or missing price value ("${priceStr}")! Rate update aborted.`
      };
    }

    const pricePerKgStr = pricePerKgColIndex !== -1 ? cols[pricePerKgColIndex]?.replace(/^"|"$/g, '').trim() : '';
    const pricePerKg = pricePerKgStr ? parseFloat(pricePerKgStr) : undefined;

    parsedItems.push({
      srNo: srNoColIndex !== -1 ? parseInt(cols[srNoColIndex]?.replace(/^"|"$/g, '')) || undefined : undefined,
      name,
      marathiName,
      price,
      pricePerKg: !isNaN(pricePerKg) ? pricePerKg : undefined
    });
  }

  return { success: true, items: parsedItems };
}
