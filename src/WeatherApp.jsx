import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  useMediaQuery,
  useTheme,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Fade
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";

import coldSunnyDay from "./assets/cold-sunny-day.avif";
import hotSunnyDay from "./assets/hot-sunny-day.jpg";
import sunnyDay from "./assets/sunny-day.jpg";
import clearNight from "./assets/clear-night.jpg";
import coldClearNight from "./assets/cold-clear-night.jpeg";
import cloudyDay from "./assets/cloudy-day.jpg";
import coldCloudyDay from "./assets/cold-cloudy-day.avif";
import cloudyNight from "./assets/cloudy-night.webp";
import rainyDay from "./assets/rainy-day.jpg";
import rainyNight from "./assets/rainy-night.jpg";
import snowyDay from "./assets/snowy-day.webp";
import snowyNight from "./assets/snowy-night.jpg";
import thunderDay from "./assets/thunder-day.jpg";
import thunderNight from "./assets/thunder-night.jpeg";
import defaultDay from "./assets/default-day.jpg";
import defaultNight from "./assets/default-night.jpg";

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast";
const WEATHER_API_KEY = "b7d0cbf8596798c893ae84b533d21445";
const DEFAULT_CITY = "New Delhi";

const getBackground = (weatherCondition, timeOfDay, temperature) => {
  const isCold = temperature < 10;
  const isHot = temperature >= 25;

  const backgrounds = {
    clear: {
      day: isCold ? coldSunnyDay : isHot ? hotSunnyDay : sunnyDay,
      night: isCold ? coldClearNight : clearNight
    },
    clouds: {
      day: isCold ? coldCloudyDay : cloudyDay,
      night: cloudyNight
    },
    rain: {
      day: rainyDay,
      night: rainyNight
    },
    snow: {
      day: snowyDay,
      night: snowyNight
    },
    thunderstorm: {
      day: thunderDay,
      night: thunderNight
    },
    default: {
      day: defaultDay,
      night: defaultNight
    }
  };

  return backgrounds[weatherCondition?.toLowerCase()]?.[timeOfDay] || backgrounds.default[timeOfDay];
};

const getLocalTime = (timezoneOffset) => {
  const nowUTC = new Date(new Date().toUTCString().slice(0, -4));
  const localTime = new Date(nowUTC.getTime() + timezoneOffset * 1000);
  return localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const WeatherApp = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [background, setBackground] = useState(defaultDay);
  const [view, setView] = useState("current");
  const [forecastLoading, setForecastLoading] = useState(false);
  const [unit, setUnit] = useState("metric");
  const [timeOfDay, setTimeOfDay] = useState("day");


  const handleUnitChange = (_, newUnit) => {
    if (newUnit) {
      setUnit(newUnit);
      if (weather?.city) fetchWeather(weather.city, newUnit);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => await fetchWeatherByCoords(coords.latitude, coords.longitude),
        async () => await fetchWeather(DEFAULT_CITY)
      );
    } else {
      fetchWeather(DEFAULT_CITY);
    }
  }, []);

  useEffect(() => {
    const body = document.body;
    body.style.backgroundImage = `url(${background})`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center center";
    body.style.backgroundAttachment = "fixed";
    body.style.backgroundRepeat = "no-repeat";
    body.style.transition = "background 0.5s ease-in-out";
    body.style.height = "100vh";
    body.style.width = "100vw";
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.overflow = "hidden";
  }, [background]);

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    try {
      const res = await axios.get(`${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=${unit}`);
      updateWeatherState(res.data);
    } catch {
      setError("Failed to fetch weather.");
    }
    setLoading(false);
  };

  const fetchWeather = async (cityName, unitSystem = unit) => {
    if (!cityName.trim()) return setError("City name cannot be empty!");
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${WEATHER_API_URL}?q=${cityName}&appid=${WEATHER_API_KEY}&units=${unitSystem}`);
      updateWeatherState(res.data);
      setCity("");
      setView("current");
    } catch {
      setError("Failed to fetch weather. Try again.");
    }
    setLoading(false);
  };

  const fetchForecast = async (cityName) => {
    setForecastLoading(true);
    try {
      const res = await axios.get(`${FORECAST_API_URL}?q=${cityName}&appid=${WEATHER_API_KEY}&units=${unit}`);
      const forecastData = res.data.list;
      const daily = [];
      const daysAdded = new Set();
      forecastData.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        if (!daysAdded.has(date)) {
          daysAdded.add(date);
          daily.push({ date, temp: item.main.temp, icon: item.weather[0].icon, description: item.weather[0].description });
        }
      });
      setForecast(daily.slice(0, 5));
    } catch {
      setError("Failed to fetch forecast data.");
    }
    setForecastLoading(false);
  };

  const fetchHourlyForecast = async (cityName) => {
    try {
      const res = await axios.get(`${FORECAST_API_URL}?q=${cityName}&appid=${WEATHER_API_KEY}&units=${unit}`);
      setHourlyForecast(res.data.list.slice(0, 8));
    } catch {
      setError("Failed to fetch hourly forecast.");
    }
  };

  const updateWeatherState = (data) => {
    const now = new Date();
    const localTime = new Date(now.getTime() + data.timezone * 1000);
    const hour = localTime.getUTCHours();
    const time = hour >= 6 && hour < 18 ? "day" : "night";
    setTimeOfDay(time);

    const temp = data.main?.temp;
    


    setWeather({
      city: data.name,
      timezone: data.timezone,
      temperature: temp,
      feels_like: data.main.feels_like,
      temp_min: data.main.temp_min,
      temp_max: data.main.temp_max,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind.speed,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` : null,
    });

    const backgroundImg = getBackground(data.weather?.[0]?.main, time, temp);
    setBackground(backgroundImg);
  };

  const switchToForecast = async () => {
    if (weather?.city) await fetchForecast(weather.city);
    setView("forecast");
  };

  const switchToHourly = async () => {
    if (weather?.city) await fetchHourlyForecast(weather.city);
    setView("hourly");
  };

  return (
    <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    py: 2,
    px: 1,
    boxSizing: "border-box",
    overflow: "hidden",
    flexDirection: "column",
    flexWrap: "wrap"
  }}
>

      <Card
  sx={{
    p: { xs: 1, sm: 2, md: 3 },
    boxShadow: 10,
    borderRadius: "30px",
    width: "95%",
    maxWidth: "520px",
    maxHeight: "100%",                         
    overflow: "visible",                       
    display: "flex",                           
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: timeOfDay === "night"
      ? "rgba(0,0,0,0.4)"
      : "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: timeOfDay === "night" ? "#fff" : "#000",
    margin: "auto",
    transition: "background-color 0.5s ease, color 0.5s ease",
  }}
  
>


        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <ToggleButtonGroup
  value={unit}
  exclusive
  onChange={handleUnitChange}
  size="small"
  sx={{
    backgroundColor: timeOfDay === "night" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    borderRadius: "12px",
    overflow: "hidden"
  }}
>
  <ToggleButton
    value="metric"
    sx={{
      color: timeOfDay === "night" ? "#f5f5f5" : "#222",
      '&.Mui-selected': {
        backgroundColor: timeOfDay === "night" ? "#424242" : "#d1c4e9",
        color: "#fff"
      },
      '&:hover': {
        backgroundColor: timeOfDay === "night" ? "#333" : "#ede7f6"
      }
    }}
  >
    °C
  </ToggleButton>
  <ToggleButton
    value="imperial"
    sx={{
      color: timeOfDay === "night" ? "#f5f5f5" : "#222",
      '&.Mui-selected': {
        backgroundColor: timeOfDay === "night" ? "#424242" : "#d1c4e9",
        color: "#fff"
      },
      '&:hover': {
        backgroundColor: timeOfDay === "night" ? "#333" : "#ede7f6"
      }
    }}
  >
    °F
  </ToggleButton>
</ToggleButtonGroup>

            <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: 'cursive' }}>Weather App 🌦️</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
  variant="outlined"
  placeholder="Enter City Name"
  value={city}
  onChange={(e) => setCity(e.target.value)}
  onKeyPress={(e) => e.key === "Enter" && fetchWeather(city)}
  fullWidth
  InputProps={{
    sx: {
      backgroundColor: timeOfDay === "night" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)",
      color: timeOfDay === "night" ? "#f5f5f5" : "#222",
      borderRadius: "12px",
      '& input::placeholder': {
        color: timeOfDay === "night" ? "#ccc" : "#666",
        fontStyle: "italic"
      }
    }
  }}
/>

            <Button variant="contained" onClick={() => fetchWeather(city)}><SearchIcon /></Button>
          </Box>

          {error && <Typography color="error">{error}</Typography>}
          {loading && <CircularProgress />}

          {weather && !loading && (
            <>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2 }}>
                <Button variant="outlined" color=""  onClick={() => setView("current")}>Current</Button>
                <Button variant="outlined" color="" onClick={switchToHourly}><HourglassBottomIcon /> Hourly</Button>
                <Button variant="outlined" color="" onClick={switchToForecast}><CalendarTodayIcon /> 5-Day</Button>
              </Box>

              {view === "current" && (
                <Fade in={true}>
                  <Box sx={{ 
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    overflow: "auto",
                    maxHeight: { xs: "calc(100vh - 200px)", sm: "none" }
                  }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h4" fontSize={{ xs: "1.5rem", sm: "2rem" }}>
                        {weather.city}
                      </Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" /> {getLocalTime(weather.timezone)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <img 
                        src={weather.icon} 
                        alt="Weather Icon" 
                        width={80} 
                        height={80}
                      />
                      <Typography variant="h2" fontSize={{ xs: "2.5rem", sm: "3rem" }}>
                        {Math.round(weather.temperature)}°{unit === 'metric' ? 'C' : 'F'}
                      </Typography>
                      <Typography>Feels like: {Math.round(weather.feels_like)}°</Typography>
                      <Typography>{weather.description}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={6}><Typography noWrap fontSize="0.9rem">🔥 Min: {Math.round(weather.temp_min)}°</Typography></Grid>
                      <Grid item xs={6}><Typography noWrap fontSize="0.9rem">🔥 Max: {Math.round(weather.temp_max)}°</Typography></Grid>
                      <Grid item xs={6}><Typography noWrap fontSize="0.9rem">💨 Wind: {weather.wind_speed} m/s</Typography></Grid>
                      <Grid item xs={6}><Typography noWrap fontSize="0.9rem">💦 Humidity: {weather.humidity}%</Typography></Grid>
                      <Grid item xs={12}><Typography noWrap fontSize="0.9rem">🏋️ Pressure: {weather.pressure} hPa</Typography></Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {view === "hourly" && (
                <Fade in={true}>
                  <Box sx={{ 
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                    gap: 1,
                    overflow: "auto",
                    maxHeight: { xs: "200px", sm: "none" }
                  }}>
                  {hourlyForecast.slice(0, 8).map((hour, idx) => (

  <Card
  key={idx}
  sx={{
    p: 1.2,
    textAlign: "center",
    borderRadius: 3,
    background: timeOfDay === "night"
      ? "linear-gradient(to bottom right, rgba(0,0,0,0.45), rgba(30,30,30,0.35))"
      : "linear-gradient(to bottom right, rgba(255,255,255,0.3), rgba(245,245,245,0.2))",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: timeOfDay === "night" ? "#f0f0f0" : "#222",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    transition: "transform 0.3s ease, background 0.3s ease",
    '&:hover': {
      transform: "scale(1.05)",
      background: timeOfDay === "night"
        ? "linear-gradient(to bottom right, rgba(20,20,20,0.6), rgba(60,60,60,0.4))"
        : "linear-gradient(to bottom right, rgba(255,255,255,0.4), rgba(255,255,255,0.25))",
    }
  }}
>

    <Typography variant="body2" fontSize="0.75rem">
      {new Date(hour.dt * 1000).getHours()}:00
    </Typography>
    <img 
      src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`} 
      alt="" 
      width={40} 
      height={40}
    />
    <Typography fontSize="0.9rem">
      {Math.round(hour.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
    </Typography>
  </Card>
))}

                  </Box>
                </Fade>
              )}

              {view === "forecast" && (
                <Fade in={true}>
                  <Box sx={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
  gap: 1,
  width: "100%",
  maxWidth: "100%",
  flexWrap: "wrap",
  overflow: "hidden",                 
  justifyContent: "center",
  paddingBottom: 1,
}}
>
                    {forecastLoading ? (
                      [...Array(5)].map((_, i) => <Skeleton key={i} height={140} variant="rectangular" />)
                    ) : forecast.slice(0, 5).map((day, idx) => (

                      <Card
                      key={idx}
                      sx={{
                        p: 1.2,
                        textAlign: "center",
                        borderRadius: 3,
                        background: timeOfDay === "night"
                          ? "linear-gradient(to bottom right, rgba(0,0,0,0.45), rgba(30,30,30,0.35))"
                          : "linear-gradient(to bottom right, rgba(255,255,255,0.3), rgba(245,245,245,0.2))",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: timeOfDay === "night" ? "#f5f5f5" : "#1a1a1a",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                        transition: "transform 0.3s ease, background 0.3s ease",
                        '&:hover': {
                          transform: "scale(1.05)",
                          background: timeOfDay === "night"
                            ? "linear-gradient(to bottom right, rgba(20,20,20,0.6), rgba(60,60,60,0.4))"
                            : "linear-gradient(to bottom right, rgba(255,255,255,0.4), rgba(255,255,255,0.25))",
                        }
                      }}
                    >
                    

                        <Typography variant="body2" fontSize="0.75rem">{day.date}</Typography>
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                          alt="" 
                          width={40} 
                          height={40}
                        />
                        <Typography fontSize="0.9rem">
                          {Math.round(day.temp)}°{unit === 'metric' ? 'C' : 'F'}
                        </Typography>
                        <Typography variant="caption" fontSize="0.7rem">
                          {day.description}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                </Fade>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WeatherApp;