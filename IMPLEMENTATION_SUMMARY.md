# Persistent Game World State Implementation

## Overview

This implementation adds persistent game world state management to the Kleeblatt Adventure game. The system allows game state (map layout, enemy positions, treasure locations) to persist between game sessions.

## Key Components

### 1. Database Schema
- **world_maps**: Stores map metadata
- **world_map_tiles**: Stores tile information for each map
- **world_enemies**: Stores enemy positions and state
- **world_chests**: Stores chest states and locations
- **world_npc_positions**: Stores NPC positions

### 2. API Endpoints
- `GET /api/world-state/:mapId` - Retrieve persistent world state
- `POST /api/world-state` - Save persistent world state

### 3. Game Scene Integration
- MatchScene now loads persistent world state on game start
- MatchScene saves world state when exiting
- Support for loading/enemies and chests from persistent storage

## Implementation Details

### Database Migration
Created `apps/api/drizzle/0004_world_state.sql` with all necessary tables and constraints.

### Services
Created `apps/api/src/services/worldState.ts` with methods for:
- Upserting world maps
- Managing map tiles
- Handling enemy positions
- Managing chest states
- Handling NPC positions
- Getting all world state for a map

### API Routes
Created `apps/api/src/routes/worldState.ts` with endpoints for retrieving and saving world state.

### Client Integration
Modified `apps/web/src/game/scenes/match-scene.ts` to:
- Load persistent world state when starting a match
- Save world state when exiting a match
- Create enemies and chests from persistent state if available

### Shared Types
Added `packages/shared/src/types/worldState.ts` with TypeScript interfaces for world state objects.

## Usage Pattern

1. When a player starts a match, the game loads the persistent world state from the database
2. During gameplay, all state changes are tracked
3. When the player exits the match, the current state is saved back to the database
4. On next game start, the previous state is restored

This enables features like:
- Persistent enemy positions that survive game sessions
- Chests that remain opened or closed between sessions
- Player progression tracking across multiple play sessions