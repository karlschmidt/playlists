/**
 * @author Karl Schmidt
 *
 * @fileOverview Main code, for initialization and common code, and a list of
 * my private tracks.
 * The application is tested in Google Chrome. It uses eg. HTML5 draggable, and
 * does not work in all browsers.
 * The implementation has a number of shortcomings which I didn't improve due
 * to the lack of time. Some of these are:
 * - It only works in some browsers and requires HTML5.
 * - The UI is simplistic, not polished, and uses no icons or avatars.
 * - Playlist data is only stored persistently in the browser's LocalStorage.
 * - View classes re-use a single DOM element tree (which is hidden when there
 *   is no view), although there could be multiple instances of a view. It would
 *   be better to create DOM elements dynamically or clone a template.
 * - Memory leaks are likely because, when a class instance is deleted, not all
 *   notification callbacks are removed (which may leave references to the class
 *   instance). This could be fixed by making sure to clear all notification
 *   callbacks when an object is removed.
 * - The implementation mixes instantiable classes and namespaces / singletons.
 *   This should be made consistent.
 * - History undo does not restore deleted elements into the right order.
 */

/**
 * Called once when the HTML page has been loaded.
 */
function onLoad() {
  SC.initialize({
    client_id: '8df9cc8a3f18eec1df28e0e5f0ee494a',
    redirect_uri: 'http://playlists-web-dev.s3-website-eu-west-1.amazonaws.com/callback.html'
  });
  /* Provides a button to authenticate the user. */
  document.getElementById('connect').onclick = connectWithSoundCloud;
  /* Create an empty set of playlists. */
  myPlaylists = new PlaylistSet();
  myPlaylists.load();
  History.initialize();
  mainView = new PlaylistSetView(myPlaylists);
};

/**
 * Connects with SoundCloud to authenticate the user. Authentication is only
 * needed in order to access the user's private tracks. The user can add and
 * play public tracks without authenticating.
 */
function connectWithSoundCloud() {
  SC.connect(function() {
    SC.get('/me', connectedWithSoundCloud);
  });
}

/**
 * Called after SoundCloud authentication. Replaces the connect button with
 * the user's name, and loads the user's private tracks.
 * @param {Object} me The SoundCloud user object, or null if authentication
 *   failed.
 */
function connectedWithSoundCloud(me) {
  if (!me) {
    return;
  }
  document.getElementById('connect').style.display = 'none';
  var username = document.getElementById('username');
  username.appendChild(document.createTextNode(me.username));
  username.style.display = '';
  MyTracks.load(me);
};

/**
 * The usual bind trick, returns a function which is executed in a given scope.
 * @param {Object} scope The scope in which the function will be executed.
 * @param {Function} func The function to be executed.
 * @return {Function} Returns a function which executes the given function in the
 *   given scope.
 */
function bind(scope, func) {
  return function () {
    var args = Array.prototype.slice.apply(arguments);
    return func.apply(scope, args);
  };
}

/**
 * Holds the user's private tracks, if connected. Public tracks are surfaced
 * and added via search. Since private tracks are not surfaced by search, we
 * add a list of the user's private tracks. We only show the user's private
 * tracks to keep the list smaller.
 * @namespace
 */
var MyTracks = {};

/**
 * The user's private SoundCloud tracks.
 * @type {Array.<Object>}
 */
MyTracks.tracks = [];

/**
 * Notification callback which is called after the private tracks have been
 * loaded. A viewer can set this callback in order to update the UI after
 * authentication.
 * @type {function()}
 */
MyTracks.onChange = null;

/**
 * Requests the user's tracks.
 * @param {Object} me The SoundCloud user object.
 */
MyTracks.load = function(user) {
  SC.get('/users/' + user.id + '/tracks', MyTracks.addTracks);
};

/**
 * Stores the user's private tracks and calls the notification callback.
 * @param {Array.<Object>} tracks SoundCloud tracks.
 */
MyTracks.addTracks = function(tracks) {
  for (var i in tracks) {
    var track = tracks[i];
    if (track.sharing == 'private') {
      MyTracks.tracks.push(track);
    }
  }
  MyTracks.onChange && MyTracks.onChange();
};

