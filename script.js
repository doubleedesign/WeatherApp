document.addEventListener("DOMContentLoaded", function () {
  const apiKey = "4429dfa39cc1c7b0205744ca7080ad81";
  const form = document.getElementById("search-form");
  const tempLink = document.querySelector(".today-temp");

  // Get initial location and populate page
  getInitialLocation()
    .then((position) => {
      populatePage(position);
    })
    .catch((error) => {
      alert(`There was a problem getting your location.`);
      console.log(error);
      populatePage("New York");
    });

  // Handle form submission to repopulate with new data
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Get the city the user entered
    let city = form.querySelector("#search").value;

    // Get and populate weather data
    populatePage(city);
  });

  /**
   * Handle clicks on the temperature link
   */
  tempLink.addEventListener("click", (event) => {
    event.preventDefault();
    swapTemperature();
  });

  /**
   * Load/reload all data for a given city
   * @param city
   */
  function populatePage(city) {
    // Add the current date and time to the page
    populateDayAndTime();

    // Get and load the weather
    // Use the returned name (data.name) because this result could be from a coordinate search on page load,
    // the user could have typed lowercase, could have added a country code, etc
    getWeatherForCity(city)
      .then((data) => {
        populateCityName(data.name);
        populateWeather(data);
        updateStyling(data.main.temp);
      })
      .catch((error) => {
        alert(
          `There was a problem with your search: ${error}. Please try again.`
        );
      });
  }

  /**
   * Prompt for geolocation to load initial data
   * Ref: https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API/Using_the_Permissions_API
   * Ref: https://stackoverflow.com/a/45422800
   * Ref: https://stackoverflow.com/a/57829970
   */
  async function getInitialLocation() {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    return new Promise((resolve, reject) => {
      navigator.permissions
        .query({
          name: "geolocation"
        })
        .then(function (result) {
          if (result.state === "granted" || result.state === "prompt") {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve(position);
              },
              (error) => {
                reject(error);
              },
              options
            );
          } else if (result.state === "denied") {
            return false;
          }
        });
    });
  }

  /**
   * Query the API to get weather for a chosen city
   * @param city
   *
   * @returns {Promise}
   */
  async function getWeatherForCity(city) {
    let query = null;

    // Query URL
    if (typeof city === "object") {
      query = `https://api.openweathermap.org/data/2.5/weather?lat=${city.coords.latitude}&lon=${city.coords.longitude}&appid=${apiKey}&units=metric`;
    } else {
      query = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    }

    // Query the API, which returns a promise
    // Using .then, create a new promise which extracts the data
    // Otherwise, it just returns the promise state without the data, or undefined depending on how I tried to do it
    // Ref: https://stackoverflow.com/a/48980526
    if (query) {
      return axios.get(query).then((response) => {
        return response.data;
      });
    }
  }

  /**
   * Load current day and time
   */
  function populateDayAndTime() {
    let dateText = document.querySelector(".today-time");
    let now = new Date();
    let dayNumber = now.getDay();
    let dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    dateText.innerText = dayNames[dayNumber];
    dateText.innerText +=
      " " + now.getHours() + ":" + now.getMinutes() + " (your local time)";
  }

  /**
   * Populate the city name
   * @param name
   */
  function populateCityName(name) {
    let text = document.querySelector("#city-name");
    text.innerHTML = name;
  }

  /**
   * Load the weather data onto the page
   * @param data
   */
  function populateWeather(data) {
    console.log(data);
    let image = document.querySelector(".today-image");
    let tempText = document.querySelector(".today-temp .amount");
    let descText = document.querySelector(".today-description");
    let humidityText = document.querySelector(".today-humidity");
    let windText = document.querySelector(".today-wind");

    image.setAttribute(
      "src",
      `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    );
    tempText.innerHTML = Math.round(data.main.temp);
    tempText.setAttribute("data-temp-amount", data.main.temp);
    descText.innerHTML = data.weather[0].description;
    humidityText.innerHTML = data.main.humidity;
    windText.innerHTML = data.wind.speed;
  }

  /**
   * Update page styling according to the temperature
   * @param temperature
   */
  function updateStyling(temperature) {
    let tempRange = "";

    if (temperature <= 15) {
      tempRange = "cold";
    } else if (temperature > 15 && temperature < 25) {
      tempRange = "fair";
    } else if (temperature >= 25 < 35) {
      tempRange = "warm";
    } else {
      tempRange = "hot";
    }

    document.body.setAttribute("data-temp-range", tempRange);
  }

  /**
   * Switch between C and F temps
   */
  function swapTemperature() {
    let tempAmount = document.querySelector(".today-temp .amount");
    let tempUnits = document.querySelector(".today-temp .units");

    if (tempUnits.getAttribute("data-temp-units") === "C") {
      setUnits("F");
      convertTemperature(tempAmount.getAttribute("data-temp-amount"), "C", "F");
    } else {
      setUnits("C");
      convertTemperature(tempAmount.getAttribute("data-temp-amount"), "F", "C");
    }

    function setUnits(units) {
      tempUnits.innerHTML = units;
      tempUnits.setAttribute("data-temp-units", units);
    }

    function convertTemperature(temp, unitsFrom, unitsTo) {
      let newTemp = temp;

      if (unitsFrom === "C" && unitsTo === "F") {
        newTemp = Math.round(temp * 1.8 + 32);
      } else if (unitsFrom === "F" && unitsTo === "C") {
        newTemp = Math.round((temp - 32) * 0.5556);
      } else {
        // Nothing to swap
      }

      tempAmount.innerHTML = newTemp;
      tempAmount.setAttribute("data-temp-amount", newTemp);
    }
  }
});
