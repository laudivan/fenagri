/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
siteSwiper = false;

function bigeyesInit() {    
    if (IsABrowser) {
        $(window).load(onBrowserReady());
    } else {
        window.setTimeout(function () {navigator.splashscreen.hide();}, 3000);
        document.addEventListener("deviceready", onDeviceReady, false);
    }
};

siteDescription = false;
categoryId = false;

function showSiteDescription(siteId) {
    var siteURL = BaseApiURL + '/whitelabel/' + WhitelabelId + '/site/' + siteId;

    $('#site-description-content').empty();
    
    logoCanv = $(document).width()*0.8;
    
    $('#site-description-content').append('<center><img id="site-logo" src="'+siteURL+'/thumb/'+logoCanv+'/logo"></center>');

    $.getJSON(siteURL, function(data) {

        if (data !== null) {
            localStorage['site:' + siteId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['site:' + siteId]);
        }

        siteDescription = data;
        
        $('#site-description-content').append('<h3 id="site-name">'+data['title']+'</h3><hr>');

        buttonBar = '<div class="ui-body">';
        
        if (data['phone'] !== "") {
            buttonBar += '<a href="tel:'+data['phone']+'" id="site-phone">'+data['phone']+'</a>';
        }
        
        if (CategoryWithoutMap.indexOf(categoryId) < 0) {
            prepareMapForSite(data['latitude'], data['longitude']);
            buttonBar += '<a onclick="showMap ()" id="btn-see-on-map" class="btn-show">';
            buttonBar += '<img src="style/images/icons/see-on-map.png" alt="Ver no mapa"></a>';
        }

        if (data['has_offers'] === "1") {
            buttonBar += '<a onclick="showOffersForSite('+siteId+')" id="btn-show-itens" class="btn-show">';
            buttonBar += '<img src="style/images/icons/itens-list.png" alt="Lista de itens"></a>';
        }
        
        buttonBar += '</div>';
        
        $("#site-description-content").append(buttonBar);
        
        description = '<div  class="ui-body ui-body-c">';
        description += '<p>'+data['description']+'</p>';
        
        if (data['address']) {
            description += '<hr>';
            description += '<p>'+data['address']+'</p>';
        }
        
        description += '</div>';
        
        $('#site-description-content').append(description);
        
        $.getJSON(siteURL + '/media', function(data) {
            if (data.length === 0 || (data.length === 1 && data[0]['site_logo'] === "1")) {
                console.log('Sem media');
                return;
            }

            photos = '<br><div id="photos">';
            photos += '<div class="ui-body ui-body-c">';
            photos += '<div class="swiper-container">';
            photos += '<div class="swiper-wrapper">';

            $.each(data, function(key, row) {
                if (row['site_logo'] === "0") {
                    photos += '<div class="swiper-slide"><img src="' + siteURL + '/thumb/400/media/' + row['id'] + '" alt=""></div>';
                }
            });

            photos += '</div></div></div></div>';

            $('#site-description-content').append(photos);

            var siteSwiper = new Swiper('.swiper-container', {
                mode: 'horizontal', loop: false, speed: 1000, calculateHeight: true,
                autoResize: true, slidesPerView: 1, autoplay: 1000
            }); //siteSwiper
        }); //Get Media
    }); //Get Description

    $.mobile.changePage('#site-description', {transition: "slide"});
    
    siteVisit();
};

function showOffersForSite(siteId) {
    offersURL = BaseApiURL + '/whitelabel/' + WhitelabelId + '/site/' + siteId + '/offer';

    var offers = [];

    $('#site-itens').panel("open");

    $('#site-itens ul').empty();

    $.getJSON(offersURL, function(data) {
        if (data !== null) {
            localStorage['offer:' + siteId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['offer:' + siteId]);
        }

        $.each(data, function(key, row) {
            $('#site-itens ul').append('<li><a>' + '<h2>' + row['title'] + '</h2>' +
                    '<p>' + row['description'] + '</p>' +
                    '<p>' + row['monetary'] + '' + row['value'] + '</p>' +
                    '</a></li>');
        });
    });

    $('#site-itens ul').listview('refresh');    
};

function showSitesByCategory(id) {
    if (!isConnected()) {
        switch (id) {
            case 1:
                msg = "Você precisa de uma conexão de dados para ter acesso aos pontos turísticos.";
                break;
            case 2:
                msg = "Nossas informações sobre hotéis estão todas na Internet. Por favor, conecte-se e tente novamente.";
                break;
            case 3:
                msg = "Estando conectado(a) a Internet você terá acesso à lista atualizada de nossos melhores restaurantes.";
                break;
            case 4:
                msg = "Utilize uma conexão de dados ou Wi-Fi para conhecer os melhores bares da região.";
                break;
            case 7:
                msg = "Precisando de um taxi? Conecte-se e escolha um dentre os melhores serviços da região.";
                break;
        }
        navigator.notification.alert(msg, 
            function () {}, 
            "Conexão requerida", 'OK'
        );
        
        backToHome();
        return;
    }    
    
    categoryId = id;
    
    var categoryURL = BaseApiURL + '/whitelabel/' + WhitelabelId + '/category/' + categoryId + '/site';
    
    $.getJSON(categoryURL, function(data) {
        var itens = [];

        if (data !== null) {
            localStorage['category:' + categoryId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['category:' + categoryId]);
        }

        $('#sites-ul').attr('data-category', categoryId);

        $.each(data, function(key, row) {
            site_id = row['site_id'];
            title = row['title'];
            description = row['description'];
           
            thumbSize = $(document).width() < 480 ? 130 : 
                        $(document).width() < 600 ? 200 : 
                        $(document).width() < 800 ? 250 :
                        300;
            itens.push('<li data-site="' + site_id + '"><a onclick="showSiteDescription(' + site_id + ')">' +
                    '<img src="' + categoryURL + '/' + site_id +'/thumb/'+thumbSize+ '/logo" class="ui-li-thumb" alt="' + title + '">' +
                    '<h2>' + title + '</h2>');
        });

        $('#sites-ul').html(itens.join(''));

        $('#sites-ul').listview('refresh');
    });

    $.mobile.changePage('#sites', {transition: "slide"});
    
//    loading ('hide');
    
    categoryVisit(categoryId);
};

function backToHome() {
    $.mobile.changePage('#home', {transition: "slide"});
    $('#site-description-content').empty();
    $('#sites-ul').empty();
}

/* FUNÇÕES DE RETORNO */
function backSitesToHome () {
    //$.mobile.changePage('#home', {transition: "slide"});
    //$('#site-description-content').empty();
    window.history.back();
    $('#sites-ul').empty();
};

function backToSiteList () {
    //$.mobile.changePage('#sites', {transition: "slide"});
    window.history.back();
    $('#site-description-content').empty();
    backFromMap();
};

/* EXIBIÇÃO DO MAPA */

mapApiLoaded = false;
mapOptions = false;
mapObj = false;
siteMarker = false;
clientMarker = false;
logLatList = [];

function prepareMapForSite(lat, log) {
    Zoom = MapZoomDefault;
    Styles = MapStyles;

    if (!mapApiLoaded) {
        $.getScript("https://maps.googleapis.com/maps/api/js?key=" + MapKey + "&sensor=true&async=3&callback=createMap&visual_refresh=true", function() {
            mapApiLoaded = true;

            $.ajaxSetup({cache: false});
        });
    } else {
        setSiteMarker();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(setClientMarker);
        }
        
        $('#map-canvas').gmap('refresh');

    }
};

function showMap () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setClientMarker);
    }
    
    $.mobile.changePage('#site-map', {transition: 'slide'});
    $('#map-canvas').gmap('refresh');
}

/**
 * Cria o elemento do Mapa para ser exibido.
 */
function createMap() {
    siteLat = siteDescription['latitude'];
    siteLog = siteDescription['longitude'];

    siteLocation = new google.maps.LatLng(siteLat, siteLog);

    mapOptions = {
        zoom: MapZoomDefault,
        backgroundColor: '#26262d',
        styles: Styles,
        center: siteLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        streetViewControl: false,
        overviewMapControl: false,
        panControl: false,
        scaleControl: false,
        mapTypeControl: true,
        disableDefaultUI: false,
        maxZoom: 19,
        minZoom: 8
    };

    $('#map-canvas').gmap (mapOptions).bind('init', function (){
        setSiteMarker();
    });
}

/**
 * Insere um marcador para o estabelecimento selecionado.
 */
function setSiteMarker() {
    siteLat = siteDescription['latitude'];
    siteLog = siteDescription['longitude'];

    $('#map-canvas').gmap('addMarker', { 
            id:'site', 
            'position': siteLat+','+siteLog, 
            icon: 'style/images/icons/site-location.png', 
            'bounds': true 
        } 
    );
    
    $('#map-canvas').gmap('refresh');
}

/**
 * Insere um marcado para o cliente na posição passada em position
 * 
 * @param position Posição do cliente
 */
function setClientMarker(position) {
    lat = position.coords.latitude;
    log = position.coords.longitude;
    
    var clientMarker = $('#map-canvas').gmap('get', 'markers > client'); 
    
    if (clientMarker) clientMarker.setMap(null);
    
    $('#map-canvas').gmap('addMarker', { 
        id:'client', 
        'position': lat+','+log, 
        icon: 'style/images/icons/user-location.png', 
        'bounds': true 
    });
    
    $('#map-canvas').gmap('refresh');
}

/**
 * Retorna, apartir da exibição de um mapa, para 
 */
function backFromMap() {
    window.history.back();
    
    $('#map-canvas').gmap('set', 'bounds', null);
    
    $('#map-canvas').gmap('clear', 'markers');
}

/* ==== Funções de distancia ==== */

/**
 * Retornar a distância entre dois pontos sobre a superfície terrestre em Km.
 * @param lat1 Latitude do primeiro ponto
 * @param lon1 Longitude do primeiro ponto
 * @param lat2 Latitude do segundo ponto
 * @param lon2 Longitude do segundo ponto
 * 
 * @returns number 
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    R = 6371; // Radius of the earth in km
    dLat = deg2rad(lat2 - lat1);  // deg2rad below
    dLon = deg2rad(lon2 - lon1);
    a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    d = R * c; // Distance in km
    
    return d;
}

/**
 * Converte graus em radiano.
 * 
 * @param deg
 */
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/* Outras funções de suporte */

/**
 * Atualiza as imagens da lista de sites para o tamanho adequado à tela.
 */
function refreshImgListviewSize() {
    categoryId = $('#sites-ul').attr('data-category');

    thumbSize = $(document).width() < 768 ? 80 : 230;

    baseUrl = BaseApiURL + '/whitelabel/' + WhitelabelId + '/category/' + categoryId + '/site/';

    listItens = $('#sites-ul').children();

    $.each(listItens, function(key, data) {
        siteId = $(this).attr('data-site');

        $(this).children('img').attr('src', baseUrl + siteId + '?thumb=' + thumbSize);
    });

    $('#sites-ul').listview('refresh');
}

/* Tratamento de ventos */
function onDeviceReady () {
    BaseDeviceUrl = BaseApiURL+'whitelabel'+WhitelabelId+'/device/'+device.uuid;
    
    onBrowserReady();
    
    if (localStorage.getItem('apikey')) {
        ApiKey = localStorage.getItem('apikey');
    } else {
        //DeviceURL = BaseApiURL+'/device/'+device.uuid;
        //$.getJSON();//verfificar se já tem cadastro
        // - se sim salvar apikey
        // - senão criar um cadastro de device e salvar apikey
    }
    
    switch (device.platform) {
        case 'Win32NT':
            $('.copyright').removeClass('ui-footer-fixed');
            $('.copyright').removeClass('ui-footer-fullscreen');
            $('.copyright').addClass('copyright-wp8');
            storeName = 'Windows Phone Store';
            storeLink = 'http://www.windowsphone.com/pt-br/store';
            break;
        case 'Android':
            storeName = 'Google Play Store';
            storeLink = 'https://play.google.com/store';
            break;
        case 'iOS':
            storeName = 'Apple Store';
            storeLink = 'http://www.apple.com/';
            break;
        case 'BlackBerry 10':
            storeName = 'App World';
            storeLink = 'href','https://appworld.blackberry.com';
            break;
    }
    
    //Contando a quantidade de acessos
    if (localStorage.getItem('BECount')) {
        count = parseInt(localStorage.getItem('BECount'));
        if ( count !== -1)
            localStorage.setItem('BECount', count+1);
    }else{
        localStorage.setItem('BECount', 1);
    }
    
    if (localStorage.getItem('BECount') === "5") {
        navigator.notification.confirm(
            'Está gostando do aplicativo da FENAGRI? Então vá a '+storeName+' e mostre a sua opnião.',
             function (btIndex) { 
                 if (btIndex === 1) {
                     localStorage.setItem('BECount', 0);
                 } else if (btIndex === 2) {
                     localStorage.setItem('BECount', -1);
                 } else {
                     localStorage.setItem('BECount', -1);
                     loadUrl(storeLink);
                 }
             },
            'Mostre-nos a sua opnião sobre o aplicativo',
            ['Agora não!', 'Não mostre mais essa mensagem!','Ok, vamos lá!', '']
        );
        
        
    }
};



function onBrowserReady () {
    $('#front-page-header').toolbar("hide");
        
    $(window).resize(function() {
        refreshImgListviewSize();
    });

    $(document).scroll(function() {
        if ($('#home').is(':visible')) {
            if ($('#front-page-header').hasClass('ui-fixed-hidden') && $(document).scrollTop() > 150) {
                $('#front-page-header').toolbar("show");
                $('#front-page-header').toolbar("refresh");
            } else if ( $(document).scrollTop() < 50 ) {
                $('#front-page-header').toolbar("hide");
            }
        }
    });
};

function isConnected () {
    if (IsABrowser) return true;
    
    return navigator.connection.type !== Connection.NONE;
}

/* Checkin, voto e comentario */

function checkIn () {
    
};

function categoryVisit (categoryId) {
    
};

function siteVisit (siteId) {
    
};

function voteOnSite () {
    
};

function loading(showOrHide) {
    setTimeout(function(){
        $.mobile.loading(showOrHide);
    }, 1); 
}

