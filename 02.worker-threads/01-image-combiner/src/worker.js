import { parentPort } from 'worker_threads'
import sharp from 'sharp'
import axios from 'axios'

async function downloadFile(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  })

  return response.data
}

async function onMessage({ image, background }) {
  const frontLayer = await sharp(await downloadFile(image))
  .toBuffer()

  const backgroundLayer = await sharp(await downloadFile(background))
  .composite(
    [
      { input: frontLayer, gravity: sharp.gravity.south }
    ]
  )
  .toBuffer()

  parentPort.postMessage(backgroundLayer.toString('base64'))
}

// Evento quando a thread principal chama a worker thread
parentPort.on('message', onMessage)

