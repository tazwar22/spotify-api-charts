// REQUIRE D3 AND BRITECHARTS
var britecharts = britecharts;
var d3 = d3;
var miniToolTip = miniToolTip;
var colors = colors;

// SET UP HANDLEBARS
Handlebars.templates = Handlebars.templates || {};
var templates = document.querySelectorAll('template');
Array.prototype.slice.call(templates).forEach(function(tmpl) {
    Handlebars.templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML.replace(/{{&gt;/g, '{{>'));
});

// SPOTIFY IMPLICIT GRANT AUTH ===========================================================================
const hash = window.location.hash.substring(1).split('&').reduce(function(initial, item) {
    if (item) {
        var parts = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
}, {});
window.location.hash = '';

// Set token
let access_token = hash.access_token;

const authEndpoint = 'https://accounts.spotify.com/authorize';
// my app's client ID, redirect URI and desired scopes
const clientId = '12338ce6eaaf45e3bca434aa434f4994';
const redirectUri = 'http://localhost:4000/callback';
const scopes = ['user-top-read', 'playlist-read-private', 'user-library-read'];



// If there is no token, redirect to Spotify authorization
if (!access_token) {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
}
// END SETUP ===========================================================================




// FIRST THING'S FIRST -- GET USER INFO. ===========================================================================
$(document).ready(function() {

    $.ajax({
        url: "https://api.spotify.com/v1/me",
        type: "GET",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        },
        success: function(data) {
            // Once I get the user info, set up the template and run everything
            document.body.innerHTML = Handlebars.templates.main({name: data.display_name});
            // startApp is everything
            startApp();
        }
    });
});



var topTracksData = {};


// START APP ===========================================================================
function startApp() {

    // show and hide audio definitions
    $('.showDefinitions').on('click', function() {
        $('.definitions').fadeIn('fast');
    });

    $('.hideDefinitions').on('click', function() {
        $('.definitions').hide();
    });



    // Navigation
    $('#enter').on('click', function() {
        $('#intro').hide();
        $('#topArtists').fadeIn('fast');
    });

    $('#next1').on('click', function() {
        $('#topArtists').hide();

        // $('#myFaves').fadeIn('fast');
        // $('.definitions').hide();
        // $('.showDefinitions').hide();

        //Show the last section instead
        $('#end').fadeIn('fast');

    });





    $('#back1').on('click', function() {
        $('#topArtists').fadeIn('fast');
    });
















    $('#next3').on('click', function() {
        $('#myFaves').hide();
        $('#trackSearch').fadeIn('fast');
        $('.definitions').hide();
        $('.showDefinitions').hide();
    });

    $('#back3').on('click', function() {
        $('#myFaves').hide();
        $('#topArtists').fadeIn('fast');
        $('.definitions').hide();

    });

    $('#next4').on('click', function() {
        $('#trackSearch').hide();
        $('#end').fadeIn('fast');
        $('.definitions').hide();
    });

    $('#back4').on('click', function() {
        $('#trackSearch').hide();
        $('#myFaves').fadeIn('fast');
        $('.definitions').hide();
    });





    
    $('#restart').on('click', function() {
        $('#end').hide();
        $('#intro').fadeIn('fast');
    });







    // USER TOP ARTISTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $('#enter , #medium_term, #short_term, #long_term').on('click', function() {

        console.clear()
        var period = "medium_term"  //Default

        if (this.id == 'enter'){
            console.log("ENTERING...")
        }
        else {
            period = this.id.toString();
        }
        console.log(`Getting data for ${period}`);


        //Form proper query
        var queryURL = `https://api.spotify.com/v1/me/top/artists?time_range=${period}&limit=50&offset=0`;


        //Get top tracks and store in memory
        $.ajax({
            url: `https://api.spotify.com/v1/me/top/tracks?time_range=${period}&limit=50&offset=0`,
            type: "GET",
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function(data) {


                window.topTracksData = {} //Refresh


                data.items.forEach((entry, ii)=>{
                    let songName = entry.name,
                        artistsOnTrack = entry.artists;
                    
                    artistsOnTrack.forEach((entry, ii)=>{

                        let artist = entry.name


                        // console.log(`Artist: ${artist}`)

                        if (artist in topTracksData) {
                            // console.log("Artist already in DICT...");
                            window.topTracksData[artist].push(songName);
                        }else{
                            var mostListenedTracks = new Array(songName)
                            window.topTracksData[artist] = mostListenedTracks //Initialize
                        }
                    })
                    

                })


                
                console.log("Done forming dictionary... \n")
                var preMyJSON = JSON.stringify(data.items);
                var myJSON = JSON.parse(preMyJSON);

                console.log("Successfully got data from Spotify... calling D3.JS");

                $.ajax({
                    url: queryURL,
                    type: "GET",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                    },
                    success: function(data) {


                        var temp = data.items[0];
                        data.items.unshift(temp);
                        var preMyJSON = JSON.stringify(data.items);
                        var myJSON = JSON.parse(preMyJSON);

                        console.log("Successfully got data from Spotify... calling D3.JS");

                        //This function draws the Bubble chart
                        var chart = bubbleChart(myJSON);

                        d3.select('#bubbleChart').selectAll("svg").remove();
                        d3.select('#bubbleChart').append("svg")
                        d3.select('#bubbleChart').data(myJSON).call(chart);
                    }
                });
                

            }
        });


      
    });



    // // USER TOP ARTISTS SHORT TERM ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // $('#getTopArtistsShort').on('click', function() {
    //     $.ajax({
    //         url: "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",
    //         type: "GET",
    //         beforeSend: function(xhr) {
    //             xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    //         },
    //         success: function(data) {
    //             console.log("User top artists short term", data.items);

    //             // chart goes here

    //             data.items.map(function(artist) {
    //                 let item = $('<li>' + artist.name + '</li>');
    //                 item.appendTo($('#top-artists-short'));
    //             });
    //         }
    //     });
    // });







    // SEARCH INDIV TRACK ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $('form').submit(function(e) {

        let input = $('input').val();
        $('#clickedTrack').hide(200);
        $('#searchedTrack').empty();
        $('#error').empty();
        $('#indivAudioFeaturesChart').empty();

        if (input == '') {
            console.log("can't be empty");
            $('#error').append("Input can't be empty.");
        }
        let resultIDs = [];
        e.preventDefault();
        $('#results').empty();

        // ajax request to search for all songs with the same name
        $.ajax({
            url: "https://api.spotify.com/v1/search?",
            type: "GET",
            limit: 10,
            data: {
                query: input,
                type: 'track'
            },
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function(data, id) {
                $('#error').empty();
                if (data.tracks.items.length == 0) {
                    console.log("no results");
                    $('#error').append("No Results. Try again!");
                }
                // display search results
                data.tracks.items.forEach(function(track, index) {
                    resultIDs.push(track.id);
                    let newEl = $('<li onClick="trackFeatures(&apos;' + track.id + '&apos;)"></li>').text(track.name + '   |   ' + track.artists[0].name);

                    $('#results').append(newEl);
                });
            }
        });
    });






    // USER TOP TRACKS Long TERM ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $("#getFaveAudioFeatures").on('click', function() {
        $('#recentFaveFeatures').css("background-color", 'rgb(255, 255, 255)');
        $('#getFaveAudioFeatures').css("background-color", '#A2FBD0');
        $('.showDefinitions').fadeIn('fast');
        $('.recent').hide();
        $('.longterm').fadeIn('fast');
        $.ajax({
            url: "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50",
            type: "GET",
            dataType: "json",
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function(data) {
                // data to array
                var ids = data.items.map(function(track) {
                    return track.id;
                });

                // array to string
                var idString = ids.join();

                //call other function to do other ajax req
                getAudioFeatures(idString);
            }
        });

        function getAudioFeatures(idString) {
            $.ajax({
                url: "https://api.spotify.com/v1/audio-features?",
                type: "GET",
                data: {
                    ids: idString
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                },
                success: function(data) {
                    var totals = {
                        energy: 0,
                        danceability: 0,
                        liveness: 0,
                        acousticness: 0,
                        valence: 0,
                        tempo: 0,
                        duration_ms: 0,
                        speechiness: 0
                    };

                    data.audio_features.forEach(function(audioFeature) {
                        for (let prop in totals) {
                            totals[prop] += audioFeature[prop];
                        }
                    });

                    var averagesData = [
                        {
                            name: "energy",
                            description: "Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.",
                            value: totals.energy / data.audio_features.length
                        }, {
                            name: "danceability",
                            description: "Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.",
                            value: totals.danceability / data.audio_features.length
                        }, {
                            name: "liveness",
                            description: "Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.",
                            value: totals.liveness / data.audio_features.length
                        }, {
                            name: "acousticness",
                            description: "A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.",
                            value: totals.acousticness / data.audio_features.length
                        }, {
                            name: "valence",
                            description: "A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).",
                            value: totals.valence / data.audio_features.length
                        }, {
                            name: "speechiness",
                            description: "Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.",
                            value: totals.speechiness / data.audio_features.length
                        }
                    ];

                    console.log('sending averages to chart: ', averagesData);
                    avgAudioFeaturesChart(averagesData);
                }
            });
        }
    });

    // USER TOP TRACKS short TERM ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $("#recentFaveFeatures, #next1").click(function() {
        $('.longterm').hide();
        $('#recentFaveFeatures').css("background-color", '#A2FBD0');
        $('#getFaveAudioFeatures').css("background-color", 'rgb(255, 255, 255)');
        $('.recent').fadeIn('fast');
        $('.showDefinitions').fadeIn('fast');
        $.ajax({
            url: "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50",
            type: "GET",
            dataType: "json",
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function(data) {

                // data to array
                var ids = data.items.map(function(track) {
                    return track.id;
                });

                console.log(`Track IDs: ${ids}`)

                // array to string
                var idString = ids.join();

                console.log(`Track IDs: ${idString}`)

                //call other function to do other ajax req
                getAudioFeatures(idString);
            }
        });

        function getAudioFeatures(idString) {
            $.ajax({
                url: "https://api.spotify.com/v1/audio-features?",
                type: "GET",
                data: {
                    ids: idString
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                },
                success: function(data) {
                    var totals = {
                        energy: 0,
                        danceability: 0,
                        liveness: 0,
                        // instrumentalness: 0,
                        valence: 0,
                        tempo: 0,
                        duration_ms: 0,
                        speechiness: 0
                    };

                    data.audio_features.forEach(function(audioFeature) {
                        for (let prop in totals) {
                            totals[prop] += audioFeature[prop];
                        }
                    });

                    var averagesData = [
                        {
                            name: "energy",
                            description: "Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale. Perceptual features contributing to this attribute include dynamic range, perceived loudness, timbre, onset rate, and general entropy.",
                            value: totals.energy / data.audio_features.length
                        }, {
                            name: "danceability",
                            description: "Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.",
                            value: totals.danceability / data.audio_features.length
                        }, {
                            name: "liveness",
                            description: "Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.",
                            value: totals.liveness / data.audio_features.length
                        }, {
                            name: "acousticness",
                            description: "A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.",
                            value: totals.acousticness / data.audio_features.length
                        }, {
                            name: "valence",
                            description: "A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).",
                            value: totals.valence / data.audio_features.length
                        }, {
                            name: "speechiness",
                            description: "Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.",
                            value: totals.speechiness / data.audio_features.length
                        }
                    ];
                    console.log('sending averages to chart: ', averagesData);
                    avgAudioFeaturesChart(averagesData);
                }
            });
        }
    });

    // END OF STARTUP  =================================================
}

// EXTERNAL FUNCTIONS  =================================================

//bubbleChart
function bubbleChart() {

    console.log(window.topTracksData)


    var width = 1200,
        height = 1200,
        columnForColors = "name",
        columnForRadius = "index";

    function chart(selection) {



        var data = selection.enter().data();
        console.log(data)

        var div = selection,
            svg = div.selectAll('svg');





        // //Collect unique
        // let genreSet = new Set()
        // data.forEach((entry, ii)=>{
        //     let genres = entry.genres
        //     let primaryGenre = genres[0].split(" ");
        //     genreSet.add(primaryGenre[primaryGenre.length - 1]);
        // })

        // console.log(genreSet)

        // var centerFinder = {};
        // genreSet.forEach((entry, ii)=>{
        //     console.log(entry)
        //     centerFinder[entry] = (ii+1)*100;

        // })
        



        svg.attr('width', width).attr('height', height);

        var tooltip = selection
                .append("div")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("text-decoration", "none")
                .style("padding", "12px")
                .style("background-color", "rgb(230, 230, 230)")
                .style("border-radius", "4px")
                .style("text-align", "left")
                .style("font-family", "helvetica")
                .style("width", "200px").style("line-height", "150%").text("");







        var simulation = d3.forceSimulation(data)
                            .force("charge", d3.forceManyBody().strength([-400]))
                            .force("x", d3.forceX())
                            .force("y", d3.forceY())
                            .on("tick", ticked);






        function ticked(e) {
            node
            .attr("cx", function(d) {
                return d.x ;
            })
            .attr("cy", function(d) {
                return d.y ;
            });


            nodeLabels
            .attr('x', (data) => {
                return data.x-10;
            })
            .attr('y', (data) => {
                return data.y;
            });


        }


        function formatNumber(num) {
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
          }



        //Invert based on order
        var scaleRadius = d3.scaleLinear().domain([
            d3.max(data, function(d) {
                return + d[columnForRadius];
            })
            ,
            d3.min(data, function(d) {
                return + d[columnForRadius];
            }),
        ]).range([20, 50]);



        var colorScaler = d3.scaleSequential()
                            .domain([1, 50])
                            .interpolator(d3.interpolateBlues);



        //Manipulate the blobs
        var node = svg.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr('r', function(d) {
                    return scaleRadius(d[columnForRadius]);
                    })
                .style("fill", function(d) {
                    if (window.topTracksData[d.name]==undefined){return "red"}
                    return colorScaler(d.index+1);
                })
                .attr('transform', 'translate(' + [width / 2,height / 2] + ')')  //center everything
                .on("mouseover", function(d) {

                    d3.select(this)
                        .style('opacity', '0.6')
                        .style('stroke', "black")
                        .style("stroke-width", 8)

                    let artistImageTag = `<img src = "${d.images[1].url}" alt = "Artist Image" width="200" height="200">`

                    let htmlText = d[columnForColors] 
                                    + "<br>" + "Followers: " + formatNumber(d.followers.total)
                                    + "<br>" + "Popularity: " + d.popularity
                                    + "<br>"
                                    + artistImageTag;
                    tooltip.html(htmlText);
                    return tooltip.style("visibility", "visible");
                })
                .on("mousemove", function() {
                    return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function() {

                    d3.select(this)
                        .style('opacity', '1')
                        .style('stroke', "none")

                    return tooltip.style("visibility", "hidden");
                })
                .on("click", function(d){
                    // console.log(d);

                    console.log(window.topTracksData[d.name])
                    // d3.select('.selected-artist-box')
                    //     .html(JSON.stringify(topTracksData[d.name]))

                 


                });



            //Label the nodes
            let nodeLabels = svg.selectAll(null)
                .data(data)
                .enter()
                .append('text')
                .attr("pointer-events", "none")
                .text(d => (d.index+1).toString())
                .attr('color', 'white')
                .attr('font-size', 20)
                .attr('transform', 'translate(' + [width / 2,height / 2] + ')')  //center everything
    }



    chart.width = function(value) {
        // console.log(value)

        if (!arguments.length) {
            return width;
        }
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return chart;
    };


    return chart;
}













// GET: audio features based on single track
function trackFeatures(id) {
    $('#results').empty();
    $.ajax({
        url: "https://api.spotify.com/v1/audio-features/" + id,
        type: "GET",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        },
        success: function(data) {
            var features = [
                {
                    name: "energy",
                    value: data.energy
                }, {
                    name: "danceability",
                    value: data.danceability
                }, {
                    name: "liveness",
                    value: data.liveness
                }, {
                    name: "acousticness",
                    value: data.acousticness
                }, {
                    name: "valence",
                    value: data.valence
                }, {
                    name: "speechiness",
                    value: data.speechiness
                }
            ];
            indivAudioFeaturesChart(features);
        }
    });

    $.ajax({
        url: "https://api.spotify.com/v1/tracks/" + id,
        type: "GET",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        },
        success: function(name) {
            console.log("TRACK INFO", name);
            $('#searchedTrack').empty();
            $('#clickedTrack').fadeIn('fast');
            $('#searchedTrack').append(name.name + ' | ' + name.artists[0].name);
        }
    });
}






// CHART: individual audio features
function indivAudioFeaturesChart(features) {
    $('.showDefinitions').fadeIn('fast');

    $('#indivAudioFeaturesChart').empty();

    var barChart = new britecharts.bar();
    var chartTooltip = new britecharts.miniTooltip();

    var chartContainer = d3.select('#indivAudioFeaturesChart');
    var containerWidth = chartContainer.node()
        ? chartContainer.node().getBoundingClientRect().width
        : false;

    barChart.width(containerWidth).height(300).isAnimated(true).horizontal(false).percentageAxisToMaxRatio(1.3).on('customMouseOver', chartTooltip.show).on('customMouseMove', chartTooltip.update).on('customMouseOut', chartTooltip.hide).colorSchema(["#d53e4f", "#fc8d59", "#3288bd", "#e6f598", "#99d594"]);

    chartContainer.datum(features).call(barChart);

    var tooltipContainer = chartContainer.select('.metadata-group'); // Do this only after chart is display, `.metadata-group` is a part of the chart's generated SVG
    tooltipContainer.datum([]).call(chartTooltip);
}

// CHART: averages of audio features for user's top tracks
function avgAudioFeaturesChart(averagesData) {

    $('#faveFeatures').empty();

    var barChart = new britecharts.bar();
    var chartTooltip = new britecharts.miniTooltip();

    var chartContainer = d3.select('#faveFeatures');
    var containerWidth = chartContainer.node()
        ? chartContainer.node().getBoundingClientRect().width
        : false;

    barChart.width(containerWidth).height(300).isAnimated(true).horizontal(false).percentageAxisToMaxRatio(1.3).on('customMouseOver', chartTooltip.show).on('customMouseMove', chartTooltip.update).on('customMouseOut', chartTooltip.hide).colorSchema(["#d53e4f", "#fc8d59", "#3288bd", "#e6f598", "#99d594"]);

    chartContainer.datum(averagesData).call(barChart);

    var tooltipContainer = chartContainer.select('.metadata-group'); // Do this only after chart is display, `.metadata-group` is a part of the chart's generated SVG
    tooltipContainer.datum([]).call(chartTooltip);
}
