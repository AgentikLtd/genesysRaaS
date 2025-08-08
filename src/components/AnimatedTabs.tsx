import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsProps } from 'antd';
import './AnimatedTabs.css';

interface AnimatedTabsProps extends TabsProps {
  animated?: boolean;
  variant?: 'default' | 'card' | 'editable-card';
  size?: 'small' | 'middle' | 'large';
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  animated = true,
  variant = 'default',
  size = 'middle',
  className = '',
  ...props
}) => {
  const [activeKey, setActiveKey] = useState(props.activeKey || props.defaultActiveKey);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && tabsRef.current && activeKey) {
      const activeTab = tabsRef.current.querySelector(`[data-node-key="${activeKey}"]`) as HTMLElement;
      if (activeTab) {
        const tabsNav = tabsRef.current.querySelector('.ant-tabs-nav-list') as HTMLElement;
        if (tabsNav) {
          const tabsNavRect = tabsNav.getBoundingClientRect();
          const activeTabRect = activeTab.getBoundingClientRect();
          
          setIndicatorStyle({
            left: activeTabRect.left - tabsNavRect.left,
            width: activeTabRect.width,
          });
        }
      }
    }
  }, [activeKey, animated, props.items]);

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    props.onChange?.(key);
  };

  const combinedClassName = [
    'animated-tabs',
    `animated-tabs-${variant}`,
    `animated-tabs-${size}`,
    animated ? 'animated-tabs-animated' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div ref={tabsRef} className={combinedClassName}>
      <Tabs
        {...props}
        activeKey={activeKey}
        onChange={handleTabChange}
        className="animated-tabs-inner"
      />
      {animated && variant === 'default' && (
        <div 
          className="animated-tabs-indicator" 
          style={indicatorStyle}
        />
      )}
    </div>
  );
};

export default AnimatedTabs;