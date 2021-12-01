class authModule {
    constructor() {
        const fetch = window.fetch; // thanks to @coffeetocode who found a bypass! 

        // we have to protect the original `fetch` from getting overwritten via XSS
        // https://twitter.com/coffeetocode/status/1312998927881314305
        const authOrigins = ["https://api.mithra.com.br", "http://localhost:8080"];
        let token = '';

        this.setToken = (value) => {
            token = value;
        };

        this.storeToken = () =>  {
            sessionStorage.setItem("token", token);
        };

        this.fetch = (resource, options) => {
            let req = new Request(resource, options);
            console.log(new URL(req.url).origin);
            let destOrigin = new URL(req.url).origin;
            if (token && authOrigins.includes(destOrigin)) {
                req.headers.set('Authorization', 'Bearer ' + token);
                req.headers.set("X-Client-Id", btoa("08580858000184"));
            }
            return fetch(req);
        };
    }
}

const auth = new authModule();

function DeleteAllCookies() {
    var cookies = $.cookie();

    for (var i = 0; i < cookies.length; i++) {
        $.removeCookie(cookies[i][0]);
    }
}

function doesHttpOnlyCookieExist(name) {
    $.cookie(name, 'something', { path: "/;SameSite=None", secure: true });
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
        username: $("#username").val(),
        password: $("#password").val()
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
            console.log(msg);
            
            sessionStorage.setItem("token", msg.access_token);
            sessionStorage.setItem("session_expires_in", msg.expires_in);
            
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