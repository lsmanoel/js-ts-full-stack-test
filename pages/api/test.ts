import { NextApiResponse } from "next";

export default async function handler(res: NextApiResponse) {
  res.status(200).json({ test: "ok" });
}
