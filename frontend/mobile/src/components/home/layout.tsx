import cn from '@yisu/front-utils/cn'

const Layout = ({
  sidebar,
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  sidebar: React.ReactNode
  children: React.ReactNode
}) => {
  return (
    <div className={cn('flex', className)} {...props}>
      <div>{sidebar}</div>
      <div>{children}</div>
    </div>
  )
}

export default Layout
