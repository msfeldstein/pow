import fs from 'fs/promises'
import { Request, Response } from 'express'


export default async function list(
    req: Request,
    res: Response<Buffer>
) {
    const root = process.env.META
    let contents = JSON.parse((await fs.readFile(root + "/db.json")).toString())
    res.status(200).json(contents)
}
