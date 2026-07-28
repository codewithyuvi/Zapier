import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

import { google } from 'googleapis';

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// This function loads my master key
async function authorize() {

    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const OauthClient = new google.auth.OAuth2(key.client_id, key.client_secret);

    const tokenContent = await fs.readFile(TOKEN_PATH, 'utf-8');
    const token = JSON.parse(tokenContent);

    OauthClient.setCredentials({
        refresh_token: token.refresh_token
    });

    return OauthClient;
}

// This function actually reads my Gmail inbox
async function checkEmails(auth: any){
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



    } catch (err){
        console.error("Failed to check emails:", err);
    }
}

async function main(){
    const auth = await authorize();
    await checkEmails(auth);
    setInterval(() => {
        checkEmails(auth);
    }, 10000);
}

main().catch(console.error);


