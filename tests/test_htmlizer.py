from unittest import TestCase
import os
import shutil
import tempfile

from utils import HTMLTestMixin, getFixtureDir
from app.htmlizer import SourceConverter

class SourceConverterTestCase(TestCase, HTMLTestMixin):
    def setUp(self):
        root = getFixtureDir()
        fd, self.tagsfile = tempfile.mkstemp()
        os.close(fd)
        self.converter = SourceConverter(root, self.tagsfile)

    def test_make_tags(self):
        tagsfile = self.converter.tagsfile
        if os.path.isfile(tagsfile):
            os.remove(tagsfile)
        self.converter.make_tags()
        self.assertTrue(os.path.isfile(tagsfile), msg="Tags file is not created.")
        with open(tagsfile) as tags:
            taglines = tags.readlines()
            import logging; logging.error( "".join(taglines))
            self.assertEqual(len(taglines), 10)


    def test_make_sure_highlighted(self):
        py_file = 'f1_2.py'
        html_code = self.converter.pygmentize(py_file)
        self.check_link_for_symbol(html_code,
                                   [("Test", "/file/dir2/f2_1.py#L-1"),
                                    ("a", "/file/f1_1.py#L-1")])

    def tearDown(self):
        os.remove(self.tagsfile)