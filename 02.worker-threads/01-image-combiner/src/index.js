import { createServer } from 'http'
import { parse, fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { dirname } from 'path'

// precisa importar o sharp na thread principal (bug da biblioteca)
import sharp from 'sharp'

const currentFolder = dirname(fileURLToPath(import.meta.url))
const workerFileName = 'worker.js'

async function joinImages(images) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`${currentFolder}/${workerFileName}`)
    worker.postMessage(images)
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.once('exit', code => {
      if(code !== 0) {
        return reject(new Error(`Thread ${worker.threadId} stopped with code ${code}`))
      }

      console.log(`Thread ${worker.threadId} exited!`)
    })
  })
}

async function handler(request, response) {
  if(request.url.includes('join-images')) {
    const { query: { background, img } } = parse(request.url, true)
    console.log('img', img)
    console.log('background', background)
    const imageBase64 = await joinImages({
      image: img,
      background
    })

    response.writeHead(200, {
      'Content-Type': 'text/html'
    })
  
    return response.end(`<img style="width:100%;height:100%" src="data:image/jpeg;base64,${imageBase64}" />`)

  }
}

createServer(handler)
  .listen(3000, () => console.log('running at port 3000'))