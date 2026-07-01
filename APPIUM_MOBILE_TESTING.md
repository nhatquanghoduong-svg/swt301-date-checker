# Nhật ký Setup & Debug Appium Mobile Testing — Date Checker App

> Tài liệu này tổng hợp toàn bộ quá trình setup môi trường, viết test, và debug khi test web app "Date Time Checker" bằng Appium trên Android Emulator. Mục tiêu là vừa lưu lại các bước đã làm, vừa giải thích **vì sao** từng bước cần thiết, để bạn hiểu sâu hơn chứ không chỉ làm theo.

---

## 1. Mục tiêu & Kiến trúc hệ thống

### 1.1. Bài toán
Test ứng dụng web "Date Time Checker" — gồm:
- **Frontend**: React (Vite), người dùng nhập Day/Month/Year, bấm "Check", gọi API
- **Backend**: Express.js, route `POST /api/check-date`, kiểm tra ngày hợp lệ theo flowchart (định dạng → khoảng giá trị → số ngày trong tháng/năm nhuận)

Yêu cầu: test **trên mobile** (Android Emulator) bằng **Appium**, chứ không phải test trên trình duyệt desktop thông thường.

### 1.2. Vì sao lại dùng Appium cho 1 web app (không phải app native)?

Vì yêu cầu đề bài là "mobile testing". Appium hỗ trợ 2 kiểu:
- **Native app testing**: điều khiển app `.apk` thật
- **Mobile web testing**: điều khiển **trình duyệt Chrome** chạy trên thiết bị/emulator Android, giống Selenium nhưng chạy trên mobile

Vì app của bạn là web app (HTML/React), ta dùng kiểu thứ 2: Appium mở Chrome trong emulator, rồi điều khiển DOM giống hệt Selenium.

### 1.3. Sơ đồ luồng kết nối đầy đủ

```
┌─────────────────────────────────────────────────────────────────┐
│                         MÁY HOST (Windows)                       │
│                                                                   │
│  Backend (Express)          Frontend (Vite)        Test script  │
│  localhost:3001      <───   localhost:5173   <───   WebdriverIO  │
│       ▲                          ▲                       │       │
│       │ adb reverse              │ --host (bind 0.0.0.0)  │       │
│       │ tcp:3001→tcp:3001        │                        ▼       │
│       │                          │                  Appium Server │
│       │                          │                  (port 4723)   │
└───────┼──────────────────────────┼────────────────────────┼───────┘
        │                          │                        │
┌───────┼──────────────────────────┼────────────────────────┼───────┐
│       │      ANDROID EMULATOR    │                        │       │
│       │                          │                        ▼       │
│  fetch('localhost:3001')   Chrome mở http://10.0.2.2:5173  UiAutomator2
│  (được adb reverse forward      (10.0.2.2 = alias trỏ về   driver  │
│   về máy host)                   máy host từ trong emulator)      │
└───────────────────────────────────────────────────────────────────┘
```

**3 điểm mấu chốt cần hiểu:**
1. `10.0.2.2` là địa chỉ đặc biệt **chỉ có ý nghĩa khi gọi từ bên trong Android Emulator** — nó là alias trỏ về `localhost` của máy host. Dùng để Chrome trong emulator load được trang frontend.
2. `adb reverse tcp:3001 tcp:3001` forward port 3001 của **emulator** sang port 3001 của **máy host** — cần thiết vì code JS chạy *bên trong* emulator gọi `fetch('http://localhost:3001/...')`, và `localhost` lúc đó nghĩa là "chính emulator", không tự động hiểu là máy host.
3. Vite mặc định chỉ bind vào `127.0.0.1` (chỉ nhận kết nối từ chính máy host) — cần cờ `--host` để nó bind ra `0.0.0.0`, chấp nhận kết nối từ "bên ngoài" (kể cả qua NAT của emulator).

---

## 2. Cài đặt môi trường (Windows) — toàn bộ từ đầu

### 2.1. Node.js
Tải bản LTS tại nodejs.org, cài `.msi` bình thường.

### 2.2. JDK (Java 11+)
- Tải tại adoptium.net
- Set biến môi trường `JAVA_HOME` trỏ tới thư mục cài JDK
- Thêm `%JAVA_HOME%\bin` vào `Path`

### 2.3. Android Studio + SDK + Emulator
1. Cài Android Studio (Standard setup)
2. SDK Manager → cài 1 phiên bản Android ổn định (khuyến nghị **API 33 "Tiramisu" / Android 13**, tránh bản preview/quá mới như API 37 vì driver automation chưa kịp hỗ trợ)
3. Tạo Virtual Device:
   - Chọn device (vd: Pixel 7)
   - System Image: chọn dòng có **"Google Play"** (không phải "Google APIs") — bắt buộc để có Chrome cài sẵn
   - **Tránh chọn bản "16 KB Page Size"** — đây là image đặc biệt dùng để test tương thích bộ nhớ, dễ gây lỗi lạ với Appium/UiAutomator2

### 2.4. Biến môi trường ANDROID_HOME
- `ANDROID_HOME` = `C:\Users\<User>\AppData\Local\Android\Sdk`
- Thêm vào `Path`:
  ```
  %ANDROID_HOME%\platform-tools
  %ANDROID_HOME%\emulator
  %ANDROID_HOME%\tools
  %ANDROID_HOME%\tools\bin
  ```
- **Luôn mở terminal MỚI** sau khi đổi biến môi trường — terminal cũ không tự cập nhật.

### 2.5. Cài Appium
```cmd
npm install -g appium
appium driver install uiautomator2
npm install -g appium-doctor
appium-doctor --android
```
`appium-doctor` chỉ ra chính xác thiếu gì (ANDROID_HOME, JAVA_HOME, adb...). 2 cảnh báo có thể **bỏ qua an toàn**: thiếu `android` và `apkanalyzer.bat` — đây là tool cũ chỉ cần cho test native `.apk`, không liên quan web testing.

### 2.6. Cài WebdriverIO project
```cmd
mkdir mobile-tests && cd mobile-tests
npm init -y
npm install --save-dev @wdio/cli
npx wdio config
```

Các lựa chọn quan trọng trong wizard:

| Câu hỏi | Chọn | Vì sao |
|---|---|---|
| Environment to automate | **Mobile** | Vì test qua Chrome trong Android Emulator, không phải desktop browser |
| Mobile environment | **Android** | Nền tảng đang test |
| Driver | UiAutomator2 (mặc định) | Driver chuẩn cho Android |
| Framework | Mocha | Đơn giản, đủ dùng |
| TypeScript | **N** | Không cần thiết cho project nhỏ |
| Page Objects | **N** | Project chỉ có 1 trang, không cần tách lớp |
| Service | **appium** | Tự động khởi động/tắt Appium server khi chạy test |
| Plugin | Không chọn gì | Các matcher cơ bản đã đủ |

---

## 3. Giải thích chi tiết `wdio.conf.js` (file cấu hình)

```javascript
capabilities: [{
    platformName: 'Android',
    browserName: 'Chrome',
    'appium:deviceName': 'Android GoogleAPI Emulator',
    'appium:automationName': 'UiAutomator2',
    'appium:chromedriverExecutable': 'E:/chromedriver-win64/chromedriver.exe',
    'wdio:enforceWebDriverClassic': true,
}],
```

Giải thích từng dòng:

- **`platformName: 'Android'`**: báo cho Appium biết đang điều khiển thiết bị Android (khác iOS).
- **`browserName: 'Chrome'`**: báo Appium mở Chrome (không phải app native) — đây là điểm quyết định để Appium biết dùng cơ chế web automation (qua Chromedriver) thay vì điều khiển UI native.
- **`automationName: 'UiAutomator2'`**: tên driver cụ thể Appium dùng để giao tiếp với hệ điều hành Android. UiAutomator2 là driver chính thức, ổn định nhất cho Android hiện tại.
- **`chromedriverExecutable`**: chỉ định **thủ công** đường dẫn tới file `chromedriver.exe` đã tải đúng version khớp với Chrome trong emulator. Cần thiết khi Chrome trong emulator có version quá mới/cũ mà Appium chưa có sẵn bảng mapping tự động tương ứng.
- **`wdio:enforceWebDriverClassic: true`**: ép dùng giao thức **WebDriver Classic** (cũ, ổn định) thay vì **WebDriver Bidi** (mới, mặc định từ WebdriverIO v9). Đây là fix quan trọng nhất tìm ra được — Bidi bị lỗi "socket hang up" liên tục trong môi trường này, gây ra hiện tượng đọc nhầm dữ liệu DOM cũ.

```javascript
waitforTimeout: 20000,
```
Thời gian chờ mặc định (ms) cho mọi lệnh `waitFor*` và `expect`, nếu không truyền riêng option `wait`/`timeout`. Tăng lên vì máy chạy đồng thời nhiều tiến trình nặng (Emulator + Appium + Chromedriver) nên cần dự phòng thời gian phản hồi dài hơn bình thường.

```javascript
services: ['appium'],
```
`wdio-appium-service` tự động **spawn Appium server** khi bắt đầu chạy test, và **tắt nó** khi xong — không cần bạn tự mở terminal riêng gõ `appium`.

---

## 4. Giải thích chi tiết `test.e2e.js` (luồng code test)

### 4.1. Toàn bộ file cuối cùng (đã fix hết lỗi)

```javascript
const BASE_URL = 'http://10.0.2.2:5173';

describe('Date Checker — Mobile Tests', () => {

    async function fillAndCheck(day, month, year) {
        await $('#day-input').clearValue();
        await $('#day-input').setValue(day);
        await $('#month-input').clearValue();
        await $('#month-input').setValue(month);
        await $('#year-input').clearValue();
        await $('#year-input').setValue(year);

        // Click bằng JS — không dùng tap theo toạ độ
        const checkBtn = await $('button=Check');
        await browser.execute((el) => el.click(), checkBtn);
    }

    before(async () => {
        await browser.url(BASE_URL);
        // Warm-up: "mồi" 1 request để Vite compile xong, Chrome/driver ổn định
        await fillAndCheck('1', '1', '2000');
    });

    it('TC01 — should accept valid date 15/6/2024', async () => {
        await fillAndCheck('15', '6', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveText(expect.stringContaining('correct date time'), { wait: 10000 });
        await expect(result).toHaveElementClass('success');
    });

    // ... TC02 → TC10 tương tự, mỗi case 1 bộ input + assertion khác nhau
});
```

### 4.2. Giải thích từng phần — flow logic

**`describe(...)`**: nhóm các test case lại với nhau dưới 1 chủ đề ("Date Checker — Mobile Tests"). Đây là cấu trúc chuẩn của Mocha (BDD style).

**Hàm `fillAndCheck(day, month, year)`** — đây là **helper function**, viết 1 lần dùng lại cho mọi test case, tránh lặp code (DRY principle):
1. `clearValue()` — xoá trắng input hiện tại (đề phòng còn sót giá trị từ lần test trước, vì chỉ load trang 1 lần duy nhất ở `before`)
2. `setValue(day)` — gõ giá trị mới vào input, kích hoạt đúng event `onChange` mà React lắng nghe để cập nhật state
3. `$('button=Check')` — tìm nút có chữ chính xác là "Check" (cú pháp `tagName=text` là 1 kiểu selector đặc biệt của WebdriverIO, tìm theo text hiển thị)
4. `browser.execute((el) => el.click(), checkBtn)` — đây là điểm fix quan trọng: thay vì để Appium tự tính toán tọa độ pixel trên màn hình rồi "tap" vào đúng vị trí đó (cách click mặc định), ta gọi trực tiếp `element.click()` bằng JavaScript ngay trong context của trang web. Cách này **luôn trúng đúng phần tử**, không bị ảnh hưởng bởi việc layout trang thay đổi (ví dụ khi `result-box` xuất hiện làm đẩy nút xuống, tọa độ pixel cũ sẽ trỏ sai chỗ).

**`before(async () => {...})`**: hook chạy **1 lần duy nhất**, trước toàn bộ các `it(...)` trong `describe`. Khác với `beforeEach` (chạy lại trước MỖI test case). Lý do chọn `before` thay vì `beforeEach`:
- App là Single Page Application (React) — không cần load lại cả trang giữa các test, chỉ cần thao tác lại trên DOM hiện có
- Load lại trang nhiều lần qua mạng NAT chậm của Android Emulator (`10.0.2.2`) tốn thời gian không cần thiết và dễ gây timeout khi máy đang tải nặng

**Bước warm-up** (`fillAndCheck('1','1','2000')` ngay trong `before`): chạy 1 request "mồi" không nhằm kiểm tra gì cả, chỉ để:
- Vite dev server **compile module React lần đầu** (Vite dùng cơ chế lazy-compile, chỉ build khi có request thực tế đầu tiên — request đầu luôn chậm hơn các request sau)
- Chrome/Chromedriver "khởi động nóng" sau khi vừa mở session

→ Nhờ vậy, khi tới TC01 thật, mọi thứ đã "nóng máy", chạy ổn định và nhanh như các TC sau.

**`expect(result).toHaveText(expect.stringContaining('...'), { wait: 10000 })`**:
- `toHaveText` là 1 **matcher** (hàm kiểm tra) của thư viện `expect-webdriverio`
- `expect.stringContaining('...')` là **asymmetric matcher** — nghĩa là "chuỗi này CHỨA đoạn text này" (không cần khớp chính xác 100%). Đây là cách viết chuẩn trong WebdriverIO v9 (các bản cũ dùng `toHaveTextContaining()` riêng, nhưng v9 đã gộp vào dùng chung với `toHaveText` + asymmetric matcher)
- `{ wait: 10000 }`: matcher này sẽ **tự động retry liên tục** (poll) trong tối đa 10 giây, tới khi điều kiện đúng hoặc hết giờ — đây là cơ chế "smart wait" giúp test không bị fail oan khi backend phản hồi chậm hơn dự kiến vài trăm ms

---

## 5. Giải thích logic backend (`app.js`)

```javascript
function daysInMonth(year, month) {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
    if ([4, 6, 9, 11].includes(month)) return 30;
    if (month === 2) {
        if (year % 400 === 0) return 29;  // nhuận: chia hết 400
        if (year % 100 === 0) return 28;  // không nhuận: chia hết 100 nhưng không chia hết 400
        if (year % 4 === 0) return 29;    // nhuận: chia hết 4 (và không rơi vào 2 case trên)
        return 28;                        // không nhuận
    }
    return 0;
}
```

Đây chính là **quy tắc năm nhuận chuẩn của lịch Gregory**: chia hết cho 4 là năm nhuận, **trừ** năm chia hết cho 100 thì không nhuận, **trừ tiếp** năm chia hết cho 400 thì vẫn nhuận. Thứ tự kiểm tra trong code (400 → 100 → 4) là quan trọng để xử lý đúng các trường hợp đặc biệt như 2000 (nhuận), 2100 (không nhuận), 2024 (nhuận).

**3 lớp kiểm tra trong route `/api/check-date`** (đúng theo "flowchart" được nhắc trong comment code):
1. **Định dạng** (`isNaN`, `Number.isInteger`) — input phải là số nguyên hợp lệ
2. **Khoảng giá trị** (`day` 1-31, `month` 1-12, `year` 1000-3000) — kiểm tra biên cơ bản trước khi xét logic phức tạp
3. **Tính hợp lệ thực tế của ngày** — dùng `daysInMonth()` để biết tháng đó có bao nhiêu ngày, rồi so sánh

→ Đây là lý do bộ 10 test case được thiết kế bao quát đủ 3 lớp này (TC04-TC07 test lớp 1-2, TC01-03 + TC09-10 test lớp 3 — đặc biệt các case biên về năm nhuận).

---

## 6. Toàn bộ các lỗi đã gặp & nguyên nhân — "tổng kết hành trình debug"

| # | Lỗi | Nguyên nhân thật | Cách fix |
|---|---|---|---|
| 1 | AVD chọn "16 KB Page Size" image | Image đặc biệt test tương thích bộ nhớ, dễ lỗi với automation tool cũ | Đổi sang system image thường |
| 2 | Services chọn "Google APIs" thay vì "Google Play" | Google APIs không có sẵn Chrome đầy đủ | Đổi đúng services = Google Play |
| 3 | `appium-doctor` báo thiếu ANDROID_HOME trong VS Code | VS Code terminal kế thừa biến môi trường từ lúc mở app, không tự đọc lại Registry | Đóng hẳn VS Code, mở lại |
| 4 | "Unable to find device with OS 12.0" | `wdio.conf.js` mẫu có sẵn `platformVersion: '12.0'` không khớp emulator thật (Android 13) | Sửa đúng version hoặc bỏ trống để tự nhận diện |
| 5 | "No Chromedriver found that can automate Chrome 109" | Chrome quá cũ trong emulator, ngoài bảng mapping của Appium | Update Chrome qua Play Store |
| 6 | "No Chromedriver found... Chrome 149" | Chrome sau khi update lại quá MỚI, cũng ngoài mapping | Tải tay đúng bản `chromedriver.exe` từ Chrome for Testing, chỉ định qua `chromedriverExecutable` |
| 7 | Lỡ tải `chrome.exe` thay vì `chromedriver.exe` | 2 file khác nhau, dễ nhầm trên trang tải | Tải đúng dòng "chromedriver" trong danh sách |
| 8 | `Chromedriver exited unexpectedly` | File chromedriver bị Windows Defender chặn / chạy thử bằng `--version` để xác minh | Allow trong Windows Security, hoặc tải lại đúng file |
| 9 | `ERR_CONNECTION_TIMED_OUT` khi load `10.0.2.2:5173` | Vite mặc định chỉ bind `localhost`, không nhận kết nối qua NAT của emulator | Thêm cờ `--host` khi chạy `npm run dev` |
| 10 | Test fail "Network Error" dù chạy tay thì OK | Mất `adb reverse` (port-forward) sau khi restart emulator/máy | Chạy lại `adb reverse tcp:3001 tcp:3001` |
| 11 | `adb.exe: device offline` | ADB server bị treo sau thời gian dài máy sleep/không dùng | `adb kill-server` → `adb start-server` |
| 12 | `expect(...).toHaveTextContaining is not a function` | WebdriverIO v9 đã xoá các matcher dạng `...Containing`, đổi cách viết | Dùng `toHaveText(expect.stringContaining(...))` |
| 13 | `.result-box still not existing` (lúc fail lúc pass) | `browser.pause(500)` cố định không đủ, tải máy nặng làm response chậm hơn dự kiến | Đổi sang `waitForExist`/`expect` có cơ chế tự retry |
| 14 | TC03 nhận trúng text của TC02 (case trước) | `.result-box` là 1 element cố định được React cập nhật lại nội dung — `waitForExist` chỉ check "tồn tại", không check "đã đổi nội dung mới" | Dùng `toHaveText` với option `wait`, tự poll tới khi đúng nội dung |
| 15 | TC01 vẫn fail dù đã sửa #14 | Lần tương tác đầu tiên tuyệt đối cần thêm thời gian cho Vite cold-compile | Thêm bước "warm-up" 1 lần trong `before()` |
| 16 | TC03-TC07 luôn nhận đúng 1 dòng kết quả của warm-up | `$('button=Check').click()` (tap theo toạ độ) không trúng đúng nút khi layout đã đổi (result-box chiếm thêm không gian, đẩy nút lệch vị trí) | Đổi sang `browser.execute(el => el.click(), checkBtn)` — click thẳng qua JS, không qua toạ độ |
| 17 | Log liên tục "Could not connect to Bidi protocol — socket hang up" | WebdriverIO v9 mặc định dùng giao thức Bidi mới, không ổn định trong môi trường này | Thêm `'wdio:enforceWebDriverClassic': true` |

**Bài học lớn nhất**: phần lớn lỗi không nằm ở *code logic test* mà nằm ở **môi trường và cơ chế đồng bộ** (network giữa emulator-host, version compatibility, protocol mới chưa ổn định, cách Appium "click" vào element). Khi debug automation testing, luôn ưu tiên xác minh từng lớp hạ tầng (ADB → network → backend → frontend → DOM → click → assertion) theo đúng thứ tự, thay vì đoán đại ở lớp trên cùng.

---

## 7. Quy trình chạy lại test (checklist mỗi lần)

```cmd
:: 1. Mở Android Emulator (qua Android Studio Device Manager, nút ▶️)

:: 2. Kiểm tra ADB
adb devices
:: → phải thấy "emulator-5554   device"

:: 3. Thiết lập port-forward
adb reverse tcp:3001 tcp:3001
adb reverse --list

:: 4. Terminal riêng 1: chạy backend
cd đường-dẫn-backend
node server.js

:: 5. Terminal riêng 2: chạy frontend
cd đường-dẫn-frontend
npm run dev -- --host
:: → phải thấy cả dòng "Local:" và "Network:"

:: 6. Terminal riêng 3: chạy test
cd mobile-tests
npm run wdio
```

**Lưu ý:**
- Giữ cả 4 terminal (emulator, backend, frontend, test) mở song song, không tắt cái nào
- Nếu gặp `device offline`: `adb kill-server` → `adb start-server`, làm lại từ bước 2
- File `wdio.conf.js` đã cấu hình sẵn, không cần sửa lại mỗi lần — chỉ cần đảm bảo đường dẫn `chromedriverExecutable` vẫn đúng vị trí file trên máy

---

## 8. Kết quả cuối cùng

```
Date Checker — Mobile Tests
   ✓ TC01 — should accept valid date 15/6/2024
   ✓ TC02 — should accept 29/2/2024 (leap year)
   ✓ TC03 — should reject 29/2/2023 (not leap year)
   ✓ TC04 — should reject day=32
   ✓ TC05 — should reject month=13
   ✓ TC06 — should reject year=999
   ✓ TC07 — should reject non-numeric day
   ✓ TC08 — Clear button should reset all fields
   ✓ TC09 — should reject 31/4/2024 (April has 30 days)
   ✓ TC10 — should accept 1/1/1000 (minimum year)

10 passing (27.7s)
```

10/10 test case pass, bao phủ đủ 3 lớp validation của backend (định dạng, khoảng giá trị, logic năm nhuận/số ngày trong tháng), chạy ổn định trên Android Emulator qua Appium + UiAutomator2 + Chrome.
