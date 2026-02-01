import React, { useEffect, useRef, useCallback } from 'react';
import { Empty, Spin, message as antdMessage } from 'antd';
import { RobotOutlined, MessageOutlined } from '@ant-design/icons';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/api';
import { ChatMessage, ChatInput } from '@/components/Chat';
import { SessionList } from '@/components/Session';
import { MainLayout } from '@/components/Layout';

const Home: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    isConnected,
    setSessions,
    setCurrentSession,
    addSession,
    removeSession,
    setMessages,
    createNewSession
  } = useChatStore();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize: Load sessions and create initial session if needed
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialize = async () => {
      try {
        // Load sessions from server
        const serverSessions = await chatService.getSessions();
        
        if (serverSessions.length > 0) {
          setSessions(serverSessions);
          // Select the first session
          setCurrentSession(serverSessions[0].id);
          // Load its messages
          const sessionMessages = await chatService.getSessionMessages(serverSessions[0].id);
          setMessages(sessionMessages);
          // Connect WebSocket
          chatService.connect(serverSessions[0].id);
        } else {
          // Create a new session
          const newSessionId = createNewSession();
          await chatService.createSession('新会话');
          chatService.connect(newSessionId);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        antdMessage.error('初始化失败，请刷新页面重试');
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      chatService.disconnect();
    };
  }, []);

  // Handle session selection
  const handleSelectSession = useCallback(async (sessionId: string) => {
    if (sessionId === currentSessionId) return;

    // Disconnect from current session
    chatService.disconnect();

    // Switch session
    setCurrentSession(sessionId);

    // Load messages
    const sessionMessages = await chatService.getSessionMessages(sessionId);
    setMessages(sessionMessages);

    // Connect to new session
    chatService.connect(sessionId);
  }, [currentSessionId, setCurrentSession, setMessages]);

  // Handle create new session
  const handleCreateSession = useCallback(async () => {
    try {
      const sessionId = await chatService.createSession();
      if (sessionId) {
        // Create locally
        const newSessionId = createNewSession();
        
        // Disconnect from current session
        chatService.disconnect();

        // Switch to new session
        setCurrentSession(newSessionId);
        setMessages([]);

        // Connect to new session
        chatService.connect(newSessionId);

        antdMessage.success('新会话已创建');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      antdMessage.error('创建会话失败');
    }
  }, [createNewSession, setCurrentSession, setMessages]);

  // Handle delete session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      const success = await chatService.deleteSession(sessionId);
      if (success) {
        removeSession(sessionId);
        antdMessage.success('会话已删除');

        // If we deleted the current session, connect to the new current session
        const newCurrentId = useChatStore.getState().currentSessionId;
        if (newCurrentId && newCurrentId !== sessionId) {
          chatService.disconnect();
          const sessionMessages = await chatService.getSessionMessages(newCurrentId);
          setMessages(sessionMessages);
          chatService.connect(newCurrentId);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      antdMessage.error('删除会话失败');
    }
  }, [removeSession, setMessages]);

  // Handle send message
  const handleSendMessage = useCallback((content: string) => {
    const sessionId = useChatStore.getState().currentSessionId;
    if (!sessionId) {
      antdMessage.error('请先选择一个会话');
      return;
    }
    chatService.sendMessage(content, sessionId);
  }, []);

  return (
    <MainLayout
      isConnected={isConnected}
      sidebar={
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
        />
      }
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5'
        }}
      >
        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px 0'
          }}
        >
          {messages.length === 0 ? (
            <Empty
              image={<RobotOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
              description={
                <div>
                  <p style={{ fontSize: 16, marginBottom: 8 }}>👋 欢迎使用 Agent Tool</p>
                  <p style={{ color: '#999' }}>发送消息开始对话，我可以帮你计算平方数</p>
                  <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                    例如："12 的平方是多少？"
                  </p>
                </div>
              }
              style={{ marginTop: 100 }}
            />
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          isConnected={isConnected}
        />
      </div>
    </MainLayout>
  );
};

export default Home;
