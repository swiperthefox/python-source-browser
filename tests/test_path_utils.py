from unittest import TestCase

from app import path_utils

class PathUtilsTestCase(TestCase):
    def test_list_dir(self):
        result = path_utils.list_dir('tests/fixtures/sample-dir', ['psb_cache'])
        self.assertEqual(result['name'], 'root')
        self.assertEqual(len(result['children']), 5)
        children = result['children']
        children.sort(key=lambda item: item['name'])
        self.assertEqual(children[3]['name'], 'f1_1.py')
        self.assertEqual(children[3]['link'], 'tests/fixtures/sample-dir/f1_1.py')
        self.assertEqual(children[2]['name'], 'dir3')
        self.assertEqual(children[2]['children'], [])
