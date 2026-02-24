import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import { users } from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";
import { generateToken } from "./auth.js";
import { requireAuth } from "./middleware.js";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ==========================
  // SIGNUP
  // ==========================
  app.post("/api/signup", async (req, res) => {

    const { email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users)
      .values({ email, passwordHash })
      .returning();

    const token = generateToken(user.id);

    res.json({ token });

  });

  // ==========================
  // LOGIN
  // ==========================
  app.post("/api/login", async (req, res) => {

    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user.id);

    res.json({ token });

  });

  // ==========================
  // CREATE NOTE
  // ==========================
  app.post(api.notes.create.path, requireAuth, async (req, res) => {

    try {

      const userId = (req as any).userId;
      const input = api.notes.create.input.parse(req.body);

      const note = await storage.createNote(userId, input);

      const defaultQuestion = {
        userId,
        noteId: note.id,
        questionText: "What is the key idea of this note?",
        answerText: input.content,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: new Date()
      };

      try {

        if (process.env.AI_MODE === "true" && process.env.OPENROUTER_API_KEY) {

          const openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
          });

          const response = await openai.chat.completions.create(
            {
              model: "mistralai/mistral-7b-instruct",
              messages: [
                {
                  role: "system",
                  content: `
Generate 1 to 3 recall questions from the study note.

Return STRICT JSON:

{
  "questions": [
    {
      "questionText": "...",
      "answerText": "..."
    }
  ]
}
`
                },
                { role: "user", content: input.content }
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
              max_tokens: 200
            },
            {
              headers: {
                "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
                "X-Title": "RecallGuard"
              }
            }
          );

          const raw = response.choices?.[0]?.message?.content;

          if (!raw) {
            await storage.createQuestions([defaultQuestion]);
          } else {

            let parsed: any;

            try {
              parsed = JSON.parse(raw);
            } catch {
              const match = raw.match(/\{[\s\S]*\}/);
              if (!match) throw new Error("Bad JSON");
              parsed = JSON.parse(match[0]);
            }

            if (parsed?.questions?.length) {

              const toInsert = parsed.questions.map((q: any) => ({
                userId,
                noteId: note.id,
                questionText: q.questionText ?? defaultQuestion.questionText,
                answerText: q.answerText ?? defaultQuestion.answerText,
                interval: 1,
                easeFactor: 2.5,
                repetitions: 0,
                nextReviewDate: new Date()
              }));

              await storage.createQuestions(toInsert);

            } else {
              await storage.createQuestions([defaultQuestion]);
            }
          }

        } else {
          await storage.createQuestions([defaultQuestion]);
        }

      } catch {
        await storage.createQuestions([defaultQuestion]);
      }

      res.status(201).json(note);

    }
    catch (err) {

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }

      return res.status(500).json({ message: "Internal error creating note" });
    }
  });

  // ==========================
  // LIST NOTES
  // ==========================
  app.get(api.notes.list.path, requireAuth, async (req, res) => {

    const userId = (req as any).userId;

    const notesList = await storage.getNotes(userId);
    res.json(notesList);
  });

  // ==========================
  // DAILY QUESTION
  // ==========================
  app.get(api.questions.getDaily.path, requireAuth, async (req, res) => {

    const userId = (req as any).userId;

    const q = await storage.getDailyQuestion(userId);
    res.json(q || null);
  });

  // ==========================
  // REVIEW
  // ==========================
  app.post(api.questions.review.path, requireAuth, async (req, res) => {

    try {

      const userId = (req as any).userId;
      const id = Number(req.params.id);
      const input = api.questions.review.input.parse(req.body);

      const question = await storage.getQuestion(userId, id);
      if (!question)
        return res.status(404).json({ message: "Not found" });

      let { interval, easeFactor, repetitions } = question;
      const quality = input.quality;

      if (quality >= 3) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetitions += 1;
      } else {
        repetitions = 0;
        interval = 1;
      }

      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const updated = await storage.updateQuestionReview(
        userId,
        id,
        interval,
        easeFactor,
        repetitions,
        nextReviewDate
      );

      res.json(updated);

    } catch (err) {

      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });

      return res.status(500).json({ message: "Internal error" });
    }
  });

  // ==========================
  // MEMORY STATUS
  // ==========================
  app.get(api.questions.status.path, requireAuth, async (req, res) => {

    const userId = (req as any).userId;

    const status = await storage.getMemoryStatus(userId);
    res.json(status);
  });

  return httpServer;
}