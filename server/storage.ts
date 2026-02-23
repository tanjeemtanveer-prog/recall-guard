import { db } from "./db";
import { notes, questions, type CreateNoteRequest, type ReviewRequest, type Note, type Question } from "@shared/schema";
import { eq, lte, gt, asc } from "drizzle-orm";

export interface IStorage {
  createNote(note: CreateNoteRequest): Promise<Note>;
  getNotes(): Promise<Note[]>;
  createQuestions(items: { noteId: number, questionText: string, answerText: string }[]): Promise<void>;
  getDailyQuestion(): Promise<Question | undefined>;
  getQuestion(id: number): Promise<Question | undefined>;
  updateQuestionReview(id: number, interval: number, easeFactor: number, repetitions: number, nextReviewDate: Date): Promise<Question>;
  getMemoryStatus(): Promise<{ safe: number; unstable: number }>;
}

export class DatabaseStorage implements IStorage {
  async createNote(insertNote: CreateNoteRequest): Promise<Note> {
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }
  async getNotes(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(notes.createdAt);
  }
  async createQuestions(items: { noteId: number, questionText: string, answerText: string }[]): Promise<void> {
    if (items.length === 0) return;
    await db.insert(questions).values(items);
  }
  async getDailyQuestion(): Promise<Question | undefined> {
    const now = new Date();
    const [q] = await db.select()
      .from(questions)
      .where(lte(questions.nextReviewDate, now))
      .orderBy(asc(questions.nextReviewDate))
      .limit(1);
    return q;
  }
  async getQuestion(id: number): Promise<Question | undefined> {
    const [q] = await db.select().from(questions).where(eq(questions.id, id));
    return q;
  }
  async updateQuestionReview(id: number, interval: number, easeFactor: number, repetitions: number, nextReviewDate: Date): Promise<Question> {
    const [q] = await db.update(questions)
      .set({ interval, easeFactor, repetitions, nextReviewDate })
      .where(eq(questions.id, id))
      .returning();
    return q;
  }
  async getMemoryStatus(): Promise<{ safe: number; unstable: number }> {
    const now = new Date();
    const all = await db.select().from(questions);
    let safe = 0;
    let unstable = 0;
    all.forEach(q => {
      if (q.nextReviewDate <= now) unstable++;
      else safe++;
    });
    return { safe, unstable };
  }
}

export const storage = new DatabaseStorage();
