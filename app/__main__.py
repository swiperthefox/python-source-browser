from __future__ import (
    absolute_import,
    print_function,
    unicode_literals
)
import os
import errno
import logging
import argparse

from flask import Flask, request, jsonify, g, current_app, send_from_directory

from app.htmlizer import SourceConverter
from app.db import PSBDatabase
from app.path_utils import list_dir
from app.search import search

DATABASE = 'to be configured'
DEBUG = True
SECRET_KEY = 'we do not need it'
USERNAME = 'no'
PASSWORD = 'no'
PROJECTROOT = 'to be configured'
PSBDATADIR = os.path.expanduser("~/.psb")

app = Flask(__name__)

app.config.from_object(__name__)
source_conveter = None # will be set in config_app

def get_db():
    """Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = PSBDatabase(app.config['DATABASE'])
    return g.sqlite_db


@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()


def get_html(path):
    result = html_from_db(path)
    if len(result) == 0:
        # create html source, save it, and return it
        html_code = source_conveter.pygments(path)
        html_into_db(path, html_code)
        return html_code
    else:
        return result[0]

@app.route('/notes')
def get_notes():
    psb_db = get_db()
    result = psb_db.get_notes()
    return jsonify(data=result)

@app.route('/notes', methods = ['POST'])
def create_note():
    psb_db = get_db()
    data = request.get_json(force=True)
    psb_db.add_note([data[key] for key in ('location', 'symbol', 'note')])
    newNoteList = psb_db.get_notes()
    return jsonify(data=newNoteList)

@app.route('/file/', defaults={'path': ''})
@app.route('/file/<path:path>')
def get_source(path, use_cache=False):
    if path == '':
        return jsonify(list_dir(current_app.config['PROJECTROOT']))
    if use_cache:
        psb_db = get_db()
        result = psb_db.get_html(path)
        if result is None:
            result = source_conveter.pygmentize(path)
            psb_db.save_html(path, result)
    else:
        result = source_conveter.pygmentize(path)
    return result

@app.route('/')
def index():
    print ("index")
    return send_from_directory(os.path.dirname(__file__), 'index.html')

@app.route('/search')
def search_code():
    term = request.values['term']
    exact_word_search = request.values.get('exact', False)
    result = search(term, app.config['PROJECTROOT'], exact_word_search)
    return jsonify(data=result)

def config_app(project_root):
    """Configuration based on the proejct_root"""
    rel_project_root = os.path.relpath(project_root)
    datadir = app.config['PSBDATADIR']
    root_as_file_name = os.path.abspath(project_root).replace(os.path.sep, '_')
    dbfile = os.path.join(datadir, 'databases', root_as_file_name + '.sqlite')
    tagsfile = os.path.join(datadir, 'tags', root_as_file_name + '.tags')
    config = {
        'DATABASE': dbfile,
        'PROJECTROOT': os.path.abspath(project_root),
        'TAGSFILE': tagsfile
    }
    app.config.update(config)

    # create directories for data
    try:
        os.makedirs(os.path.join(datadir, 'databases'))
        os.mkdir(os.path.join(datadir, 'tags'))
    except OSError as err:
        if err.errno != errno.EEXIST:
            raise

    # initialize the database only on the first time
    if not os.path.isfile(app.config['DATABASE']):
        with app.open_resource('schema.sql', mode='r') as schema_fd:
            PSBDatabase.initialize_db(app.config['DATABASE'], schema_fd.read())
    global source_conveter
    source_conveter = SourceConverter(rel_project_root, app.config['TAGSFILE'])

def make_argparser():
    parser = argparse.ArgumentParser(description="Browse the source code in given directory.")
    parser.add_argument('-p', '--port', default=9999, type=int, help="The port to be used.")
    parser.add_argument("project_root", help="The root directory of the project")
    return parser

if __name__ == '__main__':
    import sys
    import webbrowser
    import threading

    args = make_argparser().parse_args()

    port = args.port
    url = "http://localhost:%d" % port

    project_root = args.project_root
    config_app(project_root)

    # wait for 1 second so that the server can start
    threading.Timer(1, lambda: webbrowser.open(url, autoraise=True)).start()

    app.run(port=port, debug=True)
