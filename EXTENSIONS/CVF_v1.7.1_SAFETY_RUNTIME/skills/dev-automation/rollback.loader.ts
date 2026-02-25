import { prisma } from "@/lib/db";

export async function getRollbackSnapshot(id: string) {
  return prisma.rollbackSnapshot.findUnique({
    where: { id },
  });
}