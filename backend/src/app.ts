import express, { Request, Response } from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
const app = express();
const PORT = 3000;

dotenv.config();
app.use(express.json());
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
      messages: prompts,
      model: "llama-3.3-70b-versatile",
    })
    .then((chatCompletion) => {
      // console.log(chatCompletion.choices[0]?.message?.content || "");
      return chatCompletion;
    });
  return completion.choices;
}


app.post("/chat", async (req: Request, res: Response) => {
  const response = await mainChat({
    prompts: req.body.request_prompt,
  });
  res.json(response);
});

// expected paylaod for /chat
// {
//   "request_prompt": [
//     {
//       "role": "user",
//       "content": "hey i am vinay"
//     }
//   ]
// }

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
