// @ts-check
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

// ============================================================
//  HELPER: Hàm dùng chung để nhập ngày và nhấn Check
// ============================================================
/**
 * @param {import('@playwright/test').Page} page
 * @param {string} day
 * @param {string} month
 * @param {string} year
 */
async function fillAndCheck(page, day, month, year) {
  await page.getByPlaceholder('e.g. 15').fill(day);
  await page.getByPlaceholder('e.g. 6').fill(month);
  await page.getByPlaceholder('e.g. 2024').fill(year);
  await page.getByRole('button', { name: 'Check' }).click();
}

// ============================================================
//  TEST SUITE 1: Kiểm tra giao diện ban đầu (UI Rendering)
// ============================================================
test.describe('UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-UI-01: Trang hiển thị đầy đủ các thành phần', async ({ page }) => {
    await expect(page.locator('.app-title')).toHaveText('Date Time Checker');
    await expect(page.locator('.logo-text')).toHaveText('FPT UNIVERSITY');
    await expect(page.locator('.logo-subtext')).toHaveText('DREAM OF INNOVATION');
    await expect(page.getByPlaceholder('e.g. 15')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. 6')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. 2024')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();
    await percySnapshot(page, 'TC-UI-01: Initial State - All Components Visible');
  });

  test('TC-UI-02: Các input fields ban đầu phải rỗng', async ({ page }) => {
    await expect(page.getByPlaceholder('e.g. 15')).toHaveValue('');
    await expect(page.getByPlaceholder('e.g. 6')).toHaveValue('');
    await expect(page.getByPlaceholder('e.g. 2024')).toHaveValue('');
    await percySnapshot(page, 'TC-UI-02: Initial State - Empty Fields');
  });

  test('TC-UI-03: Không hiển thị result box khi chưa check', async ({ page }) => {
    await expect(page.locator('.result-box')).not.toBeVisible();
    await percySnapshot(page, 'TC-UI-03: Initial State - No Result Box');
  });
});

// ============================================================
//  TEST SUITE 2: Kiểm tra ngày hợp lệ (Valid Dates)
// ============================================================
test.describe('Valid Dates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-VALID-01: Ngày bình thường — 15/6/2024', async ({ page }) => {
    await fillAndCheck(page, '15', '6', '2024');
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toBeVisible();
    await expect(resultBox).toHaveClass(/success/);
    await expect(resultBox).toContainText('15/6/2024 is correct date time!');
    await percySnapshot(page, 'TC-VALID-01: Valid Date 15-6-2024');
  });

  test('TC-VALID-02: Ngày đầu năm — 1/1/2000', async ({ page }) => {
    await fillAndCheck(page, '1', '1', '2000');
    await expect(page.locator('.result-box')).toContainText('1/1/2000 is correct date time!');
    await percySnapshot(page, 'TC-VALID-02: Valid Date 1-1-2000');
  });

  test('TC-VALID-03: Ngày cuối năm — 31/12/2024', async ({ page }) => {
    await fillAndCheck(page, '31', '12', '2024');
    await expect(page.locator('.result-box')).toContainText('31/12/2024 is correct date time!');
    await percySnapshot(page, 'TC-VALID-03: Valid Date 31-12-2024');
  });

  test('TC-VALID-04: Năm nhuận — 29/2/2024', async ({ page }) => {
    await fillAndCheck(page, '29', '2', '2024');
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toHaveClass(/success/);
    await expect(resultBox).toContainText('29/2/2024 is correct date time!');
    await percySnapshot(page, 'TC-VALID-04: Leap Year 29-2-2024');
  });

  test('TC-VALID-05: Năm nhuận chia hết 400 — 29/2/2000', async ({ page }) => {
    await fillAndCheck(page, '29', '2', '2000');
    await expect(page.locator('.result-box')).toContainText('29/2/2000 is correct date time!');
    await percySnapshot(page, 'TC-VALID-05: Leap Year Divisible 400 - 29-2-2000');
  });

  test('TC-VALID-06: Tháng 30 ngày — 30/4/2024', async ({ page }) => {
    await fillAndCheck(page, '30', '4', '2024');
    await expect(page.locator('.result-box')).toContainText('30/4/2024 is correct date time!');
    await percySnapshot(page, 'TC-VALID-06: Valid Date 30-Day Month 30-4-2024');
  });

  test('TC-VALID-07: Biên dưới Year — 1/1/1000', async ({ page }) => {
    await fillAndCheck(page, '1', '1', '1000');
    await expect(page.locator('.result-box')).toHaveClass(/success/);
    await percySnapshot(page, 'TC-VALID-07: Valid Date Lower Boundary Year 1000');
  });

  test('TC-VALID-08: Biên trên Year — 31/12/3000', async ({ page }) => {
    await fillAndCheck(page, '31', '12', '3000');
    await expect(page.locator('.result-box')).toHaveClass(/success/);
    await percySnapshot(page, 'TC-VALID-08: Valid Date Upper Boundary Year 3000');
  });
});

// ============================================================
//  TEST SUITE 3: Kiểm tra ngày không hợp lệ (Invalid Dates)
// ============================================================
test.describe('Invalid Dates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-INVALID-01: Ngày 29/2 năm không nhuận — 29/2/2023', async ({ page }) => {
    await fillAndCheck(page, '29', '2', '2023');
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toHaveClass(/error/);
    await expect(resultBox).toContainText('29/2/2023 is NOT correct date time!');
    await percySnapshot(page, 'TC-INVALID-01: Non-Leap Year 29-2-2023');
  });

  test('TC-INVALID-02: Ngày 31 tháng 4 — 31/4/2024', async ({ page }) => {
    await fillAndCheck(page, '31', '4', '2024');
    await expect(page.locator('.result-box')).toHaveClass(/error/);
    await percySnapshot(page, 'TC-INVALID-02: Invalid Date 31-4-2024');
  });

  test('TC-INVALID-03: Ngày 30/2 — 30/2/2024', async ({ page }) => {
    await fillAndCheck(page, '30', '2', '2024');
    await expect(page.locator('.result-box')).toHaveClass(/error/);
    await percySnapshot(page, 'TC-INVALID-03: Invalid Date 30-2-2024');
  });

  test('TC-INVALID-04: Năm chia hết 100 nhưng không chia hết 400 — 29/2/1900', async ({ page }) => {
    await fillAndCheck(page, '29', '2', '1900');
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toHaveClass(/error/);
    await expect(resultBox).toContainText('29/2/1900 is NOT correct date time!');
    await percySnapshot(page, 'TC-INVALID-04: Century Non-Leap Year 29-2-1900');
  });
});

// ============================================================
//  TEST SUITE 4: Kiểm tra Out of Range
// ============================================================
test.describe('Out of Range', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-RANGE-01: Day = 0', async ({ page }) => {
    await fillAndCheck(page, '0', '6', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Day is out of range!');
    await percySnapshot(page, 'TC-RANGE-01: Day Out of Range - Day 0');
  });

  test('TC-RANGE-02: Day = 32', async ({ page }) => {
    await fillAndCheck(page, '32', '6', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Day is out of range!');
    await percySnapshot(page, 'TC-RANGE-02: Day Out of Range - Day 32');
  });

  test('TC-RANGE-03: Month = 0', async ({ page }) => {
    await fillAndCheck(page, '15', '0', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Month is out of range!');
    await percySnapshot(page, 'TC-RANGE-03: Month Out of Range - Month 0');
  });

  test('TC-RANGE-04: Month = 13', async ({ page }) => {
    await fillAndCheck(page, '15', '13', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Month is out of range!');
    await percySnapshot(page, 'TC-RANGE-04: Month Out of Range - Month 13');
  });

  test('TC-RANGE-05: Year = 999 (dưới biên)', async ({ page }) => {
    await fillAndCheck(page, '15', '6', '999');
    await expect(page.locator('.result-box')).toContainText('Input data for Year is out of range!');
    await percySnapshot(page, 'TC-RANGE-05: Year Out of Range - Year 999');
  });

  test('TC-RANGE-06: Year = 3001 (trên biên)', async ({ page }) => {
    await fillAndCheck(page, '15', '6', '3001');
    await expect(page.locator('.result-box')).toContainText('Input data for Year is out of range!');
    await percySnapshot(page, 'TC-RANGE-06: Year Out of Range - Year 3001');
  });
});

// ============================================================
//  TEST SUITE 5: Kiểm tra Incorrect Format
// ============================================================
test.describe('Incorrect Format', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-FORMAT-01: Day là chữ — "abc"', async ({ page }) => {
    await fillAndCheck(page, 'abc', '6', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Day is incorrect format!');
    await percySnapshot(page, 'TC-FORMAT-01: Incorrect Format - Day is Text');
  });

  test('TC-FORMAT-02: Month là chữ — "xyz"', async ({ page }) => {
    await fillAndCheck(page, '15', 'xyz', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Month is incorrect format!');
    await percySnapshot(page, 'TC-FORMAT-02: Incorrect Format - Month is Text');
  });

  test('TC-FORMAT-03: Year là chữ — "abcd"', async ({ page }) => {
    await fillAndCheck(page, '15', '6', 'abcd');
    await expect(page.locator('.result-box')).toContainText('Input data for Year is incorrect format!');
    await percySnapshot(page, 'TC-FORMAT-03: Incorrect Format - Year is Text');
  });

  test('TC-FORMAT-04: Day là số thập phân — "1.5"', async ({ page }) => {
    await fillAndCheck(page, '1.5', '6', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Day is incorrect format!');
    await percySnapshot(page, 'TC-FORMAT-04: Incorrect Format - Day is Decimal');
  });

  test('TC-FORMAT-05: Day để trống', async ({ page }) => {
    await fillAndCheck(page, '', '6', '2024');
    await expect(page.locator('.result-box')).toContainText('Input data for Day is incorrect format!');
    await percySnapshot(page, 'TC-FORMAT-05: Incorrect Format - Day Empty');
  });

  test('TC-FORMAT-06: Tất cả fields để trống', async ({ page }) => {
    await fillAndCheck(page, '', '', '');
    await expect(page.locator('.result-box')).toContainText('incorrect format');
    await percySnapshot(page, 'TC-FORMAT-06: Incorrect Format - All Fields Empty');
  });
});

// ============================================================
//  TEST SUITE 6: Kiểm tra nút Clear
// ============================================================
test.describe('Clear Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-CLEAR-01: Clear xóa trắng tất cả input', async ({ page }) => {
    await page.getByPlaceholder('e.g. 15').fill('25');
    await page.getByPlaceholder('e.g. 6').fill('12');
    await page.getByPlaceholder('e.g. 2024').fill('2024');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByPlaceholder('e.g. 15')).toHaveValue('');
    await expect(page.getByPlaceholder('e.g. 6')).toHaveValue('');
    await expect(page.getByPlaceholder('e.g. 2024')).toHaveValue('');
    await percySnapshot(page, 'TC-CLEAR-01: After Clear - All Fields Empty');
  });

  test('TC-CLEAR-02: Clear ẩn result box', async ({ page }) => {
    await fillAndCheck(page, '15', '6', '2024');
    await expect(page.locator('.result-box')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('.result-box')).not.toBeVisible();
    await percySnapshot(page, 'TC-CLEAR-02: After Clear - Result Box Hidden');
  });
});

// ============================================================
//  TEST SUITE 7: Kiểm tra nút Close (dialog confirm)
// ============================================================
test.describe('Close Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-CLOSE-01: Nhấn Close hiển thị dialog xác nhận', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.locator('.close-btn').click();
    expect(dialogMessage).toBe('Are you sure to exit?');
    await percySnapshot(page, 'TC-CLOSE-01: After Close Dialog Dismissed');
  });

  test('TC-CLOSE-02: Cancel trên dialog — trang vẫn còn', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await page.locator('.close-btn').click();
    await expect(page.locator('.app-title')).toBeVisible();
    await percySnapshot(page, 'TC-CLOSE-02: After Cancel - Page Still Visible');
  });
});