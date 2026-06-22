import config from "./config.js";
import logger from "./logger.js";
import { runAgent } from "./agent/agents.js";

const goal = process.argv[2] || config.defaultGoal
const url = process.argv[3] || config.defaultUrl

logger.info("Starting CLI agent run");
logger.info("URL", url);
logger.info("Goal", goal);

const result = await runAgent({
  url,
  goal,
  onEvent: (e) => {
    if (e.type === "action") logger.tool(`Action: ${e.tool}`, e.args);
    if (e.type === "result") logger.ok(e.message);
    if (e.type === "done") logger.ok(`DONE: ${e.summary}`);
  },
});

logger.ok("Final result", result);
process.exit(result.success ? 0 : 1);
