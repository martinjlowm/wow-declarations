['log', 'warn', 'error'].forEach((func) => {
  const orig = console[func];
  console[func] = (...args) => {
    const stack = new Error().stack;
    const [,, caller] = stack.split('\n');
    return orig(`[${caller.trim()}]`, ...args);
  };
});
