$(document).ready(function($) {
		console.log("XivelyPlot");
		//Storage
		storage=$.localStorage
		console.log("version: "+storage.get('version'));

		$("input").each(function() {
        	$(this).val(storage.get($(this).attr("name")));
        });


		function updateDatastream(node, ds) {
			xively.datastream.list(node.val(), function(e) {
				newselect=' <div class="controls"> <select name="datastreamid" class="input-large">';
				for(i = 0; i <e.length; i++) {
					if(ds.val() == e[i].id)
						newselect+='<option selected>'+e[i].id+'</option>';
					else
						newselect+='<option>'+e[i].id+'</option>';
				}
				newselect+='</select> </div>';
				ds.replaceWith(newselect);
			});
		}
		// Set the Xively API key (https://xively.com/users/YOUR_USERNAME/keys)
		xively.setKey( $('input[name="apikey"]').val() );

		xively.feed.list({user:"dgomes", content:"summary"}, function(e) {
			newselect=' <div class="controls"> <select name="feedid" class="input-large">';
			for(i = 0; i <e.results.length; i++) {
				if($('input[name="feedid"]').val() == e.results[i].id)
					newselect+='<option value='+e.results[i].id+' selected>'+e.results[i].title+'</option>';
				else
					newselect+='<option value='+e.results[i].id+'>'+e.results[i].title+'</option>';
			}
    		newselect+='</select> </div>';
			$('input[name="feedid"]').replaceWith(newselect);
			updateDatastream($('select[name="feedid"]'), $('input[name="datastreamid"]'));
			$('select[name="feedid"]').change(function() {
				updateDatastream($(this),$('select[name="datastreamid"]'));
			});
		});

		// Replace with your own values
		var feedID        = $('input[name="feedid"]').val(),          // Feed ID (the last number on the URL on the feed page on Xively)
		datastreamID  = $('input[name="datastreamid"]').val();       // Datastream ID
		selector      = "#plotArea";   // Your element on the page - takes any valid jQuery selector

		// Flotr
        var container = document.getElementById('plotArea'),
          data, graph,
		options = {duration:"24hours"};

		// Get datastream data from Xively
		xively.datastream.history (feedID, datastreamID, options, function ( datastream ) {
          		data = [];
				for(i=0; i<datastream.datapoints.length; i++) {
					data.push([new Date(datastream.datapoints[i].at), parseInt(datastream.datapoints[i].value)]);
				}

				// Draw Graph
          		graph = Flotr.draw(container, [ { data: data, label: datastreamID, lines: {show: true}, points: {show: true}, mouse: {track: true} } ], {
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

		$('#settings').submit(function() {
			console.log("Save");
			storage.set('version', 0);

			$("input").each(function() {
				console.log($(this).attr("name")+" -> "+$(this).val());
				storage.set($(this).attr("name"),$(this).val());
			});
			$("select").each(function() {
				console.log($(this).attr("name")+" -> "+$(this).val());
				storage.set($(this).attr("name"),$(this).val());
			});

//			return false;
		});

})
