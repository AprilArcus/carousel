/* eslint-env es6, browser */
import React from 'react';
import Carousel from './components/Carousel';
import detectPrefixes from './lib/detectPrefixes';

const testNode = document.createElement('div');
const prefixes = detectPrefixes(testNode);

React.render(<Carousel numSlots={6}
                       numItems={7}
                       respawnThreshold={12}
                       prefixes={prefixes} />, document.getElementById('carousel'));
