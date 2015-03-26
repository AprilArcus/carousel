/* eslint-env es6 */
import React from 'react';
import PureComponent from './PureComponent';
import enableMouseOverEvents from '../utils/enableMouseOverEvents'
import { lighten, darken } from '../utils/colorHelpers'
import variables from '../utils/bootstrapVariables'

let styles;

class Button extends PureComponent {

  render() {
    const bsStyle = this.props.bsStyle;
    const bsSize = this.props.bsSize;
    const disabled = this.props.disabled;
    const hover = this.props.hover;
    const active = this.props.active;
    const focus = this.props.focus;
    return <input {...this.props}
                  style={Object.assign({},
                                       styles.master({bsStyle,
                                                      bsSize,
                                                      disabled,
                                                      hover,
                                                      active,
                                                      focus}),
                                       this.props.style)}
                  type="button"
                  disabled={this.props.disabled} />;
  }
}

Button.propTypes = {
  bsSize: React.PropTypes.oneOf(['base', 'large', 'small', 'tiny']),
  bsStyle: React.PropTypes.oneOf(['default', 'primary', 'success', 'info',
                                  'warning', 'danger', 'link']),
  disabled: React.PropTypes.bool
};

Button.defaultProps = { bsStyle: 'default',
                        bsSize: 'base',
                        disabled: false };

export default enableMouseOverEvents(Button);

//------------------------------ Styles ------------------------------//

styles = {
  link({disabled, hover, focus}) {
    // styles for buttons disguised as links

    // https://github.com/twbs/bootstrap/blob/65721f531536e05026b1ae5f0359955c78d13156/less/buttons.less
    // ll 84-121
    const style = {
      color: variables.link.color,                                      // ln 89
      fontWeight: 'normal',                                             // ln 90
      backgroundColor: 'transparent'                                    // lns 98, 111
    };

    if (disabled) {
      style.color = variables.btn.link.disabled.color;                  // ln 117
    } else {
      if (hover || focus) {
        style.color = variables.link.hover.color;                       // ln 109
        style.textDecoration = variables.link.hover.decoration;         // ln 110
      }
    }

    return style;
  },

  button({bsStyle, bsSize, disabled, hover, active, focus}) {
    // styles specific to button-type buttons (i.e., colored roundrects)

    // original less styles implemented in
    // https://github.com/twbs/bootstrap/blob/9ed9eb97ee09e514da942d680dac032628124816/less/mixins/buttons.less
    // ll 6-54
    // https://github.com/twbs/bootstrap/blob/65721f531536e05026b1ae5f0359955c78d13156/less/buttons.less
    // ll 57-81
    const style = {
      color: variables.btn[bsStyle].color,                              // ln 7
      backgroundColor: variables.btn[bsStyle].bg,                       // ln 8
      borderColor: variables.btn[bsStyle].border,                       // ln 9
      borderRadius: variables.border_radius[bsSize],
      fontWeight: variables.btn.font_weight                             // ln 12
    };

    if (!disabled) {
      if (hover || active || focus) {                                   // ll 11-15
        style.backgroundColor = darken(style.backgroundColor, 10);      // ln 18
        style.borderColor = darken(style.borderColor, 12);              // ln 19
      }
      if (active) {
        style.outline = 0;                                              // ln 41
        style.boxShadow = 'inset 0 3px 5px rgba(0,0,0,.125)';           // ln 43
      }
    }

    return style;
  },

  master({bsStyle, bsSize, disabled, hover, active, focus}) {
    // https://github.com/twbs/bootstrap/blob/65721f531536e05026b1ae5f0359955c78d13156/less/buttons.less
    const baseStyle = {
      display: 'inline-block',                                          // ln 10
      marginBottom: 0,                                                  // ln 11
      padding: `${variables.padding[bsSize].vertical}px ${variables.padding[bsSize].horizontal}px`,
      fontSize: variables.font_size[bsSize],
      lineHeight: variables.line_height[bsSize],
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

    if (disabled) {
      baseStyle.cursor = variables.cursor.disabled;                     // ln 49
      baseStyle.pointerEvents = 'none';                                 // ln 50
      baseStyle.opacity = 0.65;                                         // ln 51
    }

    if (bsStyle === 'link') {
      return Object.assign(baseStyle, styles.link({disabled, hover, focus}));
    } else {
      return Object.assign(baseStyle, styles.button({bsStyle, bsSize, disabled, hover, active, focus}));
    }
  }
};
