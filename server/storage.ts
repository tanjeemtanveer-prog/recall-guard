import { db } from "./db.js";
import { desc, eq, lt, sql } from "drizzle-orm";
import { notes, questions } from "../shared/schema.js";
import type { CreateNoteRequest, Note, Question } from "../shared/schema.js";

function now() {
  return new Date();
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export const storage = {
  // ✅ Create Note
  async createNote(insertNote: CreateNoteRequest): Promise<Note> {
    // Zod validated, but TS can't always prove in build mode → assert required
    const safeInsert = { content: insertNote.content! };

    const [note] = await db.insert(notes).values(safeInsert).returning();
    return note as Note;
  },

  // ✅ List notes
  async getNotes(): Promise<Note[]> {
    const all = await db.select().from(notes).orderBy(desc(notes.createdAt));
    return all as Note[];
  },

  // ✅ Create questions (FIXED)
  async createQuestions(
    items: Array<{
      noteId: number;
      questionText: string;
      answerText: string;
      interval?: number;
      easeFactor?: number;
      repetitions?: number;
      nextReviewDate?: Date;
    }>,
  ): Promise<void> {
    if (!items.length) return;

    const normalized = items.map((q) => ({
      noteId: q.noteId,
      questionText: q.questionText,
      answerText: q.answerText,
      interval: q.interval ?? 1,
      easeFactor: q.easeFactor ?? 2.5,
      repetitions: q.repetitions ?? 0,
      nextReviewDate: q.nextReviewDate ?? now(),
    }));

    await db.insert(questions).values(normalized);
  },

  // ✅ Get daily question (the earliest due question)
  async getDailyQuestion(): Promise<Question | null> {
    const today = now();

    const [q] = await db
      .select()
      .from(questions)
      .where(lt(questions.nextReviewDate, today))
      .orderBy(questions.nextReviewDate)
      .limit(1);

    return (q ?? null) as Question | null;
  },

  // ✅ Get one question
  async getQuestion(id: number): Promise<Question | null> {
    const [q] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return (q ?? null) as Question | null;
  },

  // ✅ Update review fields
  async updateQuestionReview(
    id: number,
    interval: number,
    easeFactor: number,
    repetitions: number,
    nextReviewDate: Date,
  ): Promise<Question> {
    const [updated] = await db
      .update(questions)
      .set({
        interval,
        easeFactor,
        repetitions,
        nextReviewDate,
      })
      .where(eq(questions.id, id))
      .returning();

    return updated as Question;
  },

  // ✅ Memory status
  async getMemoryStatus(): Promise<{ safe: number; unstable: number }> {
    const today = now();

    const result = await db
      .select({
        safe: sql<number>`sum(case when ${questions.nextReviewDate} > ${today} then 1 else 0 end)`,
        unstable: sql<number>`sum(case when ${questions.nextReviewDate} <= ${today} then 1 else 0 end)`,
      })
      .from(questions);

    return {
      safe: Number(result[0]?.safe ?? 0),
      unstable: Number(result[0]?.unstable ?? 0),
    };
  },
};