import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.post(api.notes.create.path, async (req, res) => {
    try {
      const input = api.notes.create.input.parse(req.body);
      const note = await storage.createNote(input);
      
      // Generate questions from the note using OpenAI
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: "You are a learning assistant. Extract 1 to 3 key recall questions and precise answers from the provided text. Return JSON as { \"questions\": [ { \"questionText\": \"...\", \"answerText\": \"...\" } ] }." },
            { role: "user", content: input.content }
          ],
          response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(response.choices[0]?.message?.content || "{}");
        if (result.questions && Array.isArray(result.questions)) {
          const toInsert = result.questions.map((q: any) => ({
            noteId: note.id,
            questionText: q.questionText,
            answerText: q.answerText
          }));
          await storage.createQuestions(toInsert);
        }
      } catch (aiError) {
        console.error("AI Error:", aiError);
      }
      
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.notes.list.path, async (req, res) => {
    const notesList = await storage.getNotes();
    res.json(notesList);
  });

  app.get(api.questions.getDaily.path, async (req, res) => {
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

      // SM-2 Algorithm implementation
      let { interval, easeFactor, repetitions } = question;
      const quality = input.quality;

      if (quality >= 3) {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
      } else {
        repetitions = 0;
        interval = 1;
      }

      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const updated = await storage.updateQuestionReview(id, interval, easeFactor, repetitions, nextReviewDate);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.questions.status.path, async (req, res) => {
    const status = await storage.getMemoryStatus();
    res.json(status);
  });

  // Seed data
  setTimeout(async () => {
    try {
      const existing = await storage.getNotes();
      if (existing.length === 0) {
        const note = await storage.createNote({ content: "The mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell's biochemical reactions." });
        await storage.createQuestions([
          {
            noteId: note.id,
            questionText: "What is the function of the mitochondria?",
            answerText: "It generates most of the chemical energy needed to power the cell's biochemical reactions."
          }
        ]);
      }
    } catch (e) {
      console.error("Seed error:", e);
    }
  }, 1000);

  return httpServer;
}
