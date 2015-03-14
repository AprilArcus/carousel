/* eslint-env es6 */
import React from 'react';
import { addons } from 'react/addons';
const PureRenderMixin = addons.PureRenderMixin;

const staticStyles = {
  body: {
    fill: '#FF5151',
    stroke: '#FF0000',
    strokeWidth: 6
  },
  highlight: {
    fill: '#FE9F9F',
    stroke: '#FF7082',
    strokeWidth: 2
  }
};

export default React.createClass({
  mixins: [PureRenderMixin],

  getDefaultProps() {
    return {prefixes: {transform: 'transform'}};
  },

  containerStyle() {
    const style = {width: '2em',
                   overflow: 'visible',
                   [this.props.prefixes.transform]: 'rotate(10deg)'};
    return Object.assign(style, this.props.style);
  },

  render() {
    return <svg viewBox="-50 -50 100 100"
                style={this.containerStyle()} >
             <polygon style={staticStyles.body}
                      points="-49.8870482,-26.2989768 -39.0069654,-46.9427149 -17.4011672,-46.9427149 2.3781062,-28.7723073 18.6474021,-46.9427149 35.5619352,-50.0348489 49.8908133,-28.7723073 45.2400226,-5.7823901 -2.3541039,45.1130235 -45.1807229,-0.6313452 -49.8870482,-26.2989768" />
             <polygon style={staticStyles.highlight}
                      points="-27.7099021,-37.9912556 -37.4162274,-27.4292116 -35.8960843,-16.2163408 -31.8608810,-26.4223608 -21.5041416,-36.0934030 -27.7099021,-37.9912556" />
             <polygon style={staticStyles.highlight}
                      points="22.8247364,-37.9808951 12.8717997,-27.8803637 22.8247364,-30.9960442 30.7807794,-39.0094087 22.8247364,-37.9808951" />
           </svg>;
  }
});
