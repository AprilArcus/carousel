// Base class
//
// "There are things you can’t implement with higher-order components.
//  For example, `PureRenderMixin` would be impossible to implement
//  because the wrapper has no way to look into the wrapper component’s
//  state and define its `shouldComponentUpdate`. However this is
//  precisely the case where, in React 0.13, you might want to use a
//  different base class, for example `PureComponent` that descends from
//  `Component` and implements `shouldComponentUpdate`. Now _that’s_ a
//  valid use case for inheritance!"
// -- https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750
//
// lifted from react/lib/shallowEqual.js and react/lib/
// ReactComponentWithPureRenderMixin.js and modified to test deep
// equality on the style prop.

function shallowEqual(objA, objB, ignoring) {
  if (objA === objB) {
    return true;
  }
  // Test for A's keys different from B.
  for (let key in objA) {
    if (objA.hasOwnProperty(key) &&
        (!objB.hasOwnProperty(key) ||
         key !== ignoring && objA[key] !== objB[key])) {
      return false;
    }
  }
  // Test for B's keys missing from A.
  for (let key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

import React from 'react';

export default class extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(this.props, nextProps, 'style') ||
           !shallowEqual(this.props.style, nextProps.style) ||
           !shallowEqual(this.state, nextState);
  }
}
