'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const EventEmitter = require('events').EventEmitter;
const CarouselConstants = require('../constants/CarouselConstants');
const Immutable = require('immutable');

const CHANGE_EVENT = 'change';

let _shapes = Immutable.List();

class Shape extends Immutable.Record({seed: undefined, hp: undefined}) {
  static random() {
    return new Shape({seed: String(Math.random()),
                      hp: Math.floor(2 + 5 * Math.random())});
  }
  isDead() {
    return this.hp <= 0;
  }
}

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
                                  .filter( ([shape, _index]) => shape.isDead() )
                                  .map( ([shape, index]) => index )
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

const CarouselStore = Object.assign({}, EventEmitter.prototype, {

  isEmpty() {
    return _shapes.every(shape => shape.isDead() );
  },

  get() {
    return _shapes;
  },

  emitChange() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

});

// register callbacks
AppDispatcher.register(function(action) {
  switch(action.actionType) {

    case CarouselConstants.CAROUSEL_RESET:
      reset(action.numItems);
      CarouselStore.emitChange();
      break;

    case CarouselConstants.CAROUSEL_CLEAR:
      clear();
      CarouselStore.emitChange();
      break;

    case CarouselConstants.CAROUSEL_RESPAWN:
      respawn();
      CarouselStore.emitChange();
      break;

    case CarouselConstants.CAROUSEL_HIT:
      hit(action.index);
      CarouselStore.emitChange();
      break;

    // no default
  }
});

export default CarouselStore;
