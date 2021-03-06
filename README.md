# python-source-browser

A tool for browsing python sources.

### Features:

* Cross reference between names and their definitions
* Call stack alike view to show your browsing trace, why and how did you get to current section of code
* Add your own notes to symbols

### Why:

When I need to browse and understand a python project, I want some tools to help me cruise through the codes. But I didn't found my ideal one.

With the support of static analysis tools, like [Jedi](https://github.com/davidhalter/jedi), I could jump to a definition of a specific name, browse around it, and jump to another name that I am interested in, and so on. With the support of my editor, I can also jump back to where I come from, once at a time. But I found that  sometimes, after a few jumps, I would lost the whole picture of this jump around game: I forget why I am here. Things will get even worse if some indrective recursive calls is involved.

[Some](http://blog.prashanthellina.com/2007/11/14/generating-call-graphs-for-understanding-and-refactoring-python-code/) [tools](https://pycallgraph.readthedocs.org/en/master/) has been developed to generate call graphs of python sources, but as the project size grows, the call graphs can become overwhelmingly complicated very soon.

This project is an experiment to try another way of source browsing: The user will lead the trip, decide where to start from; which symbol to visit next; when to go back and try another road; occacionally make some comments on interesting symbols. The program will provide helps along the trip: finds out where the symbol is; keeps and shows a map of the trip, so that the user will not be lost; magically tranport the user to a previously visited stop, without go through the stops in between; take notes of those useful comments that the user has made, and show them out whenever that symbol appears again.

### Requirements:

* [Pygments](http://pygments.org): Highlight python source codes.
* [Exuberant Ctags](http://ctags.sourceforge.net/): Index definitions of class, method, function and variables.
  **Note**: On some Linux systems, a GNU version of ctags is installed, but Exuberant Ctags is required for a special option support. You can use "ctags --version" to check which version of ctags is installed on your system.
* [Flask](http://flask.pocoo.org/): Backends for the web GUI of the program.

### How to run:

Download or clone the source, go to the source directory. (In a virtual enviroment or not) do

    pip install -r requirements.txt

Then

    ./psb path_to_project_root

A web browser window (or tab) will open, and you can start your cruise.

### Todo:

* Ctags is not very accurate, especically when the same name is used for multiple purpose. Other options are Jedi, Rope or Pysonar2.
* For now, the call stack can only record one linear trace, it's not hard to record all traces, as a forest. But this may not be very useful, and will make the interface more crowded for sure.
* For some reasons I can't tell, the call stack looks a bit strange, not like a call stack.
