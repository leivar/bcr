import { prisma } from "../../prisma";

export async function createMessage(userId: string, text: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentRoomId: true } });
  if (!user?.currentRoomId) throw new Error("Not in a room");
  return prisma.message.create({
    data: { roomId: user.currentRoomId, senderId: userId, text },
  });
}

export async function getRecentMessages(roomId: string, limit = 50, before?: Date) {
  return prisma.message.findMany({
    where: { roomId, sentAt: before ? { lt: before } : undefined },
    orderBy: { sentAt: "desc" },
    take: limit,
  });
}
