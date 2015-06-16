import sqlite3
from contextlib import closing

class PSBDatabase:
    def __init__(self, dbfile):
        self.connection = sqlite3.connect(dbfile)

    @staticmethod
    def initialize_db(dbfile, schema):
        with closing(sqlite3.connect(dbfile)) as db:
            db.executescript(schema)
            db.commit()

    def close(self):
        self.connection.close()

    def query_all(self, *query):
        return self.connection.execute(*query).fetchall()

    def query_one(self, *query):
        return self.connection.execute(*query).fetchone()

    def make_change(self, *change):
        with self.connection:
            self.connection.execute(*change)
            self.connection.commit()
    def get_notes(self):
        return self.query_all("select location, symbol, note from notes")

    def add_note(self, note):
        self.make_change("insert into notes(location, symbol, note) values (?,?,?)", note)

    def save_html(self, path, html_code):
        self.make_change("insert into codes (path, htmlsource) values (?,?)", (path, html_code))

    def get_html(self, path):
        result = self.query_one("select htmlsource from codes where path = ?", (path,))
        return result[0] if result else None
