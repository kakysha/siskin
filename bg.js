lastTweetId = 0;
date = new Date();

var accessor = {
		consumerKey   : "nKPI1xQEede0bhOe1lOFzA",
		consumerSecret: "ykY8f3JWlEMWDr6ekEjAKgP7KyIXZsBkTvjFxd5eCOo",
		serviceProvider:
		{ 
		  signatureMethod     : "HMAC-SHA1",
		  requestTokenURL     : "http://api.twitter.com/oauth/request_token",
		  userAuthorizationURL: "http://api.twitter.com/oauth/authorize",
		  accessTokenURL      : "http://api.twitter.com/oauth/access_token",
		  actionURL           : "http://api.twitter.com/1/statuses/home_timeline.json?count=1"
		}
};



function Init()
{
	
	timeOut = localStorage["timeOut"];
	notificationTime = localStorage["notificationTime"];
	
	if (typeof localStorage["timeOut"] == "undefined") //the first run
	{
		//show welcome screen
		Welcome(); //show welcome screen, then authorize them (in Welcome())
				
		//ask user to authenticate
		img = "icons/forward.png";
		name = "Please!";
		text = "Authenticate me! Press 'Login' in options page and then allow Siskin to access your timeline";
		tweet_time = null;
		
		timeOut = localStorage["timeOut"] = 12; //12 sec
		notificationTime = localStorage["notificationTime"] = 8; //8 sec
		localStorage["desktopPopUp"] = true; localStorage["sitePopUp"] = false; //default - desktop notifications
		localStorage["sound"] = 1;
	} else if ((typeof localStorage["token"] == "undefined") || (typeof localStorage["token_secret"] == "undefined") || (typeof localStorage["username"] == "undefined")) //cant find auth tokens
	{
		//ask user to authenticate
		img = "icons/forward.png";
		name = "Please!";
		text = "Authenticate me! Press 'Login' in options page and then allow Siskin to access your timeline";
		tweet_time = null;
		
		Authorize();
	} else if (localStorage["resetTime"] > 0) //RateLimit Hit
	{
		//warn user in popup
		img = "icons/error.png";
		name = "Error:";
		text = "Api-Hit-Rate Limit! Please, wait for (gray minutes below):";
		var reset_time = new Date();
		reset_time.setTime(localStorage["resetTime"] * 1000);
		tweet_time = reset_time.toUTCString();
		Reset(localStorage["resetTime"]);
	} else //seems to be Ok, start listening
	{
		//notify user that all right and data is loading
		img = "icons/loading.png";
		name = "Loading...";
		text = "";
		tweet_time = null;
		
		StartListen();
	}
	
	return true;
}

function Welcome()
{
	var welcomeWindowId = 0;
	
	//show the welcome window
	chrome.windows.create({url: 'welcome.html', type: "popup", left: 100, top: 100, width: 800, height: 500}, function(window) {welcomeWindowId = window.id});
	
	//after welcome window clsoing send to authorization
	chrome.windows.onRemoved.addListener(function(windowId) 
	{
		if (windowId == welcomeWindowId)
		{
			Authorize(); 
		}
	});
}

function StartListen()
{
	StopListen();
	chrome.browserAction.setIcon({path: "/icons/icon19.png"});
	localStorage["resetTime"] = 0;
	Listen(); //the first time;
	//start listening
	_intervalId = setInterval("Listen()", timeOut * 1000);
}

function StopListen()
{
	if (typeof _intervalId != "undefined")
	clearInterval (_intervalId);
	chrome.browserAction.setIcon({path: "/icons/icon19_inactive.png"});
}

function Deauthorize()
{
	delete localStorage["token"];
	delete localStorage["token_secret"];
	delete localStorage["username"];
}

function Authorize()
{
	StopListen();
		
	//get request tokens
	var message = {method: "post", action: accessor.serviceProvider.requestTokenURL, parameters: []};
	OAuth.completeRequest(message, accessor);
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
    var requestToken = new XMLHttpRequest();
    requestToken.onreadystatechange = function receiveRequestToken() 
	{
        if (requestToken.readyState == 4)  //answer arrived
		{
            if (requestToken.status == "200") //OK
			{
                var results = OAuth.decodeForm(requestToken.responseText);
				request_token = OAuth.getParameter(results, "oauth_token");
				chrome.tabs.create({url: accessor.serviceProvider.userAuthorizationURL+"?oauth_token="+request_token, selected: true}, function(tabObj)
				{
					tabId = tabObj.id;
				}); //send for authorization 
            } else
			{
				Error(requestToken.status+" "+requestToken.statusText+" in request tokens");
			}
        }
    };
    requestToken.open(message.method, message.action, true); 
    requestToken.setRequestHeader("Authorization", authorizationHeader);
    requestToken.send();
}

function AuthorizeAccess(pin)
{
	pin = parseInt(pin);
	message = {method: "post", action: accessor.serviceProvider.accessTokenURL, parameters: [["oauth_verifier",pin]]};
	OAuth.completeRequest(message,
		{ consumerKey   : accessor.consumerKey
		, consumerSecret: accessor.consumerSecret
		, token         : request_token
		});
	var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
	var requestAccess = new XMLHttpRequest();
	requestAccess.onreadystatechange = function receiveAccessToken() 
	{
		if (requestAccess.readyState == 4) 
		{
			if (requestAccess.status == "200") // OK
			{
				var results = OAuth.decodeForm(requestAccess.responseText);
				
				var token = OAuth.getParameter(results, "oauth_token");
				var token_secret = OAuth.getParameter(results, "oauth_token_secret");
				var username = OAuth.getParameter(results, "screen_name");
				
				//set vars
				localStorage["token"] = token;
				localStorage["token_secret"] = token_secret;
				localStorage["username"] = username;
				
				//close authorization tab
				chrome.tabs.remove(tabId);				
				
				StartListen();//begin the rock!
			} else
			{
				Error(requestAccess.status+" "+requestAccess.statusText+" in access tokens");
			}
		}
	};
	requestAccess.open(message.method, message.action, true); 
	requestAccess.setRequestHeader("Authorization", authorizationHeader);
	requestAccess.send();
}

function Listen()
{	
	var actionMessage = {method: "get", action: accessor.serviceProvider.actionURL, parameters: []};
	OAuth.completeRequest(actionMessage,
		{ 
		consumerKey   : accessor.consumerKey,
		consumerSecret: accessor.consumerSecret,
		token         : localStorage["token"],
		tokenSecret   : localStorage["token_secret"]
		}
	);
	
	var actionHeader = OAuth.getAuthorizationHeader("", actionMessage.parameters);
	
	var requestAction = new XMLHttpRequest();
	
	requestAction.onreadystatechange = function() {
		if (requestAction.readyState == 4) 
		{
			if (requestAction.status == "200") // Ok
			{
				try 
				{
					var tweet = JSON.parse(requestAction.responseText)[0];
				} catch (e)
				{
					Error("Response parse error, maybe Twitter API is down: "+e.message);
					return;
				}
				
				//update values to fetch them lately
				tweet_time = tweet.created_at;
				img = tweet.user.profile_image_url;
				name = tweet.user.screen_name;
				text = linkify(tweet.text);
				
				//compare tweet id with lastTweetId
				if ((tweet.id != lastTweetId) && (lastTweetId != 0))
				{
					Notify(tweet);
					lastTweetId = tweet.id;
				} else if (lastTweetId == 0)
				{
					lastTweetId = tweet.id;
				}
			} else if (requestAction.status == "400")//401 - unauthorized, 400-rate-limit-hit errors processing! 
			{
				var resetTime = requestAction.getResponseHeader('X-RateLimit-Reset');
				Reset(resetTime);
				
				//warn user in popup
				img = "icons/error.png";
				name = "Error:";
				text = "Api-Hit-Rate Limit! Please, wait for (gray minutes below):";
				var reset_time = new Date();
				reset_time.setTime(localStorage["resetTime"] * 1000);
				tweet_time = reset_time.toUTCString();
			} else if (requestAction.status == "401")
			{
				//ask user to authenticate
				img = "icons/forward.png";
				name = "Please!";
				text = "Authenticate me! Press 'Login' in options page and then allow Siskin to access your timeline";
				tweet_time = null;
		
				Authorize();
			} else
			{
				Error("Unknown error: "+requestAction.status+" "+requestAction.statusText);
			}
			
		}
	};
	requestAction.open(actionMessage.method, actionMessage.action, true); 
	requestAction.setRequestHeader("Authorization", actionHeader);
	requestAction.send();
}

function Reset(resetTime)
{
	StopListen();
	var time = Math.ceil(date.getTime() / 1000)-1;
	localStorage["resetTime"] = resetTime;
	var interval = resetTime - time;
	setTimeout("StartListen()", interval * 1000);
	Error("Rate-Limit Hit! Will reset in "+Math.round(interval / 60)+" minutes");
}

function Notify(tweet)
{
	if (localStorage["desktopPopUp"] == "true")
	{		
		var notification = webkitNotifications.createHTMLNotification('notification.html');
		notification.show();
		setTimeout(function(){
			notification.cancel();
		}, notificationTime * 1000);
	} else
	{
		chrome.tabs.insertCSS(null, {file: 'style.css'});
		chrome.tabs.executeScript(null, {file: 'page_notification.html'});
	}
	PlaySound();
}

function PlaySound()
{
	if(localStorage["sound"] == 0)
    return;
    
	document.getElementById('notify_sound').currentTime = 0;
	document.getElementById('notify_sound').volume = localStorage['sound'];
	document.getElementById('notify_sound').play();
}

function _GetLastTweetInfo()
{
	var res = new Object();
	res.image = img;
	res.name = name;
	res.text = text;
	res.date = tweet_time;
	res.notificationTime = localStorage["notificationTime"];
	return res;
}

function Error(error)
{
	console.log(error);
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) 
	{
		if (request.pin)
		AuthorizeAccess(request.pin);
		else
		sendResponse(_GetLastTweetInfo());
	}
);

Init();