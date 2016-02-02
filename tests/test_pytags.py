from unittest import TestCase
import os

from app import pytags
from utils import getFixturePath

class PytagsConstructorTestCase(TestCase):
    def test_contructor_on_non_exists_tags_file(self):
        fake_tags_file = getFixturePath("non-exists.tags")
        if os.path.exists(fake_tags_file):
            os.remove(fake_tags_file)
        with self.assertRaises(IOError):
            tags = pytags.CTags(fake_tags_file)

    def test_constructor(self):
        tags_file = getFixturePath("sample.tags")
        tags = pytags.CTags(tags_file)
        self.assertEqual(tags['format'], 2)
        self.assertEqual(tags['sort'], 1)

class PyTagsTestCase(TestCase):
    def setUp(self):
        tags_file = getFixturePath("sample.tags")
        self.tags = pytags.CTags(tags_file)
        self.FLAG_MATCH_CASE = pytags.TAG_FULLMATCH | pytags.TAG_OBSERVECASE
        self.FLAG_MATCH_IGNORE = pytags.TAG_FULLMATCH | pytags.TAG_IGNORECASE
        self.FLAG_PARTIAL_CASE = pytags.TAG_PARTIALMATCH | pytags.TAG_OBSERVECASE
        self.FLAG_PARTIAL_IGNORE = pytags.TAG_PARTIALMATCH | pytags.TAG_IGNORECASE

    def test_first(self):
        entry = pytags.TagEntry()
        status = self.tags.first(entry)
        self.assertEqual(status, pytags.SUCCESS)
        self.assertEqual(entry['name'], "CTags")
        self.assertEqual(entry['file'], "pytags.py")
        self.assertEqual(entry['lineNumber'], 18)

    def test_find_flags(self):
        entry = pytags.TagEntry()
        SUCCESS = pytags.SUCCESS
        FAILURE = pytags.FAILURE

        testing_data = [
            ["add_note", self.FLAG_MATCH_CASE, SUCCESS, "db.py", 30],
            ["add", self.FLAG_MATCH_CASE, FAILURE, None, 0],
            ["add", self.FLAG_PARTIAL_CASE, SUCCESS, "static/js/lib/bootstrap.min.js", 6],
            ["addnewframe", self.FLAG_MATCH_CASE, FAILURE, None, 0],
            ["addnewframe", self.FLAG_MATCH_IGNORE, SUCCESS, "static/js/navigationFrame.js", 162],
            ["addnew", self.FLAG_MATCH_IGNORE, FAILURE, None, 0],
            ["addnew", self.FLAG_PARTIAL_IGNORE, SUCCESS, "static/js/navigationFrame.js", 162]
        ]
        for term, flag, exp_status, filename, line in testing_data:
            status = self.tags.find(entry, term, flag)
            self.assertEqual(status, exp_status)
            if exp_status == SUCCESS:
                self.assertEqual(entry['file'], filename)
                self.assertEqual(entry['lineNumber'], line)

    def test_findNext(self):
        entry = pytags.TagEntry()
        SUCCESS = pytags.SUCCESS
        FAILURE = pytags.FAILURE

        testing_data = [
            # [term, flag, status for findNext, filename, line, number of success calls]
            ["add_note", self.FLAG_MATCH_CASE, FAILURE, None, 0, 0],
            ["add", self.FLAG_MATCH_CASE, FAILURE, None, 0, 0],
            ["add", self.FLAG_PARTIAL_CASE, SUCCESS, "static/js/navigationFrame.js", 162, 2],
        ]
        for term, flag, exp_status, filename, line, repeat in testing_data:
            status = self.tags.find(entry, term, flag)
            status = self.tags.findNext(entry)
            # findNext must return expected result
            self.assertEqual(status, exp_status, "failed for [%s, %s]" % (term, flag))
            if exp_status == SUCCESS:
                self.assertEqual(entry['file'], filename)
                self.assertEqual(entry['lineNumber'], line)
                # and findNext must success for repeat-1 times more
                for _ in range(repeat-1):
                    status = self.tags.findNext(entry)
                    self.assertEqual(status, SUCCESS)
                # call findNext one more time, it should fail
                status = self.tags.findNext(entry)
                print(entry['name'])
                self.assertEqual(status, FAILURE)
