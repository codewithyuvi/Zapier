import {Kafka,Partitioners} from 'kafkajs';
import {db, triggerOutbox} from '@zapier/database';
import {eq} from 'drizzle-orm';

const TOPIC_NAME = 'zap-events'

const kafka = new Kafka({
    clientId: 'zapier-sweeper',
    brokers: ['localhost:9092']
});

//push msg on to the queue
const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner
});

// Keep track of whether we are shutting down
let isRunning = true;

async function startSweeper() {

    console.log("sweeper connecting to kafka...");
    try {
        await producer.connect();
        console.log("Sweeper started! Polling database...");
    } catch (err) {
        console.error("Fatal error connecting to Kafka:", err);
        process.exit(1);
    }


    // Infinite loop to constantly check the outbox
    while(isRunning){
        try {

            const pendingEvents = await db
                .select()
                .from(triggerOutbox)
                .where(eq(triggerOutbox.status, 'pending'))
                .limit(10);
            
            if(pendingEvents.length>0){
                console.log(`Found ${pendingEvents.length} pending events. Pushing to Kafka...`);
                
                
                for(const event of pendingEvents){
                    try{

                        // Push the event data onto a Kafka topic named 'zap-events'
                        await producer.send({
                            topic: TOPIC_NAME,
                            messages: [{value: JSON.stringify(event)}]
                        })
                        
                        // Mark the row as 'processed' so we don't send it to Kafka twice!
                        await db.update(triggerOutbox)
                        .set({status: 'processed'})
                        .where(eq(triggerOutbox.id, event.id));

                        await db.delete(triggerOutbox)
                        .where(eq(triggerOutbox.id,event.id))
                        
                        console.log(`Event ID ${event.id} sweeped and sent to Kafka.`);

                    } catch (eventError){
                        console.error(`Failed to process Event ID ${event.id}:`, eventError);
                        await db.update(triggerOutbox)
                            .set({status: 'failed'})
                            .where(eq(triggerOutbox.id, event.id));
                    }
                }
            }
        } catch(error){
            console.error("Critical error in sweeper database loop:", error)
        }

        // Pause for 1.5 seconds before checking the database again to avoid overloading Postgres
        if (isRunning) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
}

// === GRACEFUL SHUTDOWN LOGIC ===
async function shutdown() {
    console.log("\nReceived shutdown signal. Stopping sweeper gracefully...");
    isRunning = false; // Break the infinite loop
    try {
        await producer.disconnect();
        console.log("Disconnected from Kafka safely. Goodbye!");
        process.exit(0);
    } catch (err) {
        console.error("Error during Kafka disconnect:", err);
        process.exit(1);
    }
}

// Listen for Ctrl+C or Docker stop commands
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startSweeper();