import { db } from "./db.js";
import { desc, eq, lt, sql, and } from "drizzle-orm";
import { notes, questions } from "../shared/schema.js";
import type { CreateNoteRequest, Note, Question } from "../shared/schema.js";

function now() {
  return new Date();}

export const storage = {

  // ✅ Create Note (NOW USER OWNED)
  async createNote(userId: number, insertNote: CreateNoteRequest): Promise<Note> {

    const [note] = await db
      .insert(notes)
      .values({
        userId,
        content: insertNote.content
      })
      .returning();

    return note as Note;
  },

  // ✅ List Notes per user
  async getNotes(userId: number): Promise<Note[]> {

    const all = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));

    return all as Note[];
  },

  // ✅ Create Questions (NOW USER OWNED)
  async createQuestions(
    items: Array<{
      userId: number;
      noteId: number;
      questionText: string;
      answerText: string;
      interval?: number;
      easeFactor?: number;
      repetitions?: number;
      nextReviewDate?: Date;
    }>
  ): Promise<void> {

    if (!items.length) return;

    const normalized = items.map((q) => ({
      userId: q.userId,
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

  // ✅ Get daily question per user
  async getDailyQuestion(userId: number): Promise<Question | null> {

    const today = now();

    const [q] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.userId, userId),
          lt(questions.nextReviewDate, today)
        )
      )
      .orderBy(questions.nextReviewDate)
      .limit(1);

    return (q ?? null) as Question | null;
  },

  // ✅ Get one question per user
  async getQuestion(userId: number, id: number): Promise<Question | null> {

    const [q] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.userId, userId),
          eq(questions.id, id)
        )
      )
      .limit(1);

    return (q ?? null) as Question | null;
  },

  // ✅ Update review per user
  async updateQuestionReview(
    userId: number,
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
      .where(
        and(
          eq(questions.userId, userId),
          eq(questions.id, id)
        )
      )
      .returning();

    return updated as Question;
  },

  // ✅ Memory status per user
  async getMemoryStatus(userId: number): Promise<{ safe: number; unstable: number }> {

    const today = now();

    const result = await db
      .select({
        safe: sql<number>`sum(case when ${questions.nextReviewDate} > ${today} then 1 else 0 end)`,
        unstable: sql<number>`sum(case when ${questions.nextReviewDate} <= ${today} then 1 else 0 end)`,
      })
      .from(questions)
      .where(eq(questions.userId, userId));

    return {
      safe: Number(result[0]?.safe ?? 0),
      unstable: Number(result[0]?.unstable ?? 0),
    };
  },
};