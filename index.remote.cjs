'use strict';
var j = Object.create;
var k = Object.defineProperty;
var O = Object.getOwnPropertyDescriptor;
var G = Object.getOwnPropertyNames;
var v = Object.getPrototypeOf,
  J = Object.prototype.hasOwnProperty;
var K = (e, t) => {
    for (var s in t) k(e, s, { get: t[s], enumerable: !0 });
  },
  N = (e, t, s, r) => {
    if ((t && typeof t == 'object') || typeof t == 'function')
      for (let o of G(t))
        !J.call(e, o) && o !== s && k(e, o, { get: () => t[o], enumerable: !(r = O(t, o)) || r.enumerable });
    return e;
  };
var E = (e, t, s) => (
    (s = e != null ? j(v(e)) : {}), N(t || !e || !e.__esModule ? k(s, 'default', { value: e, enumerable: !0 }) : s, e)
  ),
  X = (e) => N(k({}, '__esModule', { value: !0 }), e);
var ue = {};
K(ue, {
  finishUserTask: () => le,
  finishUserTaskAndGetNext: () => V,
  getActiveProcessInstances: () => re,
  getAssignedUserTasksByIdentity: () => se,
  getReservedUserTasksByIdentity: () => te,
  getUserTasks: () => z,
  getWaitingUserTaskByCorrelationId: () => ee,
  getWaitingUserTaskByFlowNodeInstanceId: () => h,
  getWaitingUserTasks: () => Q,
  getWaitingUserTasksByFlowNodeId: () => Y,
  hardNavigate: () => ie,
  startProcess: () => ce,
  subscribeToExternalTasks: () => ne,
  waitForUserTaskByProcessInstanceId: () => H,
});
module.exports = X(ue);
var Me = require('only-server');
var a = require('@5minds/processcube_engine_client');
var U = require('@5minds/processcube_engine_client'),
  g = process.env.PROCESSCUBE_ENGINE_URL ?? 'http://localhost:10560',
  n = new U.EngineClient(g);
async function Z(e, t) {
  let s = await n.userTasks.query({ processInstanceId: e, flowNodeId: t });
  return s.totalCount == 0 ? null : s.userTasks[0];
}
async function H(e, t) {
  return new Promise(async (s, r) => {
    let o = n.userTasks.onUserTaskWaiting(async (i) => {
        if (i.processInstanceId === e && i.flowNodeId === t && i.flowNodeInstanceId != null) {
          let y = await h(i.flowNodeInstanceId);
          return y != null ? s(y) : r(new Error(`UserTask with instance ID "${i.flowNodeInstanceId}" does not exist.`));
        }
      }),
      u = await Z(e, t);
    u && s(u), await o;
  });
}
async function V(e, t, s) {
  await n.userTasks.finishUserTask(e, t);
  let r = await n.userTasks.query({
    flowNodeId: s,
    state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });
  return r.totalCount > 0 ? r.userTasks[0] : null;
}
async function z(...e) {
  return n.userTasks.query(...e);
}
async function Q(e) {
  return n.userTasks.query({ state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended }, e);
}
async function Y(e, t) {
  return n.userTasks.query({ flowNodeId: e, state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended }, t);
}
async function h(e, t) {
  let s = await n.userTasks.query(
    { flowNodeInstanceId: e, state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended },
    t
  );
  return s.userTasks.length ? s.userTasks[0] : null;
}
async function ee(e) {
  let t = await n.userTasks.query({
    correlationId: e,
    state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });
  return t.totalCount == 0 ? null : t.userTasks[0];
}
async function te(e, t) {
  let r = (
    await n.userTasks.query(
      { state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended },
      { identity: e, ...t }
    )
  ).userTasks.filter((o) => o.actualOwnerId === e.userId);
  return r.length ? r : null;
}
async function se(e, t) {
  let r = (
    await n.userTasks.query(
      { state: a.DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended },
      { identity: e, ...t }
    )
  ).userTasks.filter((o) => o.assignedUserIds?.includes(e.userId));
  return r.length ? r : null;
}
var C = require('@5minds/processcube_engine_client');
async function re() {
  let e = await n.processInstances.query({ state: C.DataModels.ProcessInstances.ProcessInstanceState.running });
  return e.totalCount === 0 ? null : e.processInstances;
}
var S = require('fs/promises'),
  D = require('@5minds/processcube_engine_sdk'),
  b = require('@5minds/processcube_engine_client');
var l = E(require('path'), 1),
  W = E(require('esbuild'), 1);
var P = require('fs'),
  F = require('path');
async function w(e) {
  let t = await P.promises.readdir(e, { withFileTypes: !0 }),
    s = await Promise.all(
      t.map(async (r) => {
        let o = (0, F.join)(e.toString(), r.name);
        return r.isDirectory() ? [o, ...(await w(o))] : [];
      })
    );
  return Array.prototype.concat(...s);
}
var T = { lockDuration: 2e4, maxTasks: 5, longpollingTimeout: 1e3 },
  c = new D.Logger('external_task_worker_playground');
async function ne(e) {
  c.info(`Subscribing to external tasks at ${e}`);
  let t = [],
    s = await w(e);
  for (let r of s) {
    let u = (await (0, S.readdir)(r)).find((p) => p.startsWith('worker') && p.endsWith('.ts'));
    if (!u) continue;
    c.info(`Found worker file in directory '${r}'`);
    let i = l.default.join(r, u);
    await ae(i);
    const { inspect } = require('node:util');
    console.log(inspect(require.resolve(l.default.join(r, 'dist', 'worker.js'))), 'require.resolve');
    console.log(inspect(await import(l.default.join(r, 'dist', 'worker.js'))), 'import');
    let f = await import(l.default.join(r, 'dist', 'worker.js')),
      _ = await oe(),
      M = (await f.lockDuration) ?? T.lockDuration,
      $ = (await f.maxTasks) ?? T.maxTasks,
      B = (await f.longpollingTimeout) ?? T.longpollingTimeout,
      I = l.default.basename(r),
      m = f.default;
    c.info(`Using handler ${m} ${JSON.stringify(m)} with type ${typeof m}`);
    let L = { lockDuration: M, maxTasks: $, longpollingTimeout: B, identity: _ },
      d = new b.ExternalTaskWorker(g, I, m, L);
    c.info(`Starting external task worker ${d.workerId} for topic '${I}'`),
      d.onWorkerError((p, x, A) => {
        c.error(`Intercepted "${p}"-type error: ${x.message}`, {
          err: x,
          type: p,
          externalTask: A,
          workerId: d.workerId,
        });
      }),
      d.start(),
      t.push(d);
  }
  return t;
}
async function oe() {
  return { token: 'ZHVtbXlfdG9rZW4=', userId: 'dummy_token' };
}
async function ae(e) {
  let t = await W.default.build({
    entryPoints: [e],
    outfile: l.default.join(l.default.dirname(e), 'dist', 'worker.js'),
    bundle: !0,
    platform: 'node',
    target: 'node14',
    format: 'cjs',
  });
  t.errors.length > 0 && c.error(`Could not transpile worker file '${e}'`, { errors: t.errors }),
    t.warnings.length > 0 && c.warn(`Transpiled worker file '${e}' with warnings`, { warnings: t.warnings });
}
var q = require('next/cache'),
  R = require('next/navigation');
async function ie(e, t) {
  (0, q.revalidatePath)(e), (0, R.redirect)(e, t);
}
async function ce(...e) {
  return await n.processModels.startProcessInstance(...e);
}
async function le(...e) {
  await n.userTasks.finishUserTask(...e);
}
0 &&
  (module.exports = {
    finishUserTask,
    finishUserTaskAndGetNext,
    getActiveProcessInstances,
    getAssignedUserTasksByIdentity,
    getReservedUserTasksByIdentity,
    getUserTasks,
    getWaitingUserTaskByCorrelationId,
    getWaitingUserTaskByFlowNodeInstanceId,
    getWaitingUserTasks,
    getWaitingUserTasksByFlowNodeId,
    hardNavigate,
    startProcess,
    subscribeToExternalTasks,
    waitForUserTaskByProcessInstanceId,
  });
