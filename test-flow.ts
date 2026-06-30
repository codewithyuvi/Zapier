async function runTest() {
  console.log("1. Testing Primary API: Creating User...");
  // tRPC expects input wrapped in an object if you aren't using the client
  const userRes = await fetch("http://localhost:3001/trpc/createUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Yuvi", email: `yuvi.${Date.now()}@example.com` })
  });
  const userData = await userRes.json();
  const userId = userData.result.data.id;
  console.log("User created with ID:", userId);

  console.log("\n2. Testing Primary API: Creating Zap with Transaction...");
  const zapRes = await fetch("http://localhost:3001/trpc/createZap", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "authorization": userId.toString() // Mocking our auth middleware!
    },
    body: JSON.stringify({
      title: "My First Test Zap",
      trigger: { availableTriggerId: "webhook" },
      actions: [{ availableActionId: "email", config: { to: "test@test.com" } }]
    })
  });
  const zapData = await zapRes.json();
  const zapId = zapData.result.data.zapId;
  console.log("Zap successfully created in DB with ID:", zapId);

  console.log("\n3. Testing Hooks API: Sending Fake Webhook...");
  const hookRes = await fetch(`http://localhost:3002/hooks/catch/${userId}/${zapId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "user.payment", amount: 500, currency: "USD" })
  });
  const hookData = await hookRes.json();
  console.log("Hooks Service Response:", hookData);
  
  console.log("\n✅ End-to-End Test Complete! Check your trigger_outbox table in Postgres, you should see the payload there waiting for Phase 3 (the Sweeper)!");
}

runTest();