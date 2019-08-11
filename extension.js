'use strict'
const St = imports.gi.St;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;
const MainLoop = imports.mainloop;

// const Extension = imports.misc.extensionUtils.getCurrentExtension();
// const MyModule = Extension.imports.myModule;

let socketService;
let drawingArea;
let currentColor = '#ff0';
let intervalId = null;
const offColor = '#000';

// color circle parameters
const DRAWING_AREA_SIZE = 30;
const X_CENTER = 15;
const Y_CENTER = 14;
const RADIUS = 10;
const ANGLE_START = 0;
const ANGLE_END = 2 * Math.PI

function validateColors(colors) {
    return colors.every(color => color.every(c => !isNaN(c) && c >= 0 && c <= 255))
}

function parseColors(message) {
    const isBlink = message.toString().startsWith('b');

    const colors = message.match(/\d+:\d+:\d+/g)
    if (!colors) {
        return
    }

    const intColors = colors.map(color => {
        const matcher = color.match(/(\d+):(\d+):(\d+)/);
        return matcher
            ? matcher.slice(1).map(c => parseInt(c, 10))
            : null;
    }).filter(color => !!color);

    const allValid = validateColors(intColors);

    if (!allValid) {
        return [isBlink, null]
    }

    const hexColors = intColors.map(colors => colors.reduce((acc, color) => {
        acc += color < 10 ? '0' : '';
        acc += color.toString(16);
        return acc;
    }, '#'))

    return [isBlink, hexColors]
}

/**
 * Creates a TCP Connection. Currently the only implemented way to listen to color updates.
 * Works as a stream-based connection like TCP offers an input stream to get the data.
 */
function createTcpConnection() {
    socketService = new Gio.SocketService();

    try {
        socketService.add_inet_port(3030, null);
        socketService.connect('incoming', function (socketService, connection, source) {
            const buf = connection.get_input_stream().read_bytes(1024, null);
            const input = buf.get_data();
            const [blink, colors] = parseColors(input.toString());
            if (!colors) {
                log('[lightwait] not all valid!');
                return
            }

            updateColors(blink, colors);
        });
        log('[lightwait] TCP connection established!');
    } catch (e) {
        logError(e, '[lightwait] Error creating TCP connection!');
    }
}

/**
 * Creates a UDP socket.
 * Does not work as the buffer is always unchanged when doing "socket.receive(buf, null)"
 */
function createUdpSocket() {
    const socket = new Gio.Socket({
        family: Gio.SocketFamily.IPV4,
        type: Gio.SocketType.DATAGRAM,
        protocol: Gio.SocketProtocol.UDP,
    })

    const address = new Gio.InetSocketAddress({
        address: Gio.InetAddress.new_from_string('127.0.0.1'),
        port: 3030,
    })

    socket.init(null);
    socket.bind(address, null);

    let buf = new ByteArray.ByteArray(256);

    // blocking
    let size = socket.receive(buf, null);

    buf[size] = 0;

    log(buf.toString());
}

/**
 * Creates a UDP connection by socket to file descriptor to channel to source
 * Does not work as the buffer is always unchanged when doing "socket.receive(buf, null)"
 */
function createUdpDescriptor() {
    const socket = new Gio.Socket({
        family: Gio.SocketFamily.IPV4,
        type: Gio.SocketType.DATAGRAM,
        protocol: Gio.SocketProtocol.UDP,
    })

    const address = new Gio.InetSocketAddress({
        address: Gio.InetAddress.new_from_string('127.0.0.1'),
        port: 3030,
    })

    socket.init(null);
    socket.bind(address, null);

    const fd = socket.get_fd();
    const channel = GLib.IOChannel.unix_new(fd);
    const source = GLib.io_add_watch(channel, 0, GLib.IOCondition.IN, function (gSource, condition) {
        let buf = new ByteArray.ByteArray(256);// Array(256);
        for (let i = 0; i < 256; i++) {
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

/**
 * The format of str can be either one of:
 * 
 * - a standard name (as taken from the X11 rgb.txt file) 
 * - an hexadecimal value in the form: `#rgb`, `#rrggbb`, `#rgba`, or `#rrggbbaa`
 * - a RGB color in the form: `rgb(r, g, b)`
 * - a RGB color in the form: `rgba(r, g, b, a)`
 * - a HSL color in the form: `hsl(h, s, l)`
 * - a HSL color in the form: `hsla(h, s, l, a)`
 * (taken from: https://valadoc.org/clutter-1.0/Clutter.Color.Color.from_string.html)
 * @param {*} color 
 */
function color_from_string(color) {
    let clutterColor, res;

    if (!Clutter.Color.from_string) {
        clutterColor = new Clutter.Color();
        clutterColor.from_string(color);
    } else {
        [res, clutterColor] = Clutter.Color.from_string(color);
    }

    return clutterColor;
}

function init() {
    drawingArea = new St.DrawingArea({
        height: DRAWING_AREA_SIZE,
        width: DRAWING_AREA_SIZE,
    });

    drawingArea.connect('repaint', function () {
        const cr = drawingArea.get_context();

        Clutter.cairo_set_source_color(cr, color_from_string(currentColor));
        cr.arc(X_CENTER, Y_CENTER, RADIUS, ANGLE_START, ANGLE_END);
        cr.fill();
    });

    drawingArea.queue_repaint();
}

/**
 * Updates the color of the bar icon.
 * Accepts single-color, single-color blinking and multi-color blinking modes.
 * @param {boolean} blink 
 * @param {number[][]} colors 
 */
function updateColors(blink, colors) {
    let index = 0;

    if (intervalId) {
        MainLoop.source_remove(intervalId);
        intervalId = null;
    }
    if (blink || colors.length > 1) {

        if (colors.length === 1) {
            // blink with black, if only one color in blink mode given
            colors.push(offColor);
        }

        intervalId = MainLoop.timeout_add(500, () => {
            currentColor = colors[index];
            index = (index + 1) % colors.length;
            drawingArea.queue_repaint();

            return true;
        }, null);
    } else {
        currentColor = colors[0];
        drawingArea.queue_repaint();
    }
}

/**
 * Only needed for testing purposes when using this file with pure gjs
 */
function run() {
    const mainloop = GLib.MainLoop.new(null, true);
    log(`Started!`)
    mainloop.run();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(drawingArea, 0);
    createTcpConnection();
    // createUdpSocket();
    // createUdpDescriptor();
}

function disable() {
    Main.panel._rightBox.remove_child(drawingArea);
    try {
        socketService.stop();
        socketService.close();
        log('[lightwait] TCP connection closed!');
    } catch(e) {
        logError(e, '[lightwait] Error closing TCP connection!');
    }
}
