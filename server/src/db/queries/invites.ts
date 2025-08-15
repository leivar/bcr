import { prisma } from "../../prisma";
import crypto from "crypto";

export async function createInvite(roomId: string, createdById: string, ttlSeconds = 3600) {
  const code = crypto.randomBytes(8).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return prisma.invite.create({ data: { code, roomId, createdById, expiresAt } });
}

export async function resolveInviteAndConsume(code: string, userId: string) {
  const invite = await prisma.invite.findUnique({ where: { code } });
  if (!invite) throw new Error("Invalid invite");
  if (invite.expiresAt < new Date()) throw new Error("Invite expired");
  if (invite.usedAt) throw new Error("Invite already used");

  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedAt: new Date(), usedById: userId },
  });

  return invite.roomId;
}
