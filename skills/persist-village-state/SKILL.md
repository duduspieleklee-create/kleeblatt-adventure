---
name: "persist-village-state"
description: "Implement persistent village/camp area with state tracking and player spawning logic"
---

# Persist Village State

When implementing a persistent village/camp area in a game, this skill covers the complete workflow for creating a persistent starting area with proper state management, player spawning, and safe zone detection.

## When to Use
Use this skill when implementing persistent starting areas, welcome villages, or camp sites that need to track player visits, maintain state across sessions, and provide consistent gameplay experiences.

## Procedure Steps
1. **Initialize Persistent State Service**
   - Ensure WorldStateService is available with village-specific methods
   - Create or retrieve village map data using `getOrCreateVillageMap()`
   - Initialize village-specific properties in game scene

2. **Implement Village State Loading**
   - Add village state loading method to game scene
   - Load persistent village data including visitation status
   - Set up village boundary coordinates and dimensions

3. **Configure Player Spawning Logic**
   - Modify player spawn point based on visitation status
   - Place player at village center on first visit
   - Set default spawn location for returning players

4. **Implement Safe Zone Detection**
   - Add boundary detection for village safe zone
   - Prevent enemy spawning within village boundaries
   - Allow normal gameplay outside village boundaries

5. **Connect to API Endpoints**
   - Use existing village API endpoints for state management
   - Implement visit tracking via `POST /world-state/village/visit`
   - Retrieve village state via `GET /world-state/village`

## Evidenced Pitfalls
- **Incomplete API Integration**: Failing to connect to actual API endpoints results in simulated state instead of real persistence
- **Boundary Detection Issues**: Incorrect distance calculations cause enemies to spawn in wrong locations
- **State Conflicts**: Not properly distinguishing between first-time and returning players leads to incorrect spawning
- **Missing Error Handling**: API failures without fallbacks break gameplay flow

## Verification Step
Test the complete flow by:
1. Starting game as new player → should spawn at village center
2. Visiting village → should track visitation
3. Returning to game → should spawn at village center
4. Entering safe zone → enemies should not spawn
5. Leaving safe zone → normal enemy spawning resumes
