from __future__ import (
    absolute_import,
    print_function,
    unicode_literals,
)

import pygments, pygments.lexers, pygments.formatters
import os
from cgi import escape
import codecs

class CodeHtmlFormatter(pygments.formatters.HtmlFormatter):
    def wrap(self, source, outfile):
        return self._wrap_code(source)

    def _wrap_code(self, source):
        for i, t in source:
            if i == 1:
                # it's a line of formatted code
                t += '<br>'
            yield i, t

def htmlize_python_code(pycode, pygments_config={}):
    config = {'linenos': 'inline',
              'anchorlinenos': True,
              'lineanchors': 'L',
              'linespans': 'foo',
              'lineseparator':'',
              'linenostart': 1
    }
    config.update(pygments_config)

    lexer = pygments.lexers.PythonLexer()
    formatter = CodeHtmlFormatter(**config)

    return pygments.highlight(pycode, lexer, formatter)

def htmlize_plain_text(text):
    lines = text.splitlines()
    escaped = map(escape, lines)
    return "<br>".join (escaped)

def pygmentize(full_path, pygments_config={}):
    with codecs.open(full_path, encoding="utf-8") as pyfile:
        content = pyfile.read()
        if full_path.endswith('.py'):
            return htmlize_python_code(content, pygments_config)
        else:
            return htmlize_plain_text(content)
