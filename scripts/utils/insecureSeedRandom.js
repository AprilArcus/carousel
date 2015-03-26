// David Bau's https://www.npmjs.com/package/seedrandom is great but
// enormous, intended for generating cyrptographically secure
// pseudorandom numbers in node.js settings. This is a quick-and-dirty
// shim with a compatible API.
// h/t Antti Sykäri http://stackoverflow.com/a/19303725

export default function(seed) {
  return function rng() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}
