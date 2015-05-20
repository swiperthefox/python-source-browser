from __future__ import (
    absolute_import,
    print_function,
    unicode_literals,
)

import pygments, pygments.lexers, pygments.formatters
import os
import shutil
from app.path_utils import *

class Ctags_Error(Exception):
    pass

class DataSource:
    def __init__(self, root=None, cache_dir='psb_cache'):
        if root is None:
            root = os.getcwd()
        self.root = root
        self.cache_dir = cache_dir
        self.tags_name = os.path.join(self.cache_dir, '.i.m.p.o.ss.b')
        self.tags_updated = False

    def make_tags(self):
        make_sure_dir(self.cache_dir)
        # we want all file paths in tags file is relative to the root
        # the only way to do it is to create tags file in the root directory
        # and use --tag-relative option. After the tags file is created, we can
        # move it to psb_cache directory.
        tmp_tags = os.path.join(self.root, ".i.m.p.s.s.i.b")
        cmd = 'ctags -Rn --exclude=%s/ ' % self.cache_dir
        cmd += '-f %s --tag-relative=yes %s/' % (tmp_tags, self.root)
        exit_code = os.system(cmd)

        if exit_code:
            raise Ctags_Error("Failed to generate tags file using ctags. Please make sure that "
                              "ctags is installed.")
        else:
            self.tags_updated = True
            shutil.move(tmp_tags, self.tags_name)

    def pygmentize(self, py_path, html_path):
        """Generate syntax highlighted html file from python source file"""
        if not self.tags_updated:
            self.make_tags()

        config = {'linenos': 'table',
                'anchorlinenos': True,
                'tagurlformat': '/%(path)s%(fname)s%(fext)s.html',
                'tagsfile': self.tags_name,
                'lineanchors': 'L',
                'full': True,
                'title': py_path}
        lexer = pygments.lexers.PythonLexer()
        formatter = pygments.formatters.HtmlFormatter(**config)

        make_sure_dir(os.path.dirname(html_path))
        with open(py_path) as pyfile:
            with open(html_path, 'wb') as htmlfile:
                code = pyfile.read()
                pygments.highlight(code, lexer, formatter, htmlfile)

    def make_sure_highlighted(self, py_path):
        """Make sure that the syntax highlighted version of py_path is newer than itself.

        py_path: a relative path relative to the project root.
        """
        html_path = os.path.join(self.cache_dir, py_path + '.html')
        py_path = os.path.join(self.root, py_path)
        mtime = os.path.getmtime
        is_newer = os.path.isfile(html_path) and mtime(html_path) > mtime(py_path)
        if not is_newer:
            self.pygmentize(py_path, html_path)
        return html_path

