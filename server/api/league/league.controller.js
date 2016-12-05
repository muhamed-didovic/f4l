/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/leagues              ->  index
 * POST    /api/leagues              ->  create
 * GET     /api/leagues/:id          ->  show
 * PUT     /api/leagues/:id          ->  upsert
 * PATCH   /api/leagues/:id          ->  patch
 * DELETE  /api/leagues/:id          ->  destroy
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.index = index;
exports.show = show;
exports.create = create;
exports.upsert = upsert;
exports.patch = patch;
exports.destroy = destroy;

var _fastJsonPatch = require('fast-json-patch');

var _fastJsonPatch2 = _interopRequireDefault(_fastJsonPatch);

var _league = require('./league.model');

var _league2 = _interopRequireDefault(_league);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');

function getLiveDataWithBonus(playersObj, teamObj, bonusArr) {

  bonusArr = bonusArr || [];
  var transfer_cost = teamObj.entry_history.event_transfers_cost;
  var value = teamObj.entry.value * 100 / 1000;
  var bank = teamObj.entry.bank * 100 / 1000;
  var total_value = value + bank;
  value = value.toFixed(1);
  bank = bank.toFixed(1);
  total_value = total_value.toFixed(1);
  var total_transfers = teamObj.entry.total_transfers;
  var gw_transfers = teamObj.entry.event_transfers;
  var transfers_hit = teamObj.entry.event_transfers_cost;

  var team_id = teamObj.entry.id;
  var picks = teamObj.picks;
  var live_score = 0;
  var bonus_pts = 0;

  var playedstr = "";
  var playednum = 0;
  var toplaystr = "";
  var toplaynum = 0;
  var didntplaystr = "";
  var didntplaynum = 0;

  var captain_dnp = false;
  var firstxistr = "";
  var subsstr = "";

  var captain = void 0,
      vice_captain = void 0,
      vice_points = void 0,
      vice_captain_id = void 0,
      captain_id = void 0,
      captain_points = void 0;
  for (var i = 0; i < picks.length; i++) {
    var is_captain = false;
    var is_vice = false;
    if (picks[i].is_captain == 1) {
      captain_id = picks[i].element;
      captain = playersObj.elements[captain_id - 1].second_name;
      is_captain = true;
      captain_points = picks[i].points;
    }
    if (picks[i].is_vice_captain == 1) {
      vice_captain_id = picks[i].element;
      vice_captain = playersObj.elements[vice_captain_id - 1].second_name;
      is_vice = true;
      vice_points = picks[i].points;
    }
    if (picks[i].is_sub != 1) {

      if (firstxistr != "") {
        firstxistr += ", ";
      }
      firstxistr += playersObj.elements[picks[i].element - 1].second_name;
      if (is_captain) {
        firstxistr += " (C)";
      } else if (is_vice) {
        firstxistr += " (vc)";
      }

      var pts = picks[i].points * picks[i].multiplier;

      //bonus
      //console.log('bonus array22', bonusArr);
      for (var j = 0; j < bonusArr.length; j++) {
        //bonus for finished matches
        if (bonusArr[j].playerID == picks[i].element) {
          bonus_pts = bonus_pts + bonusArr[j].bonusPTS * picks[i].multiplier;
          // if (team_id === 289692){
          //   console.log(bonus_pts, bonusArr[j].playerID, bonusArr[j].bonusPTS * picks[i].multiplier);
          // }
        }
      }
      live_score = live_score + pts /*+ bonus_pts*/;

      if (picks[i].has_played == 1) {
        if (picks[i].stats.minutes > 0) {
          //has played
          if (playedstr != "") {
            playedstr += ", ";
          }
          playednum++;
          playedstr += playersObj.elements[picks[i].element - 1].second_name;
        } else {
          //didnt play
          if (didntplaystr != "") {
            didntplaystr += ", ";
          }
          didntplaynum++;
          didntplaystr += playersObj.elements[picks[i].element - 1].second_name;
          if (is_captain) {
            captain_dnp = true;
          }
        }
      } else {
        //to play
        if (toplaystr != "") {
          toplaystr += ", ";
        }
        toplaynum++;
        toplaystr += playersObj.elements[picks[i].element - 1].second_name;
      }
    } else {
      if (subsstr != "") {
        subsstr += ", ";
      }
      subsstr += playersObj.elements[picks[i].element - 1].second_name;
      if (is_captain) {
        subsstr += " (C)";
      } else if (is_vice) {
        subsstr += " (vc)";
      }
    }
  } //end for
  var current_points = teamObj.entry.summary_overall_points;
  var week_points = teamObj.entry.summary_event_points;
  var live_total = current_points - week_points + live_score - (dontIncludeCost ? 0 : transfer_cost) + bonus_pts;

  return {
    value: value,
    bank: bank,
    total_value: total_value,
    total_transfers: total_transfers,
    gw_transfers: gw_transfers,
    transfers_hit: transfers_hit,
    captain: captain,
    vice_captain: vice_captain,
    live_score: live_score - (dontIncludeCost ? 0 : transfer_cost) + bonus_pts,
    live_total: live_total,
    playednum: playednum,
    playedstr: playedstr,
    toplaynum: toplaynum,
    toplaystr: toplaystr,
    didntplaynum: didntplaynum,
    didntplaystr: didntplaystr,
    bonus_pts: bonus_pts,
    transfer_cost: transfer_cost,
    current_points: current_points,
    week_points: week_points,
    team_id: teamObj.entry.id
  };
}

var dontIncludeCost = false;
//find players with bonuses
var getBonusData = function getBonusData(fixturesArr) {
  //bonus
  var bonusArr = [];

  for (var k = 0; k < fixturesArr.length; k++) {

    if (dontIncludeCost === false && fixturesArr[k].finished === true) {
      dontIncludeCost = true;
    }

    //todo: check bonus property better
    if (_.isEmpty(fixturesArr[k].stats)) break;
    console.log('BONUS', fixturesArr[k].stats[8], fixturesArr[k].started, !!fixturesArr[k].stats[8].bonus.a, fixturesArr[k].stats[8].bonus.h);
    if (fixturesArr[k].started && _.isEmpty(fixturesArr[k].stats[8].bonus.a) && _.isEmpty(fixturesArr[k].stats[8].bonus.h)) {
      var _ret = function () {
        var bpsArr = [];
        var indx = 0;
        var stats = fixturesArr[k].stats;
        for (var i = 0; i < stats.length; i++) {
          if ((0, _keys2.default)(stats[i]) == "bps") {
            // away team
            var bps_a = stats[i].bps.a;
            for (var j = 0; j < bps_a.length; j++) {
              if (bps_a[j].value > 10) {
                bpsArr[indx] = { playerID: bps_a[j].element, bpsPTS: bps_a[j].value };
                indx++;
              }
            }
            // home team
            var bps_h = stats[i].bps.h;
            for (var _j = 0; _j < bps_h.length; _j++) {
              if (bps_h[_j].value > 10) {
                bpsArr[indx] = { playerID: bps_h[_j].element, bpsPTS: bps_h[_j].value };
                indx++;
              }
            }
          }
        }
        // sorting
        // bpsArr.sort(function (a, b) {
        //   return b.bpsPTS - a.bpsPTS
        // });
        //console.log('bpsArr', bpsArr);
        if (_.isEmpty(bpsArr) || bpsArr.length <= 4) return 'break';
        // add bonuses
        var minBP = 3;
        var bonus_pt = 3;
        var empty_pt = 0;

        //todo: filter players without bonus
        var bonusData = bpsArr.sort(function (a, b) {
          return b.bpsPTS - a.bpsPTS;
        })
        //.slice(0, 4)
        .map(function (item, index) {
          var bonus = { playerID: bpsArr[index].playerID, bonusPTS: bonus_pt + empty_pt - index };
          if (bpsArr[index].bpsPTS == bpsArr[index + 1].bpsPTS) {
            empty_pt++;
          } else {
            empty_pt = 0;
          }
          return bonus;
        });
        bonusArr.push(bonusData);
      }();

      if (_ret === 'break') break;
    } //end if
  } //end for
  //console.log('111', _.flatten(bonusArr));
  return _.flatten(bonusArr);
};

function getChipsAndWildcards(teamObj) {
  //let team_id = teamObj.entry.id;
  var lastGW = teamObj.entry.current_event;

  var numChips = teamObj.chips.length;
  var chipsdetail = "";
  var chipname = "";
  var livechip = 0;

  var wildcardplayed = false;

  for (var i = 0; i < teamObj.chips.length; i++) {
    var chip = teamObj.chips[i];
    if (chip.name == "3xc") {
      chipname = "Triple Captain";
    } else if (chip.name == "attack") {
      chipname = "All Out Attack";
    } else if (chip.name == "bboost") {
      chipname = "Bench Boost";
    } else if (chip.name == "wildcard") {
      chipname = "Wildcard";
      wildcardplayed = true;
    } else {
      chipname = chip.name;
    }
    chipsdetail += chipname + " (GW" + chip.event + ")\n";
    if (chip.event == lastGW) {
      livechip = 1;
    }
  }

  var wcimg = void 0,
      wctxt = void 0;
  if (!wildcardplayed) {
    wcimg = "//upload.wikimedia.org/wikipedia/commons/thumb/0/03/Green_check.svg/13px-Green_check.svg.png";
    wctxt = "Available";
  } else {
    wcimg = "//upload.wikimedia.org/wikipedia/en/thumb/b/ba/Red_x.svg/13px-Red_x.svg.png";
    wctxt = "Played";
  }

  return {
    numChips: numChips,
    color: livechip ? 'pink' : '',
    chipsdetail: chipsdetail,
    livechip: livechip,
    wildcardplayed: wildcardplayed,
    wcimg: wcimg,
    wctxt: wctxt
  };
}

var options = {
  method: 'GET',
  //uri: 'https://fantasy.premierleague.com/drf/leagues-classic-standings/' + leagueId,
  //resolveWithFullResponse: true,
  //json: true,
  simple: true,
  transform: function transform(body, response, resolveWithFullResponse) {
    if (response.headers['content-type'] !== 'application/json') {
      error.log('Not valid json');
      //throw new Error('Transform failed!');
      return;
    }
    return JSON.parse(body);
  }
};

function getChipsAndWildcard(url, gamer) {
  return new _promise2.default(function (resolve, reject) {
    options.uri = url;
    rp(options).then(function (team) {
      gamer['chipsandwildcards'] = getChipsAndWildcards(team);
      //console.log('1111', team);
      return resolve(gamer);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function getGameData(url, gamer, players, playersWithBonuses) {
  return new _promise2.default(function (resolve, reject) {
    options.uri = url;
    rp(options).then(function (team) {
      //console.log('team', team.entry.id);
      gamer['live_data'] = getLiveDataWithBonus(players, team, playersWithBonuses);
      gamer['team'] = team;
      //console.log(team);
      //return team;
      return resolve(gamer);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function (entity) {
    try {
      _fastJsonPatch2.default.apply(entity, patches, /*validate*/true);
    } catch (err) {
      return _promise2.default.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.remove().then(function () {
        res.status(204).end();
      });
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Leagues
function index(req, res) {
  //todo: error handling and parameter checking
  //todo: convert to promises and modular code
  //todo: change static values
  //todo: add error handling for accept/json in requests
  var gwnum = 0;
  var leagueId = 404;

  var users = void 0,
      players = void 0,
      fixtures = void 0,
      playersWithBonuses = void 0;
  options.uri = 'https://fantasy.premierleague.com/drf/leagues-classic-standings/' + leagueId;
  rp(options).then(function (data) {
    users = data;
    //console.log('dddddd', data);
    options.uri = 'https://fantasy.premierleague.com/drf/bootstrap-static';
    return rp(options);
  }).then(function (data) {
    //todo: error handling?
    players = data;

    //get current gameweek from players or bootstrap-static api
    var gwObj = players.events.filter(function (event, index) {
      return event.is_current;
    });

    if (!gwObj) {
      throw new Error('Game week not define', { gwObj: gwObj });
    }

    //add gameweek to gwnum so it available globally
    gwnum = gwObj[0].id;

    //get bonus data from api
    options.uri = "https://fantasy.premierleague.com/drf/fixtures/?event=" + gwnum;
    return rp(options);
  }).then(function (data) {
    fixtures = data;

    //todo: error handling, aslo check method for error handling?
    playersWithBonuses = getBonusData(fixtures);
    console.log('playersWithBonuses', playersWithBonuses);
    console.log('dontIncludeCost', dontIncludeCost);
    var games = users.standings.results.map(function (gamer) {
      //todo: error handling, aslo check method for error handling?
      var data = getGameData("https://fantasy.premierleague.com/drf/entry/" + gamer.entry + "/event/" + gwnum, gamer, players, playersWithBonuses);
      data['chipsAndWildcards'] = getChipsAndWildcard("https://fantasy.premierleague.com/drf/entry/" + gamer.entry + "/history", gamer);
      return data;
    });

    //todo: error handling for games
    return _promise2.default.all(games).then(function (data) {
      //console.log('asdasdas', data);
      users.standings.results = data;
      return res.json(users);
    });
  }).catch(handleError(res));
}

// Gets a single League from the DB
function show(req, res) {
  return _league2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Creates a new League in the DB
function create(req, res) {
  return _league2.default.create(req.body).then(respondWithResult(res, 201)).catch(handleError(res));
}

// Upserts the given League in the DB at the specified ID
function upsert(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _league2.default.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: true, setDefaultsOnInsert: true, runValidators: true }).exec().then(respondWithResult(res)).catch(handleError(res));
}

// Updates an existing League in the DB
function patch(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _league2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(patchUpdates(req.body)).then(respondWithResult(res)).catch(handleError(res));
}

// Deletes a League from the DB
function destroy(req, res) {
  return _league2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(removeEntity(res)).catch(handleError(res));
}
//# sourceMappingURL=league.controller.js.map
