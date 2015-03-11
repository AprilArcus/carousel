/* eslint-env es6, node */
import React from 'react';
import { addons } from 'react/addons';
const PureRenderMixin = addons.PureRenderMixin;
import keyMirror from 'react/lib/keyMirror';
import Immutable from 'immutable';
import Shape from './Shape';
import CarouselStore from '../stores/CarouselStore';
import CarouselActions from '../actions/CarouselActions';

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
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

    },
    respawnThreshold: React.PropTypes.number,
    slideDuration: React.PropTypes.number
  },

  getDefaultProps() {
    return {numItems: 6,
            numSlots: 6,
            respawnThreshold: 12,
            slideDuration: 150,
            fullscreen: false};
  },

  enums: {
    sliding: keyMirror({
      BACKWARD: null,
      STOPPED: null,
      FORWARD: null
    })
  },

  getInitialState() {
    return {sliding: this.enums.sliding.STOPPED,
            offsetIndex: 0,
            genericInteractions: 0,
            gameOver: false,
            flex: 'standards',
            transforms: 'standards'};
  },

  testFeatures() {
    const testNode = document.createElement('div');
    testNode.style.display = 'flex';
    if (testNode.style.display !== 'flex') {
      testNode.style.display = '-webkit-flex';
      if (testNode.style.display === '-webkit-flex') {
        this.webkitFlexFixUp();
        this.setState({flex: 'webkit'});
      }
    }
    testNode.style.transform = 'Garbage Data';
    if (testNode.style.transform === 'Garbage Data') {
      testNode.style.WebkitTransform = 'Garbage Data';
      if (testNode.style.WebkitTransform !== 'Garbage Data') {
        this.setState({transforms: 'webkit'});
      }
    }
  },

  componentDidMount() {
    CarouselStore.addChangeListener(this.onChange);
    this.testFeatures();
    this.handleReset();
    // React's onKeyDown event only listens when the component or
    // a child has focus. This is certainly the right thing to do
    // in general (what if we have multiple of these carousel
    // components on a single page?) but in the spirit of Patreon's
    // specification, which seems to gesturetoward a sort of shooting
    // gallery type interface, we implement keyboard input in a game-
    // like way. To this end, we add global event listeners in the
    // lifecycle callbacks...
    window.addEventListener('keydown', this.handleKeyDown);
  },

  componentWillUnmount() {
    CarouselStore.removeChangeListener(this.onChange);
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

    // FIXME: the DOM level 2 KeyboardEvent API is a mess.
    // KeyboardEvent.keyCode has universal support, and
    // KeyboardEvent.which has support in IE9+, but MDN considers both
    // to be deprecated since they are ambiguous on non-QWERTY layouts.
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    // However, as of March 2015, the proposed DOM level 3 replacements
    // KeyboardEvent.key and KeyboardEvent.code remain unimplemented:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=680830
    if (document.activeElement.tagName === 'BODY' &&
        this.state.sliding === this.enums.sliding.STOPPED) {
      if ((event.keyCode === 0x25 ||  // left arrow
           event.keyCode === 0x48 ||  // h
           event.keyCode === 0x41) && // a
         !(event.altKey || event.metaKey)) {
        this.slideBackward();
        this.handleGenericInteraction();
        event.stopPropagation();
      } else if ((event.keyCode === 0x27 ||  // right arrow
                  event.keyCode === 0x4C ||  // l
                  event.keyCode === 0x44) && // d
                !(event.altKey || event.metaKey)) {
        this.slideForward();
        this.handleGenericInteraction();
        event.stopPropagation();
      }
    }
  },

  handleGenericInteraction() {
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
    // Listening for transitionEnd events is unreliable across browsers
    // and not yet supported by the React public API.
    //
    // c.f. https://github.com/facebook/react/blob/master/src/addons/transitions/ReactTransitionEvents.js
    //      https://github.com/twbs/bootstrap/blob/master/js/transition.js
    //
    // We could add a listener to the DOM by hand, with a call to an
    // undocumented API, like so:
    //
    // componentDidMount() {
    //   ReactTransitionEvents.addEndEventListener(getSliderDOMNode(),
    //                                             this.stopSlide());
    // }
    //
    // but we would still need to call setTimeout as a backup and to
    // support older browsers, so for now we opt for parsimony.
    window.setTimeout(this.stopSlide, this.props.slideDuration);
  },

  slideForward() {
    this.setState({sliding: this.enums.sliding.FORWARD});
    window.setTimeout(this.stopSlide, this.props.slideDuration);
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

  // We store styles internally and apply them inline with JS. While
  // heterodox, this gives us the freedom to calculate styles on the fly
  // without using global classnames, and facilitates componentization.
  //
  // c.f. Christopher Chedeau's terrific talk, "React: CSS in JS"
  // http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
  // https://vimeo.com/channels/684289/116209150
  styles: {
    container: {
      position: 'relative', // we'll position the reset and clear
      display: 'flex',      // buttons relative to the outer div.
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
      height: '100%' // occupy the full height of our parent rather than
    },               // the natural height of the tallest carousel item.
    endCap: {
      flexShrink: 0,
      zIndex: 100      // setting negative zIndex on the carousel items
    },                 // would break their onClick handlers, so we use
    stock: {           // positive indices [0,20) there to randomize
      flexGrow: 1,     // their layering and compensate for it here.
      display: 'flex',
      alignItems: 'center',
      position: 'relative'     // the stock is the reference for the
      // position: 'absolute', // slider and the 'game over' message.
      // top: 0,               // when running at full bleed, it's
      // right: 0,             // aesthetically preferrable to use
      // bottom: 0,            // absolute positioning -- this
      // left: 0               // effectively insets the endcaps.
    },                         // However, this appears to trigger a
    slider: {                  // rendering bug in Gecko.
      flexGrow: 1,
      position: 'relative', // we will calculate how much to offset the
      whiteSpace: 'nowrap'  // slider in sliderStyle()
    },
    messageContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    message: {
      textAlign: 'center',
      fontSize: 50,
      fontWeight: 100
    },
    item: {
      display: 'inline-block'
    },
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

  webkitFlexFixUp() {
    this.styles.container.display = '-webkit-flex';
    this.styles.container.WebkitAlignItems =
      this.styles.container.alignItems;
    this.styles.container.WebkitJustifyContent =
      this.styles.container.justifyContent;
    this.styles.endCap.WebkitFlexShrink =
      this.styles.endCap.flexShrink;
    this.styles.stock.WebkitFlexGrow =
      this.styles.stock.flexGrow;
    this.styles.stock.display = '-webkit-flex';
    this.styles.stock.WebkitAlignItems =
      this.styles.stock.alignItems;
    this.styles.slider.WebkitFlexGrow =
      this.styles.slider.flexGrow;
    this.styles.messageContainer.display = '-webkit-flex';
    this.styles.messageContainer.WebkitJustifyContent =
      this.styles.messageContainer.justifyContent;
    this.styles.messageContainer.WebkitAlignItems =
      this.styles.messageContainer.alignItems;
  },

  containerStyle() {
    return Object.assign({}, this.props.style, this.styles.container);
  },

  messageStyle() {
    let messageStyle;
    if (this.state.gameOver) {
      messageStyle = {transform: 'scale(1,1)',
                      transition: 'all 450ms cubic-bezier(.4,1.4,.4,1)'};
    } else {
      messageStyle = {transform: 'scale(0,0)', transition: 'none'};
    }

    if (this.state.transforms === 'webkit') {
      messageStyle.WebkitTransform = messageStyle.transform;
    }

    return Object.assign({}, this.styles.message, messageStyle);
  },

  sliderStyle() {
    const itemWidth = 100 / this.props.numSlots;
    let slidingStyle;
    switch(this.state.sliding) {
      case this.enums.sliding.FORWARD:
        slidingStyle = {left: `-${3 * itemWidth}%`,
                        transition: `left ${this.props.slideDuration}ms ease`};
        break;
      case this.enums.sliding.BACKWARD:
        slidingStyle = {left: `-${1 * itemWidth}%`,
                        transition: `left ${this.props.slideDuration}ms ease`};
        break;
      default:
        slidingStyle = {left: `-${2 * itemWidth}%`, transition: 'none'};
    }
    return Object.assign({}, this.styles.slider, slidingStyle);
  },

  itemStyle() {
    const itemWidth = 100 / this.props.numSlots;
    return Object.assign({}, this.styles.item, {width: `${itemWidth}%`});
  },

  renderItems() {
    // Fetch the items we need. We grab four extra (two on each side)
    // to mitigate pop-in.
    const withIndices = this.state.items.toKeyedSeq()
                                        .map( (shape, storeIndex) =>
                                              [shape, storeIndex] );
    // n.b. Immutable.Repeat returns an IndexedSeq
    const circularized = Immutable.Repeat(withIndices).flatten(1);
    const slice = circularized.slice(this.state.offsetIndex,
                                     this.state.offsetIndex + this.props.numSlots + 4);
    // now render them.
    const items = slice.map( ([shape, storeIndex], sliceIndex) =>
      // a unique and stable key avoids unecessary DOM operations. If we
      // didn't have padding, the storeIndex would be fine by itself,
      // but since some shapes will be rendered twice, we take extra
      // care here.
      <Shape key={storeIndex + this.state.items.size *
                  Math.floor(sliceIndex / this.state.items.size)}
             index={storeIndex}
             style={this.itemStyle()}
             hp={shape.hp}
             seed={shape.seed}
             transforms={this.state.transforms} />);
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
             <div style={this.styles.endCap}>
               <input type="button"
                      style={this.styles.leftArrow}
                      disabled={this.state.sliding !==
                                this.enums.sliding.STOPPED}
                      onClick={this.slideBackward} />
             </div>
             <div style={this.styles.stock}>
               <div style={this.sliderStyle()}>
                 {this.renderItems()}
               </div>
               <div style={this.styles.messageContainer}>
                 <span style={this.messageStyle()}>
                   {'Thanks for Playing!'}
                   <br />
                   {'April Arcus <3 Patreon'}
                 </span>
               </div>
             </div>
             <div style={this.styles.endCap}>
               <input type="button"
                      style={this.styles.rightArrow}
                      disabled={this.state.sliding !==
                                this.enums.sliding.STOPPED}
                      onClick={this.slideForward} />
             </div>
             <div style={this.styles.buttonGroup}>
               <input type="button"
                      style={this.styles.button}
                      value="Reset"
                      onClick={this.handleReset} />
               <input type="button"
                      style={this.styles.button}
                      value="Clear"
                      disabled={this.state.gameOver}
                      onClick={this.handleClear} />
             </div>
           </div>;
  }
});
