/**
 * To handle API requests, you need to set up a route handler on your server.
 * Create a new file or route in your framework's designated catch-all route handler.
 * This route should handle requests for the path /api/auth/* (unless you've configured a different base path).
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth"; // path to your auth file

export const { POST, GET } = toNextJsHandler(auth);
