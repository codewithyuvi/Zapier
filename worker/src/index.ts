import { Kafka } from "kafkajs";
import { db, actions, triggerOutbox, zapRuns } from "@zapier/database";
import { eq, asc } from "drizzle-orm";
import nodemailer from 'nodemailer';

const TOPIC_NAME  = "zap-events" ;

const kafka = new Kafka({
  clientId: "zapier-worker",
  brokers: ["localhost:9092"],
  retry: {
    initialRetryTime: 300, // Wait 300ms before the first retry
    retries: 5, // Try connecting 5 times before finally throwing an error
  },
});

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

try {
  await transporter.verify();
  console.log("Server is ready to take our messages");
} catch (err) {
  console.error("Verification failed:", err);
}

// We use a Consumer to PULL messages off the queue.
// The groupId ensures that if we run 5 processors, each message only goes to 1 of them!
const consumer = kafka.consumer({ groupId: "main-worker-group" });
async function processZapEvent(messageValue: Buffer) {
  let event;

  // Parse JSON safely. If this fails, it's a poison pill message—don't retry it.
  try {
    event = JSON.parse(messageValue.toString());
  } catch (parseError) {
    console.error("Malformed JSON message received. Skipping.", parseError);
    return;
  }
  const zapId = event.zapId;
  const webhookPayload = event.payload;

  const [run] = await db.insert(zapRuns).values({
    zapId: zapId,
    payload: webhookPayload,
    status: 'processing'
  }).returning({ id: zapRuns.id });

  // Fetch all the actions this Zap is supposed to execute, ordered correctly

  try{

    const zapActions = await db
    .select()
    .from(actions)
    .where(eq(actions.zapId, zapId))
    .orderBy(asc(actions.actionOrder));
    
    if (zapActions.length === 0) {
      console.log("No actions found for this Zap!");
      await db.update(zapRuns).set({ status: 'success', completedAt: new Date() }).where(eq(zapRuns.id, run.id));
      return;
    }
    for (const action of zapActions) {
      console.log(
        `Executing step ${action.actionOrder}: ${action.availableActionsId}`,
      );
      
      
      if (action.availableActionsId === "email") {
        const emailTo = (action.config as any)?.to || "unknown@example.com";
        console.log(`✉️ SIMULATED: Sending email to ${emailTo}`);
      } else if (action.availableActionsId === "slack") {
        console.log(`💬 SIMULATED: Sending Slack message...`);
      }
    }
      console.log(`Zap Run ${run.id} Completed Successfully!`);
      await db.update(zapRuns).set({ 
          status: 'success', 
          completedAt: new Date() 
      }).where(eq(zapRuns.id, run.id)); 

  } catch (actionError: any){
      console.error(`❌ Zap Run ${run.id} Failed:`, actionError);
      await db.update(zapRuns).set({ 
          status: 'failed', 
          errorMessage: actionError.message || 'Unknown error',
          completedAt: new Date()
      }).where(eq(zapRuns.id, run.id));
    }
}
async function startWorker() {
  try {
    console.log("Worker connecting to kafka...");
    await consumer.connect();
    console.log("Subscribing to topic...");
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
    console.log("Consumer running. Waiting for messages...");

    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        await processZapEvent(message.value);
        
        await new Promise(r => setTimeout(r, 2000));

        await consumer.commitOffsets([{
          topic: TOPIC_NAME,
          partition: partition,
          offset: (parseInt(message.offset) + 1).toString()
        }])
      },
    });

  } catch (err) {
    console.error("Failed to run consumer:", err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// Graceful shutdown handling for container orchestration platforms (Docker, K8s, PM2)
const errorTypes = ['SIGINT', 'SIGTERM', 'QUIT'];
errorTypes.forEach(type => {
  process.on(type, async () => {
    try {
      console.log(`\nReceived ${type}. Disconnecting Kafka consumer cleanly...`);
      await consumer.disconnect();
      console.log("👋 Disconnected safely. Exiting process.");
      process.exit(0);
    } catch (err) {
      console.error("Error during graceful shutdown:", err);
      process.exit(1);
    }
  });
});

startWorker();
