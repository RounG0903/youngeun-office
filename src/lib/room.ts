export const ROOM_COLOR_PALETTE = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
] as const;

export function pickRoomColorByIndex(index: number): string {
  return ROOM_COLOR_PALETTE[index % ROOM_COLOR_PALETTE.length];
}

export function isValidRoomColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export type RoomDisplay = {
  id: string;
  name: string;
  locationDescription?: string | null;
  color?: string | null;
};

export function getRoomColor(room: { id: string; color?: string | null }, index = 0): string {
  if (room.color && isValidRoomColor(room.color)) return room.color;
  return pickRoomColorByIndex(index);
}
