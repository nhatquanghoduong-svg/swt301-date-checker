# 🤖 AI-Assisted Testing với Playwright MCP — DateTimeChecker

> **Ngày thực hiện:** 08/07/2026
> **Tool:** Playwright MCP + Claude Desktop
> **Phương pháp:** Natural Language Testing — điều khiển browser bằng ngôn ngữ tự nhiên

---

## 📋 Mục Lục

1. [Tổng quan](#1-tổng-quan)
2. [Tại sao Playwright MCP là chuẩn nhất?](#2-tại-sao-playwright-mcp-là-chuẩn-nhất)
3. [Kiến trúc hoạt động](#3-kiến-trúc-hoạt-động)
4. [Các bước thực hiện](#4-các-bước-thực-hiện)
5. [Cách Claude Desktop điều khiển browser](#5-cách-claude-desktop-điều-khiển-browser)
6. [Các test case đã thực hiện](#6-các-test-case-đã-thực-hiện)
7. [So sánh với các cách khác](#7-so-sánh-với-các-cách-khác)
8. [Tổng kết toàn bộ test suite](#8-tổng-kết-toàn-bộ-test-suite)

---

## 1. Tổng quan

AI-Assisted Testing là phương pháp kiểm thử phần mềm trong đó AI đóng vai trò **chủ động** trong quá trình test — không chỉ hỗ trợ viết code test, mà còn tự hiểu giao diện, tự tìm element, tự thực thi và tự đánh giá kết quả.

### 3 đặc điểm cốt lõi theo đề bài

| Đặc điểm | Ý nghĩa | Playwright MCP có không? |
|-----------|---------|--------------------------|
| **Test generation** | AI tự tạo ra hành động test từ mô tả | ✅ |
| **Self-healing** | AI tự tìm element kể cả khi UI thay đổi | ✅ |
| **Natural language** | Viết test bằng tiếng nói thông thường, không cần code | ✅ |

---

## 2. Tại sao Playwright MCP là chuẩn nhất?

Trong số 4 tool được đề bài liệt kê (**Playwright MCP, GitHub Copilot, Katalon AI, testRigor**), Playwright MCP phù hợp nhất với project này vì:

**Miễn phí hoàn toàn** — không cần API key, không cần đăng ký tài khoản trả phí như Katalon AI hay testRigor.

**Tích hợp trực tiếp với Claude Desktop** — không cần công cụ trung gian.

**Project đã có Playwright sẵn** — `@playwright/test` đã có trong `devDependencies` của `client/package.json`, không cần cài thêm gì.

**Đúng tên trong đề bài** — được liệt kê đầu tiên, là tool được khuyến nghị.

---

## 3. Kiến trúc hoạt động

```
Người dùng gõ lệnh tự nhiên trong Claude Desktop
                    ↓
        Claude (LLM) hiểu ngữ nghĩa
                    ↓
        Gọi Playwright MCP Tools
        (browser_navigate, browser_click,
         browser_fill, browser_snapshot...)
                    ↓
        Playwright MCP điều khiển
        Chromium browser thật sự
                    ↓
        Chụp snapshot DOM / screenshot
                    ↓
        Claude đọc kết quả và báo cáo
```

### Các MCP Tool Playwright cung cấp

| Tool | Chức năng |
|------|-----------|
| `browser_navigate` | Mở URL trong browser |
| `browser_snapshot` | Chụp trạng thái DOM hiện tại |
| `browser_click` | Click vào element |
| `browser_fill` | Điền text vào input |
| `browser_select_option` | Chọn option trong dropdown |
| `browser_screenshot` | Chụp màn hình |
| `browser_wait_for` | Chờ element xuất hiện |

Claude **không dùng CSS selector cứng** — nó đọc snapshot DOM, hiểu ngữ nghĩa của từng element (label, placeholder, role...) rồi tự quyết định cách tương tác. Đây chính là **self-healing**: nếu class name thay đổi nhưng label "Day" vẫn còn đó, Claude vẫn tìm được.

---

## 4. Các bước thực hiện

### Bước 1: Cài Playwright MCP (global)

```bash
npm install -g @playwright/mcp@latest
```

Lệnh này cài `@playwright/mcp` như một MCP server có thể được gọi bởi Claude Desktop thông qua `npx`.

### Bước 2: Cấu hình Claude Desktop

Mở file config tại:
```
C:\Users\<tên_máy>\AppData\Roaming\Claude\claude_desktop_config.json
```

Thêm block `mcpServers` vào file JSON:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Giải thích từng trường:**

| Trường | Ý nghĩa |
|--------|---------|
| `mcpServers` | Danh sách các MCP server Claude Desktop sẽ kết nối |
| `"playwright"` | Tên định danh của server (tự đặt) |
| `command: "npx"` | Lệnh để khởi động MCP server |
| `args` | Tham số truyền vào lệnh — chỉ định package cần chạy |

Sau khi save → **Restart Claude Desktop hoàn toàn** (tắt từ system tray).

### Bước 3: Xác nhận kết nối

Vào **Settings → Developer** trong Claude Desktop. Nếu thấy:

```
playwright  [running]
Command: npx
Arguments: @playwright/mcp@latest
```

→ MCP server đã kết nối thành công.

### Bước 4: Khởi động app

```bash
# Terminal 1 — Backend Express (port 3001)
cd server
npm run dev

# Terminal 2 — Frontend React/Vite (port 5173)
cd client
npm run dev
```

### Bước 5: Chạy test bằng natural language

Mở chat mới trong Claude Desktop và gõ lệnh bằng ngôn ngữ tự nhiên.

---

## 5. Cách Claude Desktop điều khiển browser

Khi bạn gõ lệnh tự nhiên, Claude thực hiện các bước nội bộ sau:

### Ví dụ với lệnh:
```
Mở http://localhost:5173, nhập Day=15, Month=6, Year=2024,
click Check, kiểm tra hiển thị "correct date time"
```

### Flow xử lý nội bộ:

**Bước 1 — Phân tích ngữ nghĩa:**
Claude hiểu yêu cầu gồm 5 hành động: navigate → fill × 3 → click → assert.

**Bước 2 — Gọi `browser_navigate`:**
```
browser_navigate("http://localhost:5173")
```
Playwright MCP mở Chromium và điều hướng đến URL.

**Bước 3 — Gọi `browser_snapshot`:**
Claude chụp snapshot DOM để hiểu cấu trúc trang — tìm các input có label "Day", "Month", "Year" và button "Check".

**Bước 4 — Gọi `browser_fill` × 3:**
```
browser_fill(selector="input[placeholder='e.g. 15']", value="15")
browser_fill(selector="input[placeholder='e.g. 6']", value="6")
browser_fill(selector="input[placeholder='e.g. 2024']", value="2024")
```
Claude tự suy ra selector từ DOM snapshot — không phải từ code cứng.

**Bước 5 — Gọi `browser_click`:**
```
browser_click(selector="button:has-text('Check')")
```

**Bước 6 — Gọi `browser_snapshot` lần 2:**
Chụp DOM sau khi click để đọc kết quả hiển thị.

**Bước 7 — Đánh giá:**
Claude đọc text trong result box, tìm "correct date time" → báo **PASS**.

### Output trong Claude Desktop:
```
Used playwright integration, loaded tools
1. Mở trình duyệt tới http://localhost:5173
2. Nhập Day=15, Month=6, Year=2024
3. Click nút Check
Kết quả: Trang hiển thị "✓ 15/6/2024 is correct date time!" — PASS.
```

---

## 6. Các test case đã thực hiện

### TC1: Ngày hợp lệ thông thường
```
Mở http://localhost:5173, nhập Day=15, Month=6, Year=2024,
click Check, kiểm tra kết quả có hiển thị "correct date time" không
```
**Kết quả:** ✅ PASS — hiển thị "✓ 15/6/2024 is correct date time!"

### TC2: Năm không nhuận — ngày không hợp lệ
```
Nhập Day=29, Month=2, Year=2025, click Check,
kiểm tra hiển thị "NOT correct date time"
```
**Kết quả:** ✅ PASS — năm 2025 không nhuận, tháng 2 chỉ có 28 ngày.

### TC3: Out of range
```
Nhập Day=32, Month=6, Year=2024, click Check,
kiểm tra hiển thị "out of range"
```
**Kết quả:** ✅ PASS — Day=32 vượt quá giới hạn max=31.

### TC4: Clear button
```
Nhập Day=15, Month=6, Year=2024,
click Clear, kiểm tra 3 ô input đã trống
```
**Kết quả:** ✅ PASS — tất cả input trở về rỗng.

---

## 7. So sánh với các cách khác

### Self-Healing Simulate (cách bạn bè làm)

```javascript
// Tự viết code fallback — không phải AI thật
async function aiFill(page, labelText, value) {
  // Chiến lược 1: label[for]
  // Chiến lược 2: placeholder
  // Chiến lược 3: sibling
  // Chiến lược 4: fuzzy id/name
}
```

Đây là **smart selector fallback** — logic if/else do lập trình viên viết tay, không có AI thật sự hiểu ngữ nghĩa. Nếu UI thay đổi theo cách không lường trước, code vẫn có thể fail.

### Playwright MCP (cách chuẩn)

Claude **đọc toàn bộ DOM snapshot** rồi dùng LLM để suy luận cách tìm element — giống như một người dùng thật nhìn vào màn hình và hiểu "ô này là để nhập ngày". Đây là self-healing thật sự vì AI hiểu ngữ nghĩa, không phụ thuộc vào selector cụ thể.

### Bảng so sánh đầy đủ

| Tiêu chí | Self-Healing tự viết | GitHub Copilot | Playwright MCP |
|----------|---------------------|----------------|----------------|
| AI thật không? | ❌ Code fallback | ⚠️ Hỗ trợ viết code | ✅ LLM thật |
| Natural language? | ❌ | ❌ | ✅ |
| Self-healing thật? | ❌ Giả lập | ❌ | ✅ |
| Cần API key? | Không | Có (trả phí) | Không |
| Chạy trong IDE? | ✅ | ✅ | ❌ (Claude Desktop) |
| Phù hợp đề bài? | Tạm được | Tốt | ✅ Tốt nhất |

---

## 8. Tổng kết toàn bộ test suite

Sau khi hoàn thành AI-Assisted Testing, project DateTimeChecker có 3 lớp kiểm thử:

| Layer | Tool | Số test | Mục đích |
|-------|------|---------|---------|
| **Unit Test** | Jest + Supertest | 47 tests | Kiểm tra từng hàm/API riêng lẻ |
| **E2E Test** | Playwright | 31 tests | Kiểm tra luồng UI hoàn chỉnh bằng code |
| **AI-Assisted** | Playwright MCP + Claude | Natural language | Kiểm tra bằng ngôn ngữ tự nhiên, AI tự thực thi |

### Mỗi lớp bổ sung cho nhau như thế nào

```
Unit Test          E2E Test           AI-Assisted
    │                  │                   │
    ▼                  ▼                   ▼
Nhanh, chính xác  Kiểm tra UI thật   Không cần biết code
Không cần browser Cần chạy app       AI tự tìm element
Test logic thuần  Test tích hợp      Demo natural language
```

**Unit Test** bắt lỗi logic sớm nhất — chạy nhanh, không cần browser, test từng hàm riêng lẻ như `daysInMonth()`.

**E2E Test** đảm bảo frontend và backend hoạt động đúng khi kết hợp với nhau — test như người dùng thật nhưng bằng code tự động.

**AI-Assisted Testing** demo khả năng của AI trong testing — không cần viết code, chỉ cần mô tả bằng ngôn ngữ tự nhiên, AI tự hiểu và thực thi.

---

## Các khái niệm quan trọng

| Khái niệm | Định nghĩa |
|-----------|-----------|
| **MCP (Model Context Protocol)** | Giao thức cho phép Claude kết nối và điều khiển các công cụ bên ngoài (browser, file system, database...) |
| **MCP Server** | Chương trình chạy nền, expose các "tool" mà Claude có thể gọi |
| **Natural Language Testing** | Viết test bằng ngôn ngữ thông thường thay vì code |
| **Self-Healing Selector** | Khả năng tự tìm element kể cả khi CSS class/id thay đổi, dựa vào ngữ nghĩa |
| **DOM Snapshot** | Ảnh chụp cấu trúc HTML của trang tại một thời điểm — Playwright MCP dùng để Claude "nhìn" trang web |
| **Headless Browser** | Browser chạy không có giao diện đồ họa — nhanh hơn nhưng không thể quan sát bằng mắt |
