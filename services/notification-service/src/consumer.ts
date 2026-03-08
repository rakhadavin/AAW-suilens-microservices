import amqplib from "amqplib";
import { db } from "./db";
import { notifications } from "./db/schema";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "suilens.events";
const QUEUE_NAME = "notification-service.order-events";

async function connectRabbitWithRetry(retries = 20, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();

      console.log("[notification-service] Connected to RabbitMQ");

      return { connection, channel };
    } catch (error) {
      console.error(`[notification-service] RabbitMQ not ready, retry ${i + 1}/${retries}...`, error);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("[notification-service] Failed to connect to RabbitMQ after retries");
}

export async function startConsumer() {
  const { channel } = await connectRabbitWithRetry();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  const queue = await channel.assertQueue(QUEUE_NAME, { durable: true });

  await channel.bindQueue(queue.queue, EXCHANGE_NAME, "order.placed");
  await channel.bindQueue(queue.queue, EXCHANGE_NAME, "order.cancelled");

  console.log("[notification-service] Consumer started");

  channel.consume(queue.queue, async (msg) => {
    if (!msg) return;

    try {
      const parsed = JSON.parse(msg.content.toString());

      console.log(`[notification-service] Received ${msg.fields.routingKey}:`, parsed);

      channel.ack(msg);
    } catch (error) {
      console.error("[notification-service] Failed processing message:", error);
      channel.nack(msg, false, false);
    }
  });
}
