import { Directory } from "../types";
import styles from './Home.module.css'
export default function DirectoryCard({ directory, nav }: { nav: (file: Directory) => void, directory: Directory }) {
    return <div key={directory.name} className={styles.DirectoryItem} onClick={e => nav(directory)}>
        <div className={styles.DirectoryImageStack}>
            {directory.thumbnails.map((thumb, i) => <img key={i} alt="" style={{ zIndex: 3 - i, left: 20 * i, transform: `scale(${1 - 0.1 * i})` }} src={`/api/thumb?dir=&file=${encodeURIComponent(thumb)}`} />)}
        </div>
        {directory.name}
    </div>
}