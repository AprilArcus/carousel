// a higher order component that will emulate CSS :hover, :active, and
// :focus pseudo selectors by decorating a component with appropriate
// listeners, tracking internal state, and passing it to the component
// argument as additional props.

import React from 'react';

export default function(Component) {
  return class extends Object.getPrototypeOf(Component) {

    constructor(props) {
      super(props);
      this.state = {
        hover: false,
        active: false,
        focus: false
      };
    }

    render() {
      return <Component onMouseEnter = { () => this.setState({hover: true}) }
                        onMouseLeave = { () => this.setState({hover: false, active: false}) }
                        onMouseDown = { () => this.setState({active: true}) }
                        onMouseUp = { () => this.setState({active: false}) }
                        onFocus = { () => this.setState({focus: true}) }
                        onBlur = { () => this.setState({focus: false}) }
                        {...this.props} {...this.state} />
    }

  }
}
