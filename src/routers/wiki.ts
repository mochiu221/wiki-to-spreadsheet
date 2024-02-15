import express from 'express'
import { GoogleAuthHandler } from '../utils/googleauth'
import { Wiki } from '../utils/wiki'
import { DB } from '../utils/db'
import wikianime from './wikianime.json'

const router = express.Router()

const ANIMESHEETID = wikianime.sheetId
const ANIMELISTCONTENT = wikianime.contentRange
const ANIMELISTHEAD = wikianime.headerRange
const ANIMELISTHEADERS = wikianime.header.map((h) => h.text)
const ANIMEPAGESECTIONS = wikianime.sections

router.get('/anime', async (req, res) => {
    const page = req.query.page as string | undefined
    const section = req.query.section as string | undefined
    const action = req.query.action !== undefined ? req.query.action as string : 'preview'

    if (page !== undefined && section !== undefined) {
        const wiki = new Wiki('zh')
        const table = await wiki.GetSectionTable(page, section, 'sectionId', wikianime.header)
        const entries = table.entries
        const sectionTitle = table.title

        if (action === 'appendsheet' && entries !== undefined && sectionTitle !== undefined) {
            const googleAuthHandler = new GoogleAuthHandler()

            const newEntries = entries.map((entry) => {
                entry.push(page, sectionTitle)
                return entry
            })

            const result = await googleAuthHandler.SpreadSheetAddRow(
                ANIMESHEETID,
                ANIMELISTCONTENT,
                'USER_ENTERED',
                newEntries
            )

            return res.send(result)
        } else {
            return res.send(table)
        }
    }

    res.send({ error: 'Params page & section are required' })
})

router.get('/anime/header-update', async (req, res) => {
    const googleAuthHandler = new GoogleAuthHandler()

    const result = await googleAuthHandler.SpreadSheetUpdateRow(
        ANIMESHEETID,
        ANIMELISTHEAD,
        'USER_ENTERED',
        [[...ANIMELISTHEADERS, '列表', '季度']]
    )

    return res.send(result)
})

router.get('/anime/batch-update', async (req, res) => {
    const process = req.query.process !== undefined ? req.query.process : 'perpage' as string

    const db = new DB()
    const pages = wikianime.pages
    let updatedPages = await db.GetValue('wikianime', 'updatedpages')

    const wiki = new Wiki('zh')
    const googleAuthHandler = new GoogleAuthHandler()

    const results: { [page: string]: { [section: string]: string } } = {}

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        let count = 0

        if (!updatedPages || !updatedPages.includes(page)) {
            for (let j = 0; j < ANIMEPAGESECTIONS.length; j++) {
                const sect = ANIMEPAGESECTIONS[j]
                const table = await wiki.GetSectionTable(page, sect, 'sectionTitle', wikianime.header)
                const entries = table.entries
                const sectionTitle = table.title

                if (entries !== undefined && sectionTitle !== undefined) {
                    const newEntries = entries.map((entry) => {
                        entry.push(page, sectionTitle)
                        return entry
                    })

                    const result = await googleAuthHandler.SpreadSheetAddRow(
                        ANIMESHEETID,
                        ANIMELISTCONTENT,
                        'USER_ENTERED',
                        newEntries
                    )

                    if (result.error) {
                        if (results[page]) {
                            results[page][sectionTitle] = 'error'
                        } else {
                            results[page] = { [sectionTitle]: 'error' }
                        }
                    } else {
                        if (results[page]) {
                            results[page][sectionTitle] = 'success'
                        } else {
                            results[page] = { [sectionTitle]: 'success' }
                        }

                    }
                }
            }

            if (updatedPages) {
                updatedPages.push(page)
            } else {
                updatedPages = [page]
            }
            await db.UpdateValue('wikianime', 'updatedpages', updatedPages, true)
            count += 1
        }

        if (process === 'perpage' && count === 1) break
    }

    return res.send(results)
})

export default router