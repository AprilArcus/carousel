export default function memoize(callback) {
    const cache = new Map;

    return function(...args){
        let curriedCache = cache;
        let curriedVal;

        args.forEach((arg, index) => {
            curriedVal = curriedCache.get(arg);
            if (curriedVal === undefined) {
                if (index === args.length - 1) {
                    curriedVal = callback(args);
                    curriedCache.set(arg, curriedVal);
                } else {
                    nextCache = new Map;
                    curriedCache.set(arg, nextCache);
                    curriedCache = nextCache;
                }
            } 
        });

        return curriedVal; 
    };
}
