import { Outlet } from '@tanstack/react-router'
import cn from '@yisu/front-utils/cn'

export const AuthLayout = ({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      {...props}
      className={cn(
        'w-screen h-screen flex items-center justify-center',
        className,
      )}
    >
      <div className="w-full">{children ?? <Outlet />}</div>
    </div>
  )
}
