function SetCookie(name, value) {
    $.cookie(name, value, { path: '/' });
}

function DeleteAllCookies() {
    var cookies = $.cookie();

    for (var i = 0; i < cookies.length; i++) {
        $.removeCookie(cookies[i][0]);
    }
}

function doesHttpOnlyCookieExist(name) {
    $.cookie(name, 'something', { path:  "/;SameSite=None", secure: true });
    console.log(name + "=" + $.cookie(name));
    console.log($.cookie(name) == undefined);
    return $.cookie(name) == undefined;
}

// Mostra overlay para chamadas ajax.
function ShowOverlay() {
    var over = '<div id="overlay"><div class="loader"></div></div>';
    $(over).appendTo('body');
}

// Esconde overlay.
function HideOverlay() {
    $('#overlay').remove();
}

function login() {
    var login = {
        username: $("#usuario").val(),
        password: $("#senha").val()
    }

    ShowOverlay();
    $.ajax({
        type: "POST",
        beforeSend: function (request) {
            request.setRequestHeader("X-Client-Id", btoa("08580858000184"));
            request.setRequestHeader("Content-Type", "application/json");
        },
        url: "https://api.mithra.com.br/mithra/v1/auth",
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(login),
        processData: false,
        success: function (msg) {
            HideOverlay();
            SetCookie('expiration_session', msg.expires_in);
            window.location.href = 'index.html';
        },
        error: function (xhr, ajaxOptions, thrownError) {
            HideOverlay();
            var json = xhr.responseJSON;
            if (json !== undefined) {
                alert(json.message);
            } else {
                alert(thrownError);
            }
        }
    });
}

$(document).on("click", "#btn-login", function (e) {
    e.preventDefault();
    login();
});