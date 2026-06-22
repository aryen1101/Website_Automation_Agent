export async function extractElements(page) {
  return page.evaluate(() => {
    const SELECTOR =
      "input, textarea, select, button, a[href], [role='button'], [role='textbox'], [contenteditable='true']";

    const elements = Array.from(document.querySelectorAll(SELECTOR));
    const results = [];

    const isVisible = (e1, rect) => {
      const style = window.getComputedStyle(e1);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        Number(style.opacity) > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight
      );
    };

    let index = 0;
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (!isVisible(el, rect)) continue;

      const text = (el.innerText || el.value || "").trim().slice(0, 60);
      results.push({
        index: index++,
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type") || "",
        role: el.getAttribute("role") || "",
        name: el.getAttribute("name") || "",
        placeholder: el.getAttribute("placeholder") || "",
        ariaLabel: el.getAttribute("aria-label") || "",
        label: labelFor(el),
        text,
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });

      if (results.length >= 40) break; 
    }

    return results
  });
}

export function formatElementsForPrompt(elements) {
  if (!elements.length) return "(no interactive elements visible in viewport)";
  return elements
    .map((e) => {
      const descriptor =
        e.label ||
        e.ariaLabel ||
        e.placeholder ||
        e.text ||
        e.name ||
        "(unlabelled)";
      const kind = e.type ? `${e.tag}[${e.type}]` : e.tag;
      return `#${e.index} ${kind} "${descriptor}" -> click at (x=${e.x}, y=${e.y})`;
    })
    .join("\n");
}

