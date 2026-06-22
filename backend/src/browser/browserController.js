import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../logger.js";

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(_dirname, "../../screenshots");

export default class BrowserController {
  constructor({ headless = false, slowMo = 0 } = {}) {
    this.headless = headless;
    this.slowMo = slowMo;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.viewport = { with: 1280, height: 800 };

    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  }

  async openBrowser() {
    logger.tool("open_browser", {
      headless: this.headless,
      slowMo: this.slowMo,
    });
    this.browser = await chromium.launch({
      headless: this.headless,
      slowMo: this.slowMo,
      args: [
        `--window-size=${this.viewport.width},${this.viewport.height}`,
        "--window-position=0,0",
      ],
    });
    this.context = await this.browser.newContext({ viewport: null });
    this.page = await this.context.newPage();
    return "BROWSER LAUNCHED.";
  }

  async navigate_to_url(url) {
    logger.tool("navigate_to_url", url);
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await this.page.waitForTimeout(1500);
    return `NAVIGATED TO ${url}`;
  }

  async take_screenshot(label = "step") {
    const safe = label.replace(/[^a-z0-9-_]/gi, "_").slice(0, 40);
    const filename = `${Date.now()}_${safe}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    const buffer = await this.page.screenshot({ path: filepath });
    logger.tool("take_screenshot", filename);
    return {
      message: `Screenshot saved as ${filename}`,
      filepath,
      base64: buffer.toString("base64"),
    };
  }

  async click_on_screen(x , y) {
    logger.tool("click_on_screen", {x , y});
    await this.page.mouse.move(x,y)
    await this.page.mouse.click(x,y)
    await this.page.waitForTimeout(400)
    return `Clicked at (${x}, ${y})`;
  }

  async double_click(x, y) {
    logger.tool("double_click", { x, y });
    await this.page.mouse.dblclick(x, y);
    await this.page.waitForTimeout(400);
    return `Double-clicked at (${x}, ${y})`;
  }

  async send_keys(text) {
    logger.tool("send_keys", text)
    await this.page.keyboard.press("ControlOrMeta+A")
    await this.page.keyboard.press("Backspace")
    await this.page.keyboard.type(String(text), {delay: 30})
    await this.page.waitForTimeout(300)
    return `Typed: "${text}"`;
  }

  async scroll(amount = 400){
    logger.tool("scroll", {amount})
    await this.page.mouse.wheel(0, Number(amount))
    await this.page.waitForTimeout(400);
    return `Scrolled by ${amount}px`;
  }

  async close() {
    try {
      if (this.browser) await this.browser.close();
      logger.info("Browser closed.");
    } catch (err) {
      logger.error("Error closing browser", err.message);
    }
  }
}

export { SCREENSHOT_DIR };
