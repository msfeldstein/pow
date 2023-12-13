import styles from './Home.module.css'
import { Book, Comic, Directory } from '../types'
import { useEffect, useState } from 'react'
import epub from 'epubjs'
import { ReactReader } from 'react-reader'

export default function BookView() {
    const file = new URL(document.location.href).searchParams.get('file')
    if (!file) return <div>No File</div>

    // And your own state logic to persist state
    const [location, setLocation] = useState(undefined)
    const locationChanged = (epubcifi: any) => {
        // epubcifi is a internal string used by epubjs to point to a location in an epub. It looks like this: epubcfi(/6/6[titlepage]!/4/2/12[pgepubid00003]/3:0)
        setLocation(epubcifi)
    }

    const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle")
    const kindleLabel = {
        "idle": "Send to kindle",
        "sending": "Sending to kindle",
        "sent": "Sent to kindle",
        "error": "Error sending to kindle"
    }[sendState]

    return (
        <div style={{ height: '100vh' }}>
            <div className={styles.topbar}>
                <div style={{ color: "blue" }} ><a download={file} href={`/api/staticRequest?file=${file}`}>Download</a></div>
            </div>
            <ReactReader
                location={location}
                locationChanged={locationChanged}
                url={`/api/staticRequest?file=${file}`}
            />
        </div>
    )
}