import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import OpenAI from "openai";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  app.post(api.notes.create.path, async (req, res) => {
    try {

      const input = api.notes.create.input.parse(req.body);
      const note = await storage.createNote(input);

      const defaultQuestion = {
        noteId: note.id,
        questionText: "What is the key idea of this note?",
        answerText: input.content,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: new Date()
      };

      try {

        console.log("🧠 AI_MODE:", process.env.AI_MODE);
        console.log("🔑 KEY PRESENT:", !!process.env.OPENROUTER_API_KEY);

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
You are a flashcard generator.

From the given study note:
Generate 1 to 3 recall questions.

Return STRICT JSON in this format:

{
  "questions": [
    {
      "questionText": "...",
      "answerText": "..."
    }
  ]
}

DO NOT explain.
DO NOT use markdown.
DO NOT write anything outside JSON.
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
          console.log("🧠 RAW:", raw);

          if (!raw) {
            await storage.createQuestions([defaultQuestion]);
          } else {

            let parsed: any;

            try {
              parsed = JSON.parse(raw);
            } catch {

              const match = raw.match(/\{[\s\S]*\}/);
              if (!match) {
                throw new Error("AI returned non JSON");
              }
              parsed = JSON.parse(match[0]);
            }

            if (parsed?.questions?.length) {

              const toInsert = parsed.questions.map((q: any) => ({
                noteId: note.id,
                questionText: q.questionText ?? defaultQuestion.questionText,
                answerText: q.answerText ?? defaultQuestion.answerText,
                interval: 1,
                easeFactor: 2.5,
                repetitions: 0,
                nextReviewDate: new Date()
              }));

              await storage.createQuestions(toInsert);
            }
            else {
              await storage.createQuestions([defaultQuestion]);
            }
          }

        }
        else {
          await storage.createQuestions([defaultQuestion]);
        }

      }
      catch (aiError) {
        console.error("🚨 AI FAILED:", aiError);
        await storage.createQuestions([defaultQuestion]);
      }

      res.status(201).json(note);

    }
    catch (err) {

      console.error("Create note error:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }

      return res.status(500).json({ message: "Internal error creating note" });
    }
  });

  app.get(api.notes.list.path, async (_req, res) => {
    const notesList = await storage.getNotes();
    res.json(notesList);
  });

  app.get(api.questions.getDaily.path, async (_req, res) => {
    const q = await storage.getDailyQuestion();
    res.json(q || null);
  });

  app.post(api.questions.review.path, async (req, res) => {
    try {

      const id = Number(req.params.id);
      const input = api.questions.review.input.parse(req.body);

      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      let { interval, easeFactor, repetitions } = question;
      const quality = input.quality;

      if (quality >= 3) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetitions += 1;
      }
      else {
        repetitions = 0;
        interval = 1;
      }

      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const updated = await storage.updateQuestionReview(
        id,
        interval,
        easeFactor,
        repetitions,
        nextReviewDate
      );

      res.json(updated);

    }
    catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal error reviewing question" });
    }
  });

  app.get(api.questions.status.path, async (_req, res) => {
    const status = await storage.getMemoryStatus();
    res.json(status);
  });

  return httpServer;
}