import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,        // 1 virtual user
    duration: '10s',
};

const BASE_URL = 'http://localhost:3001';

export default function () {
    const payload = JSON.stringify({ day: '15', month: '6', year: '2024' });
    const params = { headers: { 'Content-Type': 'application/json' } };

    const res = http.post(`${BASE_URL}/api/check-date`, payload, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has success': (r) => JSON.parse(r.body).success === true,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });

    sleep(1);
}