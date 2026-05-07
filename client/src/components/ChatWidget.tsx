import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { chatApi } from '../api/chat';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const PLACEHOLDER_EXAMPLES = [
  'лучшие маршруты в Россию',
  'Direct-маршруты дешевле 0.05',
  'HQ-маршруты в Германию',
];

export default function ChatWidget() {
  const { isOpen, activeRoute, openChat, closeChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      if (activeRoute && messages.length === 0) {
        setMessages([
          {
            role: 'assistant',
            text: `Контекст: маршрут ${activeRoute.country} (${activeRoute.routeType.toUpperCase()}, ${activeRoute.provider?.name ?? '—'}). Введите запрос для поиска лучших альтернатив.`,
          },
        ]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const { answer } = await chatApi.ask({
        message: text,
        routeId: activeRoute?.id,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Ошибка соединения с сервером.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    closeChat();
    setMessages([]);
    setInput('');
  };

  const placeholder =
    PLACEHOLDER_EXAMPLES[Math.floor(messages.length / 2) % PLACEHOLDER_EXAMPLES.length];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => (isOpen ? handleClose() : openChat())}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        title="AI-поиск маршрутов"
        style={{ width: 52, height: 52 }}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4-1-4z" />
          </svg>
        )}

        {!isOpen && activeRoute && (
          <span className="absolute -top-1.5 -left-1.5 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-medium max-w-20 truncate">
            {activeRoute.country}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ height: 420 }}
        >
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="text-white text-sm font-semibold">AI-поиск маршрутов</p>
              {activeRoute ? (
                <p className="text-indigo-200 text-xs mt-0.5 truncate">
                  Контекст: {activeRoute.country} · {activeRoute.routeType.toUpperCase()}
                </p>
              ) : (
                <p className="text-indigo-200 text-xs mt-0.5">Поиск по всем маршрутам</p>
              )}
            </div>
            {activeRoute && (
              <button
                onClick={() => { setMessages([]); openChat(); }}
                className="text-indigo-200 hover:text-white text-xs transition-colors ml-2"
                title="Сбросить контекст"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center mt-6">
                <p className="text-gray-400 dark:text-gray-500 text-xs">Спросите, например:</p>
                {PLACEHOLDER_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="block w-full mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md px-2 py-1 transition-colors text-left"
                  >
                    «{ex}»
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl rounded-bl-sm px-3 py-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2.5 shrink-0 flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
