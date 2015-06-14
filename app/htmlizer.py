from __future__ import (
    absolute_import,
    print_function,
    unicode_literals,
)

import pygments, pygments.lexers, pygments.formatters
import os
import shutil

class Ctags_Error(Exception):
    pass

class SourceConverter:
    def __init__(self, root, tagsfile):
        self.root = root
        self.tagsfile = tagsfile
        self.tags_generated = False

    def make_tags(self):
        # we want all file paths in tags file is relative to the root
        # the only way to do it is to create tags file in the root directory
        # and use --tag-relative option. After the tags file is created, we can
        # move it to psb_cache directory.
        tmp_tags = os.path.join(self.root, ".i.m.p.s.s.i.b")
        cmd = 'ctags -Rn --exclude=%s ' % tmp_tags
        cmd += '-f %s --tag-relative=yes %s/' % (tmp_tags, self.root)
        exit_code = os.system(cmd)

        if exit_code:
            raise Ctags_Error("Failed to generate tags file using ctags. Please make sure that"
                                " ctags is installed.")
        else:
            shutil.move(tmp_tags, self.tagsfile)

    def htmlize_python_file(self, full_path):
        """Generate syntax highlighted html source from python source file"""
        if not self.tags_generated:
            self.make_tags()

        config = {'linenos': 'inline',
                  'anchorlinenos': True,
                  'tagurlformat': '/file/%(path)s%(fname)s%(fext)s',
                  'tagsfile': self.tagsfile,
                  'lineanchors': 'L',
                  'linespans': 'foo'}
        lexer = pygments.lexers.PythonLexer()
        formatter = pygments.formatters.HtmlFormatter(**config)

        with open(full_path) as pyfile:
            pycode = pyfile.read()
            return pygments.highlight(pycode, lexer, formatter)

    def htmlize_plain_text(self, file_path):
        with open(file_path) as fp:
            lines = fp.readlines()
            return "<br>".join(lines)

    def pygmentize(self, path):
        full_path = os.path.join(self.root, path)
        if path.endswith('.py'):
            return self.htmlize_python_file(full_path)
        else:
            return self.htmlize_plain_text(full_path)
