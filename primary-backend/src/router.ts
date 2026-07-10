import {config, z} from "zod";
import { router, protectedProcedure, publicProcedure } from "./trpc.js";
import {db,zaps,triggers, actions, users, availableActions, availableTriggers , zapRuns} from '@zapier/database';
import { eq, desc } from "drizzle-orm";

export const appRouter = router({

    createUser: publicProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      const result = await db.insert(users).values(input).returning();
      return result[0];
    }),

    //creating a new endpoint named 'createZap'
    // We use protectedProcedure, so it will fail if the user is not authenticated
    createZap: protectedProcedure
        .input(z.object({
            title: z.string().min(1),
            trigger: z.object({
                availableTriggerId: z.string(),
                config: z.any().optional()
            }),
            actions: z.array(z.object({
                availableActionId: z.string(),
                config: z.any().optional()
            })).min(1)

        }))
        //.mutation() is the actual function that runs if authentication AND validation pass
        // We destructure 'ctx' (which has our verified userId) and 'input' (which has our validated data)
        .mutation(async ({ctx, input}) => {
            // We start a Database Transaction. 'tx' is our transactional database object.
      // If ANY query using 'tx' fails, Postgres will undo ALL of them instantly.
            
            const zapId = await db.transaction(async (tx) => {

                // Insert the main Zap row.
                const [zap] = await tx.insert(zaps).values({
                    userId: ctx.userId,
                    title: input.title,
                    isActive: 'true'
                }).returning({id: zaps.id})


                // Insert the Trigger row, linking it to the Zap we just created (zap.id)
                await tx.insert(triggers).values({
                    zapId: zap!.id,
                    availableTriggersId: input.trigger.availableTriggerId,
                    config: input.trigger.config || {}
                })

                // Since 'actions' is an array, we map over it to create an array of insert Promises
                const actionPromises = input.actions.map((action, index) => {
                    return tx.insert(actions).values({
                        zapId: zap!.id,
                        actionOrder: index+1,
                        availableActionsId: action.availableActionId,
                        config: action.config || {}
                    })
                });

                await Promise.all(actionPromises);

                return zap!.id;
            })


            return {success : true, zapId};
        }),
    
    getAvailableTriggers: publicProcedure
        .query(async () => {
            const trigger = await db.select().from(availableTriggers);
            return trigger;
        }),
    
    getAvailableActions: publicProcedure
        .query(async () => {
            const action = await db.select().from(availableActions);
            return action;
        }),
    
    getZaps: protectedProcedure
        .query(async ({ctx}) => {
            const userZaps = await db.query.zaps.findMany({
                where: (zaps, {eq}) => eq(zaps.userId, ctx.userId),
                with: {
                    trigger: {
                        with: {
                            availableTrigger: true
                        }
                    },
                    actions: {
                        with: {
                            availableAction: true
                        }
                    }
                },
                orderBy: (zaps, { desc }) => [desc(zaps.createdAt)]
            })
            return userZaps;
        }),
    
    getZapRuns: protectedProcedure
        .query(async ({ctx}) => {
            // We join zapRuns and zaps together so we can filter by the user's ID
            // and so we can return the Zap's title along with the run data!
            const runs = await db.select({
                id: zapRuns.id,
                zapId: zapRuns.zapId,
                status: zapRuns.status,
                payload: zapRuns.payload,
                createdAt: zapRuns.createdAt,
                completedAt: zapRuns.completedAt,
                errorMessage: zapRuns.errorMessage,
                zapTitle: zaps.title,
            })
            .from(zapRuns)
            .innerJoin(zaps, eq(zapRuns.zapId, zaps.id))
            .where(eq(zaps.userId, ctx.userId))
            .orderBy(desc(zapRuns.createdAt));
            return runs;
        }),

});

export type AppRouter = typeof appRouter;