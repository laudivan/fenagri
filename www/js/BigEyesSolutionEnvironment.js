siteSwiper = false;

function bigeyesInit() {    
    $('#site-map').on('pageshow', function (){ createMap();});
    
    window.onresize = function () {
        if ($('#sites').hasClass('ui-page-active')) { refreshImgListviewSize();
        } else if ($('#site-map').hasClass('ui-page-active')) {
            resizeMap();
        };
    };
    
    if (isDevice()) {
        window.setTimeout(function () {navigator.splashscreen.hide();}, 3000);
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        $(window).load(onBrowserReady());
    };
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
        };

        siteDescription = data;
        
        $('#site-description-content').append('<h3 id="site-name">'+data['title']+'</h3><hr>');

        buttonBar = '<div class="ui-body">';
        
        if (data['phone'] !== "") {
            buttonBar += '<a href="tel:'+data['phone']+'" id="site-phone">'+data['phone']+'</a>';
        };
        
        if (CategoryWithoutMap.indexOf(categoryId) < 0) {            
            buttonBar += '<a onclick="showMapForSite()" id="btn-see-on-map" class="btn-show">';
            buttonBar += '<img src="style/images/icons/see-on-map.png" alt="Ver no mapa"></a>';
        };

        if (data['has_offers'] === "1") {
            buttonBar += '<a onclick="showOffersForSite('+siteId+')" id="btn-show-itens" class="btn-show">';
            buttonBar += '<img src="style/images/icons/itens-list.png" alt="Lista de itens"></a>';
        };
        
        buttonBar += '</div>';
        
        $("#site-description-content").append(buttonBar);
        
        description = '<div  class="ui-body ui-body-c">';
        description += '<p>'+data['description']+'</p>';
        
        if (data['address']) {
            description += '<hr>';
            description += '<p>'+data['address']+'</p>';
        };
        
        description += '</div>';
        
        $('#site-description-content').append(description);
        
        $.getJSON(siteURL + '/media', function(data) {
            if (data.length === 0 || (data.length === 1 && data[0]['site_logo'] === "1")) {
                return;
            };

            photos = '<br><div id="photos">';
            photos += '<div class="ui-body ui-body-c">';
            photos += '<div class="swiper-container">';
            photos += '<div class="swiper-wrapper">';

            $.each(data, function(key, row) {
                if (row['site_logo'] === "0") {
                    photos += '<div class="swiper-slide"><img src="' + siteURL + '/thumb/400/media/' + row['id'] + '" alt=""></div>';
                };
            });

            photos += '</div></div></div></div>';

            $('#site-description-content').append(photos);

            var siteSwiper = new Swiper('.swiper-container', {
                mode: 'horizontal', loop: false, speed: 1000, calculateHeight: true,
                autoResize: true, slidesPerView: 1, autoplay: 1000
            });
        });
    });

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
        };

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
        };
        navigator.notification.alert(msg, 
            function () {}, 
            "Conexão requerida", 'OK'
        );
        
        backToHome();
        return;
    };    
    
    preparaMapForSite();
    
    categoryId = id;
    
    var categoryURL = BaseApiURL + '/whitelabel/' + WhitelabelId + '/category/' + categoryId + '/site';
    
    $.getJSON(categoryURL, function(data) {
        var itens = [];

        if (data !== null) {
            localStorage['category:' + categoryId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['category:' + categoryId]);
        };

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
    
    categoryVisit(categoryId);
};

function backToHome() {
    $.mobile.changePage('#home', {transition: "slide"});
    $('#site-description-content').empty();
    $('#sites-ul').empty();
    
    if(mapObj) {
        $('#map-canvas').gmap('destroy');
        mapObj = false;
    };
};

/* FUNÇÕES DE RETORNO */
function backSitesToHome () {
    window.history.back();
    $('#sites-ul').empty();
};

function backToSiteList () {
    window.history.back();
    $('#site-description-content').empty();
};

/* EXIBIÇÃO DO MAPA */

function showMapForSite() {
    $.mobile.changePage('#site-map', {transition: "slide"});
    preparaMapForSite();
};

function preLoadMapApi () {
    if (!mapApiIsLoaded()) {
        $.getScript("http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0", function() {
            mapApiLoaded = true;
        });
    }
}

function preparaMapForSite () {
    if (!mapApiIsLoaded()) {
        $.getScript("http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0", function() {
            mapApiLoaded = true;
            
            resizeMap();
            
            createMap();
            
            $.ajaxSetup({cache: false});
        });
    } else {
        latLngBound = [];
        
        addMarkers();
        resizeMap();
    }
}

mapObj = false;
firstLoad = true;
siteMarker = false;
clientMarker = false;
latLngBound = false;
directions = false;
mapApiLoaded = false;

/**
 * Cria o elemento do Mapa para ser exibido.
 */
function createMap() {
    if (siteDescription['latitude']) {
        siteLat = siteDescription['latitude'];
        siteLog = siteDescription['longitude'];
    } else {
        /*@todo Onde vair ser a FENAGRI??*/
        siteLat = -9.3924361;
        siteLog = -40.4939533;
    };
    
    var MapStyles =[ 
        {   "featureType": "administrative",
            "stylers": [{ "visibility": "off" }]
        },
        {   "featureType": "poi",
            "stylers": [{ "visibility": "off" }]
        }
    ];
    
    siteLocation = new Microsoft.Maps.Location(siteLat, siteLog);

    mapOptions = {
        credentials:"AtAu3-Y4zI0zqGyAEM2COAP-Dfj5fyPUkveOfXokhyFhUy_wun3Yd9gSEdPTB5YV",
        mapTypeId: Microsoft.Maps.MapTypeId.Auto,
        center: siteLocation,
        animate: true,
        enableClickableLogo: false,
        enableSearchLogo: false,
        showCopyright: false,
        showDashboard: false,
        showScalebar: false,
        tileBuffer: 4,
        showMapTypeSelector: false,
        zoom: 13
    };
    
    mapObj = new Microsoft.Maps.Map(document.getElementById("map-canvas"), mapOptions);
    
    latLngBound = [];
    
    addMarkers();
};

function addMarkers () {
    if (siteDescription) {
        siteLat = siteDescription['latitude'];
        siteLog = siteDescription['longitude'];
    } else {
        return;
    };
    
    siteLocation = new Microsoft.Maps.Location(siteLat, siteLog);
    
    latLngBound.push(siteLocation);
    
    siteMarker = new Microsoft.Maps.Pushpin(siteLocation, {
        icon: 'style/images/icons/site-location.png',
        height: 24,
        width: 15
    });
    
    mapObj.entities.push(siteMarker);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position){
            clientLocation = new Microsoft.Maps.Location(
                position.coords.latitude, 
                position.coords.longitude
            );
    
            latLngBound.push(clientLocation);
    
            clientMarker = new Microsoft.Maps.Pushpin(clientLocation, {
                icon: 'style/images/icons/user-location.png',
                height: 24,
                width: 20
            });
            
            mapObj.entities.push(clientMarker);
            
            resizeMap();
        });
    };
    
}

function backFromMapToHome () {
    mapObj.entities.clear();
    
    clientMarker = false;
    siteMarker = false;
    latLngBound = false;
    directions = false;
    
    firstLoad = true;
    
    $.mobile.changePage('#home', {transition: "slide"});
};

/**
 * Retorna, apartir da exibição de um mapa, para 
 */
function backFromMapToDesc() {
    window.history.back();
    mapObj.entities.clear();
    
    clientMarker = false;
    siteMarker = false;
    latLngBound = false;
    directions = false;
    firstLoad = true;
};

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
    R = 6371; ;
    dLat = deg2rad(lat2 - lat1);
    dLon = deg2rad(lon2 - lon1);
    a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    d = R * c;
    
    return d;
};

/**
 * Converte graus em radiano.
 * 
 * @param deg
 */
function deg2rad(deg) {
    return deg * (Math.PI / 180);
};

/* Outras funções de suporte */

/**
 * Atualiza as imagens da lista de sites para o tamanho adequado à tela.
 */
function refreshImgListviewSize() {
    categoryId = $('#sites-ul').attr('data-category');

    thumbSize = $(document).width() < 480 ? 130 
                : $(document).width() < 600 ? 200
                : $(document).width() < 800 ? 250
                : 300;

    baseUrl = BaseApiURL + '/whitelabel/' + WhitelabelId + '/category/' + categoryId + '/site/';

    listItens = $('#sites-ul').children();

    $.each(listItens, function(key, data) {
        siteId = $(this).attr('data-site');

        $(this).children('img').attr('src', baseUrl + siteId + '?thumb=' + thumbSize);
    });

    $('#sites-ul').listview('refresh');
};

/* Tratamento de ventos */
function onDeviceReady () {
    if (localStorage.getItem('apikey')) {
        ApiKey = localStorage.getItem('apikey');
    } else {
        //DeviceURL = BaseApiURL+'/device/'+device.uuid;
        //$.getJSON();//verfificar se já tem cadastro
        // - se sim salvar apikey
        // - senão criar um cadastro de device e salvar apikey
    };
    
    $('#front-page-header').toolbar("hide");
    
    switch (device.platform) {
        case 'Win32NT':
            $('.copyright').removeClass('ui-footer-fixed');
            $('.copyright').removeClass('ui-footer-fullscreen');
            $('.copyright').addClass('copyright-wp8');
            storeName = 'Windows Phone Store';
            storeLink = 'http://www.windowsphone.com/pt-br/store';
            break;
        case 'Android':
            storeName = 'Play Store';
            storeLink = 'https://play.google.com/store/apps/details?id=com.bigeyessolution.FenagriApp';
            break;
        case 'iOS':
            storeName = 'Apple Store';
            storeLink = 'http://www.apple.com/';
            break;
        case 'BlackBerry 10':
            storeName = 'App World';
            storeLink = 'href','https://appworld.blackberry.com';
            break;
    };

    $(document).scroll(function() {
        if (! $('#home').is(':visible')) return;
        if ($('#front-page-header').hasClass('ui-fixed-hidden') && $(document).scrollTop() > 150) {
            $('#front-page-header').toolbar("show");
            $('#front-page-header').toolbar("refresh");
        } else if ( $(document).scrollTop() < 50 ) {
            $('#front-page-header').toolbar("hide");
        };
    });
    
    if (isConnected()) {
        deviceRegistry();
    }
    
    /*Contando a quantidade de acessos*/
    if (localStorage.getItem('BECount')) {
        count = parseInt(localStorage.getItem('BECount'));
        if ( count !== -1)
            localStorage.setItem('BECount', count+1);
    }else{
        localStorage.setItem('BECount', 1);
    };
    
    if (localStorage.getItem('BECount') === "5") {
        navigator.notification.confirm(
            'Está gostando do aplicativo da FENAGRI? Então vá a '+storeName+' e mostre a sua opnião.',
             function (btIndex) { 
                 if (btIndex === 1) {
                     localStorage.setItem('BECount', -1);
                     window.open(storeLink, '_blank');
                 } else if (btIndex === 2) {
                     localStorage.setItem('BECount', 0);
                 } else {
                     localStorage.setItem('BECount', 0);
                 };
             },
            'Mostre-nos a sua opnião sobre o aplicativo',
            ['Vamos lá!', 'Depois.','Nunca.', '']
        );
    };
};

function onBrowserReady () {
    $('#front-page-header').toolbar("hide");

    $(document).scroll(function() {
        if (! $('#home').is(':visible')) return;
        if ($('#front-page-header').hasClass('ui-fixed-hidden') && $(document).scrollTop() > 150) {
            $('#front-page-header').toolbar("show");
            $('#front-page-header').toolbar("refresh");
        } else if ( $(document).scrollTop() < 50 ) {
            $('#front-page-header').toolbar("hide");
        };
    });
};

function isConnected () {
    if (! isDevice()) return window.navigator.onLine;
    
    return navigator.connection.type !== Connection.NONE;
};

function mapApiIsLoaded () {
    return mapApiLoaded;
};

/* Checkin, voto e comentario */

function checkIn () {
    
};

function categoryVisit (categoryId) {
    
};

function siteVisit (siteId) {
    
};

function voteOnSite () {
    
};

function loading(page, showOrHide) {
    if (showOrHide) {
        $(page+' .loading').removeClass('loading-hide');
    } else {
        if (!$(page+' .loading').hasClass('loading-hide')) $('.loading').addClass('loading-hide');
    };
};

function resizeMap () {
    if (! isDevice()) {
//        $('.gm-style').height($('body').height());
        $('#map-canvas').height($('body').height());
    } else {
//        $('.gm-style').height($(window).height());
        $('#map-canvas').height($(window).height());
    };
    
    if(latLngBound && mapObj) {
        locRec = Microsoft.Maps.LocationRect.fromLocations(latLngBound);

        mapObj.setView ({bounds: locRec });
    }
};

function mapinitialize() {
    mapApiLoaded = true;
};

function isDevice () {
    return true;
};

function deviceRegistry () {
    var BaseDeviceUrl = BaseApiURL+'whitelabel'+WhitelabelId+'/device/'+device.uuid;
    
    if (localStorage.getItem('authkey')) {
        
    } else {
        deviceInfo = {
            'uuid': device.uuid,
            'platform': device.platform,
            'version': device.version,
            'model': device.model
        };
        
        $.post(BaseDeviceUrl, deviceInfo, function (data, textStatus, jqXHR) {
            if (data['authkey']) {
                localStorage.setItem('authkey',data['authkey']);
            };
        });
    };
};
