# 🚀 Hướng dẫn Performance Testing với k6
> Tài liệu ghi lại toàn bộ quá trình thực hiện performance testing cho ứng dụng **Date Time Checker** (Express.js backend + React frontend)

---

## 📋 Mục lục

1. [Tổng quan ứng dụng](#1-tổng-quan-ứng-dụng)
2. [Performance Testing là gì?](#2-performance-testing-là-gì)
3. [k6 là gì?](#3-k6-là-gì)
4. [Cài đặt k6 trên Windows](#4-cài-đặt-k6-trên-windows)
5. [Cấu trúc project](#5-cấu-trúc-project)
6. [Giải thích chi tiết Backend (server.js)](#6-giải-thích-chi-tiết-backend-serverjs)
7. [Giải thích chi tiết Frontend (App.jsx)](#7-giải-thích-chi-tiết-frontend-appjsx)
8. [Các loại Performance Test](#8-các-loại-performance-test)
9. [Giải thích chi tiết từng file test k6](#9-giải-thích-chi-tiết-từng-file-test-k6)
10. [Cách chạy test](#10-cách-chạy-test)
11. [Đọc và phân tích kết quả](#11-đọc-và-phân-tích-kết-quả)
12. [Kết quả thực tế](#12-kết-quả-thực-tế)
13. [Tổng kết và bài học](#13-tổng-kết-và-bài-học)

---

## 1. Tổng quan ứng dụng

Ứng dụng **Date Time Checker** gồm 2 phần:

| Phần | Công nghệ | Cổng |
|------|-----------|------|
| Backend (API) | Node.js + Express | `localhost:3001` |
| Frontend (UI) | React | `localhost:5173` |

**Chức năng:** Người dùng nhập ngày/tháng/năm, hệ thống kiểm tra xem đó có phải là ngày hợp lệ không và trả về kết quả.

**Ví dụ:**
- `29/2/2024` → Hợp lệ (2024 là năm nhuận)
- `29/2/2023` → Không hợp lệ (2023 không phải năm nhuận)
- `31/4/2024` → Không hợp lệ (tháng 4 chỉ có 30 ngày)

---

## 2. Performance Testing là gì?

**Performance Testing** là loại kiểm thử đánh giá xem hệ thống hoạt động như thế nào dưới các điều kiện tải khác nhau. Mục tiêu là trả lời các câu hỏi:

- Hệ thống có phản hồi đủ nhanh không?
- Hệ thống chịu được bao nhiêu người dùng đồng thời?
- Hệ thống có bị sập khi tải đột ngột tăng cao không?
- Sau khi quá tải, hệ thống có tự phục hồi được không?

### Các loại Performance Test phổ biến:

```
Số lượng Users
     |
 200 |                    ___________
     |                   /           \         Stress Test
     |                  /             \
 100 |         ________/               \
     |        /                         \      Load Test
  10 |_______/                           \____
   5 |----                                ----  Spike Test (đột biến)
   1 |*                                        Smoke Test
     |_____________________________________________> Thời gian
```

| Loại test | Mục đích | VUs |
|-----------|----------|-----|
| **Smoke Test** | Xác nhận hệ thống hoạt động cơ bản | 1 |
| **Load Test** | Kiểm tra tải bình thường | 10–50 |
| **Stress Test** | Tìm giới hạn chịu đựng | 50–200+ |
| **Spike Test** | Kiểm tra đột biến tải | 5 → 200 đột ngột |

---

## 3. k6 là gì?

**k6** là công cụ performance testing mã nguồn mở do Grafana Labs phát triển. Điểm đặc biệt:

- Viết script bằng **JavaScript** (quen thuộc với dev web)
- Chạy bằng **Go** (hiệu năng cao, nhẹ)
- **Không dùng trình duyệt** — chỉ gửi HTTP request thuần túy
- Metrics rõ ràng, dễ đọc
- Hỗ trợ tích hợp với Grafana, InfluxDB để visualize

### Khái niệm cốt lõi của k6:

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **VU (Virtual User)** | Người dùng ảo — mỗi VU chạy function `default` độc lập, liên tục |
| **Iteration** | Mỗi lần VU chạy hết function `default` là 1 iteration |
| **Stage** | Giai đoạn thay đổi số lượng VUs theo thời gian |
| **Threshold** | Điều kiện pass/fail của test (ví dụ: p95 < 500ms) |
| **Check** | Assertion — kiểm tra điều kiện trong từng request |
| **Metric** | Số liệu đo lường (response time, error rate, ...) |

---

## 4. Cài đặt k6 trên Windows

### Cách cài (dùng winget):
```powershell
winget install k6 --source winget
```

### Kiểm tra cài đặt:
```powershell
k6 version
# Output: k6.exe v2.0.0 (commit/8c3be52cc1, go1.26.3, windows/amd64)
```

### Xử lý lỗi "k6 not recognized" trong PowerShell/VSCode:

**Nguyên nhân:** k6 được cài vào `C:\Program Files\k6\` nhưng chưa được thêm vào biến môi trường PATH.

**Cách fix — chạy PowerShell với quyền Admin:**
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\k6", "Machine")
```

Sau đó **đóng và mở lại VSCode hoàn toàn** để nhận PATH mới.

> **Lý do phải restart VSCode:** VSCode đọc biến môi trường PATH lúc khởi động. Terminal bên trong VSCode kế thừa PATH từ lúc VSCode mở, nên nếu không restart, terminal sẽ vẫn dùng PATH cũ và không nhận k6.

---

## 5. Cấu trúc project

```
datetime-checker-node/
├── client/                    # React frontend
│   └── src/
│       └── App.jsx
├── server/                    # Express backend
│   ├── server.js
│   ├── package.json
│   └── k6-test/               # Thư mục chứa các file test k6
│       ├── smoke-test.js
│       ├── load-test.js
│       ├── stress-test.js
│       └── spike-test.js
```

---

## 6. Giải thích chi tiết Backend (server.js)

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
```

**Giải thích:**
- `express()`: Tạo ứng dụng Express
- `cors()`: Cho phép frontend (localhost:5173) gọi API sang backend (localhost:3001) — nếu không có CORS, trình duyệt sẽ block request
- `express.json()`: Middleware parse body của request từ JSON string thành JavaScript object

---

### Hàm `daysInMonth(year, month)`

```javascript
function daysInMonth(year, month) {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
    if ([4, 6, 9, 11].includes(month)) return 30;
    if (month === 2) {
        if (year % 400 === 0) return 29;
        if (year % 100 === 0) return 28;
        if (year % 4 === 0) return 29;
        return 28;
    }
    return 0;
}
```

**Flowchart logic:**

```
daysInMonth(year, month)
        |
        v
  Tháng 1,3,5,7,8,10,12? ──YES──> return 31
        |
        NO
        v
  Tháng 4,6,9,11? ──────────YES──> return 30
        |
        NO
        v
  Tháng 2?
        |
        YES
        v
  year % 400 == 0? ─────────YES──> return 29 (nhuận)
        |
        NO
        v
  year % 100 == 0? ─────────YES──> return 28 (không nhuận)
        |
        NO
        v
  year % 4 == 0? ───────────YES──> return 29 (nhuận)
        |
        NO
        v
      return 28
```

**Quy tắc năm nhuận:**
| Điều kiện | Kết quả | Ví dụ |
|-----------|---------|-------|
| Chia hết cho 400 | Nhuận | 2000, 2400 |
| Chia hết cho 100 (nhưng không phải 400) | Không nhuận | 1900, 2100 |
| Chia hết cho 4 (nhưng không phải 100) | Nhuận | 2024, 2028 |
| Còn lại | Không nhuận | 2023, 2025 |

> **Tại sao kiểm tra 400 trước rồi mới 100?** Vì 2000 chia hết cho cả 400 lẫn 100. Nếu kiểm tra 100 trước, 2000 sẽ bị trả về 28 (sai). Thứ tự kiểm tra từ điều kiện đặc biệt nhất → tổng quát nhất là quan trọng.

---

### API Endpoint `POST /api/check-date`

```javascript
app.post('/api/check-date', (req, res) => {
    const { day, month, year } = req.body;
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    ...
});
```

**Validation theo 3 lớp:**

```
Request đến
    |
    v
[Lớp 1] Kiểm tra FORMAT
    - Có giá trị không? (null, undefined, "")
    - Có phải số không? (isNaN)
    - Có phải số nguyên không? (isInteger)
    |── FAIL ──> "Input data for X is incorrect format!"
    |
    OK
    v
[Lớp 2] Kiểm tra RANGE (khoảng giới hạn)
    - Day: 1–31
    - Month: 1–12
    - Year: 1000–3000
    |── FAIL ──> "Input data for X is out of range!"
    |
    OK
    v
[Lớp 3] Kiểm tra VALIDITY (tính hợp lệ thực tế)
    - Gọi daysInMonth(year, month) để lấy số ngày tối đa
    - day <= maxDays?
    |── FAIL ──> "d/m/y is NOT correct date time!"
    |
    OK
    v
"d/m/y is correct date time!" ✓
```

**Tại sao cần 3 lớp riêng biệt?**
- **Lớp 1 (Format):** Ngăn crash khi dữ liệu đầu vào hoàn toàn sai kiểu (string chữ, null...)
- **Lớp 2 (Range):** Loại bỏ các giá trị vô lý (tháng 13, ngày 0...)
- **Lớp 3 (Validity):** Kiểm tra logic lịch thực tế (31/4 không tồn tại dù day và month đều trong range)

---

## 7. Giải thích chi tiết Frontend (App.jsx)

```jsx
const [day, setDay] = useState('');
const [month, setMonth] = useState('');
const [year, setYear] = useState('');
const [result, setResult] = useState(null);
```

**React State:** Mỗi `useState` tạo ra một biến state và hàm setter. Khi setter được gọi, React re-render component với giá trị mới.

---

### Hàm `handleCheck` — luồng chính

```jsx
const handleCheck = async () => {
    try {
        const response = await fetch('http://localhost:3001/api/check-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, month, year })
        });
        const data = await response.json();
        setResult(data);
    } catch (error) {
        setResult({ success: false, message: 'Network Error: Cannot connect to server.' });
    }
};
```

**Flow:**

```
User click "Check"
        |
        v
handleCheck() được gọi
        |
        v
fetch() gửi POST request đến localhost:3001/api/check-date
        |
        v
        ├── Thành công ──> response.json() parse kết quả
        │                       |
        │                       v
        │               setResult(data) ──> React re-render
        │                                   ──> Hiển thị kết quả
        |
        └── Thất bại (mạng) ──> catch(error)
                                    |
                                    v
                            setResult({ success: false, message: 'Network Error...' })
```

---

### Conditional Rendering kết quả

```jsx
{result && (
    <div className={`result-box ${result.success ? 'success' : 'error'}`}>
        {result.success ? '✓ ' : '✗ '}
        {result.message}
    </div>
)}
```

- `result &&` : Chỉ render khi `result` khác null (sau khi user đã bấm Check)
- Template literal `` `result-box ${...}` `` : Gắn class CSS động dựa vào `result.success`
- Ternary operator `? :` : Hiển thị icon ✓ hoặc ✗ tương ứng

---

## 8. Các loại Performance Test

### Smoke Test
- **Mục đích:** Xác nhận hệ thống hoạt động ở mức cơ bản nhất trước khi chạy các test nặng hơn
- **Khi nào dùng:** Luôn chạy đầu tiên — nếu smoke test fail thì không cần chạy các test khác
- **VUs:** 1 người dùng
- **Thời gian:** Ngắn (10–30 giây)

### Load Test
- **Mục đích:** Kiểm tra hệ thống dưới tải bình thường — mô phỏng lượng user thực tế hàng ngày
- **Khi nào dùng:** Sau smoke test, để xác nhận SLA (Service Level Agreement)
- **VUs:** 10–50 tùy quy mô ứng dụng
- **Thời gian:** 2–10 phút

### Stress Test
- **Mục đích:** Tìm ra điểm giới hạn (breaking point) của hệ thống — tải tăng dần đến khi hệ thống bắt đầu degraded
- **Khi nào dùng:** Khi cần biết hệ thống chịu được tối đa bao nhiêu user
- **VUs:** Tăng dần từ thấp đến rất cao (200+)
- **Thời gian:** 20–30 phút

### Spike Test
- **Mục đích:** Kiểm tra phản ứng khi tải tăng đột ngột và khả năng phục hồi sau đó
- **Khi nào dùng:** Mô phỏng sự kiện bất ngờ (flash sale, tin tức viral...)
- **VUs:** Tăng đột ngột từ thấp lên rất cao rồi giảm lại
- **Thời gian:** 10–20 phút

---

## 9. Giải thích chi tiết từng file test k6

### 9.1 `smoke-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};
```

**Giải thích `options`:**
- `vus: 1` — Chỉ 1 Virtual User
- `duration: '10s'` — Chạy trong 10 giây

```javascript
export default function () {
  const payload = JSON.stringify({ day: '15', month: '6', year: '2024' });
  const params  = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(`${BASE_URL}/api/check-date`, payload, params);

  check(res, {
    'status is 200':         (r) => r.status === 200,
    'response has success':  (r) => JSON.parse(r.body).success === true,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

**Giải thích `default function`:**
- Đây là hàm được mỗi VU chạy lặp đi lặp lại trong suốt thời gian test
- `http.post()` gửi request POST đến API
- `check()` là assertion — kiểm tra các điều kiện, ghi lại pass/fail vào metrics
- `sleep(1)` — VU nghỉ 1 giây trước khi lặp lại (mô phỏng hành vi thực tế của user)

> **Tại sao cần `sleep`?** Nếu không có sleep, VU sẽ gửi request liên tục không nghỉ — không thực tế và có thể làm méo kết quả. Người dùng thực tế luôn có thời gian "suy nghĩ" giữa các hành động.

---

### 9.2 `load-test.js`

```javascript
import { Rate, Trend } from 'k6/metrics';

const errorRate    = new Rate('error_rate');
const responseTime = new Trend('response_time', true);
```

**Custom Metrics:**
- `Rate` — Theo dõi tỉ lệ (0–100%), dùng cho error rate
- `Trend` — Theo dõi phân phối giá trị, tự tính avg/min/max/p90/p95, dùng cho response time

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10  },  // Ramp-up
    { duration: '1m',  target: 10  },  // Steady state
    { duration: '30s', target: 0   },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    error_rate:        ['rate<0.01'],
  },
};
```

**Giải thích `stages` (Ramp-up pattern):**

```
VUs
 10 |      ______________
    |     /              \
    |    /                \
  0 |___/                  \___
    |--30s--|----1m----|--30s--|
       Ramp   Steady    Ramp
        up    state     down
```

- **Ramp-up:** Tăng dần VUs — tránh tạo "cold start" spike giả tạo
- **Steady state:** Giữ ổn định để đo lường chính xác
- **Ramp-down:** Giảm dần — quan sát hệ thống "hạ nhiệt" như thế nào

**Giải thích `thresholds`:**
- `p(95)<500` — 95% request phải hoàn thành trong vòng 500ms. Nếu không đạt → test FAIL
- `rate<0.01` — Error rate phải dưới 1%. Nếu không đạt → test FAIL

**Test cases đa dạng:**
```javascript
const testCases = [
  { day: '15', month: '6',  year: '2024' },  // Valid - ngày bình thường
  { day: '29', month: '2',  year: '2024' },  // Valid - năm nhuận
  { day: '31', month: '4',  year: '2024' },  // Invalid - tháng 4 có 30 ngày
  { day: 'abc',month: '6',  year: '2024' },  // Wrong format
  ...
];
```

> **Tại sao dùng nhiều test case?** Load test nên mô phỏng traffic thực tế — user thực sẽ nhập đủ loại dữ liệu, không chỉ dữ liệu hợp lệ. Điều này giúp phát hiện bug hidden trong các edge case khi có nhiều user.

---

### 9.3 `stress-test.js`

```javascript
stages: [
    { duration: '2m',  target: 50  },
    { duration: '5m',  target: 50  },
    { duration: '2m',  target: 100 },
    { duration: '5m',  target: 100 },
    { duration: '2m',  target: 200 },
    { duration: '5m',  target: 200 },  // ← Stress zone
    { duration: '5m',  target: 0   },
],
```

**Stress pattern — tăng bậc thang:**

```
VUs
200 |                    ___________
    |                   /           \
100 |          ________/             \
    |         /                       \
 50 |________/                         \
    |                                   \___
    |--2m--|--5m--|--2m--|--5m--|--2m--|--5m--|--5m--|
```

**Mục đích từng bậc:**
- Bậc 50 VUs: Warm up, xác nhận hệ thống ổn định ở tải vừa
- Bậc 100 VUs: Tăng dần, quan sát có degradation không
- Bậc 200 VUs: Stress zone — đây là nơi tìm breaking point

**Thresholds nới lỏng hơn load test:**
```javascript
thresholds: {
    http_req_failed:   ['rate<0.1'],   // Cho phép đến 10% lỗi (stress test)
    http_req_duration: ['p(99)<3000'], // p99 < 3 giây (khoan nhượng hơn)
},
```

> **Tại sao threshold khác load test?** Stress test mục đích là tìm giới hạn, không phải xác nhận SLA. Việc nới lỏng threshold giúp test chạy đến mức có thể thấy degradation thay vì fail sớm.

---

### 9.4 `spike-test.js`

```javascript
stages: [
    { duration: '10s', target: 5   },  // Bình thường
    { duration: '1m',  target: 5   },
    { duration: '10s', target: 200 },  // ← SPIKE! Tăng đột ngột
    { duration: '3m',  target: 200 },  // Giữ spike
    { duration: '10s', target: 5   },  // Giảm đột ngột
    { duration: '3m',  target: 5   },  // Recovery
    { duration: '10s', target: 0   },
],
```

**Spike pattern:**

```
VUs
200 |          _________
    |         |         |
    |         |         |
  5 |_________|         |_________
    |                             |___
    |--10s-|--1m--|--10s--|--3m--|--10s--|--3m--|
              Normal  SPIKE  High    Drop  Recovery
```

**Điều spike test muốn biết:**
1. Hệ thống có chịu được cú sốc tải đột ngột không?
2. Response time tăng bao nhiêu khi spike xảy ra?
3. Sau khi spike qua, hệ thống có tự phục hồi về trạng thái bình thường không?

---

## 10. Cách chạy test

### Điều kiện tiên quyết
Server phải đang chạy trước khi chạy k6:
```powershell
# Terminal 1: Khởi động server
cd server
node server.js
# Output: Server running on http://localhost:3001
```

### Chạy các test theo thứ tự
```powershell
# Terminal 2: Chạy k6
cd server\k6-test

# 1. Smoke test trước
k6 run smoke-test.js

# 2. Load test
k6 run load-test.js

# 3. Stress test (chạy ~26 phút)
k6 run stress-test.js

# 4. Spike test (~15 phút)
k6 run spike-test.js
```

### Xuất kết quả ra file
```powershell
k6 run --out json=results/load-test-result.json load-test.js
```

---

## 11. Đọc và phân tích kết quả

### Cấu trúc output của k6

```
█ THRESHOLDS           ← Các điều kiện pass/fail
  http_req_duration
  ✓ 'p(95)<500' p(95)=1.7ms    ← ✓ = Pass, ✗ = Fail

█ TOTAL RESULTS
  checks_total.......: 1371    ← Tổng số check assertions
  checks_succeeded...: 100.00% ← Tỉ lệ pass

  HTTP
  http_req_duration..: avg=844µs min=0s med=825µs max=3.09ms p(90)=1.45ms p(95)=1.7ms
  http_req_failed....: 0.00%   ← Tỉ lệ request thất bại (HTTP error)
  http_reqs..........: 457     3.74/s ← Tổng requests và throughput (RPS)

  EXECUTION
  iteration_duration.: avg=2.02s ← Thời gian mỗi iteration (bao gồm sleep)
  vus................: 1  min=1  max=10 ← Số VUs

  NETWORK
  data_received......: 151 kB  ← Tổng data nhận về
  data_sent..........: 80 kB   ← Tổng data gửi đi
```

### Giải thích các metrics quan trọng

| Metric | Ý nghĩa | Ngưỡng tốt |
|--------|---------|-----------|
| `http_req_duration` avg | Thời gian phản hồi trung bình | < 200ms |
| `http_req_duration` p(95) | 95% request hoàn thành trong bao lâu | < 500ms |
| `http_req_duration` p(99) | 99% request hoàn thành trong bao lâu | < 1000ms |
| `http_req_failed` | % request nhận HTTP error (4xx, 5xx) | < 1% |
| `http_reqs` /s | Throughput — số request xử lý được mỗi giây | Càng cao càng tốt |
| `checks_succeeded` | % assertion pass | 100% |
| `iteration_duration` | Thời gian 1 vòng lặp VU (gồm cả sleep) | Phụ thuộc sleep time |

### Tại sao dùng percentile (p95, p99) thay vì average?

```
Response times (ms): [1, 1, 1, 1, 1, 1, 1, 1, 1, 1000]

Average = (9×1 + 1000) / 10 = 100.9ms  ← Bị kéo lên bởi outlier
p(90)  = 1ms                            ← 90% user thực sự nhận được 1ms
p(99)  = 1000ms                         ← 1% user gặp response chậm
```

> **Bài học:** Average che giấu outliers. p(95) và p(99) cho biết trải nghiệm của những user "xui xẻo nhất" — quan trọng hơn nhiều trong thực tế.

---

## 12. Kết quả thực tế

### Smoke Test — 1 VU, 10 giây
```
checks_succeeded: 100% (30/30)
http_req_failed:  0%
avg response:     3.29ms
p(95):            10.34ms
```
✅ **Kết luận:** Server hoạt động cơ bản tốt

---

### Load Test — 10 VUs, 2 phút
```
Thresholds:
  ✓ p(95)<500  →  p(95) = 1.7ms   (ngưỡng 500ms, thực tế 1.7ms!)
  ✓ rate<0.01  →  rate = 0%

http_req_failed: 0%
avg response:    844µs (< 1ms!)
Total requests:  457 (~3.7 req/s)
```
✅ **Kết luận:** API cực kỳ nhanh dưới tải bình thường. p(95) chỉ bằng 0.34% ngưỡng cho phép.

---

### Stress Test — lên đến 200 VUs, 26 phút
```
Thresholds:
  ✓ p(99)<3000  →  p(99) = 5.58ms  (ngưỡng 3000ms, thực tế 5.58ms!)
  ✓ rate<0.1    →  rate = 0%

http_req_failed: 0%
avg response:    939µs
max response:    42.82ms
Total requests:  164,770 (~105 req/s!)
```
✅ **Kết luận:** Server chịu được 200 concurrent users mà không có lỗi nào. Throughput đạt 105 req/s.

---

### Spike Test — đột biến 5 → 200 VUs
```
checks_succeeded: 100% (39,303/39,303)
http_req_failed:  0%
avg response:     1.23ms
max response:     20.93ms
Total requests:   39,303 (~85 req/s)
```
✅ **Kết luận:** Server hấp thụ spike tốt. Max response time chỉ 20.93ms ngay cả lúc spike.

---

### Tổng hợp so sánh

| Test | VUs | Avg (ms) | p(95) (ms) | Error Rate | Throughput |
|------|-----|----------|------------|------------|------------|
| Smoke | 1 | 3.29 | 10.34 | 0% | ~1 req/s |
| Load | 10 | 0.84 | 1.7 | 0% | ~3.7 req/s |
| Stress | 200 | 0.94 | 2.84 | 0% | ~105 req/s |
| Spike | 5→200 | 1.23 | 3.35 | 0% | ~85 req/s |

---

## 13. Tổng kết và bài học

### Tại sao kết quả tốt đến vậy?

1. **Local test:** Client (k6) và server chạy cùng máy → latency mạng ≈ 0ms
2. **Logic đơn giản:** API chỉ làm phép tính số học, không có I/O (database, file, network)
3. **Express.js hiệu năng tốt:** Single-threaded nhưng non-blocking, xử lý concurrent request hiệu quả

### Trong môi trường production, kết quả sẽ khác:
- Latency mạng: +20–100ms tùy vị trí địa lý
- Database queries: +5–50ms mỗi query
- Authentication/middleware: +5–20ms
- → p(95) thực tế có thể 100–300ms với cùng logic

### Quy trình Performance Testing chuẩn

```
1. Smoke Test ──PASS──> 2. Load Test ──PASS──> 3. Stress Test ──> Tìm breaking point
      |                       |
    FAIL                    FAIL
      |                       |
   Fix bug              Optimize & retry
```

### Checklist trước khi release

- [ ] Smoke test pass
- [ ] Load test pass với traffic dự kiến
- [ ] Stress test xác định được breaking point
- [ ] Spike test xác nhận recovery tốt
- [ ] Kết quả được document lại để so sánh sau mỗi lần deploy

---

*Tài liệu được tạo dựa trên thực hành với ứng dụng Date Time Checker — FPT University SWT301*
