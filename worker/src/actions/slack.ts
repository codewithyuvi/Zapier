import axios from "axios";
import { parseDynamicData } from "../parser";

export async function executeSlack(config: any, webhookPayload: any) {
  console.log(`💬 SIMULATED: Sending Slack message...`);
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!slackWebhookUrl) {
    throw new Error("Slack Webhook URL is missing!");
  }

  const rawMessage = config?.message || `🚀 *New Zap Executed!*\n\nPayload received: ${JSON.stringify(webhookPayload)}`;
  const slackMessage = parseDynamicData(rawMessage, webhookPayload);

  try {
    await axios.post(slackWebhookUrl, { text: slackMessage });
    console.log(`💬 REAL SLACK MESSAGE SENT!`);
  } catch (slackError) {
    console.error("Failed to send Slack message", slackError);
    throw new Error("Slack action failed");
  }
}