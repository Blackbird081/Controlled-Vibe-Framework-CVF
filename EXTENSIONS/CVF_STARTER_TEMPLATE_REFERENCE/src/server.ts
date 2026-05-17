// src/server.ts

import express from "express";
import dotenv from "dotenv";
import { createOrchestrator } from "./app";
import { OpenAIProvider } from "./ai/providers/openai.provider";
import { ClaudeProvider } from "./ai/providers/claude.provider";
import { GeminiProvider } from "./ai/providers/gemini.provider";
import { SampleWorkflow } from "./workflows/sample.workflow";
import { healthCheck } from "./server/health.controller";

dotenv.config();

const app = express();
app.use(express.json());

const orchestrator = createOrchestrator();

// Health check endpoint
app.get("/health", healthCheck);

app.post("/execute", async (req, res) => {
  try {
    const { prompt, provider, model } = req.body;

    let aiProvider;

    switch (provider) {
      case "openai":
        aiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY!);
        break;
      case "claude":
        aiProvider = new ClaudeProvider(process.env.ANTHROPIC_API_KEY!);
        break;
      case "gemini":
        aiProvider = new GeminiProvider(process.env.GEMINI_API_KEY!);
        break;
      default:
        return res.status(400).json({
          error: `Unsupported provider: ${provider}. Use openai, claude, or gemini.`,
        });
    }

    const workflow = new SampleWorkflow(orchestrator);

    const result = await workflow.run({
      prompt,
      requestedBy: "api-user",
      provider: aiProvider,
      model,
      projectName: "cvf-starter-template",
    });

    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
