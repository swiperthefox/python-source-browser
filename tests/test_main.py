from unittest import TestCase
import os
import tempfile
import json

from utils import HTMLTestMixin, getFixtureDir
from app import __main__ as main

class PSBServerTestCase(TestCase, HTMLTestMixin):

    def setUp(self):
        project_root = getFixtureDir()
        import logging; logging.info(project_root)
        main.config_app(project_root)
        main.app.config['TESTING'] = True
        self.app = main.app.test_client()

    def test_setup(self):
        self.assertEqual(1, 1)

    def tearDown(self):
        os.remove(main.app.config['DATABASE'])

    def test_no_notes(self):
        result = self.app.get('/notes')
        self.assertEqual(json.loads(result.data), {'data': []})

    def test_create_notes(self):
        result = self.app.post('/notes', data = json.dumps({
            "location":"file1.py#L-2",
            "symbol":"A",
            "note":"a note"}), content_type="application/json")
        expected = {'data': [["file1.py#L-2", "A", "a note"]]}
        self.assertEqual(expected, json.loads(result.data))

    def test_get_notes(self):
        datas = map(json.dumps,  [{
            "location":"file%d.py#L-2" % i,
            "symbol":"A%d" % i,
            "note":"a note %d" %i} for i in range(10)])
        for data in datas:
            self.app.post('/notes', data = data, content_type="application/json")
        result = self.app.get('/notes')
        result_data = json.loads(result.data)
        self.assertEqual(len(result_data['data']), 10)

    def test_get_non_python_file(self):
        result = self.app.get('/file/dir1/file1')
        self.assertEqual("plain text file is not syntax highlighted.", result.data.strip())

        multi_line_result = self.app.get('/file/dir1/multi_line')
        self.assertEqual("first line\n<br>second line", multi_line_result.data.strip())

    def test_get_python_file(self):
        result = self.app.get('/file/f1_2.py')
        html_code = result.data
        self.check_link_for_symbol(html_code,
                                   [("Test", "/file/dir2/f2_1.py#L-1"),
                                    ("a", "/file/f1_1.py#L-1")])

    def test_get_directory(self):
        result = self.app.get('/file/')
        print result.data
        dir_struct = json.loads(result.data)
        self.assertEqual(dir_struct['text'], 'root')
        self.assertEqual(len(dir_struct['children']), 5)
