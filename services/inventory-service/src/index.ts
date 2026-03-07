import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db';
import { branches, inventory, inventoryReservations } from './db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { seedInventory } from './db/seed';
import { startInventoryConsumer } from './events';

const app = new Elysia()
  .use(cors())

  .get('/health', () => ({ status: 'ok', service: 'inventory-service' }))

  .get('/api/inventory/lenses/:lensId', async ({ params }) => {
    const rows = await db
      .select({
        branchCode: inventory.branchCode,
        availableQuantity: inventory.availableQuantity,
        totalQuantity: inventory.totalQuantity,
        branchName: branches.name,
        address: branches.address,
      })
      .from(inventory)
      .innerJoin(branches, eq(inventory.branchCode, branches.code))
      .where(eq(inventory.lensId, params.lensId));

    return {
      lensId: params.lensId,
      branches: rows,
    };
  })

  .post(
    '/api/inventory/reserve',
    async ({ body }) => {
      const existing = await db.query.inventoryReservations.findFirst({
        where: eq(inventoryReservations.orderId, body.orderId),
      });

      if (existing) {
        return {
          success: true,
          message: 'Reservation already exists',
        };
      }

      const stock = await db.query.inventory.findFirst({
        where: and(
          eq(inventory.lensId, body.lensId),
          eq(inventory.branchCode, body.branchCode)
        ),
      });

      if (!stock || stock.availableQuantity < body.quantity) {
        return new Response(
          JSON.stringify({
            error: 'Selected branch does not have enough stock',
          }),
          { status: 409 }
        );
      }

      await db
        .update(inventory)
        .set({
          availableQuantity: stock.availableQuantity - body.quantity,
        })
        .where(eq(inventory.id, stock.id));

      await db.insert(inventoryReservations).values({
        orderId: body.orderId,
        lensId: body.lensId,
        branchCode: body.branchCode,
        quantity: body.quantity,
        status: 'reserved',
      });

      return {
        success: true,
        message: 'Stock reserved',
      };
    },
    {
      body: t.Object({
        orderId: t.String({ format: 'uuid' }),
        lensId: t.String({ format: 'uuid' }),
        branchCode: t.String(),
        quantity: t.Number(),
      }),
    }
  )

  .listen(3004);

async function bootstrap() {
  await seedInventory();
  await startInventoryConsumer();
  console.log(`Inventory Service running on port ${app.server?.port}`);
}

bootstrap();