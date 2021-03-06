from unittest import TestCase, expectedFailure

from app.search import parse_grep_out

class ParseGrepOutputTestCase(TestCase):
    def test_parse(self):
        input = "/path/to/my/source.py-9-  def func():\n" +\
                "/path/to/my/source.py:10:    pass\n" +\
                "/path/to/my/source.py-11-"
        filename, linenostart, hitlines, code = parse_grep_out(input)
        self.assertEqual(filename, "/path/to/my/source.py")
        self.assertEqual(linenostart, 9)
        self.assertEqual(code, ["  def func():", "    pass", ""])
        self.assertEqual(hitlines, [2])

    def test_skipping_empty_lines(self):
        input = "/path/to/my/source.py-8-\n" +\
                "/path/to/my/source.py-9-  def func():\n" +\
                "/path/to/my/source.py:10:    pass\n" +\
                "/path/to/my/source.py-11-"
        filename, linenostart, hitlines, code = parse_grep_out(input)
        self.assertEqual(filename, "/path/to/my/source.py")
        self.assertEqual(linenostart, 9)
        self.assertEqual(code, ["  def func():", "    pass", ""])
        self.assertEqual(hitlines, [2])
