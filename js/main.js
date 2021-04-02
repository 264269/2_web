

function getMainCityCoords() {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            updateMainCity(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=40b59a908fc6450e086253153b78d13e&lang=ru`);
        },
        function (err) {
            updateMainCity(`https://api.openweathermap.org/data/2.5/weather?q=москва&appid=40b59a908fc6450e086253153b78d13e&lang=ru`);
        });
}

async function updateMainCity(coords) {
    try {
        let data = await fetch(coords)
            .then(resp => resp.json());
            
        if (data.cod != 200) {
            alert("К сожалению, у нас нет информации о погоде в месте, где Вы находитесь.");
            return;
        }

        document.querySelector('#general-city h2').textContent = data.name;
        document.querySelector('#general-city span.temperature').textContent = Math.round(data.main.temp) - 273 + "°C";
        document.querySelector('#general-city img').src = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";

        document.querySelector('#general-city ul li span.wind').textContent = data.wind.speed + "м/с";
        document.querySelector('#general-city ul li span.cloudiness').textContent =
            data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
        document.querySelector('#general-city ul li span.pressure').textContent = data.main.pressure + "мм рт. ст.";
        document.querySelector('#general-city ul li span.humidity').textContent = data.main.humidity + "%";
        document.querySelector('#general-city ul li span.cords').textContent = Number((data.coord.lat).toFixed(1)) + "°, " + Number((data.coord.lon).toFixed(1)) + "°";
    } catch(err) {
        makeOffline(document.querySelector('#general-city'))
        return;
    }
}

const getCityInfo = (city) => {
    return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=40b59a908fc6450e086253153b78d13e&lang=ru`;
}

function updateFavourite(el, data) {
    el.querySelector('h3').textContent = data.name;
    el.querySelector('span.temperature').textContent = Math.round(data.main.temp) - 273 + "℃";
    el.querySelector('img').src = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";

    el.querySelector('span.wind').textContent = data.wind.speed + "м/с";
    el.querySelector('span.cloudiness').textContent = 
        data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    el.querySelector('span.pressure').textContent = data.main.pressure + "мм рт. ст.";
    el.querySelector('span.humidity').textContent = data.main.humidity + "%";
    el.querySelector('span.cords').textContent = Number((data.coord.lat).toFixed(1)) + "°, " + Number((data.coord.lon).toFixed(1)) + "°";
    
    el.querySelector('button.delete').addEventListener('click', () => deleteCity(el, data.name));
}

function createEmptyCity() {
    var el = document.querySelector('#city-template').content.cloneNode(true);
    return el;
}

async function addCity() {
    var inputBox = document.querySelector('#add-favorite input');
    var city = inputBox.value;
    inputBox.value = '';
    if (!city) {
        alert("Название города не может быть пустым");
        return;
    }
    document.querySelector('#favorite-cities').appendChild(createEmptyCity());
    let el = document.querySelector('#favorite-cities').lastElementChild;

    let data = await fetch(getCityInfo(city))
        .then(resp => resp.json());
    if (data.cod != 200) {
        alert("Город не найден");
        el.remove();
        return;
    }
    
    updateFavourite(el, data);

    var cities = localStorage.getItem("fav-cities");
    if (cities) {
        cities = JSON.parse(cities);
        cities.push(city.toLowerCase());
    } else {
        cities = Array.of(city);
    }
    localStorage.setItem("fav-cities", JSON.stringify(cities));
}

function deleteCity(el, name) {
    el.remove();
    var cities = JSON.parse(localStorage.getItem("fav-cities"));
    cities.splice(cities.indexOf(name.toLowerCase()), 1);
    localStorage.setItem("fav-cities", JSON.stringify(cities));
}

function makeOffline(el) {
    if (el.querySelector('h2')) {
        el.querySelector('h2').textContent = "Ошибка загрузки";
    }
    if (el.querySelector('h3')) {
        el.querySelector('h3').textContent = "Ошибка загрузки";
    }
}

async function updateCities() {
    var cities = localStorage.getItem("fav-cities");
    console.log(cities);
    if (cities) {
        for (let city of JSON.parse(cities)) {
            document.querySelector('#favorite-cities').appendChild(createEmptyCity());
        }
        let iter = 0;
        for (let city of JSON.parse(cities)) {
            try {
                let data = await fetch(getCityInfo(city))
                    .then(resp => resp.json());
                updateFavourite(document.querySelectorAll('.favorite-city')[iter], data);
            } catch(err) {
                makeOffline(document.querySelectorAll('.favorite-city')[iter]);
            }
            iter = iter + 1;
        }
    }
}

function init() {
    document.querySelector('#add-city').addEventListener('submit', (event) => {
        event.preventDefault();
        addCity;
    });
    document.querySelector('#add-new-city').addEventListener('click', addCity);
    document.querySelector('#update-geolocation').addEventListener('click', getMainCityCoords);

    getMainCityCoords();
    updateCities();
}

window.addEventListener('load', init);



