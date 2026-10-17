"""Run the shared durable-library HTTP cases against actual protected Windows state."""
import os
import unittest
import test_library

@unittest.skipUnless(os.name == 'nt', 'Requires actual Windows private state')
class WindowsLibraryTests(test_library.LibraryTests):
    def make_state(self,path):
        from atlas_companion.windows_state import WindowsState
        from atlas_companion.windows_filesystem import Provider
        self.provider_factory=Provider
        return WindowsState(path)
