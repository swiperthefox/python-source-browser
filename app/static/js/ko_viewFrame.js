ko.bindingHandlers.viewFrame = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      // This will be called when the binding is first applied to an element
      // Set up any initial state, event handlers, etc. here
      $(element).on('click', 'a', function(e) {
        var target = e.target;
        var url = target.href;
        bindingContext.$root.gotoDefinition(url, target.text, false);
        return false;
      });
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      // This will be called once when the binding is first applied to an element,
      // and again whenever any observables/computeds that are accessed change
      // Update the DOM element based on the supplied values here.

      // First get the latest data that we're bound to
      var value = valueAccessor();

      // Next, whether or not the supplied model property is observable, get its current value
      var valueUnwrapped = ko.unwrap(value);

      // set content
      element.innerHTML = valueUnwrapped.content;

      // show the desired line.
      // It seems that it's best to put the desired line near to the top of source view.
      // so we will try to put it in the third line
      var toplinenumber = Math.max(1, valueUnwrapped.lineNumber-3);
      var toprow = getLineByIndex(toplinenumber);
      if (toprow) {toprow.scrollIntoView();}

      // highlight the desired line
      var targetLine = getLineByIndex(valueUnwrapped.lineNumber);
      if (targetLine) { targetLine.style.background = "#01c145"; }
      function getLineByIndex(lineNumber) {
        var lineid = "foo-" + lineNumber;
        return document.getElementById(lineid);
      }
    }
};