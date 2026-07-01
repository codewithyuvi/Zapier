import { Kafka } from "kafkajs";
import { db, actions } from "@zapier/database";
import { eq, asc } from "drizzle-orm";

const kafka = new Kafka({
  clientId: "zapier-processor",
  brokers: ["localhost:9092"],
  retry: {
    initialRetryTime: 300, // Wait 300ms before the first retry
    retries: 5, // Try connecting 5 times before finally throwing an error
  },
});

// We use a Consumer to PULL messages off the queue.
// The groupId ensures that if we run 5 processors, each message only goes to 1 of them!
const consumer = kafka.consumer({ groupId: "main-worker-group" });
async function processZapEvent(messageValue: Buffer) {
  let event;

  // 1. Parse JSON safely. If this fails, it's a poison pill message—don't retry it.
  try {
    event = JSON.parse(messageValue.toString());
  } catch (parseError) {
    console.error("Malformed JSON message received. Skipping.", parseError);
    return;
  }
  const zapId = event.zapId;
  const webhookPayload = event.payload;
  console.log(`Processing Zap ID: ${zapId}`);
  console.log(`Webhook Payload:`, webhookPayload);
  // Fetch all the actions this Zap is supposed to execute, ordered correctly
  const zapActions = await db
    .select()
    .from(actions)
    .where(eq(actions.zapId, zapId))
    .orderBy(asc(actions.actionOrder));

  if (zapActions.length === 0) {
    console.log("No actions found for this Zap!");
    return;
  }
  for (const action of zapActions) {
    console.log(
      `Executing step ${action.actionOrder}: ${action.availableActionsId}`,
    );

    try{

        if (action.availableActionsId === "email") {
            const emailTo = (action.config as any)?.to || "unknown@example.com";
            console.log(`✉️ SIMULATED: Sending email to ${emailTo}`);
        } else if (action.availableActionsId === "slack") {
            console.log(`💬 SIMULATED: Sending Slack message...`);
        }
    } catch(actionError){
        console.error(`Action step ${action.actionOrder} failed:`, actionError);
    }
  }
}
async function startProcessor() {
  try {
    console.log("Processor connecting to kafka...");
    await consumer.connect();
    console.log("Subscribing to topic...");
    await consumer.subscribe({ topic: "zap-events", fromBeginning: true });
    console.log("Consumer running. Waiting for messages...");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        await processZapEvent(message.value);
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

startProcessor();
