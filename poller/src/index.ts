import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { db, triggerOutbox, users, zaps, triggers } from '@zapier/database';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function setupGmailLabel(auth: any, userId: number){
    const gmail = google.gmail({version: 'v1', auth});
    
    try {
        const labelsRes = await gmail.users.labels.list({ userId: 'me' });
        const existingLabel = labelsRes.data.labels?.find(label => label.name === 'Zapier');

        let labelId = '';

        if (existingLabel && existingLabel.id) {
            console.log(`Found existing Zapier label! ID: ${existingLabel.id}`);
            labelId = existingLabel.id;
        } else {
            console.log("Zapier label not found. Creating it now...");
            const newLabelRes = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                name: 'Zapier',
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
                }
            });
            labelId = newLabelRes.data.id!;
            console.log(`Created new Zapier label! ID: ${labelId}`);
        }

        await db.update(users).set({ gmailLabelId: labelId }).where(eq(users.id, userId));
        return labelId;
    } catch (error) {
        console.error("Failed to setup Gmail label:", error);
        throw error;
    }
}

// This function actually reads my Gmail inbox
async function checkEmails(auth: any, labelId: string, zapId: number){
    const gmail = google.gmail({version: 'v1', auth});

    console.log("Checking for new unread emails...");

    try{
        // fetching id of unread emails from google
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread',
            maxResults: 1000,
        });

        const messages = res.data.messages;
        if(!messages || messages.length===0){
            console.log("No new unread emails found");
            return;
        }

        // we have id, now fetch email content
        const messageId = messages[0]?.id!;
        const msgData = await gmail.users.messages.get({
            userId: 'me',
            id: messageId
        });

        const headers = msgData.data.payload?.headers;
        const subjectHeader = headers?.find(header => header.name === 'Subject');
        const subject = subjectHeader ? subjectHeader.value : 'No Subject';

        const fromHeader = headers?.find(header => header.name === 'From');
        const sender = fromHeader ? fromHeader.value : 'Unknown Sender';

        // extract body
        let encodedBody = '';

        if (msgData.data.payload?.body?.data) {
            // Simple emails have the body data right here
            encodedBody = msgData.data.payload.body.data;
        } else if (msgData.data.payload?.parts) {
            // Complex emails (like HTML or attachments) hide it in 'parts'
            const textPart = msgData.data.payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart && textPart.body?.data) {
                encodedBody = textPart.body.data;
            }
        }

        // Decode Base64 to a readable string
        const decodedBody = encodedBody 
            ? Buffer.from(encodedBody, 'base64').toString('utf-8')
            : 'No body content found';

        // Print the results!
        console.log(`✉️ Found new email from: ${sender}`);
        console.log(`📌 Subject: ${subject}`);
        console.log(`📝 Body: ${decodedBody}`);

        // push to db outbox
        console.log("pushing to triggerOutbox db");
        await db.insert(triggerOutbox).values({
            zapId: zapId,
            payload:{
                subject: subject,
                sender: sender,
                body: decodedBody
            },
            status: 'pending'
        });
        console.log("Successfully queued in database!");

    


    } catch (err){
        console.error("Failed to check emails:", err);
    }
}

async function main() {

  async function pollAllUsers() {
    console.log("Polling database for active Gmail Zaps...");
    
    // Query the DB for all active Zaps that use the "gmail" trigger
        const activeGmailZaps = await db
            .select({
                zapId: zaps.id,
                userId: zaps.userId,
                googleRefreshToken: users.googleRefreshToken, 
            })
            .from(zaps)
            .innerJoin(triggers, eq(zaps.id, triggers.zapId))
            .innerJoin(users, eq(zaps.userId, users.id)) 
            .where(
                and(
                eq(triggers.availableTriggersId, 'gmail'),
                eq(zaps.isActive, "true") 
                )
        );

    if (activeGmailZaps.length === 0) {
      console.log("No active Gmail zaps found in database.");
      return;
    }

    // Loop through every active Zap and check their emails!
    for (const zap of activeGmailZaps) {
      if (!zap.googleRefreshToken) {
        console.log(`User ${zap.userId} hasn't connected Gmail yet. Skipping...`);
        continue;
      }

      // Read the credentials.json (this is your Developer App ID, so it stays local!)
      const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
      const keys = JSON.parse(content);
      const key = keys.installed || keys.web;
      
      const auth = new google.auth.OAuth2(key.client_id, key.client_secret);
      
      // Inject the user's unique refresh token from the database!
      auth.setCredentials({ refresh_token: zap.googleRefreshToken });

      // Run the setup and fetch!
      const labelId = await setupGmailLabel(auth, zap.userId);
      await checkEmails(auth, labelId, zap.zapId);
    }
  }

  // Run immediately, then every 10 seconds
  await pollAllUsers();
  setInterval(pollAllUsers, 10000); 
}

main().catch(console.error);


