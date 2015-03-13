/* eslint-env es6 */
import React from 'react';
import { PureRenderMixin } from 'react/addons';

const points = {
  left: '81,13 0,48 99,90 49,47',
  right: '2,0 40,38 8,78 100,42'
};

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    disabled: React.PropTypes.bool,
    clickHandler: React.PropTypes.func.isRequired,
    direction: React.PropTypes.oneOf(['left', 'right']).isRequired
  },

  getDefaultProps() {
    return {disabled: false};
  },

  arrowStyle() {
    const style = {
      opacity: 1.0,
      transition: 'all 150ms ease-in',
      fill: '#fff'
      // mixBlendMode: 'difference'
    };
    if (this.props.disabled) {
      style.opacity = 0.5;
      style.transition = 'none';
    }
    return style;
  },

  handleClick() {
    if (!this.props.disabled) this.props.clickHandler();
  },

  render() {
    return <svg viewBox="0 0 100 100"
                style={this.props.style}
                onClick={this.handleClick} >
             <polygon style={this.arrowStyle()}
                      points={points[this.props.direction]} />
           </svg>;
  }
});
