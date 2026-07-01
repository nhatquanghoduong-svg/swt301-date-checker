const BASE_URL = 'http://10.0.2.2:3000'; // 10.0.2.2 = localhost từ Android Emulator

describe('Date Checker — Mobile Tests', () => {

    // Helper: điền form và nhấn Check
    async function fillAndCheck(day, month, year) {
        await $('#day-input').clearValue();
        await $('#day-input').setValue(day);
        await $('#month-input').clearValue();
        await $('#month-input').setValue(month);
        await $('#year-input').clearValue();
        await $('#year-input').setValue(year);
        await $('button=Check').click();
        await browser.pause(500);
    }

    beforeEach(async () => {
        await browser.url(BASE_URL);
    });

    // ── TC01: Ngày hợp lệ ──────────────────────────────────
    it('TC01 — should accept valid date 15/6/2024', async () => {
        await fillAndCheck('15', '6', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('correct date time');
        await expect(result).toHaveElementClass('success');
    });

    // ── TC02: Ngày 29/2 năm nhuận ──────────────────────────
    it('TC02 — should accept 29/2/2024 (leap year)', async () => {
        await fillAndCheck('29', '2', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('correct date time');
    });

    // ── TC03: Ngày 29/2 không phải năm nhuận ───────────────
    it('TC03 — should reject 29/2/2023 (not leap year)', async () => {
        await fillAndCheck('29', '2', '2023');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('NOT correct date time');
        await expect(result).toHaveElementClass('error');
    });

    // ── TC04: Day out of range ─────────────────────────────
    it('TC04 — should reject day=32', async () => {
        await fillAndCheck('32', '1', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('Day is out of range');
    });

    // ── TC05: Month out of range ───────────────────────────
    it('TC05 — should reject month=13', async () => {
        await fillAndCheck('15', '13', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('Month is out of range');
    });

    // ── TC06: Year out of range ────────────────────────────
    it('TC06 — should reject year=999', async () => {
        await fillAndCheck('15', '6', '999');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('Year is out of range');
    });

    // ── TC07: Wrong format (chữ thay số) ───────────────────
    it('TC07 — should reject non-numeric day', async () => {
        await fillAndCheck('abc', '6', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('incorrect format');
    });

    // ── TC08: Nút Clear ────────────────────────────────────
    it('TC08 — Clear button should reset all fields', async () => {
        await fillAndCheck('15', '6', '2024');
        await $('button=Clear').click();
        await expect($('#day-input')).toHaveValue('');
        await expect($('#month-input')).toHaveValue('');
        await expect($('#year-input')).toHaveValue('');
        await expect($('.result-box')).not.toBeDisplayed();
    });

    // ── TC09: Boundary — ngày cuối tháng 30 ────────────────
    it('TC09 — should reject 31/4/2024 (April has 30 days)', async () => {
        await fillAndCheck('31', '4', '2024');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('NOT correct date time');
    });

    // ── TC10: Boundary — ngày đầu hợp lệ ──────────────────
    it('TC10 — should accept 1/1/1000 (minimum year)', async () => {
        await fillAndCheck('1', '1', '1000');
        const result = await $('.result-box');
        await expect(result).toHaveTextContaining('correct date time');
    });
});