'use strict';

const React = require('react');
const PureRenderMixin = require('react/addons').addons.PureRenderMixin;
const keyMirror = require('react/lib/keyMirror');
const Immutable = require('immutable');
const CarouselItem = require('./CarouselItem');
const CarouselStore = require('../stores/CarouselStore');
const CarouselActions = require('../actions/CarouselActions');

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    numItems: React.PropTypes.number,
    numSlots: function(props, propName, componentName) {

      function rangeCheck(props, propName, componentName) {
        if (props[propName] > props.numItems) {
              return new Error('Carousel must be initialized with ' +
                               'enough items to fill every slot.')
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
    slideDuration: React.PropTypes.number,
    fullscreen: React.PropTypes.bool
  },

  validateSlots(props, propName, componentName) {
    React.PropTypes.number(props, propName, componentName);
    if (props[propName] > props.numItems) {
      return new Error('Carousel may not be initialized with more slots' +
                       'than items')
    }
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
            gameOver: false};
  },

  componentDidMount() {
    CarouselStore.addChangeListener(this.onChange);
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
    this.setState({genericInteractions: this.state.genericInteractions + 1})
    // don't respawn if the user's first interaction is with the
    // 'clear' button!
    if ((this.state.genericInteractions + 1) % this.props.respawnThreshold === 0) {
      CarouselActions.respawn();
    }
  },

  handleReset() {
    CarouselActions.reset(this.props.numItems);
  },

  handleClear() {
    CarouselActions.clear();
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

  // c.f. Christopher Chedeau's terrific talk, "React: CSS in JS"
  // http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
  // https://vimeo.com/channels/684289/116209150
  staticStyles: {
    container: {
      display: 'table-row'    // flexbox is the modern way to build
    },                        // this type of layout, but display: table
    verticalAligner: {        // and friends work adequately for this 
      display: 'table-cell',  // case and enjoy ubiquitous support.
      verticalAlign: 'middle'
    },
    overflowConcealer: {
      display: 'table-cell',  // 100% of container width after
      width: '100%',          // accounting for the navigational buttons
      overflowX: 'hidden',
      overflowY: 'hidden'
    },
    slider: {
      position: 'relative',   // later, we will calculate how much to
      whiteSpace: 'nowrap'    // shift the slider relative to its parent
    },
    item: {
      display: 'inline-block'
    },
    gameOverVerticalAligner: { //    flexbox would have obviated the
      position: 'absolute',    // 1  need for this non-semantic wrapper
      top: '50%',              // 2  div and these five numbered style
      width: '100%'            // 3  properties
    },
    gameOverText: {
      position: 'absolute',    // 4
      top: '-0.5em',           // 5  
      width: '100%',
      textAlign: 'center',
      fontSize: 50
    },
    leftArrow: {
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
      textAlign: 'right'
    },
    button: { // fake Twitter Bootstrap button
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

  render() {
    // suppress render until the backing store is initialized
    if (this.state.items === undefined) return <div />

    const dynamicStyles = {};
    const itemWidth = 100 / this.props.numSlots;
    dynamicStyles.slider = Object.assign({},
                                         this.staticStyles.slider
                                         // {height: 0,
                                         //  paddingBottom: `${itemWidth}%`}
                                          )

    // } else if (this.state.gameOver) {
    // items = <div style={this.staticStyles.gameOverVerticalAligner}>
    //           <div style={this.staticStyles.gameOverText}>
    //             Game Over
    //           </div>
    //         </div>

    // calculate the slider's left offset and supply an appropriate
    // transition: ease while sliding, snap before re-render.
    let slidingStyle;
    switch(this.state.sliding) {
      case this.enums.sliding.FORWARD:
        slidingStyle = {left: `-${2 * itemWidth}%`,
                        transition: `left ${this.props.slideDuration}ms ease`};
        break;
      case this.enums.sliding.BACKWARD:
        slidingStyle = {left: 0,
                        transition: `left ${this.props.slideDuration}ms ease`};
        break;
      default:
        slidingStyle = {left: `-${itemWidth}%`,
                        transition: 'none'};
      }
    Object.assign(dynamicStyles.slider, slidingStyle);

    // get the items we need and render them.
    dynamicStyles.item = Object.assign({},
                                       this.staticStyles.item,
                                       {width: `${itemWidth}%`});
    const withIndices = this.state.items.toKeyedSeq()
                                        .map( (shape, storeIndex) =>
                                              [shape, storeIndex] );
    const circularized = Immutable.Repeat(withIndices).flatten(1);
    const slice = circularized.slice(this.state.offsetIndex,
                                     this.state.offsetIndex + this.props.numSlots + 2);
    let items = slice.map( ([shape, storeIndex], sliceIndex) =>
      <CarouselItem key={storeIndex +                       // a unique and
                         Math.floor(sliceIndex /            // stable key saves
                                    this.state.items.size)} // DOM operations
                    index={storeIndex}
                    style={dynamicStyles.item}
                    hp={shape.hp}
                    seed={shape.seed}/>);
    items = items.toArray(); // FIXME: React 0.13 will support custom
                             // iterables in JSX, but for now we must
                             // convert to the built-in Array type.

    return <div style={{position: 'relative'}}
                onClick={this.handleGenericInteraction}>
             <div style={this.staticStyles.container}>
               <div style={this.staticStyles.verticalAligner}>
                 <input type="button"
                        style={this.staticStyles.leftArrow}
                        disabled={this.state.sliding !==
                                  this.enums.sliding.STOPPED}
                        onClick={this.slideBackward} />
               </div>
               <div style={this.staticStyles.overflowConcealer}>
                 <div style={dynamicStyles.slider}>
                   {items}
                 </div>
                 Game Over
               </div>
               <div style={this.staticStyles.verticalAligner}>
                 <input type="button"
                        style={this.staticStyles.rightArrow}
                        disabled={this.state.sliding !==
                                  this.enums.sliding.STOPPED}
                        onClick={this.slideForward} />
               </div>
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
