var _ = require('lodash');
var globPromise = require('glob-promise');
var Promise = require('bluebird');

var mediaUrlPatternsByType = {
  'vimeo': [
    'vimeo\.com/(\\d+)',
    'vimeo\.com/video/(\\d+)',
    'vimeo\.com/groups/.+/videos/(\\d+)',
    'vimeo\.com/channels/.+#(\\d+)'
  ],
  'youtube': [
    'youtube\.com/watch[#\?].*?v=([^"\& ]+)',
    'youtube\.com/embed/([^"\&\? ]+)',
    'youtube\.com/v/([^"\&\? ]+)',
    'youtube\.com/\?v=([^"\& ]+)',
    'youtu\.be/([^"\&\? ]+)',
    'gdata\.youtube\.com/feeds/api/videos/([^"\&\? ]+)'
  ]
};

var mediaUrlPatterns = [];
_.forEach(mediaUrlPatternsByType, function (patterns, type) {
  _.forEach(patterns, function (pattern) {
    mediaUrlPatterns.push({
      pattern: pattern,
      type: type
    });
  });
});

/**
 *
 * @param  {Array} patterns
 * @param  {Object} options
 * @return {Promise}
 */
function multiGlob(patterns, options) {
  var matches = [];

  return Promise.mapSeries(patterns, function (pattern) {
      return globPromise(pattern, options)
        .then(function (files) {
          matches = matches.concat(files);
        });
    })
    .then(function () {
      return Promise.resolve(matches);
    });
}

/**
 * Parses a YouTube or Vimeo URL and returns media ID and type.
 *
 * @param  {String} url
 * @param  {String} type
 * @return {String}
 */
function parseMediaUrl(url, type) {
  var i;
  var len;
  var matches;

  // If type is not given, then check all patterns until a match is found.
  if (_.isUndefined(type)) {
    var mediaUrlPattern;

    for (i = 0, len = mediaUrlPatterns.length; i < len; i++) {
      mediaUrlPattern = mediaUrlPatterns[i];
      matches = url.match(new RegExp(mediaUrlPattern.pattern, 'i'));

      if (_.isArray(matches) && matches[1]) {
        return {
          mediaId: matches[1],
          type: mediaUrlPattern.type
        };
      }
    }

    return {};
  }

  // If type is given, then check all patterns of that type until a match is found.
  var patterns = mediaUrlPatternsByType[type];

  for (i = 0, len = patterns.length; i < len; i++) {
    matches = url.match(new RegExp(patterns[i], 'i'));

    if (_.isArray(matches) && matches[1]) {
      return {
        mediaId: matches[1],
        type: type
      };
    }
  }

  return {};
}

module.exports = {
  /**
   * Constants
   */
  VIMEO: 'vimeo',
  YOUTUBE: 'youtube',
  multiGlob: multiGlob,
  parseMediaUrl: parseMediaUrl
};