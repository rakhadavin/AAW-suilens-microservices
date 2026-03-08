import { pgTable, uuid, varchar, integer, timestamp, text, uniqueIndex, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql/sql";

export const branches = pgTable("branches", {
  code: varchar("code", { length: 20 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address").notNull(),
});

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lensId: uuid("lens_id").notNull(),
    branchCode: varchar("branch_code", { length: 20 })
      .notNull()
      .references(() => branches.code),
    totalQuantity: integer("total_quantity").notNull(),
    availableQuantity: integer("available_quantity").notNull(),
  },
  (table) => ({
    lensBranchUnique: unique().on(table.lensId, table.branchCode),
    availableNonNegative: check("available_non_negative", sql`${table.availableQuantity} >= 0`),

    availableNotOverTotal: check("available_not_over_total", sql`${table.availableQuantity} <= ${table.totalQuantity}`),
  }),
);

export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull(),
    lensId: uuid("lens_id").notNull(),
    branchCode: varchar("branch_code", { length: 20 }).notNull(),
    quantity: integer("quantity").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("reserved"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    releasedAt: timestamp("released_at"),
  },
  (table) => ({
    orderUnique: uniqueIndex("inventory_reservations_order_id_unique").on(table.orderId),
  }),
);
