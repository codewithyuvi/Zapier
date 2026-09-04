Gmail Trigger & AI Discord Router
This plan covers adding two powerful new integrations to our Zapier clone: a Gmail Trigger (which polls your inbox for new emails) and an AI Discord Router Action (which uses Google Gemini to classify emails and route them to specific Discord channels).

User Review Required
WARNING

Google Cloud Setup Required for Gmail Because we are running locally, we cannot receive "Push Webhooks" directly from Google (as our localhost is not publicly accessible on the internet). Therefore, we must build a Poller Service that pulls emails from the Gmail API every few minutes.

To do this, you will need to:

Go to the Google Cloud Console.
Create a Project and enable the Gmail API.
Create OAuth 2.0 Client IDs (Desktop App) and download the credentials.json. Are you comfortable doing this manual setup step?
IMPORTANT

Gemini API Key Required For the AI Router, you will need a free API key from Google AI Studio. We will add this to the .env file of our worker service.

Proposed Changes
Database Layer
We need to add the new Trigger and Action types to our lookup tables, and optionally store Google OAuth tokens if we want to handle multiple users later (though for this prototype, storing the token locally on disk for a single user is easiest).

[MODIFY] database/src/seed.ts (or wherever you insert seed data)
Insert { id: "gmail", name: "Gmail" } into availableTriggers
Insert { id: "discord_ai", name: "AI Discord Router" } into availableActions
New poller Service (The Gmail Trigger)
We will create a brand new microservice (like sweeper or hooks) called poller.

[NEW] poller/src/index.ts
Runs a node-cron job every 1-5 minutes.
Uses the googleapis npm package to check the authenticated user's inbox for messages received since the last check.
If a new email is found (e.g., matching a label like "UNREAD" or a specific sender), it formats the email into a JSON payload ({ subject, body, sender }).
It inserts this payload into the triggerOutbox table (just like the hooks service does!), meaning our existing sweeper and processor will pick it up automatically!
Worker Service (The AI Action)
We will add the new AI Action to the worker, which evaluates the payload and routes it.

[MODIFY] worker/package.json
Install @google/generative-ai package.
[NEW] worker/src/actions/discord_ai.ts
Initialize the Gemini API client using process.env.GEMINI_API_KEY.
Pass the {payload.body} to Gemini with a strict prompt: "Classify this email strictly as one of: [OS, Compiler, Internship, Workshop, General]. Email text: ..."
Use a switch statement based on Gemini's response to select one of 5 different Discord Webhook URLs.
Make a POST request to the selected Discord Webhook URL.
[MODIFY] worker/src/actions/index.ts
Register "discord_ai" in the ActionRegistry.
Frontend Service
We need to update the Zap Builder UI to support our new integrations.

[MODIFY] frontend/src/app/create/page.tsx
Add a Gmail trigger button (alongside the Webhook trigger).
Add an AI Discord Router action button.
Provide a default config block for the AI Router so it saves properly to the database.
Verification Plan
Automated/Manual Verification
Verify the poller successfully authenticates with Google and can read the latest email.
Verify the poller successfully injects a row into the triggerOutbox.
Verify the worker correctly receives the payload, successfully calls the Gemini API, parses the response, and posts to the correct Discord channel.







# Master Roadmap: Zapier vs Zapier2.0

After thoroughly analyzing the `Zapier2.0` repository, I have combined our findings into a single, comprehensive roadmap. Your friend built a cloud-native, enterprise-scale distributed system. 

Here is the complete breakdown of everything we are missing, split into **Application-Level** features and **DevOps & Architecture**.

---

## Part 1: Application-Level Features
These are features we can implement immediately in our current Node.js and Next.js environment without changing our infrastructure.

### 1. Modular Action Architecture & Crypto (Solana)
**The Gap:** Our worker executes actions using a massive `if/else` block inside `index.ts`.
**The Zapier2.0 Way:** They built a highly modular `actions` directory where every integration gets its own file (`email.ts`, `slack.ts`, `solana.ts`).
**The Coolest Part:** They literally built a **Solana Crypto Action**! Users can set up a Zap to automatically transfer SOL (Solana cryptocurrency) to a wallet address whenever a webhook is received!
**How we beat it:** We can refactor our worker to use a modular directory structure and add the `solana.ts` action to our engine. 

### 2. Custom JWT Authentication
**The Gap:** We were planning to use Clerk (which is essentially outsourcing our authentication).
**The Zapier2.0 Way:** They built their own authentication entirely from scratch using `jsonwebtoken`. They have dedicated `/login` and `/signup` API routes, they hash passwords in their database, and their `authMiddleware.ts` manually verifies the JWT on every request.
**How we beat it:** If you want total ownership of your user data, we can build a custom JWT authentication system from scratch just like they did.

### 3. API Rate Limiting (Redis)
**The Gap:** Anyone can currently spam our Webhook URL or API millions of times a second and crash our server.
**The Zapier2.0 Way:** They implemented a custom `rateLimiter.ts` middleware using **Redis**. It tracks IP addresses and User IDs, strictly limiting how many requests a user can make per minute to protect their server from DDoS attacks.
**How we beat it:** We can spin up a Redis container in our `docker-compose` and implement this middleware on our `/hooks` server.

### 4. Robust Data Parsing
**The Gap:** We wrote a simple Regex block to replace `{payload.name}`.
**The Zapier2.0 Way:** They built a dedicated `parser.ts` module that handles complex, nested JSON data perfectly, ensuring complex payloads don't break the worker.

---

## Part 2: High-Level Architecture & DevOps
These are the massive architectural shifts required to turn our full-stack app into a true cloud-native distributed system, mirroring exactly what was built in Zapier 2.0.

### 5. Autonomous Distributed Scheduler (Cron Zaps)
**The Target:** A native daemon (`apps/scheduler/`) that processes time-bound triggers (e.g. "every 5 mins").
**The Implementation:** Use `cron-parser`, implement Redis Distributed Locks (via `ioredis` NX) to prevent duplicate runs across scaled pods, and push execution payloads to the transactional outbox.

### 6. Real-Time WebSockets (Notification Service)
**The Target:** A WebSocket gateway (`apps/services/notification-service/`) so the Next.js UI gets live updates when Zaps finish.
**The Implementation:** Decouple from polling PostgreSQL by subscribing to a Redis Pub/Sub channel (`zap-notification`). The Worker publishes success events, and the WS server pushes them directly to the user's browser.

### 7. Dead Letter Queue (DLQ) & Fault Tolerance
**The Target:** Resilient execution in the Worker service.
**The Implementation:** Add a Retry Loop (max 3 retries). If an API call fails permanently, the Worker dumps the payload into a separate Kafka topic called `zap-events-dlq` for monitoring, instead of just failing silently.

### 8. Enterprise DevOps & Kubernetes Migration (The Big One)
**The Target:** Move away from `docker-compose` and build a fully automated, production-ready cloud environment.
**The Implementation Steps:**
* **Continuous Integration (GitHub Actions):** Write `.github/workflows` to automatically build and push Docker images for all 7 microservices on every git push.
* **Kubernetes (K8s) Manifests:** Create a `k8/` directory with Deployment, Service, ConfigMap, and StatefulSet manifests (for Postgres & Redis) and an NGINX Ingress controller for routing.
* **Kafka on K8s (Strimzi):** Deploy KRaft-enabled Kafka using Strimzi Custom Resource Definitions (KafkaNodePool, KafkaTopic).
* **Infrastructure as Code (Terraform):** Write `main.tf`, `variables.tf`, and a custom `microservice` module to orchestrate the entire Kubernetes cluster deployment dynamically.
* **GitOps & Canary Deployments (ArgoCD):** Setup ArgoCD to automatically sync our K8s manifests, and use Argo Rollouts to do progressive (Canary) deployments (e.g., 10% -> 50% traffic splits) for the frontend.
* **Observability:** Deploy the Prometheus & Grafana stack via Helm to scrape performance metrics from all microservices.

---

## The Verdict & Open Questions

This is the master blueprint, fully updated with the exact DevOps stack from the Zapier 2.0 reference project.

**What is our immediate next step?**
Since you want to focus on DevOps now, which of the **DevOps & Kubernetes Migration** (Step 8) tasks should we start on first? Or do you want to build the **Scheduler/Notification** backend services (Steps 5 & 6) before moving the infrastructure to Kubernetes?
