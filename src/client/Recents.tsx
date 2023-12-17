import { ReadState, useUserData } from "./UserData"
import styles from "./Recents.module.css"
import ProgressBar from "./ProgressBar"

function parseNumberOrUndefined(inputStr: string) {
    // Try to parse the string as a float
    var parsedNumber = parseInt(inputStr);

    // Check if the parsed number is a valid finite number
    if (!isNaN(parsedNumber) && isFinite(parsedNumber)) {
        return parsedNumber;
    } else {
        return undefined;
    }
}

export default function Recents() {
    const userData = useUserData()
    const mostRecent = Object.keys(userData.books)
        .map(key => [key, userData.books[key]] as [string, ReadState])
        .sort((a, b) => b[1].lastReadTime - a[1].lastReadTime)
    return <div className={styles.Recents}>
        <h1>Recents</h1>
        <div className={styles.RecentsRow}>

            {mostRecent.map((entry) => {
                const [book, readState] = entry
                const path = book.split("/")
                const bookName = book.split("/").pop()?.split(".")[0]!
                const issue = parseNumberOrUndefined(bookName.split(" ").pop()!)
                return <div key={book} className={styles.RecentsEntry}>
                    <div className={styles.CoverStack}>
                        <img alt="" src={`/api/thumb?dir=${encodeURIComponent([...path].join("/"))}&file=`} />
                        <ProgressBar readState={readState} />
                    </div>
                    <div className={styles.RecentsTitle}>
                        {issue ? `#${issue}: ` : null}
                        {bookName}
                    </div>
                </div>
            })}</div>
        <hr />
    </div>
}