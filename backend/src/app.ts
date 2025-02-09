import express, { Request, response, Response } from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { reactBasePrompt } from "./defaults/react";
import { nodeBasePrompt } from "./defaults/node";
import cors from "cors";
const app = express();
const PORT = 8080;

app.use(cors());
dotenv.config();
app.use(express.json());
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function template(prompt: string) {
  console.log(prompt, "in template func");
  const appCreationPrompt = await groq.chat.completions
    .create({
      messages: [
        {
          role: "user",
          content:
            prompt +
            "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
        },
      ],
      model: "llama-3.3-70b-versatile",
    })
    .then((chatCompletion) => {
      // console.log(chatCompletion.choices[0]?.message?.content || "");

      const answer = chatCompletion.choices[0]?.message?.content || ""; // react or node
      console.log(answer, "answer");
      if (answer == "react") {
        const response = {
          prompts: [
            BASE_PROMPT,
            `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
          ],
          uiPrompts: [reactBasePrompt],
        };
        return response;
      }

      if (answer === "node") {
        const response = {
          prompts: [
            `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
          ],
          uiPrompts: [nodeBasePrompt],
        };
        return response;
      } else {
        return "Invalid response";
      }

      // return chatCompletion;
    });
  return appCreationPrompt;
}

// console.log("system prompt", getSystemPrompt(), "system prompt");

async function mainChat({
  prompts,
}: {
  prompts: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}) {
  const completion = await groq.chat.completions
    .create({
      messages: [...prompts, { role: "system", content: getSystemPrompt() }],
      model: "llama-3.3-70b-versatile",
    })
    .then((chatCompletion) => {
      // console.log(chatCompletion.choices[0]?.message?.content || "");
      return chatCompletion;
    });
  return completion.choices;
}

app.post("/template", async (req: Request, res: Response) => {
  const prompt = req.body.prompt;
  console.log(prompt);
  const response = await template(prompt);
  res.json(response);
});

app.post("/chat", async (req: Request, res: Response) => {
  console.log(req.body.prompts);
  const response = await mainChat({
    prompts: req.body.prompts,
  });
  console.log(response, "RESSSS");
  res.json(response);
});

// expected paylaod for /chat
// {
//   "prompts": [
//     {
//       "role": "user",
//       "content": "hey i am vinay"
//     }
//   ]
// }

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
