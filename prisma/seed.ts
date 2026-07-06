import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const rooms = ["회의실 A", "회의실 B", "세미나실"];
  for (const name of rooms) {
    await prisma.meetingRoom.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminPin = "0000";
  const pinHash = await bcrypt.hash(adminPin, 10);
  await prisma.user.upsert({
    where: { name: "Youngeun Admin" },
    update: { pinHash, pinPlain: adminPin, role: "ADMIN" },
    create: {
      name: "Youngeun Admin",
      pinHash,
      pinPlain: adminPin,
      role: "ADMIN",
    },
  });

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
