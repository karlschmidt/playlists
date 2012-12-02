/**
 * @fileOverview Player widget which plays all tracks in a playlist.
 * It preloads the next sound while the previous sound is played, to minimize
 * gaps between tracks.
 */

/**
 * @constructor
 * @param {Playlist} playlist The playlist to play.
 */
function Player(playlist) {
  /** @type {Playlist} */
  this.playlist = playlist;
  /**
   * The index of the currenly played track.
   * @type {number}
   */
  this.index = -1;
  /** The currently played SoundCloud soundManager2 sound object, or null.
   * @type {Object}
   */
  this.sound = null;
  /** The preloaded next SoundCloud soundManager2 sound object, or null.
   * @type {Object}
   */
  this.nextSound = null;
  var element = document.getElementById('player');
  /**
   * The player button.
   * @type {Element}
   */
  this.element = element;
  this.stop();
  /* Stop the player when the playlist changes because bad things can happen. */
  this.playlist.onTracksChange = bind(this, this.stop);
};

/**
 * Removes the player widget.
 */
Player.prototype.remove = function() {
  this.stop();
  /* Remove callbacks to avoid memory leaks. */
  this.element.onclick = null;
  this.playlist.onTracksChange = null;
};

/**
 * Plays the playlist.
 */
Player.prototype.play = function() {
  this.element.innerHTML = 'Stop';
  this.element.onclick = bind(this, this.stop);
  this.index = -1;
  this.nextSound = null;
  this.playNextTrack();
};

/**
 * Stops playling.
 */
Player.prototype.stop = function() {
  this.element.innerHTML = 'Play';
  this.element.onclick = bind(this, this.play);
  if (this.sound) {
    this.sound.stop();
    this.sound = null;
    this.nextSound = null;
  }
  this.index = -1;
};

/**
 * Plays the next track, or stops at the end of the playlist.
 * It might be good to pre-load the next track while the previous track is
 * played but it seems sufficiently fast without this.
 */
Player.prototype.playNextTrack = function() {
  this.index += 1;
  if (this.index >= this.playlist.tracks.length) {
    this.sound = null;
    this.stop();
    return;
  } else if (this.nextSound) {
    /* The next sound is preloaded. */
    var sound = this.nextSound;
    this.nextSound = null;
    this.playSound(sound);
  } else {
    /* Load the sound. */
    var track = this.playlist.tracks[this.index];
    SC.stream(track.id, bind(this, function(sound) { this.playSound(sound); }));
  }
};

/**
 * Plays the given sound, and preloads the next sound.
 * Called by the SoundCloud SDK when a sound is ready.
 * param {Object} sound SoundCloud soundManager2 sound object.
 */
Player.prototype.playSound = function(sound) {
  this.sound = sound;
  sound.play({onfinish: bind(this, this.playNextTrack)});
  /*
   * Preload the next track. Since we don't cancel in-flight streams, it could
   * happen that a slow, previously requested sound might overwrite nextSound
   * but this is unlikely to happen.
   */
  this.nextSound = null;
  if (this.index + 1 < this.playlist.tracks.length) {
    var track = this.playlist.tracks[this.index + 1];
    SC.stream(track.id, bind(this, function(sound) { this.nextSound = sound; }));
  }
};

