import unittest
from atlas_companion.windows_entrypoint import launch_arguments

class WindowsEntrySelectionTests(unittest.TestCase):
    def test_debug_double_click_opens_original_controls(self):
        self.assertEqual(launch_arguments([], 'debug.exe'), ['--desktop','--advanced'])
        self.assertEqual(launch_arguments([], 'DEBUG.EXE'), ['--desktop','--advanced'])
    def test_normal_and_explicit_commands_are_preserved(self):
        self.assertEqual(launch_arguments([], 'atlas-companion.exe'), [])
        for args in (['serve'], ['--native','config','origin'], ['--recover'], ['--desktop']):
            self.assertEqual(launch_arguments(args, 'debug.exe'), args)
