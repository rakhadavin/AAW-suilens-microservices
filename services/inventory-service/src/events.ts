import amqplib from 'amqplib';
import { db } from './db';
import { inventory, inventoryReservations } from './db/schema';
import { and, eq, sql } from 'drizzle-orm';

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

const EXCHANGE_NAME = 'suilens.events';

interface CancelledEventPayload {
  orderId: string;
  lensId: string;
  branchCode: string;
  quantity: number;
}

export async function startInventoryConsumer() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

  const q = await channel.assertQueue('inventory.order.cancelled', {
    durable: true,
  });

  await channel.bindQueue(q.queue, EXCHANGE_NAME, 'order.cancelled');

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;

    try {
      const parsed = JSON.parse(msg.content.toString());
      const payload = parsed.data as CancelledEventPayload;

      const reservation = await db.query.inventoryReservations.findFirst({
        where: eq(inventoryReservations.orderId, payload.orderId),
      });

      if (!reservation) {
        channel.ack(msg);
        return;
      }

      if (reservation.status === 'released') {
        channel.ack(msg);
        return;
      }

      await db
        .update(inventory)
        .set({
          availableQuantity: sql`${inventory.availableQuantity} + ${reservation.quantity}`,
        })
        .where(
          and(
            eq(inventory.lensId, reservation.lensId),
            eq(inventory.branchCode, reservation.branchCode)
          )
        );

      await db
        .update(inventoryReservations)
        .set({
          status: 'released',
          releasedAt: new Date(),
        })
        .where(eq(inventoryReservations.orderId, payload.orderId));

      console.log('Released stock for cancelled order:', payload.orderId);
      channel.ack(msg);
    } catch (error) {
      console.error('Inventory consumer error:', error);
      channel.nack(msg, false, false);
    }
  });

  console.log('Inventory consumer listening for order.cancelled');
}