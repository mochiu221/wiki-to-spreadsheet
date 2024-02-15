import { google } from 'googleapis'
import * as fs from 'fs'
import * as process from 'process'
import * as path from 'path'
import { OAuth2Client } from 'google-auth-library'

/**
 * Google OAuth2
 * @link https://developers.google.com/identity/protocols/oauth2/web-server?hl=zh-tw#node.js_1
 * OAuth2Client Class
 * @link https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/oauth2client
 */

export const TOKEN_PATH = path.join(process.cwd(), 'config/token.json')
export const CREDENTIALS_PATH = path.join(process.cwd(), 'config/credentials.json')

export class GoogleAuthHandler {
    public static instance: GoogleAuthHandler
    private cred: any
    private oauth2Client: OAuth2Client
    private scopes: string[]
    public authUrl: string

    constructor() {
        GoogleAuthHandler.instance = this
        this.cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"))
        const { client_secret, client_id, redirect_uris } = this.cred.web
        this.oauth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        )
        this.scopes = [
            'https://www.googleapis.com/auth/spreadsheets'
        ]
        this.authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes,
            include_granted_scopes: true
        })
    }

    public GetAuthUrl = () => {
        return this.authUrl
    }

    public GetClient = () => {
        return this.oauth2Client
    }

    public UpdateToken = async (code: string) => {
        let returnItem = {}

        this.oauth2Client.getToken(code, (err, token) => {
            if (err || !token) return returnItem = { error: 'error found or no token found' }

            this.oauth2Client.setCredentials(token);

            const oldTokenStr = fs.readFileSync(TOKEN_PATH, 'utf-8')
            if (oldTokenStr) {
                const oldToken = JSON.parse(oldTokenStr)
                token = { ...oldToken, ...token }
            }
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))

            returnItem = { result: 'success' }
        })

        return returnItem
    }

    public Authorize = async () => {
        try {
            const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"))
            this.oauth2Client.setCredentials(token)
            return this.oauth2Client
        } catch (error) {
            console.log('Authorize() error')
            return undefined
        }
    }

    public test = async () => {
        const auth = await this.Authorize()
        try {
            const sheets = google.sheets({ version: 'v4', auth })
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                range: 'Class Data!A2:E',
            })
            const rows = res.data.values
            if (!rows || rows.length === 0) {
                return { error: 'No data found.' }
            }

            const list: any[] = []
            rows.forEach((row) => {
                // Print columns A and E, which correspond to indices 0 and 4.
                list.push(`${row[0]}, ${row[4]}`)
            })

            return { list }
        } catch (error) {
            console.log('test() error')
            return { error }
        }
    }

    /**
     * Google Spreadsheet
     * @link https://developers.google.com/sheets/api/guides/values?hl=zh-tw#node.js
     */

    public SpreadSheetAddRow = async (spreadsheetId: string, range: string, valueInputOption: string, values: any[]) => {
        const auth = await this.Authorize()
        const resource = {
            values
        }

        try {
            const sheets = google.sheets({ version: 'v4', auth })
            const result = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption,
                requestBody: resource
            });
            return { result }
        } catch (error) {
            console.log('SpreadSheetAddRow() error')
            return { error }
        }
    }

    public SpreadSheetUpdateRow = async (spreadsheetId: string, range: string, valueInputOption: string, values: any[]) => {
        const auth = await this.Authorize()
        const resource = {
            values
        }

        try {
            const sheets = google.sheets({ version: 'v4', auth })
            const result = await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption,
                requestBody: resource
            });
            return { result }
        } catch (error) {
            console.log('SpreadSheetUpdateRow() error')
            return { error }
        }
    }
}