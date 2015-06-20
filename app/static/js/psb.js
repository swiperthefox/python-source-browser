var NavFrame = function(location, symbol, content, note) {
  var self = this;
  var excerptSize = 2;
  var items = location.split('#L-');

  // code content of the frame
  this.lineNumber = (items.length>1)?parseInt(items[1]):0;
  this.location = location;
  this.realFileName = location.substring(6);
  var idRegexp = new RegExp('("foo-' + this.lineNumber + '")');
  this.content = content.replace(idRegexp, '$1 class="hl_line"');
  this.symbol = symbol;

  function getLines(text, linenum, size) {
    if (linenum === 0) {
      // don't interested in a specific line
      return "";
    }
    var lines = text.split('<br>');
    var windowSize = 1+2*size;
    var lineStart = linenum - size;
    lineStart = Math.min(lines.length - windowSize, lineStart);
    lineStart = Math.max(0, lineStart);
    var excerptLines = lines.slice(lineStart, lineStart + windowSize);
    return excerptLines.join('<br>');
  };
  this.excerpt = getLines(this.content, this.lineNumber, excerptSize);

  // note editor for the symbol represented by this frame
  this.showNoteEditor = ko.observable(false);
  this.editingNote = ko.observable(note);
  this.editingStatus = ko.observable('');
  this.oldNote = note;

  // bookkeeping for UI representation
  this.isCurrentFrame = ko.observable(true);
  this.showWarning = ko.observable(false);

  this.scrollTop = 0;

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
  this.searchResults = ko.observableArray();
  this.searchTerm = ko.observable('');
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

  this.gotoDefinition = function(url, symbol, clearStack) {
    $.get(url, function(file_content) {
      var note = self.noteList.lookup(url, symbol);
      var newFrame = new NavFrame(url, symbol, file_content, note);
      self.navStackViewModel.addNewFrame(newFrame, clearStack);
      self.showNavFramePane();
    });
  };

  // wrap gotoDefinition into an event handler
  this.symbolClickHandler = function(e) {
    var target = e.target;
    var url = target.getAttribute('href');
    self.gotoDefinition(url, target.text, false);
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
      newFrame.isCurrentFrame(true);
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
    if (idx <= 0) {
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
})();

ko.applyBindings(psbViewModel);
