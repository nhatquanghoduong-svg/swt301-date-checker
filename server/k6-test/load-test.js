import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time', true);

export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp-up lên 10 users
        { duration: '1m', target: 10 },  // Giữ 10 users trong 1 phút
        { duration: '30s', target: 0 },  // Ramp-down về 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% request < 500ms
        error_rate: ['rate<0.01'],  // Error rate < 1%
    },
};

// Các test case đa dạng
const testCases = [
    { day: '15', month: '6', year: '2024' },  // Valid
    { day: '29', month: '2', year: '2024' },  // Valid (leap year)
    { day: '31', month: '1', year: '2024' },  // Valid
    { day: '31', month: '4', year: '2024' },  // Invalid (April has 30 days)
    { day: '29', month: '2', year: '2023' },  // Invalid (not leap year)
    { day: '0', month: '6', year: '2024' },  // Out of range
    { day: 'abc', month: '6', year: '2024' },  // Wrong format
];

export default function () {
    const tc = testCases[Math.floor(Math.random() * testCases.length)];
    const payload = JSON.stringify(tc);
    const params = { headers: { 'Content-Type': 'application/json' } };

    const res = http.post('http://localhost:3001/api/check-date', payload, params);

    const ok = check(res, {
        'status is 200': (r) => r.status === 200,
        'body has message': (r) => JSON.parse(r.body).message !== undefined,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!ok);
    responseTime.add(res.timings.duration);

    sleep(Math.random() * 2 + 1);  // Sleep 1–3 giây (simulate real user)
}