ko.bindingHandlers.enter = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      // This will be called when the binding is first applied to an element
      // Set up any initial state, event handlers, etc. here
      var value = valueAccessor();
      var valueUnwrapped = ko.unwrap(value);

      $(element).on('keypress', function(event) {
        var keycode = event.keyCode || event.which;
        if (keycode == 13) {
          valueUnwrapped(viewModel, event);
        }
      });
    }
};