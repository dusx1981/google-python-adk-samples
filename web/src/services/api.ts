import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '@/store/chatStore';
import type { SessionInfo, WebSocketMessage } from '@/types';

const API_BASE_URL = '';

class ChatService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // REST API Methods
  async getSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }

  async createSession(title: string = '新会话'): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions?title=${encodeURIComponent(title)}`, {
        method: 'POST',
      });
      const data = await response.json();
      return data.session_id || null;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  async getSessionMessages(sessionId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/messages`);
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  // WebSocket Methods
  connect(sessionId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/${sessionId}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      useChatStore.getState().setConnected(true);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      useChatStore.getState().setConnected(false);
      this.attemptReconnect(sessionId);
    };
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    const store = useChatStore.getState();

    switch (message.type) {
      case 'user_message':
        // User message already added locally before sending
        break;

      case 'partial_response':
        // Accumulate partial response (handled by streaming message)
        break;

      case 'token_stream': {
        // 逐字流式输出 - 将每个字符追加到正在流式传输的消息
        const streamingMessage = store.messages.find(m => m.isStreaming && m.role === 'assistant');
        if (streamingMessage && message.content) {
          store.updateMessage(streamingMessage.id, {
            content: streamingMessage.content + message.content
          });
        }
        break;
      }

      case 'assistant_response': {
        // Find streaming message and update it
        const streamingMessage = store.messages.find(m => m.isStreaming);
        if (streamingMessage) {
          store.updateMessage(streamingMessage.id, {
            content: message.content || '',
            toolCalls: message.tool_calls,
            isStreaming: false
          });
        } else {
          // Create new message if not found
          store.addMessage({
            id: uuidv4(),
            role: 'assistant',
            content: message.content || '',
            timestamp: message.timestamp,
            toolCalls: message.tool_calls,
            isStreaming: false
          });
        }
        store.setLoading(false);
        break;
      }

      case 'tool_call_start': {
        if (message.tool_call) {
          // Find the current assistant message being built
          const currentAssistantMessage = store.messages.find(m => 
            m.role === 'assistant' && m.isStreaming
          );
          
          if (currentAssistantMessage) {
            store.addToolCall(currentAssistantMessage.id, message.tool_call);
          }
        }
        break;
      }

      case 'tool_call_result': {
        if (message.tool_call) {
          const currentAssistantMessage = store.messages.find(m => 
            m.role === 'assistant' && m.isStreaming
          );
          
          if (currentAssistantMessage) {
            store.updateToolCall(
              currentAssistantMessage.id,
              message.tool_call.id,
              {
                status: message.tool_call.status,
                result: message.tool_call.result
              }
            );
          }
        }
        break;
      }

      case 'response_complete':
        store.setLoading(false);
        break;

      case 'error':
        console.error('Server error:', message.message);
        store.setLoading(false);
        break;
    }
  }

  private attemptReconnect(sessionId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Reconnecting in ${timeout}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(sessionId);
    }, timeout);
  }

  sendMessage(message: string, sessionId: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    // Add user message to store immediately
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
      isStreaming: false
    };
    useChatStore.getState().addMessage(userMessage);
    useChatStore.getState().setLoading(true);

    // Send to server
    this.ws.send(JSON.stringify({ message }));

    // Create placeholder for assistant response
    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
      toolCalls: [],
      isStreaming: true
    };
    useChatStore.getState().addMessage(assistantMessage);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const chatService = new ChatService();
