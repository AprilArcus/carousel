/* eslint-env es6, browser */
const standardPrefixes = {
  flex: 'flex',
  flexShrink: 'flexShrink',
  flexGrow: 'flexGrow',
  alignItems: 'alignItems',
  justifyContent: 'justifyContent',
  transform: 'transform'
};

export default function detectPrefixes(node) {
  let vendorPrefixes = {};
  node.style.display = 'flex';
  if (node.style.display !== 'flex') {
    node.style.display = '-webkit-flex';
    if (node.style.display === '-webkit-flex') {
      vendorPrefixes.flex = '-webkit-flex';
      vendorPrefixes.flexShrink = 'WebkitFlexShrink';
      vendorPrefixes.flexGrow = 'WebkitFlexGrow';
      vendorPrefixes.alignItems = 'WebkitAlignItems';
      vendorPrefixes.justifyContent = 'WebkitJustifyContent';
    }
  }
  node.style.transform = 'Garbage Data';
  if (node.style.transform === 'Garbage Data') {
    node.style.WebkitTransform = 'Garbage Data';
    if (node.style.WebkitTransform !== 'Garbage Data') {
      vendorPrefixes.transform = 'WebkitTransform';
    }
  }
  return Object.assign({}, standardPrefixes, vendorPrefixes);
}
