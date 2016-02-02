from __future__ import (
    absolute_import,
    print_function,
    unicode_literals,
)

import os
from contextlib import contextmanager

@contextmanager
def current_dir(dirpath):
    old_dir = os.getcwd()
    os.chdir(dirpath)
    yield
    os.chdir(old_dir)

def make_sure_dir(dir_path):
    """Make sure path exists, otherwise create the directory"""
    if not os.path.isdir(dir_path):
        os.makedirs(dir_path)

def list_dir(dir_path, excluded_dirs=["psb"], ignored_exts=['.pyc']):
    """
    List the directories and files in dir_path in the following format:
    { 'text': 'grandparent',
      'children': [
         {'text': 'uncle #1',
          'children': [
             {'text': 'cousin #1-1',
              'link': 'to #1-1'},
             {'text': 'cousin #1-2',
              'link': 'to #1-2'}]},
         {'text': 'father',
          'children': [
             {'text': 'me',
              'link': 'to me'}]},
         {'text': 'uncle #2',
          'link': 'link uncle #2'},
         ]}
    """
    root = {'text': 'root',
            'id': 'root',
            'children': []}
    l = len(dir_path)
    index = {dir_path: root}
    excludes = set(excluded_dirs)
    ignored_exts = set(ignored_exts)

    for dirpath, dirnames, filenames in os.walk(dir_path):
        current_table = index[dirpath]

        for dname in dirnames[:]:
            if dname in excludes:
                dirnames.remove(dname)
                continue
            # make a node for dname
            new_table = {'text': dname,
                         'children': [],
                         'type': 'directory',
                         'state': {
                             'opened': False
                         }}
            current_table['children'].append(new_table)
            index[os.path.join(dirpath, dname)] = new_table

        for fname in filenames:
            _, ext = os.path.splitext(fname)
            if ext in ignored_exts:
                continue
            new_node = {'text': fname,
                        'a_attr': {"href" : os.path.join("/file", dirpath[l+1:], fname)},
                        'type': 'file'}
            current_table['children'].append(new_node)
    return root
