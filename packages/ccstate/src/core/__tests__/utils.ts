export function suspense() {
  const resolves: (() => void)[] = [];
  let queueCountPromises: [number, () => void][] = [];

  function checkQueueCount() {
    for (const [n, resolve] of queueCountPromises) {
      if (n === resolves.length) resolve();
    }
    queueCountPromises = queueCountPromises.filter(([n]) => n !== resolves.length);
  }

  function pause(): Promise<void> {
    const ret = new Promise<void>((resolve) => resolves.push(resolve));
    checkQueueCount();
    return ret;
  }

  function restore() {
    resolves.splice(0).forEach((resolve) => {
      resolve();
    });
    checkQueueCount();
  }

  function waitQueueCount(n: number) {
    return new Promise<void>((resolve) => queueCountPromises.push([n, resolve]));
  }

  return {
    pause,
    restore,
    waitQueueCount,
  };
}
