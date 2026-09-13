import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import os from 'os';
import {
  getAllData,
  getCollection,
  getById,
  insertItem,
  updateItem,
  deleteItem,
  bulkAddItems,
  clearCollection,
  settleBillTransaction,
  syncOfflineBillsBatch,
  bulkUpdateDishPrices,
  getFullBackup,
  restoreFullBackup,
  createAutomatedBackup
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Active Terminal Roster (Counter 1, Counter 2, Counter 3, Owner)
const activeTerminals = new Map();

// Helper to broadcast changes to all connected LAN laptops/devices
function broadcast(event) {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('Error sending WS message:', err);
      }
    }
  });
}

// Broadcast list of active terminals
function broadcastTerminalRoster() {
  const terminals = Array.from(activeTerminals.values());
  broadcast({
    type: 'TERMINAL_ROSTER_UPDATE',
    terminals
  });
}

// WebSocket Connection Handling
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
  const connectionId = `${clientIp}_${Date.now()}`;
  console.log(`🔌 [LAN Sync] Client connected from: ${clientIp} (Total clients: ${wss.clients.size})`);

  // Default terminal profile
  activeTerminals.set(connectionId, {
    id: connectionId,
    ip: clientIp,
    name: 'Connecting Terminal...',
    connectedAt: new Date().toISOString(),
    lastPing: new Date().toISOString()
  });

  // Send immediate greeting and confirmation
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    serverTime: new Date().toISOString(),
    clientCount: wss.clients.size,
    terminals: Array.from(activeTerminals.values())
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
        if (activeTerminals.has(connectionId)) {
          const t = activeTerminals.get(connectionId);
          t.lastPing = new Date().toISOString();
        }
        ws.send(JSON.stringify({ type: 'PONG' }));
      } else if (data.type === 'REGISTER_TERMINAL') {
        // Register terminal identity (e.g., Counter 1, Counter 2, Counter 3, Owner)
        if (activeTerminals.has(connectionId)) {
          const t = activeTerminals.get(connectionId);
          t.name = data.name || 'Counter Terminal';
          t.counterId = data.counterId || 'C1';
          t.mode = data.mode || 'POS';
          t.lastPing = new Date().toISOString();
          console.log(`🏷️ [Terminal Registered] ${t.name} from ${t.ip}`);
          broadcastTerminalRoster();
        }
      } else if (data.type === 'CLIENT_UPDATE') {
        const { collection, id, data: updateData } = data;
        const updated = updateItem(collection, id, updateData);
        broadcast({
          type: 'UPDATE',
          collection,
          id,
          data: updated
        });
      } else if (data.type === 'CLIENT_INSERT') {
        const { collection, data: insertData } = data;
        const created = insertItem(collection, insertData);
        broadcast({
          type: 'INSERT',
          collection,
          data: created
        });
      } else if (data.type === 'CLIENT_DELETE') {
        const { collection, id } = data;
        deleteItem(collection, id);
        broadcast({
          type: 'DELETE',
          collection,
          data: { id }
        });
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on('close', () => {
    activeTerminals.delete(connectionId);
    console.log(`🔌 [LAN Sync] Client disconnected (${clientIp}). Remaining: ${wss.clients.size}`);
    broadcastTerminalRoster();
  });
});

// --- REST API ENDPOINTS ---

// Health & Server Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hotelName: 'Karuna Hotel',
    clientsConnected: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// Server Comprehensive Status & System Health
app.get('/api/server/status', (req, res) => {
  try {
    const allBills = getCollection('bills') || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = allBills.filter((b) => b && b.createdAt && b.createdAt.startsWith(todayStr));
    const todayRevenue = todayBills.reduce((acc, b) => acc + (parseFloat(b.finalTotal || b.grandTotal || 0) || 0), 0);

    const ips = getLocalIpAddresses();
    res.json({
      success: true,
      status: 'ONLINE',
      serverIps: ips,
      port: PORT,
      terminals: Array.from(activeTerminals.values()),
      clientCount: wss.clients.size,
      totalBillsCount: allBills.length,
      todayBillsCount: todayBills.length,
      todayRevenue,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Fetch All Database Tables in One Fast Query
app.get('/api/all-data', (req, res) => {
  try {
    const data = getAllData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Generic Collection Read
app.get('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const items = getCollection(collection);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Generic Collection Add / Insert
app.post('/api/:collection', (req, res) => {
  try {
    const { collection } = req.params;
    const item = req.body;
    const created = insertItem(collection, item);

    // Real-time broadcast to all connected LAN laptops
    broadcast({
      type: 'INSERT',
      collection,
      data: created
    });

    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Generic Collection Bulk Add
app.post('/api/:collection/bulk', (req, res) => {
  try {
    const { collection } = req.params;
    const items = req.body.items || [];
    const added = bulkAddItems(collection, items);

    broadcast({
      type: 'RELOAD_COLLECTION',
      collection,
      data: getCollection(collection)
    });

    res.json({ success: true, data: added });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Generic Collection Clear
app.post('/api/:collection/clear', (req, res) => {
  try {
    const { collection } = req.params;
    clearCollection(collection);

    broadcast({
      type: 'RELOAD_COLLECTION',
      collection,
      data: []
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Generic Collection Update
app.put('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const updates = req.body;
    const updated = updateItem(collection, id, updates);

    // Real-time broadcast to all connected LAN laptops
    broadcast({
      type: 'UPDATE',
      collection,
      id,
      data: updated
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Generic Collection Delete
app.delete('/api/:collection/:id', (req, res) => {
  try {
    const { collection, id } = req.params;
    const success = deleteItem(collection, id);

    // Real-time broadcast to all connected LAN laptops
    broadcast({
      type: 'DELETE',
      collection,
      id
    });

    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Atomic Bill Settlement (Transaction: Bill Created + Stock Deducted + Table Cleared)
app.post('/api/bills/settle', (req, res) => {
  try {
    const billData = req.body;
    const result = settleBillTransaction(billData);

    // Broadcast real-time updates to all LAN devices
    broadcast({
      type: 'BILL_SETTLED',
      bill: result.bill,
      rawMaterials: result.rawMaterials,
      dishes: result.dishes,
      updatedTable: result.updatedTable,
      deletedTableId: result.deletedTableId
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8b. Batch Offline Bills Sync (When a counter reconnects after offline work or power cut)
app.post('/api/bills/sync-offline', (req, res) => {
  try {
    const { bills, occupiedTables } = req.body;
    const result = syncOfflineBillsBatch(bills, occupiedTables);

    broadcast({
      type: 'RELOAD_COLLECTION',
      collection: 'diningTables',
      data: getCollection('diningTables')
    });

    if (result.syncedCount > 0) {
      // Broadcast bulk sync update to all connected terminals
      broadcast({
        type: 'OFFLINE_BILLS_SYNCED',
        syncedCount: result.syncedCount,
        syncedBills: result.syncedBills,
        rawMaterials: result.rawMaterials,
        dishes: result.dishes
      });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error syncing offline bills:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Bulk Update Dish Prices
app.post('/api/dishes/bulk-prices', (req, res) => {
  try {
    const { items } = req.body;
    const updatedDishes = bulkUpdateDishPrices(items);

    broadcast({
      type: 'RELOAD_COLLECTION',
      collection: 'dishes',
      data: getCollection('dishes')
    });

    res.json({ success: true, data: updatedDishes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Backup & Restore
app.get('/api/database/backup', (req, res) => {
  try {
    const backup = getFullBackup();
    res.json(backup);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10b. Trigger Immediate Manual Snapshot on Disk
app.post('/api/database/snapshot', (req, res) => {
  try {
    const result = createAutomatedBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/database/restore', (req, res) => {
  try {
    const backupData = req.body;
    const restored = restoreFullBackup(backupData);

    broadcast({
      type: 'FULL_RESTORE',
      data: restored
    });

    res.json({ success: true, data: restored });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Local LAN IP Addresses for Easy Connection Display
export function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Start Server on 0.0.0.0 (Accepts CAT6 Cable and Wi-Fi LAN Traffic)
server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log('================================================================');
  console.log('🚀  KARUNA HOTEL POS - CENTRAL MASTER DATABASE SERVER ACTIVE');
  console.log('================================================================');
  console.log(`📍  Database Server Port: ${PORT}`);
  console.log('🌐  LAN IP Addresses available for CAT6 Laptop connection:');
  if (ips.length > 0) {
    ips.forEach((ip) => {
      console.log(`    👉 http://${ip}:5173  (Master Server: http://${ip}:${PORT})`);
    });
  } else {
    console.log('    👉 http://localhost:5173');
  }
  console.log('================================================================');
});
