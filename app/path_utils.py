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

def list_dir(dir_path, excludes = []):
    """
    List the directories and files in dir_path in the following format:
    { 'name': 'grandparent',
      'children': [
         {'name': 'uncle #1',
          'children': [
             {'name': 'cousin #1-1',
              'link': 'to #1-1'},
             {'name': 'cousin #1-2',
              'link': 'to #1-2'}]},
         {'name': 'father',
          'children': [
             {'name': 'me',
              'link': 'to me'}]},
         {'name': 'uncle #2',
          'link': 'link uncle #2'},
         ]}
    """
    root = {'name': 'root',
            'children': []}
    index = {dir_path: root}
    l = len(dir_path)
    excludes = set(excludes)

    for dirpath, dirnames, filenames in os.walk(dir_path):
        current_table = index[dirpath]

        for dname in dirnames[:]:
            if dname in excludes:
                dirnames.remove(dname)
                continue
            # make a node for dname
            new_table = {'name': dname,
                         'children': []}
            current_table['children'].append(new_table)
            index[os.path.join(dirpath, dname)] = new_table

        filenodes = ({'name': fname, 'link': os.path.join(dirpath, fname)}
                     for fname in filenames)
        current_table['children'].extend(filenodes)
    return root


