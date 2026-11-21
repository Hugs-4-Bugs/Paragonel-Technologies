/**
 * fake-firestore.ts — a minimal in-memory Firestore fake for unit tests.
 *
 * Implements ONLY the subset of the Admin Firestore API used by the auth libs:
 *   db.collection(c).doc(id).get()/set()/update()
 *   db.collection(c).add(data)
 *   db.collection(c).where(f, op, v)[.where(...)].orderBy(f, dir).limit(n).get()
 *   db.batch().set/update/commit()
 *   db.runTransaction(async (tx) => tx.get()/set()/update())
 *
 * Timestamps are REAL firebase-admin Timestamp objects (a pure data holder),
 * so toMillis()/fromMillis() work without mocking firebase-admin/firestore.
 *
 * This is NOT a full Firestore emulator — it is enough to exercise the OTP,
 * bootstrap, and session logic deterministically.
 */
import { Timestamp } from 'firebase-admin/firestore';

type Doc = Record<string, unknown>;

class FakeDocRef {
  constructor(public col: FakeCollection, public id: string) {}
  async get() {
    const data = this.col.docs.get(this.id);
    return { exists: !!data, id: this.id, data: () => data as Doc | undefined, ref: this };
  }
  async set(data: Doc, opts?: { merge?: boolean }) {
    if (opts?.merge) {
      const cur = (this.col.docs.get(this.id) ?? {}) as Doc;
      this.col.docs.set(this.id, { ...cur, ...data });
    } else {
      this.col.docs.set(this.id, { ...data });
    }
  }
  async update(patch: Doc) {
    const cur = (this.col.docs.get(this.id) ?? {}) as Doc;
    this.col.docs.set(this.id, { ...cur, ...patch });
  }
}

class FakeQuery {
  private filters: { field: string; op: string; value: unknown }[] = [];
  private orders: { field: string; dir: 'asc' | 'desc' }[] = [];
  private lim: number | null = null;
  constructor(private col: FakeCollection) {}
  where(field: string, op: string, value: unknown) { this.filters.push({ field, op, value }); return this; }
  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') { this.orders.push({ field, dir }); return this; }
  limit(n: number) { this.lim = n; return this; }
  async get() {
    let rows: { id: string; data: Doc }[] = [];
    for (const [id, data] of this.col.docs) {
      let ok = true;
      for (const f of this.filters) {
        const v = (data as Doc)[f.field];
        if (f.op === '==') { if (v !== f.value) { ok = false; break; } }
        else { ok = false; break; }
      }
      if (ok) rows.push({ id, data });
    }
    for (const o of this.orders) {
      const t = (a: { data: Doc }) => {
        const v = a.data[o.field];
        return v instanceof Timestamp ? v.toMillis() : (v as number) ?? 0;
      };
      rows.sort((a, b) => (o.dir === 'asc' ? t(a) - t(b) : t(b) - t(a)));
    }
    if (this.lim != null) rows = rows.slice(0, this.lim);
    const docs = rows.map((r) => ({ id: r.id, data: () => r.data, exists: true, ref: new FakeDocRef(this.col, r.id) }));
    return { empty: docs.length === 0, docs, size: docs.length };
  }
}

class FakeCollection {
  docs = new Map<string, Doc>();
  doc(id: string) { return new FakeDocRef(this, id); }
  add(data: Doc) {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    this.docs.set(id, { ...data });
    return new FakeDocRef(this, id);
  }
  where(field: string, op: string, value: unknown) {
    const q = new FakeQuery(this);
    return q.where(field, op, value);
  }
  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') { return new FakeQuery(this).orderBy(field, dir); }
  limit(n: number) { return new FakeQuery(this).limit(n); }
  async get() {
    const docs = [...this.docs.entries()].map(([id, data]) => ({ id, data: () => data, exists: true, ref: new FakeDocRef(this, id) }));
    return { empty: docs.length === 0, docs, size: docs.length };
  }
}

class FakeBatch {
  ops: { kind: 'set' | 'update'; ref: FakeDocRef; data: Doc; opts?: { merge?: boolean } }[] = [];
  set(ref: FakeDocRef, data: Doc, opts?: { merge?: boolean }) { this.ops.push({ kind: 'set', ref, data, opts }); return this; }
  update(ref: FakeDocRef, data: Doc) { this.ops.push({ kind: 'update', ref, data }); return this; }
  async commit() { for (const o of this.ops) { if (o.kind === 'set') await o.ref.set(o.data, o.opts); else await o.ref.update(o.data); } }
}

export class FakeFirestore {
  collections = new Map<string, FakeCollection>();
  collection(name: string) {
    let c = this.collections.get(name);
    if (!c) { c = new FakeCollection(); this.collections.set(name, c); }
    return c;
  }
  batch() { return new FakeBatch(); }
  async runTransaction<T>(cb: (tx: { get: (r: FakeDocRef | FakeQuery) => Promise<unknown>; set: (r: FakeDocRef, d: Doc, o?: { merge?: boolean }) => void; update: (r: FakeDocRef, d: Doc) => void }) => Promise<T>): Promise<T> {
    const tx = {
      get: async (r: FakeDocRef | FakeQuery) => (r instanceof FakeDocRef ? r.get() : r.get()),
      set: (r: FakeDocRef, d: Doc, o?: { merge?: boolean }) => { void r.set(d, o); },
      update: (r: FakeDocRef, d: Doc) => { void r.update(d); },
    };
    return cb(tx);
  }
}
