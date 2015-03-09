'use strict';

const React = require('react'),
      Carousel = require('./components/Carousel');

React.render(<Carousel numSlots={6}
                       numItems={8}
                       slideDuration={150} />, document.body);
