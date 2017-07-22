
    // global variables for canvas schedule
    var _canvas, _ctx;
    var _cw = 1080, _ch = 2500;
    var _tInc = Math.floor(_ch / 25);
    var _tHalf = Math.floor(_tInc / 2);
    var _dInc = Math.floor(_cw / 6);
    var _dHalf = Math.floor(_dInc / 2);
    var _startTime, _endTime;
    
    // global variables to store schedule information
    var _schedule = "", _lastSchedule = "", _classList = [], _profList = [], _scheduleList = [], _hwList = [];
    
    // global variables for user interface
    var _popUpCount = 0;
    var _addedTimes = false;
    var _adding = false;
    var _hideOld = false;
    var _displayAll = false;
    var _firstLoad = true;
    
    // load resources and place them in the user interface, initialize canavs
    window.onload = function() {
      loadResources();
      console.log(_lastSchedule);
      chooseSchedule(_lastSchedule);
      updateUI();
      setupCanvas();
    }    
        
    function setDefault() {
      _lastSchedule = _schedule;
      saveResources();
      setupCanvas();
    }

    function loadResources() {
      loadFile("Data", "schedules"); 
      loadFile("Data", "default");
      loadFile(_schedule, "classes");
      loadFile(_schedule, "profs");
      loadFile(_schedule, "hw");
      loadFile(_schedule, "hsetting");
    }
    
    function setValue(key, data) {
      if(data == null) return;
      switch(key) {
        case "schedules":
          _scheduleList = data.slice();
          break;
        case "default":
          _lastSchedule = data;
          if(_firstLoad) {
            _firstLoad = false;
            chooseSchedule(_lastSchedule);
          }
          break;
        case "classes":
          _classList = data.slice();
          break;
        case "profs":
          _profList = data.slice();
          break;
        case "hw":
          _hwList = [];
          objectToHw(data);
          break;
        case "hsetting":
          _hideOld = data;
          break;
      }
      updateUI();
      setupCanvas();
    }
    
    function loadFile(dir, name) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
          console.log("Loading: "+dir+"/"+name+".txt");
          setValue(name, JSON.parse(this.responseText));
        }
      }
      req.open("GET", "load.php?dir="+dir+"&name="+name, true);
      req.send();
    }
    
    /*function loadResources() {
      // attempt to load the schedule list
      _scheduleList = JSON.parse(localStorage.getItem("schedules"));
      if(!_scheduleList) _scheduleList = [];

      _lastSchedule = JSON.parse(localStorage.getItem("last-schedule"));
      if(_lastSchedule == undefined) _lastSchedule = "";

      // if a schedule has not been chosen, do not load any other resources
      if(!_schedule) return;
      
      // after a schedule has been chosen, load the resources for that schedule
      _classList = JSON.parse(localStorage.getItem(_schedule + "-classes"));
      if(!_classList) _classList = [];
      
      _profList = JSON.parse(localStorage.getItem(_schedule + "-profs"));
      if(!_profList) _profList = [];
      
      _hideOld = JSON.parse(localStorage.getItem(_schedule + "-hideSetting"));
      if(_hideOld == undefined) _hideOld = false;
      
      _hwList = [];      
      var o = JSON.parse(localStorage.getItem(_schedule + "-hw"));
      objectToHw(o);
    }*/
    
    function saveResources() {
      saveFile("Data", "schedules", JSON.stringify(_scheduleList));
      saveFile("Data", "default", JSON.stringify(_lastSchedule));
      saveFile(_schedule, "classes", JSON.stringify(_classList));
      saveFile(_schedule, "profs", JSON.stringify(_profList));
      saveFile(_schedule, "hw", JSON.stringify(hwToObject()));
      saveFile(_schedule, "hsetting", JSON.stringify(_hideOld));
    }
    
    function saveFile(dir, name, data) {
      var formData = new FormData();
      formData.append("dir", dir);
      formData.append("name", name);
      formData.append("data", data);
      
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
          console.log(this.responseText);
        }
      }
      req.open("POST", "save.php", true);
      req.send(formData);
    }
    
    /*function saveResources() {
      // save resources for particular schedule on local storage
      localStorage.setItem("schedules", JSON.stringify(_scheduleList));
      localStorage.setItem("last-schedule", JSON.stringify(_lastSchedule));
      localStorage.setItem(_schedule + "-classes", JSON.stringify(_classList));
      localStorage.setItem(_schedule + "-profs", JSON.stringify(_profList));
      localStorage.setItem(_schedule + "-hw", JSON.stringify(hwToObject()));
      localStorage.setItem(_schedule + "-hideSetting", JSON.stringify(_hideOld));
    }*/
   
    function deleteResources(key) {
      var formData = new FormData();
      formData.append("dir", key);
      
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
          console.log(this.responseText);
        }
      }
      req.open("POST", "remove.php", true);
      req.send(formData);
    }
    
    /*function deleteResources(key) {
      // delete the resources for a specific schedule, given in the variable key
      localStorage.removeItem(key + "-classes");
      localStorage.removeItem(key + "-profs");
      localStorage.removeItem(key + "-hw");
    }*/

    // create a new schedule entry in the schedule list
    function addSchedule() {
      // process form from pop up menu
      _schedule = document.getElementById("schedule-name").value;
      
      // check if schedule with same name already exists
      if(_scheduleList.length) {
        for(var i = 0; i < _scheduleList.length; i++) {
          if(_schedule == _scheduleList[i]) {
            _schedule = "";
            return;
          }
        }
      }
      
      // reinitialize the user interface
      _classList = [];
      _profList = [];
      _hwList = [];
      _scheduleList.push(_schedule);
      saveResources();
      updateUI();
      setupCanvas();
      closePopUps('add-schedule');
    }

    // function for choosing a schedule
    function chooseSchedule(key) {
      _schedule = key;
      
      // load and display resources for this particular schedule
      loadResources();
      updateUI();
      setupCanvas();
    }

    function updateUI() {
      // get elements that will be updated
      var classMenu = document.getElementById("class-menu");
      var profMenu = document.getElementById("prof-menu");
      var optionMenu = document.getElementById("class-prof");
      var scheduleMenu = document.getElementById("choose-schedule-menu");

      // reset the elements
      classMenu.innerHTML = "";
      profMenu.innerHTML = "";
      optionMenu.innerHTML = "";
      scheduleMenu.innerHTML = "";
    
      // create a menu entry for all classes
      if(_classList) {
	for(var i = 0; i < _classList.length; i++) {
	  var a = document.createElement("a");
	  a.href = "#";
	  a.className = "drop-menu-btn";
	  a.id = _classList[i].course_id;
	  a.innerHTML = _classList[i].course_id;
	  a.addEventListener("click", function(ev) {
	    showMenu(ev.target.id, "class");
	  });
	  classMenu.appendChild(a);
	}
      }
      
      // put add button at bottom of drop down menu
      var a = document.createElement("a");
      a.href = "#";
      a.className = "drop-menu-btn";
      a.id = "add-class-btn";
      a.innerHTML = "Add a class";
      classMenu.appendChild(a);
      
      // create menu entry for all schedules
      if(_scheduleList) {
	for(var i = 0; i < _scheduleList.length; i++) {
	  var a = document.createElement("a");
	  a.href = "#";
	  a.className = "drop-menu-btn";
	  a.id = _scheduleList[i] + "-schedule";
	  a.innerHTML = _scheduleList[i];
          a.addEventListener("click", function(ev) {
            showMenu(ev.target.id, "schedule");
          });
	  scheduleMenu.appendChild(a);
	}
      }
      
      // append add button
      var a = document.createElement("a");
      a.href = "#";
      a.className = "drop-menu-btn";
      a.id = "add-schedule-btn";
      a.innerHTML = "Add a schedule";
      scheduleMenu.appendChild(a);

      // update the schedule display
      if(_schedule) {
	document.getElementById("schedule-display").innerHTML = _schedule;
      } else {
	document.getElementById("schedule-display").innerHTML = "Schedule Display";
      }
      
      // create a menu entry for all profs
      if(_profList) {
	for(var i = 0; i < _profList.length; i++) {
	  var a = document.createElement("a");
	  a.href = "#";
	  a.className = "drop-menu-btn";
	  a.id = _profList[i].name;
	  a.innerHTML = _profList[i].name;
	  a.addEventListener("click", function(ev) {
	    showMenu(ev.target.id, "prof");
	  });
	  profMenu.appendChild(a);
	  
	  // create options for select element in add-class pop-up
	  var option = document.createElement("option");
	  option.innerHTML = _profList[i].name;
	  optionMenu.appendChild(option);
	}
      }
      
      // put add button at bottom of drop down menu and select element
      a = document.createElement("a");
      a.href = "#";
      a.className = "drop-menu-btn";
      a.id = "add-prof-btn";
      a.innerHTML = "Add a professor";
      profMenu.appendChild(a);
      
      var option = document.createElement("option");
      option.innerHTML = "Add a professor";
      option.id = "add-prof-alt";
      option.addEventListener("click", menuOpen);
      optionMenu.appendChild(option);      
    }
    
    
    function showMenu(elementId, key) {
      // variables to keep track of which object in which array will be opened in menu
      var tmpList = [];
      var elementIndex = 0;
      
      // copy appropriate array and find index of chosen object in that array
      if(key == "class") { 
	tmpList = _classList.slice();
	for(var i = 0; i < _classList.length; i++) {
	  if(elementId == _classList[i].course_id) elementIndex = i;
	}
      }
      if(key == "prof") {
	tmpList = _profList.slice();
	for(var i = 0; i < _profList.length; i++) {
	  if(elementId == _profList[i].name) elementIndex = i;
	}
      }
      if(key == "schedule") {
	tmpList = _scheduleList.slice();
	for(var i = 0; i < _scheduleList.length; i++) {
	  if(elementId.split('-')[0] == _scheduleList[i]) elementIndex = i;
	}
      }
      
      // update the pop-up menu count
      _popUpCount++;
 
      // creates elements to display object information
      var popUp = document.createElement("div");
      popUp.className = "pop-up";
      popUp.style.display = "block";
      popUp.id = elementId + "-menu";
      
      var innerPopUp = document.createElement("div");
      innerPopUp.className = "inner-pop-up";
      popUp.appendChild(innerPopUp);
            
      var title = document.createElement("h1");
      title.innerHTML = document.getElementById(elementId).innerHTML;
      innerPopUp.appendChild(title);
      
      var infoTable = document.createElement("table");
      
      // table to display multiple times
      var innerTable = document.createElement("table");
      innerTable.setAttribute("border", 1);
      innerTable.style.borderCollapse = "collapse";
      innerTable.style.border = "2px ridge white";
      innerTable.style.marginBottom = "60px";
      
      if(key != 'schedule') {
        // filling table with object properties
        for(property in tmpList[elementIndex]) {
          if(property.includes('color')) continue;
          if(tmpList[elementIndex][property] == '') continue;
	  switch(property) {
	    case "days":
	    case "start_time":
	    case "end_time":
	    case "office_days":
	    case "office_begin":
	    case "office_end":
	      var tr = makeRow(tmpList[elementIndex][property], property.toUpperCase().replace('_', ' '));
	      innerTable.appendChild(tr);
	      continue;
	  }
	  var tr = document.createElement("tr");
	  var td1 = document.createElement("td");
          td1.className = "label";
	  td1.innerHTML = property.toUpperCase().replace('_', ' ') + ":";
	  var td2 = document.createElement("td");
	  td2.innerHTML = tmpList[elementIndex][property];
	  td2.style.textAlign = "center";
	  tr.appendChild(td1);
	  tr.appendChild(td2);
	  infoTable.appendChild(tr);
        }
      } else {
	// fills table differently if it's displaying a schedule
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.setAttribute("colspan", 2);
        var chooseBtn = document.createElement("input");
        chooseBtn.type = "button";
        chooseBtn.value = "Choose";
        chooseBtn.addEventListener("click", function(ev) { 
          chooseSchedule(tmpList[elementIndex]); 
          closePopUps(popUp.id);
        });
        td.appendChild(chooseBtn);
        tr.appendChild(td);
        infoTable.appendChild(tr);
      }
      
      if(innerTable.innerHTML != "") {
	var tr = document.createElement("tr");
	
	var td = document.createElement("td");
	td.setAttribute("colspan", 2);
	var h3 = document.createElement("h3");
	if(key == "class") {
	  h3.innerHTML = "Class Times:"; 
	} else if(key == "prof") {
	  h3.innerHTML = "Office Hours:";
	}
	
	td.appendChild(h3);
	tr.appendChild(td);
	infoTable.appendChild(tr);
	
	tr = document.createElement("tr");
	td = document.createElement("td");
	td.setAttribute("colspan", 2);
	td.appendChild(innerTable);
	tr.appendChild(td);
	infoTable.appendChild(tr);
      }
      
      // buttons to delete resources or to close pop ups
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.setAttribute("colspan", 2);
      var removeBtn = document.createElement("input");
      removeBtn.type = "button";
      removeBtn.value = "Delete";
      removeBtn.addEventListener("click", function(ev) {
	deleteItem(elementIndex, key);
	closePopUps(popUp.id);
      });
      td.appendChild(removeBtn);
      tr.appendChild(td);
      infoTable.appendChild(tr);
      
      tr = document.createElement("tr");
      td = document.createElement("td");
      td.setAttribute("colspan", 2);
      var cancelBtn = document.createElement("input");
      cancelBtn.type = "button";
      cancelBtn.value = "Close";
      cancelBtn.addEventListener("click", function(ev) {
	closePopUps(popUp.id);
      });
      td.appendChild(cancelBtn);
      tr.appendChild(td);
      infoTable.appendChild(tr);
      
      innerPopUp.appendChild(infoTable);

      document.body.appendChild(popUp);
    }

    // makes a table row from array of strings
    function makeRow(a, key) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.innerHTML = key + ":";
      tr.appendChild(td);
      for(var i = 0; i < a.length; i++) {
	var td = document.createElement("td");
	td.innerHTML = a[i];
	tr.appendChild(td);
      }
      return tr;
    }
    
    function deleteItem(item, key) {
      // confirm delete
      if(!confirm("Are you sure you want to delete?")) return;
      
      // finds appropriate object in the appropriate array and removes it
      switch(key) {
	case "class":
          _hwList[_classList[item].course_title] = undefined;
	  _classList.splice(item, 1);
	  break;
	case "prof":
	  _profList.splice(item, 1);
	  break;
        case "schedule":
	  if(_scheduleList[item] == _schedule) {
	    _schedule = "";
	    _classList = [];
	    _profList = [];
	    _hwList = [];
	  }
	  if(_lastSchedule == _scheduleList[item]) _lastSchedule = "";
	  deleteResources(_scheduleList[item]);
	  _scheduleList.splice(item, 1);
	  break;
      }
      saveResources();
      updateUI();
      setupCanvas();
    }
    
    function addClass() {
      // gets data from add class menu
      var className = document.getElementById("class-name").value;
      var classId = document.getElementById("class-id").value;
      var classProf = document.getElementById("class-prof").value;
      var classBuilding = document.getElementById("class-building").value;
      var classRoom = document.getElementById("class-room").value;
      var classTextColor = document.getElementById("class-text-color").value;
      var classBoxColor = document.getElementById("class-box-color").value;
      
      // uses arrays for days and times to accomadate the ablility to add times
      var classDays = [];
      var classDaysList = document.getElementsByClassName("class-days");
      for(var i = 0; i < classDaysList.length; i++) classDays[i] = classDaysList[i].value;
      var classStart = [];
      var classStartList = document.getElementsByClassName("class-start-times");
      for(var i = 0; i < classStartList.length; i++) classStart[i] = classStartList[i].value;
      var classEnd = [];
      var classEndList = document.getElementsByClassName("class-end-times");
      for(var i = 0; i < classEndList.length; i++) classEnd[i] = classEndList[i].value;
      
      // sets up class object
      var classObject = {
	course_title: className,
	course_id: classId,
	professor: classProf,
	building: classBuilding,
	room_number: classRoom,
	days: classDays.slice(),
	start_time: classStart.slice(),
	end_time: classEnd.slice(),
        box_color: classBoxColor,
        text_color: classTextColor
      };

      // checks if class has already been added
      if(_classList) {
	for(var i = 0; i < _classList.length; i++) {
	  if(className == _classList[i].course_title) {
	    window.alert("You've already added this class!");
	    return;
	  }
	}
      }
      
      // adds it to list of classes, updates
      _classList.push(classObject);
      saveResources();
      updateUI();
      setupCanvas();
      
      closePopUps("add-class");
    }
    
    // use selection sort algorithm to sort time arrays
    function sortTimes(startTimes, endTimes, days, key) {
      for(var i = 0; i < startTimes.length - 1; i++) {
        var move = timeToInt(stringToTime(startTimes[i]));
        var where = i;
        for(var j = i + 1; j < startTimes.length; j++) {
          if((key == "min") ? timeToInt(stringToTime(startTimes[j])) < move : timeToInt(stringToTime(startTimes[j])) > move) {
            min = timeToInt(stringToTime(startTimes[j]));
            where = j;
          }
        }
        if(where != i) {
          var tmp = startTimes[i];
          startTimes[i] = startTimes[where];
          startTimes[where] = tmp;
          var tmp = endTimes[i];
          endTimes[i] = endTimes[where];
          endTimes[where] = tmp;
          var tmp = days[i];
          days[i] = days[where];
          days[where] = tmp;
        }
      }
    }

    // basically the same as addClass(), but for professors
    function addProf() {
      var profName = document.getElementById("prof-name").value;
      var profEmail = document.getElementById("prof-email").value;
      var profPhone = document.getElementById("prof-tel").value;
      var profBuilding = document.getElementById("prof-building").value;
      var profRoom = document.getElementById("prof-room").value;
      
      var profDays = [];
      var profDaysList = document.getElementsByClassName("prof-days");
      for(var i = 0; i < profDaysList.length; i++) profDays[i] = profDaysList[i].value;
      var profStart = [];
      var profStartList = document.getElementsByClassName("prof-start-times");
      for(var i = 0; i < profStartList.length; i++) profStart[i] = profStartList[i].value;
      var profEnd = [];
      var profEndList = document.getElementsByClassName("prof-end-times");
      for(var i = 0; i < profEndList.length; i++) profEnd[i] = profEndList[i].value;
      
      var profObject = {
	name: profName,
	email: profEmail,
	phone_number: profPhone,
	building: profBuilding,
	office_number: profRoom,
	office_days: profDays.slice(),
	office_begin: profStart.slice(),
	office_end: profEnd.slice()
      };
      
      if(_profList) {
	for(var i = 0; i < _profList.length; i++) {
          if(profName == _profList[i].name) {
            window.alert("You already have this professor!");
            return;
          }
	}
      }
      
      _profList.push(profObject);
      saveResources();
      updateUI();
      setupCanvas();
      
      closePopUps("add-prof");
    }
    
    // converts a string to a time object
    function stringToTime(s) {
      var s1 = s.split(":");
      var s2 = s1[1].split(" ");
      var t = {
        hours: s1[0],
        mins: s2[0],
        isAM: s2[1].toUpperCase() == "AM"
      };
      return t;
    }

    // converts a time object to an integer corresponding to y value on canvas
    function timeToInt(t) {
      var timeInt = (parseInt(t.hours) * _tInc) + ((parseInt(t.mins) * _tInc) / 60);
      timeInt += t.isAM ? 0 : (t.hours == "12") ? 0 : 12 * _tInc;
      return timeInt;
    }

    // converts a time object to a string
    function timeToString(t) {
      var s = t.hours + ":" + t.mins + " ";
      s += t.isAM ? "AM" : "PM";
      return s;
    }

    // converts a day to an integer corresponding to x value on canvas
    function dayToInt(day) {
      switch(day) {
        case 'M':
          return _dInc;
        case 'T':
          return _dInc * 2;
        case 'W':
          return _dInc * 3;
        case 'R':
          return _dInc * 4;
        case 'F':
          return _dInc * 5;
      }
    }
    
    function setupCanvas() {
      if(_classList.length) {
	// sort class list by start times and end times, then copy the arrays
        for(var i = 0; i < _classList.length; i++) {
          sortTimes(_classList[i].end_time, _classList[i].start_time, _classList[i].days, "max");
        }
        var list2 = sortByTime('end_time').reverse().slice();
	
        for(var i = 0; i < _classList.length; i++) {
          sortTimes(_classList[i].start_time, _classList[i].end_time, _classList[i].days, "min");
        }
        var list1 = sortByTime('start_time').slice();
        
	// determine the starting and ending y values for canvas
        _startTime = Math.floor(timeToInt(stringToTime(list1[0].start_time[0]))) - _tInc;
        while(_startTime % _tInc) _startTime--;
        _endTime = Math.floor(timeToInt(stringToTime(list2[0].end_time[list2[0].end_time.length - 1]))) + 2*_tInc;
        while(_endTime % _tInc) _endTime++;
        _ch = _endTime - _startTime;
      }
      _canvas = document.getElementById("schedule");
      _canvas.width = _cw;
      _canvas.height = _ch;
      _ctx = _canvas.getContext("2d");
      drawSchedule();
    }

    function drawSchedule() {
      if(_classList.length && _schedule) {
	// display schedule if a schedule has been chosen and classes have been added
        _canvas.style.border = "2.5px solid gray";
        drawGrid();
        drawClasses();
	drawCurrentTime();
        document.getElementById("bottom-btns").style.display = "table";
        if(_schedule == _lastSchedule) document.getElementById("default-btn").style.display = "none";
	else document.getElementById("default-btn").style.display = "initial";
      } else {
      // alternate display when classes have not yet been added
        document.getElementById("bottom-btns").style.display = "none";
        _canvas.height = 4 * _tInc;
        _ctx.fillStyle = "black";
        _ctx.textAlign = "center";
        _ctx.font = "15pt Arial";
        _ctx.fillText("You're schedule will appear here.", _cw / 2, _tInc);
        _ctx.fillText("To begin, select 'Choose Schedule' and create a new schedule, or choose one already created.", _cw / 2, 2*_tInc);
        _ctx.fillText("Then proceed to add classes and professors.", _cw / 2, 3*_tInc);
        _canvas.style.border = "none";
      }
    }

    function drawGrid() {
      // Add weak lines for half-hour marks
      _ctx.strokeStyle = "lightgray";
      _ctx.lineWidth = 2;
      _ctx.beginPath();
      for(var i = _tHalf + _tInc; i < _ch; i += _tInc) {
        _ctx.moveTo(0, i);
        _ctx.lineTo(_cw, i);
      }
      _ctx.stroke();
      _ctx.closePath();

      // Add strong lines for hour/day marks
      _ctx.strokeStyle = "gray";
      _ctx.lineWidth = 5;
      _ctx.beginPath();
      for(var i = 0; i <= _ch; i += _tInc) {
        _ctx.moveTo(0, i);
        _ctx.lineTo(_cw, i);
      }
      for(var i = 0; i <= _cw; i += _dInc) {
        _ctx.moveTo(i, 0);
        _ctx.lineTo(i, _ch);
      }
      _ctx.closePath();
      _ctx.stroke();
      
      // Add times
      _ctx.fillStyle = "black";
      _ctx.font = "bold 20pt Arial";
      _ctx.textAlign = "start";
      var s = " AM";
      for(var t = _startTime/_tInc, i = _tInc; t < _endTime/_tInc && i <= (_ch - _tInc); t++, i += _tInc) {
        if(t % 12 == 0) {
          if(t == 12) s = " PM";
          _ctx.fillText("12:00"+s, 5, i - 5);
        } else {
          _ctx.fillText((t%12)+":00"+s, 5, i - 5);
        }
      }

      // Add days
      _ctx.textAlign = "center";
      _ctx.fillText("Monday", _dHalf + _dInc, _tHalf);
      _ctx.fillText("Tuesday", _dHalf + 2*_dInc, _tHalf);
      _ctx.fillText("Wednesday", _dHalf + 3*_dInc, _tHalf);
      _ctx.fillText("Thursday", _dHalf + 4*_dInc, _tHalf);
      _ctx.fillText("Friday", _dHalf + 5*_dInc, _tHalf);
    }

    // sorts the list of classes according to start or end times
    function sortByTime(key) {
      return _classList.sort(function(a, b) {
	var x = timeToInt(stringToTime(a[key][0]));
	var y = timeToInt(stringToTime(b[key][0]));
	return x - y;
      });
    }

    function drawClasses() {
      for(var i = 0; i < _classList.length; i++) {
	// draw colored boxes for each class
        for(var k = 0; k < _classList[i].start_time.length; k++) {
          var dayList = _classList[i].days[k].split('');
          for(var j = 0; j < dayList.length; j++) {
            _ctx.fillStyle = _classList[i].box_color;
            _ctx.strokeStyle = "black";
            _ctx.lineWidth = 5;
            var x = dayToInt(dayList[j]);
            var y = timeToInt(stringToTime(_classList[i].start_time[k]));
            var h = timeToInt(stringToTime(_classList[i].end_time[k])) - y;
            _ctx.beginPath();
            _ctx.rect(x, y + _tInc - _startTime, _dInc, h);
            _ctx.fill();      
            _ctx.stroke();
            _ctx.closePath();
          }
          // draw the name of each class on its boxes
          for(var j = 0; j < dayList.length; j++) {
            var x = dayToInt(dayList[j]);
            var y = timeToInt(stringToTime(_classList[i].start_time[k]));
            var h = timeToInt(stringToTime(_classList[i].end_time[k])) - y;
            _ctx.font = "bold 20pt Arial";
            _ctx.fillStyle = _classList[i].text_color;
            _ctx.textAlign = "center";
            _ctx.fillText(_classList[i].course_id, x + _dHalf, y + _tInc + _tHalf - _startTime);
          }
        }
      }
    }
    
    function drawCurrentTime() {
      var d = new Date();
      var tlist = d.toLocaleTimeString().split(":");
      var t = tlist[0]+":"+tlist[1]+" "+tlist[2].split(" ")[1];
    }

    window.onclick = function(ev) {
      // closes drop down menus if anything but a button was clicked
      if(ev.target.className != "drop-btn") {
        closeMenus();
      }
      // blurs and renders background elements inert when pop up opens
      if(ev.target.className == "drop-menu-btn") {
        if(!_schedule && !ev.target.id.includes("schedule")) return;
        document.getElementById("main").className = "blur-on";
      }
    }

    window.onkeydown = function(ev) {
      // esc key can close all pop up menus at once
      if(ev.keyCode == 27) {
        ev.preventDefault();
        closePopUps("all");
      }
    }

    function closePopUps(key) {
      // allows the add prof pop up to be stacked on top of add class pop up
      if(key == "add-prof") document.getElementById("add-class").className = 
          document.getElementById("add-class").className.replace(" blur-on", "");
      
      // closes pop ups and updates pop up menu count
      popUps = document.getElementsByClassName("pop-up");
      for(var i = 0; i < popUps.length; i++) {
	if(popUps[i].id == key || key == "all") {
	  popUps[i].style.display = "none";
	  _popUpCount--;
	}
      }
      // only activates background elements if all popups are closed
      if(_popUpCount <= 0) {
	document.getElementById("main").className = "blur-off";
	_popUpCount = 0;
      }
    }

    // function that displays drop down menus
    function menuOpen(ev) {
      switch(ev.target.id) {
        case "class-btn":
          closeMenus();  
          document.getElementById("class-menu").style.display = "block";
          break;
        case "prof-btn":
          closeMenus();  
          document.getElementById("prof-menu").style.display = "block";
          break;
        case "choose-schedule-btn":
          closeMenus();  
          document.getElementById("choose-schedule-menu").style.display = "block";
          break;
        case "add-class-btn":
          if(!_schedule) {
              window.alert("Choose a schedule to add classes.");
              return;
          }
          
	  _popUpCount++;
          
	  if(_addedTimes) resetTimeArea("class");
          document.getElementById("add-class").style.display = "block";
          break;
        case "add-prof-alt":
          document.getElementById("add-class").className += " blur-on";
        case "add-prof-btn":
          if(!_schedule) {
              window.alert("Choose a schedule to add professors.");
              return;
          }
	  
	  _popUpCount++;
         
	  if(_addedTimes) resetTimeArea("prof");
          document.getElementById("add-prof").style.display = "block";
          break;
        case "add-schedule-btn":
          _popUpCount++;
          document.getElementById("add-schedule").style.display = "block";
          break;
      }
    }

    // closes all drop down menus
    function closeMenus() {
      var menus = document.getElementsByClassName("drop-menu");
      for(var i = 0; i < menus.length; i++) {
        menus[i].style.display = 'none';  
      }
    }

    // creates a temporary window containing only the image of the canvas and prints it
    function printSchedule() {
      var win=window.open();
      win.document.write("<head><title>My Class Schedule</title>");
      win.document.write("<style> img { border: 2.5px solid gray; } h1 { font-family: 'Arial'; }</style></head>");
      win.document.write("<body><h1 style='text-align: center; width: 1080;'>"+_schedule+"</h1>");
      win.document.write("<img src='"+_canvas.toDataURL()+"'></body>");
      win.print();
      win.close();
    }

    // creates a new time entry for class or professor
    function addTime(key) {
      _addedTimes = true;
      timeArea = document.getElementById(key+'-times-area');
      timeArea.innerHTML += "<tr><td class='label'>Days:<td><input style='margin-top: 25px;' class='"+key+"-days' type='text' id='"+key+"-days' placeholder='e.g. MTWRF' pattern='[MTWRF]{1,5}' required>";
      timeArea.innerHTML += "<tr><td class='label'>From:&nbsp;&nbsp;&nbsp;<input class='"+key+"-start-times' type='time' id='"+key+"-start' placeholder='e.g. 11:00 AM' pattern='[0-1]{0,1}[0-9]{1}:[0-9]{2} (AM|PM){1}' required><td class='label'>To:&nbsp;&nbsp;&nbsp;<input class='"+key+"-end-times' type='time' id='"+key+"-end' placeholder='e.g. 12:00 PM' pattern='[0-1]{0,1}[0-9]{1}:[0-9]{2} (AM|PM){1}' required></tr>";
    }

    // resets the time areas so they return to their default states when window is reopened
    function resetTimeArea(key) {
      _addedTimes = false;
      timeArea = document.getElementById(key+'-times-area');
      timeArea.innerHTML = "<tr><td colspan=2><h3>When?</h3>";
              timeArea.innerHTML += "<tr><td class='label'>Days:<td><input class='"+key+"-days' type='text' id='"+key+"-days' placeholder='e.g. MWTRF' pattern='[MTWRF]{1,5}' required><tr><td class='label'>From:&nbsp;&nbsp;&nbsp;<input class='"+key+"-start-times' type='time' id='"+key+"-start' placeholder='e.g. 11:00 AM' pattern='[0-1]{0,1}[0-9]{1}:[0-9]{2} (AM|PM){1}'  required><td class='label'>To:&nbsp;&nbsp;&nbsp;<input class='"+key+"-end-times' type='time' id='"+key+"-end' placeholder='e.g. 12:00 PM' pattern='[0-1]{0,1}[0-9]{1}:[0-9]{2} (AM|PM){1}'  required></tr>";
    }
    
    function openHwTool() {
      document.getElementById("main").style.display = "none";
      document.getElementById("hw-tool").style.display = "block";
      initHwTool();
      window.scrollTo(0, 0);
    }
    
    function exitHwTool() {
      document.getElementById("hw-tool").style.display = "none";
      document.getElementById("main").style.display = "table";
    }
    
    function initHwTool() {
      var mainDiv = document.getElementById("hw-tool");
      mainDiv.innerHTML = "<input type='button' value='Return' class='hw-first-btn' onclick='exitHwTool();'>";
      mainDiv.innerHTML += "<input type='button' value='Hide Old Assignments' id='hw-hidebtn' onclick='hideLowerDiv(event);'>";
      
      for(var i = 0; i < _classList.length; i++) {
        var classDiv = document.createElement("div");
	classDiv.className = "class-div";
        classDiv.id = _classList[i].course_title+"-hwdivarea";
	
	var colorDiv = document.createElement("div");
	colorDiv.className = "color-div";
	colorDiv.style.backgroundImage = "linear-gradient("+_classList[i].box_color+", #DDD)";
	classDiv.appendChild(colorDiv);

        var tbl = document.createElement("table");
	var tr = document.createElement("tr");
	
	var td = document.createElement("td");
	td.className = "hw-class-title-box";
	var className = document.createElement("h5");
	className.innerHTML = _classList[i].course_id+" - "+_classList[i].course_title;
	td.appendChild(className);
	tr.appendChild(td);
	
	td = document.createElement("td");
	td.className = "hw-add-btn-box";
	var addHwBtn = document.createElement("input");
	addHwBtn.type = "button";
        addHwBtn.id = _classList[i].course_title+"-addbtn";
	addHwBtn.value = "Add Assignment";
        addHwBtn.addEventListener("click", function(ev) {
          addHwDisplay(ev.target.id, false, 0);
        });
	td.appendChild(addHwBtn);
	tr.appendChild(td);
	
	tbl.appendChild(tr);
	classDiv.appendChild(tbl);
	
	var addDiv = document.createElement("div");
	addDiv.id = _classList[i].course_title+"-hwdiv";
	
	var addDivLower = document.createElement("div");
        addDivLower.className = "lower-div";
	addDivLower.id = _classList[i].course_title+"-hwdivlower";
	
	classDiv.appendChild(addDiv);
        classDiv.appendChild(addDivLower);
	
	mainDiv.appendChild(classDiv);
      }
      
      updateHwTool();
    }
    
    function hideLowerDiv(ev) {
      if(_hideOld) {
	_hideOld = false;
	ev.target.value = "Hide Old Assignments";
      } else {
	_hideOld = true;
	ev.target.value = "Show Old Assignments";
      }
      saveResources();
      clearHwDiv();
      updateHwTool();
    }

    function addHwDisplay(key, ed, i) {
      if(_adding) return;
      _adding = true;
      document.getElementById(key).style.display = "none";
      var divKey = key.split("-")[0];
      
      clearHwDiv();
      
      var addHwDiv = document.createElement("div");
      addHwDiv.id = divKey+"-addhwdiv";
      addHwDiv.className = "hw-div";
      
      var form = document.createElement("form");
      form.id = divKey+"-addhwform";
      form.addEventListener("submit", function(ev) {
        var targetDiv = ev.target.id.split("-")[0];
        if(ed) _hwList[divKey].splice(i, 1);
        addHw(targetDiv);
	_adding = false;
        document.getElementById(targetDiv+"-addbtn").style.display = "initial";
      });
      
      var addTbl = document.createElement("table");
      
      var tr = document.createElement("tr");

      var td = document.createElement("td");
      var hwName = document.createElement("input");
      hwName.id = "add-hw-name-box";
      hwName.type = "text";
      hwName.placeholder = "Assignment Title";
      if(ed) hwName.value = _hwList[divKey][i].name;
      hwName.required = true;
      td.appendChild(hwName);
      tr.appendChild(td);
      
      td = document.createElement("td");
      var hwDate = document.createElement("input");
      hwDate.id = "add-hw-date-box";
      hwDate.type = "text";
      hwDate.required = true;
      hwDate.placeholder = "Due Date (mm/dd/yyyy)";
      hwDate.pattern = "[0-1]{0,1}[0-9]{1}\/[0-9]{2}\/[0-9]{4}|none";
      if(ed) hwDate.value = _hwList[divKey][i].date;
      td.appendChild(hwDate);
      tr.appendChild(td);
      
      td = document.createElement("td");
      var addBtn = document.createElement("input");
      addBtn.type = "submit";
      if(ed) addBtn.value = "Edit";
      else addBtn.value = "Add";
      td.appendChild(addBtn);
      tr.appendChild(td);
      
      var hwCancel = document.createElement("input");
      hwCancel.type = "button";
      hwCancel.value = "Cancel";
      hwCancel.id = divKey+"-addhwcancel";
      hwCancel.addEventListener("click", function(ev) {
	_adding = false;
        if(ed) {
          _hwList[divKey][i].isEdit = false;
          clearHwDiv();
          updateHwTool();
          return;
        }
        document.getElementById(ev.target.id.split("-")[0]+"-addhwdiv").outerHTML = "";
        document.getElementById(ev.target.id.split("-")[0]+"-addbtn").style.display = "initial";
      });
      td.appendChild(hwCancel);

      addTbl.appendChild(tr);
      tr = document.createElement("tr");

      td = document.createElement("td");
      td.setAttribute("colspan", 3);
      var hwNotes = document.createElement("textarea");
      hwNotes.id = "add-hw-notes-box";
      hwNotes.placeholder = "Description";
      if(ed) hwNotes.value = _hwList[divKey][i].notes;
      td.appendChild(hwNotes);
      tr.appendChild(td);
            
      addTbl.appendChild(tr);

      form.appendChild(addTbl);
      addHwDiv.appendChild(form);
      document.getElementById(divKey+"-hwdiv").appendChild(addHwDiv);
      updateHwTool();
    }
    
    function addHw(index) {
      if(!_hwList[index]) _hwList[index] = [];
      
      var hwName = document.getElementById("add-hw-name-box").value;
      var hwDate = document.getElementById("add-hw-date-box").value;
      var hwNotes = document.getElementById("add-hw-notes-box").value;
      
      var hwObject = {
	name: hwName,
	date: hwDate,
	notes: hwNotes,
	isChecked: false,
        isEdit: false
      };
      
      _hwList[index].push(hwObject);
      saveResources();
      clearHwDiv();
      updateHwTool();
    }
    
    function updateHwTool() {
      for(index in _hwList) {
	for(var i = 0; i < _hwList[index].length; i++) {
          if(!_hwList[index][i].isEdit) {
            if(_hwList[index][i].isChecked) {
              var targetDiv = document.getElementById(index+"-hwdivlower");
            } else {
              var targetDiv = document.getElementById(index+"-hwdiv");
            }
          
            _hwList[index] = _hwList[index].sort(compareDates).slice();  

            var hwDiv = document.createElement("div");
            hwDiv.className = "hw-div";
            
            var tbl = document.createElement("table");
            
            var tr = document.createElement("tr");
            
            var td = document.createElement("td");
            td.className = "check";
            var check = document.createElement("input");
            check.type = "checkbox";
            check.id = index+"-"+i+"-checkbox";
            if(_hwList[index][i].isChecked) check.checked = true;
            check.addEventListener("click", function(ev) {
              var box = document.getElementById(ev.target.id);
              var s = ev.target.id.split("-");
              if(box.checked) {
                _hwList[s[0]][s[1]].isChecked = true;
              } else {
                _hwList[s[0]][s[1]].isChecked = false;
              }
              saveResources();
              clearHwDiv();
              updateHwTool();
            });
            td.appendChild(check);
            tr.appendChild(td);
            
            td = document.createElement("td");
            td.className = "date";
            
            if(_hwList[index][i].date == "none")
                td.innerHTML = "Due Soon";
            else
                td.innerHTML = getDate(_hwList[index][i].date);
            
            tr.appendChild(td);
            
            td = document.createElement("td");
            td.className = "name";
            td.innerHTML = _hwList[index][i].name;
            tr.appendChild(td);
            
            td = document.createElement("td");
            td.className = "remove";
            
            var edBtn = document.createElement("input");
            edBtn.type = "button";
            edBtn.value = "Edit";
            edBtn.className = "edbtn";
            edBtn.id = index+"-"+i+"-edbtn";
            edBtn.addEventListener("click", function(ev) {
              _hwList[ev.target.id.split('-')[0]][ev.target.id.split('-')[1]].isEdit = true;
              addHwDisplay(ev.target.id, true, ev.target.id.split('-')[1]);
            });
            td.appendChild(edBtn);
            
            var rmBtn = document.createElement("input");
            rmBtn.type = "button";
            rmBtn.value = "Remove";
            rmBtn.id = index+"-"+i+"-rmbtn";
            rmBtn.addEventListener("click", function(ev) {
              if(!confirm("Are you sure you want to delete?")) return;
              var s = ev.target.id.split("-");
              _hwList[s[0]].splice(s[1], 1);
              saveResources();
              clearHwDiv();
              updateHwTool();
            });
            td.appendChild(rmBtn);
            tr.appendChild(td);
            
            tbl.appendChild(tr);
            
            if(_hwList[index][i].notes != "") {
              tr = document.createElement("tr");
              td = document.createElement("td");
              td.setAttribute("colspan", 4);
              td.innerHTML = _hwList[index][i].notes;
              td.className = "notes";
              tr.appendChild(td);
              tbl.appendChild(tr);
            }
            
            hwDiv.appendChild(tbl);
            targetDiv.appendChild(hwDiv);
          }
	}
      }
      var lowerDivs = document.getElementsByClassName("lower-div");
      var hideBtn = document.getElementById("hw-hidebtn");
      if(_hideOld) {
	for(var i = 0; i < lowerDivs.length; i++) lowerDivs[i].style.display = "none";
	hideBtn.value = "Show Old Assignments";
      } else {
	for(var i = 0; i < lowerDivs.length; i++) lowerDivs[i].style.display = "initial";
	hideBtn.value = "Hide Old Assignments";
      }
    }
    
    function getDate(dateString) {
      var s = dateString.split("/");
      var month = Number(s[0]) - 1;
      var day = s[1];
      var year = s[2];
      var d = new Date(year, month, day);
      var curr = new Date();
      var later = new Date();
      later.setDate(curr.getDate() + 6);
      var tomorrow = new Date(year, month, Number(day) + 1);

      if(d.getDate() == curr.getDate() && d.getMonth() == curr.getMonth()) {
          return "Today";
      } else if(d.getDate() == tomorrow.getDate()) {
          return "Tomorrow";
      } else if(d.getTime() < later.getTime() && d.getTime() >= curr.getTime()) {
        return dayToString(d.getDay());
      } else {
        peices = d.toDateString().split(' ');
        dateString = peices[1] + ' ' + peices[2] + ' ' + peices[3];
        return dateString
      }
    }

    function dayToString(i) {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i];
    }

    function compareDates(a, b) {
        if(a.date == "none" && b.date == "none")
            return 0;
        else if(a.date == "none")
            return -1;
        else if (b.date == "none")
            return 1;

        var s1 = a.date.split("/");
        var s2 = b.date.split("/");
        
        return new Date(s1[2], Number(s1[0]) - 1, s1[1]) - new Date(s2[2], Number(s2[0]) - 1, s2[1])
    }
    
    function clearHwDiv() {
      for(index in _hwList) {
        document.getElementById(index+"-hwdiv").innerHTML = "";
	document.getElementById(index+"-hwdivlower").innerHTML = "";
      }
    }
    
    function hwToObject() {
      var object = new Object();
      for(index in _hwList) {
        if(_hwList[index] == undefined) continue;
	object[index] = _hwList[index];
      }
      return object;
    }
    
    function objectToHw(o) {
      if(!o) return;
      for(p in o) {
	_hwList[p] = o[p].slice();
      }
    }

