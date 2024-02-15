import express from 'express'
import googleRouter from './routers/googleoauth2'
import wikiRouter from './routers/wiki'

const app = express()

app.use(express.json())
app.use(googleRouter)
app.use(wikiRouter)

export default app