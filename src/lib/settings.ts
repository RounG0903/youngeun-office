import { prisma } from "@/lib/prisma";

const CONFIG_ID = "default";

export async function getSystemConfig() {
  let config = await prisma.systemConfig.findUnique({ where: { id: CONFIG_ID } });
  if (!config) {
    config = await prisma.systemConfig.create({
      data: { id: CONFIG_ID, tabletCheckinEnabled: true },
    });
  }
  return config;
}

export async function isTabletCheckinEnabled(): Promise<boolean> {
  const config = await getSystemConfig();
  return config.tabletCheckinEnabled;
}

export async function setTabletCheckinEnabled(enabled: boolean) {
  return prisma.systemConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, tabletCheckinEnabled: enabled },
    update: { tabletCheckinEnabled: enabled },
  });
}
