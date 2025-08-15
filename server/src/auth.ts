import { sign, verify, type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { Socket } from "socket.io";
import { SocketData } from "./types";

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? "dev_only") as Secret;

export interface AuthTokenPayload extends JwtPayload { sub: string }
export type JwtExpires = SignOptions["expiresIn"]; // number | StringValue

export function signUserToken(userId: string, expiresIn: JwtExpires = "7d") {
  const options: SignOptions = { expiresIn };
  return sign({ sub: userId } as AuthTokenPayload, JWT_SECRET, options);
}

export function verifyUserToken(token: string): AuthTokenPayload {
  return verify(token, JWT_SECRET) as AuthTokenPayload;
}

// middleware for authentication
export function socketAuthMiddleware(
  socket: Socket<any, any, any, SocketData>,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    const payload = verifyUserToken(token);
    socket.data.userId = payload.sub;
    next();
  } catch (e) {
    next(new Error("Invalid auth token"));
  }
}