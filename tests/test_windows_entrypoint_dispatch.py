import unittest
from atlas_companion.windows_entrypoint import launch_arguments, native_arguments

class WindowsEntrySelectionTests(unittest.TestCase):
    def test_debug_double_click_opens_original_controls(self):
        self.assertEqual(launch_arguments([], 'debug.exe'), ['--desktop','--advanced'])
        self.assertEqual(launch_arguments([], 'DEBUG.EXE'), ['--desktop','--advanced'])
    def test_normal_and_explicit_commands_are_preserved(self):
        self.assertEqual(launch_arguments([], 'atlas-companion.exe'), [])
        for args in (['serve'], ['--native','config','origin'], ['--recover'], ['--desktop']):
            self.assertEqual(launch_arguments(args, 'debug.exe'), args)

    def test_versioned_and_legacy_native_images_accept_only_fixed_chrome_arguments(self):
        origin='chrome-extension://'+'a'*32+'/'
        for name in ['atlas-native.exe','atlas-native-'+'a'*20+'.exe']:
            self.assertEqual(native_arguments([origin],name),['--native','native.json',origin])
            self.assertEqual(native_arguments([origin,'--parent-window=123'],name)[0],'--native')
            with self.assertRaises(ValueError): native_arguments([origin,'--desktop'],name)
        self.assertEqual(native_arguments([origin],'atlas-companion.exe'),[origin])
