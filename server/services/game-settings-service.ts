import { getGameSettings, saveGameSettings, GameSettingsRecord } from '../database';

export async function getSettings(): Promise<GameSettingsRecord> {
  return getGameSettings();
}

export async function updateSettings(patch: Partial<GameSettingsRecord>): Promise<GameSettingsRecord> {
  if (patch.sellPercent !== undefined) {
    const clamped = Math.min(100, Math.max(0, Math.round(patch.sellPercent)));
    patch = { ...patch, sellPercent: clamped };
  }
  return saveGameSettings(patch);
}
