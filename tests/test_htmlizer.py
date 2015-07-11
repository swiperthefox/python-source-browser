from unittest import TestCase
import os
import shutil
import tempfile

from utils import HTMLTestMixin, getFixtureDir
from app import htmlizer
from app.mktags import make_tags

class HtmilizerTestCase(TestCase, HTMLTestMixin):
    def setUp(self):
        self.root = getFixtureDir()
        fd, self.tagsfile = tempfile.mkstemp()
        os.close(fd)
        make_tags(self.root, self.tagsfile)

    def test_make_sure_highlighted(self):
        py_file = 'f1_2.py'
        full_path = os.path.join(self.root, py_file)
        pygments_config = {
            'tagurlformat': '/file/%(path)s%(fname)s%(fext)s',
            'tagsfile': self.tagsfile
        }
        html_code = htmlizer.pygmentize(full_path, pygments_config)
        import logging; logging.info(html_code)
        self.check_link_for_symbol(html_code,
                                   [("Test", "/file/dir2/f2_1.py#L-1"),
                                    ("a", "/file/f1_1.py#L-1")])

    def tearDown(self):
        os.remove(self.tagsfile)
