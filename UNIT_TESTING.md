# 🧪 Unit Testing với Jest — DateTime Checker Server

> **Ngày thực hiện:** 01-Jul-2026  
> **Framework:** Jest + Supertest  
> **Tổng test cases:** 37 (34 PASS ✅ / 3 FAIL ❌)

---

## 📋 Mục Lục

1. [Tổng quan những gì đã làm](#1-tổng-quan-những-gì-đã-làm)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Các bước đã thực hiện](#3-các-bước-đã-thực-hiện)
4. [Giải thích file `app.js`](#4-giải-thích-file-appjs)
5. [Giải thích file `daysInMonth.test.js`](#5-giải-thích-file-daysinmonthtestjs)
6. [Giải thích file `checkDate.test.js`](#6-giải-thích-file-checkdatetestjs)
7. [Bảng tổng hợp toàn bộ Test Cases](#7-bảng-tổng-hợp-toàn-bộ-test-cases)
8. [Cách chạy test](#8-cách-chạy-test)
9. [Kết quả test](#9-kết-quả-test)
10. [Defects phát hiện](#10-defects-phát-hiện)

---

## 1. Tổng quan những gì đã làm

| Hạng mục | Chi tiết |
|----------|----------|
| Cài đặt dependencies | `jest`, `supertest`, `express`, `cors` (devDependencies) |
| File test 1 | `tests/daysInMonth.test.js` — 15 test cases (map với Lab 2 DayInMonth sheet) |
| File test 2 | `tests/checkDate.test.js` — 22 test cases (map với Lab 2 CheckDate sheet + extra) |
| Cập nhật | `package.json` — thêm script `"test": "jest --verbose"` |
| Kết quả | **34 PASS / 3 FAIL** — 3 tests fail do 2 bugs trong `app.js` (DFI-001, DFI-002) |

---

## 2. Cấu trúc thư mục

```
lab3/
├── tests/                          ← THƯ MỤC TEST
│   ├── daysInMonth.test.js         ← Unit test hàm daysInMonth()
│   └── checkDate.test.js           ← Integration test API endpoint
├── app.js                          ← Logic Express app (export cho test)
├── package.json                    ← Cấu hình Jest
└── UNIT_TESTING.md                 ← File này
```

---

## 3. Các bước đã thực hiện

### Bước 1: Cài đặt Jest và Supertest

```bash
npm install --save-dev jest supertest
npm install express cors
```

| Package | Vai trò |
|---------|---------|
| `jest` | Framework testing chính, cung cấp `describe`, `test`, `expect` |
| `supertest` | Gửi HTTP request giả lập đến Express app mà KHÔNG cần khởi động server thật |
| `express` | Web framework cho API |
| `cors` | Middleware cho phép cross-origin requests |

### Bước 2: Cấu hình `package.json`

```json
{
  "scripts": {
    "test": "jest --verbose",
    "test:unit": "jest tests/daysInMonth.test.js --verbose",
    "test:integration": "jest tests/checkDate.test.js --verbose"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

- `--verbose`: Hiển thị chi tiết tên từng test case khi chạy
- `testMatch`: Jest chỉ tìm test files trong thư mục `tests/`

### Bước 3: Cấu trúc `app.js`

File `app.js` vừa chứa logic vừa export `app` và `daysInMonth` để test file có thể import:

- `daysInMonth.test.js` import hàm `daysInMonth` để test trực tiếp (unit test)
- `checkDate.test.js` import `app` để dùng với `supertest` (integration test)

### Bước 4: Viết test cases theo Lab 2

- `tests/daysInMonth.test.js` — 15 UTCID từ Lab 2 DayInMonth sheet
- `tests/checkDate.test.js` — 15 UTCID từ Lab 2 CheckDate sheet + 7 extra cases

---

## 4. Giải thích file `app.js`

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Hàm tính số ngày trong tháng theo Flowchart (Figure 3)
function daysInMonth(year, month) {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
    if ([4, 6, 9, 11].includes(month)) return 30;
    if (month === 2) {
        if (year % 400 === 0) return 29;   // 2000, 2400 → nhuận
        if (year % 4   === 0) return 29;   // ⚠️ BUG DFI-001: year%4 kiểm tra trước year%100
        if (year % 100 === 0) return 28;   // ⚠️ Dòng này không bao giờ được chạy với năm chia hết 100
        return 28;
    }
    return 0; // tháng không hợp lệ
}

app.post('/api/check-date', (req, res) => {
    const { day, month, year } = req.body;
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);

    // 1. Kiểm tra định dạng
    if (!day || isNaN(d) || !Number.isInteger(d))
        return res.json({ success: false, message: "Input data for Day is incorrect format!" });
    if (!month || isNaN(m) || !Number.isInteger(m))
        return res.json({ success: false, message: "Input data for Month is incorrect format!" });
    if (!year || isNaN(y) || !Number.isInteger(y))
        return res.json({ success: false, message: "Input data for Year is incorrect format!" });

    // 2. Kiểm tra phạm vi
    if (d < 1 || d > 31)
        return res.json({ success: false, message: "Input data for Day is out of range!" });
    if (m < 1 || m >= 12)   // ⚠️ BUG DFI-002: >= 12 thay vì > 12, tháng 12 bị reject
        return res.json({ success: false, message: "Input data for Month is out of range!" });
    if (y < 1000 || y > 3000)
        return res.json({ success: false, message: "Input data for Year is out of range!" });

    // 3. Kiểm tra tính hợp lệ của ngày
    const maxDays = daysInMonth(y, m);
    if (d >= 1 && d <= maxDays)
        return res.json({ success: true, message: `${d}/${m}/${y} is correct date time!` });

    return res.json({ success: false, message: `${d}/${m}/${y} is NOT correct date time!` });
});

// ★ Export để test file có thể import
module.exports = { app, daysInMonth };
```

> ⚠️ **Lưu ý:** File hiện tại có 2 bugs đã biết (DFI-001, DFI-002) — xem phần [Defects phát hiện](#10-defects-phát-hiện).

---

## 5. Giải thích file `daysInMonth.test.js`

### Cấu trúc cơ bản:

```javascript
const { daysInMonth } = require('../app');  // Import hàm cần test

describe('Tên nhóm test', () => {           // Nhóm các test liên quan
    test('Mô tả test case', () => {         // Một test case cụ thể
        expect(daysInMonth(2021, 1))        // Gọi hàm với input
            .toBe(31);                      // Kiểm tra output = giá trị kỳ vọng
    });
});
```

### Giải thích các khái niệm:

| Khái niệm | Ý nghĩa |
|------------|----------|
| `describe(name, fn)` | Nhóm các test case liên quan. Giúp tổ chức và đọc kết quả dễ hơn |
| `test(name, fn)` | Định nghĩa MỘT test case. Tên mang prefix `[UTCID-Type]` để map với Lab 2 |
| `expect(value)` | Tạo một "assertion" — khai báo giá trị thực tế |
| `.toBe(expected)` | So sánh chính xác (`===`) với giá trị kỳ vọng |

### 4 nhóm test (15 UTCID từ Lab 2):

**Nhóm 1 — Tháng 31 ngày** (UTCID01–04):
```javascript
test('[UTCID01-N] Tháng 1 (January) → 31 ngày', () => {
    expect(daysInMonth(2021, 1)).toBe(31);  // ✅ PASS
});
test('[UTCID04-B] Tháng 12 (December) → 31 ngày [Boundary]', () => {
    expect(daysInMonth(2021, 12)).toBe(31); // ✅ PASS
});
```

**Nhóm 2 — Tháng 30 ngày** (UTCID05–08):
```javascript
test('[UTCID05-N] Tháng 4 (April) → 30 ngày', () => {
    expect(daysInMonth(2021, 4)).toBe(30);  // ✅ PASS
});
```

**Nhóm 3 — Tháng 2 / Năm nhuận** (UTCID09–12):
```javascript
test('[UTCID09-B] Tháng 2 / năm 2000 (chia hết 400) → 29 ngày', () => {
    expect(daysInMonth(2000, 2)).toBe(29);  // ✅ PASS
});
test('[UTCID10-B] Tháng 2 / năm 1900 (chia hết 100, không chia hết 400) → 28 ngày', () => {
    expect(daysInMonth(1900, 2)).toBe(28);  // ❌ FAIL — nhận 29 (do bug DFI-001)
});
```

**Nhóm 4 — Tháng không hợp lệ** (UTCID13–15):
```javascript
test('[UTCID13-A] Tháng 0 (dưới phạm vi) → trả về 0', () => {
    expect(daysInMonth(2021, 0)).toBe(0);   // ✅ PASS
});
```

---

## 6. Giải thích file `checkDate.test.js`

### Cách `supertest` hoạt động:

```javascript
const request = require('supertest');
const { app } = require('../app');

test('Test API', async () => {
    const res = await request(app)               // Tạo request đến Express app
        .post('/api/check-date')                 // HTTP method + URL
        .send({ day: '15', month: '6', year: '2021' }); // Request body (JSON)

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('correct date time');
});
```

> **Lưu ý:** Các test API dùng `async/await` vì `supertest` gửi request bất đồng bộ.

### 6 nhóm test (15 UTCID + 7 extra):

**Nhóm 1 — Ngày hợp lệ - Normal** (UTCID01–05):
```
UTCID01: 15/6/2021  → success=true  ✅ PASS
UTCID02: 31/1/2021  → success=true  ✅ PASS
UTCID03: 30/11/2021 → success=true  ✅ PASS
UTCID04: 28/2/2021  → success=true  ✅ PASS
UTCID05: 29/2/2020  → success=true  ✅ PASS
```

**Nhóm 2 — Ngày hợp lệ - Boundary** (UTCID06–08):
```
UTCID06: 1/1/2021   → success=true  ✅ PASS  (biên dưới Day=1, Month=1)
UTCID07: 31/12/2021 → success=true  ❌ FAIL  (nhận false do bug DFI-002, Month=12 bị reject)
UTCID08: 29/2/2000  → success=true  ✅ PASS  (năm 2000 chia hết 400)
```

**Nhóm 3 — Ngày không hợp lệ - Boundary** (UTCID09, UTCID11):
```
UTCID09: 29/2/1900  → success=false ❌ FAIL  (nhận true do bug DFI-001, 1900 bị coi là nhuận)
UTCID11: 29/2/2021  → success=false ✅ PASS
```

**Nhóm 4 — Day vượt DaysInMonth - Abnormal** (UTCID10):
```
UTCID10: 31/4/2021  → success=false ✅ PASS
```

**Nhóm 5 — Day/Month ngoài phạm vi - Abnormal** (UTCID12–15):
```
UTCID12: Day=0      → "Day is out of range!"    ✅ PASS
UTCID13: Day=32     → "Day is out of range!"    ✅ PASS
UTCID14: Month=0    → "Month is out of range!"  ✅ PASS
UTCID15: Month=13   → "Month is out of range!"  ✅ PASS
```

**Nhóm 6 — Sai định dạng + Year range** (7 Extra):
```
Day="abc"   → "Day is incorrect format!"    ✅ PASS
Day="1.5"   → "Day is incorrect format!"    ✅ PASS
Day=""      → "Day is incorrect format!"    ✅ PASS
Month="xyz" → "Month is incorrect format!"  ✅ PASS
Year="abcd" → "Year is incorrect format!"   ✅ PASS
Year=999    → "Year is out of range!"       ✅ PASS
Year=3001   → "Year is out of range!"       ✅ PASS
```

---

## 7. Bảng tổng hợp toàn bộ Test Cases

### File: `tests/daysInMonth.test.js` (15 tests)

| UTCID | Nhóm | Input (year, month) | Expected | Kết quả |
|-------|------|---------------------|----------|---------|
| UTCID01-N | 31 ngày | (2021, 1) | 31 | ✅ PASS |
| UTCID02-N | 31 ngày | (2021, 3) | 31 | ✅ PASS |
| UTCID03-N | 31 ngày | (2021, 7) | 31 | ✅ PASS |
| UTCID04-B | 31 ngày | (2021, 12) | 31 | ✅ PASS |
| UTCID05-N | 30 ngày | (2021, 4) | 30 | ✅ PASS |
| UTCID06-N | 30 ngày | (2021, 6) | 30 | ✅ PASS |
| UTCID07-N | 30 ngày | (2021, 9) | 30 | ✅ PASS |
| UTCID08-N | 30 ngày | (2021, 11) | 30 | ✅ PASS |
| UTCID09-B | Năm nhuận | (2000, 2) | 29 | ✅ PASS |
| UTCID10-B | Năm nhuận | (1900, 2) | 28 | ❌ **FAIL** — nhận 29 (DFI-001) |
| UTCID11-N | Năm nhuận | (2020, 2) | 29 | ✅ PASS |
| UTCID12-N | Năm nhuận | (2021, 2) | 28 | ✅ PASS |
| UTCID13-A | Không hợp lệ | (2021, 0) | 0 | ✅ PASS |
| UTCID14-A | Không hợp lệ | (2021, 13) | 0 | ✅ PASS |
| UTCID15-A | Không hợp lệ | (2021, -1) | 0 | ✅ PASS |

### File: `tests/checkDate.test.js` (22 tests)

| UTCID | Nhóm | Input (d/m/y) | Expected | Kết quả |
|-------|------|---------------|----------|---------|
| UTCID01-N | Hợp lệ | 15/6/2021 | success=true | ✅ PASS |
| UTCID02-N | Hợp lệ | 31/1/2021 | success=true | ✅ PASS |
| UTCID03-N | Hợp lệ | 30/11/2021 | success=true | ✅ PASS |
| UTCID04-N | Hợp lệ | 28/2/2021 | success=true | ✅ PASS |
| UTCID05-N | Hợp lệ | 29/2/2020 | success=true | ✅ PASS |
| UTCID06-B | Boundary | 1/1/2021 | success=true | ✅ PASS |
| UTCID07-B | Boundary | 31/12/2021 | success=true | ❌ **FAIL** — nhận false (DFI-002) |
| UTCID08-B | Boundary | 29/2/2000 | success=true | ✅ PASS |
| UTCID09-B | Boundary | 29/2/1900 | success=false | ❌ **FAIL** — nhận true (DFI-001) |
| UTCID10-A | Abnormal | 31/4/2021 | success=false | ✅ PASS |
| UTCID11-B | Boundary | 29/2/2021 | success=false | ✅ PASS |
| UTCID12-A | Abnormal | Day=0 | "Day is out of range!" | ✅ PASS |
| UTCID13-A | Abnormal | Day=32 | "Day is out of range!" | ✅ PASS |
| UTCID14-A | Abnormal | Month=0 | "Month is out of range!" | ✅ PASS |
| UTCID15-A | Abnormal | Month=13 | "Month is out of range!" | ✅ PASS |
| Extra | Sai format | Day="abc" | "Day is incorrect format!" | ✅ PASS |
| Extra | Sai format | Day="1.5" | "Day is incorrect format!" | ✅ PASS |
| Extra | Sai format | Day="" | "Day is incorrect format!" | ✅ PASS |
| Extra | Sai format | Month="xyz" | "Month is incorrect format!" | ✅ PASS |
| Extra | Sai format | Year="abcd" | "Year is incorrect format!" | ✅ PASS |
| Extra | Out of range | Year=999 | "Year is out of range!" | ✅ PASS |
| Extra | Out of range | Year=3001 | "Year is out of range!" | ✅ PASS |

---

## 8. Cách chạy test

### Chạy tất cả test:
```bash
npm test
# hoặc
npx jest --verbose
```

### Chạy từng file riêng:
```bash
npx jest tests/daysInMonth.test.js --verbose
npx jest tests/checkDate.test.js --verbose
```

### Xem độ bao phủ code (Code Coverage):
```bash
npx jest --coverage
```

### Chạy lại tự động khi code thay đổi:
```bash
npx jest --watch
```

---

## 9. Kết quả test

```
FAIL tests/daysInMonth.test.js
  daysInMonth - Tháng có 31 ngày
    ✓ [UTCID01-N] Tháng 1 (January) → 31 ngày (2 ms)
    ✓ [UTCID02-N] Tháng 3 (March) → 31 ngày (2 ms)
    ✓ [UTCID03-N] Tháng 7 (July) → 31 ngày (1 ms)
    ✓ [UTCID04-B] Tháng 12 (December) → 31 ngày [Boundary: tháng 31-ngày cuối] (5 ms)
  daysInMonth - Tháng có 30 ngày
    ✓ [UTCID05-N] Tháng 4 (April) → 30 ngày
    ✓ [UTCID06-N] Tháng 6 (June) → 30 ngày (1 ms)
    ✓ [UTCID07-N] Tháng 9 (September) → 30 ngày (1 ms)
    ✓ [UTCID08-N] Tháng 11 (November) → 30 ngày (1 ms)
  daysInMonth - Tháng 2 (năm nhuận)
    ✓ [UTCID09-B] Tháng 2 / năm 2000 (chia hết 400) → năm nhuận → 29 ngày
    ✕ [UTCID10-B] Tháng 2 / năm 1900 (chia hết 100, không chia hết 400) → không nhuận → 28 ngày (1 ms)
    ✓ [UTCID11-N] Tháng 2 / năm 2020 (chia hết 4, không chia hết 100) → năm nhuận → 29 ngày (2 ms)
    ✓ [UTCID12-N] Tháng 2 / năm 2021 (không chia hết 4) → không nhuận → 28 ngày
  daysInMonth - Tháng không hợp lệ
    ✓ [UTCID13-A] Tháng 0 (dưới phạm vi) → trả về 0
    ✓ [UTCID14-A] Tháng 13 (trên phạm vi) → trả về 0 (1 ms)
    ✓ [UTCID15-A] Tháng -1 (số âm) → trả về 0 (2 ms)

  ● daysInMonth - Tháng 2 (năm nhuận) › [UTCID10-B]
    Expected: 28
    Received: 29
    → Bug DFI-001: year%4 được kiểm tra trước year%100

FAIL tests/checkDate.test.js
  POST /api/check-date - Ngày hợp lệ (Normal)
    ✓ [UTCID01-N] 15/6/2021 - ngày bình thường hợp lệ (93 ms)
    ✓ [UTCID02-N] 31/1/2021 - ngày cuối tháng 31 ngày (7 ms)
    ✓ [UTCID03-N] 30/11/2021 - ngày cuối tháng 30 ngày (5 ms)
    ✓ [UTCID04-N] 28/2/2021 - ngày 28 tháng 2 năm không nhuận (4 ms)
    ✓ [UTCID05-N] 29/2/2020 - ngày 29 tháng 2 năm nhuận (chia hết 4) (6 ms)
  POST /api/check-date - Ngày hợp lệ (Boundary)
    ✓ [UTCID06-B] 1/1/2021 - biên dưới của Day=1 và Month=1 (5 ms)
    ✕ [UTCID07-B] 31/12/2021 - biên trên của Day=31 và Month=12 (5 ms)
    ✓ [UTCID08-B] 29/2/2000 - năm 2000 chia hết 400 → năm nhuận (4 ms)
  POST /api/check-date - Ngày không hợp lệ (Boundary)
    ✕ [UTCID09-B] 29/2/1900 - năm 1900 chia hết 100 nhưng không chia hết 400 → không nhuận (9 ms)
    ✓ [UTCID11-B] 29/2/2021 - năm 2021 không chia hết 4 → không nhuận (4 ms)
  POST /api/check-date - Day vượt quá số ngày trong tháng (Abnormal)
    ✓ [UTCID10-A] 31/4/2021 - tháng 4 chỉ có 30 ngày (3 ms)
  POST /api/check-date - Day ngoài phạm vi (Abnormal)
    ✓ [UTCID12-A] Day=0 - dưới biên min=1 → out of range (3 ms)
    ✓ [UTCID13-A] Day=32 - trên biên max=31 → out of range (4 ms)
  POST /api/check-date - Month ngoài phạm vi (Abnormal)
    ✓ [UTCID14-A] Month=0 - dưới biên min=1 → out of range (3 ms)
    ✓ [UTCID15-A] Month=13 - trên biên max=12 → out of range (6 ms)
  POST /api/check-date - Sai định dạng input (Abnormal)
    ✓ [Extra] Day là chữ "abc" → incorrect format (5 ms)
    ✓ [Extra] Day là số thực "1.5" → incorrect format (5 ms)
    ✓ [Extra] Day rỗng "" → incorrect format (4 ms)
    ✓ [Extra] Month là chữ "xyz" → incorrect format (3 ms)
    ✓ [Extra] Year là chữ "abcd" → incorrect format (3 ms)
    ✓ [Extra] Year ngoài phạm vi 999 → out of range (2 ms)
    ✓ [Extra] Year ngoài phạm vi 3001 → out of range (4 ms)

  ● POST /api/check-date - Ngày hợp lệ (Boundary) › [UTCID07-B]
    Expected: true
    Received: false
    → Bug DFI-002: điều kiện (m >= 12) reject Month=12

  ● POST /api/check-date - Ngày không hợp lệ (Boundary) › [UTCID09-B]
    Expected: false
    Received: true
    → Bug DFI-001: 1900 được coi là năm nhuận (sai)

Test Suites: 2 failed, 2 total
Tests:       3 failed, 34 passed, 37 total
Snapshots:   0 total
Time:        0.581 s
```

---

## 10. Defects phát hiện

### DFI-001 — Sai thứ tự kiểm tra năm nhuận

| | Chi tiết |
|-|----------|
| **ID** | DFI-001 |
| **Severity** | Fatal |
| **Test fail** | UTCID10 (daysInMonth), UTCID09 (checkDate) |
| **Root cause** | Trong `daysInMonth()`, điều kiện `year % 4 === 0` được kiểm tra trước `year % 100 === 0`. Năm 1900 chia hết cho 4 nên bị bắt nhầm ở nhánh `year%4`, trả về 29 thay vì 28. |

```javascript
// ❌ Code SAI (hiện tại):
if (year % 400 === 0) return 29;
if (year % 4   === 0) return 29;   // 1900 bị bắt ở đây → sai!
if (year % 100 === 0) return 28;   // Không bao giờ chạy với năm chia hết 100

// ✅ Code ĐÚNG (cần sửa):
if (year % 400 === 0) return 29;
if (year % 100 === 0) return 28;   // Phải kiểm tra trước year%4
if (year % 4   === 0) return 29;
return 28;
```

### DFI-002 — Điều kiện range Month sai

| | Chi tiết |
|-|----------|
| **ID** | DFI-002 |
| **Severity** | Serious |
| **Test fail** | UTCID07 (checkDate) |
| **Root cause** | Điều kiện out-of-range dùng `m >= 12` thay vì `m > 12`, khiến Month=12 (December) bị reject nhầm. |

```javascript
// ❌ Code SAI (hiện tại):
if (m < 1 || m >= 12) ...   // Month=12 bị reject → sai!

// ✅ Code ĐÚNG (cần sửa):
if (m < 1 || m > 12) ...    // Month=12 hợp lệ, chỉ reject khi > 12
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