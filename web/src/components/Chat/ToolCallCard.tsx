import React from 'react';
import { Card, Tag, Spin } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ToolCall } from '@/types';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall }) => {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Spin size="small" />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'pending':
        return 'processing';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f'
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusIcon()}
          <span style={{ fontWeight: 500 }}>🔧 {toolCall.name}</span>
          <Tag color={getStatusColor()} size="small">
            {toolCall.status === 'pending' ? '执行中' : 
             toolCall.status === 'success' ? '完成' : '错误'}
          </Tag>
        </div>
      }
    >
      <div style={{ fontSize: 13 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>参数：</strong>
          <pre
            style={{
              margin: '4px 0 0 0',
              padding: 8,
              backgroundColor: '#fff',
              borderRadius: 4,
              fontSize: 12,
              overflow: 'auto'
            }}
          >
            {JSON.stringify(toolCall.arguments, null, 2)}
          </pre>
        </div>

        {toolCall.result !== undefined && (
          <div>
            <strong>结果：</strong>
            <pre
              style={{
                margin: '4px 0 0 0',
                padding: 8,
                backgroundColor: '#fff',
                borderRadius: 4,
                fontSize: 12,
                overflow: 'auto',
                color: '#52c41a'
              }}
            >
              {formatValue(toolCall.result)}
            </pre>
          </div>
        )}

        {toolCall.duration && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
            耗时: {(toolCall.duration / 1000).toFixed(2)}s
          </div>
        )}
      </div>
    </Card>
  );
};

export default ToolCallCard;
