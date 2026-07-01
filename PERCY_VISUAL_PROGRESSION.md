# Visual Regression Testing với Percy + Playwright
## Dự án: Date Time Checker (FPT University)

---

## Mục lục

1. [Tổng quan về Visual Regression Testing](#1-tổng-quan-về-visual-regression-testing)
2. [Kiến trúc dự án](#2-kiến-trúc-dự-án)
3. [Cài đặt và cấu hình](#3-cài-đặt-và-cấu-hình)
4. [Hướng dẫn khởi động lại dự án (Mở code lần sau)](#4-hướng-dẫn-khởi-động-lại-dự-án-mở-code-lần-sau)
5. [Giải thích chi tiết Backend (server.js)](#5-giải-thích-chi-tiết-backend-serverjs)
6. [Giải thích chi tiết Frontend (App.jsx)](#6-giải-thích-chi-tiết-frontend-appjsx)
7. [Giải thích chi tiết File Test (date-checker.spec.js)](#7-giải-thích-chi-tiết-file-test-date-checkerspecjs)
8. [Flow hoạt động của Percy](#8-flow-hoạt-động-của-percy)
9. [Các lỗi đã gặp và cách khắc phục](#9-các-lỗi-đã-gặp-và-cách-khắc-phục)
10. [Kết quả cuối cùng](#10-kết-quả-cuối-cùng)
11. [Kiến thức mở rộng](#11-kiến-thức-mở-rộng)

---

## 1. Tổng quan về Visual Regression Testing

### Visual Regression Testing là gì?

**Visual Regression Testing** là kỹ thuật kiểm thử tự động so sánh giao diện người dùng (UI) giữa các lần chạy khác nhau để phát hiện những thay đổi không mong muốn về mặt hình ảnh.

```
Lần chạy 1 (Baseline)          Lần chạy 2 (New Build)
┌─────────────────────┐        ┌─────────────────────┐
│   [Screenshot UI]   │  so    │   [Screenshot UI]   │
│   Button: #0056b3   │  sánh  │   Button: #ff0000   │  ← Phát hiện thay đổi!
│   Font-size: 14px   │  ──►   │   Font-size: 14px   │
└─────────────────────┘        └─────────────────────┘
                                        │
                                        ▼
                               Percy highlight diff
                               Developer: Approve / Reject
```

### Tại sao cần Visual Regression Testing?

| Vấn đề | Không có VRT | Có VRT |
|--------|-------------|--------|
| Đổi CSS vô tình ảnh hưởng component khác | Không phát hiện được | Phát hiện ngay |
| Responsive layout bị vỡ | Phải test thủ công | Tự động phát hiện |
| Font, màu sắc thay đổi | Phụ thuộc vào mắt người | So sánh pixel by pixel |
| Regression sau merge code | Không hay biết | Alert ngay lập tức |

### Percy là gì?

**Percy** (percy.io) là một nền tảng Visual Regression Testing SaaS (Software as a Service) của BrowserStack. Percy:
- Chụp screenshot (snapshot) từ các test Playwright/Cypress
- Upload lên cloud Percy để so sánh
- Hiển thị diff (sự khác biệt) trên dashboard
- Cho phép team review và Approve/Reject thay đổi

---

## 2. Kiến trúc dự án

```
datetime-checker-node/
├── server.js                    ← Backend Express API
├── package.json                 ← Dependencies backend
│
└── client/                      ← Frontend React + Vite
    ├── src/
    │   ├── App.jsx              ← Component chính
    │   └── App.css              ← Styles
    ├── e2e/
    │   └── date-checker.spec.js ← File test Playwright + Percy
    ├── playwright.config.js     ← Cấu hình Playwright
    └── package.json             ← Dependencies frontend (có @playwright/test)
```

### Tech Stack

```
Frontend:  React 19 + Vite 8
Backend:   Node.js + Express
Testing:   Playwright 1.60 (E2E) + Percy (Visual Regression)
Language:  JavaScript (ESModule)
```

---

## 3. Cài đặt và cấu hình

### Bước 1: Percy Token

Percy Token là "chìa khóa" để xác thực với Percy cloud. Mỗi project trên percy.io có một token riêng.

```
percy.io → Đăng nhập → Chọn Project → Settings → Copy PERCY_TOKEN
```

Token có dạng: `web_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Bước 2: Cài đặt package

Vì dự án đã có sẵn `@playwright/test`, chỉ cần cài thêm:

```bash
cd client
npm install --save-dev @percy/cli @percy/playwright
```

**Giải thích từng package:**

| Package | Vai trò |
|---------|---------|
| `@percy/cli` | Command-line tool của Percy. Cung cấp lệnh `percy exec` để wrap quanh test runner |
| `@percy/playwright` | SDK Percy dành riêng cho Playwright. Cung cấp hàm `percySnapshot()` |

### Bước 3: Set Environment Variable (Windows PowerShell)

> ⚠️ **Quan trọng:** Đây là lỗi phổ biến nhất trong session này.

**Sự khác biệt giữa CMD và PowerShell:**

```cmd
:: CMD — KHÔNG dùng được trong PowerShell
set PERCY_TOKEN=abc123
```

```powershell
# PowerShell — cú pháp đúng
$env:PERCY_TOKEN="abc123"

# Kiểm tra đã set chưa
echo $env:PERCY_TOKEN

# Lưu ý: Biến này chỉ tồn tại trong session hiện tại
# Đóng terminal → mất token → phải set lại
```

**Tại sao `set` trong PowerShell không hoạt động?**

Trong PowerShell, `set` là alias của `Set-Variable` — nó tạo ra một **PowerShell variable** (`$PERCY_TOKEN`), không phải **environment variable** (`$env:PERCY_TOKEN`). Percy CLI đọc environment variable, không đọc PowerShell variable → kết quả là "Missing Percy token".

### Bước 4: Chạy Percy

```powershell
# Set token (trong cùng terminal với lệnh chạy test)
$env:PERCY_TOKEN="web_40bc03..."

# Chạy Percy wrapping Playwright
npx percy exec -- npx playwright test
```

**Giải thích cú pháp `percy exec --`:**

```
npx percy exec -- npx playwright test
│              │   └── Lệnh test thật sự (Playwright)
│              └── Dấu -- phân tách args của percy với args của playwright
└── Percy CLI khởi động, set up connection tới Percy cloud
```

**Flow khi chạy:**
1. Percy CLI khởi động → kết nối tới percy.io
2. Percy chạy lệnh `npx playwright test`
3. Playwright chạy từng test, khi gặp `percySnapshot()` → chụp ảnh → gửi cho Percy
4. Playwright kết thúc → Percy finalize build → upload tất cả snapshots lên cloud
5. Percy tạo link dashboard để review

---

## 4. Hướng dẫn khởi động lại dự án (Mở code lần sau)

> Đây là phần quan trọng nhất khi bạn tắt máy và mở lại project. Cần khởi động **đúng thứ tự** và **đúng terminal**.

### Tại sao phải khởi động đúng thứ tự?

```
Percy test cần chụp ảnh UI thật → cần Frontend đang chạy
Frontend gọi API để lấy kết quả → cần Backend đang chạy
Percy upload snapshot → cần có PERCY_TOKEN

Vậy thứ tự bắt buộc:
Backend → Frontend → Token → Percy
```

Nếu sai thứ tự:
- Chạy Percy trước khi Frontend lên → snapshot chụp trang trắng/lỗi
- Không set token → "Missing Percy token"
- Frontend lên nhưng Backend chưa chạy → kết quả "Network Error" trong snapshot

---

### Thứ tự khởi động — 3 terminal song song

Mở **3 terminal riêng biệt** trong VSCode (click dấu `+` ở góc phải Terminal panel):

---

#### Terminal 1 — Khởi động Backend

```powershell
# Di chuyển vào thư mục root của project
cd E:\KTPM\SWT301\Labs\datetime-checker-node

# Chạy server Express
node server.js
```

**Dấu hiệu thành công:** Terminal hiển thị (tùy theo code server.js của bạn):
```
Server running on port 3001
```

Terminal này **phải để mở**, không được đóng.

---

#### Terminal 2 — Khởi động Frontend

```powershell
# Di chuyển vào thư mục client
cd E:\KTPM\SWT301\Labs\datetime-checker-node\client

# Khởi động Vite dev server
npm run dev
```

**Dấu hiệu thành công:**
```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Mở trình duyệt vào `http://localhost:5173` để xác nhận UI hiển thị đúng trước khi chạy test.

Terminal này **phải để mở**, không được đóng.

---

#### Terminal 3 — Set Token và chạy Percy

```powershell
# Di chuyển vào thư mục client
cd E:\KTPM\SWT301\Labs\datetime-checker-node\client

# ⚠️ PHẢI set token mỗi lần mở terminal mới (không lưu qua session)
$env:PERCY_TOKEN="web_40bc03112b66b3e52190666aa5f36a42459bdc94d3eca4de737159ba0270d1be"

# Xác nhận token đã set (phải hiện ra token, không được trống)
echo $env:PERCY_TOKEN

# Chạy Percy
npx percy exec -- npx playwright test
```

---

### Checklist trước khi chạy Percy

```
□ Terminal 1: node server.js đang chạy (cổng 3001)
□ Terminal 2: npm run dev đang chạy (cổng 5173)
□ Terminal 3: $env:PERCY_TOKEN đã set (echo hiện ra token)
□ Trình duyệt: http://localhost:5173 hiển thị đúng UI
□ Trình duyệt: thử nhập ngày và nhấn Check → có kết quả (backend OK)
```

---

### Sơ đồ 3 terminal

```
VSCode Terminal Panel
┌─────────────────────────────────────────────────────────┐
│  Terminal 1        Terminal 2        Terminal 3          │
│  ──────────        ──────────        ──────────          │
│  (root/)           (client/)         (client/)           │
│                                                          │
│  node server.js    npm run dev       $env:PERCY_TOKEN=.. │
│                                      npx percy exec --   │
│                                      npx playwright test │
│                                                          │
│  [Để nguyên]       [Để nguyên]       [Xem kết quả]      │
└─────────────────────────────────────────────────────────┘
```

---

### Tại sao PERCY_TOKEN mất sau khi tắt terminal?

```
Máy tính
├── System Environment Variables  ← Lưu vĩnh viễn (registry)
│   (Computer → Properties → Advanced → Environment Variables)
│
└── Session Environment Variables ← Chỉ tồn tại khi terminal mở
    $env:PERCY_TOKEN = "..."      ← Loại này — mất khi đóng terminal
```

**Nếu muốn không phải set lại mỗi lần**, có 2 cách:

**Cách 1: Set vĩnh viễn qua Windows GUI**
```
Win + S → "Edit environment variables" → User variables → New
Name:  PERCY_TOKEN
Value: web_40bc03...d1be
→ OK → Restart VSCode
```

**Cách 2: Thêm vào PowerShell profile** (tự động set mỗi khi mở PowerShell)
```powershell
# Mở file profile
notepad $PROFILE

# Thêm dòng này vào file và Save
$env:PERCY_TOKEN="web_40bc03112b66b3e52190666aa5f36a42459bdc94d3eca4de737159ba0270d1be"
```

> ⚠️ Cách 2 sẽ set token cho **mọi** PowerShell session — nên dùng Cách 1 nếu chỉ dùng cho project này.

---

## 5. Giải thích chi tiết Backend (server.js)

### Cấu trúc tổng thể

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());           // Cho phép cross-origin request (frontend gọi backend)
app.use(express.json());   // Parse JSON body từ request
```

**CORS** (Cross-Origin Resource Sharing): Khi frontend chạy ở `localhost:5173` và backend ở `localhost:3001`, trình duyệt mặc định sẽ block request (khác origin). `cors()` middleware giải quyết vấn đề này.

### Hàm `daysInMonth(year, month)` — Logic core

```javascript
function daysInMonth(year, month) {
    // Các tháng có 31 ngày
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;

    // Các tháng có 30 ngày
    if ([4, 6, 9, 11].includes(month)) return 30;

    // Tháng 2 — phức tạp nhất (cần check năm nhuận)
    if (month === 2) {
        if (year % 400 === 0) return 29;  // Chia hết 400 → nhuận (vd: 2000, 2400)
        if (year % 100 === 0) return 28;  // Chia hết 100 nhưng không 400 → không nhuận (vd: 1900)
        if (year % 4 === 0)   return 29;  // Chia hết 4 → nhuận (vd: 2024)
        return 28;                         // Còn lại → không nhuận
    }
    return 0; // month không hợp lệ
}
```

**Flowchart năm nhuận:**

```
            year % 400 == 0?
           /               \
         Yes               No
          │                 │
        29 ngày       year % 100 == 0?
                     /              \
                   Yes              No
                    │                │
                 28 ngày       year % 4 == 0?
                              /             \
                            Yes             No
                             │               │
                          29 ngày         28 ngày
```

### API Endpoint `/api/check-date`

```javascript
app.post('/api/check-date', (req, res) => {
    const { day, month, year } = req.body;

    // Chuyển đổi sang Number (vì body gửi lên là string)
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);

    // BƯỚC 1: Kiểm tra định dạng (Format check)
    // Điều kiện lỗi format:
    // - Giá trị rỗng/undefined
    // - Không phải số (NaN)
    // - Không phải số nguyên (1.5, 2.7...)
    if (!day || isNaN(d) || !Number.isInteger(d)) {
        return res.json({ success: false, message: "Input data for Day is incorrect format!" });
    }
    // Tương tự cho month và year...

    // BƯỚC 2: Kiểm tra khoảng giá trị (Range check)
    if (d < 1 || d > 31) return res.json({ success: false, message: "Input data for Day is out of range!" });
    if (m < 1 || m > 12) return res.json({ success: false, message: "Input data for Month is out of range!" });
    if (y < 1000 || y > 3000) return res.json({ success: false, message: "Input data for Year is out of range!" });

    // BƯỚC 3: Kiểm tra ngày hợp lệ theo tháng/năm
    const maxDays = daysInMonth(y, m);
    if (d <= maxDays) {
        return res.json({ success: true, message: `${d}/${m}/${y} is correct date time!` });
    }

    return res.json({ success: false, message: `${d}/${m}/${y} is NOT correct date time!` });
});
```

**Thứ tự ưu tiên validation (quan trọng):**

```
Input → Format Check → Range Check → Logic Check → Result
         (abc, 1.5)    (0, 32, 13)   (31/4, 29/2)
```

Thứ tự này đảm bảo error message có nghĩa: không thể báo "out of range" nếu dữ liệu không phải số.

---

## 6. Giải thích chi tiết Frontend (App.jsx)

### State Management

```javascript
const [day, setDay] = useState('');      // Giá trị input Day
const [month, setMonth] = useState('');  // Giá trị input Month
const [year, setYear] = useState('');    // Giá trị input Year
const [result, setResult] = useState(null); // Kết quả từ API: { success: bool, message: string }
```

**Tại sao dùng `useState('')` thay vì `useState(null)`?**

Vì input type="text" trả về string. Khởi tạo với `''` (empty string) đảm bảo controlled component — React kiểm soát hoàn toàn giá trị của input.

### Hàm `handleCheck` — Gọi API

```javascript
const handleCheck = async () => {
    try {
        const response = await fetch('http://localhost:3001/api/check-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, month, year })  // Gửi state hiện tại
        });
        const data = await response.json();
        setResult(data);  // { success: true/false, message: "..." }
    } catch (error) {
        // Xử lý khi không kết nối được server
        setResult({ success: false, message: 'Network Error: Cannot connect to server.' });
    }
};
```

**Flow async/await:**

```
handleCheck() được gọi
        │
        ▼
fetch() gửi HTTP POST request
        │ (đợi response)
        ▼
response.json() parse body
        │ (đợi parse)
        ▼
setResult(data) → React re-render → hiển thị result-box
```

### Conditional Rendering

```jsx
{result && (
    <div className={`result-box ${result.success ? 'success' : 'error'}`}>
        {result.success ? '✓ ' : '✗ '}
        {result.message}
    </div>
)}
```

- `result &&` → chỉ render khi result khác null/undefined
- Template literal trong className → gán class động dựa vào `result.success`
- CSS classes `success`/`error` → màu xanh/đỏ tương ứng

---

## 7. Giải thích chi tiết File Test (date-checker.spec.js)

### Import và Helper Function

```javascript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';  // ← Percy SDK

async function fillAndCheck(page, day, month, year) {
    // page.getByPlaceholder() — tìm element theo placeholder text
    // .fill() — xóa nội dung cũ và nhập giá trị mới (khác .type() là append)
    await page.getByPlaceholder('e.g. 15').fill(day);
    await page.getByPlaceholder('e.g. 6').fill(month);
    await page.getByPlaceholder('e.g. 2024').fill(year);

    // getByRole() — tìm element theo ARIA role + name (accessible selector)
    await page.getByRole('button', { name: 'Check' }).click();
}
```

**Tại sao dùng `getByPlaceholder` và `getByRole` thay vì CSS selector?**

```javascript
// ❌ Giòn — dễ vỡ khi đổi CSS class
await page.locator('.input-day').fill('15');

// ✅ Bền vững — dựa vào user-facing attributes
await page.getByPlaceholder('e.g. 15').fill('15');
await page.getByRole('button', { name: 'Check' }).click();
```

Playwright Best Practice: dùng locator gần với cách người dùng tương tác.

### Cấu trúc Test Suite

```javascript
test.describe('Valid Dates', () => {
    // beforeEach chạy trước MỖI test trong describe block này
    test.beforeEach(async ({ page }) => {
        await page.goto('/');  // Về trang chủ → đảm bảo clean state
    });

    test('TC-VALID-01: Ngày bình thường — 15/6/2024', async ({ page }) => {
        // 1. Action — thực hiện hành động
        await fillAndCheck(page, '15', '6', '2024');

        // 2. Assert — kiểm tra kết quả
        const resultBox = page.locator('.result-box');
        await expect(resultBox).toBeVisible();
        await expect(resultBox).toHaveClass(/success/);  // regex match
        await expect(resultBox).toContainText('15/6/2024 is correct date time!');

        // 3. Snapshot — chụp ảnh gửi Percy
        await percySnapshot(page, 'TC-VALID-01: Valid Date 15-6-2024');
    });
});
```

**Pattern AAA (Arrange-Act-Assert):**

```
Arrange  → test.beforeEach: goto('/') — chuẩn bị môi trường
Act      → fillAndCheck() — thực hiện hành động
Assert   → expect().toBeVisible()... — kiểm tra kết quả
Snapshot → percySnapshot() — chụp ảnh visual
```

### `percySnapshot()` hoạt động như thế nào?

```javascript
await percySnapshot(page, 'TC-VALID-01: Valid Date 15-6-2024');
//                  ────  ──────────────────────────────────
//                  │     └── Tên snapshot (PHẢI UNIQUE trong một build)
//                  └── Playwright Page object
```

**Bên trong `percySnapshot()`:**
1. Lấy toàn bộ DOM snapshot của trang
2. Lấy tất cả CSS (inline + external)
3. Serialize thành một package hoàn chỉnh
4. Gửi tới Percy Agent (đang chạy do `percy exec`)
5. Percy Agent upload lên percy.io cloud
6. Percy cloud render lại trang trong nhiều browser/viewport
7. So sánh pixel với baseline → tạo diff

**Tại sao tên snapshot phải UNIQUE?**

```
Build #1:
├── 'Valid Date Result'  ← snapshot của TC-VALID-01
├── 'Valid Date Result'  ← snapshot của TC-VALID-02 (GHI ĐÈ!)
└── 'Valid Date Result'  ← snapshot của TC-VALID-03 (GHI ĐÈ!)
→ Percy chỉ lưu cái cuối cùng!

Build #1 (sau khi sửa):
├── 'TC-VALID-01: Valid Date 15-6-2024'
├── 'TC-VALID-02: Valid Date 1-1-2000'
└── 'TC-VALID-03: Valid Date 31-12-2024'
→ Percy lưu đủ 31 snapshots ✓
```

### Các loại Test Cases

**Suite 1 — UI Rendering (3 tests):** Kiểm tra giao diện ban đầu khi chưa có tương tác.

**Suite 2 — Valid Dates (8 tests):** Kiểm tra các ngày hợp lệ với class `success`.

**Suite 3 — Invalid Dates (4 tests):** Ngày sai logic (31/4, 29/2 năm không nhuận...).

**Suite 4 — Out of Range (6 tests):** Giá trị ngoài khoảng cho phép (day=0, month=13...).

**Suite 5 — Incorrect Format (6 tests):** Dữ liệu sai định dạng (chữ, số thập phân, rỗng).

**Suite 6 — Clear Button (2 tests):** Nút Clear xóa fields và ẩn result box.

**Suite 7 — Close Button (2 tests):** Dialog confirm khi nhấn đóng app.

### Test đặc biệt — Dialog Handling

```javascript
test('TC-CLOSE-01: Nhấn Close hiển thị dialog xác nhận', async ({ page }) => {
    let dialogMessage = '';

    // Đăng ký event listener TRƯỚC khi trigger dialog
    // (nếu đăng ký sau → dialog đã đóng rồi, miss event)
    page.on('dialog', async (dialog) => {
        dialogMessage = dialog.message();  // Lấy nội dung dialog
        await dialog.dismiss();            // Nhấn Cancel (không nhấn OK)
    });

    await page.locator('.close-btn').click();  // Trigger dialog

    expect(dialogMessage).toBe('Are you sure to exit?');
    await percySnapshot(page, 'TC-CLOSE-01: After Close Dialog Dismissed');
});
```

**Tại sao `dialog.dismiss()` thay vì `dialog.accept()`?**

- `dialog.accept()` → nhấn OK → `window.close()` → trang đóng → các assert sau sẽ fail
- `dialog.dismiss()` → nhấn Cancel → trang vẫn mở → có thể tiếp tục assert

---

## 8. Flow hoạt động của Percy

### Architecture tổng thể

```
Local Machine                     Percy Cloud
┌────────────────────────┐        ┌──────────────────────┐
│                        │        │                      │
│  percy exec            │        │  percy.io dashboard  │
│  ┌──────────────────┐  │        │  ┌────────────────┐  │
│  │  Percy Agent     │◄─┼─token──┤  │  Build #4      │  │
│  │  (localhost:5338)│  │        │  │  31 snapshots  │  │
│  └──────────┬───────┘  │        │  │  Baseline: ✓   │  │
│             │ snapshots │        │  └────────────────┘  │
│  ┌──────────▼───────┐  │        │                      │
│  │  Playwright test │  │        └──────────────────────┘
│  │  percySnapshot() │  │
│  └──────────────────┘  │
│                        │
└────────────────────────┘
```

### Lifecycle của một Percy Build

```
percy exec bắt đầu
      │
      ▼
Percy Agent khởi động (kết nối tới percy.io)
      │
      ▼
Playwright tests chạy
      │
      ├── test 1 → percySnapshot() → Agent nhận snapshot #1
      ├── test 2 → percySnapshot() → Agent nhận snapshot #2
      │   ...
      └── test 31 → percySnapshot() → Agent nhận snapshot #31
      │
      ▼
Playwright kết thúc (31 passed)
      │
      ▼
Percy Agent finalize → upload tất cả lên percy.io
      │
      ▼
Percy cloud: render snapshots trong Chromium (+ Firefox, Safari nếu cấu hình)
      │
      ▼
So sánh với baseline build
      │
      ├── Lần đầu tiên → SET AS BASELINE (không có diff)
      └── Các lần sau → COMPARE → hiển thị diff trên dashboard
```

### Percy Dashboard — Trạng thái Build

| Status | Icon | Ý nghĩa |
|--------|------|---------|
| Approved | 🟢 | Tất cả snapshots được chấp nhận |
| Changes detected | 🟡 | Có thay đổi, cần review |
| Failed | 🔴 | Test failed hoặc lỗi kết nối |
| No changes | ✓ | UI không thay đổi so với baseline |

---

## 9. Các lỗi đã gặp và cách khắc phục

### Lỗi 1: Cypress download bị corrupt

```
npm error Corrupted download
npm error Expected downloaded file to have size: 251575688
npm error Computed size: 20268096
```

**Nguyên nhân:** Mạng yếu/không ổn định, file download bị cắt giữa chừng (chỉ download được 8%).

**Giải pháp:** Chuyển sang Playwright (đã có sẵn) thay vì Cypress.

### Lỗi 2: Missing Percy token (CMD vs PowerShell)

```
[percy] Error: Missing Percy token
```

**Nguyên nhân:** Dùng cú pháp CMD (`set PERCY_TOKEN=...`) trong PowerShell.

```powershell
# ❌ Sai — tạo PowerShell variable, không phải env var
set PERCY_TOKEN=web_40bc03...

# ✅ Đúng — tạo environment variable thật sự
$env:PERCY_TOKEN="web_40bc03..."
```

**Lưu ý quan trọng:** Environment variable trong PowerShell chỉ tồn tại trong **session hiện tại**. Đóng terminal → mất → phải set lại.

### Lỗi 3: ECONNRESET

```
[percy] Error: read ECONNRESET
[percy] Skipping visual tests
```

**Nguyên nhân:** Kết nối tới percy.io bị reset giữa chừng (mạng không ổn định) VÀ không có `percySnapshot()` nào trong code → Percy không có gì để upload.

**Giải pháp:** Thêm `percySnapshot()` vào các test cases.

### Lỗi 4: Snapshot names trùng nhau

**Nguyên nhân:** Nhiều test dùng cùng tên snapshot:

```javascript
// ❌ 8 test đều dùng tên này
await percySnapshot(page, 'Valid Date Result');
```

**Giải pháp:** Đặt tên unique theo pattern `TC-XXX-YY: Mô tả`:

```javascript
// ✅ Mỗi test có tên riêng
await percySnapshot(page, 'TC-VALID-01: Valid Date 15-6-2024');
await percySnapshot(page, 'TC-VALID-02: Valid Date 1-1-2000');
```

---

## 10. Kết quả cuối cùng

```
PS E:\KTPM\SWT301\Labs\datetime-checker-node\client> npx percy exec -- npx playwright test

[percy] Percy has started!
[percy] Running "npx playwright test"

Running 31 tests using 1 worker
  31 passed (1.1m)

[percy] Finalized build #4: https://percy.io/cf2f8d6f/web/Visual-Regression-b94ee6b7/builds/51313619
[percy] Command "npx playwright test" exited with status: 0
```

**31 snapshots** được tạo thành công, bao gồm:

```
UI Rendering       (3 snapshots)  — Trạng thái ban đầu
Valid Dates        (8 snapshots)  — Ngày hợp lệ
Invalid Dates      (4 snapshots)  — Ngày không hợp lệ
Out of Range       (6 snapshots)  — Ngoài khoảng giá trị
Incorrect Format   (6 snapshots)  — Sai định dạng
Clear Button       (2 snapshots)  — Chức năng Clear
Close Button       (2 snapshots)  — Chức năng Close
                  ──────────────
Total             31 snapshots
```

---

## 11. Kiến thức mở rộng

### Cách chạy lại để test visual regression thật sự

```powershell
# Bước 1: Thay đổi gì đó trong UI (vd: đổi màu nút Check)
# Trong App.css: .btn-check { background-color: red; }

# Bước 2: Chạy lại Percy
$env:PERCY_TOKEN="web_40bc03..."
npx percy exec -- npx playwright test

# Bước 3: Vào Percy dashboard
# Percy sẽ highlight pixel nào thay đổi
# → Approve (đây là thay đổi có chủ ý) hoặc Reject (đây là bug)
```

### Tích hợp vào GitHub Actions (CI/CD)

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression

on: [push, pull_request]

jobs:
  percy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd client
          npm ci

      - name: Install Playwright browsers
        run: cd client && npx playwright install --with-deps chromium

      - name: Start backend
        run: node server.js &

      - name: Start frontend
        run: cd client && npm run dev &

      - name: Wait for servers
        run: npx wait-on http://localhost:5173 http://localhost:3001

      - name: Run Percy
        run: cd client && npx percy exec -- npx playwright test
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}  # Set trong GitHub Secrets
```

### Best Practices Percy Snapshot

```javascript
// ✅ Chờ network idle trước khi snapshot (tránh loading state)
await page.waitForLoadState('networkidle');
await percySnapshot(page, 'After API Call');

// ✅ Chờ element cụ thể trước khi snapshot
await page.waitForSelector('.result-box');
await percySnapshot(page, 'Result Visible');

// ✅ Snapshot nhiều viewport
await percySnapshot(page, 'Homepage', {
    widths: [375, 768, 1280]  // Mobile, Tablet, Desktop
});

// ✅ Freeze animations để tránh flaky snapshots
await page.addStyleTag({
    content: `*, *::before, *::after { 
        animation-duration: 0s !important;
        transition-duration: 0s !important;
    }`
});
await percySnapshot(page, 'Static State');
```

### Phân biệt E2E Testing vs Visual Regression Testing

| Tiêu chí | E2E Testing (Playwright) | Visual Regression (Percy) |
|----------|--------------------------|---------------------------|
| Kiểm tra | Logic, behavior, data | Giao diện, pixels |
| Output | Pass/Fail | Approve/Reject |
| Phát hiện | Bug logic | UI regression |
| Ví dụ | "Nút Check gọi đúng API không?" | "Nút Check có bị đổi màu không?" |
| Chạy | Tự động hoàn toàn | Cần human review |

### Naming Convention cho Percy Snapshots

```
Format: 'TC-[SUITE]-[NUMBER]: [Mô tả ngắn gọn]'

Ví dụ:
  'TC-UI-01: Initial State - All Components Visible'
  'TC-VALID-04: Leap Year 29-2-2024'
  'TC-RANGE-02: Day Out of Range - Day 32'
  'TC-FORMAT-01: Incorrect Format - Day is Text'
```

**Lý do quan trọng:** Khi có 31 snapshots trên dashboard, tên rõ ràng giúp:
- Tìm nhanh snapshot bị lỗi
- Hiểu ngay test case đó kiểm tra gì
- Review nhanh hơn trong team

---

*Tài liệu được tạo từ session thực hành Visual Regression Testing với Percy + Playwright trên dự án Date Time Checker — FPT University SWT301.*
