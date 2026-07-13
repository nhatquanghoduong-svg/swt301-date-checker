const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Thuật toán kiểm tra số ngày trong tháng theo Flowchart (Figure 3)
function daysInMonth(year, month) {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) return 31;
    if ([4, 6, 9, 11].includes(month)) return 30;
    if (month === 2) {
        if (year % 400 === 0) return 29;
        if (year % 4 === 0) return 29;
        if (year % 100 === 0) return 28;
        return 28;
    }
    return 0;
}

app.post('/api/check-date', (req, res) => {
    const { day, month, year } = req.body;

    const d = Number(day);
    const m = Number(month);
    const y = Number(year);

    // 1. Kiểm tra định dạng (Incorrect format)
    if (!day || isNaN(d) || !Number.isInteger(d)) {
        return res.json({ success: false, message: "Input data for Day is incorrect format!" });
    }
    if (!month || isNaN(m) || !Number.isInteger(m)) {
        return res.json({ success: false, message: "Input data for Month is incorrect format!" });
    }
    if (!year || isNaN(y) || !Number.isInteger(y)) {
        return res.json({ success: false, message: "Input data for Year is incorrect format!" });
    }

    // 2. Kiểm tra khoảng giới hạn (Out of range)
    if (d < 1 || d > 31) return res.json({ success: false, message: "Input data for Day is out of range!" });
    if (m < 1 || m >= 12) return res.json({ success: false, message: "Input data for Month is out of range!" });
    if (y < 1000 || y > 3000) return res.json({ success: false, message: "Input data for Year is out of range!" });

    // 3. Kiểm tra tính hợp lệ của ngày theo Flowchart (Figure 4)
    if (m >= 1 && m <= 12) {
        if (d >= 1) {
            const maxDays = daysInMonth(y, m);
            if (d <= maxDays) {
                return res.json({
                    success: true,
                    message: `${d}/${m}/${y} is correct date time!`
                });
            }
        }
    }

    return res.json({
        success: false,
        message: `${d}/${m}/${y} is NOT correct date time!`
    });
});

// Export để test được
module.exports = { app, daysInMonth };