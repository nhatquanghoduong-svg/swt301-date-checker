# 📘 API TESTING - Date Time Checker (Postman)

> Tài liệu hướng dẫn chi tiết về cách test API `POST /api/check-date` bằng **Postman**, bao gồm giải thích code backend, cấu trúc Postman Collection, các test case, và script kiểm tra tự động.

---

## 📑 Mục lục

1. [Tổng quan API](#1-tổng-quan-api)
2. [Giải thích code Backend](#2-giải-thích-code-backend)
3. [Cài đặt & Cấu hình Postman](#3-cài-đặt--cấu-hình-postman)
4. [Cấu trúc Postman Collection](#4-cấu-trúc-postman-collection)
5. [Giải thích Postman Test Script](#5-giải-thích-postman-test-script)
6. [Chi tiết 28 Test Cases](#6-chi-tiết-28-test-cases)
7. [Cách chạy test tự động (Collection Runner)](#7-cách-chạy-test-tự-động-collection-runner)
8. [Bảng tổng hợp Test Cases](#8-bảng-tổng-hợp-test-cases)

---

## 1. Tổng quan API

### Thông tin endpoint

| Thuộc tính       | Giá trị                                          |
| ---------------- | ------------------------------------------------- |
| **URL**          | `POST http://localhost:3001/api/check-date`       |
| **Content-Type** | `application/json`                                |
| **Request Body** | `{ "day": string, "month": string, "year": string }` |
| **Response**     | `{ "success": boolean, "message": string }`       |

### Ví dụ Request/Response

**Request:**
```json
{
    "day": "29",
    "month": "2",
    "year": "2024"
}
```

**Response (hợp lệ):**
```json
{
    "success": true,
    "message": "29/2/2024 is correct date time!"
}
```

**Response (không hợp lệ):**
```json
{
    "success": false,
    "message": "Input data for Day is incorrect format!"
}
```

### Luồng xử lý (Validation Pipeline)

API xử lý theo 3 bước tuần tự — nếu bước nào fail thì dừng lại ngay:

```
Input (day, month, year)
    │
    ▼
[Bước 1] Kiểm tra ĐỊNH DẠNG (Format Check)
    │    → day/month/year có phải số nguyên không?
    │    → Nếu sai → "incorrect format!"
    ▼
[Bước 2] Kiểm tra PHẠM VI (Range Check)
    │    → Day: 1–31, Month: 1–12, Year: 1000–3000
    │    → Nếu ngoài → "out of range!"
    ▼
[Bước 3] Kiểm tra LOGIC (Date Validity)
    │    → Ngày có thực sự tồn tại không? (VD: 30/2 → sai)
    │    → Xử lý năm nhuận cho tháng 2
    ▼
Kết quả: "correct date time!" hoặc "NOT correct date time!"
```

---

## 2. Giải thích code Backend

### 2.1. Cấu trúc file server

Project backend được tách thành 2 file:

**`server.js`** — Chỉ chịu trách nhiệm khởi động server:

```javascript
// server.js - Chỉ chịu trách nhiệm khởi động server
// Logic đã được tách sang app.js để có thể test độc lập
const { app } = require('./app');
const PORT = 3001;

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

> **Tại sao tách thành 2 file?**
> Vì nếu để `app.listen()` chung với logic xử lý, khi chạy test (Jest + Supertest), server sẽ bị khởi động thật → chiếm port → gây conflict. Tách ra để `supertest` có thể import `app` mà không cần `listen()`.

**`app.js`** — Chứa toàn bộ logic xử lý:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());      // Cho phép cross-origin requests (frontend gọi API)
app.use(express.json()); // Parse JSON body từ request
```

### 2.2. Hàm `daysInMonth(year, month)` — Tính số ngày trong tháng

```javascript
function daysInMonth(year, month) {
    // Các tháng có 31 ngày: 1, 3, 5, 7, 8, 10, 12
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;

    // Các tháng có 30 ngày: 4, 6, 9, 11
    if ([4, 6, 9, 11].includes(month)) return 30;

    // Tháng 2 — xử lý năm nhuận
    if (month === 2) {
        if (year % 400 === 0) return 29;  // VD: 2000, 2400 → nhuận
        if (year % 100 === 0) return 28;  // VD: 1900, 2100 → KHÔNG nhuận
        if (year % 4 === 0) return 29;    // VD: 2024, 2028 → nhuận
        return 28;                         // VD: 2023, 2025 → không nhuận
    }

    return 0; // Tháng không hợp lệ (0, 13, -1, ...)
}
```

**Giải thích quy tắc năm nhuận (Leap Year):**

| Điều kiện             | Kết quả       | Ví dụ |
| --------------------- | ------------- | ----- |
| Chia hết cho 400      | ✅ Năm nhuận  | 2000, 2400 |
| Chia hết cho 100 (nhưng không cho 400) | ❌ Không nhuận | 1900, 2100 |
| Chia hết cho 4 (nhưng không cho 100) | ✅ Năm nhuận  | 2024, 2028 |
| Không chia hết cho 4  | ❌ Không nhuận | 2023, 2025 |

> **Lưu ý:** Thứ tự kiểm tra RẤT QUAN TRỌNG! Phải kiểm tra `% 400` trước, rồi `% 100`, cuối cùng mới `% 4`. Nếu đảo thứ tự sẽ cho kết quả sai.

### 2.3. API Endpoint `POST /api/check-date`

```javascript
app.post('/api/check-date', (req, res) => {
    // Lấy dữ liệu từ request body
    const { day, month, year } = req.body;

    // Chuyển đổi sang số
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
```

**Bước 1 — Kiểm tra định dạng (Format Check):**

```javascript
    // Kiểm tra Day: không rỗng, là số, và phải là số NGUYÊN
    if (!day || isNaN(d) || !Number.isInteger(d)) {
        return res.json({
            success: false,
            message: "Input data for Day is incorrect format!"
        });
    }
    // Tương tự cho Month và Year...
```

Giải thích 3 điều kiện:
- `!day` → Kiểm tra rỗng (empty string `""` hoặc `null`/`undefined`)
- `isNaN(d)` → Kiểm tra có phải số không (VD: `"abc"` → `NaN` → true)
- `!Number.isInteger(d)` → Kiểm tra có phải số nguyên không (VD: `1.5` → false)

**Bước 2 — Kiểm tra phạm vi (Range Check):**

```javascript
    // Day phải từ 1 đến 31
    if (d < 1 || d > 31) return res.json({
        success: false,
        message: "Input data for Day is out of range!"
    });

    // Month phải từ 1 đến 12
    if (m < 1 || m > 12) return res.json({
        success: false,
        message: "Input data for Month is out of range!"
    });

    // Year phải từ 1000 đến 3000
    if (y < 1000 || y > 3000) return res.json({
        success: false,
        message: "Input data for Year is out of range!"
    });
```

**Bước 3 — Kiểm tra tính hợp lệ (Date Validation):**

```javascript
    // Kiểm tra ngày có nằm trong số ngày tối đa của tháng không
    if (m >= 1 && m <= 12) {
        if (d >= 1) {
            const maxDays = daysInMonth(y, m); // Gọi hàm tính số ngày
            if (d <= maxDays) {
                return res.json({
                    success: true,
                    message: `${d}/${m}/${y} is correct date time!`
                });
            }
        }
    }

    // Nếu không pass → ngày không hợp lệ
    return res.json({
        success: false,
        message: `${d}/${m}/${y} is NOT correct date time!`
    });
```

### 2.4. Export module

```javascript
// Export app và daysInMonth để có thể test được bằng Jest
module.exports = { app, daysInMonth };
```

---

## 3. Cài đặt & Cấu hình Postman

### Bước 1: Tải và cài đặt Postman
- Truy cập [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
- Tải phiên bản phù hợp với hệ điều hành (Windows/Mac/Linux)
- Cài đặt và đăng nhập (hoặc dùng bản offline)

### Bước 2: Import Postman Collection

1. Mở Postman
2. Click nút **Import** (góc trên bên trái)
3. Chọn tab **File** → **Upload Files**
4. Duyệt đến file:
   ```
   datetime-checker-node/postman/DateTime_Checker_API_Tests.postman_collection.json
   ```
5. Click **Import**
6. Collection **"DateTime Checker API Tests"** sẽ xuất hiện trong sidebar

### Bước 3: Kiểm tra biến (Variable)

Collection sử dụng biến `{{baseUrl}}` để tránh hardcode URL:

```
baseUrl = http://localhost:3001
```

Bạn có thể thay đổi giá trị này trong **Collection Variables** nếu server chạy trên port khác.

### Bước 4: Đảm bảo server đang chạy

```bash
cd datetime-checker-node/server
npm install        # Cài dependencies (chạy lần đầu)
node server.js     # Khởi động server
# → Server running on http://localhost:3001
```

---

## 4. Cấu trúc Postman Collection

Collection được tổ chức thành **6 thư mục (folder)**, mỗi folder chứa các test case theo nhóm:

```
📁 DateTime Checker API Tests
├── 📂 1. Valid Dates                 (4 test cases: TC01–TC04)
│   ├── TC01 - Valid date: 15/6/2000
│   ├── TC02 - Valid date: 1/1/2000 (first day of year)
│   ├── TC03 - Valid date: 31/12/2000 (last day of year)
│   └── TC04 - Valid date: 30/4/2023 (30-day month)
│
├── 📂 2. Invalid Format              (5 test cases: TC05–TC09)
│   ├── TC05 - Day is text: abc
│   ├── TC06 - Month is text: xyz
│   ├── TC07 - Year is text: abc
│   ├── TC08 - Day is decimal: 1.5
│   └── TC09 - Day is empty string
│
├── 📂 3. Out of Range                (7 test cases: TC10–TC16)
│   ├── TC10 - Day = 0 (below min)
│   ├── TC11 - Day = 32 (above max)
│   ├── TC12 - Month = 0 (below min)
│   ├── TC13 - Month = 13 (above max)
│   ├── TC14 - Year = 999 (below min)
│   ├── TC15 - Year = 3001 (above max)
│   └── TC16 - Day = -1 (negative)
│
├── 📂 4. Invalid Dates (Logic)       (4 test cases: TC17–TC20)
│   ├── TC17 - Feb 30 (invalid day for Feb)
│   ├── TC18 - Apr 31 (invalid day for 30-day month)
│   ├── TC19 - Jun 31 (invalid day for 30-day month)
│   └── TC20 - Feb 29 non-leap year (2023)
│
├── 📂 5. Leap Year Tests             (4 test cases: TC21–TC24)
│   ├── TC21 - Feb 29 leap year div by 4 (2024)
│   ├── TC22 - Feb 29 century NOT leap (1900)
│   ├── TC23 - Feb 29 div by 400 IS leap (2000)
│   └── TC24 - Feb 28 non-leap year (2023) - valid
│
└── 📂 6. Boundary Values             (4 test cases: TC25–TC28)
    ├── TC25 - Min valid: 1/1/1000
    ├── TC26 - Max valid: 31/12/3000
    ├── TC27 - Day = 31, Month = 1 (valid 31-day month)
    └── TC28 - Feb 29 century div 400 (2400)
```

---

## 5. Giải thích Postman Test Script

Mỗi request trong Postman có phần **Tests** — đây là đoạn JavaScript chạy tự động SAU KHI nhận được response. Postman dùng thư viện **Chai.js** để viết assertions.

### 5.1. Cấu trúc một Test Script

Mỗi test case có 3 assertions cơ bản:

```javascript
// ═══════════════════════════════════════════════
// ASSERTION 1: Kiểm tra HTTP Status Code
// ═══════════════════════════════════════════════
pm.test('Status code is 200', function () {
    // pm.response.to.have.status(200):
    //   - pm = Postman object (biến toàn cục)
    //   - pm.response = đối tượng HTTP response
    //   - .to.have.status(200) = kỳ vọng status code = 200
    pm.response.to.have.status(200);
});

// ═══════════════════════════════════════════════
// ASSERTION 2: Kiểm tra giá trị field "success"
// ═══════════════════════════════════════════════
pm.test('Response has success=true', function () {
    // pm.response.json() = parse body response thành JSON object
    var jsonData = pm.response.json();

    // pm.expect(A).to.eql(B):
    //   - Kiểm tra A có bằng B không
    //   - eql = deep equality (so sánh giá trị, không phải tham chiếu)
    pm.expect(jsonData.success).to.eql(true);
});

// ═══════════════════════════════════════════════
// ASSERTION 3: Kiểm tra nội dung message
// ═══════════════════════════════════════════════
pm.test('Message contains correct date', function () {
    var jsonData = pm.response.json();

    // .to.include('text'):
    //   - Kiểm tra chuỗi có CHỨA 'text' hay không
    //   - Không cần khớp toàn bộ, chỉ cần chứa substring
    pm.expect(jsonData.message).to.include('is correct date time');
});
```

### 5.2. Các hàm Postman thường dùng

| Hàm / Phương thức                    | Mô tả                                  |
| ------------------------------------- | --------------------------------------- |
| `pm.test('tên test', function() {})` | Định nghĩa một test case                |
| `pm.response.to.have.status(200)`    | Kiểm tra HTTP status code               |
| `pm.response.json()`                 | Parse response body thành JSON           |
| `pm.expect(A).to.eql(B)`            | Kiểm tra A === B (deep equality)        |
| `pm.expect(str).to.include('text')`  | Kiểm tra chuỗi chứa substring          |
| `pm.expect(A).to.be.true`           | Kiểm tra A là true                      |

### 5.3. Ví dụ đầy đủ — TC05 (Day là text "abc")

**Request:**
```
POST http://localhost:3001/api/check-date
Content-Type: application/json

{
    "day": "abc",
    "month": "6",
    "year": "2000"
}
```

**Test Script:**
```javascript
// Test 1: Server phải trả về HTTP 200 (không crash)
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

// Test 2: success phải là false (vì input sai)
pm.test('Response has success=false', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(false);
});

// Test 3: Message phải chứa "Day is incorrect format"
pm.test('Message says Day incorrect format', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include('Day is incorrect format');
});
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Input data for Day is incorrect format!"
}
```

**Kết quả test:** ✅ PASS (3/3 assertions)

---

## 6. Chi tiết 28 Test Cases

### 6.1. Nhóm 1: Valid Dates (Ngày hợp lệ) — TC01 đến TC04

Mục đích: Kiểm tra API trả về `success: true` khi input là ngày hợp lệ.

---

#### TC01 — Ngày hợp lệ bình thường: 15/6/2000

```
POST /api/check-date
Body: { "day": "15", "month": "6", "year": "2000" }
```

**Luồng xử lý trong code:**
1. Format Check: `"15"` → `Number("15")` = 15, `isNaN(15)` = false, `Number.isInteger(15)` = true → ✅ PASS
2. Range Check: 1 ≤ 15 ≤ 31 → ✅ PASS | 1 ≤ 6 ≤ 12 → ✅ PASS | 1000 ≤ 2000 ≤ 3000 → ✅ PASS
3. Logic Check: `daysInMonth(2000, 6)` = 30, 15 ≤ 30 → ✅ PASS

**Expected:** `{ "success": true, "message": "15/6/2000 is correct date time!" }`

---

#### TC02 — Ngày đầu năm: 1/1/2000

```
POST /api/check-date
Body: { "day": "1", "month": "1", "year": "2000" }
```

**Luồng:** `daysInMonth(2000, 1)` = 31, 1 ≤ 31 → ✅

**Expected:** `{ "success": true, "message": "1/1/2000 is correct date time!" }`

---

#### TC03 — Ngày cuối năm: 31/12/2000

```
POST /api/check-date
Body: { "day": "31", "month": "12", "year": "2000" }
```

**Luồng:** `daysInMonth(2000, 12)` = 31, 31 ≤ 31 → ✅

**Expected:** `{ "success": true, "message": "31/12/2000 is correct date time!" }`

---

#### TC04 — Ngày cuối tháng 30 ngày: 30/4/2023

```
POST /api/check-date
Body: { "day": "30", "month": "4", "year": "2023" }
```

**Luồng:** `daysInMonth(2023, 4)` = 30, 30 ≤ 30 → ✅

**Expected:** `{ "success": true, "message": "30/4/2023 is correct date time!" }`

---

### 6.2. Nhóm 2: Invalid Format (Sai định dạng) — TC05 đến TC09

Mục đích: Kiểm tra API trả `"incorrect format!"` khi input không phải số nguyên.

---

#### TC05 — Day là chữ: "abc"

```
POST /api/check-date
Body: { "day": "abc", "month": "6", "year": "2000" }
```

**Luồng:**
1. `Number("abc")` = `NaN`
2. `isNaN(NaN)` = true → ❌ FAIL tại Bước 1 (Format Check)

**Expected:** `{ "success": false, "message": "Input data for Day is incorrect format!" }`

---

#### TC06 — Month là chữ: "xyz"

```
POST /api/check-date
Body: { "day": "15", "month": "xyz", "year": "2000" }
```

**Luồng:** Day pass → Month: `Number("xyz")` = `NaN` → ❌

**Expected:** `{ "success": false, "message": "Input data for Month is incorrect format!" }`

---

#### TC07 — Year là chữ: "abc"

```
POST /api/check-date
Body: { "day": "15", "month": "6", "year": "abc" }
```

**Luồng:** Day pass → Month pass → Year: `Number("abc")` = `NaN` → ❌

**Expected:** `{ "success": false, "message": "Input data for Year is incorrect format!" }`

---

#### TC08 — Day là số thực: "1.5"

```
POST /api/check-date
Body: { "day": "1.5", "month": "6", "year": "2000" }
```

**Luồng:**
1. `Number("1.5")` = 1.5 → `isNaN(1.5)` = false ✅
2. `Number.isInteger(1.5)` = **false** → ❌ FAIL (phải là số nguyên)

**Expected:** `{ "success": false, "message": "Input data for Day is incorrect format!" }`

---

#### TC09 — Day là chuỗi rỗng: ""

```
POST /api/check-date
Body: { "day": "", "month": "6", "year": "2000" }
```

**Luồng:**
1. `!""` = true (empty string là falsy trong JavaScript) → ❌ FAIL ngay

**Expected:** `{ "success": false, "message": "Input data for Day is incorrect format!" }`

---

### 6.3. Nhóm 3: Out of Range (Ngoài phạm vi) — TC10 đến TC16

Mục đích: Kiểm tra API trả `"out of range!"` khi giá trị ngoài khoảng cho phép.

| Trường | Khoảng hợp lệ |
| ------ | -------------- |
| Day    | 1 – 31         |
| Month  | 1 – 12         |
| Year   | 1000 – 3000    |

---

#### TC10 — Day = 0 (dưới biên min)

```
Body: { "day": "0", "month": "6", "year": "2000" }
```
**Luồng:** Format OK → `d < 1` → true → ❌ `"Day is out of range!"`

#### TC11 — Day = 32 (trên biên max)

```
Body: { "day": "32", "month": "6", "year": "2000" }
```
**Luồng:** Format OK → `d > 31` → true → ❌ `"Day is out of range!"`

#### TC12 — Month = 0 (dưới biên min)

```
Body: { "day": "15", "month": "0", "year": "2000" }
```
**Luồng:** Day OK → `m < 1` → true → ❌ `"Month is out of range!"`

#### TC13 — Month = 13 (trên biên max)

```
Body: { "day": "15", "month": "13", "year": "2000" }
```
**Luồng:** Day OK → `m > 12` → true → ❌ `"Month is out of range!"`

#### TC14 — Year = 999 (dưới biên min)

```
Body: { "day": "15", "month": "6", "year": "999" }
```
**Luồng:** Day, Month OK → `y < 1000` → true → ❌ `"Year is out of range!"`

#### TC15 — Year = 3001 (trên biên max)

```
Body: { "day": "15", "month": "6", "year": "3001" }
```
**Luồng:** Day, Month OK → `y > 3000` → true → ❌ `"Year is out of range!"`

#### TC16 — Day = -1 (số âm)

```
Body: { "day": "-1", "month": "6", "year": "2000" }
```
**Luồng:** Format OK (vì -1 là số nguyên) → `d < 1` → true → ❌ `"Day is out of range!"`

---

### 6.4. Nhóm 4: Invalid Dates — Logic (Ngày không tồn tại) — TC17 đến TC20

Mục đích: Input đúng format, đúng range, nhưng ngày đó KHÔNG TỒN TẠI trong lịch.

---

#### TC17 — 30/2/2000 (Tháng 2 không bao giờ có ngày 30)

```
Body: { "day": "30", "month": "2", "year": "2000" }
```
**Luồng:** Format ✅ → Range ✅ → `daysInMonth(2000, 2)` = 29 (năm nhuận), 30 > 29 → ❌

**Expected:** `{ "success": false, "message": "30/2/2000 is NOT correct date time!" }`

---

#### TC18 — 31/4/2023 (Tháng 4 chỉ có 30 ngày)

```
Body: { "day": "31", "month": "4", "year": "2023" }
```
**Luồng:** `daysInMonth(2023, 4)` = 30, 31 > 30 → ❌

**Expected:** `{ "success": false, "message": "31/4/2023 is NOT correct date time!" }`

---

#### TC19 — 31/6/2023 (Tháng 6 chỉ có 30 ngày)

```
Body: { "day": "31", "month": "6", "year": "2023" }
```
**Luồng:** `daysInMonth(2023, 6)` = 30, 31 > 30 → ❌

**Expected:** `{ "success": false, "message": "31/6/2023 is NOT correct date time!" }`

---

#### TC20 — 29/2/2023 (2023 KHÔNG phải năm nhuận)

```
Body: { "day": "29", "month": "2", "year": "2023" }
```
**Luồng:**
- `daysInMonth(2023, 2)`:
  - 2023 % 400 ≠ 0 → tiếp
  - 2023 % 100 ≠ 0 → tiếp
  - 2023 % 4 ≠ 0 → return 28
- 29 > 28 → ❌

**Expected:** `{ "success": false, "message": "29/2/2023 is NOT correct date time!" }`

---

### 6.5. Nhóm 5: Leap Year Tests (Năm nhuận) — TC21 đến TC24

Mục đích: Kiểm tra logic năm nhuận hoạt động đúng với các trường hợp đặc biệt.

---

#### TC21 — 29/2/2024 ✅ (2024 chia hết cho 4 → năm nhuận)

```
Body: { "day": "29", "month": "2", "year": "2024" }
```
**Luồng:**
- `daysInMonth(2024, 2)`:
  - 2024 % 400 ≠ 0 → tiếp
  - 2024 % 100 ≠ 0 → tiếp
  - 2024 % 4 === 0 → return **29** ✅
- 29 ≤ 29 → ✅

**Expected:** `{ "success": true, "message": "29/2/2024 is correct date time!" }`

---

#### TC22 — 29/2/1900 ❌ (1900 chia hết 100 nhưng KHÔNG chia hết 400)

```
Body: { "day": "29", "month": "2", "year": "1900" }
```
**Luồng:**
- `daysInMonth(1900, 2)`:
  - 1900 % 400 = 300 ≠ 0 → tiếp
  - 1900 % 100 === 0 → return **28** ❌
- 29 > 28 → ❌

> **Đây là test case quan trọng!** Nhiều người nghĩ cứ chia hết cho 4 là năm nhuận, nhưng 1900 là ngoại lệ.

**Expected:** `{ "success": false, "message": "29/2/1900 is NOT correct date time!" }`

---

#### TC23 — 29/2/2000 ✅ (2000 chia hết cho 400 → năm nhuận)

```
Body: { "day": "29", "month": "2", "year": "2000" }
```
**Luồng:**
- `daysInMonth(2000, 2)`:
  - 2000 % 400 === 0 → return **29** ✅
- 29 ≤ 29 → ✅

**Expected:** `{ "success": true, "message": "29/2/2000 is correct date time!" }`

---

#### TC24 — 28/2/2023 ✅ (Ngày 28 tháng 2 luôn hợp lệ)

```
Body: { "day": "28", "month": "2", "year": "2023" }
```
**Luồng:** `daysInMonth(2023, 2)` = 28, 28 ≤ 28 → ✅

**Expected:** `{ "success": true, "message": "28/2/2023 is correct date time!" }`

---

### 6.6. Nhóm 6: Boundary Values (Giá trị biên) — TC25 đến TC28

Mục đích: Test các giá trị ở chính xác biên (min/max) của phạm vi cho phép.

---

#### TC25 — 1/1/1000 (Giá trị nhỏ nhất hợp lệ)

```
Body: { "day": "1", "month": "1", "year": "1000" }
```
**Luồng:** day=1 (min), month=1 (min), year=1000 (min) → tất cả đều là biên dưới → ✅

---

#### TC26 — 31/12/3000 (Giá trị lớn nhất hợp lệ)

```
Body: { "day": "31", "month": "12", "year": "3000" }
```
**Luồng:** day=31 (max), month=12 (max), year=3000 (max) → tất cả đều là biên trên → ✅

---

#### TC27 — 31/1/2023 (Ngày 31 của tháng 31-ngày)

```
Body: { "day": "31", "month": "1", "year": "2023" }
```
**Luồng:** `daysInMonth(2023, 1)` = 31, 31 ≤ 31 → ✅

---

#### TC28 — 29/2/2400 (Năm 2400 chia hết cho 400 → nhuận)

```
Body: { "day": "29", "month": "2", "year": "2400" }
```
**Luồng:** `daysInMonth(2400, 2)`: 2400 % 400 === 0 → return 29 → ✅

---

## 7. Cách chạy test tự động (Collection Runner)

### 7.1. Chạy từng request đơn lẻ

1. Mở collection → Chọn 1 request (VD: TC01)
2. Click nút **Send** (xanh dương)
3. Xem response ở panel dưới
4. Click tab **Test Results** → Xem kết quả 3 assertions

### 7.2. Chạy toàn bộ Collection (Batch Run)

1. Click chuột phải vào collection **"DateTime Checker API Tests"**
2. Chọn **"Run collection"** (hoặc nhấn nút ▶)
3. Trong **Collection Runner**:
   - ✅ Chọn tất cả 28 requests
   - Iterations: `1` (số lần lặp)
   - Delay: `0 ms` (không cần delay giữa các request)
4. Click **"Run DateTime Checker API Tests"**
5. Xem kết quả:
   - ✅ Xanh = PASS
   - ❌ Đỏ = FAIL
   - Tổng kết: `84/84 assertions passed` (28 TC × 3 assertions mỗi TC)

### 7.3. Đọc kết quả

Sau khi chạy xong, Postman sẽ hiển thị:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RESULTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Requests:  28
  Total Tests:     84  (3 assertions × 28 requests)
  Passed:          84  ✅
  Failed:          0   
  Skipped:         0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 8. Bảng tổng hợp Test Cases

| TC   | Nhóm             | Input (day/month/year) | Expected success | Expected message (substring)         |
| ---- | ---------------- | ---------------------- | --------------- | ------------------------------------ |
| TC01 | Valid Dates      | 15 / 6 / 2000          | `true`          | `is correct date time`               |
| TC02 | Valid Dates      | 1 / 1 / 2000           | `true`          | `is correct date time`               |
| TC03 | Valid Dates      | 31 / 12 / 2000         | `true`          | `is correct date time`               |
| TC04 | Valid Dates      | 30 / 4 / 2023          | `true`          | `is correct date time`               |
| TC05 | Invalid Format   | abc / 6 / 2000         | `false`         | `Day is incorrect format`            |
| TC06 | Invalid Format   | 15 / xyz / 2000        | `false`         | `Month is incorrect format`          |
| TC07 | Invalid Format   | 15 / 6 / abc           | `false`         | `Year is incorrect format`           |
| TC08 | Invalid Format   | 1.5 / 6 / 2000         | `false`         | `Day is incorrect format`            |
| TC09 | Invalid Format   | "" / 6 / 2000          | `false`         | `Day is incorrect format`            |
| TC10 | Out of Range     | 0 / 6 / 2000           | `false`         | `Day is out of range`                |
| TC11 | Out of Range     | 32 / 6 / 2000          | `false`         | `Day is out of range`                |
| TC12 | Out of Range     | 15 / 0 / 2000          | `false`         | `Month is out of range`              |
| TC13 | Out of Range     | 15 / 13 / 2000         | `false`         | `Month is out of range`              |
| TC14 | Out of Range     | 15 / 6 / 999           | `false`         | `Year is out of range`               |
| TC15 | Out of Range     | 15 / 6 / 3001          | `false`         | `Year is out of range`               |
| TC16 | Out of Range     | -1 / 6 / 2000          | `false`         | `Day is out of range`                |
| TC17 | Invalid Dates    | 30 / 2 / 2000          | `false`         | `is NOT correct date time`           |
| TC18 | Invalid Dates    | 31 / 4 / 2023          | `false`         | `is NOT correct date time`           |
| TC19 | Invalid Dates    | 31 / 6 / 2023          | `false`         | `is NOT correct date time`           |
| TC20 | Invalid Dates    | 29 / 2 / 2023          | `false`         | `is NOT correct date time`           |
| TC21 | Leap Year        | 29 / 2 / 2024          | `true`          | `is correct date time`               |
| TC22 | Leap Year        | 29 / 2 / 1900          | `false`         | `is NOT correct date time`           |
| TC23 | Leap Year        | 29 / 2 / 2000          | `true`          | `is correct date time`               |
| TC24 | Leap Year        | 28 / 2 / 2023          | `true`          | `is correct date time`               |
| TC25 | Boundary Values  | 1 / 1 / 1000           | `true`          | `is correct date time`               |
| TC26 | Boundary Values  | 31 / 12 / 3000         | `true`          | `is correct date time`               |
| TC27 | Boundary Values  | 31 / 1 / 2023          | `true`          | `is correct date time`               |
| TC28 | Boundary Values  | 29 / 2 / 2400          | `true`          | `is correct date time`               |

---

> **File Postman Collection:** `postman/DateTime_Checker_API_Tests.postman_collection.json`  
> **Tổng cộng:** 28 test cases | 84 assertions | 6 nhóm test
