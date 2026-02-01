import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Space } from 'antd';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, isConnected }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading || !isConnected) return;
    
    onSend(inputValue.trim());
    setInputValue('');
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  return (
    <div
      style={{
        padding: '16px 24px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e8e8e8',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end'
      }}
    >
      <TextArea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isConnected 
            ? '输入消息，按 Enter 发送，Shift+Enter 换行...'
            : '等待连接...'
        }
        disabled={isLoading || !isConnected}
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{
          flex: 1,
          borderRadius: 8,
          resize: 'none'
        }}
      />
      
      <Button
        type="primary"
        icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
        onClick={handleSend}
        disabled={!inputValue.trim() || isLoading || !isConnected}
        loading={isLoading}
        style={{
          height: 40,
          padding: '0 24px'
        }}
      >
        发送
      </Button>
    </div>
  );
};

export default ChatInput;
