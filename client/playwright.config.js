// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration cho dự án Date Time Checker
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Thư mục chứa test files
  testDir: './e2e',

  // Chạy tất cả test trong file song song
  fullyParallel: true,

  // Không cho phép dùng test.only trên CI
  forbidOnly: !!process.env.CI,

  // Số lần retry khi test fail
  retries: process.env.CI ? 2 : 0,

  // Chạy tuần tự 1 test tại 1 thời điểm để dễ theo dõi
  workers: 1,

  // Báo cáo dạng HTML
  reporter: 'html',

  // Cấu hình chung cho tất cả test
  use: {
    // URL gốc — dùng page.goto('/') thay vì URL đầy đủ
    baseURL: 'http://localhost:5173',

    // Hiển thị trình duyệt khi chạy test (false = hiện, true = ẩn)
    headless: false,

    // Làm chậm mỗi thao tác 500ms để dễ theo dõi
    slowMo: 5000,

    // Chụp ảnh khi test fail
    screenshot: 'only-on-failure',

    // Ghi lại trace khi retry (dùng để debug)
    trace: 'on-first-retry',
  },

  // Cấu hình trình duyệt
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Có thể bật thêm sau khi cài trình duyệt:
    // npx playwright install firefox
    // npx playwright install webkit
    //
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Tự động khởi động server trước khi test
  webServer: [
    {
      // Khởi động backend server
      command: 'cd ../server && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
    {
      // Khởi động frontend dev server
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
  ],
});
