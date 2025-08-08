import React from 'react';
import { Space, SpaceProps } from 'antd';

interface StackProps extends SpaceProps {
  children: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({ children, ...props }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} {...props}>
      {children}
    </Space>
  );
};