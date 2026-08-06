# Village Implementation Plan

## Current State Analysis
Looking at the existing match-scene.ts, I can see:
1. There's already a village implementation in the `createVillage()` method (lines ~230-300)
2. The village is currently hardcoded with fixed positions
3. There's no persistent state loading mechanism yet

## Required Enhancements

### 1. API Integration for Village State
The API endpoints already exist:
- GET `/world-state/village` - Retrieves village state
- POST `/world-state/village/visit` - Tracks player visitation

### 2. MatchScene Integration Requirements

#### Player Spawning Logic
- Modify `createPlayer()` to spawn at village center on first login
- Track whether player has visited village using API calls
- Store visitation state in persistent storage

#### Safe Zone Implementation
- Implement village boundary detection
- Prevent enemy spawning within village safe zone
- Allow player movement throughout village

#### Village Data Persistence
- Load village configuration from API on scene start
- Store village-specific data in persistent world state
- Handle player visitation tracking

## Implementation Steps

### Step 1: Add Village State Loading
Add method to load village state from API and handle visitation tracking

### Step 2: Modify Player Spawning
Modify `createPlayer()` to spawn at village center when appropriate

### Step 3: Implement Safe Zone Logic
Add boundary detection to prevent enemy spawning in village

### Step 4: Update Game Bridge Events
Ensure proper event handling for village-related game events

## Technical Approach

1. **API Communication**: Use existing API endpoints to communicate with backend
2. **State Management**: Integrate with existing `WorldStateService` patterns
3. **Persistence**: Leverage existing database schema for village data
4. **UI Feedback**: Provide visual cues for village boundaries and landmarks

## Key Considerations

1. **Backward Compatibility**: Ensure existing functionality isn't broken
2. **Performance**: Minimize API calls during gameplay
3. **Error Handling**: Gracefully handle API failures
4. **Consistency**: Follow existing code patterns and conventions