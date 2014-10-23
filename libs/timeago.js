function timeAgo(date1, date2, granularity){
	
	var self = this;
	
	periods = [];
	periods['week'] = 604800;
	periods['day'] = 86400;
	periods['hour'] = 3600;
	periods['minute'] = 60;
	periods['second'] = 1;
	
	if(!granularity){
		granularity = 5;
	}
	
	(typeof(date1) == 'string') ? date1 = new Date(date1).getTime() / 1000 : date1 = new Date().getTime() / 1000;
	(typeof(date2) == 'string') ? date2 = new Date(date2).getTime() / 1000 : date2 = new Date().getTime() / 1000;
	
	if(date1 > date2){
		difference = date1 - date2;
	}else{
		difference = date2 - date1;
	}

	output = '';
	
	for(var period in periods){
		var value = periods[period];
		
		if(difference >= value){
			time = Math.floor(difference / value);
			difference %= value;
			
			output = output +  time + ' ';
			
			if(time > 1){
				output = output + period + 's ';
			}else{
				output = output + period + ' ';
			}
		}
		
		granularity--;
		if(granularity == 0){
			break;
		}	
	}
	
	if (output == '') output = 'just a moment';
	
	return output + ' ago';
}