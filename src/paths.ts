import path from "path";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.ROOT) {
    throw new Error("Add ROOT to your .env file indicating where your library is")
}

export const MAIN_PATH = process.env.ROOT!;
export const META_PATH = path.join(MAIN_PATH, "__META__");
