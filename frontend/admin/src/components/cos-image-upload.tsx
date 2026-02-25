import imageCompression from 'browser-image-compression'
import { CosRequest } from '@yisu/front-utils/apis/cos'
import { Image, Upload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { Plus } from 'lucide-react'
import { useState } from 'react'

/** 图片压缩默认参数 */
const DEFAULT_COMPRESS_MAX_SIZE_MB = 1
const DEFAULT_COMPRESS_MAX_WH = 1920

interface CosImageUploadProps {
  id?: string // 显式获取 id
  value?: string
  onChange?: (url: string | undefined) => void
  dir?: string
  maxSizeMB?: number
  /** 压缩目标体积上限（MB），默认 1MB。设为 0 可禁用压缩。 */
  compressMaxSizeMB?: number
  /** 压缩时允许的最大宽/高（px），默认 1920。 */
  compressMaxWidthOrHeight?: number
}

export function CosImageUpload({
  id,
  value,
  onChange,
  dir = 'hotel',
  maxSizeMB = 5,
  compressMaxSizeMB = DEFAULT_COMPRESS_MAX_SIZE_MB,
  compressMaxWidthOrHeight = DEFAULT_COMPRESS_MAX_WH,
  ...restProps // 获取其余所有 props
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
    let blob = file as File
    const ext = blob.name.includes('.') ? blob.name.split('.').pop()! : 'jpg'

    try {
      // ── 压缩阶段（0 → 50%）──────────────────────────────────────────────
      if (
        compressMaxSizeMB > 0 &&
        blob.size / 1024 / 1024 > compressMaxSizeMB
      ) {
        onProgress?.({ percent: 0 })
        const compressed = await imageCompression(blob, {
          maxSizeMB: compressMaxSizeMB,
          maxWidthOrHeight: compressMaxWidthOrHeight,
          useWebWorker: true,
          fileType: blob.type as 'image/jpeg' | 'image/png' | 'image/webp',
          onProgress: (p) => {
            // 压缩进度映射到 0-50%
            onProgress?.({ percent: Math.round(p * 0.5) })
          },
        })
        // 保留原文件名，避免影响后续 ext 解析
        blob = new File([compressed], blob.name, { type: compressed.type })
        onProgress?.({ percent: 50 })
      }

      // ── 上传阶段（50 → 100%）────────────────────────────────────────────
      const { url } = await CosRequest.uploadCosFile({
        dir,
        ext,
        file: blob,
        onProgress: (percent) => {
          // 上传进度映射到 50-100%
          onProgress?.({ percent: 50 + Math.round(percent * 0.5) })
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
        {...restProps} // 1. 关键：透传所有 antd 注入的属性（包含 id）
        id={id}
        accept="image/*"
        listType="picture-card"
        fileList={fileList}
        maxCount={1}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onRemove={onRemove}
        onPreview={() => setPreviewOpen(true)}
        aria-label="图片上传"
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
