import axios from "axios";
import { parseDynamicData } from "../parser";
import { GoogleGenAI } from "@google/genai";

export async function executeDiscordAi(config: any, webhookPayload: any) {
  console.log(`🤖 Executing Discord AI action...`);
  
  const webhookUrl = config?.webhookUrl;
  
  if (!webhookUrl) {
    throw new Error("Discord Webhook URL is missing from config!");
  }

  // The frontend currently passes the raw payload body. 
  // We extract it and can send it to Gemini.
  const inputData = parseDynamicData("{payload.body}", webhookPayload);
  
  // Initialize the Gemini SDK
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  let aiSummary = "";
  try {
    console.log("Calling Gemini API to evaluate and summarize payload...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following email. Is it related to internships, assessments, assignments, placements, or shortlisting?
        
Email Data:
${inputData}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    isRelevant: { 
                        type: "boolean", 
                        description: "True if the email is related to internships, assessments, assignments, placements, or shortlisting." 
                    },
                    reason: { 
                        type: "string", 
                        description: "A 1-sentence explanation of why this email is relevant. Leave empty if isRelevant is false." 
                    },
                    summary: { 
                        type: "string", 
                        description: "A short, concise paragraph summarizing the email for Discord. Leave empty if isRelevant is false." 
                    }
                },
                required: ["isRelevant", "reason", "summary"]
            }
        }
    });
    
    // Safely parse the guaranteed JSON response
    const aiData = JSON.parse(response.text || "{}");
    
    // If Gemini decides the email isn't relevant, we just silently abort!
    if (aiData.isRelevant === false) {
        console.log("🤖 Gemini determined this email is irrelevant. Skipping Discord post.");
        return; 
    }
    
    aiSummary = `**Reason for selection:** ${aiData.reason}\n\n**Summary:** ${aiData.summary}`;
  } catch (err) {
    console.error("Gemini API Error:", err);
    aiSummary = "*(Failed to generate AI summary due to an error)*\n\nRaw Data:\n" + inputData;
  }

  const finalDiscordMessage = `**🤖 Zapier AI Summary:**\n\n${aiSummary}`;

  try {
    await axios.post(webhookUrl, { content: finalDiscordMessage });
    console.log(`🤖 Discord message sent successfully!`);
  } catch (error) {
    console.error("Failed to send Discord AI message", error);
    throw new Error("Discord AI action failed");
  }
}
