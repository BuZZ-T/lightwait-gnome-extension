# lightwait-gnome-extension

This is a gnome-extension as a simple [presenter](https://github.com/BuZZ-T/lightwait#presenter) in the [lightwait-stack](https://github.com/BuZZ-T/lightwait).

## Features
* Listens to updates on TCP port 3050 on localhost
* Supports the [lightwait-tp]([presenter](https://github.com/BuZZ-T/lightwait#lightwait-tp) communication protocol.
* Is written in ~260 lines of code gjs compatible JavaScript

## Usage

* Place the  three important files `extension.js`, `metadata.json` and `stylesheet.css` in a folder named "lightwait@buzz-t.eu" and place the folder either to the global gnome-extension folder `/usr/share/gnome-shell/extensions` or the user-specific gnome-extension folder `~/.local/share/gnome-shell/extensions`.
* Reload gnome-shell (e.g. by pressing [alt]+[f2], entering "r" in the field and pressing enter)
* Enable the extension
    * by using "gnome-tweaks" in the section "extensions". (You might need to install the package "gnome-tweak-tool", e.g. with `sudo apt install gnome-tweak-tool`
    * by execution `gnome-shell-extension-tool -e lightwait@buzz-t.eu` in a terminal
    
Currently these transmitters are able to communicate via TCP:

* (none existing yet)

For testing purposes, you can also use this command when using bash:
```bash
echo -n "0:255:0" > /dev/tcp/localhost/3050 
echo -n "b255:255:0" > /dev/tcp/localhost/3050
echo -n "b255:255:0|255:0:0" > /dev/tcp/localhost/3050
```
Or use netcat:
```bash
echo -n "255:0:0" | nc localhost 3050
```