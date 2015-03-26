// an optimized reductions (clojure) / scanl (haskell) function
function reductions(callback, initial, array) {
  const result = new Array(array.length + 1);
  result[0] = initial;
  array.forEach( (element, index) =>
    result[index + 1] = callback(result[index], element)
  );
  return result;
}

// An ES6 translation of Mike Ounsworth's random polygon algorithm.
// Comments original, algorithm lightly adapted to functional style.
// c.f. http://stackoverflow.com/a/25276331

function clip(n, min, max) {
  // I usually consider the ternary operator unreadable, but isn't this
  // line irresistable? It looks like a Daft Punk song sounds.
  return n < min ? min : n > max ? max : n;
}

export default function(ctrX, ctrY, aveRadius, irregularity, spikeyness,
                        numVerts, rng) {
  // Nonce implementations of a few functions from Python's random.py
  // http://svn.python.org/projects/stackless/trunk/Lib/random.py
  // These need to be inside the scope of the random number generator
  // passed in as a parameter.
  function gauss(mu, sigma) {
    // simplified for statelessness and possibly incorrect.
    const x2pi = rng() * Math.PI * 2;
    const g2rad = Math.sqrt(-2 * Math.log(1.0 - rng()));
    const z = Math.cos(x2pi) * g2rad;
    return mu + z * sigma;
  }
  function uniform(a, b) {
    return a + (b - a) * rng();
  }

  // Start with the centre of the polygon at ctrX, ctrY, then creates
  // the polygon by sampling points on a circle around the centre.
  // Randon noise is added by varying the angular spacing between
  // sequential points, and by varying the radial distance of each
  // point from the centre.

  // Params:
  // ctrX, ctrY   - coordinates of the "centre" of the polygon
  // aveRadius    - in px, the average radius of this polygon, this
  //                roughly controls how large the polygon is, really
  //                only useful for order of magnitude.
  // irregularity - [0,1] indicating how much variance there is in the
  //                angular spacing of vertices. [0,1] will map to
  //                [0, 2pi/numberOfVerts]
  // spikeyness   - [0,1] indicating how much variance there is in
  //                each vertex from the circle of radius aveRadius.
  //                [0,1] will map to [0, aveRadius]
  // numVerts     - self-explanatory

  // Returns a list of vertices, in CCW order.

  irregularity = clip(irregularity, 0, 1) * 2 * Math.PI / numVerts;
  spikeyness = clip(spikeyness, 0, 1) * aveRadius;

  // generate n angle steps
  const lower = (2 * Math.PI / numVerts) - irregularity;
  const upper = (2 * Math.PI / numVerts) + irregularity;
  const angleSteps = Array.from(Array(numVerts),
                                () => uniform(lower, upper));
  const sum = angleSteps.reduce((x, y) => x + y, 0);

  // normalize the steps so that point 0 and point n+1 are the same
  const k = sum / (2 * Math.PI);
  const normalizedAngleSteps = angleSteps.map(e => e / k);

  // now generate the points
  const angles = reductions((x, y) => x + y,
                            uniform(0, 2 * Math.PI),
                            normalizedAngleSteps).slice(0, -1);
  const points = angles.map(angle => {
    const radius = clip(gauss(aveRadius, spikeyness), 0, 2 * aveRadius);
    const x = ctrX + radius * Math.cos(angle);
    const y = ctrY + radius * Math.sin(angle);
    return [Math.round(x), Math.round(y)];
  });

  return points;
}