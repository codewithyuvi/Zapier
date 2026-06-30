import { initTRPC, TRPCError } from "@trpc/server";
import { users } from "@zapier/database";

export const t = initTRPC.context<{userId? : string}>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware( ({next, ctx}) => {
    //will write jwt logic here later

    if(!ctx.userId){
        throw new TRPCError({code: 'UNAUTHORIZED'});
    }

    return next({
        ctx: {
            userId: parseInt(ctx.userId)
        }
    })
} )

export const protectedProcedure = t.procedure.use(isAuthed);
