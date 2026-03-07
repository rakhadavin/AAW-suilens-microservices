import { db } from './index';
import { branches, inventory } from './schema';
import { sql } from 'drizzle-orm';

export async function seedInventory() {
  await db.insert(branches).values([
    {
      code: 'KB-JKT-S',
      name: 'Kebayoran Baru',
      address: 'Jakarta Selatan',
    },
    {
      code: 'KB-JKT-E',
      name: 'Jatinegara',
      address: 'Jakarta Timur',
    },
    {
      code: 'KB-JKT-N',
      name: 'Kelapa Gading',
      address: 'Jakarta Utara',
    },
  ]).onConflictDoNothing();

  // pakai lensId dari catalog seed kamu
  await db.insert(inventory).values([
    {
      lensId: '57e27c5e-103f-457e-8841-8d90d658bfff',
      branchCode: 'KB-JKT-S',
      totalQuantity: 3,
      availableQuantity: 3,
    },
    {
      lensId: '57e27c5e-103f-457e-8841-8d90d658bfff',
      branchCode: 'KB-JKT-E',
      totalQuantity: 1,
      availableQuantity: 1,
    },
    {
      lensId: '57e27c5e-103f-457e-8841-8d90d658bfff',
      branchCode: 'KB-JKT-N',
      totalQuantity: 0,
      availableQuantity: 0,
    },
    {
      lensId: '8cc3e83b-5832-457d-ba51-c94eac029cee',
      branchCode: 'KB-JKT-S',
      totalQuantity: 2,
      availableQuantity: 2,
    },
    {
      lensId: '8cc3e83b-5832-457d-ba51-c94eac029cee',
      branchCode: 'KB-JKT-E',
      totalQuantity: 1,
      availableQuantity: 1,
    },
    {
      lensId: '54d312b4-78b5-477f-9046-8fafd0f5c08d',
      branchCode: 'KB-JKT-N',
      totalQuantity: 1,
      availableQuantity: 1,
    },
  ]).onConflictDoNothing();

  
}


// seedInventory()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error('Inventory seed failed:', err);
//     process.exit(1);
//   });


seedInventory().catch((error) => {
  console.error(error);
  process.exit(1);
});