/* eslint-env es6 */
import AppDispatcher from '../dispatcher/AppDispatcher';
import CarouselConstants from '../constants/CarouselConstants';

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
