import { z } from "zod";
import { insertNoteSchema, questions, notes } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  notes: {
    create: {
      method: "POST" as const,
      path: "/api/notes" as const,
      input: insertNoteSchema,
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: "GET" as const,
      path: "/api/notes" as const,
      responses: {
        200: z.array(z.custom<typeof notes.$inferSelect>()),
      },
    }
  },
  questions: {
    getDaily: {
      method: "GET" as const,
      path: "/api/questions/daily" as const,
      responses: {
        200: z.custom<typeof questions.$inferSelect>().nullable(),
      },
    },
    review: {
      method: "POST" as const,
      path: "/api/questions/:id/review" as const,
      input: z.object({ quality: z.number().min(0).max(5) }),
      responses: {
        200: z.custom<typeof questions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    },
    status: {
      method: "GET" as const,
      path: "/api/questions/status" as const,
      responses: {
        200: z.object({
          safe: z.number(),
          unstable: z.number(),
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type NoteInput = z.infer<typeof api.notes.create.input>;
export type ReviewInput = z.infer<typeof api.questions.review.input>;
