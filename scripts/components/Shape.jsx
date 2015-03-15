/* eslint-env es6 */
import React from 'react';
import { addons } from 'react/addons';
const PureRenderMixin = addons.PureRenderMixin;
import ReactTransitionEvents from 'react/lib/ReactTransitionEvents';
import CarouselActions from '../actions/CarouselActions';
import shallowEqual from 'react/lib/shallowEqual';

// a quick and dirty non-cryptographically secure seeded rng with an
// API after David Bau's https://www.npmjs.com/package/seedrandom
// h/t Antti Sykäri http://stackoverflow.com/a/19303725
function seedrandom(seed) {
  return function rng() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

function clip(n, min, max) {
  return n < min ? min : n > max ? max : n;
}

// an optimized reductions (clojure) / scanl (haskell) function
function reductions(callback, initial, array) {
  let result = new Array(array.length + 1);
  result[0] = initial;
  array.forEach( (element, index) =>
    result[index + 1] = callback(result[index], element)
  );
  return result;
}

// An ES6 translation of Mike Ounsworth's random polygon algorithm.
// Comments original, algorithm lightly adapted to functional style.
// c.f. http://stackoverflow.com/a/25276331
function randomPolygon(ctrX, ctrY, aveRadius, irregularity,
                       spikeyness, numVerts, rng) {
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

function generateRandomPolygon(data) {
  const rng = seedrandom(data.seed);
  const hue = Math.floor(rng() * 360);
  const zIndex = Math.floor(rng() * 100);
  const irregularity = rng() * 0.8;
  const spikeyness = rng() * 0.6;
  const numVerts = data.hp + 2;
  const vertices = randomPolygon(0, 0, 25, irregularity, spikeyness,
                                 numVerts, rng);
  const points = vertices.map(vertex => vertex.join(',')).join(' ');
  return {hue, points, zIndex};
}

const tweeners = {                      /* eslint-disable key-spacing */
  bounce:   'cubic-bezier(0.39,1.41,0.93,1.13)',
  friction: 'cubic-bezier(0.00,0.40,0.40,1.00)'
};                                      /* eslint-enable key-spacing  */

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    storeIndex: React.PropTypes.number.isRequired,
    data: React.PropTypes.shape({
      seed: React.PropTypes.number,
      hp: React.PropTypes.number
    }).isRequired,
    prefixes: React.PropTypes.shape({
      transform: React.PropTypes.string
    })
  },

  getDefaultProps() {
    return {
      prefixes: {transform: 'transform'}
    };
  },

  handleClick() {
    if (this.props.data.hp > 0) CarouselActions.hit(this.props.storeIndex);
  },

  containerStyle(zIndex) {
    return Object.assign({position: 'relative', // only positioned
                          zIndex: zIndex},      // elements can
                         this.props.style);     // have z-index
  },

  // In this and the following function, we scale up in proportion to
  // the shape's hitpoints, and also use hitpoints as a factor on trans-
  // ition durations. This provides a nice feeling of mass and inertia.
  spinStyle() {
    return {
      [this.props.prefixes.transform]: `rotate(${this.props.data.hp * 137}deg)`,
      transition: `all ${this.props.data.hp * 150}ms ${tweeners.friction}`
    };
  },

  shrinkStyle() {
    let transition;
    if (this.props.data.hp > 0) {
      // a little overshoot at the end of this animation looks nice...
      transition = `all ${this.props.data.hp * 150}ms ${tweeners.bounce}`;
    } else {
      // ...but we don't want to turn ourselves inside-out when we scale
      // to zero!
      transition = 'all 75ms ease-in';
    }
    return {
      [this.props.prefixes.transform]:
        `scale(${this.props.data.hp},${this.props.data.hp})`,
      strokeWidth: 4 / this.props.data.hp,
      transition: transition
    };
  },

  polygonStyle(hue) {
    return {
      fill: `hsl(${hue},100%,50%)`,
      stroke: `hsl(${hue},100%,25%)`
    };
  },

  render() {
    const {hue, points, zIndex} = generateRandomPolygon(this.props.data);
    return <div ref="component"
                style={this.containerStyle(zIndex)}>
             <svg width="100%"
                  viewBox="-50 -50 100 100"
                  style={Object.assign({overflow: 'visible'},
                                       this.spinStyle())} >
               <polygon points={points}
                        style={Object.assign(this.polygonStyle(hue),
                                             this.shrinkStyle())}
                        onClickCapture={this.handleClick} />
             </svg>
           </div>;
  },

  // our parent is listening for transition end events on its slider
  // element, but it will hear transition end events from all of its
  // children unless we silence them. This is certainly a bug in
  // ReactTransitionEvents -- it should be able to do this kind of
  // screening for us. TODO: file issue & submit pull request

  componentDidMount() {
    const componentNode = React.findDOMNode(this.refs.component);
    ReactTransitionEvents.addEndEventListener(componentNode, this.stopTransitionEventPropogation);
  },

  componentWillUnmount() {
    const componentNode = React.findDOMNode(this.refs.component);
    ReactTransitionEvents.removeEndEventListener(componentNode, this.stopTransitionEventPropogation);
  },

  stopTransitionEventPropogation(event) {
    event.stopPropagation();
  }
});
