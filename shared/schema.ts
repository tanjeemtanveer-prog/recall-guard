import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";



/* ============================
        USERS TABLE
============================ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  email: text("email")
    .notNull()
    .unique(),

  passwordHash: text("password_hash")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
});



/* ============================
        NOTES TABLE
============================ */

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  content: text("content")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
});



/* ============================
      QUESTIONS TABLE
============================ */

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  noteId: integer("note_id")
    .notNull()
    .references(() => notes.id),

  questionText: text("question_text")
    .notNull(),

  answerText: text("answer_text")
    .notNull(),

  interval: integer("interval")
    .notNull(),

  easeFactor: real("ease_factor")
    .notNull(),

  repetitions: integer("repetitions")
    .notNull(),

  nextReviewDate: timestamp("next_review_date")
    .notNull()
});



/* ============================
      ZOD SCHEMAS
============================ */

export const insertNoteSchema = z.object({
  content: z.string().min(1)
});



/* ============================
        TYPES
============================ */

export type User = typeof users.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Question = typeof questions.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;

export type CreateNoteRequest = InsertNote;
export type ReviewRequest = { quality: number };