import { prisma } from "../../prisma";


export async function createRoom(ownerId: string, name?: string) {
  const room = await prisma.room.create({
    data: {
      name,
      owner: {
        connectOrCreate: {
          where: { id: ownerId },
          create: { id: ownerId },
        },
      },
    },
  });

  // Move the user into this room (one-at-a-time membership)
  await prisma.$transaction(async (tx) => {
    // close any open ledger on a previous room
    const user = await tx.user.findUnique({
      where: { id: ownerId },
      select: { currentRoomId: true },
    });

    if (user?.currentRoomId) {
      await tx.roomMember.updateMany({
        where: { userId: ownerId, roomId: user.currentRoomId, leftAt: null },
        data: { leftAt: new Date() },
      });
    }

    // set current room and ensure an open membership row
    await tx.user.update({
      where: { id: ownerId },
      data: {
        currentRoomId: room.id,
        memberships: { create: { roomId: room.id } },
      },
    });
  });

  return room;
}

export async function joinRoom(userId: string, targetRoomId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { currentRoomId: true } });
    if (!user) throw new Error("User not found");

    // Close previous open ledger
    if (user.currentRoomId && user.currentRoomId !== targetRoomId) {
      await tx.roomMember.updateMany({
        where: { userId, roomId: user.currentRoomId, leftAt: null },
        data: { leftAt: new Date() },
      });
    }

    // Switch current room
    await tx.user.update({ where: { id: userId }, data: { currentRoomId: targetRoomId } });

    // Ensure an open ledger for target exists
    const open = await tx.roomMember.findFirst({
      where: { userId, roomId: targetRoomId, leftAt: null },
      select: { id: true },
    });
    if (!open) {
      await tx.roomMember.create({ data: { userId, roomId: targetRoomId } });
    }

    const members = await tx.user.findMany({
      where: { currentRoomId: targetRoomId },
      select: { id: true },
    });

    return members.map((m) => m.id);
  });
}

export async function leaveCurrentRoom(userId: string) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { currentRoomId: true } });
    if (!user?.currentRoomId) return;

    await tx.roomMember.updateMany({
      where: { userId, roomId: user.currentRoomId, leftAt: null },
      data: { leftAt: new Date() },
    });

    await tx.user.update({ where: { id: userId }, data: { currentRoomId: null } });
  });
}

export async function getRoomMembers(roomId: string) {
  const users = await prisma.user.findMany({ where: { currentRoomId: roomId }, select: { id: true } });
  return users.map((u) => u.id);
}
