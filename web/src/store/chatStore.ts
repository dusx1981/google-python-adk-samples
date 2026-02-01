import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Message, Session, SessionInfo, ToolCall } from '@/types';

interface ChatState {
  // Sessions
  sessions: SessionInfo[];
  currentSessionId: string | null;
  
  // Current session messages
  messages: Message[];
  
  // Loading states
  isLoading: boolean;
  isConnected: boolean;
  
  // Actions
  setSessions: (sessions: SessionInfo[]) => void;
  setCurrentSession: (sessionId: string | null) => void;
  addSession: (session: SessionInfo) => void;
  removeSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionLastMessage: (sessionId: string) => void;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  
  addToolCall: (messageId: string, toolCall: ToolCall) => void;
  updateToolCall: (messageId: string, toolCallId: string, updates: Partial<ToolCall>) => void;
  
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  
  createNewSession: () => string;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
      isConnected: false,

      // Session actions
      setSessions: (sessions) => set({ sessions }),
      
      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId });
        // Clear messages when switching sessions (they'll be loaded from API)
        set({ messages: [] });
      },
      
      addSession: (session) => set((state) => ({
        sessions: [session, ...state.sessions]
      })),
      
      removeSession: (sessionId) => set((state) => {
        const newSessions = state.sessions.filter(s => s.id !== sessionId);
        const newCurrentId = state.currentSessionId === sessionId 
          ? (newSessions.length > 0 ? newSessions[0].id : null)
          : state.currentSessionId;
        return { 
          sessions: newSessions,
          currentSessionId: newCurrentId,
          messages: state.currentSessionId === sessionId ? [] : state.messages
        };
      }),
      
      updateSessionTitle: (sessionId, title) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId ? { ...s, title } : s
        )
      })),
      
      updateSessionLastMessage: (sessionId) => set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === sessionId 
            ? { ...s, lastMessageAt: new Date().toISOString() }
            : s
        )
      })),

      // Message actions
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      
      updateMessage: (messageId, updates) => set((state) => ({
        messages: state.messages.map(m => 
          m.id === messageId ? { ...m, ...updates } : m
        )
      })),
      
      clearMessages: () => set({ messages: [] }),

      // Tool call actions
      addToolCall: (messageId, toolCall) => set((state) => ({
        messages: state.messages.map(m => 
          m.id === messageId 
            ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] }
            : m
        )
      })),
      
      updateToolCall: (messageId, toolCallId, updates) => set((state) => ({
        messages: state.messages.map(m => 
          m.id === messageId && m.toolCalls
            ? { 
                ...m, 
                toolCalls: m.toolCalls.map(tc => 
                  tc.id === toolCallId ? { ...tc, ...updates } : tc
                )
              }
            : m
        )
      })),

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),
      setConnected: (connected) => set({ isConnected: connected }),

      // Create new session
      createNewSession: () => {
        const sessionId = uuidv4();
        const now = new Date().toISOString();
        const newSession: SessionInfo = {
          id: sessionId,
          title: '新会话',
          createdAt: now,
          lastMessageAt: now
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: sessionId,
          messages: []
        }));
        return sessionId;
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        sessions: state.sessions,
        currentSessionId: state.currentSessionId 
      })
    }
  )
);
