function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      },
      { once: true },
    );
  });
}

export const config = {
  lockDuration: 5000, // Lock alle 5s erneuern — ermöglicht schnellen Abort bei Boundary Events
};

export default async function handleExternalTask(payload: any, _task: any, signal: AbortSignal) {
  console.log('External Task received:', payload);

  // Synchroner Listener — wird vor process.exit(3) ausgeführt
  signal.addEventListener(
    'abort',
    () => {
      console.log('External Task aborted — Boundary Event hat den Task beendet');
    },
    { once: true },
  );

  try {
    await delay(10_000, signal);
  } catch (e) {
    console.log('External Task aborted during delay');
    return;
  }

  if (signal.aborted) return;

  console.log('External Task finished:', payload);
  return { success: true, processedAt: new Date().toISOString() };
}
