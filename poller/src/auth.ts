import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { db, users } from '@zapier/database';
import { eq } from 'drizzle-orm';

// We are asking Google for permission to READ emails.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function authorize() {
  console.log("Opening browser to authenticate with Google...");
  
  // This pops open the Google login screen
  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  
  // Save the master key!
    if (client.credentials && client.credentials.refresh_token) {
    console.log("Saving refresh token to database...");
    
    // Save the token to User ID 1
    await db.update(users)
      .set({ googleRefreshToken: client.credentials.refresh_token })
      .where(eq(users.id, 746));
      
    console.log("Successfully saved master key to the database!");
  }
}

authorize().catch(console.error);