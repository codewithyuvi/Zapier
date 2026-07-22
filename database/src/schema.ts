import {
  pgTable,
  timestamp,
  varchar,
  jsonb,
  serial,
  integer,
  text
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  password: varchar("password", { length: 256 }).notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
// LOOKUP TABLES (The available integrations)
export const availableTriggers = pgTable("available_triggers", {
  id: varchar("id", { length: 256 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
});

export const availableActions = pgTable("available_actions", {
  id: varchar("id", { length: 256 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
});

// ZAPS (The Workflow)
export const zaps = pgTable("zaps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  isActive: varchar("is_active").default("true").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// TRIGGERS
export const triggers = pgTable("triggers", {
  id: serial("id").primaryKey(),
  zapId: integer("zap_id")
    .references(() => zaps.id)
    .notNull()
    .unique(),
  availableTriggersId: varchar("available_trigger_id", { length: 256 })
    .references(() => availableTriggers.id)
    .notNull(),
  config: jsonb("config").default({}),
});

// ACTIONS
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  zapId: integer("zap_id")
    .references(() => zaps.id)
    .notNull(),
  availableActionsId: varchar("available_action_id", { length: 256 })
    .references(() => availableActions.id)
    .notNull(),
  actionOrder: integer("action_order").notNull(),
  config: jsonb("config").default({}),
});

// TRIGGER OUTBOX
export const triggerOutbox = pgTable("trigger_outbox", {
  id: serial("id").primaryKey(),
  zapId: integer("zap_id")
    .references(() => zaps.id)
    .notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// zap runs
export const zapRuns = pgTable("zap_runs", {
  id: serial("id").primaryKey(),
  zapId: integer("zap_id")
    .references(() => zaps.id)
    .notNull(),
  status: varchar("status", {length: 50}).default('processing').notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message")
})

// RELATIONS

export const usersRelations = relations(users, ({ many }) => ({
  zaps: many(zaps),
}));
export const zapsRelations = relations(zaps, ({ one, many }) => ({
  user: one(users, { fields: [zaps.userId], references: [users.id] }),
  trigger: one(triggers, { fields: [zaps.id], references: [triggers.zapId] }),
  actions: many(actions),
}));
export const triggersRelations = relations(triggers, ({ one }) => ({
  zap: one(zaps, { fields: [triggers.zapId], references: [zaps.id] }),
  availableTrigger: one(availableTriggers, {
    fields: [triggers.availableTriggersId],
    references: [availableTriggers.id],
  }),
}));
export const actionsRelations = relations(actions, ({ one }) => ({
  zap: one(zaps, { fields: [actions.zapId], references: [zaps.id] }),
  availableAction: one(availableActions, {
    fields: [actions.availableActionsId],
    references: [availableActions.id],
  }),
}));

export const zapRunsRelations = relations(zapRuns, ({ one }) => ({
  zap: one(zaps, { fields: [zapRuns.zapId], references: [zaps.id] }),
}));