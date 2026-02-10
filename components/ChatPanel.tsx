'use client';

import { useState } from 'react';

interface ChatPanelProps {
  dishId: string;
  window?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    reviewsAnalyzed?: number;
    avgRating?: number;
    keywordsMatched?: string[];
  };
}

function renderMarkdown(text: string) {
  // Split into lines and render markdown-like formatting
  return text.split('\n').map((line, i) => {
    // Blockquote lines
    if (line.startsWith('> ')) {
      const content = line.slice(2);
      return (
        <blockquote key={i} className="border-l-3 border-purple-300 pl-3 my-2 text-sm text-gray-600 italic">
          {renderInline(content)}
        </blockquote>
      );
    }
    // Bullet points
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="text-sm text-gray-700 ml-4 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    }
    // Empty lines
    if (!line.trim()) return <div key={i} className="h-2" />;
    // Normal lines
    return (
      <p key={i} className="text-sm text-gray-700">
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(text: string) {
  // Handle **bold** and *italic*
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

export function ChatPanel({ dishId, window = '24h' }: ChatPanelProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const suggestedQuestions = [
    'Is this dish worth trying?',
    'Any complaints recently?',
    'Is the quality consistent?',
    'How is the spice level?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    await askQuestion(question);
  };

  const askQuestion = async (q: string) => {
    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const baseUrl = process.env.BACKEND_URL || '';
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishAtRestaurantId: dishId,
          question: q,
          window,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        metadata: data.metadata,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-lg font-semibold text-gray-900">
          Ask About This Dish
        </h2>
      </div>

      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq) => (
              <button
                key={sq}
                onClick={() => askQuestion(sq)}
                disabled={isLoading}
                className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="mb-4 max-h-96 overflow-y-auto space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-purple-100 text-purple-900 ml-8'
                  : 'bg-white border border-purple-100'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm font-medium">{msg.content}</p>
              ) : (
                <div>
                  {renderMarkdown(msg.content)}
                  {msg.metadata?.reviewsAnalyzed !== undefined && (
                    <p className="mt-2 text-xs text-gray-400">
                      Based on {msg.metadata.reviewsAnalyzed} review(s)
                      {msg.metadata.avgRating !== undefined && (
                        <> · avg {msg.metadata.avgRating}/5</>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-white border border-purple-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="animate-spin">⏳</span> Analyzing reviews...
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about freshness, taste, value..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
