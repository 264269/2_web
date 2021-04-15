function initMainCityUpdate() {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            ans = `http://localhost:3000/weather/coordinates?lat=${lat}&lon=${lon}`;
            updateMainCity(ans);
        },
        function (err) {
            ans = `http://localhost:3000/weather/city?q=абу-даби`;
            updateMainCity(ans);
        });
}
async function updateMainCity(req) {
    try {
        await fetch(req)
            .then(response => response.json())
            .then(data => {
                if (data.cod !== 200) {
                    alert("К сожалению, у нас нет информации о погоде в месте, где Вы находитесь.");
                    return;
                }
                fillMainCity(data);
            });
    } catch(err) {
        makeOffline(document.querySelector('#general-city'));
    }
}
function fillMainCity(data) {
    document.querySelector('#general-city h2').textContent = data.name;
    document.querySelector('#general-city span.temperature').textContent = Math.round(data.main.temp) - 273 + "°C";
    document.querySelector('#general-city img').src = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";

    document.querySelector('#general-city ul li span.wind').textContent = data.wind.speed + "м/с";
    document.querySelector('#general-city ul li span.cloudiness').textContent =
        data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    document.querySelector('#general-city ul li span.pressure').textContent = data.main.pressure + "мм рт. ст.";
    document.querySelector('#general-city ul li span.humidity').textContent = data.main.humidity + "%";
    document.querySelector('#general-city ul li span.cords').textContent = Number((data.coord.lat).toFixed(1)) + "°, " + Number((data.coord.lon).toFixed(1)) + "°";
}


function getCityURL(city) {
    return `http://localhost:3000/weather/city?q=${city}`;
}
function fillFavouriteCity(el, data) {
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
    if (!city) {
        alert("Название города не может быть пустым");
        return;
    }
    inputBox.value = '';

    document.querySelector('#favorite-cities').appendChild(createEmptyCity());
    let el = document.querySelector('#favorite-cities').lastElementChild;

    try {
        await fetch(getCityURL(city))
            .then(response => response.json())
            .then(async data => {
                if (data.cod !== 200) {
                    alert("Мы не смогли найти город этот город.");
                    el.remove();
                    return;
                }
                fillFavouriteCity(el, data);
                await fetch(`http://localhost:3000/features?city=${data.name.toLowerCase()}`,
                {
                    method: 'POST'
                });
            });
    } catch(err) {
        console.log(err);
        makeOffline(el);
    }
}

async function deleteCity(el, name) {
    el.querySelector('button').disabled = true;
    console.log('clicked');
    name = name.toLowerCase();

    try {
        await fetch('http://localhost:3000/features?city=' + name,
            {
                method: 'DELETE'
            })
            .then(response => {
                if (response.status === 200) {
                    el.remove();
                }
            })
    } catch (err) {
        el.querySelector('button').disabled = false;
    }
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
    let cities;
    await fetch("http://localhost:3000/features")
        .then(response => response.json())
        .then(data => {
            cities = data;
        });

    if (cities) {
        for (let city of cities) {
            document.querySelector('#favorite-cities').appendChild(createEmptyCity());
        }
        let iter = 0;
        for (let city of cities) {
            try {
                let data = await fetch(getCityURL(city))
                    .then(response => response.json());
                fillFavouriteCity(document.querySelectorAll('.favorite-city')[iter], data);
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
        addCity();
    })
    document.querySelector('#update-geolocation').addEventListener('click', initMainCityUpdate);

    initMainCityUpdate();
    updateCities();
}

window.addEventListener('load', init);



