/**
 * League model events
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _league = require('./league.model');

var _league2 = _interopRequireDefault(_league);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LeagueEvents = new _events.EventEmitter();

// Set max event listeners (0 == unlimited)
LeagueEvents.setMaxListeners(0);

// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  _league2.default.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function (doc) {
    LeagueEvents.emit(event + ':' + doc._id, doc);
    LeagueEvents.emit(event, doc);
  };
}

exports.default = LeagueEvents;
//# sourceMappingURL=league.events.js.map
