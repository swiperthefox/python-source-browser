"""
This is a pure python implemetation of python-ctags module, to avoid python-ctags'
dependence on python-dev, build tools, etc.

All the names in python-ctags module are kept, so this should be a drop in replacement
of the module.

Documents from python-ctags project:

# Available file information keys:
#  opened -  was the tag file successfully opened?
#  error_number - errno value when 'opened' is false
#  format - format of tag file (1 = original, 2 = extended)
#  sort - how is the tag file sorted?
#  author - name of author of generating program (may be empy string)
#  name - name of program (may be empy string)
#  url - URL of distribution (may be empy string)
#  version - program version (may be empty string)

# Available TagEntry keys:
#  name - name of tag
#  file - path of source file containing definition of tag
#  pattern - pattern for locating source line (None if no pattern)
#  lineNumber - line number in source file of tag definition (may be zero if not known)
#  kind - kind of tag (none if not known)
#  fileScope - is tag of file-limited scope?

# Note: other keys will be assumed as an extension key and will
# return None if no such key is found
"""

from bisect import bisect_left
from collections import defaultdict

# sortType
TAG_UNSORTED = 0
TAG_SORTED = 1
TAG_FOLDSORTED = 2

# Options for tagsFind()
TAG_FULLMATCH = 0x0
TAG_PARTIALMATCH = 0x1
TAG_OBSERVECASE = 0x0
TAG_IGNORECASE = 0x2

# tagResult
FAILURE = 0
SUCCESS = 1


class CTags(object):
    """
    Object that hold the meta data and entry lists.
    """
    def __init__(self, tagFile):
        self.header = {}
        try:
            header, entry_list = self._parse_file(tagFile)
        except IOError as err:
            self.header['opened'] = False
            self.header['error_number'] = err.errno
            raise err
        self.header.update(header)
        sort_type = header['sort']

        self.indexes = {TAG_UNSORTED: entry_list}
        self.indexes[sort_type] = entry_list

        self.header['opened'] = True

        # result of last search [key, option, full_match, last_index, status]
        self.last_search = None

    allowed_keys = {
        "opened": False,
        "error_number": 0,  # 0 for success
        "format": 1,
        "sort": TAG_UNSORTED,
        "author": "",
        "name": "",
        "url": "",
        "version": ""
    }

    def __getitem__(self, key):
        if key in self.allowed_keys:
            return self.header.get(key, self.allowed_keys[key])
        return None

    def _parse_file(self, tagFile):
        def parse_header_line(line):
            """Parse given header line.
            Here is an example of header line:
            !_TAG_FILE_SORTED	1	/0=unsorted, 1=sorted, 2=foldcase/
            """
            items = line.split('\t')
            key = items[0].split('_')[-1].lower()
            value = items[1]
            if key == "format":
                value = int(value)
            elif key == "sorted":
                value = int(value)
                key = "sort"
            return key, value

        def parse_entry(line, header):
            """Parse an entry line, header contains the parsed header.
            Here is an example entry line:
            varName\tfileName\t13;"\tv\tclass:Sample
            """
            items = line.strip().split('\t')
            symbol, fname, location = items[:3]
            options = items[3:]
            if header['format'] == 2:  # format 2 adds ;" to the location
                location = location[:-2]
            if header['sort'] == TAG_FOLDSORTED:
                search_key = symbol.lower()
            else:
                search_key = symbol

            opt_dir = {}
            kind = None
            for opt in options:
                if len(opt) == 1:  # kind
                    kind = opt
                elif opt == "file":
                    opt_dir['file'] = True
                else:
                    key, value = opt.split(':')
                    opt_dir[key] = value
            return [search_key, [symbol, fname, int(location), kind, opt_dir]]

        # default header values
        header = {'format': 1,
                  'sort': TAG_UNSORTED}
        entry_list = []
        with open(tagFile, 'r') as tagfile:
            for line in tagfile:
                if line[0] == '!':  # header
                    h_key, h_value = parse_header_line(line)
                    header[h_key] = h_value
                else:
                    entry = parse_entry(line, header)
                    entry_list.append(entry)
        return header, entry_list

    def setSortType(self, sort_type):
        """Set sort type."""
        self.header['sort'] = sort_type

    def _get_index(self, sort_type):
        """Get a copy of entry list, sorted according to the sort_type"""
        if sort_type in self.indexes:
            return self.indexes[sort_type]
        unsorted = self.indexes[TAG_UNSORTED]
        if sort_type == TAG_SORTED:
            entry_index = [[entry[0], entry] for _, entry in unsorted]
        elif sort_type == TAG_FOLDSORTED:
            entry_index = [[entry[0].lower(), entry] for _, entry in unsorted]
        entry_index.sort()
        self.indexes[sort_type] = entry_index
        return entry_index

    def _get_current_index(self):
        """Get the entry_list matches current sort_type"""
        return self._get_index(self.header['sort'])

    def first(self, entry):
        """Get the first entry according to current sort_type"""
        current_index = self._get_current_index()
        if len(current_index) > 0:
            _, first_entry = current_index[0]
            entry.copy(first_entry)
            return SUCCESS
        else:
            return FAILURE

    def _find(self, term, index, start, full_match, entry):
        # do binary search
        idx = bisect_left(index, [term], start)
        # interpreter search result
        if idx == len(index):
            status = FAILURE
        else:
            found = index[idx]

            is_match = ((term == found[0]) or  # full match
                        (found[0].startswith(term) and not full_match))  # partial
            if is_match:
                status = SUCCESS
                entry.copy(found[1])
            else:
                status = FAILURE
        return status, idx

    def find(self, entry, symbol, option = 0):
        """Find the entry that matches to symbol."""
        # parse option
        sort_type = TAG_SORTED if option < 2 else TAG_FOLDSORTED
        full_match = option % 2 == 0
        # prepare search
        search_key = symbol if sort_type == TAG_SORTED else symbol.lower()
        entry_index = self._get_index(sort_type)
        # do search
        status, location = self._find(search_key, entry_index, 0, full_match, entry)
        # save search terms, to be used in findNext
        self.last_search = [search_key, entry_index, full_match, location, status]

        return status

    def findNext(self, entry):
        """Find the next match, using the same search condition as previous search"""
        if self.last_search is None:
            return FAILURE

        key, index, full_match, position,  status = self.last_search
        if status == FAILURE:
            return FAILURE
        else:
            status, position = self._find(key, index, position+1, full_match, entry)
            self.last_search = [key, index, full_match, position, status]
            return status

    def next(self, entry):
        if self.last_search is None:
            return self.first(entry)
        else:
            _, index, _, position, _ = self.last_search
            position += 1
            if position < len(index):
                status = SUCCESS
                entry.copy(index[position][1])
            else:
                status = FAILURE
            return status


class TagEntry(defaultdict):
    def copy(self, entry):
        symbol, fname, line, kind, options = entry
        self['name'] = symbol
        self['file'] = fname
        self['lineNumber'] = line
        self['kind'] = kind
        self.update(options)
