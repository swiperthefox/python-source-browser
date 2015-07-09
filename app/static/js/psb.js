var PSBViewModel = function() {
  var self = this;
  this.noteList = new NoteList(self);
  this.navStackViewModel = new NavStackViewModel(self);
  this.searchViewModel = new SearchViewModel(self);

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
      self.searchViewModel.getUsage(target.text);
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
