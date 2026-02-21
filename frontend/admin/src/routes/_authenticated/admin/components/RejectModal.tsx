import { Modal, Form, Input, Select, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { hotelApi } from '@yisu/front-utils/apis/hotel';
import type { RejectHotelType } from '@yisu/shared';

interface RejectModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: RejectHotelType) => void;
  loading: boolean;
}

export function RejectModal({
  open,
  onCancel,
  onSubmit,
  loading,
}: RejectModalProps) {
  const [form] = Form.useForm();
  const reason = Form.useWatch('rejectReason', form);

  const { data: reasons, isLoading: reasonsLoading } = useQuery({
    queryKey: ['rejectReasons'],
    queryFn: hotelApi.getRejectReasons,
  });

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit(values);
        form.resetFields();
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title="拒绝审核"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      {reasonsLoading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" name="reject_form">
          <Form.Item
            name="rejectReason"
            label="拒绝理由"
            rules={[{ required: true, message: '请选择一个拒绝理由' }]}
          >
            <Select
              placeholder="选择一个拒绝理由"
              options={reasons}
            />
          </Form.Item>
          {reason === 'OTHER' && (
            <Form.Item
              name="rejectDetail"
              label="详细说明"
              rules={[{ required: true, message: '请输入详细说明' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  );
}
