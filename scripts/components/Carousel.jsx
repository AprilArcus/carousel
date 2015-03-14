/* eslint-env es6 */
import React from 'react';
import { PureRenderMixin } from 'react/addons';
import keyMirror from 'react/lib/keyMirror';
import ReactTransitionEvents from 'react/lib/ReactTransitionEvents';
import Immutable from 'immutable';
import Shape from './Shape';
import Button from './Button';
import Arrow from './Arrow';
import Heart from './Heart';
import CarouselStore from '../stores/CarouselStore';
import CarouselActions from '../actions/CarouselActions';

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

  enums: {
    sliding: keyMirror({
      BACKWARD: null,
      STOPPED: null,
      FORWARD: null
    })
  },

  getInitialState() {
    return {
      sliding: this.enums.sliding.STOPPED,
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

  componentWillUnmount() {
    CarouselStore.removeChangeListener(this.onChange);

    const sliderNode = React.findDOMNode(this.refs.slider);
    ReactTransitionEvents.removeEndEventListener(sliderNode, this.stopSlide);

    window.removeEventListener('keydown', this.handleKeyDown);
  },

  onChange() {
    this.setState({gameOver: CarouselStore.empty});
    // necessary since we don't actually keep a copy of the carousel
    // items as props or state, but rather slice into CarouselStore
    // according to this.state.offsetIndex at render time.
    this.forceUpdate();
  },

  handleKeyDown(event) {
    // ...and attempt to mitigate the most questionable aspect of this
    // approach with a guard clause against the possibility of another
    // focused element.
    if (document.activeElement.tagName === 'BODY' &&
        this.state.sliding === this.enums.sliding.STOPPED) {
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
    this.setState({sliding: this.enums.sliding.BACKWARD});
  },

  slideForward() {
    this.setState({sliding: this.enums.sliding.FORWARD});
  },

  stopSlide() {
    if (this.state.sliding === this.enums.sliding.BACKWARD) {
      this.setState({offsetIndex: this.state.offsetIndex - 1});
    } else if (this.state.sliding === this.enums.sliding.FORWARD) {
      this.setState({offsetIndex: this.state.offsetIndex + 1});
    }
    this.setState({sliding: this.enums.sliding.STOPPED});
  },

  // We generate most styles on the fly and use React to inline them.
  // While heterodox, this gives us the freedom to calculate styles on
  // the fly instead of adding and removing global classnames to apply
  // precomputed effects, enables runtime feature detection, and
  // facilitates componentization.
  //
  // c.f. Christopher Chedeau's terrific talk, "React: CSS in JS"
  // http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
  // https://vimeo.com/channels/684289/116209150

  containerStyle() {
    const container = {     // we'll position the reset and clear
      position: 'relative', // buttons relative to the outer div.
      display: this.props.prefixes.flex,
      [this.props.prefixes.alignItems]: 'center',
      [this.props.prefixes.justifyContent]: 'space-between',
      overflow: 'hidden',
      height: '100%' // occupy the full height of our parent rather than
    };               // the natural height of the tallest carousel item.
    return Object.assign({}, this.props.style, container);
  },

  endCapStyle() {                 // setting negative zIndex on the
    return {                      // carousel items would break their
      [this.props.prefixes.flexShrink]: 0, // onClick handlers, so we
      zIndex: 100                 // use positive z-indices [0,20) there
    };                            // to randomize their layering and
  },                              // compensate for it here.

  stockStyle() {                         // the stock is the reference
    return {                             // for the slider and the 'game
      [this.props.prefixes.flexGrow]: 1, // over' message. when running
      display: this.props.prefixes.flex, // at full bleed it is aesthet-
      [this.props.prefixes.alignItems]: 'center', // ically preferrable
      position: 'relative'               // to use absolute positioning;
      // position: 'absolute',           // effectively insetting the
      // top: 0,                         // endcaps. However, doing so
      // right: 0,                       // triggers an inscrutable
      // bottom: 0,                      // rendering bug in Gecko.
      // left: 0                         //
    };                                   // TODO: file bug report with
  },                                     //       minimal test case

  sliderStyle() {
    const slideDuration = '150ms';
    const itemWidth = 100 / this.props.numSlots;
    let left, transition;
    switch(this.state.sliding) {
      case this.enums.sliding.FORWARD:
        left = `-${3 * itemWidth}%`;
        transition = `left ${slideDuration} ease`;
        break;
      case this.enums.sliding.BACKWARD:
        left = `-${1 * itemWidth}%`;
        transition = `left ${slideDuration} ease`;
        break;
      default:
        left = `-${2 * itemWidth}%`;
        transition = 'none';
    }
    return {
      [this.props.prefixes.flexGrow]: 1,
      position: 'relative',
      left: left,
      transition: transition,
      whiteSpace: 'nowrap'
    };
  },

  messageContainerStyle() {
    return {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      display: [this.props.prefixes.flex],
      [this.props.prefixes.justifyContent]: 'center',
      [this.props.prefixes.alignItems]: 'center'
    };
  },

  messageStyle() {
    let transform, transition, lineHeight;
    if (this.state.gameOver) {
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
      [this.props.prefixes.transform]: transform,
      transition: transition
    };
  },

  itemStyle() {
    const itemWidth = 100 / this.props.numSlots;
    return {
      display: 'inline-block',
      width: `${itemWidth}%`
    };
  },

  staticStyles: {
    arrow: {
      width: 70,
      margin: 10,
      zIndex: 1000
    },
    buttonGroup: {
      position: 'absolute',
      bottom: 0,
      right: 4,
      zIndex: 100 // c.f. comment in endCapStyle()
    },
    button: {                            // Safari disables subpixel
      margin: '8px 4px',                 // aliasing during animations,
      WebkitFontSmoothing: 'antialiased' // to jarring effect.
    }
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
    return this.getItems().map( ({shape, sliceIndex, storeIndex}) =>
      <Shape key={sliceIndex}
             storeIndex={storeIndex}
             style={this.itemStyle()}
             data={shape}
             prefixes={this.props.prefixes} />
    );
  },

  render() {
    const disabledArrows = (this.state.sliding !==
                            this.enums.sliding.STOPPED) ||
                           this.state.gameOver;
    return <div style={this.containerStyle()}
                onClick={this.handleGenericInteraction}>
             <div style={this.endCapStyle()}>
               <Arrow style={this.staticStyles.arrow}
                      direction={'left'}
                      clickHandler={this.slideBackward}
                      disabled={disabledArrows} />
             </div>
             <div style={this.stockStyle()}>
               <div ref="slider"
                    style={this.sliderStyle()}>
                 {this.renderItems()}
               </div>
               <div style={this.messageContainerStyle()}>
                 <div style={this.messageStyle()}>
                   <span>{'Thanks for playing!'}</span>
                   <br />
                   <span>
                     {'April Arcus'}
                     <Heart style={{verticalAlign: '-30%',
                                    margin: '0 0.2em'}}
                            prefixes={this.props.prefixes}
                            onClick={this.handleReset} />
                     {'Patreon'}
                   </span>
                 </div>
               </div>
             </div>
             <div style={this.endCapStyle()}>
               <Arrow style={this.staticStyles.arrow}
                      direction={'right'}
                      clickHandler={this.slideForward}
                      disabled={disabledArrows} />
             </div>
             <div style={this.staticStyles.buttonGroup}>
               <Button style={this.staticStyles.button}
                       bsStyle="default"
                       bsSize="large"
                       value="Reset"
                       onClick={this.handleReset} />
               <Button style={this.staticStyles.button}
                       bsStyle="default"
                       bsSize="large"
                       value="Clear"
                       onClick={this.handleClear}
                       disabled={this.state.gameOver} />
             </div>
           </div>;
  }
});
