'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceReviewChatProps {
  dishId: string;
  onReviewSubmitted?: () => void;
}

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

const TEMPLATE_MSG = `🎙️ Voice Review

Tap the microphone and tell me about your experience! Here's what to mention:

📋 Template:
• Your rating (1 to 5 stars)
• How was the taste and quality?
• Portion size and presentation
• Value for money
• Would you recommend it?

💡 Example: "I'd give this a 4 out of 5. The flavors were incredible and the portion was generous. Definitely worth the price!"`;

export function VoiceReviewChat({ dishId, onReviewSubmitted }: VoiceReviewChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'bot', text: TEMPLATE_MSG }]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extractedRating, setExtractedRating] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  /* ── speech recognition ── */
  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setIsSupported(false); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        processTranscript(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript('');
    setError(null);
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  /* ── parse the transcript for rating + review ── */
  const processTranscript = (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', text }]);

    // Try to extract numeric rating
    let rating: number | null = null;
    const ratingPatterns = [
      /(\d)\s*(?:out of|\/)\s*5/i,
      /(\d)\s*stars?/i,
      /rating[:\s]+(\d)/i,
      /give\s+(?:it|this)\s+(?:a\s+)?(\d)/i,
    ];

    const wordToNum: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
    };

    for (const pattern of ratingPatterns) {
      const match = text.match(pattern);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 5) { rating = num; break; }
      }
    }

    if (!rating) {
      for (const [word, num] of Object.entries(wordToNum)) {
        const wp = new RegExp(`${word}\\s*(?:out of|/|stars?)`, 'i');
        if (wp.test(text)) { rating = num; break; }
      }
    }

    // Clean up review text
    let reviewText = text
      .replace(/i('d|\s+would)\s+give\s+(it|this)\s+(a\s+)?\d\s*(out of\s*5|stars?|\/5)?[.,]?\s*/gi, '')
      .replace(/\d\s*(out of\s*5|\/5|stars?)\s*[.,]?\s*/gi, '')
      .replace(/rating[:\s]+\d\s*[.,]?\s*/gi, '')
      .trim();
    if (!reviewText) reviewText = text;

    setExtractedRating(rating);
    setExtractedText(reviewText);

    const botMsg = rating
      ? `Got it! Here's what I captured:\n\n⭐ Rating: ${rating}/5\n📝 Review: "${reviewText}"\n\nLooks good? Hit Submit or Re-record.`
      : `I captured your review but couldn't detect a rating.\n\n📝 Review: "${reviewText}"\n\nPlease select your rating below, then submit.`;

    setMessages((prev) => [...prev, { role: 'bot', text: botMsg }]);
  };

  /* ── submit the review ── */
  const handleSubmit = async () => {
    const finalRating = extractedRating || 4;
    if (!extractedText.trim()) {
      setError('No review text captured. Please record again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/dish/${dishId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: finalRating, text: extractedText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitted(true);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: '✅ Review submitted! Thank you for your feedback.' },
      ]);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      } else {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReRecord = () => {
    setTranscript('');
    setExtractedRating(null);
    setExtractedText('');
    setMessages([{ role: 'bot', text: TEMPLATE_MSG }]);
    setError(null);
  };

  /* ── collapsed state ── */
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
      >
        <span className="text-lg">🎙️</span>
        Record a Voice Review
      </button>
    );
  }

  /* ── expanded chat UI ── */
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🎙️</span>
        <h3 className="text-white font-semibold text-sm">Voice Review</h3>
        <span className="text-purple-200 text-xs ml-auto">Speech AI</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-purple-200 hover:text-white text-sm ml-2"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Live transcript while recording */}
        {isRecording && transcript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm bg-purple-100 text-purple-800 border border-purple-200">
              <span className="animate-pulse mr-1">🎤</span>
              {transcript}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Rating selector when not detected */}
      {extractedText && !extractedRating && !submitted && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500 mb-2">Select your rating:</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setExtractedRating(star)}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className={`w-7 h-7 ${
                    star <= (extractedRating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 fill-current'
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            {extractedRating && (
              <span className="text-sm text-gray-500 self-center ml-2">{extractedRating}/5</span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3">
        {!extractedText && !submitted ? (
          isSupported ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <span className="w-3 h-3 bg-white rounded-full animate-ping" />
                  Stop Recording
                </>
              ) : (
                <>🎤 Tap to Record Your Review</>
              )}
            </button>
          ) : (
            <p className="text-sm text-gray-500 text-center flex-1">
              Voice recording not supported in this browser. Use Chrome or Edge.
            </p>
          )
        ) : !submitted ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !extractedText}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {isSubmitting
                ? 'Submitting...'
                : `Submit Review${extractedRating ? ` (${extractedRating}⭐)` : ''}`}
            </button>
            <button
              onClick={handleReRecord}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors text-sm"
            >
              🔄 Redo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
