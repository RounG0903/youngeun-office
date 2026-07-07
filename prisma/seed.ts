import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { pickRoomColorByIndex } from "../src/lib/room";
import {
  assignUserNumbersToExistingUsers,
  SERVER_ADMIN_USER_NUMBER,
} from "./assign-user-numbers";

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
    await prisma.user.delete({ where: { name: "admin" } });
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
