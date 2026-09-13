import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'karuna_pos_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Complete Default Seed Data for Karuna Hotel
export const DEFAULT_DATABASE_DATA = {
  categories: [
    { id: 1, name: 'Breakfast Division (नाश्ता)', isFixed: true, srNo: 1 },
    { id: 2, name: 'Sweets & Mithai Division (मिठाई)', isFixed: true, srNo: 2 }
  ],
  subCategories: [
    { id: 1, name: 'Breakfast & Snacks', parentCategoryId: 1, srNo: 1 },
    { id: 2, name: 'Single Items', parentCategoryId: 1, srNo: 2 },
    { id: 3, name: 'Dosa & Uttappa', parentCategoryId: 1, srNo: 3 },
    { id: 4, name: 'Pav Bhaji & Meals', parentCategoryId: 1, srNo: 4 },
    { id: 5, name: 'Indian Bread', parentCategoryId: 1, srNo: 5 },
    { id: 6, name: 'Tea, Coffee & Cold Drinks', parentCategoryId: 1, srNo: 6 },
    { id: 7, name: 'Extras & Sides', parentCategoryId: 1, srNo: 7 },
    { id: 8, name: 'Sweets & Mithai', parentCategoryId: 2, srNo: 1 },
    { id: 9, name: 'Ladoo, Pedha & Kunda', parentCategoryId: 2, srNo: 2 },
    { id: 10, name: 'Barfi Specials', parentCategoryId: 2, srNo: 3 },
    { id: 11, name: 'Farsan, Namkeen & Chivda', parentCategoryId: 2, srNo: 4 }
  ],
  sections: [
    { id: 1, name: 'Dine In Area', extraCharge: 0, color: 'blue' },
    { id: 2, name: 'First Floor', extraCharge: 0, color: 'emerald' },
    { id: 3, name: 'AC Hall', extraCharge: 0, color: 'purple' },
    { id: 4, name: 'Parcels', extraCharge: 0, color: 'amber' }
  ],
  dishes: [
    { id: 1, srNo: 101, name: 'Single Idli Vada', marathiName: 'सिंगल इडली वडा', categoryId: 1, subCategoryId: 1, price: 50, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 50, 2: 50, 3: 60, 4: 50 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: 'Chutney', qty: '1' }, { name: 'Sambar', qty: '1' }] },
    { id: 2, srNo: 102, name: 'Uppit', marathiName: 'उप्पीट', categoryId: 1, subCategoryId: 1, price: 50, stockQty: 25, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 50, 2: 50, 3: 60, 4: 50 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 3, srNo: 103, name: 'Pohe', marathiName: 'पोहे', categoryId: 1, subCategoryId: 1, price: 35, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 35, 2: 35, 3: 45, 4: 35 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: 'Sev & Lemon', qty: '1' }] },
    { id: 4, srNo: 104, name: 'Sheera', marathiName: 'शिरा', categoryId: 1, subCategoryId: 1, price: 45, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 45, 2: 45, 3: 55, 4: 45 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 5, srNo: 105, name: 'Puri Bhaji', marathiName: 'पुरी भाजी', categoryId: 1, subCategoryId: 1, price: 75, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 75, 2: 75, 3: 85, 4: 75 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: '4 Puris', qty: '1 portion' }, { name: 'Potato Bhaji', qty: '1 bowl' }] },
    { id: 6, srNo: 106, name: 'Idli', marathiName: 'इडली सांबार', categoryId: 1, subCategoryId: 1, price: 50, stockQty: 40, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 50, 2: 50, 3: 60, 4: 50 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: '2 Idlis', qty: '1 plate' }, { name: 'Sambar & Chutney', qty: '1' }] },
    { id: 7, srNo: 107, name: 'Vada Sambar', marathiName: 'वडा सांबार', categoryId: 1, subCategoryId: 1, price: 60, stockQty: 35, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 60, 2: 60, 3: 70, 4: 60 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: '2 Vadas', qty: '1 plate' }] },
    { id: 8, srNo: 108, name: 'Idli Vada', marathiName: 'इडली वडा मिक्स', categoryId: 1, subCategoryId: 1, price: 60, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 60, 2: 60, 3: 70, 4: 60 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: '1 Idli 1 Vada', qty: '1 plate' }] },
    { id: 9, srNo: 109, name: 'Shabu Vada', marathiName: 'शाबू वडा', categoryId: 1, subCategoryId: 1, price: 70, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 70, 2: 70, 3: 80, 4: 70 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 10, srNo: 110, name: 'Shabu Khichdi', marathiName: 'शाबू खिचडी', categoryId: 1, subCategoryId: 1, price: 60, stockQty: 25, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 60, 2: 60, 3: 70, 4: 60 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: 'Curd', qty: '1 bowl' }] },
    { id: 11, srNo: 111, name: 'Dahi Vada', marathiName: 'दही वडा', categoryId: 1, subCategoryId: 1, price: 70, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 70, 2: 70, 3: 80, 4: 70 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 12, srNo: 112, name: 'Batata Vada', marathiName: 'बटाटा वडा', categoryId: 1, subCategoryId: 1, price: 40, stockQty: 40, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 40, 2: 40, 3: 50, 4: 40 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 13, srNo: 113, name: 'Samosa', marathiName: 'समोसा', categoryId: 1, subCategoryId: 1, price: 40, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 40, 2: 40, 3: 50, 4: 40 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 14, srNo: 114, name: 'Kachori', marathiName: 'कचोरी', categoryId: 1, subCategoryId: 1, price: 40, stockQty: 25, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 40, 2: 40, 3: 50, 4: 40 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 15, srNo: 115, name: 'Dhokla', marathiName: 'ढोकळा', categoryId: 1, subCategoryId: 1, price: 45, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 45, 2: 45, 3: 55, 4: 45 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 16, srNo: 116, name: 'Bhaji (Pakoda)', marathiName: 'कांदा भजी', categoryId: 1, subCategoryId: 1, price: 50, stockQty: 25, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 50, 2: 50, 3: 60, 4: 50 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 17, srNo: 117, name: 'Pakoda', marathiName: 'पकोडा', categoryId: 1, subCategoryId: 1, price: 50, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 50, 2: 50, 3: 60, 4: 50 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 18, srNo: 118, name: 'Papdi', marathiName: 'पापडी', categoryId: 1, subCategoryId: 1, price: 35, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 35, 2: 35, 3: 45, 4: 35 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 19, srNo: 121, name: 'Plain Dosa', marathiName: 'प्लेन डोसा', categoryId: 1, subCategoryId: 3, price: 55, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 55, 2: 55, 3: 65, 4: 55 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: 'Chutney & Sambar', qty: '1' }] },
    { id: 20, srNo: 122, name: 'Masala Dosa', marathiName: 'मसाला डोसा', categoryId: 1, subCategoryId: 3, price: 70, stockQty: 35, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 70, 2: 70, 3: 80, 4: 70 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: 'Potato Masala, Chutney, Sambar', qty: '1' }] },
    { id: 21, srNo: 123, name: 'Mysore Masala Dosa', marathiName: 'म्हैसूर मसाला डोसा', categoryId: 1, subCategoryId: 3, price: 85, stockQty: 25, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 85, 2: 85, 3: 95, 4: 85 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 22, srNo: 124, name: 'Cheese Masala Dosa', marathiName: 'चीज मसाला डोसा', categoryId: 1, subCategoryId: 3, price: 95, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 95, 2: 95, 3: 105, 4: 95 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 23, srNo: 125, name: 'Onion Uttappa', marathiName: 'कांदा उत्तप्पा', categoryId: 1, subCategoryId: 3, price: 75, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 75, 2: 75, 3: 85, 4: 75 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 24, srNo: 126, name: 'Tomato Onion Uttappa', marathiName: 'टोमॅटो कांदा उत्तप्पा', categoryId: 1, subCategoryId: 3, price: 80, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 80, 2: 80, 3: 90, 4: 80 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 25, srNo: 131, name: 'Butter Pav Bhaji', marathiName: 'बटर पाव भाजी', categoryId: 1, subCategoryId: 4, price: 90, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 90, 2: 90, 3: 100, 4: 90 }, counter: 'Breakfast', status: 'In Stock', subItems: [{ name: '2 Pavs', qty: '1 pair' }, { name: 'Bhaji', qty: '1 bowl' }] },
    { id: 26, srNo: 132, name: 'Cheese Pav Bhaji', marathiName: 'चीज पाव भाजी', categoryId: 1, subCategoryId: 4, price: 110, stockQty: 25, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 110, 2: 110, 3: 125, 4: 110 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 27, srNo: 133, name: 'Extra Pav (Pair)', marathiName: 'एक्स्ट्रा पाव जोडी', categoryId: 1, subCategoryId: 4, price: 25, stockQty: 50, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 25, 2: 25, 3: 30, 4: 25 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 28, srNo: 134, name: 'Special Thali Meal', marathiName: 'स्पेशल थाळी जेवण', categoryId: 1, subCategoryId: 4, price: 140, stockQty: 20, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 140, 2: 140, 3: 160, 4: 140 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 29, srNo: 141, name: 'Special Tea', marathiName: 'स्पेशल चहा', categoryId: 1, subCategoryId: 6, price: 20, stockQty: 100, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 20, 2: 20, 3: 25, 4: 20 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 30, srNo: 142, name: 'Filter Coffee', marathiName: 'फिल्टर कॉफी', categoryId: 1, subCategoryId: 6, price: 30, stockQty: 50, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 30, 2: 30, 3: 35, 4: 30 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 31, srNo: 143, name: 'Cold Drink / Lassi', marathiName: 'लस्सी / कोल्ड ड्रिंक', categoryId: 1, subCategoryId: 6, price: 40, stockQty: 30, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 40, 2: 40, 3: 45, 4: 40 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },
    { id: 32, srNo: 144, name: 'Mineral Water (1L)', marathiName: 'मिनरल वॉटर (१L)', categoryId: 1, subCategoryId: 6, price: 20, stockQty: 50, hasMultiplePrices: false, variants: [], sectionPrices: { 1: 20, 2: 20, 3: 20, 4: 20 }, counter: 'Breakfast', status: 'In Stock', subItems: [] },

    // Sweets with Per-Kg Base Price & Multi-Price Portions (in Kg)
    {
      id: 33,
      srNo: 201,
      name: 'Gulab Jamun',
      marathiName: 'गुलाब जामुन',
      categoryId: 2,
      subCategoryId: 8,
      price: 80,
      pricePerKg: 320,
      stockQty: 20,
      hasMultiplePrices: true,
      variants: [
        { unit: '250g', weightKg: 0.25, price: 80 },
        { unit: '500g', weightKg: 0.5, price: 160 },
        { unit: '1 Kg', weightKg: 1, price: 320 }
      ],
      sectionPrices: {},
      counter: 'Sweets',
      status: 'In Stock',
      subItems: []
    },
    {
      id: 34,
      srNo: 202,
      name: 'Kaju Katli',
      marathiName: 'काजू कतली',
      categoryId: 2,
      subCategoryId: 8,
      price: 225,
      pricePerKg: 900,
      stockQty: 25,
      hasMultiplePrices: true,
      variants: [
        { unit: '250g', weightKg: 0.25, price: 225 },
        { unit: '500g', weightKg: 0.5, price: 450 },
        { unit: '1 Kg', weightKg: 1, price: 900 }
      ],
      sectionPrices: {},
      counter: 'Sweets',
      status: 'In Stock',
      subItems: []
    },
    {
      id: 35,
      srNo: 203,
      name: 'Rasgulla',
      marathiName: 'रसगुल्ला',
      categoryId: 2,
      subCategoryId: 8,
      price: 90,
      pricePerKg: 350,
      stockQty: 18,
      hasMultiplePrices: true,
      variants: [
        { unit: '250g', weightKg: 0.25, price: 90 },
        { unit: '500g', weightKg: 0.5, price: 175 },
        { unit: '1 Kg', weightKg: 1, price: 350 }
      ],
      sectionPrices: {},
      counter: 'Sweets',
      status: 'In Stock',
      subItems: []
    },
    {
      id: 36,
      srNo: 204,
      name: 'Motichoor Laddu',
      marathiName: 'मोतीचूर लाडू',
      categoryId: 2,
      subCategoryId: 9,
      price: 75,
      pricePerKg: 300,
      stockQty: 30,
      hasMultiplePrices: true,
      variants: [
        { unit: '250g', weightKg: 0.25, price: 75 },
        { unit: '500g', weightKg: 0.5, price: 150 },
        { unit: '1 Kg', weightKg: 1, price: 300 }
      ],
      sectionPrices: {},
      counter: 'Sweets',
      status: 'In Stock',
      subItems: []
    },
    {
      id: 37,
      srNo: 205,
      name: 'Special Peda',
      marathiName: 'स्पेशल पेढा',
      categoryId: 2,
      subCategoryId: 9,
      price: 105,
      pricePerKg: 420,
      stockQty: 22,
      hasMultiplePrices: true,
      variants: [
        { unit: '250g', weightKg: 0.25, price: 105 },
        { unit: '500g', weightKg: 0.5, price: 210 },
        { unit: '1 Kg', weightKg: 1, price: 420 }
      ],
      sectionPrices: {},
      counter: 'Sweets',
      status: 'In Stock',
      subItems: []
    }
  ],
  diningTables: [
    { id: 1, name: 'D1', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1001', isSplit: false, createdAt: null },
    { id: 2, name: 'D2', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1002', isSplit: false, createdAt: null },
    { id: 3, name: 'D3', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1003', isSplit: false, createdAt: null },
    { id: 4, name: 'D4', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1004', isSplit: false, createdAt: null },
    { id: 5, name: 'D5', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1005', isSplit: false, createdAt: null },
    { id: 6, name: 'D6', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1006', isSplit: false, createdAt: null },
    { id: 7, name: 'D7', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1007', isSplit: false, createdAt: null },
    { id: 8, name: 'D8', sectionId: 1, status: 'empty', currentCart: [], currentTokenNo: '1008', isSplit: false, createdAt: null },
    { id: 9, name: 'F1', sectionId: 2, status: 'empty', currentCart: [], currentTokenNo: '1009', isSplit: false, createdAt: null },
    { id: 10, name: 'F2', sectionId: 2, status: 'empty', currentCart: [], currentTokenNo: '1010', isSplit: false, createdAt: null },
    { id: 11, name: 'F3', sectionId: 2, status: 'empty', currentCart: [], currentTokenNo: '1011', isSplit: false, createdAt: null },
    { id: 12, name: 'F4', sectionId: 2, status: 'empty', currentCart: [], currentTokenNo: '1012', isSplit: false, createdAt: null },
    { id: 13, name: 'F5', sectionId: 2, status: 'empty', currentCart: [], currentTokenNo: '1013', isSplit: false, createdAt: null },
    { id: 14, name: 'F6', sectionId: 2, status: 'empty', currentCart: [], currentTokenNo: '1014', isSplit: false, createdAt: null },
    { id: 15, name: 'AC1', sectionId: 3, status: 'empty', currentCart: [], currentTokenNo: '1015', isSplit: false, createdAt: null },
    { id: 16, name: 'AC2', sectionId: 3, status: 'empty', currentCart: [], currentTokenNo: '1016', isSplit: false, createdAt: null },
    { id: 17, name: 'AC3', sectionId: 3, status: 'empty', currentCart: [], currentTokenNo: '1017', isSplit: false, createdAt: null },
    { id: 18, name: 'AC4', sectionId: 3, status: 'empty', currentCart: [], currentTokenNo: '1018', isSplit: false, createdAt: null },
    { id: 19, name: 'AC5', sectionId: 3, status: 'empty', currentCart: [], currentTokenNo: '1019', isSplit: false, createdAt: null },
    { id: 20, name: 'P1', sectionId: 4, status: 'empty', currentCart: [], currentTokenNo: '1020', isSplit: false, createdAt: null },
    { id: 21, name: 'P2', sectionId: 4, status: 'empty', currentCart: [], currentTokenNo: '1021', isSplit: false, createdAt: null },
    { id: 22, name: 'P3', sectionId: 4, status: 'empty', currentCart: [], currentTokenNo: '1022', isSplit: false, createdAt: null },
    { id: 23, name: 'P4', sectionId: 4, status: 'empty', currentCart: [], currentTokenNo: '1023', isSplit: false, createdAt: null }
  ],
  bills: [],
  billLogs: [],
  rawMaterials: [
    { id: 1, name: 'Milk', quantity: 50, minThreshold: 10, unit: 'Kg' },
    { id: 2, name: 'Sugar', quantity: 30, minThreshold: 5, unit: 'Kg' },
    { id: 3, name: 'Rice Batter', quantity: 20, minThreshold: 5, unit: 'Kg' },
    { id: 4, name: 'Paneer', quantity: 15, minThreshold: 4, unit: 'Kg' },
    { id: 5, name: 'Cashew (Kaju)', quantity: 25, minThreshold: 5, unit: 'Kg' },
    { id: 6, name: 'Mawa / Khoya', quantity: 18, minThreshold: 4, unit: 'Kg' }
  ],
  recipes: [
    { id: 1, dishId: 1, rawMaterialId: 3, qtyRequired: 0.2 },
    { id: 2, dishId: 33, rawMaterialId: 1, qtyRequired: 0.5 },
    { id: 3, dishId: 33, rawMaterialId: 2, qtyRequired: 0.2 },
    { id: 4, dishId: 34, rawMaterialId: 5, qtyRequired: 0.6 },
    { id: 5, dishId: 34, rawMaterialId: 2, qtyRequired: 0.3 }
  ],
  systemSettings: {
    hotelName: 'Karuna Hotel',
    location: 'Solapur',
    phone: '8446091809',
    lastSyncTime: new Date().toISOString()
  }
};

// In-memory Database State
let dbState = JSON.parse(JSON.stringify(DEFAULT_DATABASE_DATA));

// Always ensure all standard default dining tables (D1-D8, F1-F6, AC1-AC5, P1-P4) exist & auto-collapse empty split tables
export function ensureDefaultDiningTables(tables = []) {
  if (!Array.isArray(tables)) {
    tables = JSON.parse(JSON.stringify(DEFAULT_DATABASE_DATA.diningTables || []));
  }

  const defaultList = DEFAULT_DATABASE_DATA.diningTables || [];
  const defaultBaseNames = defaultList.map((d) => String(d.name).toUpperCase().trim());

  defaultBaseNames.forEach((baseName) => {
    const splitMatches = tables.filter((t) => {
      if (!t || !t.name) return false;
      const upper = String(t.name).toUpperCase().trim();
      const parentUpper = t.parentTable ? String(t.parentTable).toUpperCase().trim() : '';
      return upper === baseName || upper.startsWith(`${baseName}-`) || parentUpper === baseName;
    });

    if (splitMatches.length > 0) {
      const occupiedMatches = splitMatches.filter(
        (m) => m.status === 'occupied' || (m.currentCart && m.currentCart.length > 0)
      );

      // If NO split portion is occupied, collapse all back to a single base table!
      if (occupiedMatches.length === 0) {
        tables = tables.filter((t) => {
          if (!t || !t.name) return false;
          const upper = String(t.name).toUpperCase().trim();
          const parentUpper = t.parentTable ? String(t.parentTable).toUpperCase().trim() : '';
          return !(upper === baseName || upper.startsWith(`${baseName}-`) || parentUpper === baseName);
        });

        const defObj = defaultList.find((d) => String(d.name).toUpperCase().trim() === baseName);
        if (defObj) {
          tables.push({
            ...defObj,
            status: 'empty',
            currentCart: [],
            currentTokenNo: defObj.currentTokenNo || (1000 + defObj.id).toString(),
            isSplit: false,
            parentTable: null,
            customerName: '',
            createdAt: null
          });
        }
      } else {
        // Remove empty split portions so empty D2-B cards don't linger next to active D2-A!
        const emptySplits = splitMatches.filter(
          (m) => m.status !== 'occupied' && (!m.currentCart || m.currentCart.length === 0)
        );
        if (emptySplits.length > 0) {
          const emptyIds = new Set(emptySplits.map((e) => e.id));
          tables = tables.filter((t) => !emptyIds.has(t.id));
        }
      }
    } else {
      const defObj = defaultList.find((d) => String(d.name).toUpperCase().trim() === baseName);
      if (defObj) {
        tables.push({ ...defObj });
      }
    }
  });

  return tables;
}

// Load Database from Disk
export function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (parsed && typeof parsed === 'object') {
        dbState = { ...DEFAULT_DATABASE_DATA, ...parsed };
      }
    } else {
      saveDatabaseSync();
    }
  } catch (err) {
    console.error('Error loading database file from disk:', err);
    dbState = JSON.parse(JSON.stringify(DEFAULT_DATABASE_DATA));
  }

  dbState.diningTables = ensureDefaultDiningTables(dbState.diningTables);
  saveDatabaseSync();
}

// Synchronous Save to Disk
export function saveDatabaseSync() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file to disk:', err);
  }
}

// Debounced Asynchronous Save to Disk
let saveTimer = null;
export function scheduleSaveDatabase() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to disk:', err);
    }
  }, 100);
}

// --- Generic CRUD Operations ---

export function getAllData() {
  if (dbState) {
    dbState.diningTables = ensureDefaultDiningTables(dbState.diningTables || []);
  }
  return dbState;
}

export function getCollection(collectionName) {
  if (collectionName === 'diningTables') {
    dbState.diningTables = ensureDefaultDiningTables(dbState.diningTables || []);
    return dbState.diningTables;
  }
  return dbState[collectionName] || [];
}

export function getById(collectionName, id) {
  const collection = getCollection(collectionName);
  return collection.find((item) => item && String(item.id) === String(id)) || null;
}

export function insertItem(collectionName, itemData) {
  if (!dbState[collectionName]) {
    dbState[collectionName] = [];
  }
  const collection = dbState[collectionName];
  
  let newId = 1;
  if (collection.length > 0) {
    const maxId = collection.reduce((max, item) => (item && item.id > max ? item.id : max), 0);
    newId = maxId + 1;
  }

  const newItem = { ...itemData, id: itemData.id || newId };
  collection.push(newItem);
  scheduleSaveDatabase();
  return newItem;
}

export function updateItem(collectionName, id, updatedFields) {
  if (!dbState[collectionName]) dbState[collectionName] = [];
  const collection = dbState[collectionName];
  let index = collection.findIndex((item) => item && String(item.id) === String(id));
  if (index === -1 && collectionName === 'diningTables' && updatedFields?.name) {
    index = collection.findIndex((item) => item && String(item.name).toUpperCase() === String(updatedFields.name).toUpperCase());
  }
  if (index === -1) {
    const numId = parseInt(id) || (collection.length + 1);
    const created = { id: numId, ...updatedFields };
    collection.push(created);
    scheduleSaveDatabase();
    return created;
  }
  collection[index] = { ...collection[index], ...updatedFields };
  scheduleSaveDatabase();
  return collection[index];
}

export function deleteItem(collectionName, id) {
  if (!dbState[collectionName]) return false;
  const initialLength = dbState[collectionName].length;
  dbState[collectionName] = dbState[collectionName].filter((item) => String(item.id) !== String(id));
  const changed = dbState[collectionName].length !== initialLength;
  if (changed) scheduleSaveDatabase();
  return changed;
}

export function bulkAddItems(collectionName, items) {
  if (!dbState[collectionName]) {
    dbState[collectionName] = [];
  }
  if (!Array.isArray(items)) return [];
  const added = [];
  for (const item of items) {
    added.push(insertItem(collectionName, item));
  }
  return added;
}

export function clearCollection(collectionName) {
  dbState[collectionName] = [];
  scheduleSaveDatabase();
  return true;
}

// Parse item weight in Kg
// Parse item weight in Kg (accurately parses weightKg, custom Kg, grams, or regular unit qty)
export function parseItemWeightInKg(item) {
  if (item.weightKg !== undefined && item.weightKg !== null && !isNaN(parseFloat(item.weightKg))) {
    return parseFloat(item.weightKg);
  }
  const unitStr = (item.unit || '').toLowerCase().trim();
  if (unitStr.includes('kg')) {
    const num = parseFloat(unitStr.replace('kg', '').trim());
    return isNaN(num) ? 1 : num;
  }
  if (unitStr.includes('g') && !unitStr.includes('kg')) {
    const num = parseFloat(unitStr.replace('g', '').trim());
    return isNaN(num) ? 1 : num / 1000;
  }
  return 1;
}

// Atomic Transaction: Bill Settlement (Creates Bill + Deducts Raw Materials & Dish Stock + Clears Table)
export function settleBillTransaction(billData) {
  if (!dbState.bills) dbState.bills = [];
  
  // 1. Generate new Bill ID
  let newBillId = 1;
  if (dbState.bills.length > 0) {
    const maxBillId = dbState.bills.reduce((max, b) => (b && b.id > max ? b.id : max), 0);
    newBillId = maxBillId + 1;
  }

  const newBill = {
    ...billData,
    id: newBillId,
    status: 'settled',
    createdAt: billData.createdAt || new Date().toISOString()
  };
  dbState.bills.push(newBill);

  // 2. Deduct Dish Finished Stock Inventory (Raw materials were already deducted upon dish integration)
  const dishes = dbState.dishes || [];

  if (Array.isArray(billData.items)) {
    for (const item of billData.items) {
      const unitWeight = parseItemWeightInKg(item);
      const qtyCount = parseFloat(item.qty) || 1;
      const totalSoldKg = Math.round(unitWeight * qtyCount * 1000) / 1000;

      // Deduct Finished Dish Stock Only
      const matchedDish = dishes.find((d) => d && (d.id === item.id || d.srNo === item.srNo || (d.name && item.name && d.name.toLowerCase().trim() === item.name.toLowerCase().trim())));
      if (matchedDish && matchedDish.stockQty !== undefined) {
        matchedDish.stockQty = Math.max(0, Math.round(((matchedDish.stockQty || 0) - totalSoldKg) * 1000) / 1000);
        if (matchedDish.stockQty <= 0) matchedDish.status = 'Out of Stock';
      }
    }
  }

  // 3. Reset / Delete Dining Table
  let updatedTable = null;
  let deletedTableId = null;
  if (billData.tableId) {
    const table = getById('diningTables', billData.tableId);
    if (table) {
      if (table.isSplit || (table.name && table.name.includes('-')) || table.sectionId === 4 || (table.name && String(table.name).toUpperCase().startsWith('P')) || table.isParcel) {
        deleteItem('diningTables', table.id);
        deletedTableId = table.id;
      } else {
        updatedTable = updateItem('diningTables', table.id, {
          status: 'empty',
          currentCart: [],
          currentTokenNo: '',
          lastPrintedCart: [],
          kotCount: 0,
          createdAt: null,
          customerName: '',
          pax: '1',
          waiter: 'Raju'
        });
      }
    }
  }

  // Auto-collapse split tables if all portions are now empty!
  dbState.diningTables = ensureDefaultDiningTables(dbState.diningTables);

  scheduleSaveDatabase();

  return {
    bill: newBill,
    rawMaterials: dbState.rawMaterials,
    dishes: dbState.dishes,
    updatedTable,
    deletedTableId
  };
}

// Bulk update dish prices
export function bulkUpdateDishPrices(items) {
  if (!Array.isArray(items)) return [];
  const updatedDishes = [];
  for (const item of items) {
    const dish = (dbState.dishes || []).find(
      (d) => (item.srNo && String(d.srNo) === String(item.srNo)) ||
             (d.name && item.name && d.name.toLowerCase().trim() === item.name.toLowerCase().trim())
    );
    if (dish) {
      if (item.price !== undefined && !isNaN(parseFloat(item.price))) {
        dish.price = parseFloat(item.price);
      }
      if (item.pricePerKg !== undefined && !isNaN(parseFloat(item.pricePerKg))) {
        dish.pricePerKg = parseFloat(item.pricePerKg);
        if (dish.hasMultiplePrices) {
          dish.variants = [
            { unit: '250g', weightKg: 0.25, price: Math.round(dish.pricePerKg * 0.25) },
            { unit: '500g', weightKg: 0.5, price: Math.round(dish.pricePerKg * 0.5) },
            { unit: '1 Kg', weightKg: 1, price: Math.round(dish.pricePerKg) }
          ];
          dish.price = Math.round(dish.pricePerKg * 0.25);
        }
      }
      if (item.name) dish.name = item.name;
      if (item.marathiName) dish.marathiName = item.marathiName;
      updatedDishes.push(dish);
    }
  }
  scheduleSaveDatabase();
  return updatedDishes;
}

// Full Database Backup & Restore
export function getFullBackup() {
  return {
    version: 3,
    appName: 'KarunaPOS',
    exportedAt: new Date().toISOString(),
    ...dbState
  };
}

export function restoreFullBackup(backupData) {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup data format');
  }

  const collections = [
    'categories',
    'subCategories',
    'dishes',
    'sections',
    'diningTables',
    'bills',
    'billLogs',
    'rawMaterials',
    'recipes'
  ];

  for (const key of collections) {
    if (Array.isArray(backupData[key])) {
      dbState[key] = backupData[key];
    }
  }

  if (backupData.systemSettings) {
    dbState.systemSettings = backupData.systemSettings;
  }

  saveDatabaseSync();
  return dbState;
}

// 11. Batch Sync Offline Bills (When a counter reconnects after offline work or power cut)
export function syncOfflineBillsBatch(offlineBills = [], occupiedTables = []) {
  if (Array.isArray(occupiedTables) && occupiedTables.length > 0) {
    for (const occTbl of occupiedTables) {
      if (occTbl && occTbl.id) {
        updateItem('diningTables', occTbl.id, occTbl);
      }
    }
  }

  if (!Array.isArray(offlineBills) || offlineBills.length === 0) {
    return { syncedCount: 0, syncedBills: [], rawMaterials: dbState.rawMaterials, dishes: dbState.dishes };
  }

  const existingBills = dbState.bills || [];
  const existingIds = new Set(existingBills.map((b) => b && String(b.id)));
  const existingInvNos = new Set(existingBills.map((b) => b && b.invoiceNo && String(b.invoiceNo)));

  const syncedBills = [];
  const dishes = dbState.dishes || [];

  for (const billData of offlineBills) {
    if (!billData) continue;
    
    // Check if already synced via unique Bill ID or Invoice Number
    const idStr = String(billData.id);
    const invStr = billData.invoiceNo ? String(billData.invoiceNo) : null;

    if (existingIds.has(idStr) || (invStr && existingInvNos.has(invStr))) {
      console.log(`⏩ [Offline Sync] Bill ${invStr || idStr} already in database, skipping duplicate.`);
      continue;
    }

    const newBill = {
      ...billData,
      id: billData.id || Date.now() + Math.floor(Math.random() * 1000),
      status: 'settled',
      syncedAt: new Date().toISOString(),
      wasOffline: true
    };

    dbState.bills.push(newBill);
    existingIds.add(String(newBill.id));
    if (invStr) existingInvNos.add(invStr);
    syncedBills.push(newBill);

    // Deduct stock for synced items
    if (Array.isArray(billData.items)) {
      for (const item of billData.items) {
        const unitWeight = parseItemWeightInKg(item);
        const qtyCount = parseFloat(item.qty) || 1;
        const totalSoldKg = Math.round(unitWeight * qtyCount * 1000) / 1000;

        const matchedDish = dishes.find((d) => d && (d.id === item.id || d.srNo === item.srNo || (d.name && item.name && d.name.toLowerCase().trim() === item.name.toLowerCase().trim())));
        if (matchedDish && matchedDish.stockQty !== undefined) {
          matchedDish.stockQty = Math.max(0, Math.round(((matchedDish.stockQty || 0) - totalSoldKg) * 1000) / 1000);
          if (matchedDish.stockQty <= 0) matchedDish.status = 'Out of Stock';
        }
      }
    }
  }

  if (syncedBills.length > 0) {
    scheduleSaveDatabase();
    console.log(`✅ [Offline Sync] Successfully synced ${syncedBills.length} offline bills into Master Database.`);
  }

  return {
    syncedCount: syncedBills.length,
    syncedBills,
    rawMaterials: dbState.rawMaterials,
    dishes: dbState.dishes
  };
}

// 12. Automated Hourly Backups
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function createAutomatedBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `karuna_backup_${timestamp}.json`);
    const backupData = getFullBackup();
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    // Prune old backups (keep last 30 snapshots)
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('karuna_backup_') && f.endsWith('.json'))
      .map((f) => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      files.slice(30).forEach((file) => {
        try { fs.unlinkSync(path.join(BACKUP_DIR, file.name)); } catch (e) {}
      });
    }

    return { success: true, file: backupPath, time: new Date().toISOString() };
  } catch (err) {
    console.error('Error creating automated backup:', err);
    return { success: false, error: err.message };
  }
}

// Hourly backup interval
setInterval(createAutomatedBackup, 1000 * 60 * 60);

// Initialize and save to disk on module load
loadDatabase();
saveDatabaseSync();
createAutomatedBackup();

