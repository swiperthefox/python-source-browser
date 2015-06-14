# Design

## Functionality List

To browse the sources of a project, we want to do:

1. (done) List the directory structure of the project, this will be a tree view (T),

2. (done) Open a file (F) from the tree view T,

3. Search for a keyword.

   Since editing is not supported, we will use the "type to search" metaphor.

4. (done)Check the definition of a name by clicking it.

   This can be done in two different ways:

   1. If the name is a value, maybe just showing the related line is enough.

   2. If the name is a function/class/module, open the related file and jump to the correspoding line

5. (done)See a trace of our navigation: why and how do we get to this point.

   A call stack like view will be helpful for this.

6. Associated with the call stack view, we want to go back thus pop off one or more frames.

7. Allow user to add notes to symbols, and show them as tool tips.

   These notes should be saved in a seperate place, without changing originial python source code.

8. (For later)In the opposite direction of #4, to go the places that using the current definition. This needs:

    1. To find out the closed definition where the click is in
    2. To find out the usage of the definition

    Note: pyscope has more supports for this, check it later

## Implementation

### Generate the cross referencing info:

"Goto definition" can be done with *ctages* and *pygments*. With the help of *ctags*, *Pygments* can generated syntax highlighted code, with the cross references link built in the result html.

### User interface:

Will use a browser, using knockout js.

* (done) Define a tree compoenent for knockout js.

    Some examples are floating in the internet, will use one of them as a starting point.
    update: Using jstree for now.

* A call stack view.

* (done) Handle the "click" event using our own function, to:

    1. Get a chance to trace the links

    2. To control where the linked file will be shown

### Data Source for UI:

A simple flask app will do the job.

#### API:

* GET, /path/to/xxx.py.seg

    Generate or grab the syntax highlighted version of /path/to/xxx.py

* GET, /notes

    Get all notes as a json file

* POST, /notes/

    Create a note which is associated with a symbol, {'name': symbol, 'note': '123'}



