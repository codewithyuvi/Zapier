import { db } from "./db.js";
import { availableActions, availableTriggers, users, zaps, triggers, actions } from "./schema.js";

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
            {id: 'slack', name: 'Slack'}
        ]).onConflictDoNothing()
        
        console.log("action created")
        process.exit(0)
    } catch (error) {
        console.error("seeding failed", error)
        process.exit(1)
    }

} 

main()