/**
 * Integration Test cho API endpoint POST /api/check-date
 * 
 * Sử dụng thư viện "supertest" để gửi HTTP request giả lập đến Express app
 * mà KHÔNG cần khởi động server thật (không cần app.listen).
 * 
 * Cách hoạt động của supertest:
 *   const res = await request(app)     ← Tạo request đến Express app
 *       .post('/api/check-date')        ← HTTP method + URL
 *       .send({ day, month, year });    ← Body của request (JSON)
 *   
 *   res.body ← Chứa JSON response từ server
 *   res.body.success ← true/false
 *   res.body.message ← Thông báo kết quả
 */

const request = require('supertest');
const { app } = require('../app');

// =====================================================
// NHÓM 1: Test ngày tháng HỢP LỆ
// Đây là các trường hợp API phải trả về success: true
// =====================================================
describe('POST /api/check-date - Ngày hợp lệ', () => {

    test('15/6/2024 là ngày hợp lệ (trường hợp bình thường)', async () => {
        // Gửi POST request với body { day: '15', month: '6', year: '2024' }
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '6', year: '2024' });

        // Kiểm tra response
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('correct date time');
    });

    test('29/2/2000 hợp lệ - năm 2000 là năm nhuận (chia hết cho 400)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '29', month: '2', year: '2000' });

        expect(res.body.success).toBe(true);
    });

    test('29/2/2024 hợp lệ - năm 2024 là năm nhuận (chia hết cho 4)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '29', month: '2', year: '2024' });

        expect(res.body.success).toBe(true);
    });

    test('28/2/1900 hợp lệ - ngày 28 luôn hợp lệ trong tháng 2', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '28', month: '2', year: '1900' });

        expect(res.body.success).toBe(true);
    });

    test('1/1/1000 - biên dưới của year (giá trị nhỏ nhất hợp lệ)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '1', month: '1', year: '1000' });

        expect(res.body.success).toBe(true);
    });

    test('31/12/3000 - biên trên của tất cả (giá trị lớn nhất hợp lệ)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '31', month: '12', year: '3000' });

        expect(res.body.success).toBe(true);
    });

    test('30/4/2024 - ngày cuối cùng của tháng 30 ngày', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '30', month: '4', year: '2024' });

        expect(res.body.success).toBe(true);
    });
});

// =====================================================
// NHÓM 2: Test ngày tháng KHÔNG HỢP LỆ
// Ngày vượt quá số ngày tối đa của tháng
// =====================================================
describe('POST /api/check-date - Ngày không hợp lệ', () => {

    test('29/2/1900 KHÔNG hợp lệ - 1900 không phải năm nhuận (chia hết 100 nhưng không 400)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '29', month: '2', year: '1900' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('NOT correct date time');
    });

    test('31/4/2024 KHÔNG hợp lệ - tháng 4 chỉ có 30 ngày', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '31', month: '4', year: '2024' });

        expect(res.body.success).toBe(false);
    });

    test('31/6/2024 KHÔNG hợp lệ - tháng 6 chỉ có 30 ngày', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '31', month: '6', year: '2024' });

        expect(res.body.success).toBe(false);
    });

    test('30/2/2024 KHÔNG hợp lệ - tháng 2 tối đa 29 ngày (năm nhuận)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '30', month: '2', year: '2024' });

        expect(res.body.success).toBe(false);
    });

    test('29/2/2023 KHÔNG hợp lệ - tháng 2 chỉ có 28 ngày (không nhuận)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '29', month: '2', year: '2023' });

        expect(res.body.success).toBe(false);
    });
});

// =====================================================
// NHÓM 3: Test SAI ĐỊNH DẠNG (Incorrect format)
// Input không phải số nguyên: chữ, số thực, rỗng
// =====================================================
describe('POST /api/check-date - Sai định dạng', () => {

    test('Day là chữ "abc" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: 'abc', month: '6', year: '2024' });

        // Kiểm tra success = false VÀ message chứa đúng thông báo lỗi
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Day is incorrect format');
    });

    test('Month là chữ "xyz" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: 'xyz', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Month is incorrect format');
    });

    test('Year là chữ "abcd" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '6', year: 'abcd' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Year is incorrect format');
    });

    test('Day là số thực "1.5" → incorrect format (phải là số nguyên)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '1.5', month: '6', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Day is incorrect format');
    });

    test('Month là số thực "6.7" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '6.7', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Month is incorrect format');
    });

    test('Day rỗng "" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '', month: '6', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Day is incorrect format');
    });

    test('Month rỗng "" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Month is incorrect format');
    });

    test('Year rỗng "" → incorrect format', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '6', year: '' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Year is incorrect format');
    });
});

// =====================================================
// NHÓM 4: Test NGOÀI PHẠM VI (Out of range)
// Day: 1-31, Month: 1-12, Year: 1000-3000
// =====================================================
describe('POST /api/check-date - Ngoài phạm vi', () => {

    // --- Day out of range ---
    test('Day = 0 → out of range (dưới biên min=1)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '0', month: '6', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Day is out of range');
    });

    test('Day = 32 → out of range (trên biên max=31)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '32', month: '6', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Day is out of range');
    });

    test('Day = -5 → out of range (số âm)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '-5', month: '6', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Day is out of range');
    });

    // --- Month out of range ---
    test('Month = 0 → out of range (dưới biên min=1)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '0', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Month is out of range');
    });

    test('Month = 13 → out of range (trên biên max=12)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '13', year: '2024' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Month is out of range');
    });

    // --- Year out of range ---
    test('Year = 999 → out of range (dưới biên min=1000)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '6', year: '999' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Year is out of range');
    });

    test('Year = 3001 → out of range (trên biên max=3000)', async () => {
        const res = await request(app)
            .post('/api/check-date')
            .send({ day: '15', month: '6', year: '3001' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Year is out of range');
    });
});
