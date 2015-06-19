from unittest import TestCase, expectedFailure
import os
import sqlite3
import tempfile

from app.db import PSBDatabase

class PSBDatabaseInitTestCase(TestCase):
    def test_initialization(self):
        db_fd, db_file = tempfile.mkstemp(prefix="psb")
        psb_db = PSBDatabase(db_file)
        self.assertRaises(sqlite3.OperationalError, psb_db.get_notes)
        print "removing file"
        os.close(db_fd)
        psb_db.close()
        os.remove(db_file)

class PSBDatabaseTestCase(TestCase):
    def setUp(self):
        self.db_fd, self.db_file = tempfile.mkstemp(prefix="psb")
        PSBDatabase.initialize_db(self.db_file, open("app/schema.sql").read())
        self.psb_db = PSBDatabase(self.db_file)

    def test_initialization(self):
        self.assertEqual(self.psb_db.get_notes(), [])

    def test_ops_on_note(self):
        notes = self.psb_db.get_notes()
        self.assertEqual(len(notes), 0)
        self.psb_db.add_note(("f1.py#L-1", "TestClass", "note"))
        self.psb_db.add_note(("f2.py#L-1", "TestClass2", "note2"))
        notes = self.psb_db.get_notes()
        self.assertEqual(len(notes), 2)
        self.assertEqual({"note", "note2"}, {notes[0][2], notes[1][2]})
        self.psb_db.add_note(("f1.py#L-1", "TestClass", ""))
        notes = self.psb_db.get_notes()
        self.assertEqual(len(notes), 1)
        self.assertEqual("TestClass2", notes[0][1])

    def test_op_on_codes(self):
        p, h = "/path/to.py", "<html code>"
        self.assertEqual(self.psb_db.get_html(p), None)
        self.psb_db.save_html(p, h)
        self.assertEqual(self.psb_db.get_html(p), h)

    def tearDown(self):
        os.close(self.db_fd)
        self.psb_db.close()
        os.remove(self.db_file)
