export function generateMockEvents() {
  const types = ['get', 'set', 'sub', 'unsub', 'notify'];
  const targetTypes = ['state', 'computed', 'command'];
  const targets = ['user', 'cart', 'products', 'orders', 'settings'];

  const events = Array.from({ length: 100 }, () => {
    const type = types[Math.floor(Math.random() * types.length)];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];

    return {
      type,
      target,
      targetType,
      argsType: type === 'set' ? 'string | number' : undefined,
      returnType: type === 'get' ? 'string | number' : undefined,
      timestamp: Date.now() - Math.floor(Math.random() * 1000000),
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  return events;
}
