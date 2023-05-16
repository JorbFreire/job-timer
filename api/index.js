const express = require('express');
const cors = require('cors');
const axios = require('axios')

const formatDuration = require('date-fns/formatDuration')
const intervalToDuration = require('date-fns/intervalToDuration')

require('dotenv/config');

const { createCanvas } = require('@napi-rs/canvas')

const app = express();

const wakaTimeHeaders = {
  headers: {
    Authorization: `Basic ${Buffer(process.env.API_KEY).toString('base64')}`
  }
}

// Apply middlware for CORS and JSON endpoing
app.use(cors());
app.use(express.json());

async function getTimeAsImage(project_name, index) {
  const canvas = createCanvas(512, 512)
  const canvasContext = canvas.getContext('2d')
  canvasContext.font = '290px Impact'
  canvasContext.fillStyle = '#0fa'

  const { data: { data } } = await axios.get(
    `https://wakatime.com/api/v1/users/current/all_time_since_today?project=${project_name}`,
    wakaTimeHeaders
  )
  const duration = intervalToDuration(
    { start: 0, end: data.total_seconds * 1000 }
  )

  duration.days += duration.months * 30
  duration.months = 0
  duration.hours += duration.days * 24
  duration.days = 0

  const formatedDuration = formatDuration(
    duration,
    { format: ['hours', 'minutes'] }
  )
    .replace(" hours ", ".:")
    .replace(" minutes", ". H")
    .split(".")[index]

  canvasContext.fillText(formatedDuration, -32, 364)

  const image = Buffer.from(
    canvas.toDataURL().replace(/^data:image\/png;base64,/, ''),
    'base64'
  )

  return image
}

app.get('/api/time/:project_name', async (request, response) => {
  const { project_name } = request.params

  try {
    const { data: { data } } = await axios.get(
      `https://wakatime.com/api/v1/users/current/all_time_since_today?project=${project_name}`,
      wakaTimeHeaders
    )

    return response.status(200).json({
      project: data.project,
      total_seconds: data.total_seconds
    });
  } catch (error) {
    return response.status(400).json(error);
  }
})

// index = 0 | 1
app.get("/api/image/time/:index/:force_update/:project_name.png", async (request, response) => {
  const { index, project_name } = request.params

  try {
    const image = await getTimeAsImage(project_name, index)

    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': image.length
    });
    return response.end(image);
  } catch (error) {
    return response.status(400).json(error);
  }
})

module.exports = app;
