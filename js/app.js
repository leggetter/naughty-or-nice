(function() {

	/* UI Components */

	var isRunning = true;
	var button = document.getElementById('toggle');

	button.addEventListener('click', function(e){
		if(isRunning) {
			pusher.unsubscribe( 'tweets' );
			button.value = 'Stream again';
			isRunning = false;
		} else {
			getStreamData();
			button.value = 'Stop me!';
			isRunning = true;
		}

	}, false);


	/* Emotional Data */

	var tally = {};

	var niceColor = 'green';
	var naughtyColor = 'red';
	var neutralColor = '#DECEB3';

	var nice = {
		type: 'nice',
		icon: 'santa.png'
	};
	var naughty = {
		type: 'naughty',
		icon: 'grinch.png'
	};

	var niceWords = [
		 'excellent', 'amazing', 'beautiful', 'nice', 'marvelous', 'magnificent', 'fabulous', 'astonishing', 'fantastic', 'peaceful', 'fortunate',
		 'brilliant', 'glorious', 'cheerful', 'gracious', 'grateful', 'splendid', 'superb', 'honorable', 'thankful', 'inspirational',
		 'ecstatic', 'victorious', 'virtuous', 'proud', 'wonderful', 'lovely', 'delightful', 'happy', 'lucky', 'awesome', 'excited', 'fun', 'amusing', 'amused', 'pleasant', 'pleasing', 'glad', 'enjoy',
		'jolly', 'delightful', 'joyful', 'joyous', ':-)', ':)', ':-D', ':D', '=)','☺', 'love', 'adore', 'blissful', 'heartfelt', 'loving', 'lovable', 'sweetheart', 'darling', 'kawaii', 'married', 'engaged'
	];
	var naughtyWords = [
		'unhappy', 'bad', 'sorry', 'annoyed', 'dislike', 'anxious', 'ashamed', 'cranky', 'crap', 'crappy', 'envy',
		'awful', 'bored', 'boring', 'bothersome', 'bummed', 'burned', 'chaotic', 'defeated', 'devastated', 'stressed',
		'disconnected', 'discouraged', 'dishonest', 'doomed', 'dreadful', 'embarrassed', 'evicted', 'freaked out', 'frustrated', 'stupid',
		'guilty', 'hopeless', 'horrible', 'horrified', 'humiliated', 'ignorant', 'inhumane', 'cruel', 'insane', 'insecure',
		'nervous', 'offended', 'oppressed', 'overwhelmed', 'pathetic', 'powerless', 'poor', 'resentful', 'robbed', 'screwed', 'sad', 'alone', 'anxious', 'depressed', 'disappointed', 'disappointing', 'sigh', 'sobbing', 'crying', 'cried',
		'dumped', 'heartbroken', 'helpless', 'hurt', 'miserable', 'misunderstood', 'suicidal', ':-(', ':(', '=(', ';(', 'hate', 'damn', 'angry', 'betrayed', 'bitched','disgust', 'disturbed', 'furious', 'harassed', 'hateful', 'hostile', 'insulted', 'irritable', 'jealous', ' rage ', 'pissed' ];


	/* D3  */

	var width = 900;
	var height = 540;

	var projection = d3.geo.mercator()
		.scale((width + 1) / 2 / Math.PI)
		.translate([width / 2, height / 2])
		.precision(.1);

	var path = d3.geo.path()
		.projection(projection);

	var graticule = d3.geo.graticule();

	var svg = d3.select('#map').append('svg')
		.attr('width', width)
		.attr('height', height);

	svg.append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", path);

	var color = d3.scale.linear()
		.domain([0, 15])
		.range(['#5b5858', '#4f4d4d', '#454444', '#323131']);

	var g = svg.append('g');

	var countryLookup = {};

	d3.json( 'json/country-lookup.json', function(error, data) {
		data.forEach( function( country ) {
			countryLookup[ country[ 'alpha-2' ] ] = country;
		} );
	});

	d3.json("json/world-50m.json", function(error, topology) {

    g.selectAll('path')
		.data(topojson.feature(topology, topology.objects.countries).features)
		.enter()
		.append('path')
		.attr('class', function(d){ var className = 'countries country-' + d.id; return className; } )
		.attr('d', path)
		.attr('fill', function(d, i) { return color(i); });
	});

	var faceIcon = svg.selectAll('image').data([0]);


	/* Pusher */

	var channel = 'tweets';

	var pusher = new Pusher( '5adb2ced9a7f34b87aa9' );

	function getStreamData() {
		var tweets = pusher.subscribe( 'tweets' );
		tweets.bind( 'new-tweet', processData );
	}

	function getUserInfo(data, callback) {
		var userInfo = {};

		userInfo.lat = data.geo.coordinates[0];
		userInfo.lon = data.geo.coordinates[1];

		if(userInfo.lat === 0 && userInfo.lon === 0) return;

		var city = data.place.full_name;
		userInfo.country = countryLookup[ data.place.country_code ];

		userInfo.name = data.user.name;
		userInfo.screenname = data.user.screen_name;
		userInfo.avatar = data.user.profile_image_url;
		userInfo.tweet = data.text;
		userInfo.id_str = data.id_str;

		var date = new Date(parseInt(data.timestamp_ms));
		var d = date.toDateString().substr(4);
		var t = (date.getHours() > 12) ? date.getHours()-12 + ':' + date.getMinutes() + ' PM' : date.getHours() + ':' + date.getMinutes() +' AM;';

		userInfo.timestamp = t + ' - ' + d;

		console.log(userInfo.tweet);
		callback(userInfo);
	}

	function insertLinks(text) {
        return text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function(url){return '<a href="'+url+'" >'+url+'</a>';});
    }

	function displayData(data, emotion) {

		getUserInfo(data, function(user){
			document.querySelector('.emotion').style.backgroundImage = 'url(images/'+ emotion.icon +')';

			document.querySelector('.button').href = 'https://twitter.com/' + user.screenname;
			document.querySelector('.header').style.backgroundImage = 'url('+ user.avatar +')';
			document.querySelector('.name').textContent = user.name;
			document.querySelector('.screenname').textContent = '@' + user.screenname;
			document.querySelector('.text').innerHTML = twemoji.parse(insertLinks(user.tweet));
			document.querySelector('.timestamp').textContent = user.timestamp;

			document.querySelector('.reply').href ='https://twitter.com/intent/tweet?in_reply_to=' + user.id_str;
			document.querySelector('.retweet').href = 'https://twitter.com/intent/retweet?tweet_id=' + user.id_str;
			document.querySelector('.favorite').href = 'https://twitter.com/intent/favorite?tweet_id=' + user.id_str;

			document.querySelector('.tweet').style.opacity = 0.9;

			var countryCode = user.country[ 'country-code' ];
			if(document.querySelector('.country-'+countryCode)) {
				tally[countryCode] = (tally[countryCode] || {nice: 0, naughty: 0});
				tally[countryCode][emotion.type] = (tally[countryCode][emotion.type] || 0) + 1;

				var countryEl = document.querySelector('.country-'+countryCode);
				countryEl.style.fill = (tally[countryCode].nice > tally[countryCode].naughty) ? niceColor : ((tally[countryCode].nice < tally[countryCode].naughty) ? naughtyColor :neutralColor);

				countryEl.setAttribute('data-nice', tally[countryCode].nice);
				countryEl.setAttribute('data-naughty', tally[countryCode].naughty);
			}

			// Place emotion icons

			var position = projection([user.lon, user.lat]);
			if(position === null) return;

			var emoji = faceIcon.enter()
				.append('svg:image');

			emoji.attr('xlink:href', 'images/'+ emotion.icon)
				.attr('width', '26').attr('height', '26')
        .attr('transform', function(d) {return 'translate(' + position + ')';});

			// setTimeout( function() {
			// 	emoji.remove();
			// }, 180 * 1000 )
		});
	}

	function processData(data) {
		// console.log( data );

		if (naughtyWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, naughty);
		}
		else if (niceWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, nice);
		}
	}

	getStreamData();

})();
