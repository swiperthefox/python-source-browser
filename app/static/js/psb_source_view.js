ko.bindingHandlers.viewFrame = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      // This will be called when the binding is first applied to an element
      // Set up any initial state, event handlers, etc. here
      $(element).on('click', 'a', function(e) {
        var target = e.target;
        var url = target.href;
        $.get(url, function(file_content) {
          bindingContext.$root.addNewFrame(url, file_content);
        });
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

      // scroll to desired line
      var lineId = "foo-" + valueUnwrapped.lineNumber;
      var row = document.getElementById(lineId);
      if (row) {
        row.scrollIntoView();
        row.style.background="#01c145";
      }
    }
};