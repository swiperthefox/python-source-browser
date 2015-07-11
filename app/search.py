from __future__ import (
    absolute_import,
    print_function,
    unicode_literals
)
from app.htmlizer import htmlize_python_code
import subprocess
import os

def get_search_command():
    try:
        subprocess.check_output(["ack" "--version"])
        cmd = ['ack', '-r', '-C', '1', '--type python']
    except (OSError, subprocess.CalledProcessError):
        try:
            subprocess.check_output(["grep", "--version"])
            cmd = ['grep',  '-r', '-n', '-C', '1', '--include=*.py']
        except:
            return None
    return cmd

_search_command = get_search_command()

def search(term, root_dir, exact=False):
    """search term, return a list html formatted code segments"""
    cannot_do_search = _search_command is None
    if cannot_do_search:
        return []
    options = ['-w'] if exact else []
    p = subprocess.Popen(_search_command + options + [term, root_dir], stdout=subprocess.PIPE)
    output, unused_err = p.communicate()
    if p.returncode == 0:
        return format_output(output, root_dir)
    else:
        return []

def format_output(text, root_dir):
    segments = text.split('--\n')
    return [format_segment(segment.strip(), root_dir) for segment in segments]

def format_segment(segment, root_dir):
    filename, linenostart, hl_lines, codes = parse_grep_out(segment)
    filename = os.path.relpath(filename, root_dir)
    source_code = '\n'.join(codes)
    pygments_config = {'linenostart': linenostart,
                       'hl_lines': hl_lines,
                       'linespans': "search-result"}
    highlighted = htmlize_python_code(source_code, pygments_config)
    lineno = linenostart + hl_lines[0] - 1;

    return {'code': highlighted, 'location': filename, 'lineno': lineno}

def parse_grep_out(segment):
    """
    Parse the grep output segment, get the file name, starting line number
    and codes.
    """
    # The difficulty is that grep use different format for matching lines and context lines.
    # for example:
    #
    # /home/zhenlei/projects/pydocx/pydocx/export/html.py-231-        return self.make_element(
    # /home/zhenlei/projects/pydocx/pydocx/export/html.py:232:            tag='span',
    # /home/zhenlei/projects/pydocx/pydocx/export/html.py-233-            contents=text,
    #
    # '-' is sometimes used in file names, ':' may appear in codes,
    # '-[0-9]*-' may appear in codes, ':[0-9]*:' may work, but it's
    # hard to predict which line in segment contains it.

    # We will use ".py" as the indicator of end of file name, it
    # should be safe for any sanely named project.
    lines = segment.splitlines()
    first_line = lines[0]
    idx = first_line.index('.py')
    filename = first_line[:idx+3]
    first_sep = idx+3
    def next_sep(line):
        seperator = line[first_sep]
        return (seperator, line.index(seperator, first_sep+1))

    # segments will strip empty lines at the beginning and the end of the codes,
    # we should remove these empty lines too so that hitlines matches segments'
    # expection
    while True:
        line = lines[0]
        sep, sep_pos = next_sep(line)
        if line[sep_pos+1:].strip() == '':
            lines.pop(0)
        else:
            break
    first_line = lines[0]
    start_line_num = int(first_line[first_sep+1: next_sep(first_line)[1]])
    codes = []
    hitlines = []
    for i, line in enumerate(lines):
        sep, sep_pos = next_sep(line)
        if sep == ':':
            hitlines.append(i+1) # pygments hl_lines option is 1 based
        code = line[sep_pos+1:]
        codes.append(code)
    return (filename, start_line_num, hitlines, codes)
