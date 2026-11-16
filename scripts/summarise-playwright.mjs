/**
 * Reduces a Playwright JSON report to a small, reviewable summary.
 *
 * The review sandbox cannot read Actions artefacts or logs, so the browser job
 * commits this file instead: pass/fail counts, the failing titles and the first
 * part of each error message. It intentionally contains no page HTML and no
 * screenshots — only what a reviewer needs to act on.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [reportPath, stderrPath, statusPath] = process.argv.slice(2);
const read = (path, fallback = '') => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return fallback;
  }
};

let report = null;
try {
  report = JSON.parse(read(reportPath, 'null'));
} catch {
  report = null;
}

const tests = [];
const walk = (suite, path = []) => {
  for (const spec of suite.specs || [])
    for (const test of spec.tests || [])
      for (const result of test.results || [])
        tests.push({
          title: [...path, spec.title].join(' › '),
          status: result.status,
          duration: result.duration,
          error: (result.error?.message || result.errors?.[0]?.message || '')
            .split('\n')
            .slice(0, 12)
            .join('\n')
            .slice(0, 2000),
        });
  for (const child of suite.suites || []) walk(child, [...path, child.title]);
};
if (report?.suites) for (const suite of report.suites) walk(suite, []);

const failed = tests.filter((test) => test.status !== 'passed');
const summary = {
  generatedAt: new Date().toISOString(),
  status: read(statusPath).trim() || 'unknown',
  totals: {
    tests: tests.length,
    passed: tests.filter((t) => t.status === 'passed').length,
    failed: failed.length,
    skipped: tests.filter((t) => t.status === 'skipped').length,
  },
  failures: failed.map(({ title, status, error }) => ({
    title,
    status,
    error,
  })),
  // Anything the runner printed outside the JSON report (install errors,
  // missing browsers, a crash before the first test).
  stderr: read(stderrPath).split('\n').slice(-40).join('\n').slice(0, 4000),
  reportMissing: !report,
};

writeFileSync('browser-report.json', `${JSON.stringify(summary, null, 2)}\n`);
console.log(
  JSON.stringify(summary.totals),
  summary.reportMissing ? 'report missing' : '',
);
