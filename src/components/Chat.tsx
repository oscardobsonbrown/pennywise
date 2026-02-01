import { useState, useRef, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import { BrailleSpinner } from "./BrailleSpinner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  hasApiKey: boolean;
  isDemo: boolean;
  onSubmit: (prompt: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

const WIDTH_STORAGE_KEY = "tax-chat-width";
const MIN_WIDTH = 320;
const MAX_WIDTH_PERCENT = 0.5;

function loadWidth(): number {
  try {
    const stored = localStorage.getItem(WIDTH_STORAGE_KEY);
    if (stored) {
      return Math.max(MIN_WIDTH, parseInt(stored, 10));
    }
  } catch {
    // Ignore errors
  }
  return 360;
}

function saveWidth(width: number) {
  try {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  } catch {
    // Ignore errors
  }
}

export function Chat({ messages, isLoading, hasApiKey, isDemo, onSubmit, onNewChat, onClose }: Props) {
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(() => loadWidth());
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isResizing) {
      saveWidth(width);
    }
  }, [width, isResizing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const maxWidth = window.innerWidth * MAX_WIDTH_PERCENT;
      const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (prompt && !isLoading) {
      onSubmit(prompt);
      setInput("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const prompt = input.trim();
      if (prompt && !isLoading) {
        onSubmit(prompt);
        setInput("");
      }
    }
  }

  function handleNewChat() {
    onNewChat();
    inputRef.current?.focus();
  }

  return (
    <div
      className="flex flex-col h-full bg-[var(--color-bg)] border-l border-[var(--color-border)] relative"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--color-border)] z-10"
      />
      {/* Header */}
      <header className="h-12 px-4 flex items-center justify-between border-b border-[var(--color-border)]">
        <span className="text-sm">Chat</span>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="px-2 py-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] rounded-lg"
            >
              New
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] rounded-lg"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full" />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className="text-xs text-[var(--color-text-muted)] mb-1">
                  {message.role === "user" ? "You" : "Claude"}
                </div>
                <div className="text-sm prose-chat">
                  <Markdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-text-muted)]">
                          {children}
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="prose-code px-1 py-0.5 bg-[var(--color-bg-muted)] rounded text-xs font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="my-2 p-2 bg-[var(--color-bg-muted)] rounded text-xs font-mono overflow-x-auto">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </Markdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-1">Claude</div>
                <BrailleSpinner className="text-sm" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestions - show when empty and no input */}
      {messages.length === 0 && (isDemo || hasApiKey) && (
        <div
          className="px-4 pb-2 space-y-2 transition-opacity duration-150"
          style={{ opacity: input ? 0 : 1, pointerEvents: input ? "none" : "auto" }}
        >
          <p className="text-sm font-medium text-[var(--color-text)]">Chat about your taxes</p>
          {[
            "Any recommendations?",
            "How can I optimize next year?",
            "Summarize my tax situation",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                onSubmit(suggestion);
              }}
              className="block text-left text-xs px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 pt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isDemo || hasApiKey ? "Ask anything..." : "Need API key"}
          disabled={(!isDemo && !hasApiKey) || isLoading}
          rows={1}
          className="w-full px-3 py-2.5 bg-[var(--color-bg-muted)] rounded-lg text-sm placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none disabled:opacity-50 overflow-y-auto"
        />
      </form>
    </div>
  );
}
