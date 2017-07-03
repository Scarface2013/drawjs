var socket = io();
var isMouseDown = false;
var data = {};
var color = "#00ff00";
var size = 3;
$(document).ready(function () {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    socket.emit('getCanvas', "Load");
    function drawData(e) {
        ctx.beginPath();
        ctx.fillStyle = e.c;
        ctx.fillRect(e.x - e.s / 2, e.y - e.s / 2, e.s, e.s);
        ctx.closePath();
    }
    function sendData() {
        socket.emit('draw', JSON.stringify(data));
        data = {};
    }
    $('#color').change(function () {
        var regex = /^[A-Fa-f0-9]+$/;
        var val = $('#color').val();
        if (regex.exec(val) == null) {
            color = "#ffffff";
            $('#color').css({ 'background-color': '#aa2222' });
        }
        else {
            color = "#" + val;
            $('#color').css({ 'background-color': color,
                'color': '#FFFFFF' });
        }
    });
    $('#size').change(function () {
        size = $('#size').val();
    });
    $('#download').click(function () {
        socket.emit("getCanvas", "Download");
    });
    canvas.addEventListener('mousedown', function () {
        isMouseDown = true;
    });
    canvas.addEventListener('mouseup', function () {
        isMouseDown = false;
    });
    canvas.addEventListener('mousemove', function (e) {
        if (isMouseDown) {
            var obj = { "x": e.offsetX,
                "y": e.offsetY,
                "c": color,
                "s": size
            };
            data[Date.now()] = obj;
            drawData(obj);
            sendData();
        }
    });
    socket.on('receive', function (json) {
        var data = JSON.parse(json);
        for (var key in data) {
            drawData(data[key]);
        }
    });
    socket.on('setCanvas', function (data) {
        console.log("setting canvas");
        $('#canvas').css({ "background-image": "url(" + data + ")" });
    });
    socket.on('downloadCanvas', function (data) {
        // Algoritm obtained from http://stackoverflow.com/questions/3906142/how-to-save-a-png-from-javascript-variable
        var download = document.createElement('a');
        download.href = data;
        download.download = "download.png";
        download.click();
    });
});
