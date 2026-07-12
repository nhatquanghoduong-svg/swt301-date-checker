# Hướng dẫn CI/CD với GitHub Actions — Date Checker App

> Tài liệu này tổng hợp toàn bộ quá trình thiết lập CI/CD cho dự án **Date Checker** (Express backend + React frontend), bao gồm giải thích chi tiết về từng file, từng đoạn code và flow hoạt động.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục dự án](#2-cấu-trúc-thư-mục-dự-án)
3. [Backend — app.js](#3-backend--appjs)
4. [Test files](#4-test-files)
5. [package.json — cấu hình Jest](#5-packagejson--cấu-hình-jest)
6. [GitHub Actions — ci.yml](#6-github-actions--ciyml)
7. [Flow CI/CD từ đầu đến cuối](#7-flow-cicd-từ-đầu-đến-cuối)
8. [Các khái niệm quan trọng cần nhớ](#8-các-khái-niệm-quan-trọng-cần-nhớ)

---

## 1. Tổng quan kiến trúc

```
Developer push code
        │
        ▼
   GitHub repo
        │  (trigger tự động)
        ▼
GitHub Actions (CI Pipeline)
        │
        ├── Job 1: 🧪 Chạy Jest Tests (47 test cases)
        │         └── Nếu PASS → tiếp tục
        │         └── Nếu FAIL → dừng, báo lỗi
        │
        └── Job 2: 📊 Summary Report (luôn chạy)
                  └── Hiển thị bảng kết quả trên GitHub UI
```

**CI (Continuous Integration)** là gì?
- Mỗi lần push code lên GitHub, hệ thống **tự động** chạy toàn bộ test suite
- Mục tiêu: phát hiện lỗi sớm, trước khi merge vào nhánh chính
- Không cần chạy test thủ công nữa

---

## 2. Cấu trúc thư mục dự án

```
project-root/
├── .github/
│   └── workflows/
│       └── ci.yml          ← "bộ não" của CI/CD, GitHub đọc file này
│
└── server/
    ├── __tests__/
    │   ├── checkDate.test.js       ← integration test cho API endpoint
    │   └── daysInMonth.test.js     ← unit test cho hàm thuần túy
    ├── app.js              ← logic chính + export để test
    ├── server.js           ← chỉ gọi app.listen(), khởi động server
    ├── package.json        ← khai báo dependencies + jest config
    └── package-lock.json   ← lock version chính xác của dependencies
```

### Tại sao phải tách `app.js` và `server.js`?

Đây là pattern quan trọng trong Node.js testing:

```
❌ Nếu để tất cả trong server.js:
   server.js gọi app.listen(3001) ngay khi require()
   → Khi test file chạy require('../server'), server sẽ bind port 3001
   → Nhiều test chạy song song sẽ bị "port already in use"
   → Test không chạy được

✅ Tách ra app.js + server.js:
   app.js: chỉ tạo Express app, export ra ngoài
   server.js: import app rồi mới gọi listen()
   → supertest dùng app trực tiếp, không cần bind port thật
   → Test chạy nhanh, độc lập, không conflict
```

**`server.js`** — chỉ có nhiệm vụ start server:
```javascript
const { app } = require('./app');
app.listen(3001, () => console.log('Server running on port 3001'));
```

---

## 3. Backend — `app.js`

### 3.1 Cấu trúc tổng thể

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());           // Middleware: cho phép cross-origin request
app.use(express.json());   // Middleware: parse JSON body từ request

function daysInMonth(year, month) { ... }   // Hàm thuần túy (pure function)

app.post('/api/check-date', (req, res) => { ... });  // Route handler

module.exports = { app, daysInMonth };  // Export để test dùng
```

### 3.2 Hàm `daysInMonth(year, month)`

```javascript
function daysInMonth(year, month) {
    // Các tháng có 31 ngày
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;

    // Các tháng có 30 ngày
    if ([4, 6, 9, 11].includes(month)) return 30;

    // Tháng 2 — phức tạp nhất vì phụ thuộc năm nhuận
    if (month === 2) {
        if (year % 400 === 0) return 29;  // Chia hết 400 → nhuận
        if (year % 100 === 0) return 28;  // Chia hết 100 (không 400) → không nhuận
        if (year % 4 === 0)   return 29;  // Chia hết 4 (không 100) → nhuận
        return 28;                         // Còn lại → không nhuận
    }

    return 0;  // Tháng không hợp lệ (< 1 hoặc > 12)
}
```

**Tại sao thứ tự kiểm tra năm nhuận quan trọng?**

```
Ví dụ: year = 1900

Bước 1: 1900 % 400 = 300 ≠ 0  → không phải trường hợp này, kiểm tra tiếp
Bước 2: 1900 % 100 = 0         → DỪNG, return 28

Nếu đổi thứ tự (kiểm tra % 4 trước):
Bước 1: 1900 % 4 = 0 → return 29  ← SAI! (1900 không phải năm nhuận)

Thứ tự đúng phải là: 400 → 100 → 4
Vì 400 là điều kiện ĐẶC BIỆT NHẤT, phải ưu tiên kiểm tra trước.
```

### 3.3 Route handler `POST /api/check-date`

Flow xử lý theo 3 lớp kiểm tra:

```
Request body: { day, month, year }
        │
        ▼
┌─────────────────────────────────┐
│ Lớp 1: Kiểm tra ĐỊNH DẠNG      │
│ - Có phải số không? (isNaN)     │
│ - Có phải số nguyên không?      │
│   (Number.isInteger)            │
│ - Có bị rỗng không? (!value)    │
└──────────────┬──────────────────┘
               │ Pass
               ▼
┌─────────────────────────────────┐
│ Lớp 2: Kiểm tra PHẠM VI        │
│ - Day:   1 ≤ d ≤ 31            │
│ - Month: 1 ≤ m ≤ 12            │
│ - Year: 1000 ≤ y ≤ 3000        │
└──────────────┬──────────────────┘
               │ Pass
               ▼
┌─────────────────────────────────┐
│ Lớp 3: Kiểm tra TÍNH HỢP LỆ   │
│ - Gọi daysInMonth(y, m)         │
│ - So sánh d với maxDays         │
└──────────────┬──────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
   d ≤ maxDays    d > maxDays
   → success:true → success:false
```

**Chi tiết kiểm tra định dạng:**

```javascript
const d = Number(day);   // "15" → 15, "abc" → NaN, "1.5" → 1.5, "" → 0

if (!day || isNaN(d) || !Number.isInteger(d)) { ... }
//  ↑ rỗng   ↑ không phải số  ↑ không phải số nguyên

// Ví dụ từng trường hợp:
// day = ""    → !day = true  → lỗi format
// day = "abc" → isNaN(NaN) = true → lỗi format
// day = "1.5" → Number.isInteger(1.5) = false → lỗi format
// day = "15"  → !false, !false, !false → pass
```

### 3.4 `module.exports` — tại sao cần export?

```javascript
module.exports = { app, daysInMonth };
```

Nếu không có dòng này, test files không thể import được:
```javascript
// Trong test file:
const { app, daysInMonth } = require('../app');
//      ↑ cần app để supertest gửi request
//              ↑ cần daysInMonth để test trực tiếp
```

---

## 4. Test files

### 4.1 `daysInMonth.test.js` — Unit Test

**Unit test** = test một hàm đơn lẻ, cô lập, không phụ thuộc vào network hay database.

```javascript
const { daysInMonth } = require('../app');

describe('daysInMonth - Các tháng có 31 ngày', () => {
    test('Tháng 1 (January) có 31 ngày', () => {
        expect(daysInMonth(2024, 1)).toBe(31);
        //     ↑ gọi hàm      ↑ kỳ vọng kết quả là 31
    });
});
```

**Giải thích cú pháp Jest:**

| Cú pháp | Ý nghĩa |
|---------|---------|
| `describe('tên nhóm', () => {})` | Nhóm các test liên quan lại |
| `test('mô tả', async () => {})` | Một test case cụ thể |
| `expect(giá_trị)` | Giá trị cần kiểm tra |
| `.toBe(31)` | Kỳ vọng bằng chính xác 31 |
| `.toContain('text')` | Kỳ vọng chuỗi chứa 'text' |

**Các nhóm test trong `daysInMonth.test.js`:**

```
✅ Nhóm 1: Tháng 31 ngày (7 tests)
   → Kiểm tra tháng 1, 3, 5, 7, 8, 10, 12

✅ Nhóm 2: Tháng 30 ngày (4 tests)
   → Kiểm tra tháng 4, 6, 9, 11

✅ Nhóm 3: Tháng 2 - Năm nhuận (6 tests)
   → 2000 (÷400) = 29 ngày
   → 1900 (÷100, không ÷400) = 28 ngày
   → 2024 (÷4, không ÷100) = 29 ngày
   → 2023 (không ÷4) = 28 ngày
   → 1600 (÷400) = 29 ngày
   → 2100 (÷100, không ÷400) = 28 ngày

✅ Nhóm 4: Tháng không hợp lệ (3 tests)
   → Tháng 0, 13, -1 → return 0
```

### 4.2 `checkDate.test.js` — Integration Test

**Integration test** = test nhiều thành phần phối hợp với nhau (HTTP request → Express router → business logic → HTTP response).

```javascript
const request = require('supertest');
const { app } = require('../app');

test('15/6/2024 là ngày hợp lệ', async () => {
    const res = await request(app)         // supertest tạo HTTP client
        .post('/api/check-date')           // gửi POST request
        .send({ day: '15', month: '6', year: '2024' });  // body JSON

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('correct date time');
});
```

**supertest hoạt động như thế nào?**

```
supertest nhận vào Express app object
    │
    ├── Tạo HTTP server tạm thời (không bind port cố định)
    ├── Gửi request đến server đó
    ├── Nhận response
    └── Đóng server sau khi test xong

→ Không cần server đang chạy ở localhost:3001
→ Có thể chạy nhiều test song song mà không conflict port
```

**Các nhóm test trong `checkDate.test.js`:**

```
✅ Nhóm 1: Ngày hợp lệ (7 tests)
   → success: true, message chứa "correct date time"

✅ Nhóm 2: Ngày không hợp lệ (5 tests)
   → success: false, message chứa "NOT correct date time"
   → Ví dụ: 31/4, 29/2 năm không nhuận

✅ Nhóm 3: Sai định dạng (8 tests)
   → success: false, message chứa "incorrect format"
   → Ví dụ: "abc", "1.5", ""

✅ Nhóm 4: Ngoài phạm vi (7 tests)
   → success: false, message chứa "out of range"
   → Ví dụ: day=0, month=13, year=999
```

**Tổng: 47 test cases, tất cả PASS ✅**

---

## 5. `package.json` — cấu hình Jest

```json
{
  "name": "datetime-checker-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "test": "jest --verbose --coverage"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^30.4.2",
    "supertest": "^7.2.2"
  },
  "jest": {
    "testMatch": ["**/__tests__/**/*.test.js"]
  }
}
```

**Giải thích từng phần:**

| Phần | Ý nghĩa |
|------|---------|
| `dependencies` | Package cần để app chạy (production) |
| `devDependencies` | Package chỉ cần khi phát triển/test |
| `jest --verbose` | Hiện tên từng test case thay vì chỉ tổng kết |
| `jest --coverage` | Tạo báo cáo % code được test bao phủ |
| `testMatch` | Chỉ chạy file `.test.js` trong thư mục `__tests__` |

**Tại sao `jest` và `supertest` là devDependencies?**

```
dependencies    → được cài khi deploy lên production server
devDependencies → CHỈ được cài khi npm install (môi trường dev/CI)

Khi deploy production: npm install --production
→ Bỏ qua devDependencies → tiết kiệm dung lượng, tăng bảo mật
```

**`npm ci` vs `npm install` trong CI:**

```
npm install → đọc package.json, có thể update package-lock.json
npm ci      → đọc package-lock.json, cài CHÍNH XÁC version đó
              → nhanh hơn, deterministic (kết quả luôn giống nhau)
              → phù hợp cho môi trường CI/CD
```

---

## 6. GitHub Actions — `ci.yml`

File này nằm tại `.github/workflows/ci.yml`. GitHub tự động phát hiện và chạy.

```yaml
name: CI — Date Checker Backend

on:
  push:
    branches: [main, develop]   # Trigger khi push lên main hoặc develop
  pull_request:
    branches: [main]            # Trigger khi tạo PR vào main
```

### 6.1 Giải thích cú pháp YAML

```yaml
jobs:           # Danh sách các công việc
  test:         # Tên job (đặt tùy ý)
    name: 🧪 Run Jest Tests   # Tên hiển thị trên GitHub UI
    runs-on: ubuntu-latest    # Chạy trên máy ảo Ubuntu mới nhất

    steps:                    # Danh sách các bước trong job
      - name: Checkout code   # Tên bước (hiển thị trên UI)
        uses: actions/checkout@v4  # Dùng action có sẵn từ marketplace
```

### 6.2 Chi tiết từng step

**Step 1: Checkout code**
```yaml
- name: Checkout code
  uses: actions/checkout@v4
```
→ Clone repository vào máy ảo của GitHub Actions. Không có bước này, máy ảo không có code để chạy.

**Step 2: Setup Node.js**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: server/package-lock.json
```
→ Cài Node.js version 20 lên máy ảo.
→ `cache: 'npm'` = lưu cache `node_modules` dựa theo `package-lock.json`, lần sau không cần tải lại → nhanh hơn.

**Step 3: Install dependencies**
```yaml
- name: Install dependencies
  working-directory: server
  run: npm ci
```
→ `working-directory: server` = chạy lệnh trong thư mục `server/`
→ `npm ci` = cài đúng version trong lock file, nhanh và ổn định

**Step 4: Chạy test**
```yaml
- name: Run tests with coverage
  working-directory: server
  run: npm test -- --coverage
```
→ Chạy `jest --verbose --coverage`
→ Nếu có test nào FAIL, job này exit code ≠ 0 → GitHub Actions đánh dấu FAIL đỏ

**Step 5: Upload coverage**
```yaml
- name: Upload coverage artifact
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: server/coverage/
```
→ Lưu thư mục `coverage/` (do Jest tạo ra) lên GitHub
→ Có thể download về xem báo cáo HTML chi tiết

### 6.3 Job Report — `if: always()`

```yaml
report:
  needs: [test]   # Chờ job 'test' xong mới chạy
  if: always()    # Luôn chạy, dù job 'test' pass hay fail
```

**Tại sao cần `if: always()`?**
```
Mặc định: nếu job trước FAIL → job sau bị bỏ qua (skip)
if: always() → đảm bảo report luôn được tạo ra
→ Dù test fail, vẫn thấy được bảng tổng kết trên GitHub
```

### 6.4 GitHub Step Summary

```yaml
- name: Write summary
  run: |
    echo "## 📊 CI Report" >> $GITHUB_STEP_SUMMARY
    echo "| Job | Result |" >> $GITHUB_STEP_SUMMARY
    echo "|-----|--------|" >> $GITHUB_STEP_SUMMARY
    echo "| 🧪 Tests | ${{ needs.test.result }} |" >> $GITHUB_STEP_SUMMARY
```

→ `$GITHUB_STEP_SUMMARY` là file đặc biệt, nội dung được render thành Markdown đẹp trên tab Summary của GitHub Actions.
→ `${{ needs.test.result }}` = lấy kết quả của job `test` (success / failure / skipped)

---

## 7. Flow CI/CD từ đầu đến cuối

### Khi bạn push code:

```
1. git push origin main
        │
        ▼
2. GitHub nhận push event
   → Tìm file trong .github/workflows/*.yml
   → Đọc điều kiện "on.push.branches: [main]"
   → Khớp! → Tạo workflow run mới
        │
        ▼
3. GitHub tạo máy ảo Ubuntu (ubuntu-latest)
   → Máy ảo trống, chưa có gì
        │
        ▼
4. Chạy từng step theo thứ tự:
   ├── actions/checkout@v4  → clone code vào máy ảo
   ├── actions/setup-node@v4 → cài Node.js 20
   ├── npm ci               → cài dependencies
   └── npm test             → chạy 47 test cases
        │
        ├── 47/47 PASS → job "test": success ✅
        │                       │
        │               job "report" chạy
        │               → ghi bảng kết quả vào Summary
        │
        └── Có test FAIL → job "test": failure ❌
                                │
                        GitHub gửi email thông báo
                        job "report" vẫn chạy (if: always())
```

### Khi nào CI chạy?

```
✅ git push lên main   → CI chạy
✅ git push lên develop → CI chạy
✅ Tạo Pull Request vào main → CI chạy
❌ Push lên nhánh khác (ví dụ: feature/xyz) → CI không chạy
```

---

## 8. Các khái niệm quan trọng cần nhớ

### 8.1 Pure Function vs Side Effect

```javascript
// ✅ Pure function — dễ test, kết quả chỉ phụ thuộc vào input
function daysInMonth(year, month) {
    // Không đọc/ghi database, không gọi API
    // Cùng input → luôn cùng output
    return ...;
}

// ⚠️ Side effect — khó test hơn
app.post('/api/check-date', (req, res) => {
    // Phụ thuộc vào HTTP request, res.json() ghi vào network
    // Cần supertest để test
});
```

### 8.2 Test Pyramid

```
        /\
       /E2E\        ← ít nhất (chậm, tốn tài nguyên)
      /──────\
     /Integ.  \     ← vừa phải (checkDate.test.js)
    /──────────\
   /  Unit      \   ← nhiều nhất (daysInMonth.test.js)
  /______________\
```

- **Unit test**: test hàm đơn lẻ, nhanh, không cần network
- **Integration test**: test nhiều thành phần phối hợp, cần HTTP
- **E2E test**: test toàn bộ từ UI đến database (không có trong dự án này)

### 8.3 Boundary Value Testing

Dự án này áp dụng kỹ thuật **kiểm thử biên** (Boundary Value Analysis):

```
Day range: [1, 31]
Test các giá trị:
  → 0   (dưới biên min)  → out of range
  → 1   (đúng biên min)  → valid
  → 31  (đúng biên max)  → valid
  → 32  (trên biên max)  → out of range
  → -5  (âm)            → out of range

Year range: [1000, 3000]
Test:
  → 999  → out of range
  → 1000 → valid (biên dưới)
  → 3000 → valid (biên trên)
  → 3001 → out of range
```

### 8.4 Lệnh Git đã dùng

```bash
git init                    # Khởi tạo git repo local
git add .                   # Stage tất cả file
git commit -m "feat: ..."   # Commit với message
git remote add origin URL   # Liên kết với GitHub repo
git branch -M main          # Đổi tên nhánh thành main
git push -u origin main     # Push lên GitHub lần đầu
```

**Convention commit message:**
```
feat: thêm tính năng mới
fix:  sửa bug
ci:   thay đổi liên quan CI/CD
test: thêm/sửa test
docs: cập nhật tài liệu
```

### 8.5 Kết quả cuối cùng

```
✅ 47/47 tests passed
✅ Pipeline chạy trong 31 giây
✅ Coverage report được upload lên GitHub Artifacts
✅ Summary report hiển thị trên tab Actions > Summary
```

---

## Tóm tắt các file đã tạo

| File | Vai trò |
|------|---------|
| `server/app.js` | Logic chính, export `app` và `daysInMonth` |
| `server/server.js` | Chỉ gọi `app.listen()` để start server |
| `server/package.json` | Khai báo deps + jest config |
| `server/__tests__/daysInMonth.test.js` | 20 unit tests cho hàm `daysInMonth` |
| `server/__tests__/checkDate.test.js` | 27 integration tests cho API endpoint |
| `.github/workflows/ci.yml` | Pipeline CI/CD tự động chạy khi push |

---

*Tài liệu được tổng hợp từ quá trình thực hiện dự án Date Checker — CI/CD với GitHub Actions.*
