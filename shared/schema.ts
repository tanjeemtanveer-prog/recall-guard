import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull(),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text").notNull(),
  interval: integer("interval").notNull(),
  easeFactor: real("ease_factor").notNull(),
  repetitions: integer("repetitions").notNull(),
  nextReviewDate: timestamp("next_review_date").notNull()
});

export const insertNoteSchema = z.object({
  content: z.string().min(1)
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Question = typeof questions.$inferSelect;

export type CreateNoteRequest = InsertNote;
export type ReviewRequest = { quality: number };
