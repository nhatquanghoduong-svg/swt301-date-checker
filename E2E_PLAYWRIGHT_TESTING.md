# Hướng Dẫn Thực Hiện E2E Testing Bằng Playwright

Tài liệu này ghi chú lại chi tiết toàn bộ quá trình tích hợp, cấu hình và thực thi End-to-End (E2E) testing với Playwright cho dự án **Date Time Checker**.

## 1. Cài Đặt Playwright

Playwright được cài đặt trực tiếp vào thư mục `client` (nơi chứa code Frontend).

### Các bước cài đặt:
1. Mở terminal tại thư mục `client`:
   ```bash
   cd client
   ```
2. Khởi tạo Playwright:
   ```bash
   npm init playwright@latest -- --quiet --lang=js --no-examples
   ```
   *Giải thích: Lệnh này thiết lập Playwright cho dự án dùng JavaScript (`--lang=js`), không tự động sinh ra các file test mẫu (`--no-examples`) để giữ thư mục gọn gàng.*

3. Cài đặt trình duyệt Chromium:
   ```bash
   npx playwright install chromium
   ```
   *Giải thích: Playwright hỗ trợ đa trình duyệt. Tuy nhiên, nếu gặp vấn đề mạng khi tải Firefox/WebKit, chúng ta có thể chỉ định tải riêng `chromium` để test trên engine của Google Chrome/Edge.*

---

## 2. Cấu Hình Playwright (`playwright.config.js`)

File `client/playwright.config.js` được tùy chỉnh để đáp ứng nhu cầu test của dự án, bao gồm tự động chạy server, cấu hình tốc độ test, và thiết lập đường dẫn gốc.

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Chỉ định thư mục chứa các file test là `e2e`
  fullyParallel: true, // Chạy các file test song song
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Chạy tuần tự 1 test case tại 1 thời điểm để dễ theo dõi bằng mắt thường
  reporter: 'html', // Sinh báo cáo kết quả test dạng HTML trực quan
  
  use: {
    baseURL: 'http://localhost:5173', // Base URL để các lệnh `page.goto('/')` sẽ tự hiểu là vào trang chủ
    headless: false, // `false` để hiển thị cửa sổ trình duyệt khi test đang chạy (nếu `true` sẽ chạy ngầm)
    slowMo: 500, // Làm chậm mỗi thao tác 500ms (giúp dễ dàng quan sát quá trình nhập liệu, click chuột)
    screenshot: 'only-on-failure', // Chỉ tự động chụp màn hình khi có test case bị lỗi
    trace: 'on-first-retry', // Ghi lại log chi tiết (DOM snapshot, network,...) nếu test phải chạy lại do lỗi
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }, // Cấu hình chỉ chạy trên trình duyệt Chromium
    },
  ],

  // Quan trọng: Tự động khởi động cả Backend và Frontend server trước khi chạy test
  webServer: [
    {
      command: 'cd ../server && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
  ],
});
```

---

## 3. Cấu Trúc Mã Kiểm Thử (`e2e/date-checker.spec.js`)

Tất cả các test case được viết trong file `client/e2e/date-checker.spec.js`. Cấu trúc của file này bao gồm các phần chính sau:

### 3.1. Sửa lỗi Type Checking (`@ts-check`)
Playwright mặc định thêm `// @ts-check` lên đầu file để kiểm tra lỗi cú pháp bằng TypeScript (ngay cả trong file JS).
Khi tạo một hàm trợ giúp (`helper function`), TypeScript sẽ cảnh báo lỗi *implicitly has an 'any' type* nếu không khai báo kiểu dữ liệu.

**Cách khắc phục:** Dùng JSDoc `@param` để khai báo kiểu dữ liệu một cách tường minh:
```javascript
/**
 * @param {import('@playwright/test').Page} page
 * @param {string} day
 * @param {string} month
 * @param {string} year
 */
async function fillAndCheck(page, day, month, year) {
  await page.getByPlaceholder('e.g. 15').fill(day);
  await page.getByPlaceholder('e.g. 6').fill(month);
  await page.getByPlaceholder('e.g. 2024').fill(year);
  await page.getByRole('button', { name: 'Check' }).click();
}
```

### 3.2. Tổ chức Test Suite (Nhóm test case)
Các test case được phân loại theo từng Test Suite thông qua hàm `test.describe()`. Trước mỗi test case, hàm `test.beforeEach()` sẽ điều hướng trình duyệt về trang chủ (`page.goto('/')`).

Các nhóm test case đã triển khai bao gồm 31 test cases:
1. **UI Rendering:** Đảm bảo trang web tải thành công, các thành phần giao diện, placeholder, các nút bấm hiển thị đúng và rỗng ban đầu.
2. **Valid Dates:** Kiểm tra bộ ngày tháng năm hợp lệ (năm nhuận, ngày thường, tháng 30 ngày,...).
3. **Invalid Dates:** Kiểm tra bộ ngày không hợp lệ (ví dụ: 29/2 năm không nhuận, 31/4).
4. **Out of Range:** Kiểm tra các giá trị nằm ngoài khoảng giới hạn (ngày > 31, tháng > 12, năm < 1000).
5. **Incorrect Format:** Kiểm tra định dạng đầu vào sai (chữ cái, số thập phân, chuỗi rỗng).
6. **Clear Button:** Xác nhận chức năng của nút "Clear" xóa sạch form.
7. **Close Button:** Xử lý sự kiện hộp thoại bật lên (dialog/alert) khi nhấn nút "Close".
   *Ví dụ về cách xử lý Dialog trong Playwright:*
   ```javascript
   page.on('dialog', async (dialog) => {
     expect(dialog.message()).toBe('Are you sure to exit?');
     await dialog.dismiss(); // Nhấn nút "Cancel" trên hộp thoại
   });
   await page.locator('.close-btn').click();
   ```

---

## 4. Chạy Test Thực Tế và Lỗi Thường Gặp

### Lỗi chạy sai thư mục
- **Mô tả:** Lỗi `Playwright Test did not expect test.describe() to be called here.`
- **Nguyên nhân:** Lệnh `npx playwright test` được chạy tại thư mục gốc (`datetime-checker-node`) thay vì thư mục `client`, nơi chứa `playwright.config.js`. Do Playwright không thấy cấu hình, nó xử lý file test không đúng quy định.
- **Khắc phục:** Luôn mở terminal `cd` vào thư mục `client` trước khi chạy các lệnh Playwright.

### Các lệnh chạy Test hữu ích

Dưới đây là danh sách các lệnh bạn sẽ thường xuyên sử dụng tại thư mục `client`:

1. **Chạy test headless (chạy ngầm, nhanh nhất):**
   *(Nếu bạn set `headless: false` trong config, nó sẽ hiện trình duyệt. Nếu bỏ đi nó sẽ chạy ngầm mặc định).*
   ```bash
   npx playwright test --project=chromium
   ```

2. **Chạy test qua giao diện Playwright UI (Khuyên dùng khi debug):**
   ```bash
   npx playwright test --ui
   ```
   *Giao diện này cho phép bạn nhìn thấy DOM snapshot của từng thao tác click, điền text, thuận tiện cho việc kiểm tra element nào đang bị lỗi.*

3. **Chạy một file test cụ thể:**
   ```bash
   npx playwright test e2e/date-checker.spec.js
   ```

4. **Sinh báo cáo HTML sau khi test xong:**
   ```bash
   npx playwright show-report
   ```

5. **Công cụ sinh test tự động (Record & Playback):**
   ```bash
   npx playwright codegen http://localhost:5173
   ```
   *Công cụ này mở trình duyệt lên. Mọi thao tác click, gõ phím của bạn sẽ tự động được Playwright viết thành code test, rất tiện khi không muốn tự viết code thủ công từ đầu.*
