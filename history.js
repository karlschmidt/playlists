
/**
 * @fileOverview A rudimentary history undo mechanism.
 * The history is recorded as a stack of functions which undo the last
 * operation in the models database. The views are automatically updated by
 * the model's change notifications.
 * Undo operations currently do not restore playlists and track into the right
 * order.
 * Arbitrary many operations can be undone but undos are only applied in order
 * (using a stack).
 * The history is implemented as a namespace and not as a class, there cannot be
 * multiple history instances.
 * This implements the history mechanism as well as the undo UI (not using
 * a model-view design since updating the UI is quite straightforward).
 * It would by nice if undos would also switch to the changed playlist, as
 * currently the user does not see the change when he currently views another
 * playlist but this is not implemented.
 */

/**
 * The history.
 * @namespace
 */
History = {};

/**
 * The undo stack, the last record is the most recent change. Each record
 * contains a description and a function which undos the change.
 * @type {Array.<Object>}
 */
History.records = [];

/**
 * Flag which is set during undo, so that undo operations are not recorded
 * as undo-abe changes.
 * @type {booealn}
 */
History.duringUndo = false;

/**
 * Initializes the history and the undo button.
 */
History.initialize = function() {
  var button = document.getElementById('undo');
  button.onclick = History.undo;
  History.update();
};

/**
 * Logs an change to the data models, unless it is called from an undo
 * operation.
 * @param {string} description Describes the change.
 * @param {function} revert The inverse operation which reverts the change.
 */
History.log = function(description, revert) {
  if (!History.duringUndo) {
    History.records.push({'description': description, 'revert': revert});
    History.update();
  }
};

/**
 * Reverts the last change.
 */
History.undo = function() {
  if (History.records.length == 0) {
    return;
  }
  var undo = History.records.pop();
  History.duringUndo = true;
  undo.revert();
  History.duringUndo = false;
  /* Updates the history view with the now last change. */
  History.update();
};

/**
 * Updates the Undo button with the given description.
 */
History.update = function() {
  var button = document.getElementById('undo');
  if (History.records.length > 0) {
    var description = History.records[History.records.length - 1].description;
    button.innerHTML = 'Undo ' + description;
    button.disabled = false;
  } else {
    button.disabled = true;
    button.innerHTML = 'Undo';
  }
};
