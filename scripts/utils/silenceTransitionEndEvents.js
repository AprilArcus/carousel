// our parent is listening for transition end events on its slider
// element, but it will hear transition end events from all of its
// children unless we silence them. This is certainly a bug in
// ReactTransitionEvents -- it should be able to do this kind of
// screening for us. TODO: file issue & submit pull request

// We cope with this state of affairs with a "higher order component",
// á la Dan Abramov's "Mixins Are Dead, Long Live Higher Order
// Components" https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750
// This is a function that receives a React component and decorates it
// with event listeners that will intercept transitionEnd events and
// prevent them from bubbling.

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
