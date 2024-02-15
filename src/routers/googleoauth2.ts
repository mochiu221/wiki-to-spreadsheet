import express from 'express'
import { GoogleAuthHandler } from '../utils/googleauth'

const router = express.Router()

router.get('/oauth2', async (req, res) => {
    if (req.query.code) {
        const googleAuthHandler = new GoogleAuthHandler()
        const returnItem = await googleAuthHandler.UpdateToken(req.query.code as string)
        res.send(returnItem)
    } else if (req.query.error) {
        res.send(req.query.error)
    } else {
        const googleAuthHandler = new GoogleAuthHandler()
        res.redirect(googleAuthHandler.GetAuthUrl())
    }
})

router.get('/test', async (req, res) => {
    const googleAuthHandler = new GoogleAuthHandler()
    const test = await googleAuthHandler.test()
    // if (test.error !== undefined) {
    //     res.redirect('/oauth2')
    // } else {
    //     res.send(test)
    // }
    res.send(test)
})

export default router