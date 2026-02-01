import React from 'react';
import { List, Button, Typography, Empty, Popconfirm, Badge } from 'antd';
import { PlusOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { SessionInfo } from '@/types';

const { Text, Title } = Typography;

interface SessionListProps {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MM-dd HH:mm', { locale: zhCN });
    } catch {
      return timestamp;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          <MessageOutlined style={{ marginRight: 8 }} />
          会话列表
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={onCreateSession}
        >
          新会话
        </Button>
      </div>

      {/* Session List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无会话"
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(session) => (
              <List.Item
                onClick={() => onSelectSession(session.id)}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  backgroundColor: currentSessionId === session.id ? '#e6f7ff' : 'transparent',
                  borderLeft: currentSessionId === session.id ? '3px solid #1890ff' : '3px solid transparent',
                  transition: 'all 0.3s'
                }}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个会话吗？"
                    description="删除后将无法恢复"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong>{session.title}</Text>
                      {currentSessionId === session.id && (
                        <Badge status="processing" text="当前" />
                      )}
                    </div>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTime(session.lastMessageAt)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer Stats */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e8e8e8',
          fontSize: 12,
          color: '#999'
        }}
      >
        共 {sessions.length} 个会话
      </div>
    </div>
  );
};

export default SessionList;
