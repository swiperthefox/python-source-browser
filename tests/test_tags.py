from unittest import TestCase
import os
import shutil
import tempfile

from app.mktags import make_tags
from utils import getFixtureDir

class HtmilizerTestCase(TestCase):
    def test_make_tags(self):
        root = getFixtureDir()
        fd, tagsfile = tempfile.mkstemp()
        os.close(fd)
        if os.path.isfile(tagsfile):
            os.remove(tagsfile)
        make_tags(root, tagsfile)
        self.assertTrue(os.path.isfile(tagsfile), msg="Tags file is not created.")
        with open(tagsfile) as tags:
            taglines = tags.readlines()
            self.assertEqual(len(taglines), 10)
