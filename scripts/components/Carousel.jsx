/* eslint-env es6, node */
import React from 'react';
// import { addons } from 'react/addons';
import keyMirror from 'react/lib/keyMirror';
import Immutable from 'immutable';
import Shape from './Shape';
import CarouselStore from '../stores/CarouselStore';
import CarouselActions from '../actions/CarouselActions';
import ReactTransitionEvents from 'react/lib/ReactTransitionEvents';

export default React.createClass({
  mixins: [React.addons.PureRenderMixin],

  propTypes: {
    respawnThreshold: React.PropTypes.number,
    slideDuration: React.PropTypes.number,
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
        // side effects are sometimes useful
        error = validator(props, propName, componentName);
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
      slideDuration: 150,
      fullscreen: false,
      prefixes: {
        flex: 'flex',
        flexShrink: 'flexShrink',
        flexGrow: 'flexGrow',
        alignItems: 'alignItems',
        justifyContent: 'justifyContent',
        transform: 'transform'}
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
    CarouselActions.reset(this.props.numItems);

    // TODO: getDOMNode() is deprecated in React 0.13
    // const sliderNode = React.findDOMNode(this.refs.slider);    // 0.13
    const sliderNode = this.getDOMNode().children[1].children[0]; // 0.12
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

    // TODO: getDOMNode() is deprecated in React 0.13
    // const sliderNode = React.findDOMNode(this.refs.slider);    // 0.13
    const sliderNode = this.getDOMNode().children[1].children[0]; // 0.12
    ReactTransitionEvents.removeEndEventListener(sliderNode, this.stopSlide);

    window.removeEventListener('keydown', this.handleKeyDown);
  },

  onChange() {
    this.setState({items: CarouselStore.get(),
                   gameOver: CarouselStore.isEmpty()});
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
      const newOffsetIndex =
        (this.state.offsetIndex - 1 + this.props.numItems) % this.props.numItems;
      this.setState({offsetIndex: newOffsetIndex});
    } else if (this.state.sliding === this.enums.sliding.FORWARD) {
      const newOffsetIndex =
        (this.state.offsetIndex + 1) % this.props.numItems;
      this.setState({offsetIndex: newOffsetIndex});
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

  stockStyle() {
    return { // the stock is the reference for the slider and the 'game
      [this.props.prefixes.flexGrow]: 1, // over' message. when
      display: this.props.prefixes.flex, // running at full bleed
      [this.props.prefixes.alignItems]: 'center', // it is aesthetically
      position: 'relative'               // preferrable to use absolute
      // position: 'absolute',           // positioning -- this effec-
      // top: 0,                         // tively insets the endcaps.
      // right: 0,                       // However, doing so triggers a
      // bottom: 0,                      // rendering bug in Gecko.
      // left: 0                         // TODO: make minimal
    };                                   // test case, file bug.
  },

  sliderStyle() {
    const itemWidth = 100 / this.props.numSlots;
    let left, transition;
    switch(this.state.sliding) {
      case this.enums.sliding.FORWARD:
        left = `-${3 * itemWidth}%`;
        transition = `left ${this.props.slideDuration}ms ease`;
        break;
      case this.enums.sliding.BACKWARD:
        left = `-${1 * itemWidth}%`;
        transition = `left ${this.props.slideDuration}ms ease`;
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
    let transform, transition;
    if (this.state.gameOver) {
      transform = 'scale(1,1)';
      transition = 'all 450ms cubic-bezier(0.4,1.4,0.4,1.0)';
    } else {
      transform = 'scale(0,0)';
      transition = 'none';
    }
    return {
      textAlign: 'center',
      fontSize: 50,
      fontWeight: 100,
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
    leftArrow: {
      margin: 10,
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      padding: 0,
      borderTop: '15px solid transparent',
      borderRight: '15px solid black',
      borderBottom: '15px solid transparent',
      borderLeft: 0
    },
    rightArrow: {
      margin: 10,
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      padding: 0,
      borderTop: '15px solid transparent',
      borderRight: 0,
      borderBottom: '15px solid transparent',
      borderLeft: '15px solid black'
    },
    buttonGroup: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      zIndex: 100
    },
    button: { // fake twitter bootstrap button
      display: 'inlineBlock',
      webkitAppearance: 'button',
      marginLeft: 4,
      height: 34,
      fontSize: 14,
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: 4,
      padding: '6px 12px',
      lineHeight: 1.428571429
    }
  },

  renderItems() {
    // Fetch the items we need...
    const withIndices = this.state.items.toKeyedSeq()
                                        .map( (shape, storeIndex) =>
                                              [shape, storeIndex] );
    // (n.b. Immutable.Repeat always returns an IndexedSeq)
    const circularized = Immutable.Repeat(withIndices).flatten(1);
    // (we grab four extra -- two on each side -- to mitigate pop-in)
    const slice = circularized.slice(this.state.offsetIndex,
                                     this.state.offsetIndex
                                       + this.props.numSlots + 4);
    // ...and render them:
    const items = slice.map( ([shape, storeIndex], sliceIndex) =>
      // a unique and stable key avoids unecessary DOM operations. If we
      // didn't have padding, the storeIndex would be fine by itself,
      // but since some shapes will be rendered twice, we take extra
      // care here. There is still one in/del per slide with this key,
      // which wouldn't be necessary provided we aren't concerned about
      // loss-of-precision errors (it would take 40 million years to
      // lose integer precision on a double precision float at 150ms per
      // slide) but immutable.js crashes node when I try to slice neg-
      // ative indices out of an infinite list, so we'll live with it.
      <Shape key={storeIndex + this.state.items.size *
                  Math.floor(sliceIndex / this.state.items.size)}
             index={storeIndex}
             style={this.itemStyle()}
             hp={shape.hp}
             seed={shape.seed}
             prefixes={this.props.prefixes} />);
    return items.toArray(); // FIXME: React 0.13 will support custom
  },                        // iterables in JSX, but for now we must
                            // convert to the built-in Array type.
  render() {
    // suppress render until the backing store is initialized
    if (this.state.items === undefined) {
      return <div style={this.containerStyle()} />;
    }

    return <div style={this.containerStyle()}
                onClick={this.handleGenericInteraction}>
             <div style={this.endCapStyle()}>
               <input type="button"
                      style={this.staticStyles.leftArrow}
                      disabled={this.state.sliding !==
                                this.enums.sliding.STOPPED}
                      onClick={this.slideBackward} />
             </div>
             <div style={this.stockStyle()}>
               <div ref="slider" style={this.sliderStyle()}>
                 {this.renderItems()}
               </div>
               <div style={this.messageContainerStyle()}>
                 <span style={this.messageStyle()}>
                   {'Thanks for Playing!'}
                   <br />
                   {'April Arcus <3 Patreon'}
                 </span>
               </div>
             </div>
             <div style={this.endCapStyle()}>
               <input type="button"
                      style={this.staticStyles.rightArrow}
                      disabled={this.state.sliding !==
                                this.enums.sliding.STOPPED}
                      onClick={this.slideForward} />
             </div>
             <div style={this.staticStyles.buttonGroup}>
               <input type="button"
                      style={this.staticStyles.button}
                      value="Reset"
                      onClick={this.handleReset} />
               <input type="button"
                      style={this.staticStyles.button}
                      value="Clear"
                      disabled={this.state.gameOver}
                      onClick={this.handleClear} />
             </div>
           </div>;
  }
});
