import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  assignUserNumbersToExistingUsers,
  SERVER_ADMIN_USER_NUMBER,
} from "./assign-user-numbers";

const ROOM_COLOR_PALETTE = [
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
];

function pickRoomColorByIndex(index: number): string {
  return ROOM_COLOR_PALETTE[index % ROOM_COLOR_PALETTE.length];
}

const prisma = new PrismaClient();

const ROOM_SEEDS = [
  { name: "회의실 A", locationDescription: "2층 복도 끝, 엘리베이터 오른쪽" },
  { name: "회의실 B", locationDescription: "3층 중앙, 라운지 맞은편" },
  { name: "세미나실", locationDescription: "1층 로비 안쪽, 안내 데스크 뒤" },
];

async function main() {
  for (const [index, room] of ROOM_SEEDS.entries()) {
    await prisma.meetingRoom.upsert({
      where: { name: room.name },
      update: {
        locationDescription: room.locationDescription,
        color: pickRoomColorByIndex(index),
      },
      create: {
        name: room.name,
        locationDescription: room.locationDescription,
        color: pickRoomColorByIndex(index),
      },
    });
  }

  const adminPin = "0000";
  const pinHash = await bcrypt.hash(adminPin, 10);
  await prisma.user.upsert({
    where: { name: "Youngeun Admin" },
    update: {
      pinHash,
      pinPlain: adminPin,
      role: "ADMIN",
      isServerAdmin: true,
      userNumber: SERVER_ADMIN_USER_NUMBER,
    },
    create: {
      name: "Youngeun Admin",
      pinHash,
      pinPlain: adminPin,
      role: "ADMIN",
      isServerAdmin: true,
      userNumber: SERVER_ADMIN_USER_NUMBER,
    },
  });

  await assignUserNumbersToExistingUsers(prisma);

  const legacyAdmin = await prisma.user.findUnique({ where: { name: "admin" } });
  if (legacyAdmin?.role === "ADMIN") {
    try {
      await prisma.user.delete({ where: { name: "admin" } });
    } catch (error) {
      console.warn("Legacy admin account delete skipped:", error);
    }
  }

  await prisma.systemConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", tabletCheckinEnabled: true },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
