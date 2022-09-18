function httpGet(theUrl) {
    let xmlHttpReq = new XMLHttpRequest();
    xmlHttpReq.open("GET", theUrl, false);
    xmlHttpReq.send(null);
    return xmlHttpReq.responseText;
}

let monthsInDutch = ["jan", "feb", "maa", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]

function getFilmsFiltered(proxiedDocument) {
    let filmdetails = proxiedDocument.getElementsByClassName("row filmdetails")
    let filteredFilms = []
    for (let film of filmdetails) {
        let title = film.getAttribute("data-title");
        let link = film.getElementsByTagName("a")[0].getAttribute("href")
        let imgSrc = film.getElementsByTagName("img")[0].getAttribute("src")

        let englishSubsOrOriginal = false
        for (col of film.getElementsByClassName("col-xs-12")) {
            if (col.textContent.indexOf("Engels") > 0 || col.textContent.indexOf("geen") > 0)
                englishSubsOrOriginal = true
        }
        let thisYear = new Date().getFullYear()
        let screenings = Array.from(film.getElementsByClassName("day")).map(e => {
            let timeDate = e.firstElementChild.textContent.substring(3).split(' ')
            let ticketsLink = e.getElementsByTagName("a")[0]?.getAttribute("href") ?? ""
            return {
                // Yes, this will go bad for a bit around December but c'est la vie
                date: new Date(thisYear, monthsInDutch.indexOf(timeDate[1]), parseInt(timeDate[0]), parseInt(timeDate[2].split(':')[0]), parseInt(timeDate[2].split(':')[1]), 0, 0),
                ticketsLink: ticketsLink
            }
        }).filter(s => s.date.getHours() >= 18)

        if (englishSubsOrOriginal) {
            filteredFilms.push({
                title: title,
                imgSrc: imgSrc,
                link: link,
                screenings: screenings
            })
        }
    }
    return filteredFilms.sort((filmA, filmB) => Math.min(...filmA.screenings.map(e => e.date.valueOf())) - Math.min(...filmB.screenings.map(e => e.date.valueOf())))
}

function injectResultsToDom(film) {
    const row = document.createElement("tr");
    const td1 = document.createElement("td")
    const td1a = document.createElement("img")
    const td2 = document.createElement("td")

    td1a.setAttribute("src", film.imgSrc)
    td1a.setAttribute("loading", "lazy")
    td1a.setAttribute("class", "img-rounded img-responsive poster")
    td1.setAttribute("class", "col-xs-6")
    td1.appendChild(td1a);

    td2.setAttribute("class", "col-xs-6")
    td2.append(title(film.title, film.link), screeningsContainer(film.screenings))

    row.append(td1, td2)
    document.getElementById("core-table").appendChild(row);
}

function title(title, link) {
    const h2 = document.createElement("h3")
    const a = document.createElement("a")
    a.setAttribute("href", link)
    a.textContent = title
    h2.appendChild(a)
    return h2
}

function screeningsContainer(screenings) {
    const wrapper = document.createElement("div")
    // wrapper.setAttribute("class", "container")

    for (let screening of screenings) {
        const row = document.createElement("div")
        row.setAttribute("class", "row")

        const button = document.createElement("a")
        button.setAttribute("class", "btn btn-default")
        button.textContent = dateFormat(screening.date)
        if (screening.ticketsLink !== "")
            button.setAttribute("href", screening.ticketsLink)
        else
            button.setAttribute("disabled", "disabled")

        row.appendChild(button)
        wrapper.appendChild(row)
    }

    return wrapper
}

function dateFormat(date) {
    return `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:${date.getMinutes()}`
}

let proxiedDocument = new DOMParser().parseFromString(httpGet('/proxy'), 'text/html')

for (let film of getFilmsFiltered(proxiedDocument)) {
    if (film.screenings.length > 0)
        injectResultsToDom(film)
}
