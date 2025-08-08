import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Typography, message, Tooltip, Select, Popconfirm } from 'antd';
import { RollbackOutlined, EyeOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import Editor from '@monaco-editor/react';
import genesysService from '../services/genesysService';

const { Text } = Typography;

interface RuleVersion {
  key: string;
  name: string;
  version: number;
  createdBy: string;
  createdAt: string;
  description: string;
  rules: any;
  active: boolean;
}

const VersionHistory: React.FC = () => {
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<RuleVersion | null>(null);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [cleanupModalVisible, setCleanupModalVisible] = useState(false);
  const [cleanupFilter, setCleanupFilter] = useState<'all' | 'older-than'>('older-than');
  const [olderThanDays, setOlderThanDays] = useState<number>(7);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async (page: number = 1, pageSize: number = 20) => {
    try {
      setLoading(true);
      const response = await genesysService.getRulesHistory(page, pageSize);
      
      if (response && response.entities) {
        setVersions(response.entities);
        setPagination({
          current: response.pageNumber || page,
          pageSize: response.pageSize || pageSize,
          total: response.total || 0
        });
      } else {
        setVersions([]);
        setPagination({ current: 1, pageSize: 20, total: 0 });
      }
    } catch (error: any) {
      console.error('Failed to load version history:', error);
      message.error('Failed to load version history: ' + (error.message || 'Unknown error'));
      setVersions([]);
      setPagination({ current: 1, pageSize: 20, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (version: RuleVersion) => {
    setSelectedVersion(version);
    setViewModalVisible(true);
  };

  const handleRollback = (version: RuleVersion) => {
    setSelectedVersion(version);
    setRollbackModalVisible(true);
  };

  const confirmRollback = async () => {
    if (!selectedVersion) return;
    
    setLoading(true);
    try {
      await genesysService.activateVersion(selectedVersion.key);
      message.success(`Successfully rolled back to version ${selectedVersion.version}`);
      setRollbackModalVisible(false);
      loadVersions(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('Rollback failed:', error);
      message.error('Failed to rollback version: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getVersionsToCleanup = () => {
    if (cleanupFilter === 'all') {
      return versions.filter(v => !v.active);
    } else {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      return versions.filter(v => 
        !v.active && 
        new Date(v.createdAt) < cutoffDate
      );
    }
  };

  const handleCleanup = () => {
    setCleanupModalVisible(true);
  };

  const confirmCleanup = async () => {
    const versionsToCleanup = getVersionsToCleanup();
    const keysToDelete = versionsToCleanup.map(v => v.key);
    
    if (keysToDelete.length === 0) {
      message.info('No versions to cleanup');
      setCleanupModalVisible(false);
      return;
    }

    setLoading(true);
    try {
      const results = await genesysService.deleteVersions(keysToDelete);
      
      let successMessage = `Successfully deleted ${results.deleted.length} version(s)`;
      if (results.skipped.length > 0) {
        successMessage += `, skipped ${results.skipped.length} active version(s)`;
      }
      if (results.errors.length > 0) {
        successMessage += `, failed to delete ${results.errors.length} version(s)`;
      }
      
      message.success(successMessage);
      setCleanupModalVisible(false);
      setSelectedRowKeys([]);
      loadVersions(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('Cleanup failed:', error);
      message.error('Failed to cleanup versions: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select versions to delete');
      return;
    }

    const selectedVersions = versions.filter(v => selectedRowKeys.includes(v.key));
    const activeVersions = selectedVersions.filter(v => v.active);
    
    if (activeVersions.length > 0) {
      message.error(`Cannot delete active version(s): ${activeVersions.map(v => `v${v.version}`).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const results = await genesysService.deleteVersions(selectedRowKeys as string[]);
      
      message.success(`Successfully deleted ${results.deleted.length} version(s)`);
      setSelectedRowKeys([]);
      loadVersions(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('Delete failed:', error);
      message.error('Failed to delete versions: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<RuleVersion> = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (text, record) => (
        <Space>
          <Text strong>v{text}</Text>
          {record.active && <Tag color="green">ACTIVE</Tag>}
        </Space>
      )
    },
    {
      title: 'Deployed By',
      dataIndex: 'createdBy',
      key: 'createdBy'
    },
    {
      title: 'Deployed At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View rules">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
              size="small"
            />
          </Tooltip>
          {!record.active && (
            <Tooltip title="Rollback to this version">
              <Button 
                icon={<RollbackOutlined />} 
                onClick={() => handleRollback(record)}
                size="small"
                danger
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <Card
        title="Version History"
        extra={
          <Space>
            <Popconfirm
              title="Delete Selected Versions"
              description="Are you sure you want to delete the selected versions? Active versions will be skipped."
              onConfirm={handleDeleteSelected}
              disabled={selectedRowKeys.length === 0}
            >
              <Button 
                icon={<DeleteOutlined />} 
                disabled={selectedRowKeys.length === 0}
                danger
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Button 
              icon={<ClearOutlined />} 
              onClick={handleCleanup}
              type="default"
            >
              Cleanup
            </Button>
            <Button onClick={() => loadVersions(pagination.current, pagination.pageSize)} loading={loading}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="key"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.active, // Disable checkbox for active versions
              name: record.name,
            }),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} versions`,
            onChange: (page, size) => {
              loadVersions(page, size || pagination.pageSize);
            }
          }}
        />
      </Card>

      {/* View Modal */}
      <Modal
        title={`View Rules - v${selectedVersion?.version}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedVersion && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">Deployed by: </Text>
              <Text>{selectedVersion.createdBy}</Text>
              <br />
              <Text type="secondary">Deployed at: </Text>
              <Text>{dayjs(selectedVersion.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
              <br />
              <Text type="secondary">Description: </Text>
              <Text>{selectedVersion.description}</Text>
            </div>
            
            <Editor
              height="400px"
              defaultLanguage="json"
              value={JSON.stringify(selectedVersion.rules, null, 2)}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false
              }}
              theme="vs-dark"
            />
          </Space>
        )}
      </Modal>

      {/* Rollback Modal */}
      <Modal
        title="Confirm Rollback"
        open={rollbackModalVisible}
        onOk={confirmRollback}
        onCancel={() => setRollbackModalVisible(false)}
        confirmLoading={loading}
        okText="Rollback"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical">
          <Text>
            Are you sure you want to rollback to <Text strong>v{selectedVersion?.version}</Text>?
          </Text>
          <Text type="warning">
            This will replace the current active rules with the rules from this version.
          </Text>
        </Space>
      </Modal>

      {/* Cleanup Modal */}
      <Modal
        title="Cleanup Version History"
        open={cleanupModalVisible}
        onOk={confirmCleanup}
        onCancel={() => setCleanupModalVisible(false)}
        confirmLoading={loading}
        okText="Cleanup"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Cleanup Options</Text>
            <br />
            <Text type="secondary">Choose which versions to remove. Active versions will never be deleted.</Text>
          </div>
          
          <div>
            <Text>Filter:</Text>
            <br />
            <Select 
              value={cleanupFilter} 
              onChange={setCleanupFilter} 
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="older-than">Versions older than specified days</Select.Option>
              <Select.Option value="all">All non-active versions</Select.Option>
            </Select>
            
            {cleanupFilter === 'older-than' && (
              <div style={{ marginTop: 12 }}>
                <Text>Days:</Text>
                <br />
                <Select 
                  value={olderThanDays} 
                  onChange={setOlderThanDays} 
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Select.Option value={7}>7 days</Select.Option>
                  <Select.Option value={14}>14 days</Select.Option>
                  <Select.Option value={21}>21 days</Select.Option>
                  <Select.Option value={30}>30 days</Select.Option>
                  <Select.Option value={60}>60 days</Select.Option>
                  <Select.Option value={90}>90 days</Select.Option>
                </Select>
              </div>
            )}
          </div>
          
          <div>
            <Text strong>Preview:</Text>
            <br />
            <Text type="secondary">
              {getVersionsToCleanup().length} version(s) will be deleted
            </Text>
            {getVersionsToCleanup().length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 150, overflowY: 'auto', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                {getVersionsToCleanup().map(v => (
                  <div key={v.key}>
                    <Text code>v{v.version}</Text> - {dayjs(v.createdAt).format('YYYY-MM-DD')}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Text type="warning">
            <strong>Warning:</strong> This action cannot be undone. Active versions will be automatically skipped.
          </Text>
        </Space>
      </Modal>
    </>
  );
};

export default VersionHistory;