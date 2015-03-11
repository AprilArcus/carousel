'use strict';

const React = require('react');
const PureRenderMixin = require('react/addons').addons.PureRenderMixin;
const seedrandom = require('seedrandom');
const CarouselActions = require('../actions/CarouselActions');

// An ES6 transliteration of Mike Ounsworth's random polygon
// algorithm c.f. http://stackoverflow.com/a/25276331
function randomPolygon(ctrX, ctrY, aveRadius, irregularity, spikeyness, numVerts, rng) {
  // nonce implementations of a few functions from Python's random.py
  // http://svn.python.org/projects/stackless/trunk/Lib/random.py
  // gauss is simplified for statelessness and probably incorrect
  function gauss(mu, sigma) {
    const x2pi = rng() * Math.PI * 2;
    const g2rad = Math.sqrt(-2 * Math.log(1.0 - rng()));
    const z = Math.cos(x2pi) * g2rad;
    return mu + z * sigma;
  }
  function uniform(a, b) {
    return a + (b - a) * rng();
  }
  function clip(n, min, max) {
    return n < min ? min : n > max ? max : n;
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
  const angleSteps = [];
  const lower = (2 * Math.PI / numVerts) - irregularity;
  const upper = (2 * Math.PI / numVerts) + irregularity;
  let sum = 0;
  for (let i = 0; i < numVerts; ++i) {
    const tmp = uniform(lower, upper);
    angleSteps.push(tmp);
    sum = sum + tmp;
  }

  // normalize the steps so that point 0 and point n+1 are the same
  const k = sum / (2 * Math.PI);
  for (let i = 0; i < numVerts; ++i) {
    angleSteps[i] = angleSteps[i] / k;
  }

  // now generate the points
  const points = [];
  let angle = uniform(0, 2 * Math.PI);
  for (let i = 0; i < numVerts; ++i) {
    const r_i = clip( gauss(aveRadius, spikeyness), 0, 2 * aveRadius);
    const x = ctrX + r_i * Math.cos(angle);
    const y = ctrY + r_i * Math.sin(angle);
    points.push( [Math.round(x), Math.round(y)] );
    angle = angle + angleSteps[i];
  }

  return points;
}

function generateRandomPolygonFromSeed(seed) {
  const rng = seedrandom(seed);
  const hue = Math.floor(rng() * 360);
  const zIndex = Math.floor(rng() * 100);
  const irregularity = rng() * 0.8;
  const spikeyness = rng() * 0.6;
  const numVerts = Math.floor(3 + rng() * 5);
  const vertices = randomPolygon(0, 0, 25, irregularity, spikeyness,
                                 numVerts, rng);
  const points = vertices.map(vertex => vertex.join(',')).join(' ');
  return {hue, points, zIndex};
}

const tweeners = {
  bounce:   'cubic-bezier(0.39,1.41,0.93,1.13)',
  friction: 'cubic-bezier(0.00,0.40,0.40,1.00)'
};

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    index: React.PropTypes.number.isRequired,
    seed: React.PropTypes.string.isRequired,
    hp: React.PropTypes.number.isRequired
  },

  getInitialState() {
    return generateRandomPolygonFromSeed(this.props.seed);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.seed !== nextProps.seed) {
      this.setState(generateRandomPolygonFromSeed(nextProps.seed));
    }
  },

  handleClick() {
    if (this.props.hp > 0) CarouselActions.hit(this.props.index);
  },

  containerStyle() {
    return Object.assign({position: 'relative',
                          zIndex: this.state.zIndex},
                         this.props.style);
  },

  spinStyle() {
    return {
      transform: `rotate(${this.props.hp * 137}deg)`,
      transition: `transform ${this.props.hp * 150}ms ${tweeners.friction}`
    };
  },

  shrinkStyle() {
    let transition;
    if (this.props.hp > 0) {
      transition = `all ${this.props.hp * 150}ms ${tweeners.bounce}`;
    } else {
      transition = 'all 75ms ease-in';
    }
    return {
      transform: `scale(${this.props.hp},${this.props.hp})`,
      strokeWidth: 4 / this.props.hp,
      transition: transition
    }
  },

  polygonStyle() {
    return {
      fill: `hsl(${this.state.hue},100%,50%)`,
      stroke: `hsl(${this.state.hue},100%,25%)`
    };
  },

  render() {
    return <div style={this.containerStyle()}>
             <svg width="100%"
                  viewBox="-50 -50 100 100"
                  style={Object.assign({overflow: 'visible'},
                                       this.spinStyle())} >
               <polygon points={this.state.points}
                        style={Object.assign(this.polygonStyle(),
                                             this.shrinkStyle())}
                        onClickCapture={this.handleClick} />
             </svg>
           </div>;
  }
});
