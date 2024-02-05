"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clientRender = clientRender;
exports.serverRender = serverRender;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _iso = _interopRequireDefault(require("iso"));
var _react = _interopRequireDefault(require("react"));
var _reactDom = require("react-dom");
var _server = require("react-dom/server");
var _reactRouter = require("react-router");
var _reactRedux = require("react-redux");
var _blurtjs = require("@blurtfoundation/blurtjs");
var _RootRoute = _interopRequireDefault(require("app/RootRoute"));
var appActions = _interopRequireWildcard(require("app/redux/AppReducer"));
var _redux = require("redux");
var _reactRouterScroll = require("react-router-scroll");
var _reduxSaga = _interopRequireDefault(require("redux-saga"));
var _effects = require("redux-saga/effects");
var _reactRouterRedux = require("react-router-redux");
var _RootReducer = _interopRequireDefault(require("app/redux/RootReducer"));
var _RootSaga = _interopRequireDefault(require("shared/RootSaga"));
var _NotFound = require("app/components/pages/NotFound");
var _ExtractMeta = _interopRequireDefault(require("app/utils/ExtractMeta"));
var _Translator = _interopRequireDefault(require("app/Translator"));
var _ResolveRoute = require("app/ResolveRoute");
var _StateFunctions = require("app/utils/StateFunctions");
var _scrollBehavior = _interopRequireDefault(require("scroll-behavior"));
var _blurtApi = require("app/utils/blurtApi");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); } /* eslint react/display-name: 0 */ /* eslint space-before-function-paren:0 */ // https://github.com/eslint/eslint/issues/4442
var get_state_perf;
var get_content_perf = false;
if (process.env.OFFLINE_SSR_TEST) {
  var testDataDir = process.env.OFFLINE_SSR_TEST_DATA_DIR || 'api_mockdata';
  var uri = "".concat(__dirname, "/../../");
  get_state_perf = require(uri + testDataDir + '/get_state');
  get_content_perf = require(uri + testDataDir + '/get_content');
}
var calcOffsetRoot = function calcOffsetRoot(startEl) {
  var offset = 0;
  var el = startEl;
  while (el) {
    offset += el.offsetTop;
    el = el.offsetParent;
  }
  return offset;
};

// BEGIN: SCROLL CODE
/**
 * The maximum number of times to attempt scrolling to the target element/y position
 * (total seconds of attempted scrolling is given by (SCROLL_TOP_TRIES * SCROLL_TOP_DELAY_MS)/1000 )
 * @type {number}
 */
var SCROLL_TOP_TRIES = 50;
/**
 * The number of milliseconds to delay between scroll attempts
 * (total seconds of attempted scrolling is given by (SCROLL_TOP_TRIES * SCROLL_TOP_DELAY_MS)/1000 )
 * @type {number}
 */
var SCROLL_TOP_DELAY_MS = 100;
/**
 * The size of the vertical gap between the bottom of the fixed header and the top of the scrolled-to element.
 * @type {number}
 */
var SCROLL_TOP_EXTRA_PIXEL_OFFSET = 3;
/**
 * number of pixels the document can move in the 'wrong' direction (opposite of intended scroll) this covers accidental scroll movements by users.
 * @type {number}
 */
var SCROLL_FUDGE_PIXELS = 10;
/**
 * if document is being scrolled up this is set for prevDocumentInfo && documentInfo
 * @type {string}
 */
var SCROLL_DIRECTION_UP = 'up';
/**
 * if document is being scrolled down this is set for prevDocumentInfo && documentInfo
 * @type {string}
 */
var SCROLL_DIRECTION_DOWN = 'down';

/**
 * If an element with this id is present, the page does not want us to detect navigation history direction (clicking links/forward button or back button)
 * @type {string}
 */
var DISABLE_ROUTER_HISTORY_NAV_DIRECTION_EL_ID = 'disable_router_nav_history_direction_check';
var scrollTopTimeout = null;

/**
 * raison d'être: support hash link navigation into slow-to-render page sections.
 *
 * @param {htmlElement} el - the element to which we wish to scroll
 * @param {number} topOffset - number of pixels to add to the scroll. (would be a negative number if fixed header)
 * @param {Object} prevDocumentInfo -
 *          .scrollHeight {number} - document.body.scrollHeight
 *          .scrollTop {number} - ~document.scrollingElement.scrollTop
 *          .scrollTarget {number} - the previously calculated scroll target
 * @param {number} triesRemaining - number of attempts remaining
 */
var scrollTop = function scrollTop(el, topOffset, prevDocumentInfo, triesRemaining) {
  var documentInfo = {
    scrollHeight: document.body.scrollHeight,
    scrollTop: Math.ceil(document.scrollingElement.scrollTop),
    scrollTarget: calcOffsetRoot(el) + topOffset,
    direction: prevDocumentInfo.direction
  };
  var doScroll = false;
  // for both SCROLL_DIRECTION_DOWN, SCROLL_DIRECTION_UP
  // We scroll if the document has 1. not been deliberately scrolled, AND 2. we have not passed our target scroll,
  // NOR has the document changed in a meaningful way since we last looked at it
  if (prevDocumentInfo.direction === SCROLL_DIRECTION_DOWN) {
    doScroll = prevDocumentInfo.scrollTop <= documentInfo.scrollTop + SCROLL_FUDGE_PIXELS && (documentInfo.scrollTop < documentInfo.scrollTarget || prevDocumentInfo.scrollTarget < documentInfo.scrollTarget || prevDocumentInfo.scrollHeight < documentInfo.scrollHeight);
  } else if (prevDocumentInfo.direction === SCROLL_DIRECTION_UP) {
    doScroll = prevDocumentInfo.scrollTop >= documentInfo.scrollTop - SCROLL_FUDGE_PIXELS && (documentInfo.scrollTop > documentInfo.scrollTarget || prevDocumentInfo.scrollTarget > documentInfo.scrollTarget || prevDocumentInfo.scrollHeight > documentInfo.scrollHeight);
  }
  if (doScroll) {
    window.scrollTo(0, documentInfo.scrollTarget);
    if (triesRemaining > 0) {
      scrollTopTimeout = setTimeout(function () {
        return scrollTop(el, topOffset, documentInfo, triesRemaining - 1);
      }, SCROLL_TOP_DELAY_MS);
    }
  }
};

/**
 * Custom scrolling behavior needed because we have chunky page loads and a fixed header.
 */
var OffsetScrollBehavior = /*#__PURE__*/function (_ScrollBehavior) {
  (0, _inherits2["default"])(OffsetScrollBehavior, _ScrollBehavior);
  function OffsetScrollBehavior() {
    (0, _classCallCheck2["default"])(this, OffsetScrollBehavior);
    return _callSuper(this, OffsetScrollBehavior, arguments);
  }
  (0, _createClass2["default"])(OffsetScrollBehavior, [{
    key: "scrollToTarget",
    value:
    /**
     * Raison d'être: on hash link navigation, assemble the needed info and pass it to scrollTop()
     * In cases where we're scrolling to a pixel offset, adjust the offset for the current header, and punt to default behavior.
     */
    function scrollToTarget(element, target) {
      clearTimeout(scrollTopTimeout); // it's likely this will be called multiple times in succession, so clear and existing scrolling.
      var header = document.getElementsByTagName('header')[0]; // this dimension ideally would be pulled from a scss file.
      var topOffset = SCROLL_TOP_EXTRA_PIXEL_OFFSET * -1;
      if (header) {
        topOffset += header.offsetHeight * -1;
      }
      var newTarget = []; // x coordinate
      var el = false;
      if (typeof target === 'string') {
        el = document.getElementById(target.substr(1));
        if (!el) {
          el = document.getElementById(target);
        }
      } else {
        newTarget.push(target[0]);
        if (target[1] + topOffset > 0) {
          newTarget.push(target[1] + topOffset);
        } else {
          newTarget.push(0);
        }
      }
      if (el) {
        var documentInfo = {
          scrollHeight: document.body.scrollHeight,
          scrollTop: Math.ceil(document.scrollingElement.scrollTop),
          scrollTarget: calcOffsetRoot(el) + topOffset
        };
        documentInfo.direction = documentInfo.scrollTop < documentInfo.scrollTarget ? SCROLL_DIRECTION_DOWN : SCROLL_DIRECTION_UP;
        scrollTop(el, topOffset, documentInfo, SCROLL_TOP_TRIES); // this function does the actual work of scrolling.
      } else {
        (0, _get2["default"])((0, _getPrototypeOf2["default"])(OffsetScrollBehavior.prototype), "scrollToTarget", this).call(this, element, newTarget);
      }
    }
  }]);
  return OffsetScrollBehavior;
}(_scrollBehavior["default"]); // END: SCROLL CODE
var bindMiddleware = function bindMiddleware(middleware) {
  if (process.env.BROWSER && process.env.NODE_ENV === 'development') {
    var _require = require('redux-devtools-extension'),
      composeWithDevTools = _require.composeWithDevTools;
    return composeWithDevTools(_redux.applyMiddleware.apply(void 0, (0, _toConsumableArray2["default"])(middleware)));
  }
  return _redux.applyMiddleware.apply(void 0, (0, _toConsumableArray2["default"])(middleware));
};
var runRouter = function runRouter(location, routes) {
  return new Promise(function (resolve) {
    return (0, _reactRouter.match)({
      routes: routes,
      location: location
    }, function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return resolve(args);
    });
  });
};
var onRouterError = function onRouterError(error) {
  console.error('onRouterError', error);
};

/**
 *
 * @param {*} location
 * @param {*} initialState
 * @param {*} ErrorPage
 * @param {*} userPreferences
 * @param {*} offchain
 * @param {RequestTimer} requestTimer
 * @returns promise
 */
function serverRender(_x, _x2, _x3, _x4, _x5, _x6) {
  return _serverRender.apply(this, arguments);
}
/**
 * dependencies:
 * browserHistory
 * useScroll
 * OffsetScrollBehavior
 * location
 *
 * @param {*} initialState
 */
function _serverRender() {
  _serverRender = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(location, initialState, ErrorPage, userPreferences, offchain, requestTimer) {
    var error, redirect, renderProps, _yield$runRouter, _yield$runRouter2, server_store, onchain, url, key, content, postref, params, _content, author, permlink, category, msg, stack_trace, app, status, meta;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return runRouter(location, _RootRoute["default"]);
        case 3:
          _yield$runRouter = _context.sent;
          _yield$runRouter2 = (0, _slicedToArray2["default"])(_yield$runRouter, 3);
          error = _yield$runRouter2[0];
          redirect = _yield$runRouter2[1];
          renderProps = _yield$runRouter2[2];
          _context.next = 14;
          break;
        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error('Routing error:', _context.t0.toString(), location);
          return _context.abrupt("return", {
            title: 'Routing error - Blurt',
            statusCode: 500,
            body: (0, _server.renderToString)(ErrorPage ? /*#__PURE__*/_react["default"].createElement(ErrorPage, null) : /*#__PURE__*/_react["default"].createElement("span", null, "Routing error"))
          });
        case 14:
          if (!(error || !renderProps)) {
            _context.next = 17;
            break;
          }
          console.error('Router error [404]', error, 'props?', !!renderProps);
          return _context.abrupt("return", {
            title: 'Page Not Found - Blurt',
            statusCode: 404,
            body: (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(_NotFound.component, null))
          });
        case 17:
          _context.prev = 17;
          url = location;
          requestTimer.startTimer('apiGetState_ms');
          _context.next = 22;
          return apiGetState(url);
        case 22:
          onchain = _context.sent;
          requestTimer.stopTimer('apiGetState_ms');

          // If a user profile URL is requested but no profile information is
          // included in the API response, return User Not Found.
          if (!(url.match(_ResolveRoute.routeRegex.UserProfile) && Object.getOwnPropertyNames(onchain.profiles).length === 0)) {
            _context.next = 26;
            break;
          }
          return _context.abrupt("return", {
            title: 'User Not Found - Blurt',
            statusCode: 404,
            body: (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(_NotFound.component, null))
          });
        case 26:
          // If we are not loading a post, truncate state data to bring response size down.
          if (!url.match(_ResolveRoute.routeRegex.Post)) {
            for (key in onchain.content) {
              // Count some stats then remove voting data. But keep current user's votes. (#1040)
              onchain.content[key]['active_votes'] = null;
            }
          }

          // Are we loading an un-category-aliased post?
          if (!(!url.match(_ResolveRoute.routeRegex.UserProfile) && url.match(_ResolveRoute.routeRegex.PostNoCategory))) {
            _context.next = 43;
            break;
          }
          if (!process.env.OFFLINE_SSR_TEST) {
            _context.next = 32;
            break;
          }
          content = get_content_perf;
          _context.next = 37;
          break;
        case 32:
          postref = url.substr(2, url.length - 1).split('/');
          params = {
            author: postref[0],
            permlink: postref[1]
          };
          _context.next = 36;
          return (0, _blurtApi.callBridge)('get_post_header', params);
        case 36:
          content = _context.sent;
        case 37:
          if (!(content && content.author && content.permlink && content.category)) {
            _context.next = 42;
            break;
          }
          // valid short post url
          _content = content, author = _content.author, permlink = _content.permlink, category = _content.category;
          return _context.abrupt("return", {
            redirectUrl: "/".concat(category, "/@").concat(author, "/").concat(permlink)
          });
        case 42:
          return _context.abrupt("return", {
            title: 'Page Not Found - Blurt',
            statusCode: 404,
            body: (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(_NotFound.component, null))
          });
        case 43:
          // Insert the special posts into the list of posts, so there is no
          // jumping of content.
          offchain.special_posts.featured_posts.forEach(function (featuredPost) {
            onchain.content["".concat(featuredPost.author, "/").concat(featuredPost.permlink)] = featuredPost;
          });
          offchain.special_posts.promoted_posts.forEach(function (promotedPost) {
            onchain.content["".concat(promotedPost.author, "/").concat(promotedPost.permlink)] = promotedPost;
          });
          server_store = (0, _redux.createStore)(_RootReducer["default"], {
            app: initialState.app,
            global: onchain,
            userProfiles: {
              profiles: onchain.profiles
            },
            offchain: offchain
          });
          server_store.dispatch({
            type: '@@router/LOCATION_CHANGE',
            payload: {
              pathname: location
            }
          });
          server_store.dispatch(appActions.setUserPreferences(userPreferences));
          _context.next = 61;
          break;
        case 50:
          _context.prev = 50;
          _context.t1 = _context["catch"](17);
          if (!location.match(_ResolveRoute.routeRegex.UserProfile)) {
            _context.next = 57;
            break;
          }
          console.error('User/not found: ', location);
          return _context.abrupt("return", {
            title: 'Page Not Found - Blurt',
            statusCode: 404,
            body: (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(_NotFound.component, null))
          });
        case 57:
          msg = _context.t1.toString && _context.t1.toString() || _context.t1.message || _context.t1;
          stack_trace = _context.t1.stack || '[no stack]';
          console.error('State/store error: ', msg, stack_trace);
          return _context.abrupt("return", {
            title: 'Server error - Blurt',
            statusCode: 500,
            body: (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(ErrorPage, null))
          });
        case 61:
          try {
            requestTimer.startTimer('ssr_ms');
            app = (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(_reactRedux.Provider, {
              store: server_store
            }, /*#__PURE__*/_react["default"].createElement(_Translator["default"], null, /*#__PURE__*/_react["default"].createElement(_reactRouter.RouterContext, renderProps))));
            requestTimer.stopTimer('ssr_ms');
            meta = (0, _ExtractMeta["default"])(onchain, renderProps.params);
            status = 200;
          } catch (re) {
            console.error('Rendering error: ', re, re.stack);
            app = (0, _server.renderToString)( /*#__PURE__*/_react["default"].createElement(ErrorPage, null));
            status = 500;
          }
          return _context.abrupt("return", {
            title: 'Blurt',
            titleBase: 'Blurt - ',
            meta: meta,
            statusCode: status,
            body: _iso["default"].render(app, server_store.getState())
          });
        case 63:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 10], [17, 50]]);
  }));
  return _serverRender.apply(this, arguments);
}
function clientRender(initialState) {
  var sagaMiddleware = (0, _reduxSaga["default"])();
  var store = (0, _redux.createStore)(_RootReducer["default"], initialState, bindMiddleware([sagaMiddleware]));
  sagaMiddleware.run(_RootSaga["default"]);
  var history = (0, _reactRouterRedux.syncHistoryWithStore)(_reactRouter.browserHistory, store);

  /**
   * When to scroll - on hash link navigation determine if the page should scroll to that element (forward nav, or ignore nav direction)
   */
  var scroll = (0, _reactRouterScroll.useScroll)({
    createScrollBehavior: function createScrollBehavior(config) {
      return new OffsetScrollBehavior(config);
    },
    // information assembler for has scrolling.
    shouldUpdateScroll: function shouldUpdateScroll(prevLocation, _ref) {
      var location = _ref.location;
      // eslint-disable-line no-shadow
      // if there is a hash, we may want to scroll to it
      if (location.hash) {
        // if disableNavDirectionCheck exists, we want to always navigate to the hash (the page is telling us that's desired behavior based on the element's existence
        var disableNavDirectionCheck = document.getElementById(DISABLE_ROUTER_HISTORY_NAV_DIRECTION_EL_ID);
        // we want to navigate to the corresponding id=<hash> element on 'PUSH' navigation (prev null + POP is a new window url nav ~= 'PUSH')
        if (disableNavDirectionCheck || prevLocation === null && location.action === 'POP' || location.action === 'PUSH') {
          return location.hash;
        }
      }
      return true;
    }
  });
  if (process.env.NODE_ENV === 'production') {
    console.log('%c%s', 'color: red; background: yellow; font-size: 24px;', 'WARNING!');
    console.log('%c%s', 'color: black; font-size: 16px;', 'This is a developer console, you must read and understand anything you paste or type here or you could compromise your account and your private keys.');
  }
  return (0, _reactDom.render)( /*#__PURE__*/_react["default"].createElement(_reactRedux.Provider, {
    store: store
  }, /*#__PURE__*/_react["default"].createElement(_Translator["default"], null, /*#__PURE__*/_react["default"].createElement(_reactRouter.Router, {
    routes: _RootRoute["default"],
    history: history,
    onError: onRouterError,
    render: (0, _reactRouter.applyRouterMiddleware)(scroll)
  }))), document.getElementById('content'));
}
function apiGetState(_x7) {
  return _apiGetState.apply(this, arguments);
}
function _apiGetState() {
  _apiGetState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(url) {
    var offchain;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (process.env.OFFLINE_SSR_TEST) {
            offchain = get_state_perf;
          }
          _context2.next = 3;
          return (0, _blurtApi.getStateAsync)(url, null, true);
        case 3:
          offchain = _context2.sent;
          return _context2.abrupt("return", offchain);
        case 5:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _apiGetState.apply(this, arguments);
}