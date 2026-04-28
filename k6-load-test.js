/**
 * k6 Load Test Script for Micro Store
 * 
 * 
 * Run with more VUs:
 *   k6 run --vus 100 --duration 60s k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom Metrics ───────────────────────────────────────────────────
const errorRate = new Rate('errors');
const productLoadTime = new Trend('product_load_time');

// ── Test Configuration ───────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10  },  // Ramp up to 10 users
    { duration: '1m',  target: 50  },  // Hold at 50 users
    { duration: '30s', target: 100 },  // Spike to 100 users
    { duration: '1m',  target: 100 },  // Sustain the spike
    { duration: '30s', target: 0   },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:   ['rate<0.05'],   // Less than 5% errors
    errors:            ['rate<0.05'],
  },
};

const BASE_URL = 'http://staging.48.216.152.209.nip.io';

// ── Test Scenarios ───────────────────────────────────────────────────
export default function () {
  // 1. Load homepage
  const homepageRes = http.get(`${BASE_URL}/`);
  check(homepageRes, {
    'homepage status 200': (r) => r.status === 200,
  });
  errorRate.add(homepageRes.status !== 200);

  sleep(1);

  // 2. Load product list
  const start = Date.now();
  const productsRes = http.get(`${BASE_URL}/api/products`);
  productLoadTime.add(Date.now() - start);
  
  check(productsRes, {
    'products API status 200': (r) => r.status === 200,
    'products returned':       (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) && body.length > 0;
      } catch { return false; }
    },
  });
  errorRate.add(productsRes.status !== 200);

  sleep(1);

  // 3. Load a single product
  try {
    const products = JSON.parse(productsRes.body);
    if (products.length > 0) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const productRes = http.get(`${BASE_URL}/api/products/${randomProduct._id}`);
      check(productRes, {
        'single product status 200': (r) => r.status === 200,
      });
      errorRate.add(productRes.status !== 200);
    }
  } catch (_) {}

  sleep(1);

  // 4. Health check (gateway)
  const healthRes = http.get(`${BASE_URL}/api/gateway/health`);
  check(healthRes, {
    'gateway health OK': (r) => r.status === 200,
  });
  errorRate.add(healthRes.status !== 200);

  sleep(Math.random() * 2); // Random think time between 0-2s
}

// ── Summary ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  const passed = data.metrics.http_req_failed.values.rate < 0.05;
  console.log(`\n🏁 Load Test Complete`);
  console.log(`   Total Requests:    ${data.metrics.http_reqs.values.count}`);
  console.log(`   Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(0)}ms`);
  console.log(`   p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  console.log(`   Error Rate:        ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`   Result:            ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  return {};
}
