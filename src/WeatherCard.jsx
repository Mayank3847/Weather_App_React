import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const WeatherCard = ({ weatherData }) => {
  if (!weatherData) return null;

  const { name, main, weather, wind } = weatherData;

  return (
    <Card sx={{ maxWidth: 400, p: 2, boxShadow: 3, borderRadius: 2, textAlign: "center" }}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold">
          {name}
        </Typography>
        <Typography variant="h3" fontWeight="bold">
          {main.temp}°C
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1)}
        </Typography>
        <img
          src={`https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`}
          alt="Weather Icon"
          width={80}
        />

        <Typography variant="body2" mt={2}>
          🌡️ Min: <strong>{main.temp_min}°C</strong> | Max: <strong>{main.temp_max}°C</strong>
        </Typography>
        <Typography variant="body2">
          💨 Wind: <strong>{wind.speed} m/s</strong> | Humidity: <strong>{main.humidity}%</strong>
        </Typography>
        <Typography variant="body2">
          🏋️ Pressure: <strong>{main.pressure} hPa</strong>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;

