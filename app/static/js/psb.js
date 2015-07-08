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

var NoteList = function() {
  var self = this;
  this.noteList = [];

  this.getNotes = function getNotes() {
    $.getJSON("/notes", function(data) {
      self.setNotes(data.data);
    });
  };

  this.setNotes = function setNotes(data) {
    self.noteList = ko.utils.arrayMap(data, function(item) {
      return {'location': item[0],
              'symbol': item[1],
              'note': item[2]};
    });
  };

  this.lookup = function lookup(symbol, location) {
    var i;
    for (i=0; i<self.noteList.length; ++i) {
      var note = self.noteList[i];
      if (symbol == note.symbol && location == note.location) {
        return note.note;
      }
    }
    return '';
  };
  this.getNotes();
};
var SearchViewModel = function() {
  var self = this;
  this.searchResults = ko.observableArray();
  this.searchTerm = ko.observable('');
  this.wordMatch = ko.observable(false);
  this.scheduled = undefined;

  this.searchTerm.subscribe(function search(newterm) {
    if (newterm.length < 3) {
      self.searchResults.splice(0);
      return;
    }
    if (self.scheduled) {
      clearTimeout(self.scheduled);
    }
    var wordMatch = self.wordMatch();
    self.scheduled = setTimeout(function() {
      var url = "/search?term=" + newterm;
      if (wordMatch) {
        url += '&exact=1';
      }
      $.getJSON(url, function(data) {
        self.searchResults(data['data']);
      });
    }, 300);
  });

  this.search = function(term, wordMatch) {
    var old = self.wordMatch();
    self.wordMatch(wordMatch);
    self.searchTerm(term);
    self.wordMatch(old);
  };

  this.gotoEntry = function(data) {
    var url = '/file/' + data.location + '#L-' + data.lineno;
    psbViewModel.gotoDefinition(url, '', true);
  };
};

var PSBViewModel = function() {
  var self = this;
  this.noteList = new NoteList();
  this.navStackViewModel = new NavStackViewModel();
  this.searchViewModel = new SearchViewModel();

  // make sure the #nav-stack tab is shown. There is no custom binding
  // for bootstrap tabs, so for now, we just manipulate the DOM
  // directly.

  // TODO: Create a knockout custome binding for bootstrap tab
  this.showNavFramePane = function () {
    $('#nav-stack-btn').tab('show');
  };

  this.showDirectoryTree = function () {
    $('#directory-btn').tab('show');
  };

  this.showSearchPane = function () {
    $('#search-btn').tab('show');
  };

  this.gotoDefinition = function(url, symbol, clearStack) {
    $.get(url, function(file_content) {
      var note = self.noteList.lookup(url, symbol);
      var newFrame = new NavFrame(url, symbol, file_content, note);
      self.navStackViewModel.addNewFrame(newFrame, clearStack);
      self.showNavFramePane();
    });
  };

  function getLineNumber(el) {
    while (el && el.className != 'lineno') el = el.previousElementSibling;
    return el ? parseInt(el.textContent) : NaN;
  };

  function isSelfReference(el) {
    // check if el's href is pointing to it self
    var location = self.navStackViewModel.currentFrame().location;
    var currentFile = location.split('#')[0];
    var currentLine = getLineNumber(el.parentElement);
    return el.getAttribute('href') == currentFile + '#L-' + currentLine;
};

  // wrap gotoDefinition into an event handler
  this.symbolClickHandler = function(e) {
    var target = e.target;
    if (!isSelfReference(target)) {
      var lineNumber = getLineNumber(target.parentElement);
      if (!isNaN(lineNumber)) {
        self.navStackViewModel.currentFrame().callSite(lineNumber);
      }
      var url = target.getAttribute('href');
      self.gotoDefinition(url, target.text, false);
    } else {
      self.searchViewModel.search(target.text, true);
      self.showSearchPane();
    }
    return false;
  };

  this.showNote = function(e) {
    var target = e.target;
    var symbol = target.text;
    if (symbol.length == 0) {
      // don't have text content means it doesn't represent a symbol
      return true;
    }
    // lookup this symbol, and save the result to this node
    var location = target.getAttribute('href');
    var note = self.noteList.lookup(symbol, location);
    if (note.length > 0) {
      target.title = note;
    } else {
      target.title = '';
    }
    return true;
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

var psbViewModel = new PSBViewModel();

(function setup() {
  $.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    options.async = true;
  });
  // populate the project directory tree
  $.get('/file/', function(data) {
    $('#directory-content').jstree({
      "types" : {
        "default" : {
          "icon" : "glyphicon glyphicon-folder-close"
        },
        "file" : {
          "icon" : "glyphicon glyphicon-file"
        }
      },
      "plugins" : [ "types" ],
      'core' : {
        'data' : data
      }
    }).on('loaded.jstree', function() {
      $('#directory-content').jstree('open_node', '#root');
    });
  });

  $('#directory-content').on('select_node.jstree', function(event, data) {
      if (data.node.type === 'file') {
        var url = data.node.a_attr.href;
        psbViewModel.gotoDefinition(url, '', true);
      } else {
        data.instance.toggle_node(data.node);
      }
    });

  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var focusID = e.target.getAttribute('data-focus');
    if (focusID) {
      document.getElementById(focusID).focus();
    }// newly activated tab
  });
})();

ko.applyBindings(psbViewModel);
