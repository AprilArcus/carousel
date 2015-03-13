/* eslint-env es6 */
import React from 'react';
import { PureRenderMixin } from 'react/addons';
import { lighten, darken } from '../utils/colorHelpers'
import variables from '../utils/bootstrapVariables'

export default React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    bsSize: React.PropTypes.oneOf(['base', 'large', 'small', 'tiny']),
    bsStyle: React.PropTypes.oneOf(['default', 'primary', 'success', 'info',
                                    'warning', 'danger', 'link']),
    disabled: React.PropTypes.bool
  },

  getDefaultProps() {
    return {bsStyle: 'default', bsSize: 'base'};
  },

  getInitialState() {
    return {
      hover: false,
      active: false,
      focus: false
    };
  },

  linkStyle() {
    // styles for buttons disguised as links

    // https://github.com/twbs/bootstrap/blob/65721f531536e05026b1ae5f0359955c78d13156/less/buttons.less
    // ll 84-121
    const style = {
      color: variables.link.color,                                      // ln 89
      fontWeight: 'normal',                                             // ln 90
      backgroundColor: 'transparent'                                    // lns 98, 111
    };

    if (this.props.disabled) {
      style.color = variables.btn.link.disabled.color;                  // ln 117
    } else {
      if (this.state.hover || this.state.focus) {
        style.color = variables.link.hover.color;                       // ln 109
        style.textDecoration = variables.link.hover.decoration;         // ln 110
      }
    }

    return style;
  },

  buttonStyle() {
    // styles specific to button-type buttons (i.e., colored roundrects)

    // original less styles implemented in
    // https://github.com/twbs/bootstrap/blob/9ed9eb97ee09e514da942d680dac032628124816/less/mixins/buttons.less
    // ll 6-54
    // https://github.com/twbs/bootstrap/blob/65721f531536e05026b1ae5f0359955c78d13156/less/buttons.less
    // ll 57-81
    const style = {
      color: variables.btn[this.props.bsStyle].color,                   // ln 7
      backgroundColor: variables.btn[this.props.bsStyle].bg,            // ln 8
      borderColor: variables.btn[this.props.bsStyle].border,            // ln 9
      borderRadius: variables.border_radius[this.props.bsSize],
      fontWeight: variables.btn.font_weight                             // ln 12
    };

    if (!this.props.disabled) {
      if (this.state.hover || this.state.active || this.state.focus) {  // ll 11-15
        style.backgroundColor = darken(style.backgroundColor, 10);      // ln 18
        style.borderColor = darken(style.borderColor, 12);              // ln 19
      }
      if (this.state.active) {
        style.outline = 0;                                              // ln 41
        style.boxShadow = 'inset 0 3px 5px rgba(0,0,0,.125)';           // ln 43
      }
    }

    return style;
  },

  style() {
    // https://github.com/twbs/bootstrap/blob/65721f531536e05026b1ae5f0359955c78d13156/less/buttons.less
    const baseStyle = {
      display: 'inline-block',                                          // ln 10
      marginBottom: 0,                                                  // ln 11
      padding: `${variables.padding[this.props.bsSize].vertical}px ${variables.padding[this.props.bsSize].horizontal}px`,
      fontSize: variables.font_size[this.props.bsSize],
      lineHeight: variables.line_height[this.props.bsSize],
      textAlign: 'center',                                              // ln 13
      verticalAlign: 'middle',                                          // ln 14
      touchAction: 'manipulation',                                      // ln 15
      cursor: 'pointer',                                                // ln 16
      backgroundImage: 'none',                                          // ln 17
      borderWidth: 1,                                                   // ln 18
      borderStyle: 'solid',                                             // ln 18
      borderColor: 'transparent',                                       // ln 18
      whiteSpace: 'nowrap'                                              // ln 19
    };

    if (this.props.disabled) {
      baseStyle.cursor = variables.cursor.disabled;                     // ln 49
      baseStyle.pointerEvents = 'none';                                 // ln 50
      baseStyle.opacity = 0.65;                                         // ln 51
    }

    if (this.props.bsStyle === 'link') {
      return Object.assign(baseStyle, this.linkStyle(), this.props.style);
    } else {
      return Object.assign(baseStyle, this.buttonStyle(), this.props.style);
    }
  },

  render() {
    return <input {...this.props}
                  style={this.style()}
                  type="button"
                  disabled={this.state.disabled}
                  onMouseEnter={() => this.setState({hover: true})}
                  onMouseLeave={() => this.setState({hover: false, active: false})}
                  onMouseDown={() => this.setState({active: true})}
                  onMouseUp={() => this.setState({active: false})}
                  onFocus={() => this.setState({focus: true})}
                  onBlur={() => this.setState({focus: false})} />;
  }
});
