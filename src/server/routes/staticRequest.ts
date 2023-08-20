import fs from 'fs/promises'
import path from 'path'
import { Directory } from '../../types'
import { MAIN_PATH, META_PATH } from '../../paths'
import { Request, Response } from 'express'

export default async function staticRequest(
    req: Request,
    res: Response<Buffer>
) {
    const file = req.query.file as string
    const absFilePath = path.join(MAIN_PATH, file)
    res.sendFile(absFilePath)
}
