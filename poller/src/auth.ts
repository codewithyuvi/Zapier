import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';

// We are asking Google for permission to READ emails.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
console.log(TOKEN_PATH);
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function authorize() {
  console.log("Opening browser to authenticate with Google...");
  
  // This pops open the Google login screen
  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  
  // Save the master key!
  if (client.credentials) {
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: client._clientId,
      client_secret: client._clientSecret,
      refresh_token: client.credentials.refresh_token,
    });
    
    await fs.writeFile(TOKEN_PATH, payload);
    console.log("Successfully generated and saved token.json!");
  }
}

authorize().catch(console.error);