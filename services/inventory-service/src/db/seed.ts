import { db } from "./index";
import { branches, inventory } from "./schema";
import { eq } from "drizzle-orm";

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3001";

interface CatalogLens {
  id: string;
  modelName: string;
  manufacturerName: string;
}

async function fetchLensesWithRetry(retries = 10, delayMs = 2000): Promise<CatalogLens[]> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${CATALOG_SERVICE_URL}/api/lenses`);
      if (!res.ok) throw new Error(`Catalog responded with ${res.status}`);
      const data = await res.json();
      return data as CatalogLens[];
    } catch (err) {
      console.log(`Catalog not ready yet, retry ${i + 1}/${retries}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Failed to fetch lenses from catalog-service after retries");
}

export async function seedInventory() {
  console.log("Seeding inventory branches...");

  await db
    .insert(branches)
    .values([
      {
        code: "KB-JKT-S",
        name: "Kebayoran Baru",
        address: "Jakarta Selatan",
      },
      {
        code: "KB-JKT-E",
        name: "Jatinegara",
        address: "Jakarta Timur",
      },
      {
        code: "KB-JKT-N",
        name: "Kelapa Gading",
        address: "Jakarta Utara",
      },
    ])
    .onConflictDoNothing();

  console.log("Fetching lenses from catalog-service...");
  const lenses = await fetchLensesWithRetry();

  const summilux = lenses.find((l) => l.modelName === "Summilux-M 35mm f/1.4 ASPH.");
  const sigma = lenses.find((l) => l.modelName === "Art 24-70mm f/2.8 DG DN");
  const nikkor = lenses.find((l) => l.modelName === "NIKKOR Z 70-200mm f/2.8 VR S");

  if (!summilux || !sigma || !nikkor) {
    throw new Error("Required lenses not found in catalog-service");
  }

  console.log("Seeding inventory stock...");

  await db
    .insert(inventory)
    .values([
      {
        lensId: summilux.id,
        branchCode: "KB-JKT-S",
        totalQuantity: 3,
        availableQuantity: 3,
      },
      {
        lensId: summilux.id,
        branchCode: "KB-JKT-E",
        totalQuantity: 1,
        availableQuantity: 1,
      },
      {
        lensId: summilux.id,
        branchCode: "KB-JKT-N",
        totalQuantity: 0,
        availableQuantity: 0,
      },
      {
        lensId: sigma.id,
        branchCode: "KB-JKT-S",
        totalQuantity: 2,
        availableQuantity: 2,
      },
      {
        lensId: sigma.id,
        branchCode: "KB-JKT-E",
        totalQuantity: 1,
        availableQuantity: 1,
      },
      {
        lensId: nikkor.id,
        branchCode: "KB-JKT-N",
        totalQuantity: 1,
        availableQuantity: 1,
      },
    ])
    .onConflictDoNothing();

  console.log("Inventory seed complete.");
}

seedInventory().catch((error) => {
  console.error(error);
  process.exit(1);
});
