/* eslint-env es6 */
import React from 'react';
import PureComponent from './PureComponent';
import CarouselActions from '../actions/CarouselActions';
import randomPolygon from '../utils/randomPolygon';
import silenceTransitionEndEvents from '../utils/silenceTransitionEndEvents'

// a quick and dirty non-cryptographically secure seeded rng with an
// API after David Bau's https://www.npmjs.com/package/seedrandom
// h/t Antti Sykäri http://stackoverflow.com/a/19303725
function seedrandom(seed) {
  return function rng() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
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

let styles;

class Shape extends PureComponent {

  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.props.data.hp > 0) CarouselActions.hit(this.props.storeIndex);
  }

  render() {
    const hp = this.props.data.hp;
    const {hue, points, zIndex} = generateRandomPolygon(this.props.data);
    const style = this.props.style;
    const prefixes = this.props.prefixes;

    return <div style={styles.container({zIndex, style})}>
             <svg width="100%"
                  viewBox="-50 -50 100 100"
                  style={Object.assign({overflow: 'visible'},
                                       styles.spin({prefixes, hp}))} >
               <polygon points={points}
                        style={Object.assign(styles.polygon({hue}),
                                             styles.scale({prefixes, hp}))}
                        onClickCapture={this.handleClick} />
             </svg>
           </div>;
  }

}

Shape.propTypes = { storeIndex: React.PropTypes.number.isRequired,
                    data: React.PropTypes.shape({
                      seed: React.PropTypes.number,
                      hp: React.PropTypes.number
                    }).isRequired,
                    prefixes: React.PropTypes.shape({
                      transform: React.PropTypes.string
                    })};

Shape.defaultProps = { prefixes: {transform: 'transform'} };

// export default Shape;
// Working around a bug in ReactTransitionEvents
export default silenceTransitionEndEvents(Shape);

//------------------------------ Styles ------------------------------//

const tweeners = {                      /* eslint-disable key-spacing */
  bounce:   'cubic-bezier(0.39,1.41,0.93,1.13)',
  friction: 'cubic-bezier(0.00,0.40,0.40,1.00)'
};                                      /* eslint-enable key-spacing  */

styles = {
  container({style, zIndex}) {
    return Object.assign({position: 'relative', // only positioned
                          zIndex: zIndex},      // elements can
                         style);                // have z-index
  },

  // In this and the following function, we scale up in proportion to
  // the shape's hitpoints, and also use hitpoints as a factor on trans-
  // ition durations. This provides a nice feeling of mass and inertia.
  spin({prefixes, hp}) {
    return {
      [prefixes.transform]: `rotate(${hp * 137}deg)`,
      transition: `all ${hp * 150}ms ${tweeners.friction}`
    };
  },

  scale({prefixes, hp}) {
    let transition;
    if (hp > 0) {
      // a little overshoot at the end of this animation looks nice...
      transition = `all ${hp * 150}ms ${tweeners.bounce}`;
    } else {
      // ...but we don't want to turn ourselves inside-out when we scale
      // to zero!
      transition = 'all 75ms ease-in';
    }
    return {
      [prefixes.transform]:
        `scale(${hp},${hp})`,
      strokeWidth: 4 / hp,
      transition: transition
    };
  },

  polygon({hue}) {
    return {
      fill: `hsl(${hue},100%,50%)`,
      stroke: `hsl(${hue},100%,25%)`
    };
  }

};
