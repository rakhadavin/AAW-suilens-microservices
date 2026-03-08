const fetch = require("node-fetch");
const { execSync } = require("child_process");

const CATALOG = "http://localhost:3001";
const ORDER = "http://localhost:3002";
const INVENTORY = "http://localhost:3004";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  return execSync(cmd, { stdio: "inherit" });
}

async function safeJsonOrText(res) {
  const raw = await res.text();
  try {
    return { raw, data: JSON.parse(raw) };
  } catch {
    return { raw, data: { raw } };
  }
}

function getAvailableByBranch(inventory, branchCode) {
  const rows = inventory.branches.filter((b) => b.branchCode === branchCode);

  if (rows.length === 0) return null;

  // sementara ambil row pertama karena data kamu sempat duplicate
  // nanti kalau schema inventory sudah dibenerin, ini tetap aman
  return rows[0].availableQuantity;
}

async function getInventory(lensId) {
  const res = await fetch(`${INVENTORY}/api/inventory/lenses/${lensId}`);
  const { data, raw } = await safeJsonOrText(res);

  if (!res.ok) {
    throw new Error(`Failed to fetch inventory: ${raw}`);
  }

  return data;
}

async function getLenses() {
  const res = await fetch(`${CATALOG}/api/lenses`);
  const { data, raw } = await safeJsonOrText(res);

  if (!res.ok) {
    throw new Error(`Failed to fetch lenses: ${raw}`);
  }

  return data;
}

async function createOrder(payload) {
  const res = await fetch(`${ORDER}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const { data, raw } = await safeJsonOrText(res);

  console.log("Create order status:", res.status);
  console.log("Create order response:", data);

  if (!res.ok) {
    throw new Error(`Failed to create order: ${raw}`);
  }

  return data;
}

async function cancelOrder(orderId) {
  const res = await fetch(`${ORDER}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
  });

  const { data, raw } = await safeJsonOrText(res);

  console.log("Cancel order status:", res.status);
  console.log("Cancel order response:", data);

  if (!res.ok) {
    throw new Error(`Failed to cancel order: ${raw}`);
  }

  return data;
}

async function waitForInventoryService(maxRetries = 20, delayMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${INVENTORY}/health`);
      const { data } = await safeJsonOrText(res);

      if (res.ok && data.status === "ok") {
        console.log(`Inventory service is healthy (attempt ${i + 1}/${maxRetries})`);
        return;
      }
    } catch (err) {
      // ignore and retry
    }

    console.log(`Waiting inventory-service... (${i + 1}/${maxRetries})`);
    await sleep(delayMs);
  }

  throw new Error("Inventory service did not become healthy in time");
}

async function waitUntilInventoryRestored(lensId, branchCode, expectedQty, maxRetries = 20, delayMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    const inventory = await getInventory(lensId);
    const qty = getAvailableByBranch(inventory, branchCode);

    console.log(
      `Check restored inventory (${i + 1}/${maxRetries}): branch=${branchCode}, qty=${qty}, expected=${expectedQty}`
    );

    if (qty === expectedQty) {
      return inventory;
    }

    await sleep(delayMs);
  }

  throw new Error("Inventory was not restored to expected value in time");
}

async function test() {
  console.log("===== FAILURE / RECONCILIATION TEST START =====");

  console.log("\n1. Checking services...");
  const healthUrls = [
    `${CATALOG}/health`,
    `${ORDER}/health`,
    `${INVENTORY}/health`,
  ];

  for (const url of healthUrls) {
    const res = await fetch(url);
    const { data, raw } = await safeJsonOrText(res);
    if (!res.ok) {
      throw new Error(`Health check failed for ${url}: ${raw}`);
    }
    console.log(url, data);
  }

  console.log("\n2. Fetching lenses...");
  const lenses = await getLenses();
  const lens = lenses[0];

  if (!lens) {
    throw new Error("No lens available");
  }

  console.log("Using lens:", lens);

  console.log("\n3. Fetching initial inventory...");
  const invBefore = await getInventory(lens.id);
  console.log("Initial inventory:", invBefore);

  const branch = invBefore.branches.find((b) => b.availableQuantity > 0);
  if (!branch) {
    throw new Error("No branch has available stock");
  }

  const initialQty = getAvailableByBranch(invBefore, branch.branchCode);

  console.log("Selected branch:", branch.branchCode);
  console.log("Initial available quantity:", initialQty);

  console.log("\n4. Stopping inventory-service...");
  run("docker compose stop inventory-service");

  console.log("\n5. Creating order while inventory-service is down...");
  const order = await createOrder({
    customerName: "Failure Test",
    customerEmail: "failure@test.com",
    lensId: lens.id,
    branchCode: branch.branchCode,
    startDate: "2025-03-10",
    endDate: "2025-03-12",
  });

  console.log("Created order:", order);

  console.log("\n6. Cancelling order while inventory-service is still down...");
  const cancelled = await cancelOrder(order.id);
  console.log("Cancelled order:", cancelled);

  console.log("\n7. Starting inventory-service again...");
  run("docker compose start inventory-service");

  await waitForInventoryService();

  console.log("\n8. Waiting for reconciliation...");
  const invAfterRecovery = await waitUntilInventoryRestored(
    lens.id,
    branch.branchCode,
    initialQty
  );

  console.log("Inventory after recovery:", invAfterRecovery);

  console.log("\n9. Verifying idempotent cancel after recovery...");
  const cancelledAgain = await cancelOrder(order.id);
  console.log("Cancelled again response:", cancelledAgain);

  await sleep(3000);

  const invFinal = await getInventory(lens.id);
  const finalQty = getAvailableByBranch(invFinal, branch.branchCode);

  console.log("Final inventory:", invFinal);
  console.log("Final qty:", finalQty, "| Expected:", initialQty);

  if (finalQty !== initialQty) {
    throw new Error(
      `Inventory mismatch after idempotent cancel check. Expected ${initialQty}, got ${finalQty}`
    );
  }

  console.log("\n===== FAILURE / RECONCILIATION TEST COMPLETE =====");
}

test().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});