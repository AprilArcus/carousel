/* eslint-env es6 */
import React from 'react';
import PureComponent from './PureComponent';

let styles, points;

export default class Arrow extends PureComponent {

  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (!this.props.disabled) this.props.clickHandler();
  }

  render() {
    const disabled = this.props.disabled;
    return <svg viewBox="0 0 100 100"
                style={this.props.style}
                onClick={this.handleClick} >
             <polygon style={styles.arrow(disabled)}
                      points={points[this.props.direction]} />
           </svg>;
  }
}

Arrow.propTypes = {
  disabled: React.PropTypes.bool,
  clickHandler: React.PropTypes.func.isRequired,
  direction: React.PropTypes.oneOf(['left', 'right']).isRequired
};

Arrow.defaultProps = {disabled: false};

//------------------------------ Styles ------------------------------//

points = {
  left: '81,13 0,48 99,90 49,47',
  right: '2,0 40,38 8,78 100,42'
};

styles = {
  arrow(disabled) {
    const style = { fill: '#fff' };
    if (disabled) {
      style.opacity = 0.5;
      style.transition = 'none';
    } else {
      style.opacity = 1.0;
      style.transition = 'all 150ms ease-in';
      // style.mixBlendMode: 'difference'
    }
    return style;
  }
};
