/* eslint-env es6 */
/* eslint-disable no-underscore-dangle */

import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import CarouselConstants from '../constants/CarouselConstants';
import Immutable from 'immutable';

const CHANGE_EVENT = 'change';

let _dispatchToken;


// Immutable.js Record types look like plain-old-javascript objects to
// our clients, but throw when you try to set their properties. The
// illusion isn't perfect, however - e.g. Object.keys(someRecord) will
// just return [ '_map' ]. Still, it's good enough to pass React's
// React.PropTypes.shape({key: value}) test. We extend it with an ES6
// class to provide a factory methd to vend random shapes, and a getter
// to keep things DRY.
class Shape extends Immutable.Record({seed: undefined, hp: undefined}) {
  static random() {
    return new Shape({seed: Math.random(),
                      hp: Math.floor(2 + 5 * Math.random())});
  }
  get dead() {
    return this.hp <= 0;
  }
}

// _shapes is the backing store. It, and its mutator functions, are
// hidden in the scope of the module closure. In OO terms they are like
// private setter functions, never called directly by our React
// Component clients, but rather registered as callbacks with the
// AppDispatcher singleton and then triggered by calling the public
// methods on CarouselActions, which delegates to AppDispatcher. This
// divides getter and setter functionality between CarouselStore and
// CarouselActions, respectively, enforcing Flux's signature
// unidirectional flow of data.
let _shapes = Immutable.List();

function reset(numItems) {
  _shapes = _shapes.setSize(numItems).map( () => Shape.random() );
}

function clear() {
  _shapes = _shapes.map(shape => shape.set('hp', 0));
}

function respawn() {
  const candidateIndices = _shapes.toKeyedSeq()
                                  .map( (shape, index) => [shape, index] )
                                  .toIndexedSeq()
                                  .filter( ([shape, _]) => shape.dead ) //eslint-disable-line no-unused-vars
                                  .map( ([_, index]) => index )         //eslint-disable-line no-unused-vars
                                  .cacheResult();
  if (candidateIndices.size > 0) {
    const randomIndexIntoCandidateIndices = Math.floor(Math.random() * candidateIndices.size);
    const targetIndex = candidateIndices.get(randomIndexIntoCandidateIndices);
    _shapes = _shapes.set(targetIndex, Shape.random());
  }
}

function hit(index) {
  const targetShape = _shapes.get(index);
  const updatedShape = targetShape.set('hp', targetShape.hp - 1);
  _shapes = _shapes.set(index, updatedShape);
}

// h/t Bill Fisher for the ES6 class approach, which reads more clearly
// than the minimalist ES5 approach in the reference implementation
// in flux/examples/flux-todomvc/js/stores/TodoStore.js
// https://speakerdeck.com/fisherwebdev/flux-react
class CarouselStore extends EventEmitter {

  constructor() {
    super(); // <-- why?
    // register callbacks
    _dispatchToken = AppDispatcher.register((action) => {
      switch(action.actionType) {

        case CarouselConstants.CAROUSEL_RESET:
          reset(action.numItems);
          this.emit(CHANGE_EVENT);
          break;

        case CarouselConstants.CAROUSEL_CLEAR:
          clear();
          this.emit(CHANGE_EVENT);
          break;

        case CarouselConstants.CAROUSEL_RESPAWN:
          respawn();
          this.emit(CHANGE_EVENT);
          break;

        case CarouselConstants.CAROUSEL_HIT:
          hit(action.index);
          this.emit(CHANGE_EVENT);
          break;

        // no default
      }
    });
  }

  get dispatchToken() {
    return _dispatchToken;
  }

  get empty() {
    return _shapes.every(shape => shape.dead );
  }

  getCircularizedSlice(startIndex, endIndex) {
    if (_shapes.size === 0) return [];
    // A unique and stable key is useful to our React client, in that it
    // obviates unnecessary DOM operations. If our client didn't want to
    // pad out its view to allow wrapping, the storeIndex would be fine
    // by itself, but since some shapes will be rendered twice, we take
    // extra care to provide both a valid index into the original store
    // (for use by downstream components calling CarouselActions.hit())
    // and a stable unique index into a notional, virtual array spanning
    // indices [-2^52, 2^52].

    // The means that the slice API is a little different than usual, in
    // that negative indices slice from the left of zero, not the right
    // of a notionally infinite list. i.e. if _shapes = [1,2,3,4],
    // getCircularizedSlice(-1,3) returns [4,1,2,3].

    // First we bias in the incoming indices:
    const HALF_INT_MAX = 4503599627370496; // 2^52
    // At 150ms per slide, it will take 21.4 million years to lose
    // integer precision.
    if (startIndex < -HALF_INT_MAX || endIndex > HALF_INT_MAX) {
      throw new RangeError('loss of precision');
    }
    const biasedStartIndex = startIndex + HALF_INT_MAX;
    const biasedEndIndex = endIndex + HALF_INT_MAX;
    const indices = Immutable.Range(biasedStartIndex, biasedEndIndex);
    return indices.map( sliceIndex => {
      const storeIndex = sliceIndex % _shapes.size;
      const shape = _shapes.get(storeIndex);
      const unbiasedSliceIndex = sliceIndex - HALF_INT_MAX;
      return {shape, storeIndex, sliceIndex: unbiasedSliceIndex};
    }).toArray();
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
}

export default new CarouselStore();
