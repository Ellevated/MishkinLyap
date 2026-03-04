/**
 * Module: GameEvents
 * Role: ALL event name constants — single source of truth
 * Uses: nothing (leaf module)
 * Used by: game/, scenes/
 * Does NOT: contain logic, emit events
 */

export const EVENTS = {
  ANIMAL_MERGED: 'animal-merged',
  ANIMAL_DROPPED: 'animal-dropped',
  DROP_REQUESTED: 'drop-requested',
  SCORE_UPDATED: 'score-updated',
  GAME_OVER: 'game-over',
  SCENE_GAME_OVER: 'scene-game-over',
  SCENE_RESTART: 'scene-restart',
  SCENE_MENU: 'scene-menu',
  AD_STARTED: 'ad-started',
  AD_ENDED: 'ad-ended',
} as const;
