var veicle = null;
var signaturePad = null;
var canvas = document.querySelector("canvas");

function inputToHash(obj) {
    var hash = {};
    $(obj).each(function (item, value) {
        hash[$(value).data("campo")] = $(value).val();
    });
    return hash;
}

function checkIfCookieIsExpired() {
    var timeStamp = $.cookie('expiration_session');

    var date = new Date(timeStamp * 1000);
    var today = new Date();

    if (date.getTime() < today.getTime()) {
        alert('Sua sessão expirou!');
        $.removeCookie('expiration_session', { path: '/' });
        window.location.href = 'login.html';
        return;
    }
    setTimeout(checkIfCookieIsExpired, 1000);
}

function lpad(value, length) {
    return ('0'.repeat(length) + value).slice(-length);
}

function insertNewRecord(area, records, success, error) {
    var json = [];
    json[0] = {
        area: area,
        data: records
    };

    json = JSON.stringify(json);
    console.log(json);

    ShowOverlay();
    $.ajax({
        type: "POST",
        beforeSend: function (request) {
            request.setRequestHeader("X-Client-Id", btoa("08580858000184"));
        },
        url: "http://192.168.1.100:8080/MithraAPI/mithra/v1/template",
        xhrFields: {
            withCredentials: true
        },
        data: json,
        processData: false,
        success: function (msg) {
            HideOverlay();
            console.log(msg);
            success(msg);
        },
        error: function (msg) {
            HideOverlay();
            console.log(msg);
            error(msg);
            var json = msg.responseJSON;
            alert(json.message);
        }
    });
}

function insertNewVeicle(code) {
    var $form = $("#new-veicle-form :input");
    var data = inputToHash($form);
    data["CODIGO"] = code;
    data["CLASFIS"] = "87032100";
    data["CSOSN"] = "0400";
    data["TIPO"] = "00";
    data["ORIGEM"] = "0";
    data["CTLOTE"] = "N";
    data["UM"] = "UN";
    data["FILIAL"] = "0101";
    data["STPIS"] = "01";
    data["STCOF"] = "01";

    insertNewRecord("PRODUT", [data], (msg) => {
        $("#veiculo").val(code);
        $("#modal-prev").modal("hide");
    }, (error) => {

    });
}

function saveForm() {
    var convei = {
        VEICULO: $("#veiculo").val(),
        FILIAL: "0101"
    };
    //console.log("Veiculo: " + $("#veiculo").val());
    //convei["VEICULO"] = $("#veiculo").val();
    //convei["FILIAL"] = "0101";
    console.log(convei);

    insertNewRecord("CONVEI", [convei], (json) => {
        console.log(json);
        var _id = json.data[0];

        var $form = $("#vistoria-form select");
        var data = [];
        $($form).each(function (item, value) {
            var hash = {};
            hash["CHAVE"] = _id;
            hash["GRUPO"] = $(value).data("grupo");
            hash["ITEM"] = $(value).data("item");
            hash[$(value).data("campo")] = $(value).val();

            data.push(hash);
        });

        //var ctx = canvas.getContext("2d");

        var jpegUrl = canvas.toDataURL("image/jpeg");

        data["SIGNATURE"] = jpegUrl;

        insertNewRecord("ITEVEI", data, (msg) => {
            var data = msg.responseJSON;
        }, (error) => {

        });
    }, (error) => {

    });
}

$(document).ready(function () {
    console.log(doesHttpOnlyCookieExist('token'));
    if (!doesHttpOnlyCookieExist('token')) {
        alert('token não existe');
        window.location.href = 'login.html';
        return;
    }

    signaturePad = new SignaturePad(canvas, {
        // It's Necessary to use an opaque color when saving image as JPEG;
        // this option can be omitted if only saving as PNG or SVG
        backgroundColor: 'rgb(255, 255, 255)'
    });

    // On mobile devices it might make more sense to listen to orientation change,
    // rather than window resize events.
    window.onresize = resizeCanvas;
    resizeCanvas();

    checkIfCookieIsExpired();
});

// Adjust canvas coordinate space taking into account pixel ratio,
// to make it look crisp on mobile devices.
// This also causes canvas to be cleared.
function resizeCanvas() {
    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    var ratio = Math.max(window.devicePixelRatio || 1, 1);

    // This part causes the canvas to be cleared
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    // This library does not listen for canvas changes, so after the canvas is automatically
    // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
    // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
    // that the state of this library is consistent with visual state of the canvas, you
    // have to clear it manually.
    signaturePad.clear();
}

$(document).on('click', '#clear-button', function (e) {
    e.preventDefault();
    signaturePad.clear();
});


$(document).on('click', '#submit-button', function (e) {
    e.preventDefault();
    saveForm();
});

$(document).on('click', "#new-veicle-button", function (e) {
    e.preventDefault();

    var search = {
        area: "PRODUT",
        search: [{
            field: "GRUPO",
            operation: "EQUAL_TO",
            value: "01"
        }],
        order: "CODIGO DESC",
        limit: 1
    };

    ShowOverlay();
    $.ajax({
        type: "POST",
        beforeSend: function (request) {
            request.setRequestHeader("X-Client-Id", btoa("08580858000184"));
        },
        url: "http://192.168.1.100:8080/MithraAPI/mithra/v1/search",
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(search),
        processData: false,
        success: function (msg) {
            HideOverlay();
            console.log(msg);
            console.log(msg.data[0].CODIGO);

            var newCode = parseInt(msg.data[0].CODIGO);

            newCode = lpad(newCode + 1, 6);
            console.log(newCode);

            insertNewVeicle(newCode);
        },
        error: function (msg) {
            HideOverlay();
            alert(msg.responseText);
        }
    });
});