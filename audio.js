
function textToElement(text) {
    const div  = document.createElement('div');
    div.innerHTML = text;
    return div.children[0];
}


mapboxgl.accessToken = 'pk.eyJ1Ijoid3d3bWFzdGVyMSIsImEiOiJjazZmbmxhYngwYjQxM2xtdDdwMjJzYjdnIn0._QtAdUTg9NtC9_R8Caq6Ng';

class GlMap extends mapboxgl.Map {
   
    constructor(accessToken) {
        super({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [ -107.81136, 37.93778 ],
            zoom: 15
        });

        this.setMouseEvents();
        this.on('load', this.onLoad.bind(this));
    }

    async onLoad() {
        const { features, series } = await this.getAllGeoData();
        this.addSources(features, series);
        this.addLayers();
    }

    setMouseEvents() {
        this.on('mouseenter', 'features', () => {
			this.getCanvas().style.cursor = 'pointer';
		});

		this.on('mouseleave', 'features', () => {
			this.getCanvas().style.cursor = '';
		});
			
		this.on('mouseenter', 'series', () => {
			this.getCanvas().style.cursor = 'pointer';
		});

		this.on('mouseleave', 'series', () => {
			this.getCanvas().style.cursor = '';
		});
    }

    async getAllGeoData() {
        const res = await (await fetch('http://52.90.82.235:8888/geotourdata/json.cfm?h=-107,37,s,en,3A771765')).json();

        let features = res.features.filter(elem => elem.type === 'Feature');
        let series = res.features.filter(elem => elem.type === 'Series');
console.log(series)
        features = features.map(f => {
            return {
                ...f,
                ...f.geojson
            };
        });       

        series = series.map(s => {
            return {
                ...s,
                ...s.geojson
            };
        });    

        return {
            features: { 
                type : 'FeatureCollection',
                features
            },
            series: {
                type: 'FeatureCollection',
                series 
            }
        };
    }

    addSources(features, series) {
        this.addSource('AllFeatures', {
            type: 'geojson',
            generateId: true,
            data: features
        });

        this.addSource('AllSeries', {
            type: 'geojson',
            generateId: true,
            data: features
        });
    }

    addLayers() {
        this.addLayer({
			'id': 'series',
			'type': 'fill',
			'source': 'AllSeries',
			"minzoom": 15,
			'paint': {
				'fill-color':
				['case',
					['==', ['get', 'status'], 'disabled'],
					'#FFC500',
					['boolean',
						['feature-state', 'visited'], false], 
				'#666666','#FF0000'
				],
				'fill-opacity':
				['case',
					['boolean', 
						['feature-state', 'clicked'], false],
				.3,.1
				]
			},			
			'filter': ['==', '$type', 'Polygon']
        });
        
        this.addLayer({
			'id': 'features',
			'type': 'line',
			'source': 'AllFeatures',
			"minzoom": 15,
			'layout': {
				'line-join': 'round',
				'line-cap': 'round'
			},
			'paint': {
				'line-color':
				['case',
					['==', ['get', 'status'], 'disabled'],
					'#FFC500',
					['boolean', 
						['feature-state', 'visited'], false], 
				'#AAAAAA','#00FF00'
				],
				'line-opacity':
				['case',
					['boolean', 
						['feature-state', 'clicked'], false],
				.9,.6
				],
				'line-width': 8
			}
		});
    }

    queryRenderedFeaturesByLang(point, lang) {
        let features = this.queryRenderedFeatures(point, { layers: [ 'allFeatures', 'allSeries' ]});
        return features.filter(f => f.languages.includes(lang));
    }
}

/***********************************************************************************/

class Track extends HTMLElement {

    constructor() {
        super();
        this.id = this.getAttribute('id');
        this.name = name;
        this.duration = duration;
        
        this.renderHTML();
    }

    onclick() {

    }

    renderHTML() {
        const elem = textToElement(
            `
                <li> 
                    <div class="plItem"> 
                        <span class="plNum"> ${this.id} .</span> 
                        <span class="plTitle"> ${this.name} </span> 
                        <span class="plLength"> ${this.duration} </span> 
                    </div> 
                </li>
            `
        );

        elem.onclick = this.onClick.bind(this);
        this.append(elem);
    }
}

window.customElements.define('track-elem', Track);
/***********************************************************************************/

class AudioPlayer extends HTMLElement {

    constructor() {
        super();
        this.renderHTML();
        this.addEventListeners();

        this.map = this.createMap();
    }

    addEventListeners() {
        const createEventListener = function(photoDisp, mapDisp, plDisp) {
            return function () {
                document.getElementById('audio-player-tools-container').style.bottom = this.offsetHeight + 'px';
                document.getElementById('audio-player-tools-container').style.overflowY = "hidden";
                document.getElementById('photowrap').style.display = photoDisp;
                document.getElementById('plwrap').style.display = plDisp;
                document.getElementById('mapwrap').style.display = mapDisp;
            }
        }

        document.getElementById('btnMap').onclick = createEventListener('none', 'block', 'none');
        document.getElementById('btnPlaylist').onclick = createEventListener('none', 'none', 'block');
        document.getElementById('btnPhotos').onclick = createEventListener('block', 'none', 'none');
    }

    createMap() {
        const map = new GlMap(this.API_KEY);
        map.on('click', this.onMapClick.bind(this));

        return map;
    }

    onMapClick(e) {
        const selectedLang = "en-US";
        const features = this.map.queryRenderedFeaturesByLang(e.point, selectedLang);
        if (!features.length) {
            return;
        }

        const firstFeature = features[0];
        const songs = feature.assets.filter(asset => asset.language === selectedLang);
        console.log(songs)

        this.updatePhoto(firstFeature);
        this.updateTrackList(firstFeature, songs);
        this.updateAudioSource(songs);
        
    }

    updatePhoto(feature) {
        const photo = document.getElementById('photo');
        if (feature.photo || feature.photolink) {
            photo.src = feature.photo || feature.photolink;
            photo.style.display = 'inline';
        } else {
            photo.style.display = 'none';
        }
        
    }

    updateAudioSource(songs) {
        const audio = document.getElementById('audio');
        audio.src = songs[0].audio;
    }

    updateTrackList(feature, songs) {
        const elems = songs.map(song =>  {
            return (`
                <track-elem id='${song.id}' name='${feature.name}' duration=5 >
                </track-elem>
            `);
        });

        document.getElementById('plList').innerHTML = elems.join('\n');
    }

    renderHTML() {
        const template = document.createElement('div');
        template.innerHTML = `
        <link rel="stylesheet" href="plyr.css">
        <link rel="stylesheet" href="app.css">
        <div id="audio-player-tools-container">
            <div id="photowrap">
                <img  id="photo" src="https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/landscaping-ideas-1582321830.jpg" alt="">
            </div>
            <div id="plwrap">
                <ul id="plList"></ul>
            </div>
            <div id="mapwrap">
                <div id="map"></div>
            </div>
        </div>
        <div id="current-playing-container">
            <div class="column">
                <div id="mainwrap">
                    <div id="nowPlay">
                        <span id="npTitle"></span>
                        <span id="npAction">
                            <div class="btnwrap">
                                <button id="btnPhotos" data-for="photo"><i class="fa fa-picture-o" aria-hidden="true"></i></button> 
                                <button id="btnPlaylist" data-for="playlist"><i class="fa fa-list-ul" aria-hidden="true"></i></button>
                                <button id="btnMap" data-for="map"><i class="fa fa-map" aria-hidden="true"></i></button>
                            </div>
                        </span>
                    </div>
                    <div id="audiowrap">
                        <div id="audio0">
                            <audio id="audio" src="./music/01 African Giant.mp3" controls>Your browser does not support HTML5 Audio! 😢</audio>
                        </div>
                        <div id="tracks">
                            <a id="btnPrev">&#8617;</a><a id="btnNext">&#8618;</a>
                            <select id="language" placeholder="Language" name="language" class="language-select">
                                <option title="English" r-value="1" value="en">English</option>
                                <option title="Afrikaans" r-value="" value="af" disabled="">Afrikaans (af)</option>
                                <option title="Arabic" r-value="8" value="ar">عربي (ar)</option>
                                <option title="Azerbaijani" r-value="" value="az" disabled="">Azərbaycanca (az)</option>
                                <option title="Bambara" r-value="" value="bm" disabled="">Bamanankan (bm)</option>
                                <option title="Bengali (Bangladesh)" r-value="" value="bn-BD" disabled="">বাংলা (বাংলাদেশ) (bn-BD)</option>
                                <option title="Bengali (India)" r-value="" value="bn-IN" disabled="">বাংলা (ভারত) (bn-IN)</option>
                                <option title="Catalan" r-value="" value="ca" disabled="">Català (ca)</option>
                                <option title="Czech" r-value="" value="cs" disabled="">Čeština (cs)</option>
                                <option title="Chinese (Simplified)" r-value="9" value="zh-CN">中文 (简体) (zh-CN)</option>
                                <option title="Chinese (Traditional)" r-value="" value="zh-TW" disabled="">正體中文 (繁體) (zh-TW)</option>
                                <option title="Danish" r-value="14" value="da">Dansk (da)</option>
                                <option title="German" r-value="10" value="de">Deutsch (de)</option>
                                <option title="Ewe" r-value="" value="ee" disabled="">Eʋe (ee)</option>
                                <option title="Greek" r-value="" value="el" disabled="">Ελληνικά (el)</option>
                                <option title="Spanish" r-value="5" value="es">Español (es)</option>
                                <option title="Persian" r-value="" value="fa" disabled="">فارسی (fa)</option>
                                <option title="Fulah" r-value="" value="ff" disabled="">Pulaar-Fulfulde (ff)</option>
                                <option title="Finnish" r-value="" value="fi" disabled="">suomi (fi)</option>
                                <option title="French" r-value="6" value="fr">Français (fr)</option>
                                <option title="French" r-value="7" value="fr-ca">Français Canadien (fr-ca)</option>
                                <option title="Frisian" r-value="" value="fy-NL" disabled="">Frysk (fy-NL)</option>
                                <option title="Irish" r-value="" value="ga-IE" disabled="">Gaeilge (ga-IE)</option>
                                <option title="Hausa" r-value="" value="ha" disabled="">Hausa (ha)</option>
                                <option title="Hebrew" r-value="" value="he" disabled="">עברית (he)</option>
                                <option title="Hindi (India)" r-value="3" value="hi-IN">हिन्दी (भारत) (hi-IN)</option>
                                <option title="Croatian" r-value="" value="hr" disabled="">Hrvatski (hr)</option>
                                <option title="Hungarian" r-value="22" value="hu">magyar (hu)</option>
                                <option title="Indonesian" r-value="" value="id" disabled="">Bahasa Indonesia (id)</option>
                                <option title="Igbo" r-value="" value="ig" disabled="">Igbo (ig)</option>
                                <option title="Italian" r-value="11" value="it">Italiano (it)</option>
                                <option title="Japanese" r-value="12" value="ja">日本語 (ja)</option>
                                <option title="Georgian" r-value="" value="ka" disabled="">ქართული (ka)</option>
                                <option title="Kabyle" r-value="" value="kab" disabled="">Taqbaylit (kab)</option>
                                <option title="Korean" r-value="13" value="ko">한국어 (ko)</option>
                                <option title="Lingala" r-value="" value="ln" disabled="">Lingála (ln)</option>
                                <option title="Malagasy" r-value="" value="mg" disabled="">Malagasy (mg)</option>
                                <option title="Malayalam" r-value="" value="ml" disabled="">മലയാളം (ml)</option>
                                <option title="Malay" r-value="" value="ms" disabled="">Melayu (ms)</option>
                                <option title="Norsk" r-value="21" value="no">Norsk (no)</option>
                                <option title="Burmese" r-value="" value="my" disabled="">မြန်မာဘာသာ (my)</option>
                                <option title="Dutch" r-value="4" value="nl">Nederlands (nl)</option>
                                <option title="Polish" r-value="20" value="pl">Polski (pl)</option>
                                <option title="Portuguese (Brazilian)" r-value="" value="pt-BR" disabled="">Português (do Brasil) (pt-BR)</option>
                                <option title="Portuguese (Portugal)" r-value="15" value="pt-PT">Português (Europeu) (pt-PT)</option>
                                <option title="Romanian" r-value="19" value="ro">Română (ro)</option>
                                <option title="Russian" r-value="16" value="ru">Русский (ru)</option>
                                <option title="Songhai" r-value="" value="son" disabled="">Soŋay (son)</option>
                                <option title="Albanian" r-value="" value="sq" disabled="">Shqip (sq)</option>
                                <option title="Serbian" r-value="" value="sr" disabled="">Српски (sr)</option>
                                <option title="Serbian" r-value="" value="sr-Latn" disabled="">Srpski (sr-Latn)</option>
                                <option title="Swedish" r-value="18" value="sv-SE">Svenska (sv-SE)</option>
                                <option title="Swahili" r-value="" value="sw" disabled="">Kiswahili (sw)</option>
                                <option title="Tamil" r-value="" value="ta" disabled="">தமிழ் (ta)</option>
                                <option title="Thai" r-value="" value="th" disabled="">ไทย (th)</option>
                                <option title="Tagalog" r-value="" value="tl" disabled="">Tagalog (tl)</option>
                                <option title="Tswana" r-value="" value="tn" disabled="">Setswana (tn)</option>
                                <option title="Turkish" r-value="17" value="tr">Türkçe (tr)</option>
                                <option title="Ukrainian" r-value="" value="uk" disabled="">Українська (uk)</option>
                                <option title="Vietnamese" r-value="" value="vi" disabled="">Tiếng Việt (vi)</option>
                                <option title="Wolof" r-value="" value="wo" disabled="">Wolof (wo)</option>
                                <option title="Welsh" r-value="2" value="cy" disabled="">Cymraeg (cy)</option>
                                <option title="Xhosa" r-value="" value="xh" disabled="">isiXhosa (xh)</option>
                                <option title="Yoruba" r-value="" value="yo" disabled="">Yorùbá (yo)</option>
                                <option title="Zulu" r-value="" value="zu" disabled="">isiZulu (zu)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        this.classList.add('audio-player-container');
        this.appendChild(template);
    }

}

window.customElements.define('.audio_player', AudioPlayer);
