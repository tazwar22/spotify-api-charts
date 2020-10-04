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
    });




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



/** --------------------------------------------
 *   Audio Analsys
 *----------------------------------------------------**/
$('#short_term_audio').on('click',function(){

        console.log("Getting Audio Stats...")
        $.ajax({
            url: "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10",
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

        //Helper: Gets Audio Features for given IDs
        function getAudioFeatures(id){
            console.log(id)
        }



})



    // END OF STARTUP  =================================================
}




// EXTERNAL FUNCTIONS  =================================================

//bubbleChart
function bubbleChart() {
    var width = 1200,
        height = 1200,
        columnForColors = "name",
        columnForRadius = "index";

    function chart(selection) {

        var data = selection.enter().data();
        console.log(data)

        var div = selection,
            svg = div.selectAll('svg');

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


        

        //Transition time
        const TRANSITION_TIME = 1500;

        //Manipulate the blobs
        var node = svg.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr('r', function(d) {
                    return scaleRadius(d[columnForRadius]);
                    })
                .style("fill", function(d) {
                    return colorScaler(d.index+1);
                })
                .attr('transform', 'translate(' + [width / 2,height / 2] + ')')  //center everything
                .on("mouseover", function(d) {

                    var t = d3.transition()
                            .duration(TRANSITION_TIME);

                    d3.select(this)
                        .transition(t)
                        .style('opacity', '0.6')
                        .style('stroke', "black")
                        .style("stroke-width", 20)
                        .style("fill", "red")

                    //Get the image
                    let artistImageTag = `<img src = "${d.images[1].url}" alt = "Artist Image" width="200" height="200">`

                    let htmlText = d[columnForColors] 
                                    + "<br>" + "Followers: " + formatNumber(d.followers.total)
                                    + "<br>" + "Popularity: " + d.popularity
                                    + "<br>"
                                    + artistImageTag;
                    tooltip.html(htmlText);
                    return tooltip.style("visibility", "visible");
                })
                .on("mousemove", function(d) {
                    return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function(d) {
                    //Create a Transition effect
                    var trans = d3
                                .transition()
                                .duration(TRANSITION_TIME);
                    d3.select(this)
                        .transition(trans)
                        .style('opacity', '1')
                        .style('stroke', "none")
                        .style("fill", colorScaler(d.index+1))

                    return tooltip.style("visibility", "hidden");
                })
                .on("click", function(d){
                    console.log("Getting info for artist..")
                    $.ajax({
                        url: "https://api.spotify.com/v1/artists/" + d.id +"/related-artists",
                        type: "GET",
                        dataType: "json",
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                        },
                        success: function(data) {  
                                    //Clear list
                                    d3
                                    .select('#similar-artists')
                                    .html("")
                                    //Populate with SImilar Artists
                                    data.artists.forEach((artist, ii)=>{
                                        d3
                                        .select('#similar-artists')
                                        .append('li')
                                        .html(artist.name);
                                    })

                        },error: function(err){
                            console.log(err)
                        }
                    });


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




