import { Outlet } from '@tanstack/react-router'
import cn from '@yisu/front-utils/cn'

export const AuthenticatedLayout = ({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div {...props} className={cn('flex flex-col h-screen', className)}>
      <div className='flex-1'>
        {children ?? <Outlet />}
      </div>
      <div className='h-16 flex items-center justify-evenly'>
        {/* 之后再配合tantack路由匹配进行 TabBar 设置 */}
      </div>
    </div>
  )
}
