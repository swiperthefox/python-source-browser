ko.bindingHandlers.sourceView = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      // This will be called when the binding is first applied to an element
      // Set up any initial state, event handlers, etc. here
      $(element).on('click', 'a', bindingContext.$root.symbolClickHandler);
      $(element).on('mouseenter', 'a', bindingContext.$root.showNote);
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
      element.innerHTML = valueUnwrapped;

      // show the desired line.
      // It seems that it's best to put the desired line near to the top of source view.
      // so we will try to put it in the third line
      var isOverflowed = element.clientHeight < element.scrollHeight;

      if (isOverflowed) {
        var highlighted = element.getElementsByClassName("hl_line")[0];
        var pcount = 4; // we need to do at most four previousSibling
        while (highlighted && highlighted.previousSibling && pcount > 0) {
          highlighted = highlighted.previousSibling;
          pcount--;
        }
        if (highlighted) {
          highlighted.scrollIntoView();
        }
      }
    }
};
