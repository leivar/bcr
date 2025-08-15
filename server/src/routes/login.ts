import { Router } from "express";
import { signUserToken } from "../auth";
import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

const router = Router();

router.post("/login", async (req, res) => {
  const userId = String(req.body?.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "userId required" });

  // Ensure user exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  const token = signUserToken(userId);
  res.json({ token });
});

export default router;
