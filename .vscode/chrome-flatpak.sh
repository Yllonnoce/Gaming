#!/usr/bin/env bash
# VS Code's Chrome debugger expects a native executable, but Chrome on this
# machine is installed as a Flatpak. This forwards the debugger's arguments
# into the sandbox.
#
# The debug profile is passed by launch.json and must live under
# ~/.var/app/com.google.Chrome/ -- that is a directory the sandbox can always
# write to, whereas VS Code's default of /tmp is not visible inside it.
exec flatpak run com.google.Chrome "$@"
