import { db, triggerOutbox } from '@zapier/database';
import express from 'express';
import type { Request, Response } from 'express';
import {Redis} from 'ioredis';
import rateLimit from 'express-rate-limit';
import {RedisStore} from 'rate-limit-redis';

const app = express();
const PORT = 3002;

app.use(express.json());

const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many webhook requests. Please try again later." },
  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis and ioredis
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  keyGenerator: (req) => {
    return `ratelimit_user_${req.params.userId}`;
  }
});

app.post('/hooks/catch/:userId/:zapId', webhookRateLimiter ,async (req: Request<{userId: string; zapId: string}>, res: Response) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;

  const body = req.body;
  if(!zapId || !userId || !body){
    throw new Error("userId or zapid or body is empty");
  }

  try {
     // We store the webhook event in our database outbox.
    // The "sweeper" service we build later will look for rows where status is 'pending'

    await db.insert(triggerOutbox).values({
      zapId: parseInt(zapId),
      payload: body,
      status: 'pending'

    })

    res.json({ message: "Webhook received and queued successfully" });
  } catch (error) {
    console.error("Failed to process webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  
});

app.listen(PORT, () => {
  console.log(`Hooks service listening on http://localhost:${PORT}`);
});