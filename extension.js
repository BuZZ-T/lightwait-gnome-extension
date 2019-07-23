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

function validateColors(colors) {
    return colors.every(color => color.every(c => !isNaN(c) && c >= 0 && c <=255))
}

function parseColors(message) {
    const isBlink = message.toString().startsWith('b');

    const colors = message.match(/\d+:\d+:\d+/g)
    if (!colors) {
        log('not found');
        return
    }

    const intColors = colors.map(color => {
        const matcher = color.match(/(\d+):(\d+):(\d+)/);
        return matcher
            ? matcher.slice(1).map(c => parseInt(c, 10))
            : null;
    }).filter(color => !!color);

    const allValid = validateColors(intColors);

    return allValid
        ? [isBlink, intColors]
        : [isBlink, null]
}

function onNewConnection(socketService, connection, source) {
    const buf = connection.get_input_stream().read_bytes(1024, null);
    const input = buf.get_data();
    const [blink, colors] = parseColors(input.toString());
    if (!colors) {
        log('[lightwait] not all valid!');
        return
    }

    log(`blink: ${blink}, colors: ${colors}`);
}

function createTcpConnection() {
    const socketService = new Gio.SocketService();

    socketService.add_inet_port(3050, null);
    socketService.connect('incoming', onNewConnection);

    run();
}

function createUdpSocket() {
    const socket = new Gio.Socket({
        family: Gio.SocketFamily.IPV4,
        type: Gio.SocketType.DATAGRAM,
        protocol: Gio.SocketProtocol.UDP,
    })

    const address = new Gio.InetSocketAddress({
        address: Gio.InetAddress.new_from_string('127.0.0.1'),
        port: 3050,
    })

    socket.init(null);
    socket.bind(address, null);

    let buf = new ByteArray.ByteArray(256);

    // blocking
    let size = socket.receive(buf, null);

    buf[size] = 0;

    log(buf.toString());
}

function createUdpDescriptor() {
    const socket = new Gio.Socket({
        family: Gio.SocketFamily.IPV4,
        type: Gio.SocketType.DATAGRAM,
        protocol: Gio.SocketProtocol.UDP,
    })

    const address = new Gio.InetSocketAddress({
        address: Gio.InetAddress.new_from_string('127.0.0.1'),
        port: 3050,
    })

    socket.init(null);
    socket.bind(address, null);

    const fd = socket.get_fd();
    const channel = GLib.IOChannel.unix_new(fd);
    const source = GLib.io_add_watch(channel, 0, GLib.IOCondition.IN, function(gSource, condition) {
        let buf = new ByteArray.ByteArray(256);// Array(256);
        for(let i = 0; i < 256; i++) {
            buf[i] = 1;
        }

        log(`before: ${buf[0]}, ${buf[1]}, ${buf[2]}`);

        const bufSize = socket.receive(buf, null);

        buf.length = bufSize;

        log(`after: ${buf[0]}, ${buf[1]}, ${buf[2]}`);

        log(`buf: ${buf}/${buf.toString()}, size: ${bufSize}`);
    });

    run();
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

function run() {
    const mainloop = GLib.MainLoop.new(null, true);
    log(`Started!`)
    mainloop.run();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}

createTcpConnection();
// createUdpSocket();
// createUdpDescriptor();
