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
