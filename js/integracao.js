var veicle = null;
var signaturePad = null;
var canvas = document.querySelector("canvas");
var ibger = "";

function inputToHash(obj) {
    var hash = {};
    $(obj).each(function (item, value) {
        if ($(value).data("campo") !== undefined) {
            hash[$(value).data("campo")] = $(value).val();
        }
    });
    return hash;
}

function checkIfSessionIsExpired() {
    let timeStamp = sessionStorage.getItem('session_expires_in');

    if (timeStamp == undefined) {
        return false;
    }

    var date = new Date(timeStamp * 1000);

    if (isNaN(date.getTime())) {
        $.removeCookie('session_expires_in', { path: '/' });
        sessionStorage.removeItem("token");
        alert('Sua sessão expirou 1!');
        document.location.href = 'login.html';
        return;
    }
    var today = new Date();

    if (date.getTime() < today.getTime()) {
        $.removeCookie('session_expires_in', { path: '/' });
        sessionStorage.removeItem("token");
        alert('Sua sessão expirou 2!');
        document.location.href = 'login.html';
        return;
    }
    setTimeout(checkIfSessionIsExpired, 1000);
}

function lpad(value, length) {
    return ('0'.repeat(length) + value).slice(-length);
}

function insertNewRecord(area, records, success, error) {
    
    let json = [{
        area: area,
        data: records
    }];

    ShowOverlay();

    auth.fetch("https://api.mithra.com.br/mithra/v1/template", {
        method: "POST",
        body: JSON.stringify(json)
    }).then(async (res) => {
        HideOverlay();
        console.log(res);
        if (res.status == 200) {
            res.json().then(function (json) {
                success(json);
            });
        } else if (res.status == 401) {
            localStorage.removeItem("token");
        } else {
            const json_1 = await res.json();
            alert(json_1.message);
            throw new Error(json_1);
        }
    }).then(responseText => console.log(responseText))
        .catch(console.error);
}

function insertOrUpdateVeicle(code) {

    let search = {
        area: "PRODUT",
        search: [{
            field: "PLACA",
            operation: "EQUAL_TO",
            value: $('#placa').val()
        }],
        order: "CODIGO DESC",
        limit: 1
    };
    
    auth.fetch("https://api.mithra.com.br/mithra/v1/search", {
        method: "POST",
        body: JSON.stringify(search)
    }).then(async (res) => {
        HideOverlay();
        console.log(res);
        if (res.status == 200) {
            res.json().then(function (json) {
                console.log(json);
                if (json.success) {
                    console.log(json.data[0].NOME);
                    $("#veiculo").val(json.data[0].CODIGO);
                    saveForm();
                } else {
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
                        saveForm();
                    }, (error) => {
                
                    });
                }
            });
        } else {
            const json_1 = await res.json();
            alert(json_1.message);
            throw new Error(json_1);
        }
    }).then(responseText => console.log(responseText))
        .catch(console.error);
}

function saveForm() {
    var convei = {
        VEICULO: $("#veiculo").val(),
        CLIENTENT: $("#cliente").val(),
        FILIAL: "0101",
        OBSCHECK: $("#observacao").val()
    };
    

    console.log(convei);

    insertNewRecord("CONVEI", [convei], (json) => {
        console.log(json);
        var _id = json.data[0];

        var $form = $("#vistoria-form select");
        var data = [];
        $($form).each(function (item, value) {
            var hash = {};
            hash["CHAVE"] = _id;
            hash["ORDEM"] = item;
            hash["GRUPO"] = $(value).data("grupo");
            hash["ITEM"] = $(value).data("item");
            hash["VALOR"] = $(value).val();

            data.push(hash);
        });

        var jpegUrl = canvas.toDataURL("image/jpeg");

        data["SIGNATURE"] = jpegUrl;

        insertNewRecord("ITEVEI", data, (msg) => {
            //var data = msg.responseJSON;
            
            $.confirm({
                icon: 'fa fa-warning',
                title: 'Confirmação!',
                content: 'Cadastrado com sucesso!',
                type: 'green',
                buttons: {
                    confirm: {
                        text: 'OK',
                        btnClass: 'btn-green',
                        action: function () {
                            location.reload();
                        }
                    },
                }
            });
        }, (error) => {
        });
    }, (error) => {
    });
}
$(window).bind('beforeunload', function(){
    auth.storeToken();
    return true;;
});

$(document).ready(function () {
    let timeStamp = sessionStorage.getItem('session_expires_in');
    let token = sessionStorage.getItem("token");
    
    if (timeStamp == undefined || token == null) {
        //$("#modalLoginForm").modal('show');
        document.location.href = 'login.html';
    } else {
        auth.setToken(sessionStorage.getItem("token"));
        sessionStorage.removeItem("token");
        prepareForm();
        $("#modal-prev").modal("show");
    }
});

function prepareForm() {
    checkIfSessionIsExpired();
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)'
    });

    // On mobile devices it might make more sense to listen to orientation change,
    // rather than window resize events.
    window.onresize = resizeCanvas;
    resizeCanvas();
}
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

function cadastrarCliente(cgc) {
    let cnpj = $("#search-costumer").val()
    $.confirm({
        icon: 'fa fa-warning',
        title: 'Confirmação!',
        content: 'Cliente não localizado, cadastrar?',
        type: 'green',
        buttons: {
            confirm: {
                text: 'Cadastrar',
                btnClass: 'btn-green',
                action: function () {
                    $("#cliente-modal").modal('show');
                    $('#cgc').val(cnpj);
                }
            },
            somethingElse: {
                text: 'Cancelar',
                action: function () {

                }
            }
        }
    });
}

function verifica_cpf_cnpj ( valor ) {

    // Garante que o valor é uma string
    valor = valor.toString();
    
    // Remove caracteres inválidos do valor
    valor = valor.replace(/[^0-9]/g, '');

    // Verifica CPF
    if ( valor.length === 11 ) {
        return 'CPF';
    } 
    
    // Verifica CNPJ
    else if ( valor.length === 14 ) {
        return 'CNPJ';
    } 
    
    // Não retorna nada
    else {
        $.confirm("Cpf/Cnpj inválido!")
        return false;
    }
    
} 

$(document).on('click', '#clear-button', function (e) {
    e.preventDefault();
    signaturePad.clear();
});

$   (document).on('click', '#btn-search-cep', function (e) {
    e.preventDefault();

    var cep = $("#search-cep").val().replace(/\D/g, '');
  
    //Verifica se campo cep possui valor informado.
    if (cep != "") {

        //Expressão regular para validar o CEP.
        var validacep = /^[0-9]{8}$/;

        //Valida o formato do CEP.
        if(validacep.test(cep)) {

            //Consulta o webservice viacep.com.br/
            $.getJSON("https://viacep.com.br/ws/"+ cep +"/json/", function(dados) {

                if (!("erro" in dados)) {
                    //Atualiza os campos com os valores da consulta.
                    $("#endereco").val(dados.logradouro.toUpperCase());
                    $("#estado").val(dados.uf.toUpperCase());
                    $("#municipio").val(dados.localidade.toUpperCase());
                    var ibge = dados.ibge ;
                } //end if.
                else {
                    //CEP pesquisado não foi encontrado.
                    console.log("CEP não encontrado.");
                    $.confirm("CEP não encontrado.");  
                }
            });
        } //end if.
        else {
            console.log("Formato de CEP inválido.");
            $.confirm("Formato de CEP inválido.")
        }
    } //end if.
    
})

$   (document).on('click', '#btn-search-costumer', function (e) {
    e.preventDefault();

    let cgc = $("#search-costumer").val()

    if (!verifica_cpf_cnpj(cgc)){
       return false
    };

    let search = {
        area: "CLIENT",
        search: [{
            field: "CGC",
            operation: "EQUAL_TO",
            value: $('#search-costumer').val()
        }],
        order: "CODIGO DESC",
        limit: 1
    };

    ShowOverlay();

    auth.fetch("https://api.mithra.com.br/mithra/v1/search", {
        method: "POST",
        body: JSON.stringify(search)
    }).then(async (res) => {
        HideOverlay();
        console.log(res);
        if (res.status == 200) {
            res.json().then(function (json) {
                console.log(json);
                if (json.success) {
                    console.log(json.data[0].NOME);
                    $("#cliente").val(json.data[0].CODIGO);
                    $("#costumer-name").val(json.data[0].NOME).toUpperCase();
                } else {
                    cadastrarCliente();
                }
            });
        } else {
            const json_1 = await res.json();
            alert(json_1.message);
            throw new Error(json_1);
        }
    }).then(responseText => console.log(responseText))
        .catch(console.error);
})



$   (document).on('click', '#btn-search-veicle', function (e) {
    e.preventDefault();

    let search = {
        area: "PRODUT",
        search: [{
            field: "PLACA",
            operation: "EQUAL_TO",
            value: $('#search-veicle').val()
        }],
        order: "CODIGO DESC",
        limit: 1
    };

    ShowOverlay();

    auth.fetch("https://api.mithra.com.br/mithra/v1/search", {
        method: "POST",
        body: JSON.stringify(search)
    }).then(async (res) => {
        HideOverlay();
        console.log(res);
        if (res.status == 200) {
            res.json().then(function (json) {
                console.log(json);
                if (json.success) {
                    console.log(json.data[0].CORVEICULO);
                    $("#cor").val(json.data[0].CORVEICULO);
                    $("#ano-modelo").val(json.data[0].ANOMODELO);
                    $("#ano-fab").val(json.data[0].ANOFABRICACAO);
                    $("#chassi").val(json.data[0].CHASSI);
                    $("#renavam").val(json.data[0].RENAVAM);
                } else {
                   
                }
            });
        } else {
            const json_1 = await res.json();
            alert(json_1.message);
            throw new Error(json_1);
        }
    }).then(responseText => console.log(responseText))
        .catch(console.error);
})





$(document).on('click', '#submit-button', function (e) {
    e.preventDefault();

    let search = {
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

    auth.fetch("https://api.mithra.com.br/mithra/v1/search", {
        method: "POST",
        body: JSON.stringify(search)
    }).then(async (res) => {
        HideOverlay();
        console.log(res);
        if (res.status == 200) {
            res.json().then(function (json) {
                console.log(json);
                if (json.success) {
                    let newCode = parseInt(json.data[0].CODIGO);

                    newCode = lpad(newCode + 1, 6);
                    console.log(newCode);

                    insertOrUpdateVeicle(newCode);
                }
            });
        } else {
            const json_1 = await res.json();
            alert(json_1.message);
            throw new Error(json_1);
        }
    }).then(responseText => console.log(responseText))
        .catch(console.error);
});

$(document).on('click', "#new-veicle-button", function (e) {
    e.preventDefault();

    var $form = $("#new-veicle-form :input");
    var data = inputToHash($form);
    for (var [key, value] of Object.entries(data)) {
        if (value === '') {
            alert(`Campo ${key} não pode ser vazio`);
            return;
        }
    }

    if ($("#cliente").val() === '') {
        alert(`Campo CLIENTE não pode ser vazio`);
        return;
    }

    $("#modal-prev").modal("hide");
});

$(document).on('click', "#new-client-button", function (e) {
    e.preventDefault();

    var $form = $("#new-client-form :input");
    var data = inputToHash($form);
    for (var [key, value] of Object.entries(data)) {
        if (value === '') {
            alert(`Campo ${key} não pode ser vazio`);
            return;
        }
    }
    
    var pessoa = $('#cgc').trim().length > 11 ? "J" : "F";

    data['PESSOA'] = pessoa;
    data['CODMUN'] = ibge;  
   

    var search = {
        area: "CLIENT",
        search: [{
            field: "CODIGO",
            operation: "LIKE",
            value: "%"
        }],
        order: "CODIGO DESC",
        limit: 1
    };

    ShowOverlay();
    auth.fetch("https://api.mithra.com.br/mithra/v1/search", {
        method: "POST",
        body: JSON.stringify(search)
    }).then((res) => {
        HideOverlay();
        if (res.status == 200) {
            HideOverlay();
            res.json().then(function (json) {
                console.log(json);
                if (json.success) {
                    let newCode = parseInt(json.data[0].CODIGO);

                    newCode = lpad(newCode + 1, 6);
                    console.log(newCode);

                    data["CODIGO"] = newCode;

                    insertNewRecord("CLIENT", [data], (msg) => {
                        console.log(msg);
                        $("#cliente").val(newCode);
                        $("#cliente-modal").modal("hide");
                    }, (error) => {
                        alert(error.message);
                    });
                }
            });
        } else {
            throw Error(res.statusText)
        }
    }).then(responseText => console.log(responseText))
        .catch(console.error);
});