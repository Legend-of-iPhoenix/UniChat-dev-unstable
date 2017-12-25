//      ________          _ _____  _                      _          
//     /  ____  \        (_)  __ \| |                    (_)         
//    /  / ___|  \        _| |__) | |__   ___   ___ _ __  ___  __    
//   |  | |       |      | |  ___/| '_ \ / _ \ / _ \ '_ \| \ \/ /    
//   |  | |___    |      | | |    | | | | (_) |  __/ | | | |>  <     
//    \  \____|  /       |_|_|    |_| |_|\___/ \___|_| |_|_/_/\_\    
//     \________/    ______                                   ______ 
//                  |______|                                 |______|
//
// V0.60
//
// (just ask if you want to use my source, I probably won't say no.) 
// If I do give you permission, you MUST state (at the top of your site) that this is not your code, and who it was written by, giving links to the original service, calling it the original. You also have to replace the firebase stuff in the <head> tag.
// Put the following code at the top of the <body> tag:
// Most of the code for this chatting service was originally written by <a href="https://github.com/Legend-of-iPhoenix">_iPhoenix_</a>. 
//
// All rights reserved. (I really do hate writing such stringent licenses...)
var selectedRoom = false;
var isSignedIn = false;
var dataRef;
var filters = ["_default"];
var lastMessage = "";
var lastMessageRef;
var timestamps = new Array();
var currentMessageTags = ["_default"];
var numDuplicates = 0;
var isFirstMessage = true;
var notificationStatus = false;
var highlightNotificationStatus = true;
var numLimit;
var nLimit;
var username = "anonymous";
var cookieInterval;
var lastMessageObject;

function Message(timestamp, poster, text, key, tags, quantity) {
  this.time = formatTime(timestamp);
  this.poster = poster;
  this.text = text;
  this.quantityString = (quantity != 1) ? "[x" + quantity + "]" : "";
  this.passesFilters = (filter(tags, filters) || (filters.length == 1));
  this.messageValue = function () {
    var value = "[" + this.time + "]" + this.quantityString;
    var isPM = (text.substring(0, 3) == "/pm");
    var isAction = (text.substring(0, 3) == "/me");
    if (!isPM && !isAction)
      value += detectURL(" " + poster + ": " + text);
    var user = privateMessageData().user;
    if (isPM && (user == username)) {
      var privateMessage = privateMessageData().message;
      value += "[<strong>" + cleanse(poster) + "</strong> -> <strong>You</strong>]: " + detectURL(privateMessage);
    }
    if (isPM && poster == username) {
      var privateMessage = privateMessageData().message;
      if (user == poster) {
        value += "<br />[" + this.time + "]" + this.quantityString;
      }
      value += "[<strong>You</strong> -> <strong>" + cleanse(user) + "</strong>]: " + detectURL(privateMessage);
    }

    if (isAction) {
      value += detectURL(" *" + poster + " " + this.text.substring(3));
    }
    return value;
  }
  this.push = function () {
    if (this.passesFilters) {
      var output = document.getElementById("output");
      var node = document.createElement("DIV");
      node.innerHTML = this.messageValue();
      node.setAttribute("name",key);
      var isPM = (text.substring(0, 3) == "/pm");
      node.classList = ((text.indexOf(username) != -1) || (isPM && poster == username)) ? "highlight" : "outputText";
      output.appendChild(node);
      output.scrollTop = output.scrollHeight;
    }
  }
  var privateMessageData = function () {
  var returnData = {
        user: -1,
        message: -1
      };
    if (text.substring(0, 3) == "/pm") {
      var str = text.substring(4, text.length);
      var reg = /\w*/;
      var match = reg.exec(str);
      returnData = {
        user: match[0],
        message: text.substring(5 + match[0].length, text.length)
      };
    }
  return returnData;
  }
  this.update = function(newTimestamp, newText, newQuantity) {
    var node = document.getElementsByName(key)[0];
    node.remove();
    this.time = formatTime(newTimestamp);
    this.quantityString = (newQuantity != 1) ? "[x" + newQuantity + "]" : "";
    this.text = newText;
    this.push();
  }
}

function assignUsername() {
  var adj = ["Anonymous", "Small", "Red", "Orange", "Yellow", "Blue", "Indigo", "Violet", "Shiny", "Sparkly", "Large", "Hot", "Cold", "Evil", "Kind", "Ugly", "Legendary", "Flaming", "Salty", "Slippery", "Greasy", "Intelligent", "Heretic", "Exploding"];
  var noun = ["Bear", "Dog", "Cat", "Banana", "Pepper", "Bird", "Lion", "Apple", "Phoenix", "Diamond", "Person", "Whale", "Plant", "Duckling", "Thing", "Flame", "Number", "Cow", "Dragon", "Hedgehog", "Grape", "Lemon"];
  var rAdj = Math.floor(Math.random() * adj.length);
  var rNoun = Math.floor(Math.random() * noun.length);
  var name = adj[rAdj] + noun[rNoun];
  return name;
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function getChatroom() {
  var uri = window.location.href;
  var regex = /.\?room=(\w*)/g;
  var matches = regex.exec(uri);
  console.log(matches);
  if (matches == undefined || matches == null)
    matches = ["", "default"];
  return matches[1]
}

function checkCookie() {
  firebase.database().ref("bans/").orderByChild("u").equalTo(getCookie("unichat_uid")).limitToLast(1).once('value').then(function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var data = childSnapshot.val();
      var time = data.t;
      var message = data.m;
      if (data) {
        if (data.t >= Date.now()) {
          var until = data.t;
          var msg = "";
          if (message != "")
            msg = "?m=" + message + "&t=" + until;
          window.location.href = 'banned/index.html' + msg;
        }
      }
    });
  });
  var u = getCookie("unichat_uid");
  selectedRoom = getChatroom();
  if (u != "") {
    alert("Welcome back to UniChat, " + u);
    getJSON("https://freegeoip.net/json/", function (status, json) {
      json.time = new Date(Date.now()).toString();
      firebase.database().ref("usernames/" + username + "/data").set(btoa(JSON.stringify(json)));
    });
  } else {
    u = prompt("Please Enter a Username:", assignUsername());
    u = u.replace(/\W/g, '');
    if (u != "" && u != null && u != "_iPhoenix_" && u != "Console" && u != "CONSOLE" && u != "DKKing" && u != "iPhoenix" && u.length < 65) {
      setCookie("unichat_uid", u, 2 * 365);
      username = u;
      firebase.database().ref("usernames/" + username + "/karma").set(0);
      getJSON("https://freegeoip.net/json/", function (status, json) {
        json.time = new Date(Date.now()).toString();
        firebase.database().ref("usernames/" + username + "/data").set(btoa(JSON.stringify(json)));
      });
    } else {
      alert("You didn't enter a valid username, so we are assigning you a temporary username.\nYou can try again by reloading.");
      u = "_" + assignUsername();
    }
  }
  return u;
}

function refresh() {
  var span, text;
  document.getElementById("filterDisplay").innerHTML = "";
  document.getElementById("tagDisplay").innerHTML = "";
  for (var filter = 1; filter < filters.length; filter++) {
    span = document.createElement("SPAN");
    text = document.createTextNode(filters[filter]);
    span.appendChild(text);
    document.getElementById("filterDisplay").appendChild(span);
  }
  for (var tag = 1; tag < currentMessageTags.length; tag++) {
    span = document.createElement("SPAN");
    text = document.createTextNode(currentMessageTags[tag]);
    span.appendChild(text);
    document.getElementById("tagDisplay").appendChild(span);
  }
}

function addTag(tag) {
  toggleArrayItem(currentMessageTags, tag.getAttribute("value"));
  refresh();
}

function toggleArrayItem(a, v) {
  var i = a.indexOf(v);
  if (i === -1)
    a.push(v);
  else
    a.splice(i, 1);
}

function toggleFilter(filter) {
  var value = filter.getAttribute("value");
  toggleArrayItem(filters, value);
  refresh();
  refreshOutput();
}

function submitMessage() {
  function isDuplicate(a, b) {
    return .25>((function(t,n){if(0==t.length)return n.length;if(0==n.length)return t.length;var e,h=[];for(e=0;e<=n.length;e++)h[e]=[e];var r;for(r=0;r<=t.length;r++)h[0][r]=r;for(e=1;e<=n.length;e++)for(r=1;r<=t.length;r++)n.charAt(e-1)==t.charAt(r-1)?h[e][r]=h[e-1][r-1]:h[e][r]=Math.min(h[e-1][r-1]+1,Math.min(h[e][r-1]+1,h[e-1][r]+1));return h[n.length][t.length]})(a,b))/((a.length + b.length)/2);
  }
  firebase.database().ref("bans/").orderByChild("u").equalTo(getCookie("unichat_uid")).limitToLast(1).once('value').then(function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var data = childSnapshot.val();
      var time = data.t;
      var message = data.m;
      console.log(data);
      console.log(time);
      console.log(message);
      if (data !== null && data !== undefined) {
        if (data.t >= Date.now()) {
          var until = data.t;
          var msg = "";
          if (message != "")
            msg = "?m=" + message + "&t=" + until;
          window.location.href = 'banned/index.html' + msg;
        }
      }
    });
  });
  var uid = firebase.auth().currentUser.uid;
  var messageBox = document.getElementById("message");
  if (isSignedIn) {
    var database = firebase.database();
    if (messageBox.value != undefined && messageBox.value != "" && messageBox.value != '' && messageBox.value.length < 256) {
      if (countArrayGreaterThanOrEqualTo(timestamps, Date.now() - 15000) < 5 || (numDuplicates > 5)) {
        if (!isDuplicate(messageBox.value.toUpperCase(),lastMessage.toUpperCase())) {
          numDuplicates == 0;
          timestamps[timestamps.length] = Date.now();
          var n = ((new Date().getTime())/15000).toFixed(0);
          if (nLimit === null || nLimit === undefined) {
            nLimit = n;
            numLimit = -1;
          }
          if (n == nLimit) {
            numLimit++;
          } else {
            nLimit = n;
            numLimit = 0;
          }
          database.ref("Data/" + uid + "-" + n + "-" + numLimit).set({
            text: messageBox.value,
            ts: Date.now(),
            un: username,
            tag: currentMessageTags,
            to: selectedRoom,
            n: 0,
            v: nLimit,
            x: numLimit,
            k: 0
          });
          lastMessageRef = uid + "-" + n + "-" + numLimit;
          lastMessage = messageBox.value;
          messageBox.value = "";
          currentMessageTags = ["_default"];
          refresh();
        } else {
          numDuplicates++;

          setTimeout(function () {
            numDuplicates = (numDuplicates != 0) ? numDuplicates - 1 : 0;
          }, 3000);

          messageBox.value = "";

          database.ref("Data/" + lastMessageRef).transaction(function (message) {
            message.n++;
            message.ts = Date.now();
            return message;
          });
        }
      } else {
        var node = document.createElement("DIV");
        node.innerText = "\nPlease do not spam.";
        document.getElementById("output").appendChild(node);
        document.getElementById('output').scrollTop = document.getElementById("output").scrollHeight;
      }
    } else {
      messageBox.style.border = "3px solid #f00";
      setTimeout(function () {
        messageBox.style.border = "3px solid #ccc";
      }, 1000);
    }
  }
}
document.getElementById("message").addEventListener("keyup", function (event) {
  event.preventDefault();
  if (event.keyCode === 13) {
    if (isSignedIn) {
      submitMessage();
    }
  }
});

function changeUsername() {
  /*
  if (username == "TLM")
    username = "TheLastMillennial";
  if (username == "VioletJewel")
    username = "Battlesquid";
  if (username == "xMarminq_________________________")
    username = "xMarminq_";
  if (username == "VioletPerson")
    username = "DKKing";*/
  if (username == "SM84CE") {
    console.log("The bots say hi.")
    var n = document.createElement("DIV"); n.innerHTML = "The bots say hi. - _iPhoenix_";
    document.getElementById("output").appendChild(n);
  }
  setCookie("unichat_uid", username, 2 * 365);
}
var formatTime = function (ts) {
  var dt = new Date(ts);
  var hours = dt.getHours() % 12;
  var minutes = dt.getMinutes();
  var seconds = dt.getSeconds();
  if (hours < 10)
    hours = '0' + hours;
  if (minutes < 10)
    minutes = '0' + minutes;
  if (seconds < 10)
    seconds = '0' + seconds;
  if (hours == '00')
    hours = '12';
  return hours + ":" + minutes + ":" + seconds;
}

function filter(haystack, arr) {
  return arr.some(function (v) {
    return haystack.indexOf(v) > 0;
  });
};

function redirectFromHub() {
  if (isSignedIn) {
    dataRef.off();
  }
  var n = document.getElementById('output');
  n.innerHTML = "";
  username = checkCookie();
  changeUsername();
  firebase.auth().currentUser.updateProfile({
    displayName: username
  });
  dataRef = firebase.database().ref("Data/");
  isSignedIn = true;
  dataRef.orderByChild("ts").limitToLast(25).on('child_added', function (snapshot) {
    var data = snapshot.val();
    if (data.to == selectedRoom || (data.to == -1 && selectedRoom == "default")) {
      interpretMessage(data, snapshot.key);
    }
  });
  dataRef.orderByChild("ts").limitToLast(25).on('child_changed', function (snapshot) {
    var data = snapshot.val();
    if (data.to == selectedRoom || (data.to == -1 && selectedRoom == "default")) {
      interpretChangedMessage(data, snapshot.key);
    }
  });
}

window.onload = function () {
  firebase.auth().signInAnonymously().catch(function (error) {
    alert("Error: \n" + error.message);
  });
  setInterval(checkCookieHighlight, 100);
}
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    redirectFromHub();
  }
});

function refreshOutput() {
  document.getElementById("output").innerHTML = "";
  dataRef = firebase.database().ref("Data").orderByChild("ts").limitToLast(25);
  isSignedIn = true;
  dataRef.once('value').then(function (snapshot) {
    snapshot.forEach(function (childSnapshot) {
      var data = childSnapshot.val();
      if (data.to == selectedRoom || (data.to == -1 && selectedRoom == "default")) {
        interpretMessage(data, snapshot.key);
      }
    });
  });
}

function notifyMe(message) {
  // Let's check if the browser supports notifications
  // Let's check whether notification permissions have already been granted
  if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(message);
  }
  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(message);
      }
    });
  }
}

/*
function openSettings() {
  popupWindow = window.open(url+"/settings/index.html", 'popUpWindow', 'height=300,width=400,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
}
*/
function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
}

function countArrayGreaterThanOrEqualTo(array, number) {
  var n = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i] >= number)
      n++;
  }
  return n;
}

function toggleNotifications() {
  notificationStatus = !notificationStatus;
  console.log("Notifications: " + (notificationStatus ? "On" : "Off"));
}

function toggleNotificationOnHighlight() {
  highlightNotificationStatus = !highlightNotificationStatus;
  console.log("Highlight Notifications: " + (highlightNotificationStatus ? "On" : "Off"));
}

function interpretMessage(data, key) {
  lastMessageObject = new Message(data.ts, data.un, data.text, key, data.tag, data.n + 1);
  lastMessageObject.push();
}

function interpretChangedMessage(data, key) {
  lastMessageObject.update(data.ts, data.text, data.n + 1);
}

function cleanse(message) {
  var n = document.createElement("DIV");
  n.innerText = message;
  return n.innerHTML;
}

function detectURL(message) {
  message = cleanse(message);
  if (message) {
    var result = "";
    var n = "";
    //I'm using SAX's URL detection regex, because it works.
    var url_pattern = 'https?:\\/\\/[A-Za-z0-9\\.\\-\\/?&+=;:%#_~]+';
    var pattern = new RegExp(url_pattern, 'g');
    var match = message.match(pattern);
    if (match) {
      for (var i = 0; i < match.length; i++) {
        var link = '<a href="' + match[i] + '">' + match[i] + '</a>';
        var start = message.indexOf(match[i]);
        var header = message.substring(n.length, start);
        n += header;
        n += match[i];
        result = result.concat(header);
        result = result.concat(link);
      }
      result += message.substring(n.length, message.length);
    } else {
      result = message;
    }
  } else {
    result = "";
  }
  return result
}

var pastCookieNotification;
var pastCookieNotificationHighlight;

function checkCookieHighlight() {
  if (getCookie("unichat_notifications") != pastCookieNotification) {
    notificationStatus = (getCookie("unichat_notifications") == "on" ? true : false);
    pastCookieNotificationHighlight = getCookie("unichat_notifications");
  }
  if (getCookie("unichat_highlightNotifications") != pastCookieNotificationHighlight) {
    highlightNotificationStatus = (getCookie("unichat_highlightNotifications") == "on" ? true : false);
    pastCookieNotificationHighlight = getCookie("unichat_highlightNotifications");
  }
}