import os
import shutil

class Ctags_Error(Exception):
    pass

def make_tags(project_root, tagsfile):
    # we want all file paths in tags file is relative to the root
    # the only way to do it is to create tags file in the root directory
    # and use --tag-relative option. After the tags file is created, we can
    # move it to psb_cache directory.
    tmp_tags = os.path.join(project_root, "i.m.p.o.s.s.i.bletoclash")
    cmd = 'ctags -Rn --exclude=%s ' % tmp_tags
    cmd += '-f %s --tag-relative=yes %s/' % (tmp_tags, project_root)
    exit_code = os.system(cmd)

    if exit_code:
        raise Ctags_Error("Failed to generate tags file using ctags. Please make sure that"
                          " ctags is installed.")
    else:
        shutil.move(tmp_tags, tagsfile)
