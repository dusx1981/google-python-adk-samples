import React from 'react';
import { Avatar, Typography, Spin } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { Message } from '@/types';
import ToolCallCard from './ToolCallCard';

const { Text } = Typography;

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        padding: '0 16px'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: '80%',
          gap: 12
        }}
      >
        {/* Avatar */}
        <Avatar
          size={40}
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: isUser ? '#1890ff' : '#52c41a',
            flexShrink: 0
          }}
        />

        {/* Message Content */}
        <div style={{ flex: 1 }}>
          {/* Message Bubble */}
          <div
            style={{
              backgroundColor: isUser ? '#1890ff' : '#f5f5f5',
              color: isUser ? '#fff' : '#333',
              padding: '12px 16px',
              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              fontSize: 14,
              lineHeight: 1.6,
              wordBreak: 'break-word'
            }}
          >
            <Text
              style={{
                color: 'inherit',
                whiteSpace: 'pre-wrap'
              }}
            >
              {message.content || (message.isStreaming ? <Spin size="small" /> : '')}
            </Text>
          </div>

          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {message.toolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div
            style={{
              fontSize: 11,
              color: '#999',
              marginTop: 4,
              textAlign: isUser ? 'right' : 'left'
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
