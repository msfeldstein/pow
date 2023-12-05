import fs from 'fs/promises'
import { Request, Response } from 'express'
import { META_PATH } from '../../paths'


export default async function list(
    req: Request,
    res: Response<Buffer>
) {
    let contents = JSON.parse((await fs.readFile(META_PATH + "/db.json")).toString())
    res.status(200).json(contents)
}
