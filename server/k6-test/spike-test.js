import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 5 },  // Bình thường
        { duration: '1m', target: 5 },
        { duration: '10s', target: 200 },  // Đột ngột tăng lên 200 users!
        { duration: '3m', target: 200 },  // Giữ spike
        { duration: '10s', target: 5 },  // Giảm đột ngột về bình thường
        { duration: '3m', target: 5 },  // Recovery
        { duration: '10s', target: 0 },
    ],
};

export default function () {
    const payload = JSON.stringify({ day: '1', month: '1', year: '2024' });
    const params = { headers: { 'Content-Type': 'application/json' } };

    const res = http.post('http://localhost:3001/api/check-date', payload, params);

    check(res, { 'status OK': (r) => r.status === 200 });

    sleep(1);
}