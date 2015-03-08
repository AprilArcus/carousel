'use strict';

const React = require('react');
const PureRenderMixin = require('react/addons').addons.PureRenderMixin;
const Immutable = require('immutable');

const CarouselItem = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    text: React.PropTypes.string
  },

  styles: {
    setAspectRatio: {
      width: '100%',
      height: 0,
      paddingBottom: '100%'
    }
  },

  render() {
    let foo = {backgroundColor: this.props.text,
               width: 10,
               height: '100%',
               position: 'absolute',
               bottom: 0,
               left: 0,
               right: 0,
               margin: '0 auto'
               };

    return <div style={this.props.style}>
             <div style={this.styles.setAspectRatio}>
               <div style={foo} />
             </div>
           </div>;
  }
});

const Carousel = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    numItems: React.PropTypes.number,
    slideDuration: React.PropTypes.number
  },

  getDefaultProps() {
    return {numItems: 6,
            slideDuration: 150};
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
    // if (window.addEventListener) { // standards
    window.addEventListener('keydown', this.handleKeyDown);
    // } else if (window.attachEvent) { // IE 8
    //   window.attachEvent('onkeydown', this.handleKeyDown);
    // }
  },

  componentWillUnmount() {
    // if (window.removeEventListener) { // standards
    window.removeEventListener('keydown', this.handleKeyDown);
    // } else if (window.detachEvent) { // IE 8
    //   window.detachEvent('onkeydown', this.handleKeyDown);
    // }
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
      }
      else if (event.keyCode === 39) { // right arrow key
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
      const last = this.state.items.last();
      const items = this.state.items.pop().unshift(last);
      this.setState({items: items});
    } else if (this.state.sliding === this.enums.sliding.forward) {
      const first = this.state.items.first();
      const items = this.state.items.shift().push(first);
      this.setState({items: items});
    }
    this.setState({sliding: this.enums.sliding.stopped});
  },

  // c.f. Christopher Chedeau's terrific talk, "React: CSS in JS"
  // http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
  // https://vimeo.com/channels/684289/116209150

  staticStyles: {
    container: Immutable.Map({
      display: 'table-row'    // flexbox is the modern way to build
    }),                       // this type of layout, but display: table
    verticalAligner: {        // and friends work perfectly and are
      display: 'table-cell',  // supported ubiquitously.
      verticalAlign: 'middle'
    },
    overflowConcealer: {
      display: 'table-cell',  // 100% of container width after
      width: '100%',          // accounting for the navigational buttons
      overflowX: 'hidden',
      overflowY: 'hidden'
    },
    slider: Immutable.Map({
      position: 'relative',   // later, we will calculate how much to
      whiteSpace: 'nowrap'    // shift the slider relative to its parent
    }),
    item: Immutable.Map({
      display: 'inline-block',
      position: 'relative'
    }),
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
    const itemWidth = 100 / this.props.numItems;
    const styles = {};
    styles.container = this.staticStyles.container.merge(this.props.style)
                                                  .toObject();

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
    styles.slider = this.staticStyles.slider.merge(slidingStyle)
                                            .toObject();

    styles.item = this.staticStyles.item.merge({width: `${itemWidth}%`})
                                        .toObject();

    // render the items we need
    const items = Immutable.Seq(this.state.items)
                           .concat(this.state.items)
                           .take(this.props.numItems + 2)
                           .map( (e, i) => <CarouselItem key={i}
                                                         style={styles.item}
                                                         text={e}/>)
                           .toArray();

    return <div style={this.staticStyles.container}>
             <span style={this.staticStyles.verticalAligner}>
               <input type="button"
                      style={this.staticStyles.leftArrow}
                      disabled={this.state.sliding !== this.enums.sliding.stopped}
                      onClick={this.slideBackward} />
             </span>
             <span style={this.staticStyles.overflowConcealer}>
               <span style={styles.slider}>
                 {items}
               </span>
             </span>
             <span style={this.staticStyles.verticalAligner}>
               <input type="button"
                      style={this.staticStyles.rightArrow}
                      disabled={this.state.sliding !== this.enums.sliding.stopped}
                      onClick={this.slideForward} />
             </span>
           </div>;
  }
});

module.exports = Carousel;
