var SearchViewModel = function(psbViewModel) {
  var self = this;
  this.searchResults = ko.observableArray();
  this.searchTerm = ko.observable('');
  this.wordMatch = ko.observable(false);

  this.search = function search(term, wordMatch) {
    if (term.length < 3) {
      self.searchResults.splice(0);
      return;
    }
    var url = "/search?term=" + term;
    if (wordMatch) {
      url += '&exact=1';
    }
    $.getJSON(url, function(data) {
      self.searchResults(data['data']);
    });
  };

  // searchAgain will always be an empty string, it's used to link searchResults
  // to searchTerm and wordMatch, as searchResults itself can't be a computed
  // variable, due to ajax call's asynchonous nature.
  this.searchAgain = ko.computed(function() {
    self.search(self.searchTerm(), self.wordMatch());
    return "";
  }).extend({rateLimit: { timeout: 300, method: "notifyWhenChangesStop" }});

  /*
   * Search for all uses of term, is (mostly) like search for the term, but only
   * matches whole words (-w switch in grep)
   */
  this.getUsage = function(term) {
    self.wordMatch(true);
    self.searchTerm(term);
  };

  this.gotoEntry = function(data) {
    var url = '/file/' + data.location + '#L-' + data.lineno;
    psbViewModel.gotoDefinition(url, '', true);
  };
};
