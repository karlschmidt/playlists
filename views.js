/**
 * @fileOverview Playlist views.
 * There are two main views, a list of all playlists, and a detailed view
 * of a single playlist. Exactly one of these two views is always present.
 * It would be desirable if there was a 1:1 correspondance between models and
 * views but this was considered not necessary for this simple application:
 * A PlaylistSet is rendered by a PlaylistSetView.
 * A Playlist model is rendered by a PlaylistView, TitleView, DescriptionView,
 * Player, SearchWidget, and MyTracksView.
 * Player and SearchWidget do not use a model-view pattern.
 * PlalistView, TitleView, and DescriptionView install notification callbacks in
 * a Playlist, but each callback is set by only one of them. (This simplistic
 * notification design allows to install only a single notification callback per
 * type which is sufficient for this application.)
 */

/**
 * The main view attached to rootElement, either a list of all playlists or a
 * playlist view.
 * @type {?PlaylistSetView|PlaylistView}
 */
mainView = null;


/**
 * Displays a list of all playlists, and lets the user add and delete playlists
 * and switch to a playlist.
 * @constructor
 * @param {PlaylistSet} playlists The playlists to display.
 */
function PlaylistSetView(playlists) {
  /** @type{PlaylistSet} */
  this.playlists = playlists;
  var element = document.getElementById('my-playlists');
  /* Make it visible. */
  element.style.display = '';
  /**
   * The root DOM element of this view.
   * @type {Element}
   */
  this.element = element;
  this.renderPlaylists();
  playlists.onChange = bind(this, this.renderPlaylists);
  /*
   * Button to create a new playlist, appends it to playlists, and switches to a
   * view of this playlist.
   */
  var add = document.getElementById('new-playlist');
  add.onclick = bind(this, function() {
    this.remove();
    var playlist = new Playlist(myPlaylists.uniqueTitle());
    myPlaylists.addPlaylist(playlist);
    mainView = new PlaylistView(playlist);
  });
  element.appendChild(add);
};

// Detaches this view from the DOM.
PlaylistSetView.prototype.remove = function() {
  this.element.style.display = 'none';
  document.getElementById('playlist-set').innerHTML = '';
};

PlaylistSetView.prototype.renderPlaylists = function() {
  var set = document.getElementById('playlist-set');
  set.innerHTML = '';
  for (index in this.playlists.playlists) {
    var playlist = this.playlists.playlists[index];
    var e = this.renderPlaylist(playlist, this.playlists);
    set.appendChild(e);
  }
};

/**
 * Renders a playlist in the lists of playlists.
 * @param {Playlist} playlist
 * @return {Object} The DOM element containing the playlist.
 */
PlaylistSetView.prototype.renderPlaylist = function(playlist) {
  var element = document.createElement('div');
  element.innerHTML = playlist.title;
  // Switch to a view of this playlist.
  element.onclick = bind(this, function() {
    this.remove();
    mainView = new PlaylistView(playlist);
  });
  return element;
};


/**
 * A detailed view of a single playlist.
 * The user can change the title and description, add tracks, remove tracks,
 * move tracks, and play the tracks.
 * @param {Playlist} playlist The playlist model.
 */
function PlaylistView(playlist) {
  /** @type {Playlist} */
  this.playlist = playlist;
  var div = document.getElementById('playlist');
  /* Make it visible. */
  div.style.display = '';
  /**
   * The root DOM element of the view.
   * @type {Object}
   */
  this.div = div;
  /* Installs notification callbacks in the playlist model. */
  playlist.onAddTrack = bind(this, function(track) { this.addTrack(track); });
  playlist.onDeleteTrack = bind(this, function(track) { this.deleteTrack(track); });
  playlist.onMoveTrack =
      bind(this, function(track, target) { this.moveTrack(track, target); });
  playlist.onChange = this.onChange;
  /*
   * Switch back to the main view when the playlist is deleted, for example
   * by a history undo.
   */
  myPlaylists.onDeletePlaylist = bind(this, function(playlist) {
    if (playlist == this.playlist) {
      this.remove();
      mainView = new PlaylistSetView(myPlaylists);      
    }
  });
  /* Back button which switches to the view of all playlists. */
  var back = document.getElementById('my-playlists-button');
  back.onclick = bind(this, function() {
                      this.remove();
                      mainView = new PlaylistSetView(myPlaylists);
                      });
  /* Player widget */
  this.player = new Player(playlist);
  /* Lets the user delete the playlist. */
  var deleter = document.getElementById('delete-playlist');
  deleter.onclick = bind(this, function() {
                         myPlaylists.deletePlaylist(playlist);
                         });
  this.title = new TitleView(playlist, div);
  this.description = new DescriptionView(playlist, div);
  /* Render the tracks. */
  this.tracksElement = document.getElementById('tracks');
  this.tracks = [];
  for (var idx in playlist.tracks) {
    var track = this.renderTrack(playlist.tracks[idx]);
    this.tracksElement.appendChild(track);
    this.tracks.push(track);
  }
  /* Lets the user search and add public tracks. */
  var search = new SearchWidget(playlist);
  /* Lets the user add his own private tracks. */
  this.myTracksView = new MyTracksView(playlist);
};

/* Hides the view. */
PlaylistView.prototype.remove = function() {
  this.player.remove();
  this.myTracksView.remove();
  this.div.style.display = 'none';
  this.tracksElement.innerHTML = '';
  /* Uninstall notification callbacks. */
  this.playlist.onAddTrack = null;
  this.playlist.onDeleteTrack = null;
  this.playlist.onMoveTrack = null;  
  myPlaylists.onDeletePlaylist = null;
};

/** Renders a track.
 * Moving of tracks is implemented with HTML5 drag & drop.
 * @param {Object} track SoundCloud track.
 * @return {Element} The DOM element rendering the track.
 */
PlaylistView.prototype.renderTrack = function(track) {
  var element = document.createElement('div');
  PlaylistView.fillTrack(element, track);
  element.className = 'track';
  element.draggable = true;
  element.ondragstart = function(event) {
    var index = NodeIndex(event.target);
    event.dataTransfer.setData("index", String(index));
  }
  this.div.ondragover = function(event) {
    var target = event.target;
    if (event.target.className == 'track' ||
        event.target.parentNode.className == 'track') {
      event.preventDefault();
    }
  };
  this.div.ondrop = bind(this, function(event) {
    var target = event.target;
    if (target.className != 'track') {
      target = target.parentNode;
    }
    if (target.className = 'track') {
      event.preventDefault();
      var index = event.dataTransfer.getData("index");
      var target = NodeIndex(target);
      this.playlist.moveTrack(index, target);
    }
  });
  /* Button to delete the track. */
  var x = document.createElement('button');
  x.innerHTML = 'Delete';
  x.onclick = bind(this, function() { this.playlist.deleteTrack(track); });
  element.appendChild(x);
  return element;
};

/**
 * Fills a track with data.
 * This is a property of PlaylistView so that it can also be called from the
 * SearchWidget.
 * @param {Element} element The DOM element.
 * @param {Object} track SoundCloud track.
 */
PlaylistView.fillTrack = function(element, track) {
  var user = document.createElement('span');
  user.className = 'user';
  user.style.display = 'inline-block';
  user.appendChild(document.createTextNode(track.user.username));
  element.appendChild(user);
  var title = document.createElement('span');
  title.className = 'title';
  title.appendChild(document.createTextNode(track.title));
  element.appendChild(title);
};

/**
 * Adds a track to the view.
 * @param {Object} track SoundCloud track.
 */
PlaylistView.prototype.addTrack = function(track) {
  var element = this.renderTrack(track);
  this.tracksElement.appendChild(element);
  this.tracks.push(element);
}

/**
 * Delets a track.
 * @param {number} index The index of the track to delete.
 */
PlaylistView.prototype.deleteTrack = function(index) {
  this.tracksElement.removeChild(this.tracks[index]);
  this.tracks.splice(index, 1);
}

/**
 * Moves a track to a new position.
 * @param {number} index The index of the track before the move.
 * @param {number} target The index of the track after the move.
 */
PlaylistView.prototype.moveTrack = function(index, target) {
  /* Note that the order of these calls is important. */
  var newTrack = this.tracksElement.removeChild(this.tracks[index]);
  this.tracks.splice(index, 1);
  if (target < this.tracks.length) {
    this.tracksElement.insertBefore(newTrack, this.tracks[target]);
  } else {
    this.tracksElement.appendChild(newTrack);
  }
  this.tracks.splice(target, 0, newTrack);
};

/**
 * Utility to locate a node in its parent's children.
 * @param {Object} node The child node.
 * @return {number} The index of the node in the list of its parent's children.
 */
function NodeIndex(node) {
  var parent = node.parentNode;
  var index;
  for (index = 0; index < parent.childNodes.length; ++index) {
    if (parent.childNodes[index] == node) {
      return index;
    }
  }
};


/**
 * Renders a playlist title, and allows the user edit it.
 * Editing is possibly by clicking on the title which is not perfectly
 * discoverable (it is hinted by a hover style). It might be better to add an edit
 * button.
 * @constructor
 * @param {Playlist} playlist
 * @param {Object} parent The parent DOM element to which the view is added.
 */
function TitleView(playlist, parent) {
  /** @type {Playlist} */
  this.playlist = playlist;
  playlist.onTitleChange = bind(this, this.update);
  var element = document.getElementById('title');
  /**
   * The root DOM element of this view.
   * @type {object}
   */
  this.element = element;
  element.style.display = '';
  this.update();
  element.onclick = bind(this, TitleView.prototype.edit);
};

/* Updates the rendered title text. */
TitleView.prototype.update = function() {
  this.element.innerHTML = this.playlist.title;
  /* Also sets the text in the edit form. */
  document.getElementById('title-input').setAttribute('value',
                                                      this.playlist.title);
};

/**
 * Lets the user edit the title. Switches to an input form.
 * This UI is not very intuitive since editing is only possible by clicking
 * on the title, and it does not quite behave like a form (there is no cancel
 * button, and the title is changed also whenever the input element looses
 * focus. The idea is that it should behave more like an editable text field
 * than like a web form.
 */
TitleView.prototype.edit = function() {
  var div = this.element;
  div.style.display = 'none';
  var form = document.getElementById('title-form');
  form.style.display = 'inline';
  var text = document.getElementById('title-input');
  text.setAttribute('value', this.playlist.title);
  text.focus();
  if (this.playlist.title) {
    text.select();
  }
  form.onsubmit = bind(this, TitleView.prototype.change);
  text.onblur = bind(this, TitleView.prototype.change);
  this.form = form;
}

TitleView.prototype.change = function(event) {
  event.preventDefault();
  var title = document.getElementById('title-input').value;
  this.playlist.setTitle(title);
  document.getElementById('title-form').style.display = 'none';
  this.element.style.display = '';
  return false;
};



/**
 * Renders a playlist description, and lets the user edit it.
 * Although the user can input multiple lines of text, line breaks are ignored
 * when rendering.
 * Like for titles, editing is possibly by clicking on the description, which is
 * not perfectly discoverable (it is hinted by a hover style). It might be
 * better to add an edit button.
 * @param {Playlist} playlist
 * @param {Object} parent Parent DOM element.
 */
function DescriptionView(playlist, parent) {
  this.playlist = playlist;
  this.element = document.getElementById('description');
  this.update();
  this.playlist.onDescriptionChange = bind(this, this.update);
  this.element.onclick = bind(this, this.edit);
};

/* Updates the rendered description. */
DescriptionView.prototype.update = function() {
  this.element.innerHTML = this.playlist.description || 'Add description';
  if (!this.playlist.description) {
    this.element.className = 'gray';
  } else {
    this.element.className = '';
  }
};

/* Switches to an edit form of the description. */
DescriptionView.prototype.edit = function() {
  this.element.style.display = 'none';
  var form = document.getElementById('description-form');
  form.style.display = '';
  var text = document.getElementById('description-textarea');
  text.innerHTML = '';
  text.value = this.playlist.description;
  text.select();
  text.focus();
  form.onsubmit = bind(this, this.change);
  text.onblur = bind(this, this.change);
}

/* Called when the user has input a description. Updates the model and switches
 * back to the normal description rendering. */
DescriptionView.prototype.change = function(event) {
  event.preventDefault();
  var description = document.getElementById('description-textarea').value;
  this.playlist.setDescription(description);
  document.getElementById('description-form').style.display = 'none';
  this.element.style.display = '';
  return false;
};


/**
 * A view of the user's private tracks. Since private tracks are not surfaced
 * in search, we show a list of the user's private tracks. We only show his or
 * her private tracks to keep the list shorter.
 * @constructor
 * @param {Playlist} playlist The playlist to which tracks can be added.
 */
var MyTracksView = function(playlist) {
  this.playlist = playlist;
  /* 
   * Installs a callback to be notified if the user authenticates and private
   * tracks become available.
   */
  MyTracks.onChange = bind(this, this.render);
  this.render();
};

/**
 * Renders the private tracks, if there are any.
 */
MyTracksView.prototype.render = function() {
  var element = document.getElementById('my-tracks-div');
  var tracks = MyTracks.tracks;
  if (tracks.length == 0) {
    element.style.display = 'none';
    return;
  }
  element.style.display = '';
  for (var i in tracks) {
    var track = tracks[i];
    this.renderTrack(track);
  }
};

/**
 * Renders a track, and lets the user add it to the playlist.
 * @param {Object} track SoundCloud track.
 */
MyTracksView.prototype.renderTrack = function(track) {
  var result = document.createElement('div');
  result.className = 'my-track';
  PlaylistView.fillTrack(result, track);
  var add = document.createElement('button');
  add.innerHTML = 'Add';
  add.onclick = bind(this, function() { this.playlist.addTrack(track); });
  result.appendChild(add);
  document.getElementById('my-tracks').appendChild(result);
};

/**
 * Removes the tracks UI from the DOM, and resets the notification callback.
 */
MyTracksView.prototype.remove = function() {
  document.getElementById('my-tracks-div').style.display = 'none';
  document.getElementById('my-tracks').innerHTML = '';
  MyTracks.onChange = null;
};

