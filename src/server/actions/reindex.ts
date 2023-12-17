import { existsSync, rmSync } from "fs"
import { writeIndex } from "../util/reindex"
import { DB_PATH, META_PATH } from "../../paths"

async function main() {
    const clean = process.argv.includes("--clean")
    if (clean && existsSync(DB_PATH)) {
        rmSync(DB_PATH)
    }
    await writeIndex()
}

main()