
import { Directory } from '../../types'
import { Request, Response } from 'express'
import { writeIndex } from '../util/reindex'

type Data = {
    contents: Directory
}

export default async function reindex(
    _req: Request,
    res: Response<Data>
) {
    const contents = await writeIndex()
    res.status(200).json({ contents })
}
