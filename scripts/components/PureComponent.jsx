// "There are things you can’t implement with higher-order components.
//  For example, `PureRenderMixin` would be impossible to implement
//  because the wrapper has no way to look into the wrapper component’s
//  state and define its `shouldComponentUpdate`. However this is
//  precisely the case where, in React 0.13, you might want to use a
//  different base class, for example `PureComponent` that descends from
//  `Component` and implements `shouldComponentUpdate`. Now _that’s_ a
//  valid use case for inheritance!"
// -- https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750

import React from 'react';

export default class extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (typeof this.props === 'object' && this.props !== null &&
        typeof nextProps === 'object' && nextProps !== null) {
      if (Object.keys(this.props).some(key =>
        key !== 'style' && this.props[key] !== nextProps[key])
      ) return true;
      if (Object.keys(nextProps).some(key =>
        !this.props.hasOwnProperty(key))
      ) return true;
    } else {
      if (this.props !== nextProps) return true;
    }

    // deep inspection of style object
    if (typeof this.props.style === 'object' && this.props.style !== null &&
        typeof nextProps.style === 'object' && nextProps.style !== null) {
      if (Object.keys(this.props.style).some(key =>
        this.props.style[key] !== nextProps.style[key])
      ) return true;
      if (Object.keys(nextProps.style).some(key =>
        !this.props.style.hasOwnProperty(key))
      ) return true;
    } else if (this.props.style !== nextProps.style) {
      return true;
    }

    if (typeof this.state === 'object' && this.state !== null &&
        typeof nextState === 'object' && nextState !== null) {
      if (Object.keys(this.state).some(key =>
        this.state[key] !== nextState[key])
      ) return true;
      if (Object.keys(nextState).some(key =>
        !this.state.hasOwnProperty(key))
      ) return true;
    } else {
      if (this.state !== nextState) return true;
    }

    return false;
  }
}
