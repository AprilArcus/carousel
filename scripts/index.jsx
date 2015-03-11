'use strict';

const React = require('react'),
      Carousel = require('./components/Carousel');

React.render(<Carousel numSlots={6}
                       numItems={6}
                       respawnThreshold={12}
                       slideDuration={150} />, document.getElementById('carousel'));
