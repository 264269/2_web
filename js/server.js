const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;
const dbURI = 'mongodb://localhost:27017/';

var MongoClient = require('mongodb').MongoClient;

//Права доступа
let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
}
app.use(allowCrossDomain);

//Получение информации о городе по названию
function selectByCity (city) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${city}&lang=ru&appid=94d4575428dc92002c2aca36ad6f2ca9`;
}

//Получение информации о городе по координатам
function selectByCoords(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=40b59a908fc6450e086253153b78d13e&lang=ru`;
}

//Получение ip
const parseIp = (req) =>
    (typeof req.headers['x-forwarded-for'] === 'string'
        && req.headers['x-forwarded-for'].split(',').shift())
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.connection?.socket?.remoteAddress;

//гет-запрос на получение инфо о городе
app.get('/weather/city', (request, response) => {
    const city = request.query['q'];
    fetch(selectByCity(encodeURIComponent(city)))
        .then(response => response.json())
        .then(data => {
            response.send(data);
        })
})
app.get('/weather/coordinates', (request, response) => {
    const lat = request.query['lat'];
    const lon = request.query['lon'];
    fetch(selectByCoords(lat, lon))
        .then(response => response.json())
        .then(data => {
            response.send(data);
        })
})

//гет-запрос на получение списка городов
app.get('/features', async (request, response) => {
    let ip = parseIp(request);
    if (ip) {
        MongoClient.connect(dbURI, (err, client) => {
            if (err) {
                return console.log(err);
            }
            const db = client.db("citiesDB");
            const collection = db.collection("cities");
            collection.find({"ip": ip}).toArray((err, result) => {
                if (err) {
                    return console.log(err);
                }
                let cities = result;
                console.log(result);
                response.send(Array.prototype.map.call(cities, el => el['city']));
            });
            client.close();
        });
    }
})

//пост-запрос на добавление города в список
app.post('/features', (request, response) => {
    let ip = parseIp(request);
    let city = request.query['city'];
    if (ip && city) {
        MongoClient.connect(dbURI, (err, client) => {
            if (err) {
                return console.log(err);
            }
            
            const db = client.db("citiesDB");
            const collection = db.collection("cities");

            collection.insertOne({"ip": ip, "city": city}, (err, result) => {
                client.close();
            });
        });
        response.send(city);
    }
})

//делит-запрос на удаление города
app.delete('/features', (request, response) => {
    let ip = parseIp(request);
    let city = request.query['city'];
    if (ip && city) {
        console.log('нашёл')
        MongoClient.connect(dbURI, (err, client) => {
            var db = client.db("citiesDB");
            var collection = db.collection("cities");

            collection.deleteOne({"ip": ip, "city": city}, (err, result) => {
                if (err) {
                    response.sendStatus(500);
                    console.log('something went wrong');
                } else {
                    response.sendStatus(200);
                    console.log(`${city} deleted`);
                }
                client.close();
            });
        })
    }
})

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log(`server is listening on ${port}`);
})