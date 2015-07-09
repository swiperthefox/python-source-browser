/*
 * A frame in a navigation stack.
 *
 * Consider a function call in the code:
 *
 * def caller():
 *   ...
 *   callee()
 *
 * We need the following infomation to identify this call relation:
 *
 * - The file name of the source (realFileName)
 * - The content of the file
 * - The caller (identified by callerDefStart, the line number of the starting
 *   line of it's definition)
 * - Where the call happens (identified by callSite, the line number of where
 *   the call happens)
 * - The callee ()
 */
var NavFrame = function(location, symbol, content, note) {
  var self = this;
  var excerptSize = 2;

  // bookkeeping for UI representation, these two will change the css class of
  // frame title
  this.isCurrentFrame = ko.observable(true);
  this.showWarning = ko.observable(false);

  // The content is htmlized source code like this:
  //
  // <span id="foo-1">first line</span><br><span id="foo-2">second line</span>
  //
  // We need to show a few copys of contents like this in two
  // different places: in the navigation stack frames and the main
  // source viewing area. So we need to have different ids for the
  // lines in these different places. Here we choose to add a prefix
  // to the codes that shows in navigation stack frames. We will use
  // the time at the moment as the prefix for each NavFrame object.

  this.idPrefix = (new Date()).getTime() + '-';

  // code content of the frame
  this.allLines = content.split('<br>');
  this.content = content;
  this.location = location;
  this.realFileName = location.substring(6);
  this.symbol = symbol;
  var items = location.split('#L-');
  this.callerDefStart = (items.length>1)?parseInt(items[1]):0;

  // At the beginning, the user just start to look at the code in this file,
  // and hasn't find an interesting call site yet, so we will just show the
  // beginning of definition of the caller
  this.callSite = ko.observable(this.callerDefStart);

  // We will show the call site line, plus 2 more lines before and
  // after that line in the navigation stack frame.
  this.excerpt = ko.computed(function getLines() {
    // find out the beginning index of the excerpt
    var linenum = self.callSite();
    if (linenum === 0) {
      // don't interested in a specific line
      return "";
    }
    var windowSize = 1+2*excerptSize;
    var lineStart = linenum - excerptSize;
    lineStart = Math.min(self.allLines.length - windowSize, lineStart);
    lineStart = Math.max(0, lineStart);

    var excerptLines = self.allLines.slice(lineStart, lineStart + windowSize);
    var result = excerptLines.join('<br>');
    return result.replace(/foo-/g, self.idPrefix);
  }, this);

  // note editor for the symbol represented by this frame
  this.showNoteEditor = ko.observable(false);
  this.editingNote = ko.observable(note);
  this.editingStatus = ko.observable('');
  this.oldNote = note;

  this.editNote = function(data, event) {
    event.stopPropagation();
    self.showNoteEditor(true);
  };

  this.cancelEdit = function(data, event) {
    event.stopPropagation();
    self.showNoteEditor(false);
  };

  this.saveEdit = function(data, event) {
    event.stopPropagation();
    if (self.oldNote == self.editingNote()) {
      return;
    }
    var noteData = {location: self.location,
                    symbol: self.symbol,
                    note: self.editingNote()};
    $.post("/notes", JSON.stringify(noteData),
           function(data, textStatus) {
             var status = (textStatus==='success')?"green":"red";
             self.editingStatus(status);
             psbViewModel.noteList.setNotes(data['data']);
             self.oldNote = self.editingNote();
           });
    self.showNoteEditor(false);
  };
};

var NavStackViewModel = function() {
  var self = this;
  var EMPTYFRAME = new NavFrame("", "", "To start browse, choose a file from "
                                        + "the directory tree on the left side.");
  this.navStack = ko.observableArray();
  this.currentFrame = ko.observable(null);

  this.setCurrentFrame = function(newFrame) {
    if (self.currentFrame() != newFrame) {
      if (self.currentFrame()) {
        self.currentFrame().isCurrentFrame(false);
      }
      if (newFrame) {
        newFrame.isCurrentFrame(true);
      }
      self.currentFrame(newFrame);
    }
  };

  /*
   * Check if current frame is in the middle of stack. If so, confirm that the user
   * do want to discard parts of old stack, and continue from the current frame.
   */
  this.confirmBranching = function() {
    if (self.currentFrame() == self.navStack()[self.navStack().length - 1]) {
      return true; // nothing to worry about
    }
    self.markFramesAfterCurrent(true);
    var result = confirm("You are trying to branch from the middle of the stack. Do you want to discard the frames after current frame?");
    self.markFramesAfterCurrent(false);
    return result;
  };

  this.markFramesAfterCurrent = function(addMark) {
    var currentFrame = self.currentFrame();
    var navStack = self.navStack();

    var i = self.navStack().length-1;
    while (i>=0 && navStack[i] != currentFrame) {
      navStack[i].showWarning(addMark);
      --i;
    }
  };

  this.discardFrames = function(clearStack) {
    var idx = self.navStack.indexOf(self.currentFrame()) + 1;
    if (clearStack) {
      idx = 0;
    }
    self.navStack.splice(idx);
  };

  this.addNewFrame = function(newFrame, clearStack) {
    var confirmed = self.confirmBranching();
    if (!confirmed) return;
    self.discardFrames(clearStack);
    self.navStack.push(newFrame);
    self.setCurrentFrame(newFrame);
  };

  this.deleteFrame = function(value) {
    var idx = self.navStack.indexOf(value);
    if (idx != -1) {
      self.navStack.splice(idx);
    }
    var lastFrame = (idx > 0) ? self.navStack()[idx-1] : null;
    self.setCurrentFrame(lastFrame);

    if (lastFrame) {
      lastFrame.callSite(lastFrame.callerDefStart);
    } else {
      psbViewModel.showDirectoryTree();
    }
  };
};
