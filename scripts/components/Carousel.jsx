/* eslint-env es6 */
import React from 'react';
import { addons } from 'react/addons';
const PureRenderMixin = addons.PureRenderMixin;
import ReactTransitionEvents from 'react/lib/ReactTransitionEvents';
import Immutable from 'immutable';
import Shape from './Shape';
import Button from './Button';
import Arrow from './Arrow';
import Heart from './Heart';
import CarouselStore from '../stores/CarouselStore';
import CarouselActions from '../actions/CarouselActions';

const enums = {
  sliding: {
    BACKWARD: Symbol(),
    STOPPED: Symbol(),
    FORWARD: Symbol()
  }
};

let styles; // we'll define these after render(), around line 270.

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    respawnThreshold: React.PropTypes.number,
    numItems: React.PropTypes.number,
    numSlots: function(props, propName, componentName) {
      function rangeCheck(props, propName, componentName) { //eslint-disable-line no-shadow, no-unused-vars
        if (props[propName] > props.numItems) {
          return new Error('Carousel must be initialized with ' +
                           'enough items to fill every slot.');
        }
      }
      let error;
      [React.PropTypes.number, rangeCheck].every( validator => {
        error = validator(props, propName, componentName); // side effect
        return !error;
      });
      return error;
    }
  },

  getDefaultProps() {
    return {
      numItems: 6,
      numSlots: 6,
      respawnThreshold: 12,
      prefixes: {
        flex: 'flex',
        flexShrink: 'flexShrink',
        flexGrow: 'flexGrow',
        alignItems: 'alignItems',
        justifyContent: 'justifyContent',
        transform: 'transform'
      }
    };
  },

  getInitialState() {
    return {
      sliding: enums.sliding.STOPPED,
      offsetIndex: 0,
      genericInteractions: 0,
      gameOver: false
    };
  },

  componentDidMount() {
    CarouselStore.addChangeListener(this.onChange);
    CarouselActions.reset(this.props.numItems); // initialize backing store

    const sliderNode = React.findDOMNode(this.refs.slider);
    ReactTransitionEvents.addEndEventListener(sliderNode, this.stopSlide);

    // React's onKeyDown event only listens when the component or
    // a child has focus. This is certainly the right thing to do
    // in general (what if we have multiple of these carousel
    // components on a single page?) but in the spirit of Patreon's
    // specification, which seems to gesture toward a sort of shooting
    // gallery type interface, we implement keyboard input in a game-
    // like way. To this end, we add global event listeners in the
    // lifecycle callbacks...
    window.addEventListener('keydown', this.handleKeyDown);
  },

  handleKeyDown(event) {
    // ...and attempt to mitigate the most questionable aspect of this
    // approach with a guard clause against the possibility of another
    // focused element.
    if (document.activeElement.tagName === 'BODY' &&
        this.state.sliding === enums.sliding.STOPPED) {
      // FIXME: the DOM level 2 KeyboardEvent API is a mess.
      // KeyboardEvent.keyCode has universal support, and
      // KeyboardEvent.which has support in IE9+, but MDN considers both
      // deprecated since they are ambiguous on non-QWERTY layouts:
      // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
      // However, as of March 2015, the DOM level 3 replacements
      // KeyboardEvent.key and KeyboardEvent.code remain unimplemented:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=680830
      if ((event.which === 0x25 ||  // left arrow
           event.which === 0x48 ||  // h
           event.which === 0x41) && // a
         !(event.altKey || event.metaKey)) {
        this.slideBackward();
        event.stopPropagation();
        this.handleGenericInteraction(event);
      } else if ((event.which === 0x27 ||  // right arrow
                  event.which === 0x4C ||  // l
                  event.which === 0x44) && // d
                !(event.altKey || event.metaKey)) {
        this.slideForward();
        event.stopPropagation();
        this.handleGenericInteraction(event);
      }
    }
  },

  componentWillUnmount() {
    CarouselStore.removeChangeListener(this.onChange);

    const sliderNode = React.findDOMNode(this.refs.slider);
    ReactTransitionEvents.removeEndEventListener(sliderNode, this.stopSlide);

    window.removeEventListener('keydown', this.handleKeyDown);
  },

  onChange() {
    this.setState({gameOver: CarouselStore.empty});

    // Necessary since we don't actually keep a copy of the carousel
    // items as props or state, but rather slice into CarouselStore
    // according to this.state.offsetIndex at render time.

    // However, we could technically comment this out and the app's
    // behavior would not visibly change, since handleGenericInteraction
    // will still detect the click, mutate our state and trigger a
    // re-render.
    this.forceUpdate();
  },

  handleGenericInteraction(event) {
    this.setState({genericInteractions: this.state.genericInteractions + 1});
    if (this.state.genericInteractions % this.props.respawnThreshold === 0) {
      CarouselActions.respawn();
    }
    event.stopPropagation();
  },

  handleReset() {
    CarouselActions.reset(this.props.numItems);
  },

  handleClear(event) {
    CarouselActions.clear();
    // don't let clicks on the 'clear' button bubble up to the generic
    // interaction handler.
    event.stopPropagation();
  },

  slideBackward() {
    this.setState({sliding: enums.sliding.BACKWARD});
  },

  slideForward() {
    this.setState({sliding: enums.sliding.FORWARD});
  },

  stopSlide() {
    if (this.state.sliding === enums.sliding.BACKWARD) {
      this.setState({offsetIndex: this.state.offsetIndex - 1});
    } else if (this.state.sliding === enums.sliding.FORWARD) {
      this.setState({offsetIndex: this.state.offsetIndex + 1});
    }
    this.setState({sliding: enums.sliding.STOPPED});
  },

  getItems() {
    const slice =
        CarouselStore.getCircularizedSlice(
          this.state.offsetIndex,
          this.state.offsetIndex + this.props.numSlots + 4);
    // asserting the structure of our incoming data at the API boundary
    if (process.env.NODE_ENV !== 'production') {
      if (!(slice.constructor === Array && slice.every(item =>
            typeof item === 'object' &&
            typeof item.sliceIndex === 'number' &&
            typeof item.storeIndex === 'number' &&
            typeof item.shape === 'object'))) {
        throw new Error('Malformed data from Store, expected Array ' +
                        'of {key: number, storeIndex: number, shape: ' +
                        'object}');
      }
    }
    return slice;
  },

  renderItems() {
    const numSlots = this.props.numSlots;
    return this.getItems().map( ({shape, sliceIndex, storeIndex}) =>
      <Shape key={sliceIndex}
             storeIndex={storeIndex}
             style={styles.item(numSlots)}
             data={shape}
             prefixes={this.props.prefixes} />
    );
  },

  render() {
    const style = this.props.style;
    const prefixes = this.props.prefixes;
    const numSlots = this.props.numSlots;
    const sliding = this.state.sliding;
    const gameOver = this.state.gameOver;
    const slidingDisabled = (sliding !== enums.sliding.STOPPED) || gameOver;

    return <div style={styles.container({prefixes, style})}
                onClick={this.handleGenericInteraction}>
             <div style={styles.endCap(prefixes)}>
               <Arrow style={styles.arrow}
                      direction={'left'}
                      clickHandler={this.slideBackward}
                      disabled={slidingDisabled} />
             </div>
             <div style={styles.stock(prefixes)}>
               <div ref="slider"
                    style={styles.slider({prefixes, numSlots, sliding})}>
                 {this.renderItems()}
               </div>
               <div style={styles.messageContainer(prefixes)}>
                 <div style={styles.message({prefixes, gameOver})}>
                   <span>{'Thanks for playing!'}</span>
                   <br />
                   <span>
                     {'April Arcus'}
                     <Heart style={{verticalAlign: '-30%',
                                    margin: '0 0.2em'}}
                            prefixes={prefixes}
                            onClick={this.handleReset} />
                     {'React'}
                   </span>
                 </div>
               </div>
             </div>
             <div style={styles.endCap(prefixes)}>
               <Arrow style={styles.arrow}
                      direction={'right'}
                      clickHandler={this.slideForward}
                      disabled={slidingDisabled} />
             </div>
             <div style={styles.buttonGroup}>
               <Button style={styles.button}
                       bsStyle="default"
                       bsSize="large"
                       value="Reset"
                       onClick={this.handleReset} />
               <Button style={styles.button}
                       bsStyle="default"
                       bsSize="large"
                       value="Clear"
                       onClick={this.handleClear}
                       disabled={this.state.gameOver} />
             </div>
           </div>;
  }
});

//------------------------------ Styles ------------------------------//

// We generate most styles on the fly and use React to inline them.
// While heterodox, this gives us the freedom to calculate styles on
// the fly instead of adding and removing global classnames to apply
// precomputed effects, enables runtime feature detection, and
// facilitates componentization.
//
// c.f. Christopher Chedeau's terrific talk, "React: CSS in JS"
// http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
// https://vimeo.com/channels/684289/116209150

styles = {
  container({prefixes, style}) {
    const container = {     // we'll position the reset and clear
      position: 'relative', // buttons relative to the outer div.
      display: prefixes.flex,
      [prefixes.alignItems]: 'center',
      [prefixes.justifyContent]: 'space-between',
      overflow: 'hidden',
      height: '100%' // occupy the full height of our parent rather than
    };               // the natural height of the tallest carousel item.
    return Object.assign({}, style, container);
  },

  endCap(prefixes) {            // setting negative zIndex on the
    return {                    // carousel items would break their
      [prefixes.flexShrink]: 0, // onClick handlers, so we use positive
      zIndex: 100               // z-indices [0,20) there to randomize
    };                          // their layering and compensate for it
  },                            // here.

  arrow: {
    width: 70,
    margin: 10,
    zIndex: 1000
  },

  stock(prefixes) {
    return {                           // the stock is the reference for
      [prefixes.flexGrow]: 1,          // the slider and the 'game over'
      display: prefixes.flex,          // message. when running at full
      [prefixes.alignItems]: 'center', // bleed it is aesthetically
      position: 'relative'             // preferrable to ue absolute
      // position: 'absolute',         // positioning; effectively
      // top: 0,                       // insetting the endcaps.
      // right: 0,                     // However, doing so triggers an
      // bottom: 0,                    // inscrutable rendering bug in
      // left: 0                       // Gecko. TODO: file bug report
    };                                 // with minimal test case.
  },

  slider({prefixes, numSlots, sliding}) {
    const slideDuration = '150ms';
    const itemWidth = 100 / numSlots;
    let left, transition;
    switch(sliding) {
      case enums.sliding.FORWARD:
        left = `-${3 * itemWidth}%`;
        transition = `left ${slideDuration} ease`;
        break;
      case enums.sliding.BACKWARD:
        left = `-${1 * itemWidth}%`;
        transition = `left ${slideDuration} ease`;
        break;
      default:
        left = `-${2 * itemWidth}%`;
        transition = 'none';
    }
    return {
      [prefixes.flexGrow]: 1,
      position: 'relative',
      left: left,
      transition: transition,
      whiteSpace: 'nowrap'
    };
  },

  item(numSlots) {
    const itemWidth = 100 / numSlots;
    return {
      display: 'inline-block',
      width: `${itemWidth}%`
    };
  },

  messageContainer(prefixes) {
    return {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      display: [prefixes.flex],
      [prefixes.justifyContent]: 'center',
      [prefixes.alignItems]: 'center'
    };
  },

  message({prefixes, gameOver}) {
    let transform, transition, lineHeight;
    if (gameOver) {
      transform = 'scale(1,1)';
      transition = 'all 450ms cubic-bezier(0.4,1.4,0.4,1.0)';
      lineHeight = 2.2;
    } else {
      transform = 'scale(0,0)';
      transition = 'none';
      lineHeight = 0.1;
    }
    return {
      textAlign: 'center',
      fontSize: 50,
      fontWeight: 100,
      lineHeight: lineHeight,
      [prefixes.transform]: transform,
      transition: transition
    };
  },

  buttonGroup: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    zIndex: 100 // c.f. comment in endCap()
  },

  button: {                            // Safari disables subpixel
    margin: '8px 4px',                 // antialiasing during anima-
    WebkitFontSmoothing: 'antialiased' // tions, to jarring effect.
  }
};
