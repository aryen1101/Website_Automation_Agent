const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "navigate_to_url",
      description: "navigate a browser to a specific URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to open." },
        },
        required: ["url"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "click_on_screen",
      description:
        "Click the mouse at viewport coordinates. Use the (x , y) coordinates given in the interactive-elements list to click specific field or button.",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X coordinate in pixels." },
          y: { type: "number", description: "Y coordinate in pixels." },
        },
        required: ["x", "y"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "double_click",
      description:
        "Double-Click the mouse at viewport coordinates. Useful to select existing text in a field before overwriting it.",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X coordinate in pixels." },
          y: { type: "number", description: "Y coordinate in pixels." },
        },
        required: ["x", "y"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "send_keys",
      description:
        "Type text into the current focused field. Always click_on_screen the target field first so it has focus. The field is cleared before typing.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The text to type." },
        },
        required: ["text"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "scroll",
      description:
        "Scroll the page vertically yo reveal hidden elements. Positive scrolls down, Negative scrolls up.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Pixels to scroll." },
        },
        required: ["amount"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "take_screenshot",
      description:
        "Capture the current browser view. A fresh screenshot and element list are provided automatically after every action, so only call this if you explicitly want to re-check the page.",
      parameters: { type: "object", properties: {} },
    },
  },

  {
    type: "function",
    function: {
      name: "task_complete",
      description:
        "Call this when the task is finished. Provide a short summary of what was accomplished.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description:
              "Summary of what was done (e.g. which fields were filled).",
          },
        },
        required: ["summary"],
      },
    },
  },
];

export default toolDefinitions;
