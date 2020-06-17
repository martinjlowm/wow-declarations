// NOTE: This is just for debugging, to trace log statements.
['log', 'warn', 'error'].forEach((func) => {
  const orig = console[func];
  console[func] = (...args) => {
    const stack = new Error().stack;
    const [,, caller] = stack.split('\n');
    return orig(`[${caller.trim()}]`, ...args);
  };
});
