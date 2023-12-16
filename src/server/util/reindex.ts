import path from "path"
import { DB_PATH, MAIN_PATH, META_PATH } from "../../paths"
import { Directory, File } from "../../types"
import fs from 'fs/promises'
import fsDirect from 'fs'
import { Archive } from "./archive"
import sharp from "sharp"

const IGNORED = [".DS_Store", "__MACOSX", "@eaDir"]

const dbgLog = function (msg: any, optionalParams: any) {
    console.log(msg, optionalParams)
}

class Indexer {
    dir: string
    totalFiles: number = 0
    filesProcessed: number = 0
    startingDb: any = {}

    logger: (msg: any, ...optionalParams: any) => void = dbgLog
    constructor(dir: string, startingDb: any) {
        this.dir = dir
        this.startingDb = startingDb
    }

    setLogger(logger: (msg: any, optionalParams: any) => void) {
        this.logger = logger
    }

    async init() {
        this.totalFiles = await this.countCbrFiles(this.dir)
        console.log("Ready to process", this.totalFiles, "files")
    }

    async countCbrFiles(dir: string) {
        let count = 0;

        async function recurse(currentPath: string) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (let entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    await recurse(fullPath);
                } else if (entry.isFile() && [".cbr", ".cbz", ".epub"].includes(path.extname(entry.name).toLowerCase())) {
                    count++;
                }
            }
        }

        await recurse(dir);
        return count;
    }

    async buildIndex() {
        this.filesProcessed = 0
        this.logger("Starting to write index")
        const startTime = performance.now()
        let index = await this.recursivelyFetchFiles("/")
        const totalTime = Math.floor(performance.now() - startTime) / 1000
        this.logger(`Reindexed in ${totalTime}s`)
        return index
    }

    fileProcessed(name: string) {
        this.filesProcessed++
        this.logger(`Processed ${this.filesProcessed} / ${this.totalFiles}: ${name}`)
    }

    cached(curPath: string, name: string) {
        const parts = [...curPath.split("/"), name]
        let fileEntry = this.startingDb
        while (parts.length > 0) {
            const part = parts.shift()
            if (!part) return undefined
            if (!fileEntry.files) return undefined
            fileEntry = fileEntry.files.find((f: any) => f.name === part)
            if (!fileEntry) return undefined
            if (fileEntry.type === "comic" || fileEntry.type === "book") return fileEntry
        }
        return undefined
    }

    thumbPathForComic(curPath: string, file: string) {
        return path.join(curPath, file)
    }

    collect3Covers(curPath: string, directory: Directory): string[] {
        let thumbnails: string[] = []
        let subdirectories: Directory[] = []
        // Breadth first search
        for (let file of directory.files) {
            if (file.type === "directory") {
                subdirectories.push(file)
            } else if (file.type === "comic") {
                thumbnails.push(this.thumbPathForComic(curPath, file.name))
            }
        }
        if (thumbnails.length < 3 && subdirectories.length > 0) {
            for (let subdirectory of subdirectories) {
                thumbnails = thumbnails.concat(this.collect3Covers(path.join(curPath, subdirectory.name), subdirectory))
                if (thumbnails.length >= 3) break
            }
        }
        return thumbnails.slice(0, 3)
    }

    async recursivelyFetchFiles(curPath: string): Promise<Directory | null> {
        const absPath = path.join(MAIN_PATH, curPath)

        this.logger("Enter " + absPath)
        let files = await fs.readdir(absPath)
        let directory: Directory = { name: curPath.split("/").pop()!, type: "directory", files: [], thumbnails: [] }

        const thumbsPath = path.join(META_PATH, curPath)
        if (!fsDirect.existsSync(thumbsPath)) {
            await fs.mkdir(thumbsPath, { recursive: true })
        }
        for (let file of files) {
            if (IGNORED.includes(file)) continue
            const filePath = path.join(curPath, file)
            const absFilePath = path.join(MAIN_PATH, filePath)
            let stat = await fs.stat(absFilePath)
            if (stat.isDirectory() && !file.startsWith("__") && !file.startsWith(".") && !IGNORED.includes(file)) {

                const subdirectory = await this.recursivelyFetchFiles(filePath)
                if (subdirectory) {
                    directory.files.push(subdirectory)
                }

            } else if (file.toLowerCase().endsWith(".epub")) {
                let valid = true
                try {

                    const fileContents = await fs.readFile(absFilePath)
                    const buffer = Uint8Array.from(fileContents)

                    const archive = await Archive.init(buffer)
                    const names = archive.getFilenames("")
                    const coverPath = names.find(n => n.includes("cover"))
                    if (!coverPath) {
                        valid = false
                        console.error("NO COVER FOR", file)
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
                }
                this.fileProcessed(file)
                directory.files.push({ type: "book", name: file, valid })
            } else if (file.toLowerCase().endsWith(".cbz") || file.toLocaleLowerCase().endsWith(".cbr")) {
                let cached = this.cached(curPath, file)
                if (cached) {
                    this.logger("Already Processed", file)
                    this.fileProcessed(file)
                    directory.files.push(cached)
                    continue
                }
                let valid = true
                let numPages = 0
                try {
                    const comicMetaPath = path.join(thumbsPath, file)
                    const coverPath = path.join(comicMetaPath, "fullsize.jpg")
                    const fileContents = await fs.readFile(absFilePath)
                    const buffer = Uint8Array.from(fileContents)
                    const archive = await Archive.init(buffer)
                    const names = archive.getFilenames("jpg")
                    numPages = names.length
                    const firstPage = archive.extract(names[0])
                    // Write out the full size image and a thumbnail
                    if (!fsDirect.existsSync(comicMetaPath)) {
                        await fs.mkdir(comicMetaPath)
                    }
                    await fs.writeFile(coverPath, firstPage)
                    await sharp(firstPage).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))

                } catch (e: any) {
                    valid = false
                    console.error("Error unzipping", e, file)
                }
                this.fileProcessed(file)
                directory.files.push({ type: "comic", name: file, valid, numPages })
            }
        }

        // Grab the thumbnails afterward so we have all the subdirectorys processed and files array filled in
        directory.thumbnails = this.collect3Covers(path.join(curPath), directory)
        return directory
    }
}

export type Logger = (msg: any, optionalParams?: any) => void


export async function writeIndex(logger?: Logger) {
    let startingDB = {}
    if (fsDirect.existsSync(DB_PATH)) {
        startingDB = JSON.parse((await fs.readFile(DB_PATH)).toString())
    }
    const indexer = new Indexer(MAIN_PATH, startingDB)
    if (logger) indexer.setLogger(logger)
    await indexer.init()
    let contents = await indexer.buildIndex()
    await fs.writeFile(path.join(META_PATH, "db.json"), JSON.stringify(contents, null, 2))
    return contents
}