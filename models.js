/**
 * @author Karl Schmidt
 *
 * @fileOverview SoundCloud playlists models.
 * The models store the playlists data on the client but are not concerned
 * with their rendering.
 * Data are stored in the browser's LocalStorage after each change, and are
 * restored when loading the page.
 * This uses a model view design, and a very rudimentary events system to update
 * views on model changes.
 * Views can install notification callbacks (eg. onChange()) in the models to
 * update themselves when data changes.
 * There can only be one callback installed for each notification type, which is
 * sufficient for this application.
 * Changes to the models are recorded in a history and can be undone, by
 * providing callbacks which revert each operation. This works because the
 * undos are only applied in (reverse, stack) order, so the state of the models
 * is the same when an operation was performed and before it is undone.
 */

/**
 * The playlists.
 * @type {PlaylistSet}
 */
myPlaylists = null;

/**
 * A list of playlists.
 * @constructor
 */
function PlaylistSet() {
  /** @type {Array.<Playlist>} */
  this.playlists = [];

  /**
   * Notification called when a playlist is added or deleted. A viewer may set
   * this to receive notifications.
   * @type {?function()}
   */
  this.onChange = null;

  /**
   * Notification called when a playlist is deleted. A viewer may set this to
   * receive notifications.
   * @type {?function(Playlist)}
   */
  this.onDeletePlaylist = null;
};

/**
 * Appends a playlist to the end of the list.
 * @param {Playlist} playlist.
 */
PlaylistSet.prototype.addPlaylist = function(playlist) {
  this.playlists.push(playlist);
  // Notifies the viewer.
  this.onChange && this.onChange();
  History.log('Add Playlist',
              bind(this, function() { this.deletePlaylist(playlist); }));
  this.save();
}

/**
 * Deletes a playlist from the set, and calls onChange and onDeletePlaylist.
 * @param {PLaylist} playlist The playlist to delete.
 */
PlaylistSet.prototype.deletePlaylist = function(playlist) {
  var index = this.playlists.indexOf(playlist);
  this.playlists.splice(index, 1);
  // Notifies the viewer.
  this.onChange && this.onChange();
  this.onDeletePlaylist && this.onDeletePlaylist(playlist);
  History.log('Delete Playlist',
              bind(this, function() { this.addPlaylist(playlist); }));
  this.save();
};

/**
 * Stores the playlist data in the browser's LocalStorage. Data is stored in
 * JSON format. We exclude all null values since these are just any unset
 * notification callbacks.
 */
PlaylistSet.prototype.save = function() {
  var s = JSON.stringify(this, function(key, value) {
    if (value == null) return undefined; else return value;
  });
  localStorage.playlists = s;
};

/**
 * Restores playlists from the browser's LocalStorage.
 */
PlaylistSet.prototype.load = function() {
  var s = localStorage.playlists;
  if (!s) {
    return;
  }
  var data = JSON.parse(s);
  for (var i in data.playlists) {
    var playlistData = data.playlists[i];
    var playlist = new Playlist(playlistData.title);
    playlist.description = playlistData.description;
    playlist.tracks = playlistData.tracks;
    this.playlists.push(playlist);
  }
};

/**
 * Returns a playlist title which is unique in the set.
 * @return {string} Playlist title.
 */
PlaylistSet.prototype.uniqueTitle = function() {
  for (var n = 1; n < 1000; ++n) {
    title = 'Playlist ' + n;
    var found = false;
    for (var i = 0; i < this.playlists.length; ++i) {
      if (this.playlists[i].title == title) {
        found = true;
        break;
      }
    }
    if (!found) {
      return title;
    }
  }
}

/**
 * Playlist model. A playlist consists of a title, a description, and a list of
 * tracks.
 * @constructor
 * @param {string} title The playlist title.
 */
function Playlist(title) {
  /**
   * Title of the playlist.
   * @type {string}
   */
  this.title = title;
  
  /** 
   * Description of the playlist.
   * @type {string}
   */
  this.description = '';

  /**
   * The SoundCloud tracks in the playlist.
   * @type {Array.<Object>}
   */
  this.tracks = [];
  
  /**
   * Notification called when the title changed.
   * @type {?function(string)}
   */
  this.onTitleChange = null;

  /**
   * Notification called when the description changed.
   * @type {?function(string)}
   */
  this.onDescriptionChange = null;

  /**
   * Notification called BEFORE any tracks are changed.
   * @type {?function}
   */
  this.onTracksChange = null;

  /**
   * Notification called when a track was added.
   * @type {?function(Object)}
   */
  this.onAddTrack = null;

  /**
   * Notification called when a track was deleted. Called with the index of the
   * deleted track.
   * @type {?function(number)}
   */
  this.onDeleteTrack = null;

  /**
   * Notification called when a track was moved. Called with the index of the
   * track before and after the move.
   * @type {?function(number, number)}
   */
  this.onMoveTrack = null;
};

/**
 * Sets the title.
 * @param {string} title
 */
Playlist.prototype.setTitle = function(title) {
  var oldTitle = this.title;
  this.title = title;
  this.onTitleChange && this.onTitleChange(title);
  History.log('Set Description',
              bind(this, function() { this.setTitle(oldTitle); }));
  myPlaylists.save();
};

/**
 * Sets the description.
 * @param {string} description
 */
Playlist.prototype.setDescription = function(description) {
  var oldDescription = this.description;
  this.description = description;
  this.onDescriptionChange && this.onDescriptionChange(description);
  History.log('Set Description',
              bind(this, function() { this.setDescription(oldDescription); }));
  myPlaylists.save();
};

/**
 * Appends a track to the end of the playlist. A playlist may contain multiple
 * instances of the "same" track but each Track object may be added only once.
 * @param {Object} track the SoundCloud track.
 */
Playlist.prototype.addTrack = function(track) {
  this.onTracksChange && this.onTracksChange();
  this.tracks.push(track);
  this.onAddTrack && this.onAddTrack(track);
  History.log('Add Track',
              bind(this, function() { this.deleteTrack(track); }));
  myPlaylists.save();
};

/**
 * Deletes the given track from the playlist.
 * @param {Object} track The SoundCloud track to be deleted.
 */
Playlist.prototype.deleteTrack = function(track) {
  this.onTracksChange && this.onTracksChange();
  index = this.tracks.indexOf(track);
  this.tracks.splice(index, 1);
  this.onDeleteTrack && this.onDeleteTrack(index);
  History.log('Delete Track',
              bind(this, function() { this.addTrack(track); }));
  myPlaylists.save();
};

/**
 * Moves a track within the playlist.
 * @param {number} from The index of the track to be moved.
 * @param {number} to The index where the track is moved to.
 */
Playlist.prototype.moveTrack = function(from, to) {
  this.onTracksChange && this.onTracksChange();
  if (from == to) {
    return;
  }
  var track = this.tracks[from];
  this.tracks.splice(from, 1);
  this.tracks.splice(to, 0, track);
  this.onMoveTrack && this.onMoveTrack(from, to);
  History.log('Move Track', bind(this, function() { this.moveTrack(to, from); }));
  myPlaylists.save();
};


