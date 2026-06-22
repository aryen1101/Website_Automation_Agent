import "dotenv/config";

const config = {
  apiKey: process.env.OPENROUTER_API_KEY,
  port: Number(process.env.PORT) || 3000,
  headless: String(process.env.HEADLESS).toLowerCase() === "true",
  maxSteps: Number(process.env.MAX_STEPS) || 15,
  slowMo: Number(process.env.SLOW_MO) || 400,
  model: "google/gemini-2.0-flash-001",

  defaultUrl: "https://ui.shadcn.com/docs/forms/react-hook-form",
  defaultGoal:
    "Find the form input fields on the page (such as Name / Username and Description) " +
    "and fill in EVERY one of them with sensible sample values. " +
    "Use Name = 'BrowserUse Agent' and Description = 'An autonomous web automation agent built with Playwright.' " +
    "If a field is labelled differently, adapt intelligently. " +
    "After ALL fields are filled, click the form's Submit button to submit the form. " +
    "Only then is the task complete.",
};

if (!config.apiKey) {
  console.warn(
    "[config] WARNING: OPENROUTER_API_KEY is not set. Copy .env.example to .env and add your key from https://openrouter.ai/keys",
  );
}

export default config;
