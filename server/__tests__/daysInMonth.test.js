/**
 * Unit Test cho hàm daysInMonth()
 * 
 * Hàm này nhận vào (year, month) và trả về số ngày trong tháng đó.
 * Đặc biệt xử lý năm nhuận cho tháng 2.
 * 
 * Quy tắc năm nhuận:
 *   - Chia hết cho 400 → nhuận (29 ngày)
 *   - Chia hết cho 100 nhưng không cho 400 → KHÔNG nhuận (28 ngày)
 *   - Chia hết cho 4 nhưng không cho 100 → nhuận (29 ngày)
 *   - Không chia hết cho 4 → KHÔNG nhuận (28 ngày)
 */

const { daysInMonth } = require('../app');

// ============================
// NHÓM 1: Test các tháng có 31 ngày
// Tháng: 1, 3, 5, 7, 8, 10, 12
// ============================
describe('daysInMonth - Các tháng có 31 ngày', () => {

    test('Tháng 1 (January) có 31 ngày', () => {
        // Gọi hàm với year=2024, month=1
        // Kỳ vọng kết quả trả về là 31
        expect(daysInMonth(2024, 1)).toBe(31);
    });

    test('Tháng 3 (March) có 31 ngày', () => {
        expect(daysInMonth(2024, 3)).toBe(31);
    });

    test('Tháng 5 (May) có 31 ngày', () => {
        expect(daysInMonth(2024, 5)).toBe(31);
    });

    test('Tháng 7 (July) có 31 ngày', () => {
        expect(daysInMonth(2024, 7)).toBe(31);
    });

    test('Tháng 8 (August) có 31 ngày', () => {
        expect(daysInMonth(2024, 8)).toBe(31);
    });

    test('Tháng 10 (October) có 31 ngày', () => {
        expect(daysInMonth(2024, 10)).toBe(31);
    });

    test('Tháng 12 (December) có 31 ngày', () => {
        expect(daysInMonth(2024, 12)).toBe(31);
    });
});

// ============================
// NHÓM 2: Test các tháng có 30 ngày
// Tháng: 4, 6, 9, 11
// ============================
describe('daysInMonth - Các tháng có 30 ngày', () => {

    test('Tháng 4 (April) có 30 ngày', () => {
        expect(daysInMonth(2024, 4)).toBe(30);
    });

    test('Tháng 6 (June) có 30 ngày', () => {
        expect(daysInMonth(2024, 6)).toBe(30);
    });

    test('Tháng 9 (September) có 30 ngày', () => {
        expect(daysInMonth(2024, 9)).toBe(30);
    });

    test('Tháng 11 (November) có 30 ngày', () => {
        expect(daysInMonth(2024, 11)).toBe(30);
    });
});

// ============================
// NHÓM 3: Test tháng 2 - Năm nhuận
// Đây là phần phức tạp nhất vì phải kiểm tra
// nhiều điều kiện lồng nhau
// ============================
describe('daysInMonth - Tháng 2 (Năm nhuận)', () => {

    test('Năm 2000: chia hết cho 400 → năm nhuận → 29 ngày', () => {
        // 2000 % 400 === 0 → true → return 29
        expect(daysInMonth(2000, 2)).toBe(29);
    });

    test('Năm 1900: chia hết cho 100 nhưng KHÔNG chia hết 400 → không nhuận → 28 ngày', () => {
        // 1900 % 400 !== 0 → kiểm tra tiếp
        // 1900 % 100 === 0 → true → return 28
        expect(daysInMonth(1900, 2)).toBe(28);
    });

    test('Năm 2024: chia hết cho 4 nhưng KHÔNG chia hết 100 → năm nhuận → 29 ngày', () => {
        // 2024 % 400 !== 0 → kiểm tra tiếp
        // 2024 % 100 !== 0 → kiểm tra tiếp
        // 2024 % 4 === 0 → true → return 29
        expect(daysInMonth(2024, 2)).toBe(29);
    });

    test('Năm 2023: KHÔNG chia hết cho 4 → không nhuận → 28 ngày', () => {
        // 2023 % 400 !== 0 → kiểm tra tiếp
        // 2023 % 100 !== 0 → kiểm tra tiếp
        // 2023 % 4 !== 0 → return 28
        expect(daysInMonth(2023, 2)).toBe(28);
    });

    test('Năm 1600: chia hết cho 400 → năm nhuận → 29 ngày', () => {
        expect(daysInMonth(1600, 2)).toBe(29);
    });

    test('Năm 2100: chia hết cho 100 nhưng KHÔNG chia hết 400 → 28 ngày', () => {
        expect(daysInMonth(2100, 2)).toBe(28);
    });
});

// ============================
// NHÓM 4: Test tháng không hợp lệ
// Khi month nằm ngoài 1-12, hàm trả về 0
// ============================
describe('daysInMonth - Tháng không hợp lệ', () => {

    test('Tháng 0 → trả về 0 (không tồn tại)', () => {
        expect(daysInMonth(2024, 0)).toBe(0);
    });

    test('Tháng 13 → trả về 0 (không tồn tại)', () => {
        expect(daysInMonth(2024, 13)).toBe(0);
    });

    test('Tháng -1 → trả về 0 (số âm)', () => {
        expect(daysInMonth(2024, -1)).toBe(0);
    });
});
