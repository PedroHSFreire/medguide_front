import auth from "next-auth";
import { authOptions } from "./auth";

export const getServerSession = () => auth(authOptions);
