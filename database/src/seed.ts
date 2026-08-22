import { db } from "./db.js";
import { availableActions, availableTriggers, users, zaps, triggers, actions } from "./schema.js";
import { eq } from 'drizzle-orm';

async function main() {
    try {
        // await db.delete(zaps)
        // await db.delete(triggers)
        // await db.delete(actions)
        // await db.delete(users)
        // await db.delete(availableActions)
        // await db.delete(availableTriggers)

        await db.insert(users).values({
            name: 'Yuvi',
            email: 'yuvi.1783079131976@example.com'
        }).onConflictDoNothing()
        console.log("user created")
        
        await db.insert(availableTriggers).values({
            id: 'webhook',
            name: 'Webhook'
        }).onConflictDoNothing()
        console.log("trigger created")
        
        await db.insert(availableActions).values([
            {id: 'email', name: 'Email'},
            {id: 'slack', name: 'Slack'},
            {id: 'discord_ai', name: 'Discord AI'}
        ]).onConflictDoNothing()
        
                // 1. Add 'gmail' to the available triggers
        await db.insert(availableTriggers).values({
            id: 'gmail',
            name: 'Gmail'
        }).onConflictDoNothing();
        console.log("gmail trigger available");

        const existingUser = await db.select().from(users).where(eq(users.email, 'yuvi.1783079131976@example.com')).limit(1);
        const actualUserId = existingUser[0]!.id;

        // 2. Create a test Zap for User 1
        const newZap = await db.insert(zaps).values({
            userId: actualUserId,
            title: 'Test Gmail to Discord Zap',
            isActive: 'true'
        }).returning({ id: zaps.id });
        const zapId = newZap[0]!.id;
        console.log(`Created test Zap with ID: ${zapId}`);

        // 3. Attach the Gmail trigger to that Zap
        await db.insert(triggers).values({
            zapId: zapId,
            availableTriggersId: 'gmail'
        }).onConflictDoNothing();
        console.log("Attached gmail trigger to Zap");
        console.log("action created")

        process.exit(0)
    } catch (error) {
        console.error("seeding failed", error)
        process.exit(1)
    }

} 

main()