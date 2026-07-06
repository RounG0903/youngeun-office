import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    phone: true,
    role: true,
    pinPlain: true,
    checkinRequired: true,
    penaltyUntil: true,
    room: { select: { name: true } },
    createdAt: true,
  },
  orderBy: { createdAt: "asc" },
});

const counts = {
  users: users.length,
  byRole: Object.groupBy(users, (u) => u.role),
};

console.log("=== 계정 수 ===");
console.log(`총 ${users.length}명`);
for (const role of ["ADMIN", "USER", "TABLET"]) {
  console.log(`  ${role}: ${users.filter((u) => u.role === role).length}명`);
}

console.log("\n=== 계정 목록 ===");
for (const user of users) {
  console.log(
    [
      `[${user.role}]`,
      user.name,
      user.phone ?? "(전화번호 없음)",
      user.pinPlain ? `PIN:${user.pinPlain}` : "PIN:(해시만)",
      user.room?.name ? `회의실:${user.room.name}` : "",
      user.checkinRequired ? "체크인필요" : "체크인면제",
      user.penaltyUntil ? `패널티~${user.penaltyUntil.toISOString()}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  );
}

await prisma.$disconnect();
