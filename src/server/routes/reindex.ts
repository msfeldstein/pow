import fs from 'fs/promises'
import fsDirect from 'fs'
import path from 'path'
import sharp from 'sharp'
import { Directory } from '../../types'
import { MAIN_PATH, META_PATH } from '../../paths'
import { Archive } from '../util/archive'
import epub from 'epubjs'
import { Request, Response } from 'express'

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

export async function recursivelyFetchFiles(curPath: string, name: string): Promise<Directory> {
    const absPath = path.join(MAIN_PATH, curPath)
    console.log("Recursing to directory", absPath)
    let files = await fs.readdir(absPath)
    console.log("Files in directory", files, "isDirectory", fsDirect.statSync(absPath).isDirectory())
    let directory: Directory = { name, type: "directory", files: [] }
    const thumbsPath = path.join(META_PATH, curPath)
    if (!fsDirect.existsSync(thumbsPath)) {
        console.log("lets make thumgs", thumbsPath)
        await fs.mkdir(thumbsPath, { recursive: true })
    }
    console.log("DONE")
    for (let file of files) {
        console.log("Checkign", file)
        const filePath = path.join(curPath, file)
        const absFilePath = path.join(MAIN_PATH, filePath)
        let stat = await fs.stat(absFilePath)
        if (stat.isDirectory() && !file.startsWith("__") && !file.startsWith(".")) {
            console.log("Lets recursee")
            directory.files.push(await recursivelyFetchFiles(filePath, file))
        } else if (file.toLowerCase().endsWith(".epub")) {
            let valid = true
            try {
                const fileContents = await fs.readFile(absFilePath)
                const buffer = Uint8Array.from(fileContents)

                const archive = await Archive.init(buffer)
                const names = archive.getFilenames("")
                const coverPath = names.find(n => n.includes("cover"))
                console.log({ names, coverPath })
                if (!coverPath) {
                    valid = false
                    console.log("NO COVER FOR", file)
                } else {

                    const firstPage = archive.extract(coverPath)
                    // Write out the full size image and a thumbnail
                    const comicMetaPath = path.join(thumbsPath, file)
                    if (!fsDirect.existsSync(comicMetaPath)) {
                        await fs.mkdir(comicMetaPath)
                    }
                    await fs.writeFile(path.join(comicMetaPath, "fullsize.jpg"), firstPage)
                    await sharp(firstPage).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))
                }

            } catch (e: any) {
                valid = false
                console.error("Error unzipping", e, file)
                rollbar.error("Error unzipping", e, { file })
            }
            directory.files.push({ type: "book", name: file, valid })
        } else if (file.toLowerCase().endsWith(".cbz") || file.toLocaleLowerCase().endsWith(".cbr")) {
            console.log("handling file", file)
            let valid = true
            let numPages = 0
            try {
                const fileContents = await fs.readFile(absFilePath)
                const buffer = Uint8Array.from(fileContents)
                const archive = await Archive.init(buffer)
                const names = archive.getFilenames("jpg")
                numPages = names.length
                const firstPage = archive.extract(names[0])
                // Write out the full size image and a thumbnail
                const comicMetaPath = path.join(thumbsPath, file)
                if (!fsDirect.existsSync(comicMetaPath)) {
                    await fs.mkdir(comicMetaPath)
                }
                await fs.writeFile(path.join(comicMetaPath, "fullsize.jpg"), firstPage)
                await sharp(firstPage).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))

            } catch (e: any) {
                valid = false
                console.error("Error unzipping", e, file)
                rollbar.error("Error unzipping", e, { file })
            }
            directory.files.push({ type: "comic", name: file, valid, numPages })
        }
    }
    return directory
}

export default async function reindex(
    req: Request,
    res: Response<Data>
) {
    let contents = await recursivelyFetchFiles("", "~")

    await fs.writeFile(path.join(META_PATH, "db.json"), JSON.stringify(contents, null, 2))
    res.status(200).json({ contents })
}
