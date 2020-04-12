function loadHtml (rootElem, htmlName) {
  (function(scope) { 
    var url = '/partials/' + htmlName,
        xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            rootElem.innerHTML = this.responseText;
        }
    };
    xhttp.open('GET', url, true);
    xhttp.send();
  })(document);
}