import { Comic } from '../types'
import styles from './Home.module.css'
import { useUserData } from './models/UserData'
import ProgressBar from './ProgressBar'

export default function ComicCard({ path, file, nav }: { path: string[], file: Comic, nav: (comic: Comic) => void }) {
    const readState = useUserData().stateForPath(`${[...path, file.name].join("/")}`)
    return <div key={file.name}
        className={styles.Card}
        onClick={e => nav(file)}>
        <img alt="" width="200" src={`/api/thumb?dir=${encodeURIComponent([...path].join("/"))}&file=${encodeURIComponent(file.name)}`} />
        <ProgressBar readState={readState} />
    </div>
}