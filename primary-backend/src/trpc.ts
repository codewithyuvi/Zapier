import { initTRPC, TRPCError } from "@trpc/server";
import { users } from "@zapier/database";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

export const t = initTRPC.context<{ token?: string }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  try {
    const payload = jwt.verify(ctx.token, JWT_SECRET) as { userId: number };
    return next({
      ctx: {
        userId: payload.userId,
      },
    });
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
});

export const protectedProcedure = t.procedure.use(isAuthed);
