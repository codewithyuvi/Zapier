import axios from "axios";
import { parseDynamicData } from "../parser";

export async function executeDiscordAi(config: any, webhookPayload: any) {
  console.log(`🤖 Executing Discord AI action...`);
  
  const webhookUrl = config?.webhookUrl;
  
  if (!webhookUrl) {
    throw new Error("Discord Webhook URL is missing from config!");
  }

  // The frontend currently passes the raw payload body. 
  // We extract it and can send it to Gemini.
  const inputData = parseDynamicData("{payload.body}", webhookPayload);
  
  // TODO: Add actual Gemini AI API call here.
  // For now, we simulate the AI response by wrapping the input data.
  const simulatedAiSummary = `**AI Summary (Placeholder):**\n\nI received the following data:\n\`\`\`json\n${inputData}\n\`\`\`\n*(Gemini API integration pending)*`;

  try {
    await axios.post(webhookUrl, { content: simulatedAiSummary });
    console.log(`🤖 Discord message sent successfully!`);
  } catch (error) {
    console.error("Failed to send Discord AI message", error);
    throw new Error("Discord AI action failed");
  }
}
