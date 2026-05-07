import { createContext, useContext, useState } from 'react';
import type { Route } from '../types';

interface ChatContextValue {
  isOpen: boolean;
  activeRoute: Route | null;
  openChat: (route?: Route) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);

  const openChat = (route?: Route) => {
    setActiveRoute(route ?? null);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <ChatContext.Provider value={{ isOpen, activeRoute, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
