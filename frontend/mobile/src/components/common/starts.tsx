import { StarFilled } from '@ant-design/icons'
import cn from '@yisu/front-utils/cn'
import { Rate } from 'antd-mobile'

const Stars = ({
  stars,
  className,
  ...props
}: { stars: number } & React.ComponentProps<'div'>) => {
  return (
    <div {...props} className={cn('text-xs text-yellow-500', className)}>
      <Rate
        character={<StarFilled style={{ fontSize: 12 }} />}
        readOnly
        value={stars}
      />
    </div>
  )
}

export default Stars
