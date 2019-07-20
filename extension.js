'use strict'
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;
// const MainLoop = imports.mainLoop;

// const Extension = imports.misc.extensionUtils.getCurrentExtension();
// const MyModule = Extension.imports.myModule;

let text, button;

const BUF_SIZE = 50;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showHello() {
    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
        monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

    Tweener.addTween(text,
        {
            opacity: 0,
            time: 2,
            transition: 'easeOutQuad',
            onComplete: _hideHello
        });
}



function onNewConnection(socketService, connection, source) {
    log('new connection!')

    const buf = connection.get_input_stream().read_bytes(1024, null);
    log(buf.get_data());
}

function createTcpConnection() {
    const socketService = new Gio.SocketService();

    const inetAddress = Gio.InetSocketAddress.new_from_string('127.0.0.1', 3050)
    socketService.add_inet_port(3050, null);
    socketService.connect('incoming', onNewConnection);

    const mainloop = GLib.MainLoop.new(null, true);
    const context = mainloop.get_context();
    log(`Service created!`)
    mainloop.run();
}

function init() {
    button = new St.Bin({
        style_class: 'panel-button',
        reactive: true,
        can_focus: true,
        x_fill: true,
        y_fill: false,
        track_hover: true
    });
    let icon = new St.Icon({
        icon_name: 'system-run-symbolic',
        style_class: 'lightwait-status-icon'
    });

    icon.color = '#ff0000';

    button.set_child(icon);
    button.connect('button-press-event', _showHello);
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}

createTcpConnection();
