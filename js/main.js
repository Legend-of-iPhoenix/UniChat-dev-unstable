var username = "anonymous";
function assignUsername()
{
  var adj = ["Anonymous","Small", "Red","Orange","Yellow","Blue","Indigo","Violet","Shiny","Sparkly","Large","Hot","Cold","Evil","Kind","Ugly","Legendary"];
  var noun = ["Bear", "Dog","Cat","Banana","Pepper","Bird","Lion","Apple","Phoenix","Diamond","Jewel","Person","Whale","Plant","Duckling","Thing"];

  var rAdj = Math.floor(Math.random()*adj.length);
  var rNoun = Math.floor(Math.random()*noun.length);
var name = adj[rAdj] + noun[rNoun];
  var u = prompt("Please Enter Your Username:", name);
  u = u.replace(/[\'\"\;]/g,'');
  document.cookie = "unichat_uid="+u+";expires=Tue, 19 Jan 2038 03:14:07 UTC";
  alert("Username set to \'"+u+"\'");
  username = u;
}

assignUsername();

function submitMessage() {
	var database = firebase.database();
  var messageBox = document.getElementById("message");
	if (messageBox.value != undefined)
	{
	  database.ref("Data").push({
 	      text: messageBox.value,
	      ts: Date.now(),
	      un: username
 	 });
  messageBox.value = "";
}


var dataRef = firebase.database().ref("Data");
var outputDiv = document.getElementById("output");
dataRef.orderByChild("ts").limitToLast(10).on('child_added', function (snapshot) {
    var data = snapshot.val();
    var message = data.text;
    var posterUsername = data.un;
    if (message != undefined)
    {
      var node = document.createElement("DIV");
      var textnode = document.createTextNode('\n' + posterUsername + ': ' + message);
      node.appendChild(textnode);
      outputDiv.appendChild(node);
    }
});