import type { ThemeConfig } from 'antd'

export const adminTheme: ThemeConfig = {
  token: {
    // colorPrimary: '#1677ff', // Default Ant Design Blue
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
      siderBg: '#ffffff', // Change Sider to white
    },
    Menu: {
      // Light theme menu
      itemBg: '#ffffff',
      itemSelectedBg: '#e6f7ff', // Light blue background for selected item
      itemSelectedColor: '#1677ff', // Blue text for selected item
    },
  },
}
