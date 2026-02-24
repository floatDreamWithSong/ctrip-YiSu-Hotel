import { Outlet } from '@tanstack/react-router'
import cn from '@yisu/front-utils/cn'

export const AuthenticatedLayout = ({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div {...props} className={cn('flex flex-col h-svh', className)}>
      <div className="flex-1 overflow-hidden no-scrollbar">
        {children ?? <Outlet />}
      </div>
    </div>
  )
}
