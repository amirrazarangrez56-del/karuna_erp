# Karuna Hotel POS & ERP Suite - Multi-Terminal LAN Setup Guide

This guide explains how to connect **1 Main Server PC/Laptop** and **3 Counter POS Terminals** using Ethernet LAN cables, configure static IP addresses, and ensure seamless billing even during a main server power cut.

---

## 1. Network Architecture Diagram

```
                       ┌──────────────────────────────────────┐
                       │  5-Port or 8-Port Gigabit Switch    │
                       │     (TP-Link / D-Link / Cisco)       │
                       └────┬──────────┬──────────┬────────┬──┘
                            │          │          │        │
                            │ Cat6     │ Cat6     │ Cat6   │ Cat6
                            │          │          │        │
┌───────────────────────────▼──┐ ┌─────▼────┐ ┌───▼────┐ ┌─▼────────┐
│      MAIN SERVER PC          │ │ COUNTER 1│ │COUNTER 2│ │COUNTER 3 │
│  (Owner & Master Database)   │ │ (Snacks) │ │(Sweets) │ │ (Parcel) │
│  IP: 192.168.1.100           │ │ .1.101   │ │ .1.102  │ │ .1.103   │
│  [⚡ UPS Backup Recommended]  │ └──────────┘ └─────────┘ └──────────┘
└──────────────────────────────┘
```

---

## 2. Power-Cut Resilience (How Offline Mode Works)

If the **Main Server PC** is turned off or suffers a power cut:

1. **Counters Never Stop:** Counter 1, 2, and 3 continue billing seamlessly using their embedded local **Dexie IndexedDB**.
2. **Conflict-Free Invoice Numbers:** Each counter uses its own unique prefix so no duplicate receipt numbers are generated:
   - **Counter 1:** `INV-C1-260904-101`, `INV-C1-260904-102`...
   - **Counter 2:** `INV-C2-260904-101`, `INV-C2-260904-102`...
   - **Counter 3:** `INV-C3-260904-101`, `INV-C3-260904-102`...
   - **Master/Owner:** `INV-M-260904-101`...
3. **Offline Queue Buffer:** All offline bills are stored locally in the persistent `offline_queue`.
4. **Auto-Sync on Power Restore:** As soon as the Main Server PC turns back on:
   - WebSocket automatically reconnects within 3 seconds.
   - All pending offline bills are uploaded to `/api/bills/sync-offline` and merged into the Master Database.
   - Central stock and revenue counts update automatically.

---

## 3. Step-by-Step Windows LAN IP Configuration

### Step A: Configure Master Server PC
1. Press `Win + R`, type `ncpa.cpl` and press **Enter**.
2. Right-click your **Ethernet Network Card** $\rightarrow$ Click **Properties**.
3. Select **Internet Protocol Version 4 (TCP/IPv4)** $\rightarrow$ Click **Properties**.
4. Choose **Use the following IP address**:
   - **IP Address:** `192.168.1.100`
   - **Subnet Mask:** `255.255.255.0`
   - **Default Gateway:** `192.168.1.1` *(or leave blank if no internet router)*
5. Click **OK**.
6. Run `ALLOW_FIREWALL_ON_SERVER.bat` (Right-click $\rightarrow$ **Run as Administrator**).

---

### Step B: Configure Counter 1, 2, and 3 Laptops
Repeat the above steps on each counter laptop, assigning:

| Machine | Role | IP Address | Subnet Mask |
| :--- | :--- | :--- | :--- |
| **Server PC** | Master DB & Owner Admin | `192.168.1.100` | `255.255.255.0` |
| **Counter 1** | Breakfast & Snacks POS | `192.168.1.101` | `255.255.255.0` |
| **Counter 2** | Sweets & Mithai POS | `192.168.1.102` | `255.255.255.0` |
| **Counter 3** | Parcels & Fast Food POS | `192.168.1.103` | `255.255.255.0` |

---

## 4. How to Launch the Software

### On the Main Server PC:
1. Double-click **`START_OWNER_DESKTOP_SERVER.bat`**.
2. The central database server activates on port `3001` and opens the **Karuna POS Desktop Software**.

### On Counter Laptops (1, 2, 3):
1. Double-click **`START_COUNTER_LAPTOP.bat`**.
2. Enter the Server IP (`192.168.1.100`) on first launch *(it will be remembered automatically)*.
3. The standalone POS window will open directly in full screen.

---

## 5. Dedicated Panels & Roles

| Panel | Description | Access / Security |
| :--- | :--- | :--- |
| **🛒 Counter 1** | Fast touch & hotkey billing for Breakfast items, Single items, Dosa, Tea/Coffee. | Open for Counter 1 Cashier |
| **🍬 Counter 2** | Specialized Sweets & Mithai billing with dynamic Per-Kg pricing (250g, 500g, 1kg, custom grams). | Open for Counter 2 Cashier |
| **📦 Counter 3** | Fast Parcel billing & Table management with KOT and split table billing. | Open for Counter 3 Cashier |
| **🖥️ Server Hub** | Visual monitor showing connected LAN terminals, live pings, Master IPs, and disk snapshots. | Accessible via "Server & LAN Hub" tab |
| **👑 Owner Admin** | Master dish pricing, inventory master, raw materials, daily profit/loss, and audit logs. | **Protected by Owner PIN (`1234`)** |

---

## 6. Testing Network Connectivity (Ping Test)

From any Counter laptop, open Command Prompt (`cmd`) and test connection to the Server:
```bash
ping 192.168.1.100
```
If you get `Reply from 192.168.1.100: bytes=32 time<1ms`, your high-speed LAN link is active and ready.
