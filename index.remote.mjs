import 'only-server';
import { DataModels as i } from '@5minds/processcube_engine_client';
import { EngineClient as P } from '@5minds/processcube_engine_client';
var y = process.env.PROCESSCUBE_ENGINE_URL ?? 'http://localhost:10560',
  r = new P(y);
async function F(e, t) {
  let n = await r.userTasks.query({ processInstanceId: e, flowNodeId: t });
  return n.totalCount == 0 ? null : n.userTasks[0];
}
async function J(e, t) {
  return new Promise(async (n, s) => {
    let o = r.userTasks.onUserTaskWaiting(async (a) => {
        if (a.processInstanceId === e && a.flowNodeId === t && a.flowNodeInstanceId != null) {
          let k = await S(a.flowNodeInstanceId);
          return k != null ? n(k) : s(new Error(`UserTask with instance ID "${a.flowNodeInstanceId}" does not exist.`));
        }
      }),
      l = await F(e, t);
    l && n(l), await o;
  });
}
async function K(e, t, n) {
  await r.userTasks.finishUserTask(e, t);
  let s = await r.userTasks.query({ flowNodeId: n, state: i.FlowNodeInstances.FlowNodeInstanceState.suspended });
  return s.totalCount > 0 ? s.userTasks[0] : null;
}
async function X(...e) {
  return r.userTasks.query(...e);
}
async function Z(e) {
  return r.userTasks.query({ state: i.FlowNodeInstances.FlowNodeInstanceState.suspended }, e);
}
async function H(e, t) {
  return r.userTasks.query({ flowNodeId: e, state: i.FlowNodeInstances.FlowNodeInstanceState.suspended }, t);
}
async function S(e, t) {
  let n = await r.userTasks.query(
    { flowNodeInstanceId: e, state: i.FlowNodeInstances.FlowNodeInstanceState.suspended },
    t
  );
  return n.userTasks.length ? n.userTasks[0] : null;
}
async function V(e) {
  let t = await r.userTasks.query({ correlationId: e, state: i.FlowNodeInstances.FlowNodeInstanceState.suspended });
  return t.totalCount == 0 ? null : t.userTasks[0];
}
async function z(e, t) {
  let s = (
    await r.userTasks.query({ state: i.FlowNodeInstances.FlowNodeInstanceState.suspended }, { identity: e, ...t })
  ).userTasks.filter((o) => o.actualOwnerId === e.userId);
  return s.length ? s : null;
}
async function Q(e, t) {
  let s = (
    await r.userTasks.query({ state: i.FlowNodeInstances.FlowNodeInstanceState.suspended }, { identity: e, ...t })
  ).userTasks.filter((o) => o.assignedUserIds?.includes(e.userId));
  return s.length ? s : null;
}
import { DataModels as D } from '@5minds/processcube_engine_client';
async function se() {
  let e = await r.processInstances.query({ state: D.ProcessInstances.ProcessInstanceState.running });
  return e.totalCount === 0 ? null : e.processInstances;
}
import { readdir as q } from 'fs/promises';
import { Logger as R } from '@5minds/processcube_engine_sdk';
import { ExternalTaskWorker as _ } from '@5minds/processcube_engine_client';
import p from 'path';
import M from 'esbuild';
import { promises as b } from 'fs';
import { join as W } from 'path';
async function g(e) {
  let t = await b.readdir(e, { withFileTypes: !0 }),
    n = await Promise.all(
      t.map(async (s) => {
        let o = W(e.toString(), s.name);
        return s.isDirectory() ? [o, ...(await g(o))] : [];
      })
    );
  return Array.prototype.concat(...n);
}
var w = { lockDuration: 2e4, maxTasks: 5, longpollingTimeout: 1e3 },
  c = new R('external_task_worker_playground');
async function Te(e) {
  c.info(`Subscribing to external tasks at ${e}`);
  let t = [],
    n = await g(e);
  for (let s of n) {
    let l = (await q(s)).find((d) => d.startsWith('worker') && d.endsWith('.ts'));
    if (!l) continue;
    c.info(`Found worker file in directory '${s}'`);
    let a = p.join(s, l);
    await B(a);
    let f = await import(p.join(s, 'dist', 'worker.js')),
      x = await $(),
      N = (await f.lockDuration) ?? w.lockDuration,
      E = (await f.maxTasks) ?? w.maxTasks,
      U = (await f.longpollingTimeout) ?? w.longpollingTimeout,
      T = p.basename(s),
      m = f.default;
    c.info(`Using handler ${m} ${JSON.stringify(m)} with type ${typeof m}`);
    let h = { lockDuration: N, maxTasks: E, longpollingTimeout: U, identity: x },
      u = new _(y, T, m, h);
    c.info(`Starting external task worker ${u.workerId} for topic '${T}'`),
      u.onWorkerError((d, I, C) => {
        c.error(`Intercepted "${d}"-type error: ${I.message}`, {
          err: I,
          type: d,
          externalTask: C,
          workerId: u.workerId,
        });
      }),
      u.start(),
      t.push(u);
  }
  return t;
}
async function $() {
  return { token: 'ZHVtbXlfdG9rZW4=', userId: 'dummy_token' };
}
async function B(e) {
  let t = await M.build({
    entryPoints: [e],
    outfile: p.join(p.dirname(e), 'dist', 'worker.js'),
    bundle: !0,
    platform: 'node',
    target: 'node14',
    format: 'cjs',
  });
  t.errors.length > 0 && c.error(`Could not transpile worker file '${e}'`, { errors: t.errors }),
    t.warnings.length > 0 && c.warn(`Transpiled worker file '${e}' with warnings`, { warnings: t.warnings });
}
import { revalidatePath as L } from 'next/cache';
import { redirect as A } from 'next/navigation';
async function Pe(e, t) {
  L(e), A(e, t);
}
async function De(...e) {
  return await r.processModels.startProcessInstance(...e);
}
async function be(...e) {
  await r.userTasks.finishUserTask(...e);
}
export {
  be as finishUserTask,
  K as finishUserTaskAndGetNext,
  se as getActiveProcessInstances,
  Q as getAssignedUserTasksByIdentity,
  z as getReservedUserTasksByIdentity,
  X as getUserTasks,
  V as getWaitingUserTaskByCorrelationId,
  S as getWaitingUserTaskByFlowNodeInstanceId,
  Z as getWaitingUserTasks,
  H as getWaitingUserTasksByFlowNodeId,
  Pe as hardNavigate,
  De as startProcess,
  Te as subscribeToExternalTasks,
  J as waitForUserTaskByProcessInstanceId,
};
