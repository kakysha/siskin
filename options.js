var BG = chrome.extension.getBackgroundPage();

function init_options()
{	
	doDataExchange(false);
	
	if ((localStorage["username"] != null) && (localStorage["username"].length > 0))
	{
		document.getElementById("login").value="logout "+localStorage["username"];
		document.getElementById("login").onclick = function()
		{
			BG.StopListen();
			delete localStorage["token"];
			delete localStorage["token_secret"];
			delete localStorage["username"];
			window.location.reload();
		}
	} else
	{
		document.getElementById("login").value= "login";
		document.getElementById("login").onclick = function()
		{
			BG.Authorize();
			chrome.tabs.close();
		}
	}
}

function getProperty(property, defValue)
{
	if(localStorage[property] == null)
	{
		return defValue;
	}
	
	return localStorage[property];
}

function getCheckState(ctrlId)
{
	return document.getElementById(ctrlId).checked;
}

function setCheckState(ctrlId, checked)
{
	document.getElementById(ctrlId).checked = ((checked == "true") || (checked == true));
}

function doDataExchange(save)
{
	if(save)
	{	
		//popup style
		localStorage["sitePopUp"] = getCheckState("sitePopUp");
		localStorage["desktopPopUp"] = getCheckState("desktopPopUp");
		
		//sound
		localStorage["sound"] = mysl1.getValue()/100;
		
		//check interval
		if (getCheckState("timeout300"))
		{
			localStorage["timeOut"] = 300;
		} else if (getCheckState("timeout30"))
		{
			localStorage["timeOut"] = 30;
		} else if (getCheckState("timeout60"))
		{
			localStorage["timeOut"] = 60;
		} else 
		{
			localStorage["timeOut"] = 12; //default 12 secs
		}
		
		//Notification timeout
		if (getCheckState("notification1"))
		{
			localStorage["notificationTime"] = 1;
		} else if (getCheckState("notification3"))
		{
			localStorage["notificationTime"] = 3;
		} else if (getCheckState("notification10"))
		{
			localStorage["notificationTime"] = 10;
		} else if (getCheckState("notification5"))
		{
			localStorage["notificationTime"] = 5;
		} else
		{
			localStorage["notificationTime"] = 8; //default 8 seconds
		}
		
		//reload to changes take effect
		chrome.extension.getBackgroundPage().Init();
	}
	else
	{
		setCheckState("sitePopUp", getProperty("sitePopUp", "false"));
		setCheckState("desktopPopUp", getProperty("desktopPopUp", "true"));
		setCheckState("timeout12", getProperty("timeOut", "false") == 12);
		setCheckState("timeout30", getProperty("timeOut", "true") == 30);
		setCheckState("timeout60", getProperty("timeOut", "false") == 60);
		setCheckState("timeout300", getProperty("timeOut", "false") == 300);
		setCheckState("notification1", getProperty("notificationTime", "false") == 1);
		setCheckState("notification3", getProperty("notificationTime", "false") == 3);
		setCheckState("notification5", getProperty("notificationTime", "true") == 5);
		setCheckState("notification8", getProperty("notificationTime", "false") == 8);
		setCheckState("notification10", getProperty("notificationTime", "false") == 10);
		mysl1.setValue(localStorage["sound"] * 100);
 	}
}

function onSave()
{
	doDataExchange(true);
	document.getElementById("message").style.display = 'block';
	setTimeout('document.getElementById("message").style.display = "none"', 1000);
}

function onExit()
{
	window.close();
}

function slider(elemId, sliderWidth, range1, range2, step) {
	var knobWidth = 14;				// ширина и высота бегунка
	var knobHeight = 24;			// изменяются в зависимости от используемых изображений
	var sliderHeight = 21;			// высота slider'а
	
	var offsX,tmp;					// вспомагательные переменные
	var d = document;
	var isIE = d.all || window.opera;	// определяем модель DOM
	var point = (sliderWidth-knobWidth-3)/(range2-range1);
	// point - количество пикселей на единицу значения
	
	var slider = d.createElement('DIV'); // создаем slider
	slider.id = elemId + '_slider';
	slider.className = 'slider';
	d.getElementById(elemId).appendChild(slider);	
	
	var knob = d.createElement('DIV');	// создаем ползунок
	knob.id = elemId + '_knob';
	knob.className = 'knob';
	slider.appendChild(knob); // добавляем его в документ
	
	knob.style.left = 0;			// бегунок в нулевое значение
	knob.style.width = knobWidth+'px';	
	knob.style.height = knobHeight+'px';
	slider.style.width = sliderWidth+'px';
	slider.style.height = sliderHeight+'px';
	
	var sliderOffset = slider.offsetLeft;			// sliderOffset - абсолютное смещение slider'а
	tmp = slider.offsetParent;		// от левого края в пикселях (в IE не работает)
	while(tmp.tagName != 'BODY') {
		sliderOffset += tmp.offsetLeft;		// тут его и находим
		tmp = tmp.offsetParent;
	}
	
	if(isIE)						// в зависимости от модели DOM
	{								// назначаем слушателей событий
		knob.onmousedown = startCoord;		
		slider.onclick = sliderClick;		
		knob.onmouseup = endCoord;		
		slider.onmouseup = endCoord;			
	}
	else {
		knob.addEventListener("mousedown", startCoord, true);		
		slider.addEventListener("click", sliderClick, true);		
		knob.addEventListener("mouseup", endCoord, true);	
		slider.addEventListener("mouseup", endCoord, true);	
	}


// далее подробно не описываю, кто захочет - разберется
//////////////////// функции установки/получения значения //////////////////////////

	function setValue(x)	// установка по пикселям
	{
		if(x < 0) knob.style.left = 0; 
		else if(x > sliderWidth-knobWidth-3) knob.style.left = (sliderWidth-3-knobWidth)+'px';
		else {
			if(step == 0) knob.style.left = x+'px';			
			else knob.style.left = Math.round(x/(step*point))*step*point+'px';
		}
		getValue() == 0 ? d.getElementById('volume').innerHTML = 'disabled' : d.getElementById('volume').innerHTML = getValue()+'%';	// это вывод значения
	}
	function setValue2(x)	// установка по значению
	{
		if(x < range1 || x > range2) alert('Value is not included into a slider range!');
		else setValue((x-range1)*point);
		
		getValue() == 0 ? d.getElementById('volume').innerHTML = 'disabled' : d.getElementById('volume').innerHTML = getValue()+'%';	// это вывод значения
	}

	function getValue() 
	{return Math.round(parseInt(knob.style.left)/point)+range1;}

//////////////////////////////// слушатели событий ////////////////////////////////////

	function sliderClick(e) {	
		var x;
		if(isIE) {
			if(event.srcElement != slider) return; //IE onclick bug
			x = event.offsetX - Math.round(knobWidth/2);
		}	
		else x = e.pageX-sliderOffset-knobWidth/2;
		setValue(x);
	}

	function startCoord(e) {				
		if(isIE) {	
			offsX = event.clientX - parseInt(knob.style.left);
			slider.onmousemove = mov;
		}
		else {				
			slider.addEventListener("mousemove", mov, true);
		}
	}
	
	function mov(e)	{
		var x;	
		if(isIE) x = event.clientX-offsX;
		else x = e.pageX-sliderOffset-knobWidth/2;
		setValue(x);
	}

	function endCoord()	{
		if(isIE) slider.onmousemove = null;	
		else slider.removeEventListener("mousemove", mov, true);
		d.getElementById('sound').volume = getValue()/100;
		d.getElementById('sound').play();
	}

	// объявляем функции setValue2 и getValue как методы класса
	this.setValue = setValue2;
	this.getValue = getValue;
} // конец класса

var mysl1 = new slider('sl', 100, 0, 100, 0); 

function ExamplePage()
{
	var s = localStorage["sitePopUp"];
	var d = localStorage["desktopPopUp"];
	
	localStorage["sitePopUp"] = true;
	localStorage["desktopPopUp"] = false;
	
	chrome.tabs.create({url: "http://siskin.tumblr.com", selected: true}, function()
	{
		BG.Notify();
		localStorage["sitePopUp"] = s;
		localStorage["desktopPopUp"] = d;
	});
}

function ExampleDesktop()
{
	var s = localStorage["sitePopUp"];
	var d = localStorage["desktopPopUp"];
	
	localStorage["sitePopUp"] = false;
	localStorage["desktopPopUp"] = true;
	
	BG.Notify();
	
	localStorage["sitePopUp"] = s;
	localStorage["desktopPopUp"] = d;
}