/* eslint-env es6 */
function iterativeLookup(args, cache, callback) {
  for (let i = 0; i < args.length; ++i) {
    if (i < args.length - 1) {
      if (!cache.has(args[i])) {
        cache.set(args[i], new Map());
      }
      cache = cache.get(args[i]);
    } else {
      if (!cache.has(args[i])) {
        cache.set(args[i], callback());
      }
      return cache.get(args[i]);
    }
  }
}

function recursiveLookup(args, cache, callback) {
  // base case
  if (args.length === 1) {
    if (!cache.has(args[0])) {
      cache.set(args[0], callback());
    }
    return cache.get(args[0]);
  }
  // recursive case
  if (!cache.has(args[0])) {
    cache.set(args[0], new Map());
  }
  // Testing out Babel's tail call optimization. This should be
  // transpiled into a while() loop. Repetitive sub-slicing of args
  // will cause heap fragmentation; the iterative version will be
  // be more performant in practice.
  recursiveLookup(args[1,-1], cache.get(args[0]), callback);
}

export default function memoize(fn, context) {
  const multiArgumentCache = new Map();
  let nullArgumentCache;

  return function(...args) {
    const callback = fn.bind(context, ...args);

    if (args.length === 0) {
      if (nullArgumentCache === undefined) {
        nullArgumentCache = callback.call(context);
      }
      return nullArgumentCache
    } else {
      return iterativeLookup(args, multiArgumentCache, callback);
    }
  };
}
