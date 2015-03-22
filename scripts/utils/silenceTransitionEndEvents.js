// our parent is listening for transition end events on its slider
// element, but it will hear transition end events from all of its
// children unless we silence them. This is certainly a bug in
// ReactTransitionEvents -- it should be able to do this kind of
// screening for us. TODO: file issue & submit pull request

import React from 'react';
import ReactTransitionEvents from 'react/lib/ReactTransitionEvents';

export default function(Component) {
  return class extends Object.getPrototypeOf(Component) {

    componentDidMount() {
      const componentNode = React.findDOMNode(this.refs.component);
      ReactTransitionEvents.addEndEventListener(componentNode, this.stopTransitionEventPropogation);
    }

    componentWillUnmount() {
      const componentNode = React.findDOMNode(this.refs.component);
      ReactTransitionEvents.removeEndEventListener(componentNode, this.stopTransitionEventPropogation);
    }

    stopTransitionEventPropogation(event) {
      event.stopPropagation();
    }

    render() {
      return <Component ref="component" {...this.props} {...this.state} />
    }

  }
}

