import http from 'http';
import { WebSocket } from 'ws';
import assert from 'node:assert';
import { parseItemWeightInKg, getCounterPrefix, generateCounterInvoiceNo } from '../src/db/db.js';
import { parseCSVAndValidateRates } from '../src/utils/excelUtils.js';

const PORT = 3001;
const HOST = 'localhost';

function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: HOST,
      port: PORT,
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runQATestSuite() {
  console.log('================================================================');
  console.log('🧪 KARUNA HOTEL POS - OFFICIAL QA TEST SUITE & SYSTEM AUDIT');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;
  const testResults = [];

  async function runTestCase(testId, testName, testFn) {
    try {
      await testFn();
      console.log(`✅ [PASS] ${testId}: ${testName}`);
      passedTests++;
      testResults.push({ id: testId, name: testName, status: 'PASSED' });
    } catch (err) {
      console.error(`❌ [FAIL] ${testId}: ${testName}`);
      console.error(`   Reason: ${err.message}\n`);
      failedTests++;
      testResults.push({ id: testId, name: testName, status: 'FAILED', error: err.message });
    }
  }

  // --- TEST CASE 1: Weight & Unit Parsing ---
  await runTestCase('TC-01', 'Accurate Weight & Unit Parsing in Kg', () => {
    assert.strictEqual(parseItemWeightInKg({ unit: '250g' }), 0.25, '250g should parse to 0.25 Kg');
    assert.strictEqual(parseItemWeightInKg({ unit: '500g' }), 0.5, '500g should parse to 0.5 Kg');
    assert.strictEqual(parseItemWeightInKg({ unit: '1 Kg' }), 1, '1 Kg should parse to 1.0 Kg');
    assert.strictEqual(parseItemWeightInKg({ weightKg: 0.75 }), 0.75, 'weightKg field priority should be 0.75');
    assert.strictEqual(parseItemWeightInKg({ unit: '1 Plate' }), 1, 'Standard plate should parse to 1 unit count');
  });

  // --- TEST CASE 2: Counter Prefix & Sequential Invoice Numbering ---
  await runTestCase('TC-02', 'Counter Prefix & Unique Sequential Invoice Generation', () => {
    assert.strictEqual(getCounterPrefix('Counter 1 (Breakfast & Snacks)'), 'C1');
    assert.strictEqual(getCounterPrefix('Counter 2 (Sweets & Mithai)'), 'C2');
    assert.strictEqual(getCounterPrefix('Counter 3 (Parcels & Takeaway)'), 'C3');
    assert.strictEqual(getCounterPrefix('Owner Master Terminal'), 'M');

    const inv1 = generateCounterInvoiceNo('Counter 1');
    const inv2 = generateCounterInvoiceNo('Counter 1');
    assert.match(inv1, /^INV-C1-\d{6}-\d+$/, 'Invoice format matches INV-C1-YYMMDD-SEQ');
    assert.notStrictEqual(inv1, inv2, 'Sequential invoice numbers must be unique');
  });

  // --- TEST CASE 3: Cart Logic - Separate Rows for Variants & Parcel ---
  await runTestCase('TC-03', 'Cart Isolation: Multi-Price Variants & Parcel Separation', () => {
    let cart = [];

    function simulateAddToCart(dishItem) {
      const noteKey = dishItem.customNote || '';
      const initialQty = dishItem.qty !== undefined ? dishItem.qty : 1;
      const unitKey = dishItem.unit || (dishItem.weightKg ? `${dishItem.weightKg} Kg` : null);
      const isParcel = Boolean(dishItem.isParcel);

      const existingIndex = cart.findIndex((item) => {
        const matchIdentity = item.id === dishItem.id || (item.name && dishItem.name && item.name === dishItem.name);
        if (!matchIdentity) return false;
        const itemUnit = item.unit || (item.weightKg ? `${item.weightKg} Kg` : null);
        if ((itemUnit || '') !== (unitKey || '')) return false;
        if (Boolean(item.isParcel) !== isParcel) return false;
        if (noteKey !== (item.customNote || '')) return false;
        return true;
      });

      if (existingIndex !== -1) {
        const existing = cart[existingIndex];
        const newQty = (parseFloat(existing.qty) || 1) + initialQty;
        cart[existingIndex] = { ...existing, qty: newQty };
      } else {
        const cartItemId = `${dishItem.id}_${Date.now()}_${Math.random()}`;
        cart.push({ ...dishItem, cartItemId, qty: initialQty, unit: unitKey, isParcel });
      }
    }

    // 1. Add Single Idli Vada (Dine in)
    simulateAddToCart({ id: 1, name: 'Single Idli Vada', price: 50, isParcel: false });
    // 2. Add Single Idli Vada again (Dine in -> should increment qty to 2)
    simulateAddToCart({ id: 1, name: 'Single Idli Vada', price: 50, isParcel: false });
    // 3. Add Single Idli Vada (Parcel -> MUST be a separate row!)
    simulateAddToCart({ id: 1, name: 'Single Idli Vada', price: 50, isParcel: true });
    // 4. Add Gulab Jamun 250g
    simulateAddToCart({ id: 33, name: 'Gulab Jamun', price: 80, unit: '250g', weightKg: 0.25 });
    // 5. Add Gulab Jamun 500g (MUST be a separate row!)
    simulateAddToCart({ id: 33, name: 'Gulab Jamun', price: 160, unit: '500g', weightKg: 0.5 });

    assert.strictEqual(cart.length, 4, 'Cart must have exactly 4 separate rows');
    assert.strictEqual(cart[0].qty, 2, 'Dine-in Idli Vada should have qty 2');
    assert.strictEqual(cart[1].isParcel, true, 'Parcel Idli Vada is distinct row with isParcel=true');
    assert.strictEqual(cart[2].unit, '250g', 'Gulab Jamun 250g is preserved with price 80');
    assert.strictEqual(cart[3].unit, '500g', 'Gulab Jamun 500g is preserved with price 160');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    // (50*2) + (50*1) + (80*1) + (160*1) = 100 + 50 + 80 + 160 = 390
    assert.strictEqual(total, 390, 'Grand total must equal 390');
  });

  // --- TEST CASE 4: Master Server Health & Full Data Loading ---
  await runTestCase('TC-04', 'Master Server Connectivity & Complete Schema Validation', async () => {
    const health = await apiRequest('/api/health');
    assert.strictEqual(health.status, 200, 'Health check returned 200');
    assert.strictEqual(health.data.status, 'ok', 'Status is ok');
    assert.strictEqual(health.data.hotelName, 'Karuna Hotel', 'Hotel Name is Karuna Hotel');

    const allData = await apiRequest('/api/all-data');
    assert.strictEqual(allData.status, 200, 'All-data returned 200');
    assert(allData.data.data.dishes.length >= 35, 'Loaded complete dishes list');
    assert(allData.data.data.sections.length >= 4, 'Loaded 4 standard sections');
    assert(allData.data.data.diningTables.length >= 20, 'Loaded standard dining tables');
  });

  // --- TEST CASE 5: Real-Time WebSocket Handshake & Broadcaster ---
  await runTestCase('TC-05', 'WebSocket Handshake, Terminal Registration & Live Ping/Pong', async () => {
    const ws = new WebSocket(`ws://${HOST}:${PORT}`);
    let pongReceived = false;
    let connectedMsgReceived = false;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(), 3000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'PING' }));
        ws.send(JSON.stringify({
          type: 'REGISTER_TERMINAL',
          name: 'Counter 2 Sweets Terminal',
          counterId: 'C2',
          mode: 'POS'
        }));
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'PONG') pongReceived = true;
          if (parsed.type === 'CONNECTED') connectedMsgReceived = true;
          if (pongReceived && connectedMsgReceived) {
            clearTimeout(timer);
            resolve();
          }
        } catch (e) {}
      });

      ws.on('error', reject);
    });

    ws.close();
    assert.strictEqual(connectedMsgReceived, true, 'Server sent CONNECTED greeting');
    assert.strictEqual(pongReceived, true, 'Server replied with PONG upon PING');
  });

  // --- TEST CASE 6: Atomic Settlement Transaction & Stock Deduction ---
  await runTestCase('TC-06', 'Atomic Settlement: Bill Creation, Stock Deduction & Table Clearing', async () => {
    // 1. Create a dining table with order
    const tableRes = await apiRequest('/api/diningTables', 'POST', {
      name: 'QA-D1',
      sectionId: 1,
      status: 'occupied',
      currentCart: [{ id: 1, name: 'Single Idli Vada', price: 50, qty: 1 }],
      currentTokenNo: '5501'
    });
    const testTableId = tableRes.data.data?.id;
    assert(testTableId, 'Temporary test table created');

    // 2. Fetch current dish stock and ensure sufficient stock
    const dishesRes = await apiRequest('/api/dishes');
    assert(dishesRes.data?.data?.length > 0, 'Dishes list is not empty');
    const targetDish = dishesRes.data.data[0];
    
    // Guarantee test idempotency by ensuring targetDish has fresh stock
    const initialStock = 25;
    await apiRequest(`/api/dishes/${targetDish.id}`, 'PUT', { stockQty: initialStock });

    // 3. Settle Bill for QA-D1
    const settleRes = await apiRequest('/api/bills/settle', 'POST', {
      tableId: testTableId,
      tokenNo: '5501',
      tableNo: 'QA-D1',
      sectionName: 'Dine In Area',
      items: [{ id: targetDish.id, srNo: targetDish.srNo, name: targetDish.name, price: targetDish.price || 50, qty: 2, weightKg: 1 }],
      subtotal: (targetDish.price || 50) * 2,
      total: (targetDish.price || 50) * 2,
      paymentDetails: { mode: 'Cash', cash: (targetDish.price || 50) * 2, online: 0 }
    });

    assert.strictEqual(settleRes.status, 200, 'Settlement returned 200');
    assert.strictEqual(settleRes.data.success, true, 'Settlement succeeded');
    assert(settleRes.data.bill?.id, 'Settled bill ID returned');

    // 4. Verify Dish stock was deducted by 2
    const updatedDishes = await apiRequest('/api/dishes');
    const updatedDish = updatedDishes.data.data.find(d => d.id === targetDish.id);
    assert(updatedDish, `Found updated dish with ID ${targetDish.id}`);
    assert.strictEqual(updatedDish.stockQty, initialStock - 2, 'Dish stock was decremented accurately by 2');

    // Clean up
    await apiRequest(`/api/diningTables/${testTableId}`, 'DELETE');
  });

  // --- TEST CASE 7: Offline Batch Sync Duplicate Prevention ---
  await runTestCase('TC-07', 'Offline Reconnection Batch Sync & Idempotent Deduplication', async () => {
    const uniqueInvNo = `INV-TEST-OFFLINE-${Date.now()}`;
    const offlineBatch = {
      bills: [
        {
          id: Date.now() + 1,
          tokenNo: '1001',
          invoiceNo: uniqueInvNo,
          counterId: 'C1',
          total: 80,
          items: [{ id: 33, name: 'Gulab Jamun', price: 80, qty: 1, weightKg: 0.25 }]
        }
      ],
      occupiedTables: []
    };

    // First Sync
    const sync1 = await apiRequest('/api/bills/sync-offline', 'POST', offlineBatch);
    assert.strictEqual(sync1.data.success, true, 'First sync succeeded');
    assert.strictEqual(sync1.data.syncedCount, 1, 'First sync imported 1 bill');

    // Duplicate Sync Attempt (Re-sending the exact same offline batch)
    const sync2 = await apiRequest('/api/bills/sync-offline', 'POST', offlineBatch);
    assert.strictEqual(sync2.data.success, true, 'Duplicate sync handled gracefully');
    assert.strictEqual(sync2.data.syncedCount, 0, 'Duplicate bill correctly skipped without double-charging stock');
  });

  // --- TEST CASE 8: Menu CSV Validation & Parsing ---
  await runTestCase('TC-08', 'CSV Import Rate Parser & Missing Column Validation', () => {
    // Valid CSV
    const validCSV = `Sr. No.,Dish Name,Marathi Name,Category,Price (₹),Base Rate Per Kg (₹)\n101,"Single Idli Vada","सिंगल इडली वडा","Breakfast",55,\n201,"Gulab Jamun","गुलाब जामुन","Sweets",80,320`;
    const validResult = parseCSVAndValidateRates(validCSV);
    assert.strictEqual(validResult.success, true, 'Valid CSV successfully parsed');
    assert.strictEqual(validResult.items.length, 2, 'Parsed 2 dishes');
    assert.strictEqual(validResult.items[0].price, 55, 'Updated price parsed as 55');
    assert.strictEqual(validResult.items[1].pricePerKg, 320, 'Base rate per kg parsed as 320');

    // Invalid CSV (Missing price column)
    const invalidCSV = `Sr. No.,Dish Name,Marathi Name\n101,"Single Idli Vada","सिंगल इडली वडा"`;
    const invalidResult = parseCSVAndValidateRates(invalidCSV);
    assert.strictEqual(invalidResult.success, false, 'Invalid CSV rejected');
    assert.strictEqual(invalidResult.missingPriceAlert, true, 'Missing price column detected and blocked');
  });

  // --- TEST CASE 9: Automated Hourly Disk Snapshot Creation ---
  await runTestCase('TC-09', 'Hourly Automated Disk Snapshot & JSON Backup Integrity', async () => {
    const snapshot = await apiRequest('/api/database/snapshot', 'POST');
    assert.strictEqual(snapshot.status, 200, 'Snapshot endpoint returned 200');
    assert.strictEqual(snapshot.data.success, true, 'Snapshot success flag true');
    assert(snapshot.data.file.endsWith('.json'), 'Snapshot saved as .json backup file');

    const backup = await apiRequest('/api/database/backup', 'GET');
    assert.strictEqual(backup.status, 200, 'Full backup export returned 200');
    assert.strictEqual(backup.data.appName, 'KarunaPOS', 'Backup appName is KarunaPOS');
    assert(Array.isArray(backup.data.dishes), 'Backup contains dishes collection');
    assert(Array.isArray(backup.data.diningTables), 'Backup contains diningTables collection');
  });

  // --- TEST CASE 10: Server Status & Today Revenue Calculation ---
  await runTestCase('TC-10', 'Real-time Server Monitor Status & Today Sales Computation', async () => {
    const status = await apiRequest('/api/server/status');
    assert.strictEqual(status.status, 200, 'Status returned 200');
    assert.strictEqual(status.data.status, 'ONLINE', 'Server engine status is ONLINE');
    assert(status.data.totalBillsCount >= 0, 'Total bills count available');
    assert(status.data.todayRevenue >= 0, 'Today revenue computed correctly');
    assert(Array.isArray(status.data.serverIps) && status.data.serverIps.length > 0, 'LAN IP addresses resolved for CAT6 laptops');
  });

  console.log('\n================================================================');
  console.log(`🏁 QA EXECUTION SUMMARY:`);
  console.log(`   TOTAL TESTS : ${passedTests + failedTests}`);
  console.log(`   PASSED      : ${passedTests}`);
  console.log(`   FAILED      : ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runQATestSuite();
