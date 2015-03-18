/* eslint-env es6 */
function iterativeLookup(args, cache, callback) {
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]
    if (i < args.length - 1) {
      if (!cache.has(arg)) {
        cache.set(arg, new Map());
      }
      cache = cache.get(arg);
    } else {
      if (!cache.has(arg)) {
        cache.set(arg, callback());
      }
      return cache.get(arg);
    }
  }
}

function recursiveLookup(args, cache, callback) {
  const arg = args[0]
  // base case
  if (args.length === 1) {
    if (!cache.has(arg)) {
      cache.set(arg, callback());
    }
    return cache.get(arg);
  }
  // recursive case
  if (!cache.has(arg)) {
    cache.set(arg, new Map());
  }
  // Testing out Babel's tail call optimization. This should be
  // transpiled into a while() loop. Repetitive sub-slicing of args
  // will cause heap fragmentation; the iterative version will be
  // be more performant in practice.
  recursiveLookup(args[1,-1], cache.get(arg), callback);
}

export default function memoize(fn, context) {
  const multiArgumentCache = new Map();
  let nullArgumentCache = {empty: true, value: undefined};

  return function(...args) {
    const callback = fn.bind(context, ...args);

    if (args.length === 0) {
      if (nullArgumentCache.empty === true) {
        nullArgumentCache.value = callback.call(context);
        nullArgumentCache.empty = false;
      }
      return nullArgumentCache.value;
    } else {
      return iterativeLookup(args, multiArgumentCache, callback);
    }
  };
}
