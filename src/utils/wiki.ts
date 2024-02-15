import axios from 'axios'
import wiki from './wiki-settings.json'

const languages = wiki.languages
const wikiApiPath = "wikipedia.org/w/api.php"

export class Wiki {
    public static instance: Wiki
    private lang: string
    private url: string

    constructor(lang: string) {
        Wiki.instance = this
        this.lang = lang
        this.url = `https://${this.lang}.${wikiApiPath}`
    }

    public GetSectionTable = async (page: string, section: string, by: 'sectionId' | 'sectionTitle', header?: {
        text: string;
        keys: string[];
    }[]): Promise<{
        title?: string
        header?: string[]
        entries?: string[][]
        error?: string
    }> => {
        const allLanguages = languages.map((obj) => obj.value)

        if (!allLanguages.includes(this.lang)) return { 'error': 'The language does not exist' }

        const params: { [key: string]: any } = {
            origin: "*",
            action: "parse",
            format: "json",
            contentmodel: "json",
            prop: "wikitext",
            page,
        }

        if (by === 'sectionId') {
            params.section = section
        } else {
            const sections = await this.GetSections(page)

            if (sections.error !== undefined) return sections

            const index = sections.find((sect: any) => sect.line === section).index
            params.section = index
        }

        try {
            const res = await axios({
                method: 'get',
                url: this.url,
                params
            })

            return this.GetTable(res.data.parse.wikitext["*"], header)
        } catch (e) {
            return { error: 'Cannot find table' }
        }
    }

    public GetSections = async (page: string) => {
        const allLanguages = languages.map((obj) => obj.value)

        if (!allLanguages.includes(this.lang)) return { error: 'The language does not exist' }

        const params: { [key: string]: any } = {
            origin: "*",
            action: "parse",
            format: "json",
            contentmodel: "json",
            prop: "sections",
            page
        }

        try {
            const res = await axios({
                method: 'get',
                url: this.url,
                params
            })
            return res.data.parse.sections
        } catch (e) {
            return e
        }
    }

    private GetTable = (wikitext: string, header?: { text: string, keys: string[] }[]) => {
        wikitext = wikitext.replace(/(\<!--.*?--\>)|(\{\{(notetag|Wayback).*?\}\})|\{\||\|\}.*|\<br\/\>/gm, '')
        wikitext = this.WikitextToText(wikitext, 'link')
        wikitext = this.WikitextToText(wikitext, 'ref')
        wikitext = this.WikitextToText(wikitext, 'doublebrackets')

        const lines = wikitext.split('|-\n')
        let newHeader: string[] = []
        let headers: string[] = []
        const headerOrder: (number | null)[] = [] // The order of the index of the original header text

        /** Get header text array */

        for (let l = 0; l < lines.length; l++) {
            const line = lines[l]
            if (!line.startsWith('|') && line.includes('!')) {
                const headContent = line.substring(line.indexOf('!') + 1)
                headers = headContent.split(/\!\!|\n\!/gm)
                headers = headers.map((h) => h.replace(/\n/gm, ''))
                break
            }
        }

        /** Get the re-ordered table column order array */
        const originalHeader: string[] = []
        for (let i = 0; i < headers.length; i++) {
            const h = headers[i].split('|')
            originalHeader.push(h[h.length - 1])
        }
        if (header !== undefined) {
            header.forEach((v) => {
                newHeader.push(v.text)

                let index = null
                for (let h = 0; h < originalHeader.length; h++) {
                    if (index) break
                    for (let k = 0; k < v.keys.length; k++) {
                        if (originalHeader[h].includes(v.keys[k])) {
                            index = h
                            break
                        }
                    }
                }
                headerOrder.push(index)
                index = null
            })
        } else {
            newHeader = originalHeader
        }

        // console.log(headerOrder)

        const titleMatch = lines[0].match(/\=\=\=.*?\=\=\=/g)
        let title = ''
        if (titleMatch) {
            title = titleMatch[0].substring(3, titleMatch[0].length - 3)
            title = title.trim()
        }

        const entries = []
        let total = lines.length

        let rowspans = originalHeader.map(() => 0)

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()

            /** Table row */

            if (line.startsWith('|')) {
                if (i === total - 1 && line.match(/\<references.*?\/\>/g)) {
                    total -= 1
                } else {
                    let table = line.substring(1)
                    let entry = table.split(/\|\||\n\|/gm)

                    /** rowspan handling */

                    // console.log(rowspans)
                    for (let r = 0; r < rowspans.length; r++) {
                        if (rowspans[r] > 0) {
                            entry.splice(r, 0, '')
                            continue
                        }
                        if (entry[r] !== undefined) {
                            let match = entry[r].match(/rowspan=\"[0-9]*?\"/)
                            if (match) {
                                const span = match[0].replace(/\D+/g, '')
                                rowspans[r] += parseInt(span)

                                const s = entry[r].split('|')
                                entry[r] = s[s.length - 1]
                            }
                        }
                    }
                    rowspans = rowspans.map((r) => r > 0 ? r - 1 : 0)

                    /** Remove \n and trim */
                    entry = entry.map((e) => e.replace(/\n/gm, '').trim())

                    if (header !== undefined) {
                        let newEntry = headerOrder.map((index) => {
                            if (index === null) return ''
                            return entry[index]
                        })
                        entry = newEntry
                    }

                    entries.push(entry)
                }
            }
        }
        return { title, header: newHeader, entries }
    }

    private WikitextToText = (text: string, type: 'doublebrackets' | 'link' | 'ref') => {
        switch (type) {
            case 'doublebrackets':
                const brkMatchList = text.match(/\{\{.*?\|.*?\}\}/gm)
                if (brkMatchList) {
                    const replaceList = brkMatchList.map((str) => {
                        const params = str.substring(2, str.length - 2).split('|')
                        return { origin: str, newstr: params[params.length - 1] }
                    })
                    replaceList.forEach((i) => {
                        text = text.replace(i.origin, i.newstr)
                    })
                }
                break

            case 'link':
                const bracketMatchList = text.match(/\[\[.*?\]\]/gm)
                if (bracketMatchList) {
                    const replaceList = bracketMatchList.map((str) => {
                        const params = str.substring(2, str.length - 2).split('|')
                        return { origin: str, newstr: params[params.length - 1] }
                    })
                    replaceList.forEach((i) => {
                        text = text.replace(i.origin, i.newstr)
                    })
                }

                const bracketMatchList2 = text.match(/\[http.*?\]/gm)
                if (bracketMatchList2) {
                    const replaceList = bracketMatchList2.map((str) => {
                        const params = str.substring(1, str.length - 1).split(' ')
                        return { origin: str, newstr: params[0] }
                    })
                    replaceList.forEach((i) => {
                        text = text.replace(i.origin, i.newstr)
                    })
                }
                break

            case 'ref':
                const refMatchList = text.match(/\<ref[^a-zA-Z0-9].*?(\/\>|\<\/ref\>)/gm)
                if (refMatchList) {
                    const replaceList = refMatchList.map((str) => {
                        const newstr = str.split('|').find((p) => p.startsWith('url='))?.substring(4)

                        return { origin: str, newstr: newstr !== undefined ? ' ' + newstr : '' }
                    })
                    replaceList.forEach((i) => {
                        text = text.replace(i.origin, i.newstr)
                    })
                }
                break

            default:
                break
        }

        return text
    }
}