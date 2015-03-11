import React from 'react';
import Carousel from './components/Carousel';

React.render(<Carousel numSlots={6}
                       numItems={7}
                       respawnThreshold={12}
                       slideDuration={150} />, document.getElementById('carousel'));
