from unittest import TestCase
import os
import re
import shutil

from app.datasource import DataSource

class DataSourceTestCase(TestCase):
    def setUp(self):
        root = 'tests/fixtures/sample-dir'
        self.datasource = DataSource(root)

    def test_make_tags(self):
        tagsfile = self.datasource.tags_name
        if os.path.isfile(tagsfile):
            os.remove(tagsfile)
        self.datasource.make_tags()
        self.assertTrue(os.path.isfile(tagsfile), msg="File tags not exists.")
        with open(tagsfile) as tags:
            taglines = tags.readlines()
            self.assertEqual(len(taglines), 10)

    def test_make_sure_highlighted(self):
        shutil.rmtree(self.datasource.cache_dir, True)
        py_file = 'f1_2.py'
        html_file = self.datasource.make_sure_highlighted(py_file)
        self.assertTrue(os.path.isfile(html_file), msg="Html file is not exists.")
        with open(html_file) as html:
            html_code = html.read()
            self.check_link_for_symbol(html_code,
                                       [("Test", "/dir2/f2_1.py.html#L-1"),
                                        ("a", "/f1_1.py.html#L-1")])

    def check_link_for_symbol(self, html, pairs):
        for symbol, expected_link in pairs:
            self.assertEqual(link_for_text(html, symbol), expected_link,
                             msg = "link for symbol is wrong")

def link_for_text(html, text):
    return re.search('<a href="([^>]*?)">%s</a>' % text, html).group(1)
