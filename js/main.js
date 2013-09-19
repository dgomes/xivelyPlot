$(document).ready(function($) {
		//Settings
		plotSelector = '#plotArea';
		currentSelector = '#current';
		currentLabelSelector = '#current_label';


		console.log("XivelyPlot");
		//Storage
		storage=$.localStorage
		console.log("version: "+storage.get('version'));

		if(storage.get('version')!=null) {
			//load data from storage
			$('input[name="apikey"]').val(storage.get('apikey'));
			$("input").each(function() {
    	    	$(this).val(storage.get($(this).attr("name")));
        	});
			$("select").each(function() {
    	     	$(this).append($("<option></option>").attr("value",storage.get($(this).attr("name"))).text("Loading..."));
        	});
		}

		if($('input[name="apikey"]').val().length) {
			$('#login').hide();
			loadXivelyData(plotSelector, currentSelector, currentLabelSelector);
			$('#conf').hide();
		} else {
			$('#settings').hide();
		}

		function loadXivelyData(selectorPlot, selectorCurrent, selectorCurrentLabel) {
			// Set the Xively API key (https://xively.com/users/YOUR_USERNAME/keys)
			xively.setKey( $('input[name="apikey"]').val() );

			xively.feed.list({user: $('input[name="username"]').val(), content:"summary"}, function(e) {
				if(e.status == 401) {
					$('#settings').hide();
					$('#login').show();
				}

				current_feedid = $('select[name="feedid"]').val();
				$('select[name="feedid"] option').remove();
				$.each(e.results, function(key, feed) {
					opt = $("<option></option>").attr("value",feed.id).text(feed.title);
					if(feed.id == current_feedid)
						opt.attr('selected','selected');
					$('select[name="feedid"]').append(opt);
				});

				// Replace select of Datastream id's
				function updateDatastream(feed) {
					xively.datastream.list(feed.val(), function(e) {
						current_datastreamid = $('select[name="datastreamid"]').val();
						$('select[name="datastreamid"] option').remove();

						$.each(e, function(key, datastream) {
							opt = $("<option></option>").attr("value",datastream.id).text(datastream.id);
							if(datastream.id == current_datastreamid)
								opt.attr('selected','selected');
							$('select[name="datastreamid"]').append(opt);
						});
					});
				}
				updateDatastream($('select[name="feedid"]'));

				$('select[name="feedid"]').change(function() {
					updateDatastream($(this));
				});
			});
			plot($('select[name="feedid"]').val(), $('select[name="datastreamid"]').val(), selectorPlot);
			showData($('select[name="feedid"]').val(), $('select[name="datastreamid"]').val(), selectorCurrent, selectorCurrentLabel);
		}

		function showData(feedID, datastreamID, selector, label) {
			xively.datastream.get (feedID, datastreamID, function ( datastream ) {
				console.log(datastream);
				$(selector).html( parseFloat(('' + (datastream["current_value"]+0.001)).match(/\d*\.\d{2}/)[0])+datastream["unit"]["symbol"]);

				$(label).html(datastream["id"]);

				xively.datastream.subscribe( feedID, datastreamID, function ( event , datastream_updated ) {
					// Display the current value from the updated datastream
					$(selector).html( parseFloat(('' + (datastream["current_value"]+0.001)).match(/\d*\.\d{2}/)[0])+datastream["unit"]["symbol"]);
	    		});
			});
		}

		function plot(feedID, datastreamID,selector) {

			// Flotr
	        var data, graph,
			options = {duration:"1days"};

			// Get datastream data from Xively
			xively.datastream.history (feedID, datastreamID, options, function ( datastream ) {
          		data = [];
				for(i=0; i<datastream.datapoints.length; i++) {
					data.push([new Date(datastream.datapoints[i].at), parseInt(datastream.datapoints[i].value)]);
				}

				// Draw Graph
          		graph = Flotr.draw($(selector)[0], [ { data: data, label: datastreamID, lines: {show: true}, points: {show: true}, mouse: {track: true} } ], {
					xaxis : {
						mode : 'time',
						labelsAngle: 45
					},
            		yaxis : {
	              		max : parseInt(datastream.max_value),
   		          		min : 0
            		}
          		});

			});
		}


		// User Actions
		$('#login').submit(function() {
			if($('input[name="username"]').val().length > 0 && $('input[name="password"]').val().length > 0) {
				$.ajax({
					type: "POST",
				    url: "https://api.xively.com/v2/keys.json",
					beforeSend: function (xhr){
						xhr.setRequestHeader('Authorization', "Basic " + btoa($('input[name="username"]').val()+':'+ $('input[name="password"]').val()));
					},
					data: JSON.stringify({ "key":{ "label":"test key", "private_access":"false", "permissions":[ { "access_methods":["get"] } ] } }),
				    dataType: "json",
					async: false,
					complete: function(xhr) {
            	    	if (xhr.readyState == 4) {
                	    	if (xhr.status == 201) {
								//parse key which is returned in the Location header...
								var key = xhr.getResponseHeader('Location').split('/')[5];
								$('input[name="apikey"]').val(key);
								storage.set("apikey",key);
								$('#login').hide();
								loadXivelyData(plotSelector, currentSelector, currentLabelSelector);
								$('#settings').show();
		                    }
    		            } else {
        		            alert("NoGood");
            		    }
            		}
				});
			}
			return false;
		});

		$('#settings').submit(function() {
			console.log("Save");
			storage.set('version', 0);

			$("input").each(function() {
				if($(this).attr("name") == "password") return;
				console.log($(this).attr("name")+" -> "+$(this).val());
				storage.set($(this).attr("name"),$(this).val());
			});
			$("select").each(function() {
				console.log($(this).attr("name")+" -> "+$(this).val());
				storage.set($(this).attr("name"),$(this).val());
			});
			plot($('select[name="feedid"]').val(), $('select[name="datastreamid"]').val(), plotSelector);
			showData($('select[name="feedid"]').val(), $('select[name="datastreamid"]').val(), currentSelector, currentLabelSelector);
			return false;
		});

		$('#confButton').click(function() {
			$('#conf').toggle("slow");
		});

})
