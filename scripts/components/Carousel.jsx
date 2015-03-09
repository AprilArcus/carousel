'use strict';

const React = require('react');
const PureRenderMixin = require('react/addons').addons.PureRenderMixin;
const Immutable = require('immutable');
const CarouselItem = require('./CarouselItem');

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    numItems: React.PropTypes.number,
    numSlots: React.PropTypes.number,
    slideDuration: React.PropTypes.number
  },

  getDefaultProps() {
    return {numItems: 6, numSlots: 6, slideDuration: 150};
  },

  enums: {
    sliding: {
      backward: -1,
      stopped: 0,
      forward: 1
    }
  },

  getInitialState() {
    return {sliding: this.enums.sliding.stopped,
            offsetIndex: 0,
            items: Immutable.List.of('red', 'orange', 'yellow', 'green',
                                     'cyan', 'blue')};
  },

  // React's onKeyDown event only listens when the component or a child
  // has focus. This is probably the right thing to do in general (what
  // if we have multiple of these carousel components on a single page?)
  // but in the spirit of the specification, which seems to gesture
  // toward a sort of shooting gallery type interface, we implement
  // keyboard input in a game-like way. To this end, we add global event
  // listeners in the lifecycle callbacks...
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  },

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },

  handleKeyDown(event) {
    // ...and attempt to mitigate the most questionable aspect of this
    // approach with a guard clause against the possibility of another
    // focused element.
    if (document.activeElement.tagName === 'BODY' &&
        this.state.sliding === this.enums.sliding.stopped) {
      if (event.keyCode === 37) { // left arrow key
        this.slideBackward();
        event.stopPropagation();
      } else if (event.keyCode === 39) { // right arrow key
        this.slideForward();
        event.stopPropagation();
      }
    }
  },

  slideBackward() {
    this.setState({sliding: this.enums.sliding.backward});
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
    // but we would still need to call setTimeout to support IE9 and
    // in case the transitionEnd event fails to fire, so for now we opt
    // for parsimony.
    window.setTimeout(this.stopSlide, this.props.slideDuration);
  },

  slideForward() {
    this.setState({sliding: this.enums.sliding.forward});
    window.setTimeout(this.stopSlide, this.props.slideDuration);
  },

  stopSlide() {
    if (this.state.sliding === this.enums.sliding.backward) {
      const newOffsetIndex =
        (this.state.offsetIndex - 1 + this.props.numSlots) % this.props.numSlots;
      this.setState({offsetIndex: newOffsetIndex});
    } else if (this.state.sliding === this.enums.sliding.forward) {
      const newOffsetIndex =
        (this.state.offsetIndex + 1) % this.props.numSlots;
      this.setState({offsetIndex: newOffsetIndex});
    }
    this.setState({sliding: this.enums.sliding.stopped});
  },

  // c.f. Christopher Chedeau's terrific talk, "React: CSS in JS"
  // http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
  // https://vimeo.com/channels/684289/116209150
  staticStyles: {
    container: {
      display: 'table-row'    // flexbox is the modern way to build
    },                        // this type of layout, but display: table
    verticalAligner: {        // and friends work perfectly for this 
      display: 'table-cell',  // case and enjoy ubiquitous support.
      verticalAlign: 'middle'
    },
    overflowConcealer: {
      display: 'table-cell',  // 100% of container width after
      width: '100%',          // accounting for the navigational buttons
      overflowX: 'hidden',
      overflowY: 'hidden',
      textAlign: 'center',
      verticalAlign: 'middle'
    },
    slider: {
      position: 'relative',   // later, we will calculate how much to
      whiteSpace: 'nowrap'    // shift the slider relative to its parent
    },
    item: {
      display: 'inline-block',
      // position: 'relative'
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
    }
  },

  render() {
    const dynamicStyles = {};
    // allow our caller to pass inline styles to the outermost container
    // provided they don't conflict with the ones we use.
    dynamicStyles.container = Object.assign({},
                                            this.props.style,
                                            this.staticStyles.container);

    // calculate the slider's left offset and supply an appropriate
    // transition: ease while sliding, snap before re-render.
    const itemWidth = 100 / this.props.numSlots;
    let slidingStyle;
    switch(this.state.sliding) {
      case this.enums.sliding.forward:
        slidingStyle = {left: `-${2 * itemWidth}%`,
                        transition: `left ${this.props.slideDuration}ms ease`};
        break;
      case this.enums.sliding.backward:
        slidingStyle = {left: 0,
                        transition: `left ${this.props.slideDuration}ms ease`};
        break;
      default:
        slidingStyle = {left: `-${itemWidth}%`,
                        transition: 'none'};
    }
    dynamicStyles.slider = Object.assign({},
                                         this.staticStyles.slider,
                                         slidingStyle);

    // get the items we need and render them.
    dynamicStyles.item = Object.assign({},
                                       this.staticStyles.item,
                                       {width: `${itemWidth}%`});
    const items = Immutable.Repeat(this.state.items)
                           .flatten(1)
                           .slice(this.state.offsetIndex,
                                  this.state.offsetIndex + this.props.numSlots + 2)
                           .map((e, i) =>
                                <CarouselItem key={i}
                                              style={dynamicStyles.item}
                                              hp={3}
                                              seed={e}/>)
                           .toArray(); // React 0.13 will support custom
                                       // iterables in JSX, but for now
                                       // we must cast to the built-in
                                       // Array type.

    return <div style={this.staticStyles.container}>
             <div style={this.staticStyles.verticalAligner}>
               <input type="button"
                      style={this.staticStyles.leftArrow}
                      disabled={this.state.sliding !==
                                this.enums.sliding.stopped}
                      onClick={this.slideBackward} />
             </div>
             <div style={this.staticStyles.overflowConcealer}>
               <div style={dynamicStyles.slider}>
                 {items}
               </div>
             </div>
             <div style={this.staticStyles.verticalAligner}>
               <input type="button"
                      style={this.staticStyles.rightArrow}
                      disabled={this.state.sliding !==
                                this.enums.sliding.stopped}
                      onClick={this.slideForward} />
             </div>
           </div>;
  }
});
