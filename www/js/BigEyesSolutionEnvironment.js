/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
siteSwiper = false;

function bigeyesInit () {
    
    //Verificar conectividade
    
    //Verificar Geolocalização
    
    //Verificar Autenticação
    
    //Carregar informações locais
    
    
    window.onload = function () {
        $('#front-page-header').toolbar( "hide" );
    };
    
    $(document).scroll(function () {        
        if ($('#home').is(':visible')) {
            if ($(document).scrollTop() > 120) {
                if ($('#front-page-header').hasClass('ui-fixed-hidden')) {
                    $('#front-page-header').toolbar( "show" );
                }
            } else {
                $('#front-page-header').toolbar( "hide" );
            }
        }
    });
    
    
    
};

function getDeviceInfo () {
    
};

function getClientInfo () {
    
};

siteDescription = false;

function showSiteDescription (siteId) {
    var siteURL = BaseApiURL+'/whitelabel/'+WhitelabelId+'/site/'+siteId;
    
    $('#site-logo').attr('src', siteURL+'/logo');
    
    $.getJSON(siteURL, function(data){
        
        if(data !== null) {
            localStorage['site:'+siteId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['site:'+siteId]);
        }
        
        siteDescription = data;
        
        $('#site-name').text(data['title']);
        
        if (data['phone'] !== "") {
            $('#site-phone').text(data['phone']);
            
            $('#site-phone').attr('href','tel:'+data['phone']);
        }
        
        $('#btn-see-on-map').attr('onclick', 'showMapForSite ('+data['latitude']+','+data['longitude']+')');
        
        if(data['has_offers'] === "1") {
            $('#btn-show-itens').attr('onclick','showOffersForSite('+siteId+')');
            $('#btn-show-itens').show();
        }else{
            $('#btn-show-itens').hide();
        }
        
        $('#site-text-description').text(data['description']);
        $('#site-address').text(data['address']);
    });
    
    $.getJSON(siteURL+'/media', function (data) {
        if (data.length === 0 || (data.length === 1 && data[0]['site_logo'] === "1")) {
            console.log('Sem media');
            return;
        }
        
        photos = '<div class="ui-body ui-body-c"><div class="swiper-container"><div class="swiper-wrapper">';
        
        $.each(data, function(key, row) {
            if (row['site_logo'] === "0"){
                photos += '<div class="swiper-slide"><img src="'+siteURL+'/media/'+row['id']+'" alt=""></div>';
            }
        });
        
        photos += '</div></div></div>';
        
        $('#photos').html(photos);
        
        var siteSwiper = new Swiper('.swiper-container',{
                mode:'horizontal',
                loop: false,
                speed:1000,
                calculateHeight: true,
                autoResize: true,
                slidesPerView: 1,
                autoplay: 1000
            });
    });
    
    $.mobile.changePage('#site-description',{transition: "slide"});
};

function showOffersForSite (siteId) {
    offersURL = BaseApiURL+'/whitelabel/'+WhitelabelId+'/site/'+siteId+'/offer';
    
    var offers = [];
    
    $('#site-itens').panel( "open" );
    
    $('#site-itens ul').empty();
    
    $.getJSON(offersURL, function(data){
        if(data !== null) {
            localStorage['offer:'+siteId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['offer:'+siteId]);
        }

        $.each(data, function (key, row) {
            $('#site-itens ul').append('<li><a>'+'<h2>'+row['title']+'</h2>'+
            '<p>'+row['description']+'</p>'+
            '<p>'+row['monetary']+''+row['value']+'</p>'+
            '</a></li>');
        });
    });    

    $('#site-itens ul').listview('refresh');    
};

function showSitesByCategory (categoryId) {
    var categoryURL = BaseApiURL+'/whitelabel/'+WhitelabelId+'/category/'+categoryId+'/site';
    myLat = DefaultMapLat;
    myLong = DefaultMapLon;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition (function (position){
            myLat = position.coords.latitude;
            myLong = position.coords.longitude;
        });
    }
    
    $.getJSON(categoryURL, function(data){
        var itens = [];
        
        if(data !== null) {
            localStorage['category:'+categoryId] = JSON.stringify(data);
        } else {
            data = JSON.parse(localStorage['category:'+categoryId]);
        }
        
        $.each(data, function (key, row) {
            lat = row['latitude'];
            long = row['longitude'];
            
            distance = Math.round(getDistanceFromLatLonInKm(lat, long, myLat, myLong))/100;
            distance = distance < 1 ? (distance*1000)+'m' : distance + 'km';

            thumbSize = $(document).width() < 768 ? 80 : 230;
            itens.push('<li><a onclick="showSiteDescription('+row['site_id']+')">'+
                '<img src="'+categoryURL+'/'+row['site_id']+'/logo?thumb='+thumbSize+'" class="ui-li-thumb" alt="">'+
                '<h2>'+row['title']+'</h2>'+
                '<p class="description-on-list">'+row['description']+'</p>'+
                '<p class="ui-li-aside">a '+distance+'</p></a></li>');
        });
        
        $('#sites-ul').html(itens.join(''));
        
        $('#sites-ul').listview('refresh');
    });
    
    $.mobile.changePage('#sites',{transition: "slide"});
};

mapApiLoaded = false;
mapOptions = false;
mapObj = false;
siteMarker = false;
clientMarker = false;
logLatList = [];

function showMapForSite (lat,log) { 
    Zoom = MapZoomDefault;
    Styles = MapStyles;
    
    if( !mapApiLoaded ) {
        $.getScript("https://maps.googleapis.com/maps/api/js?key="+MapKey+"&sensor=true&async=3&callback=createMap", function(){
            mapApiLoaded = true;

            $.ajaxSetup({ cache: false });
        });
    } else {
        setSiteMarker();
        
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(setClientMarker);
        }
        
        bounds = new google.maps.LatLngBounds ();
        for (var i = 0, LtLgLen = logLatList.length; i < LtLgLen; i++) {
            bounds.extend (logLatList[i]);
        }
        //  Fit these bounds to the map
        mapObj.fitBounds (bounds);
    }
    
    $.mobile.changePage('#site-map',{transition: "slide"});
};

function createMap () {
    siteLat = siteDescription['latitude'];
    siteLog = siteDescription['longitude'];
    
    siteLocation = new google.maps.LatLng(siteLat, siteLog);
    
    mapOptions = {
        zoom: MapZoomDefault,
        backgroundColor: '#26262d',
        styles: Styles,
        center: siteLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        panControl: false,
        scaleControl: false,
        mapTypeControl: false,
        disableDefaultUI: true,
        maxZoom: 19,
        minZoom: 8,
        tilt: 45
    };
    
    mapObj = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    setSiteMarker();
    
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setClientMarker);
    }
    
    bounds = new google.maps.LatLngBounds ();
    for (var i = 0, LtLgLen = logLatList.length; i < LtLgLen; i++) {
        bounds.extend (logLatList[i]);
    }
    mapObj.fitBounds (bounds);
}

function setSiteMarker () {
    siteLat = siteDescription['latitude'];
    siteLog = siteDescription['longitude'];
    
    siteLocation = new google.maps.LatLng(siteLat, siteLog);
    
    logLatList.push(siteLocation);
    
    mapObj.setCenter(siteLocation);
    
    siteMarker = new google.maps.Marker({
        map: mapObj, 
        position: siteLocation,
        animation: google.maps.Animation.DROP,
        icon: 'style/images/icons/site-location.png',
        title: siteDescription['title'],
        visible: true
    });
}

function setClientMarker (position) {
    lat = position.coords.latitude;
    log = position.coords.longitude;
    
    clientLocation = new google.maps.LatLng(lat, log);
    logLatList.push(clientLocation);    
    
    siteMarker = new google.maps.Marker({
        map: mapObj, 
        position: clientLocation,
        icon: 'style/images/icons/user-location.png',
        visible: true
    });
}

function backFromMap () {
    window.history.back();
    logLatList = [];
    
    siteMarker.setMap(null);
    siteMarker = null;
    clientMarker.setMap(null);        
    clientMarker = null;
}

/* Funções de distancia*/

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}




