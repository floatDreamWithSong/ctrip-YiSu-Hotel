import { Input, Tag } from 'antd'
import { useState } from 'react'

interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  presets?: string[]
  maxLength?: number
}

export function TagInput({
  value = [],
  onChange,
  presets = [],
  maxLength = 32,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const tags = value

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (trimmed.length > maxLength) return
    if (tags.includes(trimmed)) return
    onChange?.([...tags, trimmed])
  }

  const removeTag = (tag: string) => {
    onChange?.(tags.filter((t) => t !== tag))
  }

  const handlePressEnter = (e: React.KeyboardEvent) => {
    e.preventDefault()
    addTag(inputValue)
    setInputValue('')
  }

  const unselectedPresets = presets.filter((p) => !tags.includes(p))

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Tag key={tag} closable onClose={() => removeTag(tag)} color="blue">
              {tag}
            </Tag>
          ))}
        </div>
      )}

      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPressEnter={handlePressEnter}
        placeholder="输入标签后按回车添加"
        maxLength={maxLength}
      />

      {unselectedPresets.length > 0 && (
        <div>
          <span className="mr-2 text-xs text-gray-400">快捷添加：</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {unselectedPresets.map((preset) => (
              <Tag
                key={preset}
                className="cursor-pointer"
                onClick={() => addTag(preset)}
              >
                + {preset}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
