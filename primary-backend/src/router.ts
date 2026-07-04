import {config, z} from "zod";
import { router, protectedProcedure, publicProcedure } from "./trpc.js";
import {db,zaps,triggers, actions, users} from '@zapier/database';

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
                    zapId: zap?.id,
                    availableTriggersId: input.trigger.availableTriggerId,
                    config: input.trigger.config || {}
                })

                // Since 'actions' is an array, we map over it to create an array of insert Promises
                const actionPromises = input.actions.map((action, index) => {
                    return tx.insert(actions).values({
                        zapId: zap?.id,
                        actionOrder: index+1,
                        availableActionsId: action.availableActionId,
                        config: action.config || {}
                    })
                });

                await Promise.all(actionPromises);

                return zap?.id;
            })


            return {success : true, zapId};
        }),

});

export type AppRouter = typeof appRouter;