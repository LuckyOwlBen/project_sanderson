# Combat System Implementation Guide

## Overview

This document describes the complete implementation of the turn-based combat system for the Sanderson RPG, including GM controls, player turn selection, NPC management, and real-time WebSocket synchronization.

## Architecture

### Components

#### 1. **CombatService** (`src/app/services/combat.service.ts`)
Core service managing combat state and logic.

**Key Responsibilities:**
- Track combat active/inactive state
- Manage player turn speed selections (fast/slow)
- Manage NPC cards and their turn speeds
- Organize players and NPCs into turn groups
- Emit events on state changes

**Key Methods:**
```typescript
// Combat Toggle
toggleCombat(active: boolean): void
isCombatActive(): boolean

// Player Turn Speed
setTurnSpeed(characterId: string, turnSpeed: 'fast' | 'slow'): void
getTurnSpeed(characterId: string): 'fast' | 'slow' | null
clearTurnSpeed(characterId: string): void

// NPC Management
addNPCCard(id: string, name: string, count: number): void
removeNPCCard(id: string): void
getNPCCard(id: string): NPCCard | undefined
getNPCCards(): NPCCard[]
updateNPCCardCount(id: string, count: number): void

// NPC Turn Speed
setNPCTurnSpeed(npcId: string, turnSpeed: 'fast' | 'slow'): void
getNPCTurnSpeed(npcId: string): 'fast' | 'slow' | null

// Turn Groups
getTurnGroups(): TurnGroup
clearCombatState(): void
```

**Events Emitted:**
- `combatActive$`: BehaviorSubject tracking combat state
- `turnSpeedChanged$`: Subject emitting turn speed changes
- `npcCardAdded$`: Subject emitting when NPC cards are added
- `npcCardRemoved$`: Subject emitting when NPC cards are removed

#### 2. **CombatTurnSpeedSelectorComponent** (`src/app/components/combat-turn-speed-selector/`)
Player-facing component for selecting turn speed during combat.

**Features:**
- Fixed position box (bottom-right) that appears when combat is active
- Two buttons for "Fast Turn" (2 actions) and "Slow Turn" (3 actions)
- Visual feedback showing selected turn speed
- Only emits WebSocket events when speed actually changes
- Persists selection until changed

**Display:**
```
⚔️ Combat Active
[⚡ Fast Turn] [📋 Slow Turn]

⚡ Fast Turn: 2 actions + 1 reaction
```

#### 3. **CombatPanelComponent** (`src/app/views/combat-panel/`)
GM-facing component for combat control and NPC management.

**Features:**
- Combat toggle switch (on/off)
- NPC card creation with name and count
- NPC turn speed assignment (fast/slow)
- NPC count updates
- NPC removal
- Turn order display with section headers and Material dividers:
  - ⚡ Fast PC Turns (2 Actions)
  - ⚡ Fast NPC Turns (2 Actions)
  - 📋 Slow PC Turns (3 Actions)
  - 📋 Slow NPC Turns (3 Actions)
  - ⏳ Awaiting Selection (uninitialized players)

**Display Layout:**
```
⚔️ Combat Control Panel [Toggle: COMBAT ACTIVE]

🧌 Add Opponents
[NPC Type Input] [Count: 1] [Add Button]

NPC Cards (if any):
┌─ Goblin Scout [3 enemies] [⚡] [📋] [Count: 5] [Delete]
└─ ...

📋 Turn Order
⚡ Fast PC Turns (2 Actions)
  [Player1] [Player2]
...
```

### WebSocket Service Extensions

New event interfaces and emit methods added to `src/app/services/websocket.service.ts`:

**New Interfaces:**
```typescript
interface CombatStartEvent {
  timestamp: string;
}

interface TurnSpeedSelectionEvent {
  characterId: string;
  turnSpeed: 'fast' | 'slow';
  timestamp: string;
}

interface TurnGroupsUpdateEvent {
  fastPC: string[];
  fastNPC: string[];
  slowPC: string[];
  slowNPC: string[];
  timestamp: string;
}
```

**New Observable Streams:**
- `combatStart$`: Fires when combat starts
- `turnSpeedSelection$`: Fires when a player selects turn speed
- `turnGroupsUpdate$`: Fires when turn groups are updated

**New Emit Methods:**
```typescript
startCombat(): void
selectTurnSpeed(characterId: string, turnSpeed: 'fast' | 'slow'): void
```

### Server-Side Handlers

New socket event handlers added to `server/server.js`:

```javascript
// Combat initiation
socket.on('gm-start-combat', ({ timestamp }) => {
  // Broadcasts 'combat-start' to all clients
})

// Turn speed selection
socket.on('player-select-turn-speed', ({ characterId, turnSpeed, timestamp }) => {
  // Broadcasts 'turn-speed-selection' to all clients
})
```

## Data Flow

### Combat Start Flow
1. GM clicks "Combat On" toggle on CombatPanelComponent
2. CombatService.toggleCombat(true) is called
3. CombatPanelComponent emits `websocketService.startCombat()`
4. Server receives 'gm-start-combat' event
5. Server broadcasts 'combat-start' to all clients
6. CombatTurnSpeedSelectorComponent becomes visible on all player screens

### Turn Speed Selection Flow
1. Player clicks "Fast Turn" or "Slow Turn" button
2. Component calls `selectSpeed(speed)`
3. CombatService.setTurnSpeed() is called (only if changed)
4. If speed changed, emit `websocketService.selectTurnSpeed()`
5. Server receives 'player-select-turn-speed' event
6. Server broadcasts 'turn-speed-selection' to all clients
7. GM sees turn groups reorganized on CombatPanelComponent
8. Service emits turnSpeedChanged$ event (only on actual change)

### NPC Management Flow
1. GM enters NPC name and count on CombatPanelComponent
2. GM clicks "Add" button
3. Component calls `addNPCCard()`
4. CombatService generates unique NPC ID and stores card
5. Component displays NPC card with fast/slow/delete buttons
6. GM can adjust turn speed or count in real-time
7. Turn groups automatically reorganize when NPC speed is set

## Integration Points

### In GM Dashboard View
```typescript
import { CombatPanelComponent } from './combat-panel/combat-panel.component';

// In your component:
<app-combat-panel [activePlayers]="activePlayers"></app-combat-panel>
```

### In Character Sheet View (Players)
```typescript
import { CombatTurnSpeedSelectorComponent } from '../components/combat-turn-speed-selector/combat-turn-speed-selector.component';

// In your component:
<app-combat-turn-speed-selector [characterId]="characterId"></app-combat-turn-speed-selector>
```

## Testing

### Unit Tests
All components and services include comprehensive unit tests using Vitest and Angular TestBed.

**Test Files:**
- `src/app/services/combat.service.spec.ts`: 25+ tests
- `src/app/components/combat-turn-speed-selector/combat-turn-speed-selector.component.spec.ts`: 12+ tests
- `src/app/views/combat-panel/combat-panel.component.spec.ts`: 18+ tests

**Test Coverage:**
- Combat toggle state
- Turn speed selection (only emits on change)
- NPC card CRUD operations
- Turn group organization
- Event emission
- Error handling (duplicate NPC IDs, missing data)

### Running Tests
```bash
npm test  # Runs all test files
npm test -- combat  # Runs combat-specific tests
```

## Key Design Decisions

### 1. **Persistent Selection Until Change**
Turn speeds persist across interactions and only emit WebSocket events when actually changed. This reduces network traffic and prevents unnecessary server broadcasts.

### 2. **Local State with Real-Time Sync**
CombatService maintains authoritative local state. WebSocket events broadcast changes for other clients to sync. This allows offline operation for single-GM scenarios.

### 3. **Material Design for Consistency**
All UI components use Angular Material components (buttons, cards, dividers) to maintain consistency with existing GM dashboard.

### 4. **Fixed Position Selector**
The player turn selector is positioned bottom-right as a persistent widget rather than a modal, giving it prominence without blocking gameplay.

### 5. **Flexible NPC Management**
NPC cards are independent of player list, allowing GMs to add/remove NPCs dynamically without affecting player character data.

## Turn Structure

Each combat round follows this sequence:

1. **Fast PC Turns** - Players with fast turns take their turns
   - 2 actions + 1 reaction per PC
   
2. **Fast NPC Turns** - NPCs with fast turns take their turns
   - 2 actions + 1 reaction per NPC group
   
3. **Slow PC Turns** - Remaining players take their turns
   - 3 actions + 1 reaction per PC
   
4. **Slow NPC Turns** - Remaining NPCs take their turns
   - 3 actions + 1 reaction per NPC group
   
5. **Begin Next Round** - Cycle repeats until combat ends

## Future Enhancements

Potential features for future iterations:

1. **Turn Tracker Component**: Visual indicator of whose turn it is
2. **Action Counter**: Track actions/reactions per turn
3. **Combat Log**: Record of all actions taken during combat
4. **Initiative System**: Optional init rolls before turn selection
5. **Buffing/Debuffing**: Status effects during combat
6. **Audio Cues**: Sound effects for turn start/end
7. **Mobile Optimizations**: Responsive design for mobile players
8. **Combat History**: Save/replay combat sessions

## API Reference

### CombatService

#### Combat Control
```typescript
toggleCombat(active: boolean): void
isCombatActive(): boolean
clearCombatState(): void
```

#### Player Management
```typescript
setTurnSpeed(characterId: string, turnSpeed: 'fast' | 'slow'): void
getTurnSpeed(characterId: string): 'fast' | 'slow' | null
clearTurnSpeed(characterId: string): void
registerPlayer(characterId: string): void
getUninitializedPlayers(allPlayerIds: string[]): string[]
```

#### NPC Management
```typescript
addNPCCard(id: string, name: string, count: number): void
removeNPCCard(id: string): void
getNPCCard(id: string): NPCCard | undefined
getNPCCards(): NPCCard[]
updateNPCCardCount(id: string, count: number): void
setNPCTurnSpeed(npcId: string, turnSpeed: 'fast' | 'slow'): void
getNPCTurnSpeed(npcId: string): 'fast' | 'slow' | null
```

#### Turn Groups
```typescript
getTurnGroups(): TurnGroup
// Returns:
// {
//   fastPC: string[];      // Character IDs with fast turns
//   fastNPC: string[];     // NPC IDs with fast turns
//   slowPC: string[];      // Character IDs with slow turns
//   slowNPC: string[];     // NPC IDs with slow turns
//   uninitialized: string[] // Character IDs without selection
// }
```

## Troubleshooting

### Combat Selector Not Appearing on Player Screen
- Ensure `CombatTurnSpeedSelectorComponent` is imported in the parent component
- Check that `[characterId]` is properly bound
- Verify WebSocket connection is established
- Check browser console for connection errors

### NPC Cards Not Updating on GM Screen
- Ensure CombatService is injected correctly
- Check for JavaScript errors in browser console
- Verify Material imports are present in CombatPanelComponent
- Check that change detection is properly triggered

### Turn Groups Not Reorganizing
- Verify getNPCTurnSpeed() and getTurnSpeed() return correct values
- Check that CombatService is the same instance across components
- Ensure TurnGroup display is using the latest getTurnGroups() result

## Files Modified/Created

### New Files
- `src/app/services/combat.service.ts`
- `src/app/services/combat.service.spec.ts`
- `src/app/components/combat-turn-speed-selector/combat-turn-speed-selector.component.ts`
- `src/app/components/combat-turn-speed-selector/combat-turn-speed-selector.component.spec.ts`
- `src/app/views/combat-panel/combat-panel.component.ts`
- `src/app/views/combat-panel/combat-panel.component.spec.ts`

### Modified Files
- `src/app/services/websocket.service.ts`: Added combat event interfaces and handlers
- `server/server.js`: Added combat socket event handlers

## References

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Angular Material Components](https://material.angular.io/)
- [Vitest Documentation](https://vitest.dev/)
