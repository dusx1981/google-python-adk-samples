import React from 'react';
import { Layout, Typography, Badge, Space } from 'antd';
import { RobotOutlined, WifiOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  isConnected: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, children, isConnected }) => {
  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e8e8e8',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Space>
          <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            Agent Tool
            <Text type="secondary" style={{ fontSize: 14, marginLeft: 8, fontWeight: 'normal' }}>
              智能助手
            </Text>
          </Title>
        </Space>

        <Space>
          <Badge
            status={isConnected ? 'success' : 'error'}
            text={
              <Space size={4}>
                {isConnected ? <WifiOutlined /> : <CloseCircleOutlined />}
                <Text type={isConnected ? 'success' : 'danger'} style={{ fontSize: 12 }}>
                  {isConnected ? '已连接' : '未连接'}
                </Text>
              </Space>
            }
          />
        </Space>
      </Header>

      {/* Main Content */}
      <Layout style={{ overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sider
          width={300}
          theme="light"
          style={{
            borderRight: '1px solid #e8e8e8',
            overflow: 'auto'
          }}
        >
          {sidebar}
        </Sider>

        {/* Content */}
        <Content style={{ overflow: 'hidden' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
