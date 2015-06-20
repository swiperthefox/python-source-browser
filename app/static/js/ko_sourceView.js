/*
 * Example use:
 * <pre data-bind="sourceView: aNavFrameObj, inFrame: true"></pre>
 */
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

      if (!valueUnwrapped) {
        element.style.display = 'None';
        return { controlsDescendantBindings: true };
      } else {
        element.style.display = 'block';
      }

      // set content
      var inFrame = allBindings.get('inFrame');
      element.innerHTML = (inFrame) ? valueUnwrapped.excerpt() : valueUnwrapped.content;

      // highlight the call site line
      var lineidPrefix = (inFrame) ? valueUnwrapped.idPrefix : "foo-";
      var linenum = valueUnwrapped.callSite();
      var highlighted = document.getElementById(lineidPrefix + linenum);
      if (highlighted) {
        highlighted.className += " hl_line";
      }
      // show the call site line. It looks best to put the call site
      // line near to the top of source view. so we will try to put it
      // in the third line from the top edge
      var isOverflowed = element.clientHeight < element.scrollHeight;

      if (isOverflowed) {
        linenum = Math.max(0, linenum-2); // if possible, show two more lines before call site
        var lineToShow = document.getElementById(lineidPrefix + linenum);
        if (lineToShow) {
          lineToShow.scrollIntoView();
        }
      }
      return true;
    }
};
