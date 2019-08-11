# lightwait-gnome-extension

This is a [gnome-extension](https://wiki.gnome.org/Projects/GnomeShell/Extensions) as a simple [presenter](https://github.com/BuZZ-T/lightwait#presenter) in the [lightwait-stack](https://github.com/BuZZ-T/lightwait).

## Features
* Listens to updates on TCP port 3030 on localhost
* Supports the [lightwait-tp](https://github.com/BuZZ-T/lightwait#lightwait-tp) communication protocol.
* Is written in ~260 lines of code gjs compatible JavaScript

## Usage

* Place the  three important files `extension.js`, `metadata.json` and `stylesheet.css` in a folder named "lightwait@buzz-t.eu" and place the folder either to the global gnome-extension folder `/usr/share/gnome-shell/extensions` or the user-specific gnome-extension folder `~/.local/share/gnome-shell/extensions`.
* Alternatively, link a folder to one of the gnome-extension folders, e.g. `ln -s ~/workspace/lightwait/lightwait-gnome-extension.git ~/.local/share/gnome-shell/extensions/lightwait@buzz-t.eu`.
* Reload gnome-shell (e.g. by pressing [alt]+[f2], entering "r" in the field and pressing enter)
* Enable the extension
    * by using "gnome-tweaks" in the section "extensions". (You might need to install the package "gnome-tweak-tool", e.g. with `sudo apt install gnome-tweak-tool`
    * by execution `gnome-shell-extension-tool -e lightwait@buzz-t.eu` in a terminal
    
Currently these transmitters are able to communicate via TCP:

* [lightwait-python-tcp-udp](https://github.com/lightwait/lightwait-python-tcp-udp )

For testing purposes, you can also use this command when using bash:
```bash
echo -n "0:255:0" > /dev/tcp/localhost/3030 
echo -n "b255:255:0" > /dev/tcp/localhost/3030
echo -n "b255:255:0|255:0:0" > /dev/tcp/localhost/3030
```
Or use netcat:
```bash
echo -n "255:0:0" | nc localhost 3030
```

## Tested on

| OS | Version | GNOME Shell | gjs | Result | Reason
|-|-|-|-|-|-
| Ubuntu | 18.04 | 3.28.4 | 1.52.5 | (✔) | Only TCP, UDP has issues, see [TODOs](#todos)


<a name="todos"></a>
## TODOs
* Adding UDP support (as it's a more lightweight communication and fits more to the requirements). The code exists, but it's malfunctioning.
    Unfortunately, the gjs gobject binding has an error for the used version.
    Although `size` is correctly set, `buf` is unchanged, so passing a buffer seems not to work for gjs:
```JavaScript
    let buf = new ByteArray.ByteArray(256);

    // blocking
    let size = socket.receive(buf, null);

    buf[size] = 0;

    log(buf.toString());
```
