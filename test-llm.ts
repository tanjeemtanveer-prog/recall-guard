import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import OpenAI from "openai";

async function test() {

  console.log("KEY:", process.env.OPENROUTER_API_KEY);

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const response = await openai.chat.completions.create({
    model: "mistralai/mistral-7b-instruct",
    messages: [
      {
        role: "system",
        content:
          "Extract 1 recall question and answer from the text. Return JSON as { \"questions\": [ { \"questionText\": \"...\", \"answerText\": \"...\" } ] }."
      },
      {
        role: "user",
        content:
          "Photosynthesis is the process by which green plants convert sunlight into chemical energy using chlorophyll."
      }
    ],
    response_format: { type: "json_object" },
    extra_headers: {
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "RecallGuard"
    }
  });

  console.log("RAW:", response.choices[0]?.message?.content);

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  console.log("PARSED:", parsed);
}

test().catch(console.error);