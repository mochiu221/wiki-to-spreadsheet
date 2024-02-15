import localdb from '../../security/localdb.json'
import fs from 'fs'
import process from 'process'
import path from 'path'

const DBPATH = path.join(process.cwd(), 'security/localdb.json')

export class DB {
    public static instance: DB
    private database: any[]

    constructor() {
        DB.instance = this
        this.database = localdb
    }

    public CreateTable = async (name: string, content: any = {}) => {
        const newTable = { name, content }
        this.database.push(newTable)
        fs.writeFileSync(DBPATH, JSON.stringify(this.database))
        return newTable
    }

    public UpdateValue = async (name: string, key: string, value: string, allowCreateTable: boolean = false) => {
        let table = this.database.find((t) => t.name === name)
        if (!table || table === undefined) {
            if (!allowCreateTable) return
            table = await this.CreateTable(name)
        }
        const content = table.content
        content[key] = value
        fs.writeFileSync(DBPATH, JSON.stringify(this.database))
    }

    public GetValue = async (name: string, key: string) => {
        const table = this.database.find((t) => t.name === name)
        if (table && table !== undefined) {
            const content = table.content
            return content[key]
        }
        return null
    }
}