import { CosRequest } from '@yisu/front-utils/apis/cos'
import { Image, Upload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { Plus } from 'lucide-react'
import { useState } from 'react'

interface CosImageUploadProps {
  value?: string
  onChange?: (url: string | undefined) => void
  dir?: string
  maxSizeMB?: number
}

export function CosImageUpload({
  value,
  onChange,
  dir = 'hotel',
  maxSizeMB = 5,
}: CosImageUploadProps) {
  const [localFileList, setLocalFileList] = useState<UploadFile[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const fileList = value
    ? [
        {
          uid: '-1',
          name: 'image',
          status: 'done' as const,
          url: value,
        },
      ]
    : localFileList

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      void message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }
    const isWithinSize = file.size / 1024 / 1024 < maxSizeMB
    if (!isWithinSize) {
      void message.error(`图片大小不能超过 ${maxSizeMB}MB`)
      return Upload.LIST_IGNORE
    }
    return true
  }

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onProgress, onSuccess, onError } = options
    const blob = file as File
    const ext = blob.name.includes('.') ? blob.name.split('.').pop()! : 'jpg'

    try {
      const { url } = await CosRequest.uploadCosFile({
        dir,
        ext,
        file: blob,
        onProgress: (percent) => {
          onProgress?.({ percent })
        },
      })
      onSuccess?.(url)
      onChange?.(url)
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('上传失败'))
      void message.error('图片上传失败')
    }
  }

  const onRemove = () => {
    setLocalFileList([])
    onChange?.(undefined)
  }

  return (
    <>
      <Upload
        accept="image/*"
        listType="picture-card"
        fileList={fileList}
        maxCount={1}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onRemove={onRemove}
        onPreview={() => setPreviewOpen(true)}
        onChange={({ file, fileList: newFileList }) => {
          const normalized = newFileList.map((item) => {
            if (!item.url && typeof item.response === 'string') {
              return {
                ...item,
                url: item.response,
              }
            }
            return item
          })
          setLocalFileList(normalized)

          if (file.status === 'done') {
            const uploadedUrl =
              typeof file.response === 'string' ? file.response : file.url
            if (uploadedUrl) {
              onChange?.(uploadedUrl)
            }
          }
        }}
      >
        {fileList.length === 0 && (
          <div className="flex flex-col items-center gap-1">
            <Plus size={20} />
            <span className="text-xs">上传图片</span>
          </div>
        )}
      </Upload>
      {value && (
        <Image
          style={{ display: 'none' }}
          preview={{
            open: previewOpen,
            src: value,
            onOpenChange: setPreviewOpen,
          }}
        />
      )}
    </>
  )
}
