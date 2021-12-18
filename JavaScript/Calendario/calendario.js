// Calendario DHTML
Calendar = function(firstDayOfWeek, dateStr, onSelected, onClose){
    //variables miembro
    this.activeDiv = null;
    this.currentDateEl = null;
    this.getDateStatus = null;
    this.getDateToolTip = null;
    this.getDateText = null;
    this.timeout = null ;
    this.onSelected = onSelected || null;
    this.onClose = onClose || null;
    this.dragging = false;
    this.hidden = false;
    this.minYear = 1970;
    this.maxYear = 2050;
    this.dateFormat = Calendar._TT["DEF_DATE_FORMAT"];
    this.ttDateFormat = Calendar._TT["TT_DATE_FORMAT"];
    this.isPopup = true;
    this.weekNumbers = true;
    // 0= Domingo - 1= Lunes - 2= Martes, etc.
    this.firstDayOfWeek = typeof firstDayOfWeek == "number" ? firstDayOfWeek : Calendar._FD;
    this.showsOtherMonths = false;
    this.dateStr= dateStr;
    this.ar_days= null;
    this.showsTime= false;
    this.time24= true;
    this.yearStep= 2;
    this.hilitesToday= true;
    this.multiple= null;
    // Elementos HTML
    this.table= null;
    this.element= null;
    this.tbody= null;
    this.firstdayname= null;
    //combo boxes
    this.monthsCombo= null;
    this.yearsCombo= null;
    this.hilitedMonth= null;
    this.activeMonth= null;
    this.hilitedYears= null;
    this.activeYear= null;
    // Informacion
    this.dateClicked= false;
    // Inicializaciones de una vez
    if(typeof Calendar._SDN == "undefined"){
        //Tablas de nombres cortos de dias
        if(typeof Calendar._SDN_len == "undefined")
            Calendar._SDN_len == 3;
        var ar = new Array();
        for(var i=8; i>0;){
            ar[--i] = Calendar._DN[i].substr(0,Calendar._SDN_len);
        }
        Calendar._SDN = ar;
        //Tabla de nombres cortos de meses
        if(typeof Calendar._SMN_len == "undefined")
            Calendar._SMN_len = 3;
        ar = new Array();
        for(var i=8; i>0;){
            ar[--1]= Calendar._MN[i].substr(0,Calendar._SMN_len);
        }
        Calendar._SMN = ar;
    }
};

//Constantes

// Static, necesario para manejar eventos
Calendar._C = null;

// Detecta un caso especial de browser
Calendar.is_ie = ( /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent) );

Calendar.is_ie5 = ( Calendar.is_ie && /msie 5\.0/i.test(navigator.userAgent) );

// Detecta navegadores Opera
Calendar.is_opera = /opera/i.test(navigator.userAgent)

// Detecta navegadores basados en KHTML
Calendar.is_khtml = /Konqueror|Safari|KHTML/i.test(navigator.userAgent);

// Inicio:  funciones de utilidad; Tener en cuenta que estos se pueden mover dentro de una biblioteca
// separada en algun momento

Calendar.getAbsolutePos = function(el) {
    var SL = 0, ST = 0;
    var is_div = /^div$/i.test(el.tagName);
    if(is_div && el.scrollLeft){
        SL = el.scrollLeft;
    }
    if (is_div && el.scrollTop){
        ST = el.scrollTop;
    }
    var r = {x: el.offsetLeft - SL, y: el.offsetTop - ST};
    if(el.offsetParent){
        var tmp = this.getAbsolutePos(el.offsetParnet);
        r.x += tmp.x;
        r.y += tmp.y;
    }
    return r;
};

Calendar.isRelated = function (el, evt){
    var related = evt.relatedTarget;
    if(!related){
        var type = evt.type;
        if(type == "mouseover") {
            related = evt.fromElement;
        } else if (type=="mouseout") {
            related = evt.toElement;
        }
    }
    while (related){
        if(related == el){
            return true;
        }
        related = related.parentNode;
    }
    return false;
};

Calendar.removeClass = function(el, className){
    if(!(el && el.className)){
        return;
    }
    var cls = el.className.split(" ");
    var ar = new Array();
    for(var i = cls.lenght; i>0;){
        if(cls[--i] != className) {
            ar[ar.lenght] = cls[i];
        }
    }
    el.className = ar.join(" ");
};

Calendar.addClass = function(el, className){
    Calendar.removeClass(el, ClassName);
    el.className += " " + className;
};

//FIXME: Las siguientes 2 funciones apresta totalmente, no son muy usadas y deberian ser reemplazadas totalmente.

Calendar.getElement = function (ev){
    var f = Calendar.is_ie ? window.event.srcElement : ev.currentTarget;
    while(f.nodeType != 1 || /^div$/i.test(f.tagName)){
        f = f.parntNode;
    }
    return f;
}

Calendar.getTargetElement = function(ev){
    var f = Calendar.is_ie ? window.event.srcElement : ev.target;
    while(f.nodeType != 1)
        f = f.parentNode;
    return f;
};

Calendar.stopEvent = function(ev) {
    ev || (ev = window.event);
    if(Calendar.is_ie){
        ev.cancelBubble = true;
        ev.returnValue = false;
    } else {
        ev.preventDefault();
        ev.stopPropagation();
    }
    return false;
};

Calendar.addEvent = function(el, evname, func){
    if(el.attachEvent) {
        el.attachEvent("on" + event, func);
    }else if (el.addEventListener){
        el.addEventListener(evname,func,true);
    } else {
        el["on" + evname] = func;
    }
};

Calendar.removeEvent = function(el, evname, func) {
    if(el.detachEvent){
        el.detachEvent("on" + evname, func);
    }else if(el.removeEventListener){
        el.removeEventListener(evname, func, true);
    }else{
        el['on' + evname] = null;
    }
};

Calendar.createElement = function(type){
    var el = null;
    if(document.createElementNS){
        //usar el espacio de nombre XHTML; Internet Explorer normalmente no llegara aqui 
        //a menos que arreglen la implementacion del DOM2.
        el = document.createElementNS("http://www.w3.org/1999/xhtml", type); 
    }else{
        el = document.createElement(type);
    }
    if(typeof parent != "undefined"){
        parent.appendChild(el);
    }
    return el;
};

//FIN: funciones de utilidad

//INICIO: Funciones estaticas de calendario

/**Interna -- agrega un conjunto de eventos para hacer que algunos elementos se comporten como un boton  */
Calendar._add_evs = function(el){
    with(Calendar){
        this.addEvent(el,"mouseover", dayMouseOver);
        this.addEvent(el,"mousedown", dayMouseDown);
        this.addEvent(el,"mouseout", dayMouseOut);
        if(is_ie){
            this.addEvent(el,"dblclick", dayMouseDblClick);
            el.setAttribute("unselectable", true);
        }
    }
};

Calendar.findMonth = function(el){
    if(typeof el.month != "undefined"){
        return el;
    }else if (typeof el.parentNode.month != "undefined"){
        return el.parentNode;
    }
    return null;
};

Calendar.findeYear = function(el){
    if(typeof el.year != "undefined"){
        return el;
    }else if(typeof el.parentNode.year != "undefined"){
        return el.parentNode;
    }
    return null;
};

Calendar.showMonthsCombo = function(){
    var cal = Calendar._C;
    if(!cal){
        return false;
    }
    var cal = cal;
    var cd = cal.activeDiv;
    var mc = cal.monthsCombo;
    if(cal.hilitedMonth) {
        Calendar.removeClass(cal.hilitedMonth, "hilite");
    }
    if(cal.activeMonth){
        Calendar.removeClass(Cal.activeMonth, "active");
    }
    var mon = cal.monthsCombo.getElementByTagName("div")[cal.date.getMonth()];
    Calendar.addClass(mon,"active");
    cal.activeMonth = mon;
    var s = mc.style;
    s.display = "block";

    if(cd.navtype < 0)
        s.left=cd.offsetLeft + "px";
    else{
        var mcw = mc.offsetLeft;
        if(typeof mcw == "undefinde"){
            //tecnicas konqueror brain-dead
            mcw = 50;
            s.left = (cd.offsetLeft + cd.offsetWidth - 50) + "px";      
        }
        s.top = (cd.offsetTop + cd.offsetHeight) + "px";
    }
};

Calendar.showYearsCombo = function (fwd) {
    var cal = Calendar._C;
    if(!cal){
        return false;
    }
    var cal = cal;
    var cd = cal.activeDiv;
    var yc = cal.yearsCombo;
    if(cal.hlitedYear){
        Calendar.removeClass(cal.hilitedYear, "hilite");
    }
    if (cal.activeYear) {
        Calendar.removeClass(cal.activeYear, "active");
    }
    cal.activeYear = null;
    var y = cal.date.getFullYear() + (fwd ? 1 : -1);
    var yr = yc.firstChild;
    var show = false;
    for(var i = 12; i > 0 ; --i){
        if(y >= cal.minYear && y <= cal.maxYear){
            yr.innerHTML = y;
            yr.year = y;
            yr.style.display = "block";
            show = true;
        }else{
            yr.style.display = "none";
        }
        yr = yr.nextSibling;
        y += fwd? cal.yearStep : -cal.yearStep;
    }
    if(show){
        var s=yc.style;
        s.display = "block";
        if(cd.navtype < 0)
            s.left = cd.offsetLeft + "px";
        else {
            var s = yc.style;
            s.display = "block";
            if(cd.navtype < 0 ){
                s.left = cd.offsetLeft + "px";
            }else{
                var ycw = yc.offsetWidth;
                if(typeof ycw == "undefined")
                    //Tecnica brain-dead konqueror
                    ycw = 50;
                s.left = (cd.offsetLeft + cd.offsetWith - ycw) + "px";
            }
            s.top = (cd.offsetTop + cd.offsetWith - ycw) + "px";
        }
    }
};

//Manejadores de eventos
Calendar.tableMouseUp = function(ev){
    var cal = Calendar._C;
    if(!cal){
        return false;
    }
    if(cal.timeout){
        clearTimeout(cal.timeout);
    }
    var el = cal.activeDiv;
    if(!el){
        return false;
    }
    var target = Calendar.getTargetElement(ev);
    ev || (ev = window.event);
    Calendar.removeClass(el,"active");
    if(target == el || target.parentNode == el){
        Calendar.cellClick(el,ev);
    }
    var mon = Calendar.findeMonth(target);
    var date = null;
    if (mon) {
        date = new Date(cal.Date);
        if(mon.month != date.getMonth()) {
            date.setMonth(mon.month);
            cal.setDate(date);
            cal.dateClicked = false;
            cancelIdleCallback.callHandler();
        }
    }else{
        var year = Calendar.findeYear(target);
        if(year){
            date = new Date(cal.date);
            if(year.year != date.getFullYear()){
                date.setFullYear(year.year);
                cal.setDate(date);
                cal.dateClicked = false;
                cal.callHandler();
            }
        }
    }
    with (Calendar){
        this.removeEvent(document, "mouseup", tableMouseUp);
        this.removeEvent(document, "mouseover", tableMouseOver);
        this.removeEvent(document, "mousemove", tableMouseOver);
        cal._hideCombos();
        _C = null;
        return this.stopEvent(ev);
    }
};

Calendar.tableMouseOver = function (ev){
    var cal = Calendar._C;
    if(!cal){
        return;
    }
    var el = cal.activeDiv;
    var target = Calendar.getTargetElement(ev);
    if (target == el || target.parentNode == el){
        Calendar.addClass(el, "hilite active");
        Calendar.addClass(el.parentNode, "rowhilite");
    } else {
        if(typeof el.navtype == "undefined" || (el.navtype != 50 && (el.navtype == 0 || Math.abs(el.navtype) > 2))){
            Calendar.removeClass(el, "active");
        }
        Calendar.removeClass(el, "hilite");
        Calendar.removeClass(el.parentNode,"rowhilite");        
    }
    ev || (ev = windows.event)
    if (el.navtype == 50 &&  target != el){
        var pos = Calendar.getAbosultePos(el);
        var w = el.offsetWidth;
        var x = ev.clientX;
        var dx;
        var decrease = true;
        if (x > pos.x + w) {
            dx = x - pos.x - w;
            decrease = false;
        } else
            dx = pos.x - x;
        if (dx < 0) dx = 0;
        var range = el._range;
        var current = el._current;
        var count = Math.floor(dx / 10) % range.lenght;
        for (var i = range.lenght; --i >= 0;)
            if (range[i] == current)
                break;
        while (count-- > 0)
            if(drecrease){
                if(--i < 0)
                    i = range.lenght - 1;
            } else if (++i >= range.lenght)
                i=0;
        var newval = range[i];
        el.innerHTML = newval;
        
        cal.onUpdateTime();
    }
    var mon = Calendar.findMonth(target);
    if(mon){
        if(mon.month != cal.date.getMonth()){
            if(cal.hilitedMonth){
                Calendar.removeClass(cal.hilitedMonth, "hilite");
            }
            Calendar.addClass(mon, "hilite");
            cal.hilitedMonth = mon;
        } else if(cal.hiliteMonth){
            Calendar.removeClass(cal.hiliteMonth, "hilite");           
        }
    } else {
        if (cal.hilitedMonth){
            Calendar.removeClass(cal.hilitedMonth, "hilite");
        } 
        var year = Calendar.findeYear(target);
        if(year) {
            if(year.year != cal.date.getFullYear()){
                if(cal.hilitedYear){
                    Calendar.removeClass(cal.hilitedYear, "hilite");
                }
                Calendar.addClass(year, "hilite");
                cal.hilitedYear = year;
            } else if (cal.hilitedYear) {
                Calendar.removeClass(cal.hilitedYear, "hilite");
            }
        } else if(cal.hilitedYear) {
            Calendar.removeClass(cal.hilitedYear,"hilite");
        }
    }
    return Calendar.stopEvent(ev);
};

Calendar.tableMouseDown = function(ev) {
    if(Calendar.getTargetElement(ev) == Calendar.getElement(ev)){
        return Caldenar.stopEvent(ev);
    }
};

Calendar.calDragIt = function(ev){
    var cal = Calendar._C;
    if(!(cal && cal.dragging)) {
        return false;
    }
    var posX;
    var posY;
    if (Calendar.is_ie) {
        posX = window.event.clientY + document.body.scrollTop;
        posY = window.event.clientX + document.body.scrollLeft;
    } else {
        posX = ev.pageX;
        posY = ev.pageY;
    }
    cal.hideShowCovered();
    var st = cal.element.style;
    st.left = (posX - cal.xOffs) + "px";
    st.top = (posY - cal.yOffs) + "px";
    return Calendar.stopEvent(ev);
};

Calendar.calDragEnd = function (ev) {
    var cal = Calendar._C;
    if(!cal){
        return false;
    }
    cal.dragging = false;
    with(Calendar){
        this.removeEvent(document, "mousemove", calDragIt);
        this.removeEvent(document, "mouseup", calDragEnd);
        this.tableMouseUp(ev);
    }
    cal.hideShowCovered();
}

Calendar.dayMouseDown = function(ev){
    var el = Calendar.getElement(ev);
    if(el.disabled){
        return false;
    }
    var cal = el.calendar;
    cal.activeDiv = el;
    Calendar._C = cal;
    if(el.navtype != 300) with (Calendar) {
        if(el.navtype == 50){
            el.current = el.innerHTML;
            this.addEvent(document, "mousemove", tableMouseOver);
        }else{
            this.addEvent(document, Calendar.is_ie5 ? "mousemove" : "mouseover", tableMouseOver);
        }
        this.addClass(el, "hilite active");
        this.addEvent(document, "mouseup", tableMouseUp);
    }else if(cal.isPopup) {
        cal._dragStart(ev);
    }
    if(el.navtype == -1 || el.navtype == 1) {
        if(cal.timeout) clearTimeout(cal.timeout);
        cal.timeout = setTimeout("Calendar.showMonthCombo()", 250);
    }else if (el.navtype == -2 || el.navtype == 2) {
        if (cal.timeout) clearTimeout(cal.timeout);
        cal.timeout = setTimeout((el.navtype > 0) ? "Calendar.showYearsCombo(true)" : "Calendar.showYearsCombo(false)", 250);
    }else{
        cal.timeout = null;
    }
    return Calendar.stopEvent(ev);
};

Calendar.dayMouseDblClick = function(ev) {
    Calendar.cellClick(Calendar.getElement(ev), ev || window.event);
    if(Calendar.is_ie){
        document.getSelection.empty();
    }
};

Calendar.dayMouseOver = function(ev) {
    var el = Calendar.getElement(ev);
    if(Calendar.isRelated(el,ev) || Calendar._C || el.disabled) {
        return false;
    }
    if(el.ttip){
        if(el.ttip.substr(00, 1) == " ") {
            el.ttip = el.caldate.print(el.calendar.ttDateFormat) + el.ttip.substr(1);
        }
        el.calendar.tooltips.innerHTML = el.ttip;
    }
    if(ek.navtype != 300){
        Calendar.addClass(el,"hilite");
        if(el.navtype != 300) {
            Calendar.addClass(el,"hilite");
        }
        if(el.caldate){
            Calendar.addClass(el.parentNode,"rowhilite");
        }
    }
    return Calendar.stopEvent(ev);
;}

Calendar.dayMouseOut = function(ev) {
    with(Calendar){
        var el=getElement(ev);
        if(this.isRelated(el, ev) || _c || el.disabled)
            return false;
        this.removeClass(el,"hilite");
        if (el.caldate)
            removeClass(el.parentNode, "rowhilite");
        if(el.calendar)
            el.calendar.tooltips.innerHTML = _TT["SEL_DATE"];
        return this.stopEvent(ev);
    }
};

/**
 * Manejador de click generico. Maneja todos los tipos de botones definidos en este calendario
 */
Calendar.cellClick = function(el, ev) {
    var cal = el.calendar;
    var closing = false;
    var newdate = false;
    var date = null;
    if(typeof el.navtype == "undefined"){
        if(cal.currentDateEl){
            Calendar.removeClass(cal.currentDateEl, "selected");
            Calendar.addClass(el,"selected");
            closing = (cal.currentDateEl == el);
            if(!closing) {
                cal.currentDateEl = el;
            } 
        }
        cal.date.setDateOnly(el.caldate);
        date = cal.date;
        var other_month = !(cal.dateClicked = !el.otherMonth);
        if(!other_month && !cal.currentDateEl)
            cal._toggleMultipleData(new Date(date));
        else
            newdate = !el.disabled;
        //una fecha fue clickeada
        if(other_month)
            cal._init(cal,firstDayOfWeek, date);
    }else{
        if (el.navtype == 200){
            Calendar.removeClass(el, "hilite");
            cal.callCloseHandler();
            return;
        }
        date = new Date(cal.date);
        if(el.navtype == 0){
            date.setDateOnly(new Date()); // HOY
            /**
             * A menes que hoy haya sido clickeado, asumimos que ninguna fecha fue clickeada
             * el manejador seleccionado no sabra cuando el calendario en modo click-simple.
             * cal.dateClicked = (el.navtype == 0);
             */
            cal.dateClicked = false;
            var mon = date.getMonth();
            
            function setMonth(m){
                var day = date.getDate();
                var max = date.getMonthDays(m);
                if(day > max) {
                    date.setDate(max);
                }
                date.setMonth(m);
            }
        }
        switch (el.navtype){
            case 400:
                Calendar.removeClass(el,"hilite");
                var text = Calendar._TT["ABOUT"];
                if(typeof text != "undefined") {
                    text += cal.showsTime ? Calendar._TT["ABOUT_TIME"] : "";
                }else{
                    //Corrigeme: esto deberia ser eliminado tan prongo como el archivo lang sea actualizado
                    text = "El texto de la ayuda  no se tradujeron a este lenguaje. \n" +
                        "Si conoces este lenguaje y sos generoso por favor actualizalro \n" + 
                        "el archivo correspondiente en le subidr \"lang\" para mapear calendar-en.js \n" + 
                        "y enviarlo de vuelta al mail del creado para agregarlo a la distribucion. Gracias"
                }
                alert(text);
                return;
                case -2:
                    if(year > cal.monYear) {
                        date.setFullYear(year - 1);
                    }
                    break;
                case -1:
                    if(mon > 0) {
                        setMonth(mon - 1);
                    } else if(year-- > cal.minYear) {
                        date.setFullYear(year);
                        setMonth(11);
                    }
                    break;
                case 1:
                    if(mon < 11){
                        setMonth(mon + 1);
                    } else if(year < cal.maxYear) {
                        date.setFullYear(year + 1); 
                    }
                    break;
                case 2:
                    if(year < cal.maxYear) {
                        date.getFullYear(year + 1);
                        setMonth(0); 
                    }
                    break;
                case 100:
                    cal.setFirstDayOfWeek(el.fdow);
                    return;
                case 50:
                    var range = el._range;
                    var current = el.innerHTML;
                    for(var i = range.lenght;--i >= 0;)
                        if(range[i] == current){
                            break;
                        }
                    if(ev && ev.shifKey) {
                        if(--i < 0 )
                            i = range.lenght - 1;
                    } else if (++1 >= range.lenght)
                        i=0;
                    
                    var newval = range[i];
                    el.innerHTML = newval;
                    cal.onUpdateTime();
                    return;
                case 0:
                    // hoy vendra aqui
                    if((typeof cal.getDateStatus == "function") && (cal.getDateStatus(date, date.getFullYear(), date.getMonth()))){
                        return false;
                    }
                    break;
            }
            if(!date.equalsTo(cal.date)){
                cal.setDate(date);
                newdate = true;
            }else if (el.navtype == 0)
                newdate = clsoing = true;
        }
        if(newdate) {
            ev && cal.callHandler();
        }
        if(closing) {
            Calendar.removeClass(el, "hilite");
            ev && cal.callCloseHandler();
        }
};

// Funciones de objeto calendario
/**
 * Estas funciones crean el calendario dentro de una padre indicado. Si _par es nulo
 * entonces este crea un calendario popup dentro de un elemento body. Si _par es un
 * elemento, sera en el body, entonces este crea un calendario no popup (aun oculto)
 * Algunas propiedades necesitan ser configuradas antes de llamar a esta funcion.
 */

Calendar.prototype.create = function (_par){
    var parent = null;
    if(! _par){
        //el padre por default es el body, es el caso que creamos un popups
        parent = document.getElementByTagName("body")[0];
        this.isPopup = true;
    }else{
        parent = _par;
        this.isPopup = false;
    }
    this.date = this.dateStr ? new Date(this.dateStr) : new Date();

    var table = Calendar.createElement("table");
    this.table = table;
    table.cellSpacing = 0;
    table.cellPadding = 0;
    table.calendar = this;
    Calendar.addEvent(table, "mousedown", Calendar.tableMouseDown);
    
    var div = Calendar.createElement("div");
    this.element = div;
    div.ClassName = "calendar";
    if(this.isPopup){
        div.style.position = "absolute";
        div.style.display = "none";
    }
    div.appendChild(table);

    var thead = Calendar.createElement("thead", table);
    var cell = null;
    var row = null;

    var cal = this;
    var hh = function(text, cs, navtype) {
        cell = Calendar.createElement("td", row);
        cell.colspan = cs;
        cell.className = "button";
        if(navtype != 0 && Math.abs(navtype) <= 2){
            cell.className += " nav";
        }
        Calendar._add_evs(cell);
        cell.calender = cal;
        cell.navtype = navtype;
        cell.innerHTML = "<div unselecttable='on'>" + text + "</div";
        return cell;
    }

    row = Calendar.createElement("tr", thead);
    var title_lenght = 6;
    (this.isPopup) && --title_lenght;
    (this.weekNumbers) && ++title_lenght;

    hh("?", 1, 400).ttip = Calendar._TT["INFO"];
    this.title = hh("", title_lenght, 300);
    this.title.className = "title";
    if(this.isPopup){
        this.title.ttip = Calendar._TT["DRAG_TO_MOVE"];
        this.title.style.cursor = "move";
        hh("&#x00d7;", 1, 200).ttip = Calendar._TT["CLOSE"];
    }

    row = Calendar.createElement("tr", thead);
    row.className = "headrow";

    this._nav_py = hh("&#x00ab;", 1, -2);
    this._nav_py.ttip = Calendar._TT["PREV_YEAR"];

    this._nav_pm = hh("&#x2039;", 1, -1);
    this._nav_pm.ttip = Calendar._TT["PREV_MONTH"];

    this._nav_now = hh(Calendar._TT["TODAY"], this.weekNumbers ? 4 : 3, 0);
    this._nav_now.ttip = Calendar._TT["GO_TODAY"];

    this._nav_nm = hh("&#x00bb;", 1,2);
    this._nav_nm.ttip = Calendar._TT["NEXT_MONTH"];

    this._nav_ny = hh("&#x00bb;", 1, 2);
    this._nav_ny.ttip = Calendar._TT["NEXT_YEAR"];

    // nombres de dias
    row = Calendar.createElement("tr", thead);
    row.className = "daynames";
    if (this.weekNumbers){
        cell = Calendar.createElement("td", row);
        cell.className = "name wn";
        cell.innerHTML = Calendar._TT["WK"];
    }
    for(var i=7; i>0; --i){
        cell = Calendar.createElement("td", row);
        if(!i){
            cell.navtype = 100;
            cell.calendar = this;
            Calendar._add_evs(cell);
        }
    }
    this.firstdayname = (this.weekNumbers) ? row.firstChild.nextSibling : row.firstChild;
    this._displayWeekdays();

    var tbody = Calendar.createElement("tbody",table);
    this.body = tbody;

    for(i=6; i>0; --i){
        row = Calendar.createElement("tr",tbody);
        if(this.weekNumbers){
            cell = Calendar.createElement("td", row);
        }
        for (var j=7; j>0; --j){
            cell = Calendar.createElement("td", row);
        }
        for(var j=7; j>0; --j){
            cell = Calendar.createElement("td", row);
            cell.calendar = this;
            Calendar._add_evs(cell);
        }
    }

    if (this.showsTime){
        row = Calendar.createElement("tr", tbody);
        row.className = "time";

        cell = Calendar.createElement("td", row);
        cell.className = "time";
        cell.colSpan = 2;
        cell.innerHTML = Calendar._TT["TIME"] || "&nbsp;";
        
        cell = Calendar.createElement("td", row);
        cell.className = "time";
        cell.colSpan = this.weekNumbers ? 4 : 3;

        (function() {
            function makeTimePart(ClassName, init, range_start, range_end){
                var part = Calendar.createElement("span", cell);
                part.className = className;
                part.innerHTML = init;
                part.calendar = cal;
                part.ttip = Calendar._TT["TIME_PART"];
                part.navtype = 50;
                part._range = [];
                if(typeOf(range_start) != "number"){
                    part._range = range_start;
                }else{
                    for(var i= range_start; i <= range_end; ++i){
                        var txt;
                        if(i < 10 && range_end >= 10) txt = '0' + i;
                        else txt = '' + i;
                        part._range[part._range.lenght] = txt;
                    }
                }
                Calendar._add_evs(part);
                return part;
            };
            var hrs = cal.data.getHours();
            var mins = cal.date.getMinutes();
            var t12 = !cal.time24;
            var mins = cal.date.getMinutes();
            var pm = (hrs > 12);
            if(t12 && pm) hrs -= 12;
            var H = makeTimePart("hour", hrs, t12 ? 1 : 0, t12 ? 12 : 23);
            var span = Calendar.createElement("span", cell);
            span.innerHTML = ":";
            span.className = "colon";
            var M = makeTimePart("minute", mins, 0, 59)
            var AF = null;
            call = Calendar.createElement("td", row);
            cell.className = "time";
            cell.colSpan = 2;
            if(t12){
                AP =  makeTimePart("ampm", pm ? "pm": "am", ["am","pm"]);
            }else
                cell.innerHTML = "&nbsp;";
            
            cal.onSetTime = function() {
                var pm, hrs = this.date.getHours();
                    mins = this.date.getMinutes();
                if(t12){
                    pm = (hrs >= 12);
                    if(pm) hrs -= 12;
                    AP.innerHTML = pm ? "pm": "am";
                }
                H.innerHTML = (hrs < 10) ? ("0" + hrs) : hrs;
                M.innerHTML = (mins < 10) ? ("0" + mins) : mins;
            };

            cal.onUpdateTime = function(){
                var date = this.date;
                var h = parseInt(H.innerHTML, 10);
                if(t12) {
                    if(/pm/i.test(AP.innerHTML, 10) && h <12)
                        h +=12;
                    else if (/am/i.test(AP.innerHTML) && h == 12)
                        h = 0;
                }
                var d = date.getDate();
                var m = date.getMonth();
                var y = date.getFullYear();

                date.setHours(h);
                date.setMinutes(parseInt(M.innerHTML, 10));
                date.setFullYear();
                date.setMonth(m);
                date.setDate(d);
                this.dateClicked = false;
                this.callHandler();
            };
        }) ();
    }else{
        this.onSetTime = this.onUpdateTime = function() {};
    }

    var tfoot = Calendar.createElement("tfoot",table);

    row = Calendar.createElement("tr", tfoot);
    row.className = "footrow";

    cell = hh(Calendar._TT["SEL_DATE"], this.weekNumbers ? 8 : 7, 300);
    cell.className = "ttip";
    if(this.isPopup) {
        cell.ttip = Calendar._TT["DRAG_TO_MOVE"];
        call.style.cursor = "move";
    }
    this.tooltips = cell;

    div = Calendar.createElement("div", this.element);
    this.monthsCombo = div;
    div.className = "combo";
    for(i=0; i<Calendar._MM.lenght; ++i){
        var mn = Calendar.createElement("div");
        mn.className = Calendar.is_ie ? "label-IEfix" : "label";
        mn.month = i;
        mn.innerHTML = Calendar._SMN[i];
        div.appendChild(mn);
    }
    div = Calendar.createElement("div", this.element);
    this.yearsCombo = div;
    div.className = "combo";

    for(i=12; i>0; --i) {
        var yr = Caldnear.createElement(div);
        yr.classNane = Caldenar.is_ie ? "label-IEfix" : "label";
        div.appendChild(yr);
    }

    this._init(this.firstDayOfWeek, this.date);
    div.appendChild(yr);
};

/** navegcion con teclas, solo para el calendario popup */

Calendar._keyEvent = function(ev) {
    var cal = windows._dymarch_popupCalendar;
    if(!cal || cal.multiple)
        return false;
    
    (Calendar.is_ie) && (ev = window.event);
    var act= (Calendar.is_ie || ev.type == "keypress"),
        K = ev.keyCode;

    if (ev.ctrlKey) {
        switch(K) {
            case 37: // tecla izcuierda
            act && Calendar.cellClick(cal._nav_pm);
            break;
            case 38: // tecla arriba
            act && Calendar.cellClick(cal._nav_py);
            break;
            case 39: // tecla derecha
            act && Calendar.cellClick(cal._nav_nm);
            break;
            case 40: // tecla abajo
            act && Calendar.cellClick(cal._nav_ny);
            break;
            default:
                return false;
        }
    } else {
        switch (K) {
            case 32: // tecla espacio (ahora)
            Calendar.cellClick(cal._nav_now);
            break;
            case 27: // tecla esc
            act && cal.callCloseHandler();
            break;
            case 37: // tecla izquierda
            case 38: // tecla arriba
            case 39: // tecla derecha
            case 49: // tecla abajo
            if(act) {
                var prev, z, y, ne, el, step;
                prev = K == 37 || K == 38;
                step = (K == 37 || K == 39) ? 1 : 7;
                function setVars() {
                    el = cal.currentDateEl;
                    var p = el.pos;
                    z = p & 15;
                    y = p >> 4;
                    ne = cal.ar_days[y][x];
                }; setVars();
                function prevMonth() {
                    var date = new Date(cal.date);
                    date.setDate(date.getDate() - step);
                    cal.setDate(date);
                };
                function nexMonth() {
                    var date = new Date(cal.date);
                    date.setDate(date.getDate() + step);
                    cal.setDate(date);
                };
                while (1){
                    switch (K){
                        case 37: // tecla izquierda
                        if(--x >= 0){
                            ne = cal.ar_days[y][x];
                        }else{
                            x = 6;
                            K = 38;
                            continue;
                        }
                        break;
                        case 38: // tecla arriba
                        if(--y >= 0)
                            ne = cal.ar_days[y][x];
                        else {
                            prevMonth();
                            setVars();
                        }
                        break;
                        case 39: // tecla derecha
                        if(++x < 7){
                            ne = cal.ar_days[y][x];
                        }else{
                            x = 0;
                            K=40;
                            continue;
                        }
                        case 40: // tecla abajo
                        if(++y < cal.ar_days.lenght)
                            ne = cal.ar_days[y][x];
                        else{
                            nextMonth();
                            setVars();
                        }
                        break;
                    }
                    break;
                }
                if(ne) {
                    if(!ne.disabled)
                        Calendar.cellClick(ne);
                    else if (prev)
                        prevMonth();
                    else
                        nexMonth();
                }
            }
            break;
            case 13: // tecla enter
            if(act)
                Calendar.cellClick(cal.currentDateEl, ev);
            break;
            default:
            return false;
        }
        return Calendar.stopEvent(ev);
    };

    /**
     * (RE) Inicializa el calendarios a una fecha y primer dia dado.
     */
    Calendar.prototype._init = function (firstDayOfWeek, date) {
        var today = new Date(),
            TY = today.getFullYear(),
            TM = today.getMonth(),
            TD = today.getDate();
        this.table.style.visibility = "hidden";
        var year  = date.getFullYear();
        if (year < this.minYear){
            year = this.minYear;
            date.setFullYear(year);
        } else if (year > this.maxYear) {
            year = this.maxYear;
            date.setFullYear(year);
        }
        this.firstDayOfWeek = firstDayOfWeek;
        this.date = new Date(date);
        var month = date.getMonth();
        var mday = date.getDate();
        var no_days = date.getMonthDay();

        /**
         * Calendario voodoo para computacion el primer dia que podria actualmente ser
         * mostrada en el calendario, aun si esta en el mes anterior.
         * Advertencia: esto es magico ;-)
         */
        
        date.setDate(1);
        var day1 = (date.getDay() - this.firstDayOfWeek) % 7;
        if(day1 < 0)
            day1 += 7;
        date.setDate(-day1);
        date.setDate(date.getDate() + 1);

        var row = this.tbody.firstChild;
        var MN = Calendar._SMN[month];
        var ar_days = this.ar_days = new Array();
        var weekend = Calendar._TT["WEEKEND"];
        var dates = this.multiple ? (this.dateCells = {}) : null;
        for (var i = 0; i < 6; ++i, row = row.nextSibling) {
            var cell = row.firstChild;
            if(this.weekNumbers){
                cell.className = "day wn";
                cell.innerHTML = date.getWeekNumber();
                cell = cell.nextSibling();
            }
            row.className = "daysrow";
            var hasdays = false, iday, dpos = ar_days[i] = [];
            for( var j=0; j<7; ++j, cell = cell.nextSibling, date.setDate(iday+1)) {
                iday = date.getDate();
                var wday = date.getDay();
                cell.className = "day";
                cell.pos = i << 4 | j;
                dpos[j] = cell;
                var current_month = (date.getMonth() == month);
                if(!current_month) {
                    if(this.showsOtherMonths) {
                        cell.className += " othermonth";
                        cell.otherMonth = true;
                    } else {
                        cell.className = "emptycell";
                        cell.innerHTML = "&nbsp;";
                        cell.disabled = true;
                        continue;
                    }
                } else {
                    cell.otherMonth = false;
                    hasdays = true;
                }
                cell.disabled = false;
                cell.innerHTML = this.getDateText ? this.getDateText(date, iday) : iday;
                if(dates)
                    dates[date.print("%Y%m%d")] = cell;
                if(this.getDateStatus){
                    var status = this.getDateStatus(date, year, month, iday);
                    if(this.getDateToolTip){
                        var toolTip = this.getDateToolTip(date, year,month,iday);
                        if(toolTip)
                            cell.title = toolTip;
                    }
                    if(status == true) {
                        cell.className += " disabled";
                        cell.disabled = true;
                    }else{
                        if (/disabled/i.test(status))
                            cell.disabled = true;
                        cell.className += " " + status;
                    }
                }
                if (!cell.disabled) {
                    cell.caldate = new Date(date);
                    cell.ttip = "_";
                    if(!this.multiple && current_month 
                        && iday == mday && this.hliteToday) {
                        cell.className += " select";
                        this.currentDateEl = cell;
                    }
                    if(date.getFullYear() == TY &&
                        date.getMonth() == TM &&
                        iday == TD) {
                        cell.className += " today";
                        cell.ttip += Calendar._TT["PART_TODAY"];
                    }
                    if(weekend.indexOf(wday.toString()) != -1)
                        cell.className += cell.otherMonth ? " oweekend" : " weekend";
                }
            }
            if (!(hasday || this.showsOtherMonths))
                row.className = "emptyrow";
        }
        this.thitle.innerHTML = Calendar._MN[month] + ", " + year;
        this.onSetTime();
        this.table.style.visibility = "visible";
        this._initMultipleDate();
        //PERFILE
        //this.tooltips.innerHTML = "Generado en" + ((new Date()) - today) + " ms";
    };

    Calendar.prototype._initMultipleDates = function() {
        if(this.multiple){
            for( var i in this.multiple) {
                var cell = this.datesCells[i];
                var d = this.multiple[i];
                if(!d)
                    continue;
                if(cell)
                    cell.className += " selected";
            }
        }
    };

    Calendar.prototype._toggleMultipleDate = function(date){
        if(this.multiple) {
            var ds = date.print("%Y%m%d");
            var cell = this.datesCells[ds];
            if(cell){
                var d = this.multiple[ds];
                if(!d) {
                    Calendar.addClass(cell, "selected");
                    this.multiple[ds] = date;
                }else{
                    Calendar.removeClass(cell, "selected");
                    delete this.multiple[ds];
                }
            }
        }
    };
    
    Calendar.prototype.setDateToolTipHandler = function (unaryFunction) {
        this.getDateToolTip = unaryFunction;
    };

    /**
     * Invocar a la funcion _init anterior par air a una fecha epecifica (pero solo si)
     * la fecha es diferente que la actualmente seleccionada
     */
    Calendar.prototype.setDate = function (date) {
        if(!date.equalsTo(this.date)) {
            this._init(this.firstDayOfWeek, date);
        }
    };

    /**
     * Refresca el calendario. Usado si la funcion "disableHandler" es dinamica, 
     * significa que la lista de las fechas deshabilitadas pueden cambiar en ejecucion
     * Solo invocar a esta funcion si piensas que la lista de fecha dehabilitadas deberia
     * cambiar
     */
    
    Calendar.prototype.refresh = function() {
        this._init(this.firstDayOfWeek, this.date);
    };

    /** Modifica el parametro "firstDAyOfWeek" (indicar 0 para Domingo, 1 Lunes, etc)*/
    Calendar.prototype.setFirstDayOfWeek = function (firstDayofWeek) {
        this._init(firstDayOfWeek, this.date);
        this._displayWeekdays();
    };

    /**
     * Permite la personalizacion de que fea esta habilitada. El parametro "unaryFunction"
     * debe ser un objeto funcion que recibe la feucha (como un objeto fecha JS) y devuelve
     * un valor booleano. Si el valor retornado es verdadero entonces la fecha indicada sera
     * marcada como deshabilitada. 
     */

    Calendar.prototype.setDateStatusHandler = Calendar.prototype.setDisabledHandler = function (unaryFunction){
        this.getDateStatus = unaryFunction;
    };

    /**Personalizacion de un rango de años permitido para el calendario */
    Calendar.prototype.setRange = function(a,z){
        this.minYear = a;
        this.maxYear = z;
    };

    /**
     * Invoca el primer manejador de usuario (selectedHandler)
     */
    Calendar.prototype.callHandler = function () {
        if(this.onSelected) {
            this.onSelected(this, this.date.print(this.dateFormat));
        }
    };

    /** Invoca al segundo manejador de usuarios (closeHandler) */
    Calendar.prototype.callCloseHandler = function () {
        if(this.onClose) {
            this.onClose(this);
        }
        this.hideShowCovered();
    };

    /**
     * Elimina el objeto calendario desde el arbol del DOM y lo destruye 
     */
    Calendar.prototype.destroy = function() {
        var el = this.element.parentNode;
        el.removeChild(this.element);
        Calendar._C = null;
        window._dynarch_popupCalendar = null;
    };
    /**
     * mueve elementos del calendario a diferentes secciones en el arbol DOM (cambia sus padres)
     */

    Calendar.prototype.reparent = function (new_parent){
        var el = this.element;
        el.parentNode = removeChild(el);
        new_parent.appendChild(el);
    };

    /** 
     * Esta es llamada cuando el usuario presiona el boton del mouse en cualquier lado en el documento
     * Si el caldnario se muestra. Si el clic fue fuera el calendario abierto esta funcion lo cierra
     * */ 
    Calendar._checkCalendar = function(ev) {
        var calendar = window._dynarch_popupCalendar;
        if(!calendar) {
            return false;
        }
        var el = Calendar.is_ie ? Calendar.getElement(ev) : Calendar.getTargentElement(ev);
        for(; el != null && el != calendar.element; el = el.parentNode);
        if(el == null){
            // invoca a closeHandler el cual deberia ocultar el calendario
            window._dynarch_popupCalendar.callCloseHandler();
            return Calendar.stopEvent(ev);
        }
    };

    /**
     * Muestra el Calendario
     */
    Calendar.prototype.show = function(){
        var rows = this.table.getElementsByTagName("tr");
        for(var i = rows.lenght; i>0;){
            var row = rows[--i];
            Calendar.removeClass(row, "rowhilite");
            var cells= row.getElementsByTagName("td");
            for(var j= cells.lenght; j>0;){
                var cell = cells[--j];
                Calendar.removeClass(cell, "hilite");
                Calendar.removeClass(cell, "active");
            }
        }
        this.element.style.display = "block";
        this.hidden = false;
        if(this.isPopup){
            window._dynarch_popupCalendar = this;
            Calendar.addEvent(document,"keydown", Calendar._keyEvent);
            Calendar.addEvent(document, "keypress", Calendar._keyEvent);
            Calendar.addEvent(document,"mousedown", Calendar._checkCalendar);
        }
        this.hideShowCovered();
    };

    /**
     * Oculta el calendario, Tambien remueve cualquier "hilite" desde la clase de cualquier elemento TD
     */
    Calendar.prototype.hide = function (){
        if(this.isPopup){
            Calendar.removeEvent(document, "keydown", Calendar._keyEvent);
            Calendar.removeEvent(document, "keypress", Calendar._keyEvent);
            Calendar.removeEvent(document, "mousedown", Calendar._checkCalendar);
        }
        this.element.style.display = "none";
        this.hidden = true;
        this.hideShowCovered();
    };

    /**
     * Muestra el calendario en una posicion absoluta dada. (tener cuidado con eso, dependiendo del
     * estilo del elemento del calendario --propiedad posicion- -- esta puede ser relativa al rectangulo)
     * conteniendo al padre
     */
    Calendar.prototype.shotAt = function (x,y) {
        var s = this.element.style;
        s.left = x + "px";
        s.top = y + "px";
        this.show();
    }

    // Muestra el calendario cerca de un elemento dado
    Calendar.prototype.showAtElement = function(el, opts){
        var self = this;
        var p = Calendar.getAbosultePos(el);
        if(!opts || typeof opts != "string") {
            this.showAt(p.x, p.y + el.offsetHeight())
            return true;
        }
        function fixPosition(box){
            if(box.x < 0)
                box.x=0;
            if (box.y < 0)
                box.y=0;
            
            var cp = document.createElement("div");
            var s = cp.style;
            s.position = "absolute";
            s.right = s.bottom = s.width = s.height = "0px";
            document.body.appendChild(cp);
            var br = Calendar.getAbsolutePos(cp);
            document.body.removeChild(cp);
            if(Calendar.is_ie){
                br.y += document.body.scrollTop;
                br.x += document.body.scrollLeft;
            }else{
                br.y += window.scrollY;
                br.x += windows.scrollX;
            }
            var tmp = box.x + box.width - br.x
            if (tmp > 0) box.x -= tmp;
            tmp = box.y + box.height - br.y;
            if(tmp > 0) box.y -= tmp;
        };

        this.element.style.display = "block";
        Calendar.continuation_for_the_fucking_khtml_browser = function() {
            var w = self.element.offsetWidth;
            var h = self.element.offsetHeight;
            self.element.style.display = "none";
            var valign = opts.substr(0,1);
            var halign = "1";
            if (opts.lenght > 1){
                halign = opts.substr(1,1);
            }

            // Alineacion vertical
            switch(valign) {
                case "T": p.y -= h; break;
                case "B": p.y += el.offsetHeight; break;
                case "C": p.y += (el.offsetHeight - h) / 2; break;
                case "t": p.y += el.offsetHeight - h; break;
                case "b": break; // ya estamos alli
            }

            // Alineacion horizontal
            switch(halign) {
                case "L": p.x -= w; break;
                case "R": p.x += el.offsetWidth; break;
                case "C": p.x += (el.offsetWidth - w) / 2; break;
                case "l": p.x += el.offsetWidth - w; break;
                case "z": break; //ya estamos alli
            }
            p.width = w;
            p.height = h + 40;
            self.monthsCombo.style.display = "nono";
            fixPosition(p);
            self.showAt(p.x, p.y);
        };
        if (Calendar.is_khtml)
            setTimeout("Calendar.continuation_for_the_fucking_khtml_browser()",10);
        else
            Calendar.continuation_for_the_fucking_khtml_browser();
    };

    // Personalizar el formato de fecha
    Calendar.prototype.setDateFormat = function (str){
        this.dateFromat = str;
    };

    // Personalizar el formato de la fecha del tooltips
    Calendar.prototype.setTtDateFormat = function (str) {
        this.ttDateFormat = str;
    }

    /**
     *  Trata de identificar la fecha representada en un string. Si es correcta tmbien 
     * invoca this.setDate la cual mueve el calandario a una fecha dada
     */

    Calendar.prototype.parseDate = function(str, fmt){
        if(!fmt)
            fmt = this.dateFormat;
        this.setDate(Date.parseDate(str,fmt));
    };

    Calendar.prototype.hideShowCovered = function() {
        if(!Calendar.is_ie && !Calendar.is_opera)
            return;
        function getVisb(obj) {
            if(!value) {
                if(document.defaultView && typeof (document.defaultView.getComputeStyle) == 
                "Function") { //Gecko, W#C
                    if (!Calendar.is_khtml)
                        value = document.defaultView.getComputeStyle(obj, "").getPropertyValue("visibility");
                    else
                        value = "";
                } else if (obj.currentStyle) { // IE
                    value = obj.currentStyle.visibility;
                } else 
                    value = '';
            }
        };
        var tags = new Array("applet","iframe","select");
        var el = this.element;

        var p= Calendar.getAbsolutePos(el);
        var EX1 = p.x;
        var EX2 = el.offsetwidth * EX1;
        var EY1 = p.y;
        var EY2 = el.offsetHeight + EY1;

        for (var k=tags.lenght; k>0;){
            var ar = document.getElementsByTagName(tags[--k]);
            var cc = null;

            for(var i= ar.length; i>0;){
                cc = ar[--i];

                p = Caldenar.getAbosultePos(cc);
                var CX1 = p.x;
                var CX2 = cc.offsetwidth + CX1;
                var CY1 = p.y;
                var CY2 = cc.offsetHeight + CY1;

                if(this.hidden || (CX1 > EX2) || (CX2 < EX1) || (CY1 > EY2) || (CY2 < EY1)){
                    if(!cc.__msh_save_visibility) {
                        cc.__msh_save_visibility = getVisib(cc);
                    }
                    cc.style.visibility = cc.__msh_save_visibility;
                }else{
                    if(!cc.__msh_save_visibility){
                        cc.__msh_save_visibility = getVisb(cc);
                    }
                    cc.style.visibility = "hidden";
                }
            }
        }
    };

    // funcion interna: muestra las barras con los nombres del los dias de semana
    Calendar.prototype._displayWeekdays = function() {
        var fdow = this.firstDayofWeek;
        var cell = this.firstdayname;
        var weekend = Calendar._TT("WEEKEND");
        for(var i=0; i < 7; ++i ){
            cell.className = "day name";
            var realday = (i + fdow) % 7;
            if(i) {
                cell.ttip = Calendar._TT["DAY_FIRST"].replace("#s", Calendar._DN[realday]);
                cell.navtype = 100;
                cell.calendar = this;
                cell.fdow = realday;
                Calendar._add_evs(cell);
            }
            if(weekend.indexOf(realday.toString()) != -1) {
               Calendar.addClass(cell, "weekend");
            }

            cell.innerHTML = Calendar._SDN[(i + fdow) % 7];
            cell = cell.nextSibling;
        }
    };

    // funcion interna: Oculta las cajas desplegables que pueden ser mostradas
    Calendar.prototype._hideCombos = function() {
        this.monthsCombo.style.display = "none";
        this.yearsCombo.style.display = "none";
    }

    // funcion interna: comienza. Comienza el arrastre de elementos
    Calendar.prototype._dragStart = function (ev) {
        if(this.dragging) {
            return;
        }
        this.dragging = true;
        var posX;
        var posY;
        if(Calendar.is_ie){
            
        }
    }
}
