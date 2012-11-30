/**
 * @author Karl Schmidt
 *
 * @fileOverview Main code, for initialization and common code.
 * The application is tested in Google Chrome. It uses eg. HTML5 draggable, and
 * does not work in all browsers.
 * The implementation has a number of shortcomings which I didn't improve due
 * to the lack of time. Some of these are:
 * - It only works in some browsers and requires HTML5.
 * - The UI is ugly and uses no icons or avatars.
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

/* Called once when the HTML page has been loaded. */
function onLoad() {
  SC.initialize({
    client_id: '8df9cc8a3f18eec1df28e0e5f0ee494a',
    redirect_uri: 'http://playlists-web-dev.s3-website-eu-west-1.amazonaws.com/'
  });
  /* Create an empty set of playlists. */
  /* TODO: load playlists */
  myPlaylists = new PlaylistSet();
  myPlaylists.load();
  History.initialize();
  mainView = new PlaylistSetView(myPlaylists);
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

