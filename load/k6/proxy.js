import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Basic proxy load test.
 * Usage:
 *   API_URL=http://localhost:4010 API_KEY=lgw_live_... k6 run load/k6/proxy.js
 */
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:4010';
const API_KEY = __ENV.API_KEY || '';

export default function () {
  const res = http.post(
    `${API_URL}/v1/chat/completions`,
    JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
      temperature: 0,
      max_tokens: 16,
    }),
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  check(res, {
    'status is 200 or 400-level business error': (r) =>
      r.status === 200 || r.status === 400 || r.status === 401 || r.status === 402,
  });
  sleep(0.5);
}
