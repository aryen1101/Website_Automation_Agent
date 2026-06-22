import client from "./llm.js";
import config from "../config.js";
import logger from "../logger.js";
import BrowserController from "../browser/browserController.js";
import {
  extractElements,
  formatElementsForPrompt,
} from "../browser/domExtractor.js";
import toolDefinitions from "./toolDefinitions.js";

const SYSTEM_PROMPT = `You are an autonomous website automation agent, similar to Browser Use.
You control a real Chromium browser by calling tools.

On every turn you receive:
- The overall GOAL.
- A list of the interactive elements currently visible, each with a label and the exact (x, y) coordinate to click.

How to fill a text field (do BOTH steps for EACH field):
1. Call click_on_screen with that field's (x, y) to focus it.
2. Call send_keys with the text for that field.

Rules:
- The goal usually has MORE THAN ONE field (e.g. Name AND Description). Fill EVERY field the goal mentions. Do not stop after the first one.
- Match fields to the goal by their labels (e.g. "Name"/"Username", "Description"/"Bio"). Adapt if labels differ slightly.
- Only use coordinates from the element list — never invent coordinates.
- If a field you need (or the Submit button) is not in the list, call scroll to reveal more of the page.
- AFTER all required fields are filled, if the goal asks you to submit, click the Submit button (a button labelled "Submit", "Save", "Send" or similar) using click_on_screen.
- Only call task_complete once you have filled ALL the fields AND clicked Submit (when submission is requested). In its summary, list each field you filled, its value, and whether you submitted.
- Do not repeat an action that already succeeded.`;

export async function runAgent({ url, goal, onEvent = () => {} }) {
  const browser = new BrowserController({
    headless: config.headless,
    slowMo: config.slowMo,
  });

  const emit = (event) => {
    try {
      onEvent(event);
    } catch (_) {}
  };

  let result = { success: false, summary: "Agent did not finish.", step: 0 };
  let done = false;

  try {
    await browser.openBrowser();
    emit({ type: "log", message: "Browser Launched." });

    await browser.navigate_to_url(url);
    emit({ type: "log", message: `Navigated to ${url}` });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `GOAL: ${goal}` },
    ];

    for (let step = 1; step <= config.maxSteps && !done; step++) {
      logger.step(`--- Step ${step}/${config.maxSteps} ---`);

      const shot = await browser.take_screenshot(`step${step}`);
      const elements = await extractElements(browser.page);
      const elementText = formatElementsForPrompt(elements);

      emit({
        type: "observation",
        step,
        screenshot: shot.base64,
        elements,
        url: browser.page.url(),
      });

      messages.push({
        role: "user",
        content:
          `Step ${step}. Current page: ${browser.page.url()}\n\n` +
          `Interactive elements visible now:\n${elementText}\n\n` +
          `Decide the next action(s) by calling tools. You may call several tools at once ` +
          `(e.g. click a field then send_keys) to fill a field in one turn.`,
      });

      let completion;
      try {
        completion = await client.chat.completions.create({
          model: config.model,
          messages,
          tools: toolDefinitions,
          tool_choice: "auto",
          temperature: 0.2,
          max_tokens: 700,
        });
      } catch (err) {
        logger.error("LLM API error", err.message);
        emit({ type: "error", step, message: `LLM API error: ${err.message}` });
        break;
      }

      const choice = completion.choices?.[0]?.message;
      if (!choice) {
        emit({ type: "error", step, message: "Empty response from model." });
        break;
      }
      messages.push(choice);

      const toolCalls = choice.tool_calls || [];
      if (!toolCalls.length) {
        logger.info("Model returned no tool call", choice.content);
        emit({
          type: "thought",
          step,
          message: choice.content || "(no action)",
        });
        messages.push({
          role: "user",
          content:
            "Please respond by calling one or more tools to make progress.",
        });
        continue;
      }

      for (const call of toolCalls) {
        const name = call.function.name;
        let args = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch (_) {
          args = {};
        }

        logger.info(`Model chose: ${name}`, args);
        emit({ type: "action", step, tool: name, args });

        if (name === "task_complete") {
          result = {
            success: true,
            summary: args.summary || "Task complete.",
            steps: step,
          };
          done = true;
          emit({ type: "done", step, summary: result.summary });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: "acknowledged",
          });
          continue;
        }

        let toolResult;
        try {
          toolResult = await dispatchTool(browser, name, args);
        } catch (err) {
          toolResult = `ERROR running ${name}: ${err.message}`;
          logger.error(toolResult);
          emit({ type: "error", step, message: toolResult });
        }

        const resultText =
          typeof toolResult === "string"
            ? toolResult
            : toolResult?.message || "ok";
        emit({ type: "result", step, tool: name, message: resultText });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: resultText,
        });
      }

      if (!done && step === config.maxSteps) {
        result = {
          success: false,
          summary: `Reached max steps (${config.maxSteps}) without calling task_complete.`,
          steps: step,
        };
        emit({ type: "done", step, summary: result.summary });
      }
    }
  } catch (err) {
    logger.error("Agent crashed", err.message);
    result = {
      success: false,
      summary: `Agent error: ${err.message}`,
      steps: result.steps,
    };
    emit({ type: "error", message: result.summary });
  } finally {
    // Leave the browser open briefly so the final state is visible, then close.
    await browser.page?.waitForTimeout(1500).catch(() => {});
    await browser.close();
    emit({ type: "closed" });
  }

  return result;
}

async function dispatchTool(browser, name, args) {
  switch (name) {
    case "navigate_to_url":
      return browser.navigate_to_url(args.url);
    case "click_on_screen":
      return browser.click_on_screen(args.x, args.y);
    case "double_click":
      return browser.double_click(args.x, args.y);
    case "send_keys":
      return browser.send_keys(args.text);
    case "scroll":
      return browser.scroll(args.amount ?? 400);
    case "take_screenshot":
      return browser.take_screenshot("manual");
    default:
      return `Unknown tool: ${name}`;
  }
}