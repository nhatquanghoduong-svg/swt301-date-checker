# 🧪 Unit Testing với Jest — DateTime Checker Server

> **Ngày thực hiện:** 28/05/2026  
> **Framework:** Jest + Supertest  
> **Tổng test cases:** 47 (tất cả PASS ✅)

---

## 📋 Mục Lục

1. [Tổng quan những gì đã làm](#1-tổng-quan-những-gì-đã-làm)
2. [Cấu trúc thư mục sau khi thêm test](#2-cấu-trúc-thư-mục-sau-khi-thêm-test)
3. [Các bước đã thực hiện](#3-các-bước-đã-thực-hiện)
4. [Giải thích file `app.js` (tách từ server.js)](#4-giải-thích-file-appjs)
5. [Giải thích file `daysInMonth.test.js`](#5-giải-thích-file-daysinmonthtestjs)
6. [Giải thích file `checkDate.test.js`](#6-giải-thích-file-checkdatetestjs)
7. [Bảng tổng hợp toàn bộ Test Cases](#7-bảng-tổng-hợp-toàn-bộ-test-cases)
8. [Cách chạy test](#8-cách-chạy-test)
9. [Kết quả test](#9-kết-quả-test)

---

## 1. Tổng quan những gì đã làm

| Hạng mục | Chi tiết |
|----------|----------|
| Cài đặt dependencies | `jest`, `supertest` (devDependencies) |
| Tách code | `server.js` → `app.js` + `server.js` |
| File test 1 | `__tests__/daysInMonth.test.js` — 19 test cases |
| File test 2 | `__tests__/checkDate.test.js` — 28 test cases |
| Cập nhật | `package.json` — thêm script `"test": "jest --verbose"` |

---

## 2. Cấu trúc thư mục sau khi thêm test

```
server/
├── __tests__/                        ← THƯ MỤC TEST (MỚI)
│   ├── daysInMonth.test.js           ← Test hàm daysInMonth
│   └── checkDate.test.js             ← Test API endpoint
├── app.js                            ← MỚI - Logic Express app (tách từ server.js)
├── server.js                         ← SỬA - Chỉ còn khởi động server
├── package.json                      ← SỬA - Thêm script test
├── package-lock.json
├── node_modules/
└── UNIT_TESTING.md                   ← File này
```

---

## 3. Các bước đã thực hiện

### Bước 1: Cài đặt Jest và Supertest

```bash
npm install --save-dev jest supertest
```

| Package | Vai trò |
|---------|---------|
| `jest` | Framework testing chính, cung cấp `describe`, `test`, `expect` |
| `supertest` | Gửi HTTP request giả lập đến Express app mà KHÔNG cần khởi động server thật |

### Bước 2: Thêm script test vào `package.json`

```json
"scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "jest --verbose"       // ← THÊM MỚI
}
```

- `--verbose`: Hiển thị chi tiết tên từng test case khi chạy

### Bước 3: Tách `server.js` thành `app.js` + `server.js`

**Lý do tách:** File `server.js` gốc vừa chứa logic vừa gọi `app.listen()`. Nếu test import file này, server sẽ **thật sự khởi động** trên port 3001 → gây xung đột. Tách ra để:
- `app.js` — chứa logic, export `app` và `daysInMonth` cho test
- `server.js` — chỉ import `app` và gọi `app.listen()`

### Bước 4: Viết test cases

- `__tests__/daysInMonth.test.js` — Test trực tiếp hàm `daysInMonth(year, month)`
- `__tests__/checkDate.test.js` — Test API endpoint `POST /api/check-date` bằng `supertest`

---

## 4. Giải thích file `app.js`

File này được **tách ra từ `server.js` gốc**, chứa toàn bộ logic:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());           // Cho phép client ở port khác gọi API
app.use(express.json());   // Tự động parse JSON body

// Hàm tính số ngày trong tháng
function daysInMonth(year, month) {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
    if ([4, 6, 9, 11].includes(month)) return 30;
    if (month === 2) {
        if (year % 400 === 0) return 29;   // 2000, 2400 → nhuận
        if (year % 100 === 0) return 28;   // 1900, 2100 → không nhuận
        if (year % 4 === 0) return 29;     // 2024, 2028 → nhuận
        return 28;                          // 2023, 2025 → không nhuận
    }
    return 0; // tháng không hợp lệ
}

// API endpoint kiểm tra ngày
app.post('/api/check-date', (req, res) => {
    // ... logic kiểm tra format, range, và tính hợp lệ của ngày
});

// ★ QUAN TRỌNG: Export để test file có thể import
module.exports = { app, daysInMonth };
```

**Dòng cuối `module.exports` là chìa khóa** — nó cho phép:
- `daysInMonth.test.js` import hàm `daysInMonth` để test trực tiếp
- `checkDate.test.js` import `app` để dùng với `supertest`
- `server.js` import `app` để gọi `app.listen()`

---

## 5. Giải thích file `daysInMonth.test.js`

### Cấu trúc cơ bản của một file test Jest:

```javascript
const { daysInMonth } = require('../app');  // Import hàm cần test

describe('Tên nhóm test', () => {           // Nhóm các test liên quan
    test('Mô tả test case', () => {         // Một test case cụ thể
        expect(daysInMonth(2024, 1))        // Gọi hàm với input
            .toBe(31);                      // Kiểm tra output = giá trị kỳ vọng
    });
});
```

### Giải thích từng khái niệm:

| Khái niệm | Ý nghĩa |
|------------|----------|
| `describe(name, fn)` | Nhóm các test case liên quan lại. Giúp tổ chức và đọc kết quả dễ hơn |
| `test(name, fn)` | Định nghĩa MỘT test case. Tên nên mô tả rõ: input → expected output |
| `expect(value)` | Tạo một "assertion" — khai báo giá trị thực tế |
| `.toBe(expected)` | So sánh chính xác (`===`) với giá trị kỳ vọng |

### 4 nhóm test trong file:

**Nhóm 1 — Tháng 31 ngày** (7 tests):
```javascript
// Test tháng 1, 3, 5, 7, 8, 10, 12 → đều trả về 31
test('Tháng 1 (January) có 31 ngày', () => {
    expect(daysInMonth(2024, 1)).toBe(31);
});
```

**Nhóm 2 — Tháng 30 ngày** (4 tests):
```javascript
// Test tháng 4, 6, 9, 11 → đều trả về 30
test('Tháng 4 (April) có 30 ngày', () => {
    expect(daysInMonth(2024, 4)).toBe(30);
});
```

**Nhóm 3 — Tháng 2 / Năm nhuận** (6 tests):
```javascript
// Test 4 trường hợp năm nhuận + 2 trường hợp bổ sung
test('Năm 2000: chia hết cho 400 → 29 ngày', () => {
    // Luồng: 2000 % 400 === 0 → true → return 29
    expect(daysInMonth(2000, 2)).toBe(29);
});

test('Năm 1900: chia hết 100, không chia hết 400 → 28 ngày', () => {
    // Luồng: 1900 % 400 !== 0 → 1900 % 100 === 0 → return 28
    expect(daysInMonth(1900, 2)).toBe(28);
});
```

**Nhóm 4 — Tháng không hợp lệ** (3 tests):
```javascript
// Tháng 0, 13, -1 → đều trả về 0
test('Tháng 0 → trả về 0', () => {
    expect(daysInMonth(2024, 0)).toBe(0);
});
```

---

## 6. Giải thích file `checkDate.test.js`

### Cách `supertest` hoạt động:

```javascript
const request = require('supertest');   // Import supertest
const { app } = require('../app');      // Import Express app

test('Test API', async () => {
    // Gửi POST request giả lập đến app (KHÔNG cần khởi động server)
    const res = await request(app)
        .post('/api/check-date')                     // HTTP method + URL
        .send({ day: '15', month: '6', year: '2024' }); // Request body (JSON)

    // Kiểm tra response
    expect(res.body.success).toBe(true);                  // Kiểm tra field success
    expect(res.body.message).toContain('correct date time'); // Kiểm tra message chứa text
});
```

> **Lưu ý:** Các test API dùng `async/await` vì `supertest` gửi request bất đồng bộ.

### 4 nhóm test trong file:

**Nhóm 1 — Ngày hợp lệ** (7 tests):
```
15/6/2024     ← trường hợp bình thường
29/2/2000     ← năm nhuận (chia hết 400)
29/2/2024     ← năm nhuận (chia hết 4)
28/2/1900     ← ngày 28 luôn hợp lệ tháng 2
1/1/1000      ← biên dưới year
31/12/3000    ← biên trên tất cả
30/4/2024     ← ngày cuối tháng 30 ngày
```

**Nhóm 2 — Ngày không hợp lệ** (5 tests):
```
29/2/1900     ← 1900 không nhuận → tháng 2 chỉ 28 ngày
31/4/2024     ← tháng 4 chỉ 30 ngày
31/6/2024     ← tháng 6 chỉ 30 ngày
30/2/2024     ← tháng 2 tối đa 29 (nhuận)
29/2/2023     ← tháng 2 chỉ 28 (không nhuận)
```

**Nhóm 3 — Sai định dạng** (8 tests):
```
day = "abc"   ← chữ → incorrect format
month = "xyz" ← chữ → incorrect format
year = "abcd" ← chữ → incorrect format
day = "1.5"   ← số thực → incorrect format
month = "6.7" ← số thực → incorrect format
day = ""      ← rỗng → incorrect format
month = ""    ← rỗng → incorrect format
year = ""     ← rỗng → incorrect format
```

**Nhóm 4 — Ngoài phạm vi** (7 tests):
```
day = 0       ← dưới biên (min=1)
day = 32      ← trên biên (max=31)
day = -5      ← số âm
month = 0     ← dưới biên (min=1)
month = 13    ← trên biên (max=12)
year = 999    ← dưới biên (min=1000)
year = 3001   ← trên biên (max=3000)
```

---

## 7. Bảng tổng hợp toàn bộ Test Cases

### File: `daysInMonth.test.js` (19 tests)

| # | Nhóm | Input (year, month) | Expected | Mô tả |
|---|------|---------------------|----------|-------|
| 1 | 31 ngày | (2024, 1) | 31 | Tháng 1 |
| 2 | 31 ngày | (2024, 3) | 31 | Tháng 3 |
| 3 | 31 ngày | (2024, 5) | 31 | Tháng 5 |
| 4 | 31 ngày | (2024, 7) | 31 | Tháng 7 |
| 5 | 31 ngày | (2024, 8) | 31 | Tháng 8 |
| 6 | 31 ngày | (2024, 10) | 31 | Tháng 10 |
| 7 | 31 ngày | (2024, 12) | 31 | Tháng 12 |
| 8 | 30 ngày | (2024, 4) | 30 | Tháng 4 |
| 9 | 30 ngày | (2024, 6) | 30 | Tháng 6 |
| 10 | 30 ngày | (2024, 9) | 30 | Tháng 9 |
| 11 | 30 ngày | (2024, 11) | 30 | Tháng 11 |
| 12 | Năm nhuận | (2000, 2) | 29 | Chia hết 400 |
| 13 | Năm nhuận | (1900, 2) | 28 | Chia hết 100, không 400 |
| 14 | Năm nhuận | (2024, 2) | 29 | Chia hết 4, không 100 |
| 15 | Năm nhuận | (2023, 2) | 28 | Không chia hết 4 |
| 16 | Năm nhuận | (1600, 2) | 29 | Chia hết 400 (thêm) |
| 17 | Năm nhuận | (2100, 2) | 28 | Chia hết 100, không 400 (thêm) |
| 18 | Không hợp lệ | (2024, 0) | 0 | Tháng 0 |
| 19 | Không hợp lệ | (2024, 13) | 0 | Tháng 13 |

### File: `checkDate.test.js` (28 tests)

| # | Nhóm | Input (d/m/y) | Expected | Mô tả |
|---|------|---------------|----------|-------|
| 1 | Hợp lệ | 15/6/2024 | ✅ success | Trường hợp thông thường |
| 2 | Hợp lệ | 29/2/2000 | ✅ success | Năm nhuận (400) |
| 3 | Hợp lệ | 29/2/2024 | ✅ success | Năm nhuận (4) |
| 4 | Hợp lệ | 28/2/1900 | ✅ success | Ngày 28 luôn hợp lệ |
| 5 | Hợp lệ | 1/1/1000 | ✅ success | Biên dưới year |
| 6 | Hợp lệ | 31/12/3000 | ✅ success | Biên trên tất cả |
| 7 | Hợp lệ | 30/4/2024 | ✅ success | Cuối tháng 30 ngày |
| 8 | Không hợp lệ | 29/2/1900 | ❌ NOT correct | 1900 không nhuận |
| 9 | Không hợp lệ | 31/4/2024 | ❌ NOT correct | Tháng 4 chỉ 30 ngày |
| 10 | Không hợp lệ | 31/6/2024 | ❌ NOT correct | Tháng 6 chỉ 30 ngày |
| 11 | Không hợp lệ | 30/2/2024 | ❌ NOT correct | Tháng 2 max 29 |
| 12 | Không hợp lệ | 29/2/2023 | ❌ NOT correct | Tháng 2 chỉ 28 |
| 13 | Sai format | day="abc" | ❌ incorrect format | Chữ |
| 14 | Sai format | month="xyz" | ❌ incorrect format | Chữ |
| 15 | Sai format | year="abcd" | ❌ incorrect format | Chữ |
| 16 | Sai format | day="1.5" | ❌ incorrect format | Số thực |
| 17 | Sai format | month="6.7" | ❌ incorrect format | Số thực |
| 18 | Sai format | day="" | ❌ incorrect format | Rỗng |
| 19 | Sai format | month="" | ❌ incorrect format | Rỗng |
| 20 | Sai format | year="" | ❌ incorrect format | Rỗng |
| 21 | Out of range | day=0 | ❌ out of range | Dưới biên (min=1) |
| 22 | Out of range | day=32 | ❌ out of range | Trên biên (max=31) |
| 23 | Out of range | day=-5 | ❌ out of range | Số âm |
| 24 | Out of range | month=0 | ❌ out of range | Dưới biên (min=1) |
| 25 | Out of range | month=13 | ❌ out of range | Trên biên (max=12) |
| 26 | Out of range | year=999 | ❌ out of range | Dưới biên (min=1000) |
| 27 | Out of range | year=3001 | ❌ out of range | Trên biên (max=3000) |
| 28 | Không hợp lệ | (2024, -1) | 0 | Tháng âm |

---

## 8. Cách chạy test

### Chạy tất cả test:
```bash
cd server
npm test
```

### Chạy một file test cụ thể:
```bash
npx jest __tests__/daysInMonth.test.js --verbose
npx jest __tests__/checkDate.test.js --verbose
```

### Xem độ bao phủ code (Code Coverage):
```bash
npx jest --coverage
```

### Chạy test ở chế độ watch (tự chạy lại khi code thay đổi):
```bash
npx jest --watch
```

---

## 9. Kết quả test

```
 PASS  __tests__/daysInMonth.test.js
  daysInMonth - Các tháng có 31 ngày
    √ Tháng 1 (January) có 31 ngày (3 ms)
    √ Tháng 3 (March) có 31 ngày
    √ Tháng 5 (May) có 31 ngày
    √ Tháng 7 (July) có 31 ngày
    √ Tháng 8 (August) có 31 ngày (1 ms)
    √ Tháng 10 (October) có 31 ngày
    √ Tháng 12 (December) có 31 ngày
  daysInMonth - Các tháng có 30 ngày
    √ Tháng 4 (April) có 30 ngày
    √ Tháng 6 (June) có 30 ngày
    √ Tháng 9 (September) có 30 ngày
    √ Tháng 11 (November) có 30 ngày
  daysInMonth - Tháng 2 (Năm nhuận)
    √ Năm 2000: chia hết cho 400 → năm nhuận → 29 ngày (1 ms)
    √ Năm 1900: chia hết cho 100 nhưng KHÔNG chia hết 400 → không nhuận → 28 ngày
    √ Năm 2024: chia hết cho 4 nhưng KHÔNG chia hết 100 → năm nhuận → 29 ngày
    √ Năm 2023: KHÔNG chia hết cho 4 → không nhuận → 28 ngày
    √ Năm 1600: chia hết cho 400 → năm nhuận → 29 ngày
    √ Năm 2100: chia hết cho 100 nhưng KHÔNG chia hết 400 → 28 ngày
  daysInMonth - Tháng không hợp lệ
    √ Tháng 0 → trả về 0 (không tồn tại)
    √ Tháng 13 → trả về 0 (không tồn tại)
    √ Tháng -1 → trả về 0 (số âm)

 PASS  __tests__/checkDate.test.js
  POST /api/check-date - Ngày hợp lệ
    √ 15/6/2024 là ngày hợp lệ (trường hợp bình thường) (18 ms)
    √ 29/2/2000 hợp lệ - năm 2000 là năm nhuận (chia hết cho 400) (3 ms)
    √ 29/2/2024 hợp lệ - năm 2024 là năm nhuận (chia hết cho 4) (2 ms)
    √ 28/2/1900 hợp lệ - ngày 28 luôn hợp lệ trong tháng 2 (2 ms)
    √ 1/1/1000 - biên dưới của year (giá trị nhỏ nhất hợp lệ) (2 ms)
    √ 31/12/3000 - biên trên của tất cả (giá trị lớn nhất hợp lệ) (2 ms)
    √ 30/4/2024 - ngày cuối cùng của tháng 30 ngày (1 ms)
  POST /api/check-date - Ngày không hợp lệ
    √ 29/2/1900 KHÔNG hợp lệ (2 ms)
    √ 31/4/2024 KHÔNG hợp lệ (2 ms)
    √ 31/6/2024 KHÔNG hợp lệ (2 ms)
    √ 30/2/2024 KHÔNG hợp lệ (2 ms)
    √ 29/2/2023 KHÔNG hợp lệ (1 ms)
  POST /api/check-date - Sai định dạng
    √ Day là chữ "abc" → incorrect format (2 ms)
    √ Month là chữ "xyz" → incorrect format (1 ms)
    √ Year là chữ "abcd" → incorrect format (1 ms)
    √ Day là số thực "1.5" → incorrect format (1 ms)
    √ Month là số thực "6.7" → incorrect format (2 ms)
    √ Day rỗng "" → incorrect format (1 ms)
    √ Month rỗng "" → incorrect format (2 ms)
    √ Year rỗng "" → incorrect format (1 ms)
  POST /api/check-date - Ngoài phạm vi
    √ Day = 0 → out of range (2 ms)
    √ Day = 32 → out of range (1 ms)
    √ Day = -5 → out of range (1 ms)
    √ Month = 0 → out of range (2 ms)
    √ Month = 13 → out of range (1 ms)
    √ Year = 999 → out of range (1 ms)
    √ Year = 3001 → out of range (2 ms)

Test Suites: 2 passed, 2 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        0.752 s
```

---

## Các khái niệm Jest quan trọng

| Khái niệm | Cú pháp | Ý nghĩa |
|------------|---------|----------|
| Nhóm test | `describe('tên', () => { ... })` | Gom các test liên quan |
| Test case | `test('mô tả', () => { ... })` | Một trường hợp kiểm thử |
| Assertion | `expect(actual).toBe(expected)` | So sánh chính xác `===` |
| Chứa text | `expect(str).toContain('text')` | Kiểm tra chuỗi con |
| Async test | `test('...', async () => { await ... })` | Test hàm bất đồng bộ |
| Supertest | `request(app).post(url).send(body)` | Gửi HTTP request giả lập |
