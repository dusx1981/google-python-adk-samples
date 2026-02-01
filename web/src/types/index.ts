export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'success' | 'error';
  result?: any;
  duration?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messages: Message[];
}

export interface SessionInfo {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export type WebSocketMessageType =
  | 'user_message'
  | 'assistant_response'
  | 'partial_response'
  | 'token_stream'
  | 'tool_call_start'
  | 'tool_call_result'
  | 'response_complete'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  content?: string;
  tool_call?: ToolCall;
  tool_calls?: ToolCall[];
  message?: string;
  timestamp: string;
}
