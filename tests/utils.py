import os
import re

class HTMLTestMixin:
    def check_link_for_symbol(self, html, pairs):
        """make sure that in the html source, the given symbols has expected links around it"""
        for symbol, expected_link in pairs:
            self.assertEqual(link_for_text(html, symbol), expected_link)


def link_for_text(html, text):
    return re.search('<a href="([^>]*?)">%s</a>' % text, html).group(1)

def getFixtureDir():
    relpath = os.path.relpath(os.path.dirname(__file__), os.getcwd())
    return os.path.join(relpath, 'fixtures/sample-dir')
