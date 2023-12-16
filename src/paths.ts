import path from "path";
import dotenv from "dotenv";
dotenv.config();

// if (!process.env.ROOT) {
//     throw new Error("Add ROOT to your .env file indicating where your library is")
// }

export const MAIN_PATH = process.env.ROOT || "/pow-data";
export const META_PATH = process.env.META || "/pow-meta";

export const DB_PATH = path.join(META_PATH, "db.json")