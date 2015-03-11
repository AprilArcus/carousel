/* eslint-env es6, node */
const AppDispatcher = require('../dispatcher/AppDispatcher');
const CarouselConstants = require('../constants/CarouselConstants');

export default {
  reset: function(numItems) {
    AppDispatcher.dispatch({
      actionType: CarouselConstants.CAROUSEL_RESET,
      numItems
    });
  },

  clear: function() {
    AppDispatcher.dispatch({
      actionType: CarouselConstants.CAROUSEL_CLEAR
    });
  },

  respawn: function() {
    AppDispatcher.dispatch({
      actionType: CarouselConstants.CAROUSEL_RESPAWN
    });
  },

  hit: function(index) {
    AppDispatcher.dispatch({
      actionType: CarouselConstants.CAROUSEL_HIT,
      index
    });
  }
};
