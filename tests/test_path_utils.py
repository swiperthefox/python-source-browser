from unittest import TestCase

from app import path_utils
from utils import getFixtureDir

class PathUtilsTestCase(TestCase):
    def test_list_dir(self):
        result = path_utils.list_dir(getFixtureDir(), ['psb_cache'])
        self.assertEqual(result['text'], 'root')
        self.assertEqual(len(result['children']), 5)
        children = result['children']
        children.sort(key=lambda item: item['text'])
        self.assertEqual(children[3]['text'], 'f1_1.py')
        self.assertEqual(children[3]['a_attr']['href'], '/file/f1_1.py')
        self.assertEqual(children[2]['text'], 'dir3')
        self.assertEqual(children[2]['children'], [])
