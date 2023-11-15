import fs from 'fs'
import { META_PATH } from '../../paths'
import path from 'path'
import reindex from '../routes/reindex';
import { writeIndex } from './reindex';
import { Book, Comic, Directory, File } from '../../types';

async function loadDb() {
    let db: Directory
    const dbPath = path.join(META_PATH, "db.json")
    if (fs.existsSync(dbPath)) {
        db = JSON.parse(fs.readFileSync(META_PATH).toString())
        console.log("READ DB", db)
    } else {
        db = await writeIndex()
        console.log("CREATED DB", db)
    }

    return {
        deleteFile(filePath: string) {
            const pathParts = filePath.split("/")
            let next: string | undefined
            // find the object in db that matches the path
            let file: File = db
            for (const p of pathParts) {
                if (!file || !file.files) {
                    return
                }

                file = file.files.find((f) => f.name === p) as Directory
                if (file.type !== 'directory') {
                    break
                }
            }
        },

        updateFile(path: string, file: Comic | Book | Directory) {

        },

        db() {
            return db
        }
    }

}

export default loadDb