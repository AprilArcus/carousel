import React from 'react';
import Carousel from './components/Carousel';

const prefixes = {
  flex: 'flex',
  flexShrink: 'flexShrink',
  flexGrow: 'flexGrow',
  alignItems: 'alignItems',
  justifyContent: 'justifyContent',
  transform: 'transform'
};

function detectPrefixes(node) {
  let detectedPrefixes = {};
  node.style.display = 'flex';
  if (node.style.display !== 'flex') {
    node.style.display = '-webkit-flex';
    if (node.style.display === '-webkit-flex') {
      detectedPrefixes.flex = '-webkit-flex';
      detectedPrefixes.flexShrink = 'WebkitFlexShrink';
      detectedPrefixes.flexGrow = 'WebkitFlexGrow';
      detectedPrefixes.alignItems = 'WebkitAlignItems';
      detectedPrefixes.justifyContent = 'WebkitJustifyContent';
    }
  }
  node.style.transform = 'Garbage Data';
  if (node.style.transform === 'Garbage Data') {
    node.style.WebkitTransform = 'Garbage Data';
    if (node.style.WebkitTransform !== 'Garbage Data') {
      detectedPrefixes.transform = 'WebkitTransform';
    }
  }
  return detectedPrefixes;
}

const testNode = document.createElement('div');
const vendorPrefixes = detectPrefixes(testNode);
Object.assign(prefixes, vendorPrefixes);

React.render(<Carousel numSlots={6}
                       numItems={7}
                       respawnThreshold={12}
                       slideDuration={150}
                       prefixes={prefixes} />, document.getElementById('carousel'));
