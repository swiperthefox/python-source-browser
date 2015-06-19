ko.bindingHandlers.stayInView = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      element.scrollIntoView();
    }
};
