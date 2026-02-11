import { useRef, useEffect, useState, useCallback } from "react";
import type { RichTextEditorProps } from "./types";
import { RichTextToolbar } from "./RichTextToolbar";
import {
  executeCommand,
  getActiveFormats,
  insertLink,
  insertImage,
  cleanHTML,
} from "./utils/formatting";

const DEFAULT_TOOLS = [
  "textFormat",
  "bold",
  "italic",
  "more",
  "separator",
  "bulletList",
  "numberedList",
  "separator",
  "link",
  "image",
] as const;

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  tools = [...DEFAULT_TOOLS],
  minHeight = "150px",
  maxHeight = "400px",
  className = "",
  disabled = false,
  autoFocus = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const isUpdatingRef = useRef(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Update active formats on selection change
  useEffect(() => {
    const updateFormats = () => {
      setActiveFormats(getActiveFormats());
    };

    document.addEventListener("selectionchange", updateFormats);
    return () => document.removeEventListener("selectionchange", updateFormats);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const html = cleanHTML(editorRef.current.innerHTML);
      onChange(html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [onChange]);

  const handleCommand = useCallback(
    (command: string, commandValue?: string) => {
      if (!editorRef.current) return;

      editorRef.current.focus();

      switch (command) {
        case "createLink":
          if (commandValue) {
            insertLink(commandValue);
          }
          break;
        case "insertImage":
          if (commandValue) {
            insertImage(commandValue);
          }
          break;
        default:
          executeCommand(command as any, commandValue);
      }

      // Update content after command
      handleInput();
      setActiveFormats(getActiveFormats());
    },
    [handleInput],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}
    >
      <RichTextToolbar
        tools={tools}
        onCommand={handleCommand}
        activeFormats={activeFormats}
      />
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        className={`px-4 py-3 outline-none prose prose-sm max-w-none ${maxHeight === "none" ? "" : "overflow-y-auto"}`}
        style={{
          minHeight,
          maxHeight: maxHeight === "none" ? undefined : maxHeight,
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        [contenteditable] h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.12em 0;
        }
        [contenteditable] h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
        }
        [contenteditable] h6 {
          font-size: 0.75em;
          font-weight: bold;
          margin: 1.67em 0;
        }
        [contenteditable] p {
          margin: 1em 0;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        [contenteditable] li {
          margin: 0.5em 0;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
        }
        [contenteditable] code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
        }
        [contenteditable] pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
