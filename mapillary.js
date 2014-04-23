
idList = []; //Liste der schon in GeoJSON gerenderten IDs

function loadMapillaryJSON (minlat, maxlat, minlon, maxlon) {
	var APIURL = "https://api.mapillary.com/v1/s/search";
	var parameter = {
		"min-lat": minlat,
		"max-lat": maxlat,
		"min-lon": minlon,
		"max-lon": maxlon
	}
	$.getJSON(APIURL, parameter)
		.done(function (data) {
			writeMapillaryGPX(data);
		})
		.fail(function () {
			//UI Elemente wieder zurücksetzten
			$('#downloadbutton').html('Download GPX');
			$('#downloadbutton').removeAttr('disabled');
			$("#errormessage").show(); 
			
		});
}

function writeMapillaryGPX (data) {
	var waypoints = "";
	$.each(data, function (index, element){
		$.each(element.map_images, function (index, element){
			waypoints += "\t<wpt lat=\"" + element.lat + "\" lon=\""+ element.lon + "\">\n";
			waypoints += "\t\t<course>" + element.ca + "</course>\n";
			waypoints += "\t\t<link href=\"" + element.versions["thumb-2048"] + "\"/>\n";
			waypoints += "\t</wpt>\n";
		});
	});
	var gpx = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\" ?>\n";
	gpx += "<gpx version=\"1.1\" creator=\"mappilary2GPX\">\n"; 
	gpx += "\t<metadata> <!-- Metadaten --> </metadata>\n";
	gpx += waypoints;
	gpx += "</gpx>";

	writeToFile(gpx);
}

function download(filename, text) {
	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	pom.setAttribute('download', filename);
	pom.click();
}

function writeToFile (gpx) {
	download('mapillary.gpx',gpx);

	//UI Elemente wieder zurücksetzten
	$('#downloadbutton').html('Download GPX');
	$('#downloadbutton').removeAttr('disabled');

}

function initleaflet (){
	map = L.map('map').setView([51.0474, 13.7384], 13);
	if(L.Browser.retina) var tp = "lr";
		else var tp = "ls";
	L.tileLayer('http://tiles.lyrk.org/'+tp+'/{z}/{x}/{y}?apikey=8e6947d30d9445ba898406468d268885', {
		attribution: 'Bilder: <a href="http://www.mapillary.com/">Mapillary</a>, Karte: <a href="http://geodienste.lyrk.de/copyright">OpenStreetMap und andere</a>, Tiles by <a href="http://geodienste.lyrk.de/">Lyrk</a>',
		maxZoom: 18
	}).addTo(map);
	L.tileLayer('http://{s}.tiles.mapillary.com/{z}/{x}/{y}', {
		maxZoom: 18
	}).addTo(map);
	//map.on('moveend', function(){addGeoJSON();});
}

function loadFromMap () {
	var s = map.getBounds().getSouthWest().lat;
	var n = map.getBounds().getNorthEast().lat;
	var w = map.getBounds().getSouthWest().lng;
	var e = map.getBounds().getNorthEast().lng;

	//downloadbutton disablen
	$('#downloadbutton').attr('disabled','disabled');
	$('#downloadbutton').html('<img src="./img/loading.gif"/>');
	$("#errormessage").hide(); 
	loadMapillaryJSON (s,n,w,e);


}

function addGeoJSON() {
	var s = map.getBounds().getSouthWest().lat;
	var n = map.getBounds().getNorthEast().lat;
	var w = map.getBounds().getSouthWest().lng;
	var e = map.getBounds().getNorthEast().lng;

	geojsonLayer = new L.GeoJSON.AJAX("http://api.mapillary.com/v1/s/search?min-lat="+s+"&max-lat="+n+"&min-lon="+w+"&max-lon="+e+"&geojson=true",{
			middleware:function(data){
				//testen ob GeoJSON Objekt mit diesem Key schon gerendert wurde und wenn ja raus werfen. Sonst rendern und key in die Liste der gerenderten Objekte rein werfen
				$.each(data.features, function (k, value){
					
					key = data.features[k].properties.key;
					if (idList.indexOf(key)==-1){
						idList.push(key);
					}
					else {
						//element wurde schon gerendert
						data.features[k] = false;
					}
				});
				return data;
			}
		});
	
	geojsonLayer.addTo(map);
}

function suchen () {
	var suchebegriff = $("#suche").val();
	var APIURL = "http://nominatim.openstreetmap.org/search";
	var parameter = {
		"q": suchebegriff,
		"format": "json"
	}

	$.getJSON(APIURL, parameter)
		.done(function (data) {
			console.log(data[0].lat)
			map.panTo([data[0].lat,data[0].lon], {animate:true})
	});
}

//initial auf
$(function(){ 
	//Karte Initialisieren
	initleaflet();
	//fehlermeldung ausblenden
	$("#errormessage").hide(); 

	$("#suche").keypress(function(e) {
		if(e.which == 13) {
			suchen();
		}
	});

	//geoJSON initial laden
	addGeoJSON();
});

