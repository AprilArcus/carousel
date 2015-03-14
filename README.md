Carousel Demo for Patreon
=========================

[![Screenshot](screenshot.png)](http://aprilarcus.github.io/carousel/)

A circular carousel with a "shooting gallery" type interaction. Points
of interest:

* All DOM manipulation is handled by React.js. Although React has a poor
  reputation for dealing with animation, reasonably appealing effects
  can be achieved with the 'transition' style property and properly
  keyed dynamic children.

* All styles are calculated on‐the‐fly and applied inline. This offers
  considerably greater expressiveness compared to static external
  stylesheets with global classnames. For a practical demonstration of
  the utility of this methodology, consider `components/Button.jsx`,
  which faithfully implements a fully-featured bootstrap style button
  with no external CSS dependencies. See Christopher Chedeau's terrific
  [talk](https://vimeo.com/channels/684289/116209150) and
  [slide deck](http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html)
  for further exposition and rationalle. I believe this will be the most
  important paradigm shift in front‐end web development since Node.js.

* The model and events layers are implemented with a simple [Flux](https://facebook.github.io/flux/)
  architecture, using [Immutable.js](http://facebook.github.io/immutable-js/)
  data structures as backing stores. This is a tremendous simplification
  over model‐view‐controller architectures, as our components do not
  need to be concerned with managing their state — whenever the store
  is altered, it emits a change event received by the master component's
  event listener. This calls `Carousel.onChange()`, which retrieves the
  new state from store, triggering a re‐render and propagating updated
  state into its `components/Shape.jsx` children. Because all components
  implement PureRenderMixin, React is able to avoid unnecessarily
  re‐rendering unchanged elements.

* Immutable.js has an API for functional manipulation of data
  structures, superior in many respects to underscore/lodash. In
  particular, support for infinite sequences and lazy evaluation allows
  us to effortlessly circularize the backing store with
  `Immutable.Repeat()` and slice into it, enabling large elements to
  appear on both the left and right side of the screen.
  `Immutable.Record` provides an immutable data structure whose member
  variables can be transparently consumed by any client using
  plain‐old‐javascript accessor syntax.

* All sources are written in ES6 and compiled to ES5 with [Babel](babeljs.io).
  This project relies heavily on many ES6 features — note the use of
  destructuring assignment in Carousel.jsx `renderItems()` and
  CarouselStore.jsx `respawn()`, and pervasive use of computed property
  names, template strings and `Object.assign` throughout the inline
  styling system.

* Tested in desktop Chrome 41, Safari 8 and Firefox 36.
  Certain not to work on IE 9 or lower due to dependency on flexbox
  support (although see [this commit](https://github.com/AprilArcus/carousel/commit/c2ec3c6ad26d885f00ca8abea896bf8dcae12c5e) for an approach utilizing
  `display: table-cell;`). IE 10 support is probably realistic, and the
  path toward supporting prefixed CSS in a general way while maintaing
  the purity of `render()` is clear: we detect prefixes before
  initializing React and then pass a key‐value store from standard
  property names to prefixed names through the tree of React components
  as props. See `utils/detectPrefixes.js` and `index.jsx` for details.
  As for mobile, React Touch events looks straightforward, and
  Button.jsx allows for responsive resizing of UI widgets in a way that
  is strictly impossible with css‐based bootstrap.

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
