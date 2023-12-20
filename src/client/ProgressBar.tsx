import styles from './ProgressBar.module.css'
import { ReadState } from './models/UserData'

export default function ProgressBar({ readState }: { readState: ReadState | undefined }) {
    if (!readState) return null
    const progress = readState.currentPage / readState.totalPages
    const width = `${progress * 100}%`
    return <div className={styles.ProgressBar}><div className={styles.Progress} style={{ width }}></div></div>
}
