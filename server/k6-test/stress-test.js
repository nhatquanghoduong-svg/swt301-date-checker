import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 50 },  // Ramp-up lên 50 users
        { duration: '5m', target: 50 },  // Giữ 50 users
        { duration: '2m', target: 100 },  // Tăng lên 100 users
        { duration: '5m', target: 100 },  // Giữ 100 users
        { duration: '2m', target: 200 },  // Tăng lên 200 users
        { duration: '5m', target: 200 },  // Giữ 200 users — đây là stress zone
        { duration: '5m', target: 0 },  // Ramp-down
    ],
    thresholds: {
        http_req_failed: ['rate<0.1'],   // Error rate < 10% khi stress
        http_req_duration: ['p(99)<3000'], // 99% request < 3 giây
    },
};

export default function () {
    const payload = JSON.stringify({ day: '15', month: '6', year: '2024' });
    const params = { headers: { 'Content-Type': 'application/json' } };

    const res = http.post('http://localhost:3001/api/check-date', payload, params);

    check(res, { 'status is 200': (r) => r.status === 200 });

    sleep(1);
}