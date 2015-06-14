var NavFrame = function(location, content) {
  var self = this;
  var excerptSize = 2;
  var items = location.split('#L-');
  this.lineNumber = (items.length>1)?parseInt(items[1]):0;
  this.location = location.replace(/.*?\/file\//, "");
  this.content = content;
  function getLines(text, linenum, size) {
    if (linenum === 0) {
      // don't interested in a specific line
      return "";
    }
    text = text.substring(28, text.length-13);
    var lines = text.split('\n');
    var windowSize = 1+2*size;
    var lineStart = linenum - size;
    lineStart = Math.min(lines.length - windowSize, lineStart);
    lineStart = Math.max(0, lineStart);
    var segment =  lines.slice(lineStart, lineStart + windowSize).join('\n');
    return segment.replace(/foo/g, "excerpt");
  };
  this.excerpt = getLines(content, this.lineNumber, excerptSize);
  this.scrollTop = 0;
};

var PSBViewModel = function() {
  var self = this;
  var EMPTYFRAME = new NavFrame("", "");
  this.navStack = ko.observableArray();
  this.currentFrame = ko.observable(EMPTYFRAME);
  this.searchResults = ko.observableArray();
  this.searchTerm = ko.observable('');

  this.pushFrame = function(navFrame) {
    self.navStack.push(navFrame);
    self.currentFrame(navFrame);
    showNavFramePane();
  };

  this.clearAddNewFrame = function(url, file_content) {
    self.navStack.splice(0);
    self.addNewFrame(url, file_content);
  };

  this.addNewFrame = function(url, file_content) {
    var newFrame = new NavFrame(url, file_content);
    self.pushFrame(newFrame);
  };

  // make sure the #nav-stack tab is shown. This could be a custom-binding,
  // but no one has implemented it, so for now, we just manipulate the DOM
  // directly.
  // TODO: Create a knockout custome binding for bootstrap tab
  function showNavFramePane() {
    $('#nav-stack-btn').tab('show');
  };

  this.scrollToBottom = function(domNode, i, data) {
    domNode.scrollIntoView();
  };

  this.showFrame = function(navFrame) {
    self.currentFrame(navFrame);
  };

  this.deleteFrame = function(value) {
    var idx = self.navStack.indexOf(value);
    if (idx != -1) {
      self.navStack.splice(idx);
    }
    if (idx > 0) {
      self.currentFrame(self.navStack()[idx-1]);
    } else {
      self.currentFrame(EMPTYFRAME);
    }
  };
};

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
        $.get(url, function(file_content) {
          psbViewModel.clearAddNewFrame(url, file_content);
        });
      } else {
        data.instance.toggle_node(data.node);
      }
    });
  $("#nav-stack").on("click", ".nav-frame", function(e) {
    var target = e.target;
    psbViewModel.showFrame(ko.dataFor(target));
  });
})();


var psbViewModel = new PSBViewModel();

ko.applyBindings(psbViewModel);
