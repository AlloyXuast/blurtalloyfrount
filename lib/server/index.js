"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
var _config = _interopRequireDefault(require("config"));
var blurtjs = _interopRequireWildcard(require("@blurtfoundation/blurtjs"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
var path = require('path');
var ROOT = path.join(__dirname, '../..');

// Tell `require` calls to look into `/app` also
// it will avoid `../../../../../` require strings

// use Object.assign to bypass transform-inline-environment-variables-babel-plugin (process.env.NODE_PATH= will not work)
Object.assign(process.env, {
  NODE_PATH: path.resolve(__dirname, '..')
});
require('module').Module._initPaths();

// Load Intl polyfill
// require('utils/intl-polyfill')(require('./config/init').locales);
var alternativeApiEndpoints = _config["default"].get('alternative_api_endpoints').split(' ');
global.$STM_Config = {
  fb_app: _config["default"].get('facebook_app_id'),
  blurtd_connection_client: _config["default"].get('blurtd_connection_client'),
  blurtd_connection_server: _config["default"].get('blurtd_connection_server'),
  blurtd_use_appbase: _config["default"].get('blurtd_use_appbase'),
  chain_id: _config["default"].get('chain_id'),
  address_prefix: _config["default"].get('address_prefix'),
  img_proxy_prefix: _config["default"].get('img_proxy_prefix'),
  ipfs_prefix: _config["default"].get('ipfs_prefix'),
  price_info_url: _config["default"].get('price_info_url'),
  coal_url: _config["default"].get('coal_url'),
  phishing_url: _config["default"].get('phishing_url'),
  read_only_mode: _config["default"].get('read_only_mode'),
  upload_image: _config["default"].get('upload_image'),
  site_domain: _config["default"].get('site_domain'),
  google_analytics_id: _config["default"].get('google_analytics_id'),
  wallet_url: _config["default"].get('wallet_url'),
  failover_threshold: _config["default"].get('failover_threshold'),
  alternative_api_endpoints: alternativeApiEndpoints
};
var WebpackIsomorphicTools = require('webpack-isomorphic-tools');
var WebpackIsomorphicToolsConfig = require('../../webpack/webpack-isotools-config');
global.webpackIsomorphicTools = new WebpackIsomorphicTools(WebpackIsomorphicToolsConfig);
global.webpackIsomorphicTools.server(ROOT, function () {
  blurtjs.api.setOptions({
    url: _config["default"].blurtd_connection_server,
    retry: {
      retries: 10,
      factor: 5,
      minTimeout: 50,
      // start at 50ms
      maxTimeout: 60 * 1000,
      randomize: true
    },
    useAppbaseApi: !!_config["default"].blurtd_use_appbase,
    alternative_api_endpoints: alternativeApiEndpoints,
    failover_threshold: _config["default"].get('failover_threshold')
  });
  blurtjs.config.set('address_prefix', _config["default"].get('address_prefix'));
  blurtjs.config.set('chain_id', _config["default"].get('chain_id'));

  // const CliWalletClient = require('shared/api_client/CliWalletClient').default;
  // if (process.env.NODE_ENV === 'production') connect_promises.push(CliWalletClient.instance().connect_promise());
  try {
    require('./server');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});