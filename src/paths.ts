import path from "path";
import dotenv from "dotenv";
dotenv.config();

export const MAIN_PATH = process.env.ROOT!;
export const META_PATH = path.join(MAIN_PATH, "__META__");
