'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const EventEmitter = require('events').EventEmitter;
// const CarouselConstants = require('../constants/CarouselConstants');
const Immutable = require('immutable');

const CHANGE_EVENT = 'change';

let _shapes = Immutable.List();

class Shape extends Immutable.Record({
  seed: String(Math.random()),
  hp: Math.floor(1 + 5 * Math.random())
}) {
  isDead() {
    return this.hp <= 0;
  }
}

function reset(numItems) {
  _shapes = _shapes.setSize(numItems).map( () => new Shape() );
}

// function rotateBackward() {
//   _shapes = _shapes.takeLast(1).concat(_shapes.butLast());
// }

// function rotateForward() {
//   _shapes = _shapes.rest().concast(_shapes.first());
// }

function appear() {
  const candidateIndices = _shapes.toKeyedSeq()
                                  .filter( shape => shape.isDead() )
                                  .map( (_v, k) => k )
  if (candidateIndices.count() > 0) {
    const randomIndexIntoCandidateIndices = Math.floor(Math.random * candidateIndices.count());
    const targetIndex = candidateIndices.get(randomIndexIntoCandidateIndices);
    _shapes = _shapes.set(targetIndex, new Shape());
  }
}

function hit(index) {
  const targetShape = _shapes.get(index);
  const updatedShape = targetShape.set({hp: targetShape.hp - 1});
  _shapes = _shapes.set(index, updatedShape);
}

export default Object.assign({}, EventEmitter.prototype, {

  isEmpty() {
    _shapes.every(shape => shape.isDead() );
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
  },

  dispatcherIndex: AppDispatcher.register(function(payload) {
    const action = payload.action;
    // let text;

    // switch(action.actionType) {
    //   case TodoConstants.TODO_CREATE:
    //     text = action.text.trim();
    //     if (text !== '') {
    //       create(text);
    //       TodoStore.emitChange();
    //     }
    //     break;

    //   case TodoConstants.TODO_DESTROY:
    //     destroy(action.id);
    //     TodoStore.emitChange();
    //     break;

    //   // add more cases for other actionTypes, like TODO_UPDATE, etc.
    // }

    return true; // No errors. Needed by promise in Dispatcher.
  })

});
