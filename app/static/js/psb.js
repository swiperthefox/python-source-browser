var NavFrame = function(location, symbol, content) {
  var self = this;
  var excerptSize = 2;
  var items = location.split('#L-');

  // code content of the frame
  this.lineNumber = (items.length>1)?parseInt(items[1]):0;
  this.location = location.replace(/.*?\/file\//, "");
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
  this.editingNote = ko.observable('');
  this.editingStatus = ko.observable('');

  // bookkeeping for UI representation
  this.isCurrentFrame = ko.observable(true);

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
    var noteData = {location: self.location,
                    symbol: self.symbol,
                    note: self.editingNote()};
    $.post("/notes", JSON.stringify(noteData),
           function(data, textStatus) {
             var status = (data==='ok')?"green":"red";
             self.editingStatus(status);
           });
    self.showNoteEditor(false);
  };
};

var PSBViewModel = function() {
  var self = this;
  var EMPTYFRAME = new NavFrame("", "", "To start browse, choose a file from "
                                        + "the directory tree on the left side.");
  this.navStack = ko.observableArray();
  this.currentFrame = ko.observable(EMPTYFRAME);
  this.searchResults = ko.observableArray();
  this.searchTerm = ko.observable('');

  this.setCurrentFrame = function(newFrame) {
    if (self.currentFrame() != newFrame) {
      self.currentFrame().isCurrentFrame(false);
      newFrame.isCurrentFrame(true);
      self.currentFrame(newFrame);
    }
  };

  this.pushFrame = function(navFrame) {
    self.navStack.push(navFrame);
    self.setCurrentFrame(navFrame);
    showNavFramePane();
  };

  this.addNewFrame = function(url, symbol, file_content) {
    var newFrame = new NavFrame(url, symbol, file_content);
    self.pushFrame(newFrame);
  };

  // make sure the #nav-stack tab is shown. There is no custom binding
  // for bootstrap tabs, so for now, we just manipulate the DOM
  // directly.

  // TODO: Create a knockout custome binding for bootstrap tab
  function showNavFramePane() {
    $('#nav-stack-btn').tab('show');
  };

  function showDirectoryTree() {
    $('#directory-btn').tab('show');
  };

  this.setupNewFrame = function(domNode, i, data) {
    var p = document.getElementById('nav-stack').parentElement;
    var isOffScreen = p.clientHeight < p.scrollHeight;
    if (isOffScreen) {
      domNode.scrollIntoView();
    };

    // add event listener for click
    $(domNode).on('click', 'a', self.symbolClickHandler);
  };

  this.showFrame = function(navFrame) {
    self.setCurrentFrame(navFrame);
  };

  this.deleteFrame = function(value) {
    var idx = self.navStack.indexOf(value);
    if (idx != -1) {
      self.navStack.splice(idx);
    }
    var lastFrame = (idx>0) ? self.navStack()[idx-1] : EMPTYFRAME;
    self.setCurrentFrame(lastFrame);
    if (idx<=0) {
      showDirectoryTree();
    }
  };

  this.gotoDefinition = function(url, symbol, clearStack) {
    if (clearStack) {
      self.navStack.splice(0);
    }
    $.get(url, function(file_content) {
      self.addNewFrame(url, symbol, file_content);
    });
  };

  // wrap gotoDefinition into an event wrapper
  this.symbolClickHandler = function(e) {
    var target = e.target;
    var url = target.href;
    psbViewModel.gotoDefinition(url, target.text, false);
    return false;
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
  $("#nav-stack").on("click", ".nav-frame", function(e) {
    var target = e.target;
    psbViewModel.showFrame(ko.dataFor(target));
  });
  $("pre.highlight").on('click', 'a', psbViewModel.symbolClickHandler);

})();

ko.applyBindings(psbViewModel);
