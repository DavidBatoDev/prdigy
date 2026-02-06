/**
 * Convert HTML to Markdown
 */
export function htmlToMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  return processNode(div);
}

function processNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  let result = "";

  switch (tagName) {
    case "h1":
      result = `# ${getTextContent(element)}\n\n`;
      break;
    case "h2":
      result = `## ${getTextContent(element)}\n\n`;
      break;
    case "h3":
      result = `### ${getTextContent(element)}\n\n`;
      break;
    case "h4":
      result = `#### ${getTextContent(element)}\n\n`;
      break;
    case "h5":
      result = `##### ${getTextContent(element)}\n\n`;
      break;
    case "h6":
      result = `###### ${getTextContent(element)}\n\n`;
      break;
    case "p":
      result = `${processChildren(element)}\n\n`;
      break;
    case "strong":
    case "b":
      result = `**${processChildren(element)}**`;
      break;
    case "em":
    case "i":
      result = `*${processChildren(element)}*`;
      break;
    case "u":
      result = `<u>${processChildren(element)}</u>`;
      break;
    case "s":
    case "strike":
    case "del":
      result = `~~${processChildren(element)}~~`;
      break;
    case "a":
      const href = element.getAttribute("href") || "";
      result = `[${processChildren(element)}](${href})`;
      break;
    case "img":
      const src = element.getAttribute("src") || "";
      const alt = element.getAttribute("alt") || "";
      result = `![${alt}](${src})`;
      break;
    case "ul":
      result = processChildren(element);
      break;
    case "ol":
      result = processChildren(element);
      break;
    case "li":
      const parent = element.parentElement;
      const isOrdered = parent?.tagName.toLowerCase() === "ol";
      const prefix = isOrdered ? "1. " : "- ";
      result = `${prefix}${processChildren(element)}\n`;
      break;
    case "blockquote":
      result = `> ${processChildren(element)}\n\n`;
      break;
    case "code":
      if (element.parentElement?.tagName.toLowerCase() === "pre") {
        result = `\`\`\`\n${getTextContent(element)}\n\`\`\`\n\n`;
      } else {
        result = `\`${getTextContent(element)}\``;
      }
      break;
    case "pre":
      result = processChildren(element);
      break;
    case "br":
      result = "\n";
      break;
    case "hr":
      result = "---\n\n";
      break;
    default:
      result = processChildren(element);
  }

  return result;
}

function processChildren(element: HTMLElement): string {
  let result = "";
  element.childNodes.forEach((child) => {
    result += processNode(child);
  });
  return result;
}

function getTextContent(element: HTMLElement): string {
  return element.textContent || "";
}

/**
 * Convert Markdown to HTML (basic implementation)
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />');

  // Code inline
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Code blocks
  html = html.replace(/```\n([\s\S]+?)\n```/g, "<pre><code>$1</code></pre>");

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br />");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  return html;
}
