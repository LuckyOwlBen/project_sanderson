# Inventory & Store System

## Overview
Complete inventory and store system with GM controls, integrated with the existing character model and websocket infrastructure.

## Features Implemented

### 1. Core Inventory System
- **InventoryManager**: Full CRUD operations for items
  - Add/remove items with automatic stacking
  - Equip/unequip with stat bonus integration (via BonusManager)
  - Weight tracking with carrying capacity based on Strength
  - Currency management (broams, marks, chips) with conversion
  - Serialization for storage

### 2. Item Database (100+ items)
- **Light Weapons** (9): Daggers, hand axes, shortswords, slings, shortbows
- **Heavy Weapons** (9): Longswords, warhammers, greataxes, spears, longbows
- **Special Weapons** (5): Shardblade, Shardplate, Honorblade, Nightblood, Dawnshard
- **Armor** (8): Padded to full plate, shields
- **Equipment** (25+): Adventuring gear, tools, consumables
- **Fabrials** (3): Soulcasters, spanreeds, heating fabrials
- **Mounts** (3): Horses, chulls, greatshells
- **Starting Kits** (6): Academic, Artisan, Military, Courtier, Prisoner, Underworld

### 3. Player UI Components

#### Inventory View (`src/app/components/inventory-view/`)
- Equipment slots: Main hand, off-hand, armor, accessory
- Unequipped items list with accordion
- Weight tracker with progress bar
- Currency display with broams/marks/chips conversion
- Equip/unequip functionality

#### Store View (`src/app/views/store-view/`)
- Category filter (all/weapon/armor/equipment/consumable/fabrial/mount)
- Search by item name
- Item cards with purchase buttons
- Currency converter (mixed denominations → broams/marks/chips)
- GM toggle support (store enabled/disabled)
- Purchase transactions via websocket

### 4. GM Dashboard Controls

#### Item Grant Dialog (`src/app/views/gm-dashboard-view/item-grant-dialog.component.ts`)
- Search and filter all items
- Category selector
- Rarity chips (common/reward-only/talent-only)
- **Warning boxes** for special items:
  - Reward-only items (Shardblade, Shardplate, etc.)
  - Talent-only items (Radiant equipment)
- Quantity input
- Grant to specific player

#### Store Controls (in GM Dashboard)
- Toggle 3 stores: Main Store, Weapons Shop, Armor Shop
- Open/Closed status display
- Broadcasts state to all connected clients

### 5. Websocket Integration

#### New Events
- `StoreTransactionEvent`: Player purchases tracked by GM
- `ItemGrantEvent`: GM grants item to specific player
- `StoreToggleEvent`: GM opens/closes stores

#### Server Handlers (`server/server.js`)
- `store-transaction`: Broadcasts purchases to GMs
- `gm-grant-item`: Routes item to target player socket
- `gm-toggle-store`: Broadcasts store state to all clients

### 6. Navigation Integration
- Store link added to sidenav
- GM Dashboard link added to sidenav
- Store route configured in `app.routes.ts`
- Inventory view integrated into character sheet (left column, after portrait)

## Usage

### For Players
1. **View Inventory**: Open character sheet, inventory displayed in left column
2. **Visit Store**: Click "Store" in sidenav navigation
3. **Purchase Items**: 
   - Browse by category or search
   - Use currency converter to calculate total
   - Click "Purchase" on items (automatically deducts currency)
4. **Equip Items**: Click "Equip" button in inventory view
5. **Check Bonuses**: Equipped items automatically apply stat bonuses

### For GMs
1. **Grant Items**: 
   - Open GM Dashboard
   - Click "Grant Item" on player card
   - Search/filter items
   - See warnings for special items (Shardblades, etc.)
   - Select quantity and confirm
2. **Toggle Stores**:
   - Use "Store Controls" card in GM Dashboard
   - Toggle main-store, weapons-shop, or armor-shop
   - Players see immediate effect in store view

## Technical Architecture

### Data Flow
```
Character Model → InventoryManager → BonusManager (for equipment bonuses)
                      ↓
                CharacterStorageService (persistence)
                      ↓
                Server + localStorage
```

### Websocket Flow
```
Player (Store View) → emitStoreTransaction() → Server → GM Dashboard
GM (Dashboard) → grantItem() → Server → Player (Character Sheet)
GM (Dashboard) → toggleStore() → Server → All Clients (Store View)
```

## Files Modified/Created

### Created
- `src/app/character/inventory/inventoryItem.ts`
- `src/app/character/inventory/itemDefinitions.ts`
- `src/app/character/inventory/inventoryManager.ts`
- `src/app/components/inventory-view/*` (3 files)
- `src/app/views/store-view/*` (3 files)
- `src/app/views/gm-dashboard-view/item-grant-dialog.component.ts`

### Modified
- `src/app/character/character.ts` - Added inventoryManager property
- `src/app/services/character-storage.service.ts` - Added inventory serialization
- `src/app/services/websocket.service.ts` - Added store/item events
- `server/server.js` - Added store/item event handlers
- `src/app/views/gm-dashboard-view/*` - Added item grant and store toggle
- `src/app/views/character-sheet-view/*` - Added inventory view and item grant listener
- `src/app/app.routes.ts` - Added store route
- `src/app/views/sidenav-view/sidenav-view.html` - Added store and GM links

## Currency System
- **Broams** (spheres): 1 broam = base unit
- **Marks** (chips): 1 mark = 5 broams
- **Chips** (tiny spheres): 1 chip = 0.2 broams

Converter allows players to input mixed denominations and see total value.

## Special Item Warnings
GM sees warning boxes when granting:
- **Reward-Only Items**: "This is a reward-only item (Shardblade, Shardplate, etc.) and should only be granted for significant achievements or major story moments."
- **Talent-Only Items**: "This item is typically granted through character advancement (talent unlocks or Radiant progression)."

## Equipment Bonuses
Items automatically apply stat bonuses when equipped:
- Weapons: Attack bonuses, damage, traits
- Armor: Deflect (damage reduction)
- Accessories: Various stat boosts
- Fabrials: Charges and special effects

Bonuses are removed when unequipped, following the same pattern as talents.

## Auto-Save
Character auto-saves every 30 seconds, including inventory changes.
