Carousel Demo for Patreon
=========================

A circular carousel with a "shooting gallery" type interaction. Points
of interest:

* All DOM manipulation is handled by React.js. Although React has a poor
  reputation for dealing with animation, reasonably appealing effects
  can be achieved with the 'transition' style property and properly
  keyed dynamic children.

* All styles are calculated on-the-fly and applied inline. This offers
  considerably greater expressiveness compared to static external
  stylesheets with global classnames. For a practical demonstration of
  the utility of this methodology, see `components/Button.jsx`,
  which faithfully implements a fully-featured bootstrap style button
  with no external CSS dependencies.

* The model and events layers are implemented with a simple flux
  architecture, using Immutable.js structures as backing stores.
  This is tremendously beneficial as our components do not need to be
  concerned with managing their state - whenever an element of the
  Immutable collection is altered, the Store emits a change event
  received by the master component's changeListener. This calls
  `Carousel.onChange()`, which retrieves the new state from store,
  triggering a re-render and propogating the new state into it child
  `Shape` components. Because these implement PureRenderMixin, React
  is able to avoid unecessarily re-rendering them.

* Immutable.js has an API for functional manipulation of data
  structures, superior in many respects to underscore/lodash. In
  particular, support for infinite sequences and lazy evaluation allows
  us to effortlessly circularize the backing store with
  `Immutable.Repeat()` and slice into it, enabling large elements to
  appear on both the left and right side of the screen. Immutable.Record
  provides an immutable data structure whose member variables can be
  transparently consumed by any client using plain-old-javascript
  accessor syntax.

* All sources are written in ES6 and compiled to ES5 with babel. These
  sources rely heavily on many ES6 features -- note the use of
  destructuring assignment in Carousel.jsx `renderItems()` and
  CarouselStore.jsx `respawn()`, and pervasive use of computed property
  names, template strings and `Object.assign` throughout the inline
  styling system.

* Tested in desktop Chrome-latest, Safari-latest and Firefox-latest.
  Certain not to work on IE9 or lower due to dependency on flexbox
  support. IE10+ support is probably realistic, and the path toward
  supporting prefixed CSS in a general way that does not conflict with
  the purity of render() is clear: we detect prefixes before
  initializing React and then pass them through the tree of React
  components as props. See `utils/detectPrefixes.js` and `index.jsx` for
  details. As for mobile, React Touch events looks straightforward, and
  Button.jsx allows for responsive resizing of UI widgets in a way that
  is strictly impossible with css-based bootstrap.

Development with react-hot-reload
---------------------------------

```
npm install
npm start
open http://localhost:3000
```

Building
--------

`npm run webpack` or `npm run browserify`