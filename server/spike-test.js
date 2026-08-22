import http from "k6/http";
import { check } from "k6";

const API_URL = __ENV.API_URL;
const NORMAL_RATE = Number(__ENV.NORMAL_RATE || 5);
const SPIKE_RATE = Number(__ENV.SPIKE_RATE || 25);


export const options = {
  scenarios: {
    spike: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: Number(__ENV.PREALLOCATED_VUS || 100),
      stages: [
        { duration: "30s", target: NORMAL_RATE },
        { duration: "1m", target: NORMAL_RATE },
        { duration: "10s", target: SPIKE_RATE },
        { duration: "30s", target: SPIKE_RATE },
        { duration: "10s", target: NORMAL_RATE },
        { duration: "1m", target: NORMAL_RATE },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    dropped_iterations: ["count==0"],
  },
};

export default function () {
  const response = http.get(`${API_URL}/health`, {
    headers: { "User-Agent": "EchoMind-k6-load-test" },
    tags: { endpoint: "health" },
  });

  check(response, {
    "health returns 200": (res) => res.status === 200,
    "health response is valid": (res) => {
      if (res.status !== 200 || !res.body) return false;
      try {
        return res.json("ok") === true;
      } catch {
        return false;
      }
    },
  });
}
