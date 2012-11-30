
/**
 * @fileOverview Lets the user search public SoundCLoud tracks and add them to
 * a playlist.
 * This does not use a model-view design.
 */

/**
 * Searches SoundCloud and renders the UI.
 * @constructor
 * @param {Playlist} playlist The playlist to which tracks can be added.
 */
function SearchWidget(playlist) {
  this.playlist = playlist;
  this.element = document.getElementById('add-tracks');
  var form = document.getElementById('search');
  form.onsubmit = bind(this, function(event) {
    this.search(document.getElementById('search-query').value);
    /* Prevent the default action. */
    return false;
  });
};

/**
 * Searches SoundCloud for tracks, and renders the results.
 * @param {string} query Search term.
 */
SearchWidget.prototype.search = function(query) {
  var results = document.getElementById('search-results');
  /* Clear the results. */
  results.innerHTML = '';
  SC.get('/tracks', {q: query, filter: 'streamable'}, bind(this, this.renderResults));
}

/**
 * Renders the tracks found.
 * @param {Array.<Object>} tracks SoundCloud tracks.
 */
SearchWidget.prototype.renderResults = function(tracks) {
  for (var idx in tracks) {
    this.renderTrack(tracks[idx]);
  }
};

/**
 * Renders a track, and lets the user add it to the playlist.
 * @param {Object} track SoundCloud track.
 */
SearchWidget.prototype.renderTrack = function(track) {
  var result = document.createElement('div');
  result.className = 'search-track';
  PlaylistView.fillTrack(result, track);
  var add = document.createElement('button');
  add.innerHTML = 'Add';
  add.onclick = bind(this, function() { this.playlist.addTrack(track); });
  result.appendChild(add);
  document.getElementById('search-results').appendChild(result);
};
