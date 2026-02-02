import { Outlet } from '@tanstack/react-router'

export const AuthenticatedLayout = ({
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div {...props}>
      <div>布局组件</div>
      {children ?? <Outlet />}
    </div>
  )
}
