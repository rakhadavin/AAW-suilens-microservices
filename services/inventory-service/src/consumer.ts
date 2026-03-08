import amqplib from "amqplib";
import { and, eq, sql } from "drizzle-orm";
import { inventory, inventoryReservations } from "./db/schema";
import { db } from "./db";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const EXCHANGE_NAME = "suilens.events";
const QUEUE_NAME = "inventory-service";

interface OrderEventPayload {
  orderId: string;
  lensId: string;
  branchCode: string;
  quantity: number;
}

async function handleOrderPlaced(event: OrderEventPayload) {
  const { orderId, lensId, branchCode, quantity } = event;

  await db.transaction(async (tx) => {
    const existingReservation = await tx
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderId));

    if (existingReservation.length > 0) {
      console.log(`[inventory-service] order.placed already processed for ${orderId}`);
      return;
    }

    const currentInventory = await tx
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.lensId, lensId),
          eq(inventory.branchCode, branchCode)
        )
      );

    const stock = currentInventory[0];

    if (!stock) {
      throw new Error(`Inventory not found for lensId=${lensId}, branchCode=${branchCode}`);
    }

    if (stock.availableQuantity < quantity) {
      throw new Error(
        `Insufficient stock for lensId=${lensId}, branchCode=${branchCode}. Available=${stock.availableQuantity}, requested=${quantity}`
      );
    }

    await tx
      .update(inventory)
      .set({
        availableQuantity: sql`${inventory.availableQuantity} - ${quantity}`,
      })
      .where(
        and(
          eq(inventory.lensId, lensId),
          eq(inventory.branchCode, branchCode)
        )
      );

    await tx.insert(inventoryReservations).values({
      orderId,
      lensId,
      branchCode,
      quantity,
      status: "reserved",
    });

    console.log(`[inventory-service] Stock reserved for order ${orderId}`);
  });
}

async function handleOrderCancelled(event: OrderEventPayload) {
  const { orderId } = event;

  await db.transaction(async (tx) => {
    const reservationRows = await tx
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderId));

    const reservation = reservationRows[0];

    if (!reservation) {
      console.log(`[inventory-service] No reservation found for order ${orderId}, skipping cancel`);
      return;
    }

    if (reservation.status === "released") {
      console.log(`[inventory-service] order.cancelled already processed for ${orderId}`);
      return;
    }

    await tx
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

    await tx
      .update(inventoryReservations)
      .set({
        status: "released",
        releasedAt: new Date(),
      })
      .where(eq(inventoryReservations.orderId, orderId));

    console.log(`[inventory-service] Stock released for order ${orderId}`);
  });
}

export async function startInventoryConsumer() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  const queue = await channel.assertQueue(QUEUE_NAME, { durable: true });

  await channel.bindQueue(queue.queue, EXCHANGE_NAME, "order.placed");
  await channel.bindQueue(queue.queue, EXCHANGE_NAME, "order.cancelled");

  console.log("[inventory-service] Consumer started");

  channel.consume(queue.queue, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;

    try {
      const parsed = JSON.parse(msg.content.toString());
      const payload = parsed.data as OrderEventPayload;

      console.log(`[inventory-service] Received ${routingKey}`, payload);

      if (routingKey === "order.placed") {
        await handleOrderPlaced(payload);
      } else if (routingKey === "order.cancelled") {
        await handleOrderCancelled(payload);
      }

      channel.ack(msg);
    } catch (error) {
      console.error(`[inventory-service] Failed processing ${routingKey}:`, error);
      channel.nack(msg, false, false);
    }
  });
}