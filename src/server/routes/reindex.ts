import fs from 'fs/promises'
import fsDirect from 'fs'
import path from 'path'
import sharp from 'sharp'
import { Directory } from '../../types'
import { MAIN_PATH, META_PATH } from '../../paths'
import { Archive } from '../util/archive'
import epub from 'epubjs'
import { Request, Response } from 'express'
import { writeIndex } from '../util/reindex'

// include and initialize the rollbar library with your access token
var Rollbar = require('rollbar')
var rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
})

type Data = {
    contents: Directory
}

export default async function reindex(
    req: Request,
    res: Response<Data>
) {
    const contents = await writeIndex()
    res.status(200).json({ contents })
}
