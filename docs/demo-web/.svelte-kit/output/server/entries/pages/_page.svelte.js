import { e as escape_html, a0 as attr_class, a1 as stringify, a2 as attributes, a3 as attr, a4 as clsx, a5 as spread_props, $ as derived, a6 as ensure_array_like } from "../../chunks/index.js";
import { d as dev } from "../../chunks/utils.js";
function Card($$renderer, $$props) {
  let { children, title, description } = $$props;
  $$renderer.push(`<section class="glass mx-auto my-5 max-w-lg min-w-sm flex-col items-start rounded-lg shadow-lg outline outline-black/5 svelte-1hoc7qx"><div class="p-4 text-slate-900"><h2 class="text-2xl font-semibold">${escape_html(title)}</h2> <div class="mt-1 text-sm">${escape_html(description)}</div></div> <div class="p-4 pt-0">`);
  children?.($$renderer);
  $$renderer.push(`<!----></div></section>`);
}
function Output($$renderer, $$props) {
  let { children, disabled } = $$props;
  $$renderer.push(`<div${attr_class(
    ` fira-code min-h-10 w-full content-center rounded-sm px-3.5 py-2.5 text-[0.8em] outline-[.5px] outline-slate-600/60 ${stringify(disabled ? "cursor-not-allowed bg-zinc-300 text-zinc-300" : "bg-white text-gray-800")} `,
    "svelte-1sfob3u"
  )}>`);
  if (!disabled) {
    $$renderer.push("<!--[0-->");
    children?.($$renderer);
    $$renderer.push(`<!---->`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></div>`);
}
const PERF_TEST_COUNT = 1e6;
function runPerformanceTest(fn, size = PERF_TEST_COUNT) {
  const start = performance.now();
  const ids = [];
  for (let index = 0; index < size; index++) {
    ids.push(fn());
  }
  const end = performance.now();
  const idsPerSecond = Math.round(size / ((end - start) / 1e3));
  const formatted = {
    size: size.toLocaleString(),
    time: (end - start).toFixed(1),
    idsPerSecond: idsPerSecond.toLocaleString()
  };
  return {
    time: end - start,
    idsPerSecond,
    sampleIds: ids.slice(-3),
    toString: () => `Generated ${formatted.size} ids in ${formatted.time}ms (ids/second: ${formatted.idsPerSecond})`
  };
}
function Person_running($$renderer, $$props) {
  const { $$slots, $$events, ...p } = $$props;
  $$renderer.push(`<svg${attributes(
    {
      viewBox: "0 0 448 512",
      width: "1.06em",
      height: "1.2em",
      ...p
    },
    void 0,
    void 0,
    void 0,
    3
  )}><path fill="currentColor" d="M320 48a48 48 0 1 0-96 0a48 48 0 1 0 96 0M125.7 175.5c9.9-9.9 23.4-15.5 37.5-15.5c1.9 0 3.8.1 5.6.3L137.6 254c-9.3 28 1.7 58.8 26.8 74.5l86.2 53.9l-25.4 88.8c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l28.7-100.4c5.9-20.6-2.6-42.6-20.7-53.9L238 299l30.9-82.4l5.1 12.3c15 35.8 49.9 59.1 88.7 59.1H384c17.7 0 32-14.3 32-32s-14.3-32-32-32h-21.3c-12.9 0-24.6-7.8-29.5-19.7l-6.3-15c-14.6-35.1-44.1-61.9-80.5-73.1l-48.7-15C186.6 97.8 175 96 163.3 96c-31 0-60.8 12.3-82.7 34.3l-23.2 23.1c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l23.1-23.1zM91.2 352H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h69.6c19 0 36.2-11.2 43.9-28.5l11.5-25.9l-9.5-6a95.4 95.4 0 0 1-37.9-44.9z"></path></svg>`);
}
function Gen_batch($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { output, onclick, disabled } = $$props;
    function formatResult(speed) {
      const elapsed = speed.toFixed(2);
      Math.round(PERF_TEST_COUNT / (speed / 1e3)).toLocaleString();
      return `Generated ${PERF_TEST_COUNT.toLocaleString()} ids in ${elapsed}ms`;
    }
    $$renderer2.push(`<div class="mt-3 flex w-full flex-row items-center"><span class="flex pr-3"><button${attr("disabled", disabled, true)} aria-label="Run performance test" title="Run performance test"${attr_class(` group flex h-8 w-8 content-center items-center justify-center rounded-full shadow-md shadow-gray-400 ${stringify(disabled ? "cursor-not-allowed disabled:bg-gray-600" : "cursor-pointer bg-indigo-500 transition-all hover:bg-purple-600 active:translate-y-[1px] active:bg-purple-700")}`)}>`);
    Person_running($$renderer2, {
      class: disabled ? "text-gray-300" : "text-indigo-50 active:text-white"
    });
    $$renderer2.push(`<!----></button></span> `);
    Output($$renderer2, {
      disabled,
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->${escape_html(typeof output === "number" ? formatResult(output) : "< Run performance test")}`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
function Plus($$renderer, $$props) {
  const { $$slots, $$events, ...p } = $$props;
  $$renderer.push(`<svg${attributes(
    {
      viewBox: "0 0 448 512",
      width: "1.06em",
      height: "1.2em",
      ...p
    },
    void 0,
    void 0,
    void 0,
    3
  )}><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z"></path></svg>`);
}
function Gen_xid($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { output, onclick, disabled } = $$props;
    $$renderer2.push(`<div class="relative mt-3 flex w-full flex-row items-center"><span class="flex pr-3"><button${attr("disabled", disabled, true)} aria-label="Create new XID" title="Create new XID"${attr_class(` group flex h-8 w-8 content-center items-center justify-center rounded-full shadow-md shadow-gray-400 ${stringify(disabled ? "cursor-not-allowed disabled:bg-gray-600" : "cursor-pointer bg-lime-600 transition-all hover:bg-lime-700 active:translate-y-[1px] active:bg-lime-800")}`)}>`);
    Plus($$renderer2, {
      class: disabled ? "text-gray-300" : "text-indigo-50 active:text-white"
    });
    $$renderer2.push(`<!----></button></span> `);
    Output($$renderer2, {
      disabled,
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->${escape_html(output || "< Generate a new XID")}`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
function Cta($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children, onclick, disabled = false, variant = "blue" } = $$props;
    $$renderer2.push(`<button${attr("disabled", disabled, true)}${attr_class(clsx([
      "max-h-10 place-self-center rounded-lg border-b-[4px] px-6 py-2 text-sm font-semibold text-white transition-all",
      variant === "blue" && "border-blue-600 bg-blue-500",
      variant === "lime" && "border-lime-700 bg-lime-600",
      variant === "indigo" && "border-indigo-600 bg-indigo-500",
      variant === "orange" && "border-amber-700 bg-orange-500",
      !disabled && "cursor-pointer hover:brightness-110 active:translate-y-[1px] active:border-b-[4px] active:brightness-90"
    ]))}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></button>`);
  });
}
function WorkerWrapper(options) {
  return new Worker(
    "/nexid/_app/immutable/workers/index-MU4NJWgF.js",
    {
      name: options?.name
    }
  );
}
function Dedicated_worker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isWorkerReady = false;
    let xidResult = void 0;
    let batchResult = void 0;
    let ctaProps = derived(() => ({
      disabled: isWorkerReady,
      variant: isWorkerReady ? "orange" : "blue"
    }));
    let worker;
    function startWorker() {
      if (isWorkerReady) return;
      worker = new WorkerWrapper();
      worker.onmessage = onMessage;
      sendMessage("init");
    }
    function onMessage(e) {
      const { data } = e;
      if (typeof data?.type !== "string") return;
      switch (data.type) {
        case "ready":
          {
            isWorkerReady = true;
          }
          return;
        case "xid-generated":
          {
            xidResult = data.payload.xid;
          }
          return;
        case "batch-generated":
          {
            batchResult = data.payload.time;
          }
          return;
      }
    }
    function sendMessage(type, payload) {
      worker.postMessage({ type, payload });
    }
    function newXID() {
      sendMessage("new-xid");
    }
    function newBatch() {
      sendMessage("new-batch", { size: PERF_TEST_COUNT });
    }
    Card($$renderer2, {
      title: "Dedicated worker (standard web workers)",
      description: `Generate XIDs using a dedicated web worker (one per page):`,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="flex flex-row items-center justify-end">`);
        Cta($$renderer3, spread_props([
          ctaProps(),
          {
            onclick: () => startWorker(),
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(isWorkerReady ? "Worker started!" : "Start dedicated worker")}`);
            },
            $$slots: { default: true }
          }
        ]));
        $$renderer3.push(`<!----></div> `);
        Gen_xid($$renderer3, {
          onclick: () => newXID(),
          disabled: !isWorkerReady,
          output: xidResult
        });
        $$renderer3.push(`<!----> `);
        Gen_batch($$renderer3, {
          onclick: () => newBatch(),
          disabled: !isWorkerReady,
          output: batchResult
        });
        $$renderer3.push(`<!---->`);
      }
    });
  });
}
const BACKGROUND = "oklch(27.4% 0.006 286.033)";
const TEXT = "oklch(92.9% 0.013 255.508)";
const ERROR_H = "oklch(57.7% 0.245 27.325)";
const ERROR_T = "oklch(70.4% 0.191 22.216)";
const TextColors = {
  cyan: "oklch(71.5% 0.143 215.221)",
  lime: "oklch(84.1% 0.238 128.85)",
  amber: "oklch(82.8% 0.189 84.429)",
  fuchsia: "oklch(59.1% 0.293 322.896)",
  teal: "oklch(60% 0.118 184.704)",
  green: "oklch(62.7% 0.194 149.214)",
  sky: "oklch(74.6% 0.16 232.661)",
  indigo: "oklch(51.1% 0.262 276.966)",
  violet: "oklch(54.1% 0.281 293.009)",
  pink: "oklch(59.2% 0.249 0.584)",
  blue: "oklch(62.3% 0.214 259.815)",
  orange: "oklch(75% 0.183 55.934)",
  emerald: "oklch(59.6% 0.145 163.225)"
};
function Logger(variant, prefix) {
  return {
    log(...args) {
      console.log(
        `%c[${prefix}]%c`,
        `background: ${BACKGROUND}; color: ${TextColors[variant]}; font-weight: bold; line-height: 1rem;`,
        `background: ${BACKGROUND}; color: ${TEXT}; line-height: 1rem`,
        ...args
      );
    },
    error(...args) {
      console.error(
        `%c[${prefix}]%c`,
        `background: ${BACKGROUND}; color: ${ERROR_H}; font-weight: bold; line-height: 1rem;`,
        `background: ${BACKGROUND}; color: ${ERROR_T}; line-height: 1rem`,
        ...args
      );
    }
  };
}
function Service_worker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let pageState = { ready: false, worker: null, registration: null, error: null };
    let uiState = { xid: null, batch: null };
    const WORKER_URL = "/nexid/service-worker.js";
    const logger = Logger("lime", "SW:Client");
    function Messenger(sw) {
      function sendMessage(type, payload) {
        if (!sw) return;
        sw.postMessage({ type, payload });
      }
      return { sendMessage };
    }
    function waitForActivation(reg) {
      return new Promise((resolve, reject) => {
        const sw = reg.installing || reg.waiting || reg.active;
        if (!sw) return reject(`Invalid service worker state (${sw})`);
        if (sw.state === "activated") {
          resolve(sw);
        } else {
          sw.addEventListener("statechange", function onStateChange() {
            if (sw.state === "activated") {
              resolve(sw);
              sw.removeEventListener("statechange", onStateChange);
            }
          });
        }
      });
    }
    async function registerWorker() {
      Math.random().toString(16).slice(2, 8);
      const url = WORKER_URL;
      try {
        const registration = await navigator.serviceWorker.register(url, { type: dev ? "module" : "classic" });
        if (!registration) throw new Error("Unable to install service worker");
        waitForActivation(registration).then((worker) => {
          pageState.registration = registration;
          pageState.worker = worker;
          pageState.ready = true;
        });
      } catch (error) {
        pageState.error = `Error while trying to install the service worker at url ${url} (${error})`;
      }
    }
    async function unregisterWorker() {
      if (pageState.registration) {
        const res = await pageState.registration.unregister();
        if (res) {
          logger.log("Worker unregistered successfully");
          pageState = { ready: false, registration: null, worker: null, error: null };
        }
      }
    }
    function newXID() {
      Messenger(pageState.worker).sendMessage("new-xid");
    }
    function newBatch() {
      Messenger(pageState.worker).sendMessage("new-batch", { size: PERF_TEST_COUNT });
    }
    Card($$renderer2, {
      title: "Service worker",
      description: `Generate XIDs using a background service worker (persists after page close):`,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="flex flex-row items-center justify-between">`);
        if (pageState.ready) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="all-small-caps text-lg font-semibold text-lime-600">Worker active!</p> `);
          Cta($$renderer3, {
            variant: "lime",
            onclick: () => unregisterWorker(),
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->Unregister worker`);
            }
          });
          $$renderer3.push(`<!---->`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<p class="all-small-caps text-lg font-semibold text-sky-700">No worker registered yet</p> `);
          Cta($$renderer3, {
            variant: "blue",
            onclick: () => registerWorker(),
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->Register worker`);
            }
          });
          $$renderer3.push(`<!---->`);
        }
        $$renderer3.push(`<!--]--></div> `);
        Gen_xid($$renderer3, {
          onclick: () => newXID(),
          disabled: !pageState.ready,
          output: uiState.xid
        });
        $$renderer3.push(`<!----> `);
        Gen_batch($$renderer3, {
          onclick: () => newBatch(),
          disabled: !pageState.ready,
          output: uiState.batch
        });
        $$renderer3.push(`<!---->`);
      }
    });
  });
}
const SvelteMap = globalThis.Map;
function Circle_xmark($$renderer, $$props) {
  const { $$slots, $$events, ...p } = $$props;
  $$renderer.push(`<svg${attributes(
    {
      viewBox: "0 0 512 512",
      width: "1.2em",
      height: "1.2em",
      ...p
    },
    void 0,
    void 0,
    void 0,
    3
  )}><path fill="currentColor" d="M256 512a256 256 0 1 0 0-512a256 256 0 1 0 0 512m-81-337c9.4-9.4 24.6-9.4 33.9 0l47 47l47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47l47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47l-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47l-47-47c-9.4-9.4-9.4-24.6 0-33.9"></path></svg>`);
}
function Client($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { clientId, port } = $$props;
    let xidResult = void 0;
    let batchResult = void 0;
    function sendMessage(type, payload) {
      port.postMessage({ dest: "worker", type, payload });
    }
    function newXID() {
      sendMessage("new-xid");
    }
    function newBatch() {
      sendMessage("new-batch", { size: PERF_TEST_COUNT });
    }
    $$renderer2.push(`<div class="flex basis-[50%] flex-col rounded-md border-[1px] border-stone-300 bg-stone-300/40 px-4 py-3"><div class="flex flex-row justify-between"><h2 class="text-md text-slate-700"><span class="mr-1">Client ID:</span><strong>${escape_html(clientId)}</strong></h2> <button aria-label="Remove client" title="Remove client" class="cursor-pointer">`);
    Circle_xmark($$renderer2, {
      class: "h-5 w-5 text-orange-600 transition-all hover:text-red-600 active:text-red-800",
      style: "filter: drop-shadow(0 0 10px rgba(255,255,255, .5))"
    });
    $$renderer2.push(`<!----></button></div> `);
    Gen_xid($$renderer2, { onclick: () => newXID(), output: xidResult });
    $$renderer2.push(`<!----> `);
    Gen_batch($$renderer2, { onclick: () => newBatch(), output: batchResult });
    $$renderer2.push(`<!----></div>`);
  });
}
function Shared_worker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const Global = { xids: [], clients: [], lastXidByClient: new SvelteMap() };
    const Local = { clients: new SvelteMap(), tabID: null };
    let remoteClients = derived(() => Global.clients.filter((cid) => !Local.clients.has(cid)));
    Card($$renderer2, {
      title: "Shared workers",
      description: `This demo shows multiple clients communicating with the same shared worker instance. All clients
		share the same XID generator and can see each other's activity.`,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="flex flex-col gap-1"><div class="mb-1 flex flex-row justify-end"><button class="max-h-10 cursor-pointer place-self-center rounded-lg border-b-[4px] border-blue-600 bg-blue-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:border-blue-700 hover:brightness-110 active:translate-y-[1px] active:border-b-[4px] active:brightness-90">Add new client</button></div> <div class="flex min-h-14 flex-col justify-center rounded-md bg-blue-200/70 p-3 text-sm">`);
        if (Global.clients.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<h2 class="self-center text-sky-700">No worker registered on this tab yet :)</h2>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<h2 class="all-small-caps m-0 mb-2 self-center p-0 text-xl font-bold text-sky-700">Global status</h2> <div class="flex flex-col"><div class="flex flex-row justify-between"><span>Current window ID: <strong>${escape_html(Local.tabID)}</strong></span> <span>Clients connected: <strong>${escape_html(Global.clients.length)}</strong></span></div> <div class="flex flex-row justify-between"><span>Last ID generated:</span> <span>IDs generated: <strong>${escape_html(Global.xids.length)}</strong></span></div></div> <div class="mt-1 rounded-sm bg-white p-1 font-mono text-xs text-slate-600">`);
          if (Global.xids.length > 0) {
            $$renderer3.push("<!--[0-->");
            const lastId = Global.xids.at(Global.xids.length - 1);
            $$renderer3.push(`${escape_html(`${lastId[0]} (origin: ${lastId[1]})`)}`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`None`);
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]--></div> <div class="flex flex-col gap-2"><!--[-->`);
        const each_array = ensure_array_like(Local.clients.entries());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let [clientId, port] = each_array[$$index];
          Client($$renderer3, { clientId, port });
        }
        $$renderer3.push(`<!--]--> <!--[-->`);
        const each_array_1 = ensure_array_like(remoteClients());
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let clientId = each_array_1[$$index_1];
          $$renderer3.push(`<div class="flex basis-[50%] flex-col rounded-md border-[1px] border-slate-300 bg-slate-200/40 px-4 py-3 opacity-70"><div class="flex flex-row items-center justify-between"><h2 class="text-md text-slate-500"><span class="mr-1">Client ID:</span><strong>${escape_html(clientId)}</strong></h2> <span class="rounded-full bg-slate-400/30 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-slate-500 uppercase">Remote</span></div> <div class="mt-2 text-xs text-slate-400">`);
          if (Global.lastXidByClient.has(clientId)) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="text-slate-500">Last XID:</span> <span class="font-mono text-slate-600">${escape_html(Global.lastXidByClient.get(clientId))}</span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<span class="italic">No activity yet</span>`);
          }
          $$renderer3.push(`<!--]--></div></div>`);
        }
        $$renderer3.push(`<!--]--></div></div>`);
      }
    });
  });
}
function Main_thread($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let xidResult = void 0;
    let batchResult = void 0;
    const BATCH_SIZE = 1e5;
    let nexid;
    function generateXID() {
      xidResult = nexid.fastId();
    }
    function generateBatch() {
      const result = runPerformanceTest(nexid.fastId, BATCH_SIZE);
      batchResult = result.time;
    }
    Card($$renderer2, {
      title: "Main thread",
      description: "Generate XIDs directly in the main browser thread:",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="flex flex-col">`);
        Gen_xid($$renderer3, { onclick: () => generateXID(), output: xidResult });
        $$renderer3.push(`<!----> `);
        Gen_batch($$renderer3, { onclick: () => generateBatch(), output: batchResult });
        $$renderer3.push(`<!----></div>`);
      }
    });
  });
}
function _page($$renderer) {
  $$renderer.push(`<div class="flex flex-col gap-2 pt-5"><section>`);
  Main_thread($$renderer);
  $$renderer.push(`<!----></section> <section>`);
  if (
    // grid w-full gap-[1rem] pt-5
    "Worker" in globalThis
  ) {
    $$renderer.push("<!--[0-->");
    Dedicated_worker($$renderer);
  } else {
    $$renderer.push("<!--[-1-->");
    Card($$renderer, {
      title: "Oh no!",
      description: "Shared workers aren't supported on this browser."
    });
  }
  $$renderer.push(`<!--]--></section> <section>`);
  if ("ServiceWorker" in globalThis) {
    $$renderer.push("<!--[0-->");
    Service_worker($$renderer);
  } else {
    $$renderer.push("<!--[-1-->");
    Card($$renderer, {
      title: "Oh no!",
      description: "Service workers aren't supported on this browser."
    });
  }
  $$renderer.push(`<!--]--></section> <section>`);
  if ("SharedWorker" in globalThis) {
    $$renderer.push("<!--[0-->");
    Shared_worker($$renderer);
  } else {
    $$renderer.push("<!--[-1-->");
    Card($$renderer, {
      title: "Oh no!",
      description: "Shared workers aren't supported on this browser."
    });
  }
  $$renderer.push(`<!--]--></section></div>`);
}
export {
  _page as default
};
