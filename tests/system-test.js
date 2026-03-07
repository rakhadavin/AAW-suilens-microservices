const fetch = require("node-fetch");

const CATALOG = "http://localhost:3001";
const ORDER = "http://localhost:3002";
const INVENTORY = "http://localhost:3004";

async function test() {
  console.log("===== SYSTEM TEST START =====");

  // 1. Health checks
  console.log("\nChecking services...");

  const services = [
    `${CATALOG}/health`,
    `${ORDER}/health`,
    `${INVENTORY}/health`
  ];

  for (const s of services) {
    const res = await fetch(s);
    const data = await res.json();
    console.log(s, data);
  }

  // 2. Get lenses
  console.log("\nFetching lenses...");

  const lensRes = await fetch(`${CATALOG}/api/lenses`);
  const lenses = await lensRes.json();

  console.log("Available lenses:", lenses);

  const lensId = lenses[0].id;
  console.log("Using lens:", lensId);

  // 3. Get inventory
  console.log("\nFetching inventory...");

  const invRes = await fetch(`${INVENTORY}/api/inventory/lenses/${lensId}`);
  const inventory = await invRes.json();

  console.log("Inventory:", inventory);

  const branch = inventory.branches.find(b => b.availableQuantity > 0);

  if (!branch) {
    throw new Error("No branch has available stock");
  }

  console.log("Using branch:", branch.branchCode);

  // 4. Create order
  console.log("\nCreating order...");

  const orderRes = await fetch(`${ORDER}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerName: "System Test",
      customerEmail: "test@test.com",
      lensId,
      branchCode: branch.branchCode,
      startDate: "2025-03-01",
      endDate: "2025-03-05"
    })
  });

  const order = await orderRes.json();

  console.log("Order created:", order);

  const orderId = order.id;

  // 5. Inventory after order
  console.log("\nInventory after order...");

  const invAfterRes = await fetch(`${INVENTORY}/api/inventory/lenses/${lensId}`);
  const invAfter = await invAfterRes.json();

  console.log(invAfter);

  // 6. Cancel order
  console.log("\nCancelling order...");

  const cancelRes = await fetch(`${ORDER}/api/orders/${orderId}/cancel`, {
    method: "PATCH"
  });

  const cancel = await cancelRes.json();

  console.log("Cancel result:", cancel);

  // wait for async event
  await new Promise(r => setTimeout(r, 2000));

  // 7. Inventory after cancel
  console.log("\nInventory after cancel...");

  const invCancelRes = await fetch(`${INVENTORY}/api/inventory/lenses/${lensId}`);
  const invCancel = await invCancelRes.json();

  console.log(invCancel);

  // 8. Idempotent cancel
  console.log("\nTesting idempotent cancel...");

  await fetch(`${ORDER}/api/orders/${orderId}/cancel`, {
    method: "PATCH"
  });

  const invFinalRes = await fetch(`${INVENTORY}/api/inventory/lenses/${lensId}`);
  const invFinal = await invFinalRes.json();

  console.log("Final inventory:", invFinal);

  console.log("\n===== TEST COMPLETE =====");
}

test().catch(err => {
  console.error("TEST FAILED:", err);
});