
import { Directory } from '../../types'
import { Request, Response } from 'express'
import { writeIndex } from '../util/reindex'

type Data = {
    contents: Directory
}

export default async function reindex(
    _req: Request,
    res: Response<Data | string>
) {
    const contents = await writeIndex()
    if (!contents) {
        res.status(500).send("Error writing index")
        return
    }
    res.status(200).json({ contents })
}
