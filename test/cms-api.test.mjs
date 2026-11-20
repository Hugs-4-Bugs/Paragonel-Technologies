/**
 * HTTP regression test for the CMS admin API routes (Phase 4, IU-0 slice 2).
 *
 * Requires: the Next.js dev server on http://localhost:3000 AND the Firestore
 * emulator running. Env (JWT_SECRET, ADMIN_EMAIL) must be loaded from .env:
 *   set -a; . ./.env; set +a && node test/cms-api.test.mjs
 *
 * Verifies:
 *   - Unauthenticated requests to every /api/admin/jobs|blog|seed route → 401.
 *   - Authenticated list reads (GET /api/admin/jobs, /api/admin/blog) → 200.
 *   - Invalid input (POST a job missing required fields) → 400 with issues.
 *   - Jobs publishing workflow: create → list contains it → toggle archive →
 *     activate → update → delete → gone.
 *   - Blog publishing workflow: create (Draft) → list → publish (PATCH) →
 *     unpublish → update → delete → gone.
 *   - /api/admin/seed (dev) → 200 with seeded counts.
 *
 * Exit code 0 = pass, 1 = fail.
 */
import { createHmac } from 'node:crypto';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function mintAdminToken() {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) throw new Error('JWT_SECRET missing/weak');
  const email = process.env.ADMIN_EMAIL || 'cms-test@example.test';
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { email, role: 'admin', iat: now, exp: now + 8 * 60 * 60 };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = createHmac('sha256', raw).update(data).digest('base64url');
  return `${data}.${sig}`;
}

let pass = 0;
let fail = 0;
const results = [];
function check(label, ok, detail = '') {
  if (ok) { pass++; results.push(`  PASS  ${label}`); }
  else { fail++; results.push(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`); }
}

const rnd = () => Math.random().toString(36).slice(2, 8);
const authHeaders = (token) => ({ 'Content-Type': 'application/json', Cookie: `qf_admin_token=${token}` });

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: token ? authHeaders(token) : { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  const token = mintAdminToken();
  console.log('\n=== Phase 4 IU-0 slice 2 — CMS API regression ===\n');

  // 1. Unauthenticated → 401 on every CMS route.
  for (const [m, p] of [
    ['GET', '/api/admin/jobs'],
    ['POST', '/api/admin/jobs'],
    ['GET', '/api/admin/blog'],
    ['POST', '/api/admin/blog'],
    ['POST', '/api/admin/seed'],
  ]) {
    const { status } = await req(m, p);
    check(`${m} ${p} unauthenticated → 401`, status === 401, `got ${status}`);
  }

  // 2. Authenticated list reads → 200.
  {
    const j = await req('GET', '/api/admin/jobs', { token });
    check('GET /api/admin/jobs authenticated → 200', j.status === 200, `got ${j.status}`);
    check('GET /api/admin/jobs returns {jobs:[]}', Array.isArray(j.data?.jobs), JSON.stringify(j.data).slice(0, 80));
  }
  {
    const b = await req('GET', '/api/admin/blog', { token });
    check('GET /api/admin/blog authenticated → 200', b.status === 200, `got ${b.status}`);
    check('GET /api/admin/blog returns {posts:[]}', Array.isArray(b.data?.posts), JSON.stringify(b.data).slice(0, 80));
  }

  // 3. Invalid input → 400 with issues.
  {
    const bad = await req('POST', '/api/admin/jobs', { token, body: { jobId: 'X' } });
    check('POST /api/admin/jobs invalid → 400', bad.status === 400, `got ${bad.status}`);
    check('POST /api/admin/jobs invalid returns issues', Array.isArray(bad.data?.issues) && bad.data.issues.length > 0);
  }
  {
    const bad = await req('POST', '/api/admin/blog', { token, body: { title: 'x' } });
    check('POST /api/admin/blog invalid → 400', bad.status === 400, `got ${bad.status}`);
    check('POST /api/admin/blog invalid returns issues', Array.isArray(bad.data?.issues) && bad.data.issues.length > 0);
  }

  // 4. Jobs publishing workflow.
  const jobId = `TST${rnd()}`.toUpperCase();
  const jobBody = {
    jobId,
    title: 'Slice 2 Test Engineer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '1-3 Years',
    skills: 'Testing, Security',
    description: 'A'.repeat(60),
    status: 'Active',
  };
  let createdJobId = null;
  {
    const r = await req('POST', '/api/admin/jobs', { token, body: jobBody });
    check('POST /api/admin/jobs create → 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.data)}`);
    createdJobId = r.data?.id;
    check('create returns id', !!createdJobId);
  }
  if (createdJobId) {
    // GET single
    const g = await req('GET', `/api/admin/jobs/${createdJobId}`, { token });
    check('GET /api/admin/jobs/[id] → 200', g.status === 200, `got ${g.status}`);
    check('created job title matches', g.data?.job?.title === jobBody.title);

    // List contains it
    const list = await req('GET', '/api/admin/jobs', { token });
    check('job appears in list', Array.isArray(list.data?.jobs) && list.data.jobs.some((j) => j.id === createdJobId));

    // Toggle archive
    const arch = await req('PATCH', `/api/admin/jobs/${createdJobId}`, { token, body: { isActive: false } });
    check('PATCH archive job → 200', arch.status === 200, `got ${arch.status}`);
    const afterArch = await req('GET', `/api/admin/jobs/${createdJobId}`, { token });
    check('job isActive=false after archive', afterArch.data?.job?.isActive === false);

    // Toggle activate
    const act = await req('PATCH', `/api/admin/jobs/${createdJobId}`, { token, body: { isActive: true } });
    check('PATCH activate job → 200', act.status === 200, `got ${act.status}`);

    // Update
    const upd = await req('PUT', `/api/admin/jobs/${createdJobId}`, { token, body: { ...jobBody, title: 'Slice 2 Updated Engineer' } });
    check('PUT update job → 200', upd.status === 200, `got ${upd.status}`);
    const afterUpd = await req('GET', `/api/admin/jobs/${createdJobId}`, { token });
    check('job title updated', afterUpd.data?.job?.title === 'Slice 2 Updated Engineer');

    // Delete
    const del = await req('DELETE', `/api/admin/jobs/${createdJobId}`, { token });
    check('DELETE job → 200', del.status === 200, `got ${del.status}`);
    const afterDel = await req('GET', `/api/admin/jobs/${createdJobId}`, { token });
    check('job gone after delete', afterDel.status === 404, `got ${afterDel.status}`);
  }

  // 5. Blog publishing workflow.
  const slug = `slice2-${rnd()}`;
  const blogBody = {
    title: 'Slice 2 Security Test Post',
    slug,
    category: 'Technology',
    author: 'QA',
    thumbnailUrl: '',
    excerpt: 'A'.repeat(12),
    body: 'B'.repeat(60),
    tags: 'security, test',
    status: 'Draft',
  };
  let createdPostId = null;
  {
    const r = await req('POST', '/api/admin/blog', { token, body: blogBody });
    check('POST /api/admin/blog create → 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.data)}`);
    createdPostId = r.data?.id;
    check('create returns id', !!createdPostId);
  }
  if (createdPostId) {
    const g = await req('GET', `/api/admin/blog/${createdPostId}`, { token });
    check('GET /api/admin/blog/[id] → 200', g.status === 200, `got ${g.status}`);
    check('created post status Draft', g.data?.post?.status === 'Draft');

    // Publish
    const pub = await req('PATCH', `/api/admin/blog/${createdPostId}`, { token, body: { status: 'Published' } });
    check('PATCH publish post → 200', pub.status === 200, `got ${pub.status}`);
    const afterPub = await req('GET', `/api/admin/blog/${createdPostId}`, { token });
    check('post status Published after publish', afterPub.data?.post?.status === 'Published');
    check('post publishedAt set', !!afterPub.data?.post?.publishedAt);

    // Unpublish
    const unpub = await req('PATCH', `/api/admin/blog/${createdPostId}`, { token, body: { status: 'Draft' } });
    check('PATCH unpublish post → 200', unpub.status === 200, `got ${unpub.status}`);

    // Update
    const upd = await req('PUT', `/api/admin/blog/${createdPostId}`, { token, body: { ...blogBody, title: 'Slice 2 Updated Post' } });
    check('PUT update post → 200', upd.status === 200, `got ${upd.status}`);

    // Delete
    const del = await req('DELETE', `/api/admin/blog/${createdPostId}`, { token });
    check('DELETE post → 200', del.status === 200, `got ${del.status}`);
    const afterDel = await req('GET', `/api/admin/blog/${createdPostId}`, { token });
    check('post gone after delete', afterDel.status === 404, `got ${afterDel.status}`);
  }

  // 6. Seed route (dev only) → 200 with counts.
  {
    const r = await req('POST', '/api/admin/seed', { token });
    check('POST /api/admin/seed → 200', r.status === 200, `got ${r.status} ${JSON.stringify(r.data)}`);
    check('seed returns counts', r.data?.seeded && typeof r.data.seeded.jobs === 'number');
  }

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('test crashed:', e); process.exit(2); });
